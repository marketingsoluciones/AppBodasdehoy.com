/**
 * CopilotIframe — iframe hacia la app de chat (LobeChat) en chat-dev / chat-test / chat.
 *
 * En local puede usar rewrite /copilot-chat/; en despliegue, URL absoluta desde getCopilotBaseUrl().
 *
 * Comunicación con el iframe:
 * - Escucha LOBE_CHAT_READY del copilot
 * - Envía AUTH_CONFIG con la sesión del usuario
 * - Envía PAGE_CONTEXT cuando cambia la pantalla con los datos reales del evento
 *
 * Modo UI: por defecto `fullUi` añade `full_ui=1` para la experiencia LobeChat completa
 * (panel de sesiones, cabecera, etc.). Con `fullUi={false}` se usa embed+minimal (solo hilo + input).
 */

import { useState, useCallback, memo, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { Event } from '../../utils/Interfaces';
import { extractPageContext, PageContextData } from './pageContextExtractor';
import { EventsGroupContextProvider } from '../../context';
import { getDevelopmentConfig } from '@bodasdehoy/shared/types';
import type { AuthConfigPayload } from '@bodasdehoy/shared/communication';
import { getCopilotBaseUrl as getCopilotBaseUrlUtil } from './getCopilotBaseUrl';

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
  /** Usuario no logueado: aplicar restricciones anónimo (por navegador, sin consumo). */
  isAnonymous?: boolean;
  /** Plugin identifiers to auto-enable in the copilot when the iframe loads */
  enablePlugins?: string[];
  /**
   * Si es true (por defecto), el iframe pide `full_ui=1` y chat-ia muestra la UI completa
   * aunque vaya en iframe. Si es false, modo mínimo (embed/minimal): solo conversación + input.
   */
  fullUi?: boolean;
}

const CopilotIframe = ({
  userId,
  development = 'bodasdehoy',
  eventId,
  eventName,
  className,
  userData,
  event,
  isAnonymous,
  enablePlugins,
  fullUi = true,
}: CopilotIframeProps) => {
    const router = useRouter();
    const { setCopilotFilter, refreshEventsGroup } = EventsGroupContextProvider();
    // ✅ CORRECCIÓN: Iniciar isLoaded como true para que el iframe se muestre inmediatamente
    const [isLoaded, setIsLoaded] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [authSent, setAuthSent] = useState(false);
    const [backendCheck, setBackendCheck] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
    const [backendError, setBackendError] = useState<string | null>(null);
    const [copyStatus, setCopyStatus] = useState<'ok' | 'fail' | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const lastSentPath = useRef<string | null>(null);
    const lastSentEventId = useRef<string | null>(null);
    const timeoutRef = useRef<number | null>(null);
    const hasLoadedRef = useRef(false);

    // Skeleton overlay: el usuario puede escribir mientras el iframe carga
    const [iframeReady, setIframeReady] = useState(false);
    const [pendingMessage, setPendingMessage] = useState('');
    const [pendingSent, setPendingSent] = useState(false);

    // Obtener contexto de la página actual con datos reales
    const currentPath = router.pathname;

    // Usar util compartido para detección de URL (unificado con CopilotPrewarmer y ChatSidebar)
    const getCopilotBaseUrl = useCallback(() => getCopilotBaseUrlUtil(), []);

    // Construir URL del LobeChat con parametros
    // IMPORTANTE: NO incluir eventId ni datos volátiles en la URL del iframe.
    // El eventId se comunica via postMessage AUTH_CONFIG para evitar que el iframe
    // recargue cuando el evento carga asíncronamente (lo que borra la conversación).
    const buildCopilotUrl = useCallback(() => {
      const params = new URLSearchParams();

      if (fullUi) {
        // Ver resolveChatEmbedMode en chat-ia: full_ui=1 desactiva el modo embed aunque el documento sea iframe.
        params.set('full_ui', '1');
      } else {
        // Modo embebido: oculta navegación lateral del copilot y deja solo conversación + input.
        params.set('embed', '1');
        params.set('embedded', '1');
        params.set('minimal', '1');
      }

      if (development) {
        params.set('developer', development);
      }
      // Pasar el email del usuario para que EventosAutoAuth lo identifique directamente
      if (userData?.email) {
        params.set('email', userData.email);
      } else if (userId && userId.includes('@')) {
        params.set('email', userId);
      }
      // ⚠️ NO añadir eventId aquí: cambia cuando el evento carga asíncronamente
      // y causaría que el iframe recargue borrando la conversación activa.
      // El eventId se envía via postMessage AUTH_CONFIG una vez el iframe está listo.

      const queryString = params.toString();

      const baseUrl = getCopilotBaseUrl().replace(/\/$/, '');
      const variants = encodeURIComponent(development || 'bodasdehoy');

      // LobeChat en este repo usa rutas con `[variants]`, por ejemplo:
      //   /{variants}/chat
      // Si cargamos solo `/chat` en root, devuelve 404 (lo que ves en pantalla).
      const chatBase = (() => {
        try {
          const u = new URL(baseUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3210');
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
      return url;
    // Solo userId, email y development determinan la URL base del iframe.
    // eventId se excluye para evitar recargas cuando el evento carga asíncronamente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, userData?.email, development, getCopilotBaseUrl, fullUi]);

    const [iframeSrc, setIframeSrc] = useState(buildCopilotUrl());
    const retryCountRef = useRef(0);
    const readyTimeoutRef = useRef<number | null>(null);
    const MAX_RETRIES = 4;

    // Actualizar URL cuando cambien los parametros
    useEffect(() => {
      retryCountRef.current = 0;
      setIframeSrc(buildCopilotUrl());
    }, [buildCopilotUrl]);

    // ✅ CORRECCIÓN: NO resetear isLoaded a false - mantenerlo en true para mostrar el iframe inmediatamente
    useEffect(() => {
      // NO resetear isLoaded - mantenerlo en true para que el iframe se muestre
      // setIsLoaded(false); // ❌ COMENTADO: Esto causaba que el iframe no se mostrara
      setError(null);
      setAuthSent(false);
      setIframeReady(false);
      setPendingSent(false);
      setBackendCheck('idle');
      setBackendError(null);
      setCopyStatus(null);
      hasLoadedRef.current = false;

      // Limpiar timeout anterior si existe
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      // 30 segundos: suficiente en producción (<5s real), razonable en dev con Turbopack
      const timeoutMs = 30_000;
      timeoutRef.current = window.setTimeout(() => {
        // Solo mostrar error si el iframe NO ha cargado aún
        if (!hasLoadedRef.current) {
          setError(
            'El Copilot tarda demasiado en cargar. Verifica que chat-test.bodasdehoy.com responda. Si usas VPN, prueba desactivarla y pulsa Reintentar.'
          );
          setIsLoaded(true);
        }
      }, timeoutMs);

      return () => {
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        if (readyTimeoutRef.current) window.clearTimeout(readyTimeoutRef.current);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [iframeSrc]);

    // Manejar carga del iframe
    const handleLoad = useCallback(() => {
      hasLoadedRef.current = true;
      setIsLoaded(true);
      setError(null);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Auto-retry si el iframe cargó un 404 (Turbopack aún compilando):
      // Backoff exponencial: [5s, 10s, 20s, 30s] — más agresivo al principio
      if (readyTimeoutRef.current) window.clearTimeout(readyTimeoutRef.current);
      if (retryCountRef.current < MAX_RETRIES) {
        const RETRY_DELAYS = [5_000, 10_000, 20_000, 30_000];
        const retryDelay = RETRY_DELAYS[retryCountRef.current] ?? 30_000;
        readyTimeoutRef.current = window.setTimeout(() => {
          retryCountRef.current += 1;
          const base = buildCopilotUrl();
          const sep = base.includes('?') ? '&' : '?';
          setIframeSrc(`${base}${sep}_r=${Date.now()}`);
        }, retryDelay);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [iframeSrc, buildCopilotUrl]);

    // Manejar error del iframe
    const handleError = useCallback((e: React.SyntheticEvent) => {
      console.error('[CopilotIframe] Error loading:', iframeSrc, e);
      setError(
        'No se pudo cargar el Copilot (502 Bad Gateway). Verifica que chat-test.bodasdehoy.com responda. Si usas VPN, prueba desactivarla y recarga.'
      );
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

    // Chequeo del backend IA (proxy /api/copilot/chat → api-ia.bodasdehoy.com). No bloqueante.
    const checkBackendIa = useCallback(async () => {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 5_000); // 5 s para dar margen al backend

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
            metadata: { development, eventId, isAnonymous: isAnonymous ?? false },
          }),
          signal: controller.signal,
        });

        if (!resp.ok) {
          const errorText = await resp.text().catch(() => '');
          let userMessage: string;
          // Usuario anónimo y 401 → mensaje claro: debe iniciar sesión para chatear
          if (resp.status === 401 && (isAnonymous ?? false)) {
            userMessage = 'Inicia sesión para chatear con el asistente.';
          } else {
            try {
              const parsed = JSON.parse(errorText);
              userMessage = parsed?.message || parsed?.error || errorText.slice(0, 150);
            } catch {
              if (resp.status === 503) userMessage = 'Servicio IA no disponible. Intenta en unos minutos.';
              else if (resp.status === 502) userMessage = 'El servidor IA no responde (502). Comprueba que api-ia esté en marcha.';
              else if (resp.status === 429) userMessage = 'Demasiadas peticiones. Espera unos segundos.';
              else userMessage = `Error ${resp.status}: ${errorText.slice(0, 80)}`;
            }
          }
          setBackendError(`Error: ${userMessage}`);
          setBackendCheck('error');
          return;
        }

        setBackendCheck('ok');
        setBackendError(null);
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          const msg = e?.message || 'unknown';
          const friendly = msg.includes('Failed to fetch') || msg.includes('NetworkError')
            ? 'No se pudo conectar con el servidor IA. Comprueba tu conexión o que api-ia.bodasdehoy.com esté disponible.'
            : msg;
          setBackendError(`Error: ${friendly}`);
          setBackendCheck('error');
        } else {
          setBackendCheck('ok');
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    }, [development, eventId, isAnonymous]);

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
        type: 'PAGE_CONTEXT' as const,
        source: 'copilot-parent' as const,
        timestamp: Date.now(),
        payload: pageContextData,
      };

      // Mismo razonamiento que sendAuthConfig: usar '*' para evitar race condition SSR
      iframe.contentWindow.postMessage(pageContextMessage, '*');

      // Guardar para evitar duplicados
      lastSentPath.current = currentPath;
      lastSentEventId.current = event?._id || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPath, event?._id, isLoaded]);

    // Función para enviar AUTH_CONFIG al iframe del copilot
    const sendAuthConfig = useCallback(() => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow || !userId) return;

      // Obtener cookie de sesión correcta para este whitelabel (no hardcodeada)
      const devConfig = getDevelopmentConfig(development);
      const sessionToken = devConfig ? (Cookies.get(devConfig.cookie) || null) : null;

      // Si no hay token específico del whitelabel (cross-domain: usuario vivetuboda en app bodasdehoy),
      // usar el Firebase idToken del usuario logueado actualmente — válido para cualquier whitelabel.
      const idToken = Cookies.get('idTokenV0.1.0') || null;
      const effectiveToken = sessionToken || idToken;

      // Extraer contexto de la página actual
      const pageContextData: PageContextData = extractPageContext(currentPath, event || null);

      const anon = isAnonymous ?? !userData?.email;
      const roleFromUser =
        userData?.role && Array.isArray(userData.role) && userData.role.length > 0
          ? String(userData.role[0])
          : undefined;

      const payload: AuthConfigPayload = {
        userId,
        development,
        token: effectiveToken,
        eventId: eventId || event?._id || undefined,
        eventName: eventName || event?.nombre || undefined,
        isAnonymous: anon,
        userRole: roleFromUser ?? (anon ? 'guest' : undefined),
        userData: {
          displayName: userData?.displayName || null,
          email: userData?.email || null,
          phoneNumber: userData?.phoneNumber || null,
          photoURL: userData?.photoURL || null,
        },
        pageContext: pageContextData,
      };

      const authConfig = {
        type: 'AUTH_CONFIG' as const,
        source: 'copilot-parent' as const,
        timestamp: Date.now(),
        payload: {
          ...payload,
          // Plugins a habilitar automáticamente en el copilot
          ...(enablePlugins && enablePlugins.length > 0 && { enablePlugins }),
        },
      };

      // Usar '*' como targetOrigin para evitar race condition durante carga del iframe:
      // El iframe puede estar temporalmente en app-test.bodasdehoy.com antes de navegar
      // a chat-test.bodasdehoy.com. La sessionToken ya está en cookies, sin riesgo extra.
      iframe.contentWindow.postMessage(authConfig, '*');
      setAuthSent(true);

      // Guardar path enviado
      lastSentPath.current = currentPath;
      lastSentEventId.current = event?._id || null;
    // Usar primitivos como deps en vez de objetos completos (userData, event)
    // para evitar que sendAuthConfig se recree en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, development, eventId, eventName, isAnonymous, userData?.displayName, userData?.email, userData?.phoneNumber, userData?.photoURL, event?._id, event?.nombre, currentPath, enablePlugins]);

    // Comunicacion con el iframe via postMessage
    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        const { type, payload, source } = event.data || {};

        // Ignorar mensajes propios
        if (source === 'copilot-parent') return;

        switch (type) {
          case 'LOBE_CHAT_READY':
            // El copilot está listo — cancelar retry (ruta compilada OK)
            if (readyTimeoutRef.current) {
              window.clearTimeout(readyTimeoutRef.current);
              readyTimeoutRef.current = null;
            }
            retryCountRef.current = MAX_RETRIES; // no más retries
            sendAuthConfig();
            // Marcar iframe como listo después de que AUTH_CONFIG se procese
            setTimeout(() => setIframeReady(true), 200);
            break;
          case 'AUTH_REQUEST':
            // El copilot solicita autenticación
            sendAuthConfig();
            break;
          case 'PAGE_CONTEXT_REQUEST':
            // El copilot solicita contexto de página
            sendPageContext();
            break;
          case 'COPILOT_NAVIGATE': {
            // Navegar el parent app a la ruta indicada por el copilot.
            // Soporta URLs absolutas (organizador.bodasdehoy.com/...) → extrae solo el path.
            const rawUrl: string = event.data?.url || event.data?.payload?.url || '';
            if (rawUrl) {
              try {
                const parsed = new URL(rawUrl, window.location.origin);
                // Usar solo pathname + search para mantenernos en el mismo origen
                const relativePath = parsed.pathname + parsed.search;
                router.push(relativePath);
              } catch {
                // Si rawUrl ya es path relativo (empieza con /)
                if (rawUrl.startsWith('/')) router.push(rawUrl);
              }
            }
            break;
          }
          case 'FILTER_VIEW': {
            // El copilot pide filtrar la vista principal con los resultados de una consulta
            const { entity, ids, query } = payload || {};
            if (entity) {
              setCopilotFilter({ entity, ids, query });
              // Navegación automática: ir a la sección que corresponde al filtro si no estamos ya ahí
              const entityToPath: Record<string, string> = {
                tables: '/mesas',
                guests: '/invitados',
                budget_items: '/presupuesto',
                moments: '/itinerario',
                services: '/servicios',
              };
              const targetPath = entityToPath[entity];
              if (targetPath && !currentPath.includes(targetPath)) {
                router.push(targetPath);
              }
            }
            break;
          }
          case 'CLEAR_FILTER':
            // El copilot pide limpiar el filtro activo
            setCopilotFilter(null);
            break;
          case 'REFRESH_EVENTS':
            // El copilot creó o modificó un evento — refrescar lista
            refreshEventsGroup();
            break;
          case 'OPEN_FLOOR_PLAN': {
            // El copilot quiere abrir el editor de mesas, opcionalmente con config sugerida
            const { suggestedConfig } = payload || {};
            if (suggestedConfig && typeof window !== 'undefined') {
              sessionStorage.setItem('copilot_floor_plan_config', JSON.stringify(suggestedConfig));
            }
            router.push('/mesas');
            break;
          }
          case 'COPILOT_ACTION':
            break;
          case 'MCP_NAVIGATION':
            // Navegación desde MCP - podría usarse para actualizar el preview
            break;
          default:
            break;
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }, [sendAuthConfig, sendPageContext, currentPath, setCopilotFilter, refreshEventsGroup, router]);

    // AUTH_CONFIG se envía SOLO cuando el iframe lo solicita:
    // - LOBE_CHAT_READY: el copilot terminó de cargar y registró su listener
    // - AUTH_REQUEST: el copilot solicita autenticación explícitamente
    // NO enviar proactivamente con delay — causa race condition si el listener
    // aún no está registrado y genera un retry innecesario.

    // Escuchar CustomEvent 'copilot:send-prompt' emitido desde cualquier página del parent
    // y reenviarlo como postMessage SEND_PROMPT al iframe del copilot.
    useEffect(() => {
      const handleSendPrompt = (e: CustomEvent<{ message: string; context?: unknown }>) => {
        const iframe = iframeRef.current;
        if (!iframe?.contentWindow) return;
        const { message, context } = e.detail || {};
        if (!message) return;
        iframe.contentWindow.postMessage({
          type: 'SEND_PROMPT',
          source: 'copilot-parent',
          timestamp: Date.now(),
          payload: { message, context },
        }, '*');
      };
      window.addEventListener('copilot:send-prompt', handleSendPrompt as EventListener);
      return () => window.removeEventListener('copilot:send-prompt', handleSendPrompt as EventListener);
    }, []);

    // Forward del mensaje pendiente cuando el iframe está listo
    useEffect(() => {
      if (iframeReady && pendingMessage.trim()) {
        iframeRef.current?.contentWindow?.postMessage({
          type: 'SEND_PROMPT',
          source: 'copilot-parent',
          timestamp: Date.now(),
          payload: { message: pendingMessage.trim() },
        }, '*');
        setPendingMessage('');
      }
    }, [iframeReady, pendingMessage]);

    // Enviar PAGE_CONTEXT cuando cambie la pantalla; reenviar AUTH_CONFIG cuando cambie el evento
    // para que el iframe actualice current_event_id y las consultas vayan al evento correcto.
    useEffect(() => {
      if (isLoaded && authSent) {
        const pathChanged = lastSentPath.current !== currentPath;
        const eventChanged = lastSentEventId.current !== (event?._id || null);

        if (eventChanged) {
          sendAuthConfig();
        }
        if (pathChanged || eventChanged) {
          sendPageContext();
        }
      }
    }, [isLoaded, authSent, currentPath, event, sendAuthConfig, sendPageContext]);

    // Handler para enviar mensaje desde el skeleton input
    const handleSkeletonSubmit = useCallback((e?: React.FormEvent) => {
      e?.preventDefault();
      const msg = pendingMessage.trim();
      if (!msg) return;
      if (iframeReady) {
        // Iframe ya listo: enviar directo
        iframeRef.current?.contentWindow?.postMessage({
          type: 'SEND_PROMPT',
          source: 'copilot-parent',
          timestamp: Date.now(),
          payload: { message: msg },
        }, '*');
        setPendingMessage('');
      } else {
        // Iframe aún cargando: marcar como pendiente (se enviará en el useEffect)
        setPendingSent(true);
      }
    }, [iframeReady, pendingMessage]);

    return (
      <div className={`relative h-full w-full flex flex-col bg-white overflow-hidden ${className || ''}`}>
        {/* Skeleton overlay — visible mientras el iframe carga */}
        <div
          className={`absolute inset-0 z-30 flex flex-col bg-gray-50 transition-opacity duration-300 ${
            iframeReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Skeleton header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-200">
            <span className="text-lg">✨</span>
            <span className="font-semibold text-gray-800 text-sm">Copilot IA</span>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
              <span className={`inline-block w-2 h-2 rounded-full ${iframeReady ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
              {iframeReady ? 'Listo' : 'Cargando...'}
            </span>
          </div>

          {/* Skeleton chat area */}
          <div className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
            {/* Skeleton bubbles — left */}
            <div className="flex justify-start">
              <div className="bg-gray-200 animate-pulse rounded-2xl rounded-tl-sm h-10 w-48" />
            </div>
            {/* Skeleton bubble — right */}
            <div className="flex justify-end">
              <div className="bg-gray-200 animate-pulse rounded-2xl rounded-tr-sm h-8 w-32" />
            </div>
            {/* Skeleton bubble — left wider */}
            <div className="flex justify-start">
              <div className="bg-gray-200 animate-pulse rounded-2xl rounded-tl-sm h-12 w-56" />
            </div>
          </div>

          {/* Skeleton input — REAL and functional */}
          <div className="px-3 py-3 bg-white border-t border-gray-200">
            {pendingSent && !iframeReady && (
              <p className="text-xs text-gray-400 mb-1.5 px-1">Enviando cuando esté listo...</p>
            )}
            <form onSubmit={handleSkeletonSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={pendingMessage}
                onChange={(e) => setPendingMessage(e.target.value)}
                placeholder={pendingSent ? 'Enviando cuando esté listo...' : 'Escribe tu pregunta...'}
                disabled={pendingSent}
                className={`flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                  pendingSent ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'focus:border-pink-400 focus:ring-1 focus:ring-pink-200'
                }`}
                autoFocus
              />
              <button
                type="submit"
                disabled={!pendingMessage.trim() || pendingSent}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-violet-500 text-white disabled:opacity-40 transition-opacity"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>
        </div>

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
          <div className="absolute inset-0 flex items-center justify-center bg-white z-40">
            <div className="flex flex-col items-center gap-4 p-6 text-center max-w-md">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-sm text-red-600">{error}</p>
              <a
                href={getCopilotBaseUrl().startsWith('http') ? getCopilotBaseUrl() : 'https://chat.bodasdehoy.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-pink-600 hover:underline"
              >
                Abrir chat en nueva pestaña
              </a>
              <button
                onClick={() => {
                  setIsLoaded(false);
                  setError(null);
                  setIframeReady(false);
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
        )}

        {/* Aviso invitado: para chatear debe iniciar sesión */}
        {isAnonymous && isLoaded && (
          <div className="absolute top-0 left-0 right-0 bg-slate-100 border-b border-slate-200 z-20 p-2">
            <p className="text-xs text-slate-600 text-center">
              Estás como invitado.{' '}
              <a href="/login" className="text-pink-600 hover:underline font-medium">Inicia sesión</a>
              {' '}para chatear y no perder la información de tu evento.
            </p>
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
        {backendCheck === 'error' && backendError && !error && isLoaded && (
          <div className="absolute top-0 left-0 right-0 bg-yellow-50 border-b border-yellow-200 z-20 p-2 max-h-16 overflow-hidden">
            <div className="flex items-center justify-between max-w-full">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-yellow-600 text-xs">⚠️ Servicio IA: {typeof backendError === 'string'
                  ? (backendError.replace(/^Error:\s*/i, '').split('\n')[0] || backendError).slice(0, 100)
                  : 'Servicio IA no disponible. Puedes reintentar más tarde.'}</span>
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

        {/* LobeChat iframe — siempre montado, se carga en background detrás del skeleton */}
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          className="w-full h-full border-none opacity-100"
          style={{
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
};

CopilotIframe.displayName = 'CopilotIframe';

export default memo(CopilotIframe) as any; // type cast: React 19 + pnpm ReactNode path mismatch
