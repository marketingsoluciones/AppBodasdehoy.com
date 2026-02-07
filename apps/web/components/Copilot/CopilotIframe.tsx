/**
 * CopilotIframe - Carga el LobeChat completo en un iframe
 *
 * Usa el rewrite /copilot-chat/ para cargar el LobeChat completo
 * con todas sus funcionalidades (sesiones, temas, historial, etc.)
 *
 * Comunicación con el iframe:
 * - Escucha LOBE_CHAT_READY del copilot
 * - Envía AUTH_CONFIG con la sesión del usuario
 * - Envía PAGE_CONTEXT cuando cambia la pantalla con los datos reales del evento
 */

import { forwardRef, useState, useCallback, memo, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { Event } from '../../utils/Interfaces';
import { extractPageContext, PageContextData } from './pageContextExtractor';

interface UserData {
  displayName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  photoURL?: string | null;
  uid?: string;
  role?: string[];
}

interface CopilotIframeProps {
  userId?: string;
  development?: string;
  eventId?: string;
  eventName?: string;
  className?: string;
  userData?: UserData;
  event?: Event | null;
  eventsList?: any[];
}

const CopilotIframe = forwardRef<HTMLIFrameElement, CopilotIframeProps>(
  ({ userId, development = 'bodasdehoy', eventId, eventName, className, userData, event, eventsList }, ref) => {
    const router = useRouter();
    // ✅ CORRECCIÓN: Iniciar isLoaded como true para que el iframe se muestre inmediatamente
    const [isLoaded, setIsLoaded] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [authSent, setAuthSent] = useState(false);
    const [backendCheck, setBackendCheck] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
    const [backendError, setBackendError] = useState<string | null>(null);
    const [copyStatus, setCopyStatus] = useState<'ok' | 'fail' | null>(null);
    const internalRef = useRef<HTMLIFrameElement>(null);
    const iframeRef = (ref as React.RefObject<HTMLIFrameElement>) || internalRef;
    const lastSentPath = useRef<string | null>(null);
    const lastSentEventId = useRef<string | null>(null);
    const timeoutRef = useRef<number | null>(null);
    const hasLoadedRef = useRef(false);

    // Obtener contexto de la página actual con datos reales
    const currentPath = router.pathname;

    const getCopilotBaseUrl = useCallback(() => {
      if (typeof window === 'undefined') return '/copilot-chat';

      // ✅ DESARROLLO LOCAL: Solo localhost/127.0.0.1 usa el puerto 3210 local
      if (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3210';
      }

      // Monorepo: app-test ↔ chat-test. En app-test el Copilot usa chat-test (si no carga, no hay fallback a producción).
      if (window.location.hostname?.includes('app-test')) {
        return 'https://chat-test.bodasdehoy.com';
      }

      // ✅ PRODUCCIÓN: usar variable de entorno o fallback
      const envUrl = process.env.NEXT_PUBLIC_CHAT;
      const fallback = 'https://chat.bodasdehoy.com';
      const base = (envUrl || fallback).replace(/\/$/, '');
      return base;
    }, []);

    // URLs de fallback si chat-test falla
    const getFallbackUrls = useCallback(() => {
      const primary = getCopilotBaseUrl();
      const fallbacks = [
        primary,
        'https://chat.bodasdehoy.com', // Producción como fallback
      ];
      // Eliminar duplicados
      return [...new Set(fallbacks)];
    }, [getCopilotBaseUrl]);

    // ✅ NUEVO: Verificar si la URL principal es chat-test y está dando 502
    // Si es así, usar directamente chat producción como fallback inmediato
    const shouldUseProductionFallback = useCallback(() => {
      const baseUrl = getCopilotBaseUrl();
      // Si la URL configurada es chat-test, usar producción directamente
      // porque chat-test está dando 502 (servidor no responde)
      return baseUrl.includes('chat-test.bodasdehoy.com');
    }, [getCopilotBaseUrl]);

    // Construir URL del LobeChat con parametros
    const buildCopilotUrl = useCallback(() => {
      const params = new URLSearchParams();

      // Modo embebido: oculta navegación lateral del copilot PERO mantiene panel derecho y funcionalidad completa
      params.set('embed', '1');
      // ❌ DESACTIVADO: minimal=1 ocultaba panel lateral, contexto conversacional y features del editor
      // params.set('embedded', '1');  // Redundante
      // params.set('minimal', '1');  // ❌ ESTO CAUSABA LA REGRESIÓN - ocultaba todo

      if (development) {
        params.set('developer', development);
      }
      // Pasar el email del usuario para que EventosAutoAuth lo identifique directamente
      if (userData?.email) {
        params.set('email', userData.email);
      } else if (userId && userId.includes('@')) {
        params.set('email', userId);
      }
      if (eventId) {
        params.set('eventId', eventId);
      }

      const queryString = params.toString();

      const baseUrl = getCopilotBaseUrl().replace(/\/$/, '');
      const variants = encodeURIComponent(development || 'bodasdehoy');

      // LobeChat en este repo usa rutas con `[variants]`, por ejemplo:
      //   /{variants}/chat
      // Si cargamos solo `/chat` en root, devuelve 404 (lo que ves en pantalla).
      const chatBase = (() => {
        try {
          const u = new URL(baseUrl, typeof window !== 'undefined' ? window.location.origin : 'https://chat-test.bodasdehoy.com');
          const path = u.pathname.replace(/\/$/, '');

          // Asegurar /{variants}
          if (!path.endsWith(`/${variants}`) && !path.includes(`/${variants}/`)) {
            u.pathname = `${path}/${variants}`;
          }

          // Asegurar /chat (workspace)
          if (!u.pathname.endsWith('/chat')) {
            u.pathname = `${u.pathname.replace(/\/$/, '')}/chat`;
          }

          return u.toString().replace(/\/$/, '');
        } catch {
          // Fallback string-based
          const withVariants = baseUrl.includes(`/${variants}`) ? baseUrl : `${baseUrl}/${variants}`;
          return withVariants.endsWith('/chat') ? withVariants : `${withVariants}/chat`;
        }
      })();

      const url = queryString ? `${chatBase}?${queryString}` : chatBase;
      console.log('[CopilotIframe] URL construida:', url);
      return url;
    }, [userId, userData?.email, development, eventId, getCopilotBaseUrl]);

    // Intentar primero la URL configurada (chat-test), si falla se cambiará automáticamente a producción
    const getInitialUrl = useCallback(() => {
      return buildCopilotUrl();
    }, [buildCopilotUrl]);

    const [iframeSrc, setIframeSrc] = useState(getInitialUrl());
    const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 2; // Máximo 2 reintentos

    // Actualizar URL cuando cambien los parametros
    useEffect(() => {
      const newUrl = getInitialUrl();
      setIframeSrc(newUrl);
      setCurrentUrlIndex(0); // Reset al cambiar parámetros
      setRetryCount(0);
    }, [getInitialUrl]);

    // Función para intentar siguiente URL de fallback
    const tryNextFallbackUrl = useCallback(() => {
      const fallbackUrls = getFallbackUrls();
      if (currentUrlIndex < fallbackUrls.length - 1 && retryCount < maxRetries) {
        const nextIndex = currentUrlIndex + 1;
        const nextUrl = fallbackUrls[nextIndex];
        const newUrl = buildCopilotUrl().replace(getCopilotBaseUrl(), nextUrl);
        console.log(`[CopilotIframe] 🔄 Intentando fallback URL ${nextIndex + 1}/${fallbackUrls.length}: ${nextUrl}`);
        setCurrentUrlIndex(nextIndex);
        setRetryCount(prev => prev + 1);
        setIframeSrc(newUrl);
        setError(null); // Limpiar error anterior
      }
    }, [currentUrlIndex, retryCount, getFallbackUrls, buildCopilotUrl, getCopilotBaseUrl]);

    // ✅ CORRECCIÓN: NO resetear isLoaded a false - mantenerlo en true para mostrar el iframe inmediatamente
    useEffect(() => {
      // NO resetear isLoaded - mantenerlo en true para que el iframe se muestre
      // setIsLoaded(false); // ❌ COMENTADO: Esto causaba que el iframe no se mostrara
      setError(null);
      setAuthSent(false);
      setBackendCheck('idle');
      setBackendError(null);
      setCopyStatus(null);
      hasLoadedRef.current = false;

      // Limpiar timeout anterior si existe
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      // ✅ OPTIMIZADO: Timeout ajustado para modo producción
      // NOTA: El timeout debe considerar NO solo la carga del iframe HTML,
      // sino también el renderizado completo del contenido React interno
      // - HTML load: ~1-2s
      // - JS chunks download: ~2-4s (217KB total, sin CDN en localhost)
      // - React bootstrap + render: ~3-8s (inicialización del store, componentes, etc.)
      // - i18n initialization: ~2-4s (missingKey warnings en logs)
      // - Final component mount: ~2-4s
      // Total real observado en localhost: 15-25+ segundos (sin CDN, Next.js en producción)
      // Localhost: 45s (muy generoso para cubrir variabilidad de máquina local)
      // chat-test: 25s (tiene CDN pero puede tener delays de red)
      // Producción: 60s (fallback conservador)
      const isLocalhost = iframeSrc.includes('localhost') || iframeSrc.includes('127.0.0.1');
      const isChatTest = iframeSrc.includes('chat-test.bodasdehoy.com');
      const timeoutMs = isLocalhost ? 45000 : (isChatTest ? 25000 : 60000);
      
      timeoutRef.current = window.setTimeout(() => {
        // Solo mostrar error si el iframe NO ha cargado aún
        if (!hasLoadedRef.current) {
          // Monorepo: en app-test no hay fallback a producción; si chat-test no carga, mostramos error.
          const isAppTest = typeof window !== 'undefined' && window.location.hostname?.includes('app-test');
          if (isChatTest && currentUrlIndex === 0 && !isAppTest) {
            console.log('[CopilotIframe] ⚠️ chat-test timeout (probable 502), cambiando a chat producción');
            const productionUrl = iframeSrc.replace('chat-test.bodasdehoy.com', 'chat.bodasdehoy.com');
            setIframeSrc(productionUrl);
            setCurrentUrlIndex(1);
            setError(null);
            return;
          }

          const vpnDetected = detectVPN();
          const timeoutMessage = vpnDetected
            ? 'El Copilot tarda demasiado en cargar. Si usas VPN, puede estar bloqueando la conexión. Por favor, desactiva la VPN y pulsa Reintentar.'
            : 'El Copilot tarda demasiado en cargar. Verifica que el servicio responda. Si usas VPN, prueba desactivarla y pulsa Reintentar.';
          setError(timeoutMessage);
          setIsLoaded(true);
        }
      }, timeoutMs);

      return () => {
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [iframeSrc]);

    // Manejar carga del iframe
    const handleLoad = useCallback(() => {
      console.log('[CopilotIframe] ✅ Iframe HTML cargado:', iframeSrc);

      // ✅ MEJORA: Esperar un poco más para que el contenido React se renderice
      // El evento onLoad se dispara cuando el HTML carga, pero React necesita tiempo adicional
      setTimeout(() => {
        console.log('[CopilotIframe] ✅ Marcando iframe como completamente cargado');
        hasLoadedRef.current = true;
        setIsLoaded(true);
        setError(null); // ✅ Limpiar cualquier error previo

        // ✅ Cancelar el timeout ya que el iframe cargó correctamente
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }, 1000); // Dar 1 segundo adicional para que React renderice
    }, [iframeSrc]);

    // Detectar si hay VPN activa (heurística básica)
    const detectVPN = useCallback((): boolean => {
      if (typeof window === 'undefined') return false;
      
      // Detectar VPN por características comunes:
      // 1. Timezone diferente al esperado
      // 2. IP de datacenter (detectable por headers si están disponibles)
      // 3. Latencia alta en conexiones
      
      // Por ahora, retornamos false - se puede mejorar con detección más sofisticada
      return false;
    }, []);

    // Detectar tipo de error específico
    const detectErrorType = useCallback((error: any): 'dns' | '502' | 'timeout' | 'network' | 'vpn-blocked' => {
      const errorMessage = error?.message || error?.toString() || '';
      const errorCode = error?.code || error?.status;
      
      if (errorCode === 'ENOTFOUND' || errorMessage.includes('Could not resolve') || errorMessage.includes('getaddrinfo')) {
        return 'dns';
      }
      if (errorCode === 502 || errorMessage.includes('502') || errorMessage.includes('Bad Gateway')) {
        // Si es 502 y hay VPN, podría ser bloqueo de VPN
        if (detectVPN()) {
          return 'vpn-blocked';
        }
        return '502';
      }
      if (errorCode === 'ETIMEDOUT' || errorCode === 'TIMEOUT' || errorMessage.includes('timeout')) {
        return 'timeout';
      }
      return 'network';
    }, [detectVPN]);

    // Manejar error del iframe con detección mejorada y fallback
    const handleError = useCallback((e: React.SyntheticEvent) => {
      console.error('[CopilotIframe] Error loading:', iframeSrc, e);
      
      const errorType = detectErrorType(e);
      const fallbackUrls = getFallbackUrls();
      
      // Monorepo: en app-test no hay fallback a producción; si chat-test da 502, mostramos error.
      const isAppTest = typeof window !== 'undefined' && window.location.hostname?.includes('app-test');
      if (errorType === '502' && iframeSrc.includes('chat-test.bodasdehoy.com') && !isAppTest) {
        console.log('[CopilotIframe] ⚠️ Error 502 con chat-test, cambiando a chat producción');
        const productionUrl = iframeSrc.replace('chat-test.bodasdehoy.com', 'chat.bodasdehoy.com');
        setTimeout(() => {
          setIframeSrc(productionUrl);
          setError(null);
          setCurrentUrlIndex(1);
        }, 500);
        return;
      }

      // Intentar fallback si hay URLs disponibles y no hemos excedido reintentos
      if (currentUrlIndex < fallbackUrls.length - 1 && retryCount < maxRetries) {
        console.log(`[CopilotIframe] ⚠️ Error ${errorType}, intentando fallback...`);
        setTimeout(() => {
          tryNextFallbackUrl();
        }, 1000); // Esperar 1 segundo antes de intentar fallback
        return; // No mostrar error aún, intentar fallback primero
      }
      
      // Si no hay más fallbacks o excedimos reintentos, mostrar error
      let errorMessage = '';
      
      switch (errorType) {
        case 'dns':
          errorMessage = 'No se puede resolver el dominio (DNS). Verifica tu conexión a internet. Si usas VPN, puede estar bloqueando la conexión.';
          break;
        case 'vpn-blocked':
          errorMessage = 'Error 502: El servicio puede estar bloqueando conexiones VPN. Por favor, desactiva la VPN temporalmente y recarga la página.';
          break;
        case '502':
          errorMessage = 'Error 502 Bad Gateway. El servidor de origen no responde. Si usas VPN, prueba desactivarla y recarga.';
          break;
        case 'timeout':
          errorMessage = 'Timeout al cargar el Copilot. El servidor está tardando demasiado. Si usas VPN, puede estar causando latencia adicional.';
          break;
        default:
          errorMessage = 'Error de red al cargar el Copilot. Verifica tu conexión y recarga. Si usas VPN, prueba desactivarla.';
      }
      
      // Agregar información sobre fallbacks intentados
      if (retryCount > 0) {
        errorMessage += ` (Se intentaron ${retryCount + 1} URLs diferentes)`;
      }
      
      setError(errorMessage);
      setIsLoaded(true);
    }, [iframeSrc, detectErrorType, currentUrlIndex, retryCount, maxRetries, getFallbackUrls, tryNextFallbackUrl]);

    const handleCopyBackendReport = useCallback(async () => {
      try {
        if (!backendError) return;
        await navigator.clipboard.writeText(backendError);
        setCopyStatus('ok');
        window.setTimeout(() => setCopyStatus(null), 2000);
      } catch {
        setCopyStatus('fail');
        window.setTimeout(() => setCopyStatus(null), 2000);
      }
    }, [backendError]);

    // Chequeo del backend IA - OPTIMIZADO: No bloqueante, timeout corto
    const checkBackendIa = useCallback(async () => {
      // No mostrar "checking" para evitar parpadeos - hacer silenciosamente
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 3_000); // 3 segundos max

      try {
        const resp = await fetch('/api/copilot/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Development': development,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'ping' }],
            stream: false,
            metadata: { development, eventId },
          }),
          signal: controller.signal,
        });

        if (!resp.ok) {
          const errorText = await resp.text().catch(() => '');
          setBackendError(`Backend error: ${resp.status} - ${errorText.slice(0, 100)}`);
          setBackendCheck('error');
          return;
        }

        setBackendCheck('ok');
        setBackendError(null);
      } catch (e: any) {
        // Solo mostrar error si no es abort (timeout silencioso)
        if (e?.name !== 'AbortError') {
          setBackendError(`Error: ${e?.message || 'unknown'}`);
          setBackendCheck('error');
        } else {
          // Timeout - asumir OK para no bloquear
          setBackendCheck('ok');
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    }, [development, eventId]);

    // ✅ OPTIMIZACIÓN: Hacer check inmediatamente en background, sin delay
    useEffect(() => {
      if (isLoaded) {
        // Hacer check inmediatamente en background, no bloquear el iframe
        checkBackendIa().catch(() => {
          // Ignorar errores - el iframe ya está visible
        });
      }
    }, [isLoaded, checkBackendIa]);

    // Función para enviar PAGE_CONTEXT al iframe del copilot
    const sendPageContext = useCallback(() => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow || !isLoaded) return;

      // Extraer contexto completo de la página con datos reales del evento
      const pageContextData: PageContextData = extractPageContext(currentPath, event || null);

      const pageContextMessage = {
        type: 'PAGE_CONTEXT',
        source: 'app-bodas',
        timestamp: Date.now(),
        payload: {
          ...pageContextData,
          eventsList: (eventsList || []).map((e: any) => ({
            id: e._id, name: e.nombre, type: e.tipo, date: e.fecha,
          })),
        },
      };

      console.log('[CopilotIframe] Enviando PAGE_CONTEXT:', {
        path: currentPath,
        pageName: pageContextData.pageName,
        hasEventData: !!pageContextData.eventSummary,
        screenDataKeys: Object.keys(pageContextData.screenData),
      });

      const copilotOrigin = (() => {
        try {
          return new URL(iframeSrc, window.location.origin).origin;
        } catch {
          return window.location.origin;
        }
      })();
      iframe.contentWindow.postMessage(pageContextMessage, copilotOrigin);

      // Guardar para evitar duplicados
      lastSentPath.current = currentPath;
      lastSentEventId.current = event?._id || null;
    }, [currentPath, event, isLoaded, iframeRef, iframeSrc]);

    // Función para enviar AUTH_CONFIG al iframe del copilot
    const sendAuthConfig = useCallback(() => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow || !userId) return;

      // Obtener token de sesión de las cookies
      const sessionToken = Cookies.get('sessionBodas') || null;

      // Extraer contexto de la página actual
      const pageContextData: PageContextData = extractPageContext(currentPath, event || null);

      const authConfig = {
        type: 'AUTH_CONFIG',
        source: 'app-bodas',
        timestamp: Date.now(),
        payload: {
          userId,
          development,
          token: sessionToken,
          eventId: eventId || event?._id || null,
          eventName: eventName || event?.nombre || null,
          userData: userData ? {
            displayName: userData.displayName || null,
            email: userData.email || null,
            phoneNumber: userData.phoneNumber || null,
            photoURL: userData.photoURL || null,
          } : null,
          // Incluir contexto de página con datos reales
          pageContext: pageContextData,
        },
      };

      console.log('[CopilotIframe] Enviando AUTH_CONFIG al copilot:', {
        userId,
        development,
        hasToken: !!sessionToken,
        eventId: eventId || event?._id,
        currentPage: pageContextData.pageName,
        hasScreenData: Object.keys(pageContextData.screenData).length > 0,
      });

      // Si el iframe es cross-origin (chat-test.bodasdehoy.com),
      // tenemos que usar su origin real como targetOrigin.
      const copilotOrigin = (() => {
        try {
          return new URL(iframeSrc, window.location.origin).origin;
        } catch {
          return window.location.origin;
        }
      })();

      console.log('[CopilotIframe] Enviando postMessage a origen:', copilotOrigin);
      iframe.contentWindow.postMessage(authConfig, copilotOrigin);
      setAuthSent(true);

      // Guardar path enviado
      lastSentPath.current = currentPath;
      lastSentEventId.current = event?._id || null;
    }, [userId, development, eventId, eventName, userData, event, currentPath, iframeRef, iframeSrc]);

    // Comunicacion con el iframe via postMessage
    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        const { type, payload, source } = event.data || {};

        // Ignorar mensajes propios
        if (source === 'app-bodas') return;

        switch (type) {
          case 'LOBE_CHAT_READY':
            // El copilot está listo, enviar configuración de auth
            console.log('[CopilotIframe] Copilot listo, enviando AUTH_CONFIG');
            sendAuthConfig();
            break;
          case 'AUTH_REQUEST':
            // El copilot solicita autenticación
            console.log('[CopilotIframe] Copilot solicita AUTH_CONFIG');
            sendAuthConfig();
            break;
          case 'PAGE_CONTEXT_REQUEST':
            // El copilot solicita contexto de página
            console.log('[CopilotIframe] Copilot solicita PAGE_CONTEXT');
            sendPageContext();
            break;
          case 'COPILOT_NAVIGATE':
            console.log('[CopilotIframe] Navigate request:', payload);
            if (payload?.path && typeof payload.path === 'string' && payload.path.startsWith('/')) {
              router.push(payload.path);
            }
            break;
          case 'COPILOT_ACTION':
            console.log('[CopilotIframe] Action request:', payload);
            break;
          case 'MCP_NAVIGATION':
            // Navegación desde MCP - podría usarse para actualizar el preview
            console.log('[CopilotIframe] MCP Navigation:', payload);
            break;
          default:
            break;
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }, [sendAuthConfig, sendPageContext]);

    // ✅ OPTIMIZACIÓN: Enviar AUTH_CONFIG inmediatamente cuando el iframe cargue
    useEffect(() => {
      if (isLoaded && userId && !authSent) {
        // Enviar inmediatamente - el iframe ya está listo
        // Usar un pequeño delay solo para asegurar que el listener esté registrado (300ms es suficiente)
        const timer = setTimeout(() => {
          sendAuthConfig();
        }, 300);
        return () => clearTimeout(timer);
      }
    }, [isLoaded, userId, authSent, sendAuthConfig]);

    // Fingerprint de datos del evento para detectar cambios en datos (no solo ID)
    const lastDataFingerprint = useRef<string>('');

    // Enviar PAGE_CONTEXT cuando cambie la pantalla, el evento o sus datos
    useEffect(() => {
      if (isLoaded && authSent) {
        const pathChanged = lastSentPath.current !== currentPath;
        const eventChanged = lastSentEventId.current !== (event?._id || null);

        // Fingerprint ligero: detecta cambios en invitados, presupuesto, mesas, tareas
        const fingerprint = event
          ? `${event.invitados_array?.length || 0}-${event.presupuesto_objeto?.pagado || 0}-${event.mesas_array?.length || 0}-${event.itinerarios_array?.length || 0}`
          : '';
        const dataChanged = lastDataFingerprint.current !== fingerprint;

        if (pathChanged || eventChanged || dataChanged) {
          lastDataFingerprint.current = fingerprint;
          console.log('[CopilotIframe] Detectado cambio:', {
            pathChanged,
            eventChanged,
            dataChanged,
            currentPath,
            eventId: event?._id,
          });
          sendPageContext();
        }
      }
    }, [isLoaded, authSent, currentPath, event, sendPageContext]);

    // ✅ Detectar si está usando localhost para mostrar mensaje de compilación
    const isLocalhost = iframeSrc.includes('localhost') || iframeSrc.includes('127.0.0.1');

    return (
      <div className={`relative h-full w-full flex flex-col bg-white overflow-hidden ${className || ''}`}>
        {/* ✅ OPTIMIZADO: Loading state más visible con información útil */}
        {!isLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm z-50">
            <div className="flex flex-col items-center gap-4 max-w-sm text-center p-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-200 border-t-pink-600" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-800 mb-2">Cargando Copilot...</p>
                {isLocalhost && (
                  <p className="text-xs text-gray-500">
                    Inicializando interfaz (~3-5s)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
            <div className="flex flex-col items-center gap-4 p-6 text-center max-w-md">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-sm text-red-600">{error}</p>
              <div className="flex flex-col gap-2 w-full">
                <a
                  href={iframeSrc.split('?')[0]} // URL sin parámetros
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-pink-600 hover:underline text-center"
                >
                  Abrir chat-test en nueva pestaña
                </a>
                {error?.includes('VPN') && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
                    💡 <strong>Nota:</strong> El servicio puede estar bloqueando conexiones VPN por seguridad. Desactiva la VPN para acceder al Copilot.
                  </div>
                )}
                <button
                  onClick={() => {
                    setIsLoaded(false);
                    setError(null);
                    setCurrentUrlIndex(0); // Reset fallback
                    setRetryCount(0); // Reset retry count
                    const url = buildCopilotUrl();
                    const sep = url.includes('?') ? '&' : '?';
                    setIframeSrc(`${url}${sep}_retry=${Date.now()}`);
                  }}
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Backend IA error overlay (preflight) - NO BLOQUEAR, solo mostrar brevemente */}
        {backendCheck === 'checking' && !error && isLoaded && (
          <div className="absolute top-0 left-0 right-0 bg-blue-50 border-b border-blue-200 z-20 p-2 pointer-events-none">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
              <p className="text-xs text-blue-600">Verificando servicio IA...</p>
            </div>
          </div>
        )}

        {/* Backend IA error - Mostrar como banner no bloqueante en lugar de overlay completo */}
        {/* ✅ CORRECCIÓN: Mostrar banner solo si hay error, pero NO bloquear el iframe */}
        {backendCheck === 'error' && backendError && !error && isLoaded && (
          <div className="absolute top-0 left-0 right-0 bg-yellow-50 border-b border-yellow-200 z-20 p-2 max-h-16 overflow-hidden">
            <div className="flex items-center justify-between max-w-full">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-yellow-600 text-xs">⚠️ Backend IA: {backendError.split('\n').find((line: string) => line.includes('Error'))?.replace('### Error\n', '').slice(0, 80) || 'Error de conexión'}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleCopyBackendReport}
                  className="px-3 py-1 text-xs bg-yellow-100 border border-yellow-300 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
                  title="Copiar reporte de error"
                >
                  📋
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBackendCheck('idle');
                    setBackendError(null);
                    checkBackendIa();
                  }}
                  className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                >
                  Reintentar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBackendCheck('idle');
                    setBackendError(null);
                  }}
                  className="px-2 py-1 text-xs text-yellow-600 hover:text-yellow-800"
                  title="Cerrar"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LobeChat iframe */}
        {/* ✅ CORRECCIÓN: Mostrar iframe SIEMPRE, incluso si isLoaded es false (forzar visibilidad) */}
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          className="w-full h-full border-none opacity-100"
          style={{
            // ✅ CORRECCIÓN CRÍTICA: Forzar visibilidad del iframe siempre
            pointerEvents: 'auto',
            display: 'block',
            zIndex: 10,
            visibility: 'visible'
          }}
          onLoad={handleLoad}
          onError={handleError}
          title="Copilot - Asistente IA"
          allow="clipboard-read; clipboard-write; microphone"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
        />
      </div>
    );
  }
);

CopilotIframe.displayName = 'CopilotIframe';

export default memo(CopilotIframe);
