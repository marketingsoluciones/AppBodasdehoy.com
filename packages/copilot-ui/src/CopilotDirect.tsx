/**
 * CopilotDirect - Integración del copilot (LobeChat) en el monorepo AppBodasdehoy + LobeChat
 *
 * Carga la app LobeChat (apps/copilot) vía iframe en el panel lateral de la web (apps/web).
 * En app-test usa solo chat-test; en local usa localhost:3210. Ver docs/MONOREPO-INTEGRACION-COPILOT.md.
 * Si el iframe no carga (timeout o bloqueo), muestra fallback "Abrir en nueva pestaña".
 */

import React, { useEffect, useMemo, useState, useRef } from 'react';
import type { CopilotChatProps } from './types';

const IFRAME_LOAD_TIMEOUT_MS = 8000; // 8 s: si no hay onLoad, mostrar fallback "Abrir en nueva pestaña"

const CopilotDirect: React.FC<CopilotChatProps> = ({
  userId,
  development = 'bodasdehoy',
  eventId,
  eventName,
  className,
  userData,
  event,
  eventsList,
  onNavigate,
  onAction,
}) => {
  const [isClient, setIsClient] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // app-test y chat-test van juntos (nueva versión). Producción es otra cosa y no es compatible. Solo chat-test en app-test.
  const copilotUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const host = window.location.hostname || '';
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    const isAppTest = host.includes('app-test');
    const baseUrl = isLocal ? 'http://localhost:3210' : isAppTest ? 'https://chat-test.bodasdehoy.com' : process.env.NEXT_PUBLIC_CHAT || 'https://chat.bodasdehoy.com';
    const params = new URLSearchParams();
    if (development) params.set('developer', development);
    if (userData?.email) params.set('email', userData.email);
    if (eventId) params.set('eventId', eventId);
    params.set('embed', '1');
    const variants = encodeURIComponent(development || 'bodasdehoy');
    const queryString = params.toString();
    const url = `${baseUrl.replace(/\/$/, '')}/${variants}/chat${queryString ? `?${queryString}` : ''}`;
    if (typeof window !== 'undefined') console.log('[CopilotDirect] URL (embed):', url);
    return url;
  }, [development, userData?.email, eventId]);

  const copilotUrlNewTab = useMemo(() => copilotUrl, [copilotUrl]);

  const timeoutStartedRef = useRef(false);
  useEffect(() => {
    if (!isClient || !copilotUrl || timeoutStartedRef.current) return;
    timeoutStartedRef.current = true;
    setShowFallback(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShowFallback(true), IFRAME_LOAD_TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isClient, copilotUrl]);

  const handleIframeLoad = () => {
    setShowFallback(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  if (!isClient) {
    return (
      <div className={`flex items-center justify-center h-full bg-white ${className || ''}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-pink-200 border-t-pink-500" />
          <p className="text-sm text-gray-500">Iniciando editor de chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`copilot-direct-container ${className || ''}`}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'white',
        position: 'relative',
      }}
    >
      <iframe
        src={copilotUrl}
        onLoad={handleIframeLoad}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          flex: 1,
          minHeight: 0,
        }}
        title="Copilot IA - LobeChat"
        allow="clipboard-read; clipboard-write; microphone"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
      />
      {showFallback && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,0.97)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center',
          }}
        >
          <p className="text-sm text-gray-600 mb-2">
            El editor de chat no ha cargado aquí (puede ser por seguridad del navegador).
          </p>
          <a
            href={copilotUrlNewTab}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500 text-white text-sm font-medium hover:bg-pink-600"
          >
            Abrir LobeChat en nueva pestaña
          </a>
        </div>
      )}
    </div>
  );
};

CopilotDirect.displayName = 'CopilotDirect';

export default CopilotDirect;
