/**
 * CopilotIframe - Carga el LobeChat completo en un iframe
 *
 * Usa el rewrite /copilot-chat/ para cargar el LobeChat completo
 * con todas sus funcionalidades (sesiones, temas, historial, etc.)
 *
 * Comunicación con el iframe:
 * - Escucha LOBE_CHAT_READY del copilot
 * - Envía AUTH_CONFIG con la sesión del usuario
 */

import { forwardRef, useState, useCallback, memo, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';

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
}

const CopilotIframe = forwardRef<HTMLIFrameElement, CopilotIframeProps>(
  ({ userId, development = 'bodasdehoy', eventId, eventName, className, userData }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [authSent, setAuthSent] = useState(false);
    const internalRef = useRef<HTMLIFrameElement>(null);
    const iframeRef = (ref as React.RefObject<HTMLIFrameElement>) || internalRef;

    // Construir URL del LobeChat con parametros
    const buildCopilotUrl = useCallback(() => {
      const params = new URLSearchParams();

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

      // Detectar ambiente y usar URL correcta
      const isDev = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      // En desarrollo local: usar rewrite
      // En VPN/staging: usar URL del copilot de test
      const baseUrl = isDev
        ? '/copilot-chat'
        : (process.env.NEXT_PUBLIC_COPILOT_URL || 'https://chat-test.bodasdehoy.com');

      const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
      console.log('[CopilotIframe] URL construida:', url);
      return url;
    }, [userId, userData?.email, development, eventId]);

    const [iframeSrc, setIframeSrc] = useState(buildCopilotUrl());

    // Actualizar URL cuando cambien los parametros
    useEffect(() => {
      setIframeSrc(buildCopilotUrl());
    }, [buildCopilotUrl]);

    // Manejar carga del iframe
    const handleLoad = useCallback(() => {
      console.log('[CopilotIframe] Loaded:', iframeSrc);
      setIsLoaded(true);
      setError(null);
    }, [iframeSrc]);

    // Manejar error del iframe
    const handleError = useCallback((e: React.SyntheticEvent) => {
      console.error('[CopilotIframe] Error loading:', iframeSrc, e);
      setError(`No se pudo cargar: ${iframeSrc}. Error 502 - Verifica que el servidor este corriendo.`);
      setIsLoaded(true);
    }, [iframeSrc]);

    // Función para enviar AUTH_CONFIG al iframe del copilot
    const sendAuthConfig = useCallback(() => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow || !userId) return;

      // Obtener token de sesión de las cookies
      const sessionToken = Cookies.get('sessionBodas') || null;

      const authConfig = {
        type: 'AUTH_CONFIG',
        source: 'app-bodas',
        timestamp: Date.now(),
        payload: {
          userId,
          development,
          token: sessionToken,
          eventId: eventId || null,
          eventName: eventName || null,
          userData: userData ? {
            displayName: userData.displayName || null,
            email: userData.email || null,
            phoneNumber: userData.phoneNumber || null,
            photoURL: userData.photoURL || null,
          } : null,
        },
      };

      console.log('[CopilotIframe] Enviando AUTH_CONFIG al copilot:', {
        userId,
        development,
        hasToken: !!sessionToken,
        eventId,
      });

      // Enviar al iframe - determinar origen correcto según ambiente
      // En desarrollo (rewrite): el iframe tiene el mismo origen que la app principal
      // En producción: el iframe es de chat-test.bodasdehoy.com
      const isDev = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const copilotOrigin = isDev
        ? window.location.origin  // Mismo origen en desarrollo (rewrite)
        : (process.env.NEXT_PUBLIC_COPILOT_URL || 'https://chat-test.bodasdehoy.com');

      console.log('[CopilotIframe] Enviando postMessage a origen:', copilotOrigin);
      iframe.contentWindow.postMessage(authConfig, copilotOrigin);
      setAuthSent(true);
    }, [userId, development, eventId, eventName, userData, iframeRef]);

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
    }, [sendAuthConfig]);

    // Enviar AUTH_CONFIG cuando el iframe cargue y tengamos usuario
    useEffect(() => {
      if (isLoaded && userId && !authSent) {
        // Dar suficiente tiempo para que el iframe esté completamente listo
        // 1500ms permite que el copilot cargue y registre el listener de postMessage
        const timer = setTimeout(() => {
          sendAuthConfig();
        }, 1500);
        return () => clearTimeout(timer);
      }
    }, [isLoaded, userId, authSent, sendAuthConfig]);

    return (
      <div className={`h-full w-full flex flex-col bg-white ${className || ''}`}>
        {/* Loading / Error state */}
        {!isLoaded && (
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

        {/* LobeChat iframe */}
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          className={`w-full h-full border-none transition-opacity duration-200 ${
            isLoaded && !error ? 'opacity-100' : 'opacity-0'
          }`}
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
