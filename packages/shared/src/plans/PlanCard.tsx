/**
 * <PlanCard> — Componente compartido para mostrar un plan de suscripción.
 *
 * Framework-agnostic (inline styles). Usado en:
 * - chat-ia/settings/billing/planes
 * - memories-web/pages/pro
 * - appEventos/pages/facturacion
 */

import React, { useState } from 'react';

import { humanizeQuota } from './humanize';
import { TIER_COLORS, type PlanLimit, type PlanPricing, type SubscriptionTier } from './types';

export interface PlanCardPlan {
  plan_id: string;
  name: string;
  description?: string;
  tier: SubscriptionTier;
  pricing: PlanPricing;
  product_limits: PlanLimit[];
  feature_restrictions?: Record<string, any>;
}

export interface PlanCardProps {
  plan: PlanCardPlan;
  /** SKUs relevantes a mostrar (filtra product_limits) */
  relevantSkus?: string[];
  /** Período de facturación */
  billingPeriod?: 'monthly' | 'yearly';
  /** Es el plan actual del usuario */
  isCurrent?: boolean;
  /** Callback al seleccionar */
  onSelect?: (planId: string) => void | Promise<void>;
  /** Estado de carga durante selección */
  selecting?: boolean;
  /** Texto personalizado del CTA */
  ctaText?: string;
  /** Destacar este plan (normalmente PRO) */
  highlighted?: boolean;
}

export function PlanCard({
  plan,
  relevantSkus,
  billingPeriod = 'monthly',
  isCurrent = false,
  onSelect,
  selecting = false,
  ctaText,
  highlighted,
}: PlanCardProps) {
  const isHighlighted = highlighted ?? plan.tier === 'PRO';
  const isFree = plan.pricing.monthly_fee === 0;
  const tierColor = TIER_COLORS[plan.tier] ?? '#6b7280';

  const price = billingPeriod === 'yearly' && plan.pricing.annual_fee
    ? plan.pricing.annual_fee / 12
    : plan.pricing.monthly_fee;

  const features = (relevantSkus
    ? plan.product_limits.filter((l) => relevantSkus.includes(l.sku))
    : plan.product_limits
  ).map((l) => ({
    label: l.service_name,
    value: humanizeQuota(l.sku, l.free_quota),
  }));

  const defaultCta = isCurrent
    ? 'Plan actual'
    : isFree
      ? 'Empezar gratis'
      : plan.pricing.trial_days
        ? `Probar ${plan.pricing.trial_days} días gratis`
        : `Elegir ${plan.name}`;

  return (
    <div
      style={{
        ...cardStyles.base,
        ...(isHighlighted ? cardStyles.highlighted : cardStyles.normal),
        ...(isCurrent && !isHighlighted ? cardStyles.current : {}),
      }}
    >
      {/* Plan name */}
      <div style={cardStyles.header}>
        <span
          style={{
            ...cardStyles.dot,
            backgroundColor: isHighlighted ? 'white' : tierColor,
          }}
        />
        <span
          style={{
            ...cardStyles.name,
            color: isHighlighted ? 'white' : '#111827',
          }}
        >
          {plan.name}
        </span>
        {isCurrent && (
          <span style={cardStyles.currentBadge}>Actual</span>
        )}
      </div>

      {/* Price */}
      <div style={cardStyles.priceRow}>
        <span style={{ ...cardStyles.price, color: isHighlighted ? 'white' : '#111827' }}>
          {isFree ? 'Gratis' : `${price.toFixed(2)}\u20AC`}
        </span>
        {!isFree && (
          <span style={{ ...cardStyles.period, color: isHighlighted ? 'rgba(255,255,255,0.7)' : '#9ca3af' }}>
            /mes
          </span>
        )}
      </div>

      {/* Description */}
      {plan.description && (
        <p style={{ ...cardStyles.description, color: isHighlighted ? 'rgba(255,255,255,0.8)' : '#6b7280' }}>
          {plan.description}
        </p>
      )}

      {/* CTA */}
      {onSelect && !isCurrent ? (
        <button
          disabled={selecting}
          onClick={() => onSelect(plan.plan_id)}
          style={{
            ...cardStyles.cta,
            ...(isHighlighted
              ? { backgroundColor: 'white', color: tierColor }
              : { backgroundColor: tierColor, color: 'white' }),
            opacity: selecting ? 0.6 : 1,
          }}
        >
          {selecting ? 'Procesando...' : ctaText ?? defaultCta}
        </button>
      ) : isCurrent ? (
        <div style={{ ...cardStyles.cta, border: `2px solid ${isHighlighted ? 'rgba(255,255,255,0.5)' : '#e5e7eb'}`, backgroundColor: 'transparent', color: isHighlighted ? 'white' : '#9ca3af' }}>
          Plan actual
        </div>
      ) : null}

      {/* Features */}
      <ul style={cardStyles.featureList}>
        {features.map((f) => (
          <li key={f.label} style={{ ...cardStyles.featureItem, color: isHighlighted ? 'rgba(255,255,255,0.9)' : '#4b5563' }}>
            <span style={{ ...cardStyles.check, color: isHighlighted ? 'white' : tierColor }}>
              &#10003;
            </span>
            <span style={{ flex: 1 }}>{f.label}</span>
            <span style={{ fontWeight: 600, color: isHighlighted ? 'white' : '#111827' }}>
              {f.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ========================================
// Inline styles (framework-agnostic)
// ========================================

const cardStyles: Record<string, React.CSSProperties> = {
  base: {
    borderRadius: 16,
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    flex: 1,
    minWidth: 240,
    transition: 'box-shadow 0.2s, transform 0.2s',
  },
  normal: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  highlighted: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    boxShadow: '0 8px 24px rgba(102,126,234,0.35)',
    transform: 'scale(1.02)',
  },
  current: {
    border: '2px solid #667eea',
    boxShadow: '0 0 0 3px rgba(102,126,234,0.1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  name: {
    fontSize: 18,
    fontWeight: 700,
  },
  currentBadge: {
    fontSize: 11,
    fontWeight: 600,
    backgroundColor: 'rgba(102,126,234,0.1)',
    color: '#667eea',
    padding: '2px 8px',
    borderRadius: 12,
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: -1,
  },
  period: {
    fontSize: 14,
  },
  description: {
    fontSize: 13,
    margin: 0,
    lineHeight: 1.4,
  },
  cta: {
    width: '100%',
    padding: '10px 0',
    borderRadius: 10,
    fontWeight: 600,
    fontSize: 14,
    border: 'none',
    cursor: 'pointer',
    textAlign: 'center',
    textDecoration: 'none',
    display: 'block',
  },
  featureList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
  },
  check: {
    flexShrink: 0,
    fontSize: 14,
  },
};

export default PlanCard;
