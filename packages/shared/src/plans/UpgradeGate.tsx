/**
 * <UpgradeGate> — Componente reutilizable de gating por plan.
 *
 * Si el usuario excede su límite, muestra un overlay con CTA de upgrade.
 * Si está dentro del límite, muestra el contenido normal + barra de progreso sutil.
 *
 * Uso:
 *   <UpgradeGate sku="memories-albums" usage={albumCount} limit={plan.albumLimit}>
 *     <CreateAlbumButton />
 *   </UpgradeGate>
 */

import React from 'react';

import { canAccess } from './gates';
import { humanizeUsage, usageColor, usagePercent } from './humanize';
import type { PlanLimit } from './types';

export interface UpgradeGateProps {
  /** SKU del recurso a verificar */
  sku: string;
  /** Uso actual del usuario */
  usage: number;
  /** Limits del plan (product_limits array) */
  limits: PlanLimit[];
  /** Contenido que se muestra si tiene acceso */
  children: React.ReactNode;
  /** Mensaje personalizado cuando se bloquea */
  blockedMessage?: string;
  /** URL o callback para upgrade */
  onUpgrade?: () => void;
  /** URL directa a la página de planes */
  upgradeUrl?: string;
  /** Texto del botón de upgrade */
  upgradeLabel?: string;
  /** Mostrar barra de progreso cuando está dentro del límite */
  showProgress?: boolean;
  /** Ocultar completamente el children cuando está bloqueado (en vez de overlay) */
  hideWhenBlocked?: boolean;
}

export function UpgradeGate({
  sku,
  usage,
  limits,
  children,
  blockedMessage,
  onUpgrade,
  upgradeUrl,
  upgradeLabel = 'Actualizar plan',
  showProgress = true,
  hideWhenBlocked = false,
}: UpgradeGateProps) {
  const check = canAccess(sku, usage, { product_limits: limits });
  const limit = limits.find((l) => l.sku === sku);

  // Sin límite definido → mostrar normal
  if (!limit) return <>{children}</>;

  const percent = usagePercent(usage, limit.free_quota);
  const color = usageColor(percent);
  const usageText = humanizeUsage(sku, usage, limit.free_quota);

  // Bloqueado
  if (!check.allowed) {
    if (hideWhenBlocked) {
      return (
        <div style={styles.blockedContainer}>
          <p style={styles.blockedText}>
            {blockedMessage ?? `Has alcanzado el límite: ${usageText}`}
          </p>
          {(onUpgrade || upgradeUrl) && (
            upgradeUrl ? (
              <a href={upgradeUrl} style={styles.upgradeButton}>
                {upgradeLabel}
              </a>
            ) : (
              <button onClick={onUpgrade} style={styles.upgradeButton}>
                {upgradeLabel}
              </button>
            )
          )}
        </div>
      );
    }

    return (
      <div style={styles.gateWrapper}>
        <div style={styles.disabledContent}>{children}</div>
        <div style={styles.overlay}>
          <div style={styles.overlayContent}>
            <p style={styles.overlayText}>
              {blockedMessage ?? `Has alcanzado el límite: ${usageText}`}
            </p>
            {(onUpgrade || upgradeUrl) && (
              upgradeUrl ? (
                <a href={upgradeUrl} style={styles.upgradeButton}>
                  {upgradeLabel}
                </a>
              ) : (
                <button onClick={onUpgrade} style={styles.upgradeButton}>
                  {upgradeLabel}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dentro del límite
  return (
    <div>
      {children}
      {showProgress && percent > 0 && limit.free_quota < 999_999 && (
        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${percent}%`,
                backgroundColor: color,
              }}
            />
          </div>
          <span style={{ ...styles.progressText, color }}>{usageText}</span>
        </div>
      )}
    </div>
  );
}

// ========================================
// Inline styles (framework-agnostic)
// ========================================

const styles: Record<string, React.CSSProperties> = {
  gateWrapper: {
    position: 'relative',
  },
  disabledContent: {
    opacity: 0.4,
    pointerEvents: 'none',
    filter: 'grayscale(0.5)',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: '8px',
    backdropFilter: 'blur(2px)',
  },
  overlayContent: {
    textAlign: 'center',
    padding: '16px 24px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    maxWidth: '320px',
  },
  overlayText: {
    margin: '0 0 12px',
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.5',
  },
  blockedContainer: {
    textAlign: 'center',
    padding: '24px',
    border: '1px dashed #d1d5db',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
  },
  blockedText: {
    margin: '0 0 12px',
    fontSize: '14px',
    color: '#6b7280',
  },
  upgradeButton: {
    display: 'inline-block',
    padding: '8px 20px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'white',
    backgroundColor: '#667eea',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '6px',
  },
  progressBar: {
    flex: 1,
    height: '4px',
    backgroundColor: '#e5e7eb',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '11px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
};

export default UpgradeGate;
