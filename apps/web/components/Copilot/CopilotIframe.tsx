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
}

const CopilotIframe = forwardRef<HTMLIFrameElement, CopilotIframeProps>(
  ({ userId, development = 'bodasdehoy', eventId, eventName, className, userData, event }, ref) => {
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

    // Obtener contexto de la página actual con datos reales
    const currentPath = router.pathname;

    const getCopilotBaseUrl = useCallback(() => {
      // En SSR o si no hay window, mantener el comportamiento anterior.
      if (typeof window === 'undefined') return '/copilot-chat';

      // En local, es más estable cargar LobeChat directo en 3210 (evita problemas de assets bajo subpath).
      const hostname = window.location.hostname;
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
      // Nota: en algunos entornos "localhost" puede resolver a IPv6 y fallar; 127.0.0.1 es más fiable.
      if (isLocal) return 'http://127.0.0.1:3210';

      // En dominio, cargar el chat real (configurable)
      const envUrl = process.env.NEXT_PUBLIC_CHAT;
      // Default actual mientras exista solo entorno de pruebas
      const fallback = 'https://chat-test.bodasdehoy.com';
      const base = (envUrl || fallback).replace(/\/$/, '');
      return base;
    }, []);

    // Construir URL del LobeChat con parametros
    const buildCopilotUrl = useCallback(() => {
      const params = new URLSearchParams();

      // Modo embebido: oculta navegación lateral del copilot y deja solo conversación + input.
      params.set('embed', '1');
      // Redundancia para compatibilidad (algunas rutas/layouts leen estos flags)
      params.set('embedded', '1');
      params.set('minimal', '1');

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
          const u = new URL(baseUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
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

    const [iframeSrc, setIframeSrc] = useState(buildCopilotUrl());

    // Actualizar URL cuando cambien los parametros
    useEffect(() => {
      setIframeSrc(buildCopilotUrl());
    }, [buildCopilotUrl]);

    // ✅ CORRECCIÓN: NO resetear isLoaded a false - mantenerlo en true para mostrar el iframe inmediatamente
    useEffect(() => {
      // NO resetear isLoaded - mantenerlo en true para que el iframe se muestre
      // setIsLoaded(false); // ❌ COMENTADO: Esto causaba que el iframe no se mostrara
      setError(null);
      setAuthSent(false);
      setBackendCheck('idle');
      setBackendError(null);
      setCopyStatus(null);

      const timeoutMs = 15000;
      const timer = window.setTimeout(() => {
        // Si aún no cargó, probablemente el servidor no está levantado o está compilando
        setError(
          'El Copilot está tardando demasiado en cargar. ' +
            'Verifica que el servicio del chat esté levantado (local: http://127.0.0.1:3210) y recarga.'
        );
        setIsLoaded(true);
      }, timeoutMs);

      return () => window.clearTimeout(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [iframeSrc]);

    // Manejar carga del iframe
    const handleLoad = useCallback(() => {
      console.log('[CopilotIframe] ✅ Iframe cargado:', iframeSrc);
      setIsLoaded(true);
      setError(null);
      // ✅ CORRECCIÓN: Forzar que el iframe sea visible inmediatamente
      console.log('[CopilotIframe] ✅ Marcando iframe como cargado y visible');
    }, [iframeSrc]);

    // Manejar error del iframe
    const handleError = useCallback((e: React.SyntheticEvent) => {
      console.error('[CopilotIframe] Error loading:', iframeSrc, e);
      setError(`No se pudo cargar: ${iframeSrc}. Error 502 - Verifica que el servidor este corriendo.`);
      setIsLoaded(true);
    }, [iframeSrc]);

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
        payload: pageContextData,
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

      // Si el iframe es cross-origin (ej: http://localhost:3210 o https://chat.bodasdehoy.com),
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

    // Enviar PAGE_CONTEXT cuando cambie la pantalla o el evento
    useEffect(() => {
      if (isLoaded && authSent) {
        // Verificar si cambió el path o el evento
        const pathChanged = lastSentPath.current !== currentPath;
        const eventChanged = lastSentEventId.current !== (event?._id || null);

        if (pathChanged || eventChanged) {
          console.log('[CopilotIframe] Detectado cambio:', {
            pathChanged,
            eventChanged,
            currentPath,
            eventId: event?._id,
          });
          sendPageContext();
        }
      }
    }, [isLoaded, authSent, currentPath, event, sendPageContext]);

    return (
      <div className={`relative h-full w-full flex flex-col bg-white overflow-hidden ${className || ''}`}>
        {/* Loading / Error state - Solo mostrar si hay error real, no bloquear si está cargando */}
        {!isLoaded && error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500" />
              <p className="text-sm text-gray-500">Cargando Copilot...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="flex flex-col items-center gap-4 p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={() => {
                  setIsLoaded(false);
                  setError(null);
                  setIframeSrc(buildCopilotUrl());
                }}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                Reintentar
              </button>
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
            zIndex: 1,
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
