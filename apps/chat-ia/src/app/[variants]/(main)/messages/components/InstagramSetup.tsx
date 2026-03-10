'use client';

import { useState } from 'react';

import { buildHeaders } from '../utils/auth';

interface InstagramSetupProps {
  development: string;
}

export function InstagramSetup({ development }: InstagramSetupProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);

  const handleConnect = async () => {
    setStatus('connecting');
    setError(null);

    try {
      // Request OAuth URL from backend
      const res = await fetch('/api/messages/instagram/oauth-url', {
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
        // Open OAuth popup
        const popup = window.open(data.oauthUrl, 'instagram-oauth', 'width=600,height=700');
        if (!popup) {
          throw new Error('No se pudo abrir la ventana de autorización. Desactiva el bloqueador de popups.');
        }

        // Listen for OAuth callback
        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'INSTAGRAM_OAUTH_SUCCESS') {
            setAccountName(event.data.accountName || 'Cuenta conectada');
            setStatus('connected');
            window.removeEventListener('message', handleMessage);
          } else if (event.data?.type === 'INSTAGRAM_OAUTH_ERROR') {
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
      setError(err?.message ?? 'Error conectando Instagram');
      setStatus('error');
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/messages/instagram/disconnect', {
        method: 'POST',
        headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ development }),
      });
    } catch {
      // ignore
    }
    setStatus('idle');
    setAccountName(null);
  };

  if (status === 'connected') {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-full max-w-sm rounded-2xl border border-pink-200 bg-pink-50 p-6 text-center shadow-sm">
          <div className="mb-4 text-5xl">✅</div>
          <h3 className="mb-1 text-lg font-semibold text-gray-900">Instagram Conectado</h3>
          {accountName && (
            <p className="mb-4 text-sm text-gray-600">
              <span className="font-medium">Cuenta:</span> @{accountName}
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
        <div className="mb-4 text-6xl">📷</div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900">Conectar Instagram</h3>
        <p className="mb-6 text-sm text-gray-500">
          Vincula tu cuenta de Instagram Business para recibir y responder mensajes directos
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          className="w-full rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 px-6 py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-50"
          disabled={status === 'connecting'}
          onClick={handleConnect}
          type="button"
        >
          {status === 'connecting' ? 'Conectando...' : 'Conectar con Instagram'}
        </button>

        <p className="mt-4 text-xs text-gray-400">
          Necesitas una cuenta de Instagram Business vinculada a una página de Facebook
        </p>
      </div>
    </div>
  );
}
