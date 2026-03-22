'use client';

/**
 * useChannelHealthMonitor
 *
 * Monitorea el estado de los canales externos (WhatsApp, etc.) cada POLL_INTERVAL.
 * Si detecta que un canal que estaba 'connected' pasa a 'disconnected' o 'error',
 * llama al callback `onChannelDown` para que el componente pueda mostrar una alerta.
 *
 * Diseño:
 *   - Solo monitorea si hay canales conectados (evita polling innecesario)
 *   - Compara el estado anterior (prevStatusMap) con el actual
 *   - No tiene dependencias circulares — recibe channels como prop
 *   - El POLL_INTERVAL es de 5 minutos para no sobrecargar la API
 */
import { useEffect, useRef } from 'react';

import type { InboxChannel } from './useInboxChannels';

export const CHANNEL_HEALTH_POLL_INTERVAL = 5 * 60 * 1000; // 5 minutos

export interface ChannelDownEvent {
  channelId: string;
  kind: string;
  label: string;
  previousStatus: string;
  currentStatus: string;
  detectedAt: Date;
}

interface UseChannelHealthMonitorOptions {
  /** Canales a monitorear (de useInboxChannels) */
  channels: InboxChannel[];
  /** Llamado cuando un canal conectado pasa a desconectado/error */
  onChannelDown?: (event: ChannelDownEvent) => void;
  /** Llamado cuando un canal vuelve a conectarse */
  onChannelRecovered?: (event: ChannelDownEvent) => void;
  /** Intervalo de polling en ms (por defecto 5 minutos) */
  pollInterval?: number;
  /** Si false, no hace polling (usuario no logueado, etc.) */
  enabled?: boolean;
}

export function useChannelHealthMonitor({
  channels,
  onChannelDown,
  onChannelRecovered,
  pollInterval = CHANNEL_HEALTH_POLL_INTERVAL,
  enabled = true,
}: UseChannelHealthMonitorOptions): void {
  const prevStatusMap = useRef<Map<string, string>>(new Map());
  // Inicializar el mapa con el estado actual en el primer render
  const initialized = useRef(false);

  useEffect(() => {
    if (!enabled || channels.length === 0) return;

    // Primera pasada: guardar el estado inicial sin disparar alertas
    if (!initialized.current) {
      channels.forEach((ch) => {
        if (ch.status) {
          prevStatusMap.current.set(ch.id, ch.status);
        }
      });
      initialized.current = true;
      return;
    }

    // Comparar con el estado anterior
    channels.forEach((ch) => {
      if (!ch.status) return;
      const prev = prevStatusMap.current.get(ch.id);
      if (!prev) {
        // Canal nuevo — guardar sin alertar
        prevStatusMap.current.set(ch.id, ch.status);
        return;
      }

      if (prev === 'connected' && ch.status !== 'connected') {
        // Canal degradado
        onChannelDown?.({
          channelId: ch.id,
          kind: ch.kind,
          label: ch.label,
          previousStatus: prev,
          currentStatus: ch.status,
          detectedAt: new Date(),
        });
      } else if (prev !== 'connected' && ch.status === 'connected') {
        // Canal recuperado
        onChannelRecovered?.({
          channelId: ch.id,
          kind: ch.kind,
          label: ch.label,
          previousStatus: prev,
          currentStatus: ch.status,
          detectedAt: new Date(),
        });
      }

      prevStatusMap.current.set(ch.id, ch.status);
    });
  }, [channels, enabled, onChannelDown, onChannelRecovered]);

  // El polling lo gestiona el componente padre (useInboxChannels ya tiene su propio polling).
  // Este hook simplemente reacciona a los cambios del array `channels` que recibe.
  // Si se quiere polling adicional independiente, usar el intervalo explícito:
  useEffect(() => {
    if (!enabled || pollInterval <= 0) return;
    // Resetear el estado inicializado periódicamente para forzar re-evaluación
    // en el próximo render que traiga channels actualizados
    const id = setInterval(() => {
      initialized.current = false;
    }, pollInterval);
    return () => clearInterval(id);
  }, [enabled, pollInterval]);
}
