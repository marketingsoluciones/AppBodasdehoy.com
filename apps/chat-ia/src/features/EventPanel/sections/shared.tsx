import { ReactNode } from 'react';

export const money = (n: number | undefined | null, currency = 'EUR'): string => {
  const v = typeof n === 'number' && isFinite(n) ? n : 0;
  try {
    return new Intl.NumberFormat('es-ES', { currency, style: 'currency' }).format(v);
  } catch {
    return `${v.toLocaleString('es-ES')} ${currency}`;
  }
};

const ESTATUS_COLOR: Record<string, string> = {
  cancelado: '#ef4444',
  completado: '#22c55e',
  confirmado: '#22c55e',
  en_progreso: '#f59e0b',
  pagado: '#22c55e',
  pendiente: '#f59e0b',
};

export const StatusPill = ({ value }: { value?: string }) => {
  if (!value) return null;
  const c = ESTATUS_COLOR[String(value).toLowerCase()] || '#9ca3af';
  return (
    <span
      style={{
        background: `${c}22`,
        borderRadius: 999,
        color: c,
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 8px',
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
      }}
    >
      {String(value).replaceAll('_', ' ')}
    </span>
  );
};

export const Bar = ({ pct, color = '#6366f1' }: { color?: string; pct: number }) => (
  <div style={{ background: 'var(--ep-bar-bg, #e5e7eb)', borderRadius: 999, height: 8, overflow: 'hidden', width: '100%' }}>
    <div style={{ background: color, height: '100%', transition: 'width .3s', width: `${Math.max(0, Math.min(100, pct))}%` }} />
  </div>
);

export const EmptyHint = ({ children }: { children: ReactNode }) => (
  <div style={{ color: 'var(--ep-muted, #9ca3af)', fontSize: 13, padding: '24px 4px', textAlign: 'center' }}>
    {children}
  </div>
);

export const Card = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      background: 'var(--ep-card, #fff)',
      border: '1px solid var(--ep-border, #ececef)',
      borderRadius: 12,
      marginBottom: 10,
      padding: 12,
    }}
  >
    {children}
  </div>
);
