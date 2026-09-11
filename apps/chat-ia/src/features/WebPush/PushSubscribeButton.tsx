'use client';

/**
 * PushSubscribeButton — SPRINT 4 iMessage (6-jul).
 *
 * Botón opt-in para Web Push.
 *
 * Estados renderizados:
 *   - hydrating (SSR y primer paint)  → skeleton mínimo (evita flash vacío)
 *   - supported=false + hydrated      → mensaje "navegador no soporta"
 *   - permission='denied'             → mensaje explicativo con link a settings
 *   - permission='granted' + subscribed=true  → "Notificaciones activas ✓"
 *   - permission='granted' + subscribed=false → "Activar en este dispositivo"
 *   - permission='default'            → "Activar notificaciones"
 *
 * BUG-QA-PUSH-UI (10-jul): antes hacía `return null` cuando supported=false.
 * En SSR / primer paint eso dejaba la card container vacía sin CTA — el user
 * QA reportó "el bloque se ve pero no aparece el botón" (qa/qa-comunicacion-
 * publica-2026-07-10.md B1 FAIL). Ahora siempre pinta ALGO (skeleton mientras
 * hydrata + mensaje si no hay soporte real) para que el usuario nunca se
 * quede sin feedback visual.
 */
import { FC, useEffect, useState } from 'react';

import { useWebPushSubscription } from '@/hooks/useWebPushSubscription';

interface Props {
  compact?: boolean;
  onError?: (msg: string) => void;
}

export const PushSubscribeButton: FC<Props> = ({ compact, onError }) => {
  const push = useWebPushSubscription();
  // `hydrated` diferencia SSR/primer-paint (donde supported siempre es false
  // porque no hay navigator) del veredicto real del useEffect del hook.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

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

  // Estado 1: SSR o primer paint antes de que el useEffect del hook corra.
  // Mostrar un skeleton para evitar layout shift y que la card container
  // nunca se vea vacía.
  if (!hydrated) {
    return (
      <div
        style={{
          ...baseStyle,
          background: '#f3f4f6',
          border: '1px solid #e5e7eb',
          color: '#9ca3af',
          cursor: 'default',
        }}
        aria-busy="true"
        data-testid="push-hydrating"
      >
        <span aria-hidden="true">🔔</span>
        <span>Comprobando soporte…</span>
      </div>
    );
  }

  // Estado 2: hydrated y browser NO tiene Push API / SW / Notification.
  // Antes: return null (el QA veía la card sin CTA — reportado
  // qa-comunicacion-publica-2026-07-10.md B1 FAIL).
  if (!push.supported) {
    return (
      <div
        style={{
          ...baseStyle,
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          color: '#6b7280',
          cursor: 'default',
        }}
        role="note"
        data-testid="push-unsupported"
      >
        <span aria-hidden="true">🔕</span>
        <span>
          Este navegador no soporta notificaciones push. Prueba con Chrome, Firefox,
          Edge o Safari 16.4+.
        </span>
      </div>
    );
  }

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
