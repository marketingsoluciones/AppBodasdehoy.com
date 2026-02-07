/**
 * CopilotChat - Wrapper del iframe de Lobe-Chat
 *
 * Maneja:
 * - Carga del iframe de Lobe-Chat
 * - Estado de carga
 * - Comunicacion con postMessage
 */

import { forwardRef, useState, useEffect, useCallback, memo } from 'react';
import {
  createCopilotParentBridge,
  PostMessageBridge,
  NavigationPayload,
} from '@bodasdehoy/shared';

interface CopilotChatProps {
  chatUrl: string;
  onNavigate: (url: string) => void;
}

const CopilotChat = forwardRef<HTMLIFrameElement, CopilotChatProps>(
  ({ chatUrl, onNavigate }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Manejar carga del iframe
    const handleLoad = useCallback(() => {
      setIsLoaded(true);
      setError(null);
    }, []);

    // Manejar error de carga
    const handleError = useCallback(() => {
      setError('No se pudo cargar el chat. Verifica que Lobe-Chat este ejecutandose.');
      setIsLoaded(false);
    }, []);

    // Escuchar mensajes del iframe
    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        // Validar origen. Este proyecto no usa localhost; solo chat-test y producción.
        const validOrigins = [
          window.location.origin,
          'https://chat-test.bodasdehoy.com',
          'https://chat.bodasdehoy.com',
        ];

        if (!validOrigins.includes(event.origin)) {
          return;
        }

        const { type, payload } = event.data || {};

        switch (type) {
          case 'MCP_NAVIGATION':
            // MCP devolvio una URL - navegar en preview
            if (payload?.url) {
              onNavigate(payload.url);
            }
            break;

          case 'LOBE_CHAT_READY':
            setIsLoaded(true);
            break;
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }, [onNavigate]);

    return (
      <div className="relative h-full w-full flex flex-col bg-white">
        {/* Loading indicator */}
        {!isLoaded && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4" />
            <p className="text-gray-500 text-sm">Cargando chat...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 p-4">
            <div className="text-red-500 mb-4">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-gray-700 text-center mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setIsLoaded(false);
                // Forzar recarga del iframe
                const iframe = ref as React.RefObject<HTMLIFrameElement>;
                if (iframe?.current) {
                  iframe.current.src = iframe.current.src;
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Chat iframe */}
        <iframe
          ref={ref}
          src={chatUrl}
          className={`w-full h-full border-none transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          allow="clipboard-write; microphone"
          onLoad={handleLoad}
          onError={handleError}
          title="Copilot Chat"
        />
      </div>
    );
  }
);

CopilotChat.displayName = 'CopilotChat';

export default memo(CopilotChat);
