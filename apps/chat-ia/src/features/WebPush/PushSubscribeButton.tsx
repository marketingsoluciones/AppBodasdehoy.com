'use client';

/**
 * PushSubscribeButton — SPRINT 4 iMessage (6-jul).
 *
 * Botón opt-in para Web Push. Se muestra solo si:
 *   - Browser soporta Push API
 *   - Permiso está en 'default' o 'granted' (nunca en 'denied' porque
 *     no podemos hacer nada útil desde front)
 *
 * Estados renderizados:
 *   - supported=false          → nada (browser sin soporte)
 *   - permission='denied'      → mensaje explicativo con link a settings
 *   - permission='granted' + subscribed=true  → "Notificaciones activas ✓"
 *   - permission='granted' + subscribed=false → "Activar en este dispositivo"
 *   - permission='default'     → "Activar notificaciones"
 */
import { FC } from 'react';

import { useWebPushSubscription } from '@/hooks/useWebPushSubscription';

interface Props {
  compact?: boolean;
  onError?: (msg: string) => void;
}

export const PushSubscribeButton: FC<Props> = ({ compact, onError }) => {
  const push = useWebPushSubscription();

  if (!push.supported) return null;

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: compact ? '4px 8px' : '8px 14px',
    borderRadius: 8,
    fontSize: compact ? 11 : 13,
    fontWeight: 500,
    cursor: push.loading ? 'wait' : 'pointer',
    border: '1px solid transparent',
    transition: 'all 120ms ease',
  };

  if (push.permission === 'denied') {
    return (
      <div
        style={{
          ...baseStyle,
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          cursor: 'default',
        }}
        role="alert"
        data-testid="push-permission-denied"
      >
        <span aria-hidden="true">🔕</span>
        <span>Notificaciones bloqueadas — habilítalas en el navegador</span>
      </div>
    );
  }

  if (push.subscribed) {
    return (
      <button
        type="button"
        onClick={() => push.unsubscribe()}
        disabled={push.loading}
        style={{
          ...baseStyle,
          background: '#dcfce7',
          border: '1px solid #86efac',
          color: '#166534',
        }}
        data-testid="push-subscribed"
        title="Click para desactivar"
      >
        <span aria-hidden="true">🔔</span>
        <span>{push.loading ? 'Desactivando…' : 'Notificaciones activas'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={async () => {
        await push.subscribe();
        if (push.error && onError) onError(push.error);
      }}
      disabled={push.loading}
      style={{
        ...baseStyle,
        background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
        color: '#fff',
      }}
      data-testid="push-subscribe"
    >
      <span aria-hidden="true">🔔</span>
      <span>{push.loading ? 'Activando…' : 'Activar notificaciones'}</span>
    </button>
  );
};

export default PushSubscribeButton;
