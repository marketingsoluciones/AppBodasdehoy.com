'use client';

import { useState } from 'react';

import { buildHeaders } from '../utils/auth';

interface EmailSetupProps {
  development: string;
  onConnected?: () => void;
}

type Provider = 'gmail' | 'outlook' | 'smtp';

export function EmailSetup({ development, onConnected }: EmailSetupProps) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);

  // SMTP form state
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState('993');

  const handleOAuth = async (prov: 'gmail' | 'outlook') => {
    setProvider(prov);
    setStatus('connecting');
    setError(null);

    try {
      const res = await fetch(`/api/messages/email/oauth-url`, {
        body: JSON.stringify({ development, provider: prov }),
        headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }

      const data = await res.json();
      if (data.oauthUrl) {
        const popup = window.open(data.oauthUrl, 'email-oauth', 'width=600,height=700');
        if (!popup) throw new Error('Desactiva el bloqueador de popups');

        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'EMAIL_OAUTH_SUCCESS') {
            setConnectedEmail(event.data.email || 'Email conectado');
            setStatus('connected');
            onConnected?.();
            window.removeEventListener('message', handleMessage);
          } else if (event.data?.type === 'EMAIL_OAUTH_ERROR') {
            setError(event.data.error || 'Error en la autorización');
            setStatus('error');
            window.removeEventListener('message', handleMessage);
          }
        };
        window.addEventListener('message', handleMessage);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Error conectando email');
      setStatus('error');
    }
  };

  const handleSmtpConnect = async () => {
    if (!smtpHost || !smtpUser || !smtpPass) return;
    setStatus('connecting');
    setError(null);

    try {
      const res = await fetch('/api/messages/email/connect', {
        body: JSON.stringify({
          development,
          imap: { host: imapHost || smtpHost.replace('smtp', 'imap'), port: Number(imapPort) },
          provider: 'smtp',
          smtp: { host: smtpHost, pass: smtpPass, port: Number(smtpPort), user: smtpUser },
        }),
        headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }

      setConnectedEmail(smtpUser);
      setStatus('connected');
      onConnected?.();
    } catch (err: any) {
      setError(err?.message ?? 'Error conectando SMTP');
      setStatus('error');
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/messages/email/disconnect', {
        body: JSON.stringify({ development }),
        headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
        method: 'POST',
      });
    } catch {
      // ignore
    }
    setStatus('idle');
    setProvider(null);
    setConnectedEmail(null);
  };

  if (status === 'connected') {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-full max-w-sm rounded-2xl border border-purple-200 bg-purple-50 p-6 text-center shadow-sm">
          <div className="mb-4 text-5xl">✅</div>
          <h3 className="mb-1 text-lg font-semibold text-gray-900">Email Conectado</h3>
          {connectedEmail && (
            <p className="mb-4 text-sm text-gray-600">
              <span className="font-medium">Cuenta:</span> {connectedEmail}
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

  // SMTP form
  if (provider === 'smtp') {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-full max-w-sm text-center">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Configurar SMTP / IMAP</h3>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-2 text-left">
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" onChange={(e) => setSmtpHost(e.target.value)} placeholder="SMTP Host (smtp.ejemplo.com)" value={smtpHost} />
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" onChange={(e) => setSmtpPort(e.target.value)} placeholder="Puerto SMTP (587)" value={smtpPort} />
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" onChange={(e) => setSmtpUser(e.target.value)} placeholder="Usuario (email@ejemplo.com)" value={smtpUser} />
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" onChange={(e) => setSmtpPass(e.target.value)} placeholder="Contraseña" type="password" value={smtpPass} />
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" onChange={(e) => setImapHost(e.target.value)} placeholder="IMAP Host (imap.ejemplo.com)" value={imapHost} />
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" onChange={(e) => setImapPort(e.target.value)} placeholder="Puerto IMAP (993)" value={imapPort} />
          </div>

          <button
            className="mt-4 w-full rounded-xl bg-purple-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-600 disabled:opacity-50"
            disabled={status === 'connecting' || !smtpHost || !smtpUser || !smtpPass}
            onClick={handleSmtpConnect}
            type="button"
          >
            {status === 'connecting' ? 'Conectando...' : 'Conectar'}
          </button>

          <button
            className="mt-2 text-sm text-gray-500 underline hover:text-gray-700"
            onClick={() => { setProvider(null); setError(null); }}
            type="button"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Provider selection
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="w-full max-w-sm text-center">
        <div className="mb-4 text-6xl">📧</div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900">Conectar Email</h3>
        <p className="mb-6 text-sm text-gray-500">
          Recibe y responde emails desde tu bandeja de mensajes
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:bg-gray-50 active:scale-[0.98]"
            onClick={() => handleOAuth('gmail')}
            type="button"
          >
            <span className="text-2xl">📨</span>
            <div>
              <p className="font-semibold text-gray-900">Gmail</p>
              <p className="text-xs text-gray-500">Conectar con Google OAuth</p>
            </div>
          </button>

          <button
            className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:bg-gray-50 active:scale-[0.98]"
            onClick={() => handleOAuth('outlook')}
            type="button"
          >
            <span className="text-2xl">📬</span>
            <div>
              <p className="font-semibold text-gray-900">Outlook / Office 365</p>
              <p className="text-xs text-gray-500">Conectar con Microsoft OAuth</p>
            </div>
          </button>

          <button
            className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:bg-gray-50 active:scale-[0.98]"
            onClick={() => setProvider('smtp')}
            type="button"
          >
            <span className="text-2xl">⚙️</span>
            <div>
              <p className="font-semibold text-gray-900">SMTP / IMAP</p>
              <p className="text-xs text-gray-500">Configurar servidor manualmente</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
