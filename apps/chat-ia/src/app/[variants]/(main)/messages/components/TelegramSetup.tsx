'use client';

import { useState } from 'react';

import { buildHeaders } from '../utils/auth';

interface TelegramSetupProps {
  development: string;
}

export function TelegramSetup({ development }: TelegramSetupProps) {
  const [botToken, setBotToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [botName, setBotName] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!botToken.trim()) return;
    setStatus('connecting');
    setError(null);

    try {
      const res = await fetch('/api/messages/telegram/connect', {
        method: 'POST',
        headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: botToken.trim(), development }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }

      const data = await res.json();
      setBotName(data.botName || data.username || 'Bot conectado');
      setStatus('connected');
    } catch (err: any) {
      setError(err?.message ?? 'Error conectando el bot');
      setStatus('error');
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/messages/telegram/disconnect', {
        method: 'POST',
        headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ development }),
      });
    } catch {
      // ignore
    }
    setStatus('idle');
    setBotToken('');
    setBotName(null);
  };

  if (status === 'connected') {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-full max-w-sm rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center shadow-sm">
          <div className="mb-4 text-5xl">✅</div>
          <h3 className="mb-1 text-lg font-semibold text-gray-900">Telegram Conectado</h3>
          {botName && (
            <p className="mb-4 text-sm text-gray-600">
              <span className="font-medium">Bot:</span> @{botName}
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
        <div className="mb-4 text-6xl">✈️</div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900">Conectar Telegram</h3>
        <p className="mb-6 text-sm text-gray-500">
          Crea un bot en{' '}
          <a
            className="font-medium text-blue-600 underline"
            href="https://t.me/BotFather"
            rel="noopener noreferrer"
            target="_blank"
          >
            @BotFather
          </a>{' '}
          y pega aquí el token
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <input
          className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          onChange={(e) => setBotToken(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
          placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
          type="text"
          value={botToken}
        />

        <button
          className="w-full rounded-xl bg-blue-500 px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-blue-600 active:scale-95 disabled:opacity-50"
          disabled={status === 'connecting' || !botToken.trim()}
          onClick={handleConnect}
          type="button"
        >
          {status === 'connecting' ? 'Conectando...' : 'Conectar Bot'}
        </button>

        <p className="mt-4 text-xs text-gray-400">
          Los mensajes que reciba el bot aparecerán en tu bandeja de entrada
        </p>
      </div>
    </div>
  );
}
