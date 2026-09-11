'use client';

import { useEffect, useState } from 'react';

import { getWhatsAppChannels, type WhatsAppChannel } from '@/services/mcpApi/whatsapp';

/**
 * ChannelTypeChip — muestra, EN CONTEXTO (cabecera de la conversación), si el número de
 * WhatsApp por el que se responde es **Meta Business API (WAB)** o **QR (vinculado)**, con
 * un punto de salud (conectado/conectando/error).
 *
 * Gap G1 de la auditoría (22-ago): la GESTIÓN de canales (settings/integrations) ya
 * etiquetaba API vs QR + estado, pero en el trabajo diario (la conversación) NO se veía.
 * Importa porque el tipo cambia las reglas: WAB tiene ventana de 24h + plantillas HSM; el
 * QR personal no. Y la salud explica por qué un envío puede fallar (sesión caída).
 *
 * Solo aplica a canales WhatsApp cuyo param es `wa-<channelId>`. Para cualquier otro caso
 * (kind no-WA, o canal genérico sin id resoluble) devuelve null → 0 ruido, 0 fallback.
 */
const TYPE_SHORT: Record<string, string> = {
  QR_USER: 'QR',
  QR_WHITELABEL: 'QR',
  WAB: 'Meta API',
};

const STATUS_DOT: Record<string, { color: string; label: string }> = {
  ACTIVE: { color: '#22C55E', label: 'Conectado' },
  CONNECTING: { color: '#F59E0B', label: 'Conectando' },
  DISCONNECTED: { color: '#9CA3AF', label: 'Desconectado' },
  ERROR: { color: '#EF4444', label: 'Error de conexión' },
};

export function ChannelTypeChip({ channelParam }: { channelParam?: string }) {
  const [channel, setChannel] = useState<WhatsAppChannel | null>(null);

  // Solo canales WhatsApp con id explícito: `wa-<channelId>`.
  const channelId = channelParam?.startsWith('wa-') ? channelParam.slice(3) : null;

  useEffect(() => {
    if (!channelId) {
      setChannel(null);
      return;
    }
    let cancelled = false;
    getWhatsAppChannels()
      .then((list) => {
        if (cancelled) return;
        const match = list.find((c) => c.id === channelId || c.sessionKey === channelId);
        setChannel(match ?? null);
      })
      .catch(() => {
        /* backend caído → no mostramos nada (no fingir estado) */
      });
    return () => {
      cancelled = true;
    };
  }, [channelId]);

  if (!channel) return null;

  const typeLabel = TYPE_SHORT[channel.type] ?? null;
  const dot = STATUS_DOT[channel.status] ?? null;
  if (!typeLabel && !dot) return null;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
      style={{ backgroundColor: '#F2F1F6', color: '#4B5563' }}
      title={
        dot ? `${channel.name} · ${typeLabel ?? channel.type} · ${dot.label}` : channel.name
      }
    >
      {dot && (
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: dot.color }}
        />
      )}
      {typeLabel && <span>{typeLabel}</span>}
    </span>
  );
}
