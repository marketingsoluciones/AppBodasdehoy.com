'use client';

import { useState } from 'react';

import { buildHeaders } from '../utils/auth';

interface FacebookSetupProps {
  development: string;
}

export function FacebookSetup({ development }: FacebookSetupProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pageName, setPageName] = useState<string | null>(null);

  const handleConnect = async () => {
    setStatus('connecting');
    setError(null);

    try {
      const res = await fetch('/api/messages/facebook/oauth-url', {
        method: 'POST',
        headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ development }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }

      const data = await res.json();

      if (data.oauthUrl) {
        const popup = window.open(data.oauthUrl, 'facebook-oauth', 'width=600,height=700');
        if (!popup) {
          throw new Error('No se pudo abrir la ventana de autorización. Desactiva el bloqueador de popups.');
        }

        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'FACEBOOK_OAUTH_SUCCESS') {
            setPageName(event.data.pageName || 'Página conectada');
            setStatus('connected');
            window.removeEventListener('message', handleMessage);
          } else if (event.data?.type === 'FACEBOOK_OAUTH_ERROR') {
            setError(event.data.error || 'Error en la autorización');
            setStatus('error');
            window.removeEventListener('message', handleMessage);
          }
        };
        window.addEventListener('message', handleMessage);
      } else {
        throw new Error('No se recibió URL de autorización');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Error conectando Facebook');
      setStatus('error');
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/messages/facebook/disconnect', {
        method: 'POST',
        headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ development }),
      });
    } catch {
      // ignore
    }
    setStatus('idle');
    setPageName(null);
  };

  if (status === 'connected') {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-full max-w-sm rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center shadow-sm">
          <div className="mb-4 text-5xl">✅</div>
          <h3 className="mb-1 text-lg font-semibold text-gray-900">Facebook Conectado</h3>
          {pageName && (
            <p className="mb-4 text-sm text-gray-600">
              <span className="font-medium">Página:</span> {pageName}
            </p>
          )}
          <button
            className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
            onClick={handleDisconnect}
            type="button"
          >
            Desconectar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="w-full max-w-sm text-center">
        <div className="mb-4 text-6xl">📘</div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900">Conectar Facebook Messenger</h3>
        <p className="mb-6 text-sm text-gray-500">
          Vincula tu página de Facebook para recibir y responder mensajes de Messenger
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition-opacity hover:bg-blue-700 active:scale-95 disabled:opacity-50"
          disabled={status === 'connecting'}
          onClick={handleConnect}
          type="button"
        >
          {status === 'connecting' ? 'Conectando...' : 'Conectar con Facebook'}
        </button>

        <p className="mt-4 text-xs text-gray-400">
          Necesitas ser administrador de la página de Facebook que deseas conectar
        </p>
      </div>
    </div>
  );
}
