/**
 * CopilotSplitLayout - Diseño específico del Copilot: pantalla dividida en dos iframes
 *
 * Panel izquierdo: Chat (LobeChat en iframe)
 * Resizer: barra para redimensionar
 * Panel derecho: Preview de la app en iframe
 *
 * Se usa en la página /copilot y también cuando el Copilot se abre desde el atajo
 * en pantallas grandes (mismo diseño que se encargó para el Copilot).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import CopilotIframe from './CopilotIframe';
import CopilotPreview from './CopilotPreview';
import CopilotResizer from './CopilotResizer';
import { AuthContextProvider } from '../../context/AuthContext';
import { EventContextProvider } from '../../context/EventContext';
import { EventsGroupContextProvider } from '../../context';

const DEFAULT_CHAT_WIDTH = 420;
const MIN_CHAT_WIDTH = 320;
const MAX_CHAT_WIDTH = 700;

type ViewMode = 'split' | 'chat-full' | 'preview-full';

interface CopilotSplitLayoutProps {
  /** Si se proporciona, se muestra botón cerrar (p. ej. cuando se abre desde el sidebar) */
  onClose?: () => void;
  /** Clase CSS para el contenedor */
  className?: string;
}

const CopilotSplitLayout = ({ onClose, className = '' }: CopilotSplitLayoutProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('/eventos');
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  const authContext = AuthContextProvider();
  const eventContext = EventContextProvider();
  const eventsGroupContext = EventsGroupContextProvider();

  const user = authContext?.user;
  const config = authContext?.config;
  const event = eventContext?.event;
  const eventsGroup = eventsGroupContext?.eventsGroup ?? [];

  const userId = user?.email || user?.uid || '';
  const development = config?.development || 'bodasdehoy';
  const eventId = event?._id;
  const eventName = event?.nombre;
  const userData = user
    ? {
        displayName: user.displayName ?? null,
        email: user.email ?? null,
        phoneNumber: user.phoneNumber ?? null,
        photoURL: user.photoURL ?? null,
        uid: user.uid ?? null,
        role: user.role ?? [],
      }
    : undefined;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'e') {
        e.preventDefault();
        setViewMode((prev) => {
          if (prev === 'split') return 'chat-full';
          if (prev === 'chat-full') return 'preview-full';
          return 'split';
        });
      }
      if (e.key === 'Escape' && viewMode !== 'split') {
        setViewMode('split');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

  const handleResizeStart = useCallback(() => setIsResizing(true), []);
  const handleResize = useCallback((deltaX: number) => {
    setChatWidth((prev) =>
      Math.min(MAX_CHAT_WIDTH, Math.max(MIN_CHAT_WIDTH, prev + deltaX))
    );
  }, []);
  const handleResizeEnd = useCallback(() => setIsResizing(false), []);

  const handleRefreshPreview = useCallback(() => {
    if (previewIframeRef.current) {
      previewIframeRef.current.src = previewIframeRef.current.src;
    }
  }, []);

  const getChatStyle = () => {
    if (viewMode === 'preview-full') return { width: 0, display: 'none' as const };
    if (viewMode === 'chat-full') return { width: '100%', flex: 1 };
    return { width: chatWidth, flexShrink: 0 };
  };

  const getPreviewStyle = () => {
    if (viewMode === 'chat-full') return { width: 0, display: 'none' as const };
    if (viewMode === 'preview-full') return { flex: 1 };
    return { flex: 1 };
  };

  return (
    <div
      className={`flex flex-col h-full w-full overflow-hidden bg-gray-100 ${className}`}
    >
      {/* Barra superior: título + cerrar (si onClose) + modos de vista */}
      <header className="flex items-center justify-between h-12 px-3 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Cerrar Copilot (Esc)"
            >
              <IoClose className="w-5 h-5" />
            </button>
          )}
          <span className="text-base font-semibold text-gray-800">Copilot</span>
          {viewMode !== 'split' && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {viewMode === 'chat-full' ? 'Solo chat' : 'Solo preview'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {viewMode !== 'chat-full' && (
            <button
              type="button"
              onClick={handleRefreshPreview}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
              title="Refrescar preview"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
          {viewMode === 'split' && (
            <>
              <button
                type="button"
                onClick={() => setViewMode('chat-full')}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                title="Solo chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview-full')}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                title="Solo preview"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </button>
            </>
          )}
          {(viewMode === 'chat-full' || viewMode === 'preview-full') && (
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className="p-1.5 text-primary hover:bg-primary/10 rounded text-sm"
              title="Dividir vista (Escape)"
            >
              Dividir
            </button>
          )}
        </div>
      </header>

      {/* Contenido: Chat | Resizer | Preview (diseño específico del Copilot) */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div
          className="h-full bg-white shadow-lg transition-all duration-200"
          style={getChatStyle()}
        >
          {viewMode !== 'preview-full' && (
            <CopilotIframe
              userId={userId}
              development={development}
              eventId={eventId}
              eventName={eventName}
              userData={userData}
              event={event}
              eventsList={eventsGroup}
              className="h-full w-full"
            />
          )}
        </div>

        {viewMode === 'split' && (
          <CopilotResizer
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
            isResizing={isResizing}
          />
        )}

        <div
          className="h-full overflow-hidden transition-all duration-200"
          style={getPreviewStyle()}
        >
          {viewMode !== 'chat-full' && (
            <CopilotPreview
              ref={previewIframeRef}
              url={previewUrl}
              onUrlChange={setPreviewUrl}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CopilotSplitLayout;
