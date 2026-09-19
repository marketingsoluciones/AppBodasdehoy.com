'use client';

import { useEffect, useState } from 'react';

/**
 * WindowExpiryBanner — aviso PROACTIVO de la ventana de 24h de WhatsApp.
 *
 * Gap detectado en la auditoría de funcionalidad (22-ago): el dato `windowExpiresAt`
 * (de useConversationCapabilities) ya existía, pero SOLO se usaba de forma REACTIVA —
 * cuando la ventana YA se había cerrado, forzando el picker de plantilla (HSM). Faltaba
 * avisar ANTES, mientras aún se puede responder gratis. "La ventana de 24h es dinero":
 * si expira, cada respuesta cuesta una plantilla HSM de pago.
 *
 * Se muestra SOLO cuando la ventana sigue ABIERTA (canReplyFreeText) pero cerrará pronto
 * (< WARN_THRESHOLD). Cuando ya está cerrada, el composer muestra el TemplatePicker
 * (otra ruta), así que este banner no se solapa con ese estado.
 *
 * SSR-safe: `now` arranca null (no se lee el reloj en el render inicial) → server y primer
 * render cliente coinciden; el reloj se hidrata en el effect. Tick de 60s para el countdown.
 */
const WARN_THRESHOLD_MS = 6 * 60 * 60 * 1000; // avisar cuando quedan < 6h

function formatRemaining(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

interface WindowExpiryBannerProps {
  canReplyFreeText?: boolean;
  windowExpiresAt?: string | null;
}

export function WindowExpiryBanner({ canReplyFreeText, windowExpiresAt }: WindowExpiryBannerProps) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!windowExpiresAt || !canReplyFreeText || now === null) return null;

  const expiry = new Date(windowExpiresAt).getTime();
  if (Number.isNaN(expiry)) return null;

  const remaining = expiry - now;
  // Solo si la ventana sigue ABIERTA y cerrará pronto. Ya-cerrada la gestiona el TemplatePicker.
  if (remaining <= 0 || remaining > WARN_THRESHOLD_MS) return null;

  return (
    <div
      className="flex items-center gap-2 border-t px-4 py-2 text-[12px]"
      role="status"
      style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A', color: '#92400E' }}
    >
      <span aria-hidden="true">⏳</span>
      <span>
        La ventana para responder sin plantilla cierra en{' '}
        <strong>{formatRemaining(remaining)}</strong>. Responde ahora; después solo podrás
        enviar una plantilla.
      </span>
    </div>
  );
}
