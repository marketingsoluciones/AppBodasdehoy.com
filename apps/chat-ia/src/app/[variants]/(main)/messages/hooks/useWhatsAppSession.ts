'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { buildHeaders } from '../utils/auth';

export type WhatsAppStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'error';

export interface WhatsAppSessionState {
  connectedAt?: string;
  error: string | null;
  phoneNumber?: string;
  qrCode?: string;
  status: WhatsAppStatus;
}

const POLL_INTERVAL_MS = 3000;
const CONNECTING_TIMEOUT_MS = 25_000;

export function useWhatsAppSession(development: string) {
  const [state, setState] = useState<WhatsAppSessionState>({
    error: null,
    status: 'disconnected',
  });
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectingSinceRef = useRef<number | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/messages/whatsapp/session/${development}`, {
        headers: buildHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success) {
        // Si hay qrCode pero el status sigue en 'connecting', forzar 'qr_ready'
        const effectiveStatus: WhatsAppStatus =
          data.status === 'connecting' && data.qrCode ? 'qr_ready' : (data.status as WhatsAppStatus);

        // Si ya tenemos QR o conexión, limpiar contador de timeout de conexión.
        if (effectiveStatus === 'qr_ready' || effectiveStatus === 'connected') {
          connectingSinceRef.current = null;
        }

        // Evita quedarnos "conectando" de forma indefinida cuando el backend no emite QR.
        if (effectiveStatus === 'connecting') {
          if (!connectingSinceRef.current) {
            connectingSinceRef.current = Date.now();
          } else if (Date.now() - connectingSinceRef.current > CONNECTING_TIMEOUT_MS) {
            setState((prev) => ({
              ...prev,
              error: 'No se pudo generar el QR a tiempo. Pulsa "Reintentar QR".',
              status: 'error',
            }));
            return;
          }
        }

        setState({
          connectedAt: data.connectedAt,
          error: null,
          phoneNumber: data.phoneNumber,
          qrCode: data.qrCode,
          status: effectiveStatus,
        });
      }
    } catch (err) {
      console.warn('[WA] Error fetching status:', err);
    } finally {
      setLoading(false);
    }
  }, [development]);

  const startSession = useCallback(async () => {
    connectingSinceRef.current = Date.now();
    setState((prev) => ({ ...prev, error: null, status: 'connecting' }));
    try {
      const response = await fetch(`/api/messages/whatsapp/session/${development}/start`, {
        body: JSON.stringify({}),
        headers: buildHeaders(),
        method: 'POST',
      });
      const data = await response.json();
      if (!data.success) {
        connectingSinceRef.current = null;
        setState((prev) => ({ ...prev, error: data.error || 'Error iniciando sesión', status: 'error' }));
        return;
      }

      // Primer refresh inmediato para intentar pintar QR cuanto antes.
      await fetchStatus();
    } catch (err: any) {
      connectingSinceRef.current = null;
      setState((prev) => ({ ...prev, error: err.message, status: 'error' }));
    }
  }, [development, fetchStatus]);

  const disconnectSession = useCallback(async () => {
    try {
      await fetch(`/api/messages/whatsapp/session/${development}`, {
        headers: buildHeaders(),
        method: 'DELETE',
      });
      connectingSinceRef.current = null;
      setState({ error: null, status: 'disconnected' });
    } catch (err) {
      console.warn('[WA] Error disconnecting:', err);
    }
  }, [development]);

  const requestPairingCode = useCallback(async (phoneNumber: string): Promise<string> => {
    const response = await fetch(`/api/messages/whatsapp/session/${development}/pairing-code`, {
      body: JSON.stringify({ phoneNumber }),
      headers: buildHeaders(),
      method: 'POST',
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Error solicitando código');
    return data.code as string;
  }, [development]);

  /**
   * Método atómico para vincular por número de teléfono.
   * Desconecta la sesión existente, inicia una nueva y solicita el código
   * de emparejamiento ANTES de que api2 genere el QR (Baileys no permite
   * pairing-code una vez que el modo QR está activo).
   */
  const startAndRequestPairingCode = useCallback(async (phoneNumber: string): Promise<string> => {
    // 1. Desconectar sesión existente (si la hay)
    await fetch(`/api/messages/whatsapp/session/${development}`, {
      headers: buildHeaders(),
      method: 'DELETE',
    }).catch(() => {});

    connectingSinceRef.current = null;
    setState({ error: null, status: 'connecting' });

    // 2. Iniciar nueva sesión
    const startRes = await fetch(`/api/messages/whatsapp/session/${development}/start`, {
      body: JSON.stringify({}),
      headers: buildHeaders(),
      method: 'POST',
    });
    const startData = await startRes.json();
    if (!startData.success) {
      throw new Error(startData.error || 'Error iniciando sesión');
    }

    // 3. Solicitar código de emparejamiento inmediatamente, antes de que api2 genere el QR
    const pairRes = await fetch(`/api/messages/whatsapp/session/${development}/pairing-code`, {
      body: JSON.stringify({ phoneNumber }),
      headers: buildHeaders(),
      method: 'POST',
    });
    const pairData = await pairRes.json();
    if (!pairData.success) throw new Error(pairData.error || 'Error solicitando código');
    return pairData.code as string;
  }, [development]);

  // Poll status: 3s while connecting, 30s when connected
  useEffect(() => {
    fetchStatus();
    const interval = state.status === 'connected' ? 30_000 : POLL_INTERVAL_MS;
    pollRef.current = setInterval(() => {
      fetchStatus();
    }, interval);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchStatus, state.status]);

  return {
    ...state,
    disconnectSession,
    loading,
    refetch: fetchStatus,
    requestPairingCode,
    startAndRequestPairingCode,
    startSession,
  };
}
