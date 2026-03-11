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

export function useWhatsAppSession(development: string) {
  const [state, setState] = useState<WhatsAppSessionState>({
    error: null,
    status: 'disconnected',
  });
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    setState((prev) => ({ ...prev, error: null, status: 'connecting' }));
    try {
      const response = await fetch(`/api/messages/whatsapp/session/${development}/start`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!data.success) {
        setState((prev) => ({ ...prev, error: data.error || 'Error iniciando sesión', status: 'error' }));
      }
    } catch (err: any) {
      setState((prev) => ({ ...prev, error: err.message, status: 'error' }));
    }
  }, [development]);

  const disconnectSession = useCallback(async () => {
    try {
      await fetch(`/api/messages/whatsapp/session/${development}`, {
        method: 'DELETE',
        headers: buildHeaders(),
      });
      setState({ error: null, status: 'disconnected' });
    } catch (err) {
      console.warn('[WA] Error disconnecting:', err);
    }
  }, [development]);

  const requestPairingCode = useCallback(async (phoneNumber: string): Promise<string> => {
    const response = await fetch(`/api/messages/whatsapp/session/${development}/pairing-code`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ phoneNumber }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Error solicitando código');
    return data.code as string;
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
    startSession,
  };
}
