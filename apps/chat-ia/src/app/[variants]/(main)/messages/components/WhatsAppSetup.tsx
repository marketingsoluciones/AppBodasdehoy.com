'use client';

import { useState } from 'react';
import { useWhatsAppSession } from '../hooks/useWhatsAppSession';

interface WhatsAppSetupProps {
  development: string;
}

type LinkMode = 'qr' | 'phone';

export function WhatsAppSetup({ development }: WhatsAppSetupProps) {
  const { connectedAt, disconnectSession, error, loading, phoneNumber, qrCode, requestPairingCode, startSession, status } =
    useWhatsAppSession(development);

  const [mode, setMode] = useState<LinkMode>('qr');
  const [phone, setPhone] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);

  const handleRequestCode = async () => {
    if (!phone.trim()) return;
    setPairingLoading(true);
    setPairingError(null);
    setPairingCode(null);
    try {
      // Ensure socket is running first
      if (status === 'disconnected' || status === 'error') await startSession();
      const code = await requestPairingCode(phone.trim());
      setPairingCode(code);
    } catch (err: any) {
      setPairingError(err?.message ?? 'Error solicitando código');
    } finally {
      setPairingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-2 animate-spin text-4xl">⏳</div>
          <p className="text-sm text-gray-500">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (status === 'connected') {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-full max-w-sm rounded-2xl border border-green-200 bg-green-50 p-6 text-center shadow-sm">
          <div className="mb-4 text-5xl">✅</div>
          <h3 className="mb-1 text-lg font-semibold text-gray-900">WhatsApp Conectado</h3>
          {phoneNumber && (
            <p className="mb-1 text-sm text-gray-600">
              <span className="font-medium">Número:</span> +{phoneNumber}
            </p>
          )}
          {connectedAt && (
            <p className="mb-6 text-xs text-gray-400">
              Conectado desde {new Date(connectedAt).toLocaleString('es-ES')}
            </p>
          )}
          <button
            className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
            onClick={disconnectSession}
            type="button"
          >
            Desconectar
          </button>
        </div>
      </div>
    );
  }

  // QR ready — show QR + phone alternative
  if (status === 'qr_ready' && qrCode && mode === 'qr') {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-full max-w-sm text-center">
          <h3 className="mb-1 text-xl font-semibold text-gray-900">Añadir número de WhatsApp</h3>

          {/* Mode toggle */}
          <div className="mb-6 mt-3 inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            <button
              className="rounded-md bg-white px-4 py-1.5 text-xs font-medium text-gray-900 shadow-sm"
              type="button"
            >
              Código QR
            </button>
            <button
              className="px-4 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
              onClick={() => setMode('phone')}
              type="button"
            >
              Número de teléfono
            </button>
          </div>

          <p className="mb-4 text-sm text-gray-500">
            Abre WhatsApp → Dispositivos vinculados → Vincular un dispositivo
          </p>

          <div className="mb-6 inline-block rounded-2xl border-4 border-green-500 p-2 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="QR Code WhatsApp" className="h-56 w-56" src={qrCode} />
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-400" />
            Esperando que escanees el código...
          </div>
        </div>
      </div>
    );
  }

  // Phone pairing mode (or qr_ready in phone mode)
  if (mode === 'phone') {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-full max-w-sm text-center">
          <h3 className="mb-1 text-xl font-semibold text-gray-900">Añadir número de WhatsApp</h3>

          {/* Mode toggle */}
          <div className="mb-6 mt-3 inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            <button
              className="px-4 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
              onClick={() => { setMode('qr'); setPairingCode(null); setPairingError(null); }}
              type="button"
            >
              Código QR
            </button>
            <button
              className="rounded-md bg-white px-4 py-1.5 text-xs font-medium text-gray-900 shadow-sm"
              type="button"
            >
              Número de teléfono
            </button>
          </div>

          {!pairingCode ? (
            <>
              <p className="mb-4 text-sm text-gray-500">
                Introduce tu número con código de país. Recibirás un código en WhatsApp.
              </p>
              <div className="mb-3 flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none"
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRequestCode()}
                  placeholder="+34 622 440 213"
                  type="tel"
                  value={phone}
                />
              </div>
              {pairingError && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {pairingError}
                </div>
              )}
              <button
                className="w-full rounded-xl bg-green-500 py-3 font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-50"
                disabled={pairingLoading || !phone.trim()}
                onClick={handleRequestCode}
                type="button"
              >
                {pairingLoading ? 'Solicitando código...' : 'Obtener código'}
              </button>
              <p className="mt-3 text-xs text-gray-400">
                Se enviará un código de 8 dígitos a tu WhatsApp
              </p>
            </>
          ) : (
            <>
              <p className="mb-4 text-sm text-gray-500">
                Abre WhatsApp → Dispositivos vinculados → Vincular con número → Introduce este código:
              </p>
              <div className="mb-6 rounded-2xl border-2 border-green-400 bg-green-50 px-6 py-5">
                <p className="text-3xl font-bold tracking-[0.3em] text-green-700">{pairingCode}</p>
                <p className="mt-1 text-xs text-green-600">Válido por ~60 segundos</p>
              </div>
              <button
                className="text-sm text-gray-500 underline hover:text-gray-700"
                onClick={() => { setPairingCode(null); setPhone(''); }}
                type="button"
              >
                Solicitar nuevo código
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-full max-w-sm rounded-2xl border border-green-200 bg-white p-6 text-center shadow-sm">
          <div className="mb-4 text-5xl">📱</div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Iniciando sesión...</h3>
          <p className="mb-4 text-sm text-gray-500">Generando código QR, espera un momento</p>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                className="inline-block h-2 w-2 animate-bounce rounded-full bg-green-400"
                key={i}
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              className="rounded-lg border border-green-300 px-3 py-1.5 text-xs text-green-700 hover:bg-green-50"
              onClick={startSession}
              type="button"
            >
              Reintentar QR
            </button>
            <button
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              onClick={() => setMode('phone')}
              type="button"
            >
              Vincular por número
            </button>
          </div>
        </div>
      </div>
    );
  }

  // disconnected or error — initial screen with both options
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="w-full max-w-sm text-center">
        <div className="mb-4 text-6xl">📱</div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900">Añadir número de WhatsApp</h3>
        <p className="mb-6 text-sm text-gray-500">
          Vincula tu número de WhatsApp para gestionar mensajes directamente desde aquí
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          className="mb-3 w-full rounded-xl bg-green-500 px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-green-600 active:scale-95"
          onClick={startSession}
          type="button"
        >
          Escanear código QR
        </button>

        <button
          className="w-full rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 active:scale-95"
          onClick={() => setMode('phone')}
          type="button"
        >
          Vincular con número de teléfono
        </button>
      </div>
    </div>
  );
}
