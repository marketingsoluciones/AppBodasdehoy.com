/**
 * Copilot Page - Split-view tipo Cursor
 *
 * Panel izquierdo: Chat nativo con @lobehub/ui
 * Panel derecho: Preview de AppBodasdeHoy (resultado de las acciones)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Componentes del Copilot
import CopilotHeader from '../components/Copilot/CopilotHeader';
import CopilotIframe from '../components/Copilot/CopilotIframe';
import CopilotPreview from '../components/Copilot/CopilotPreview';
import CopilotResizer from '../components/Copilot/CopilotResizer';

// Contextos de AppBodasdeHoy
import { AuthContextProvider } from '../context/AuthContext';
import { EventContextProvider } from '../context/EventContext';

// Constantes
const DEFAULT_CHAT_WIDTH = 420;
const MIN_CHAT_WIDTH = 320;
const MAX_CHAT_WIDTH = 700;

type ViewMode = 'split' | 'chat-full' | 'preview-full';

const CopilotPage = () => {
  const router = useRouter();

  // Estados del layout
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  // Estados del preview
  const [previewUrl, setPreviewUrl] = useState<string>('/eventos');

  // Referencias
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // Contextos
  const authContext = AuthContextProvider();
  const eventContext = EventContextProvider();

  const user = authContext?.user;
  const config = authContext?.config;
  const event = eventContext?.event;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + E - Toggle view mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'e') {
        e.preventDefault();
        setViewMode(prev => {
          if (prev === 'split') return 'chat-full';
          if (prev === 'chat-full') return 'preview-full';
          return 'split';
        });
      }

      // Escape - Volver a split si estamos en modo completo
      if (e.key === 'Escape' && viewMode !== 'split') {
        setViewMode('split');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

  // Resize handlers
  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleResize = useCallback((deltaX: number) => {
    setChatWidth(prev => {
      const newWidth = prev + deltaX;
      return Math.min(MAX_CHAT_WIDTH, Math.max(MIN_CHAT_WIDTH, newWidth));
    });
  }, []);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Handler para refrescar el preview
  const handleRefreshPreview = useCallback(() => {
    if (previewIframeRef.current) {
      previewIframeRef.current.src = previewIframeRef.current.src;
    }
  }, []);

  // Redirigir si no esta autenticado
  useEffect(() => {
    if (authContext && !user && authContext.verificationDone) {
      router.push('/login?redirect=/copilot');
    }
  }, [user, authContext, router]);

  // Calcular anchos segun el modo de vista
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

  // Loading state: verificación de sesión (máx. ~5 s por timeout de seguridad en AuthContext)
  if (!authContext || !authContext.verificationDone) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-sm text-gray-600">Verificando sesión...</p>
        <p className="text-xs text-gray-400 max-w-xs text-center">
          Si no has iniciado sesión, serás redirigido al login para acceder al Copilot con tus datos.
        </p>
      </div>
    );
  }

  // Obtener información del usuario del contexto de auth
  const userId = user?.email || user?.uid || '';
  const development = config?.development || 'bodasdehoy';
  const eventId = event?._id;
  const eventName = event?.nombre;

  // Preparar datos del usuario para enviar al copilot
  const userData = user ? {
    displayName: user.displayName || null,
    email: user.email || null,
    phoneNumber: user.phoneNumber || null,
    photoURL: user.photoURL || null,
    uid: user.uid || null,
    role: user.role || [],
  } : undefined;

  return (
    <>
      <Head>
        <title>Copilot | AppBodasdeHoy</title>
        <meta name="description" content="Asistente IA para gestion de eventos" />
      </Head>

      <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100">
        {/* Header con controles */}
        <CopilotHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onRefreshPreview={handleRefreshPreview}
          previewUrl={previewUrl}
        />

        {/* Contenido principal */}
        <div className="flex flex-1 overflow-hidden">
          {/* Panel de Chat Nativo */}
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
              />
            )}
          </div>

          {/* Resizer */}
          {viewMode === 'split' && (
            <CopilotResizer
              onResizeStart={handleResizeStart}
              onResize={handleResize}
              onResizeEnd={handleResizeEnd}
              isResizing={isResizing}
            />
          )}

          {/* Panel de Preview */}
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
    </>
  );
};

export default CopilotPage;
