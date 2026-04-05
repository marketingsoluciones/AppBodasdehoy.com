'use client';

import { Badge, Breadcrumb, Modal, Skeleton, Tag, Tooltip, Alert } from 'antd';
import { createStyles } from 'antd-style';
import { ArrowLeft, Check, Info, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { memo, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import PriceComparison from '@/components/credits/PriceComparison';
import {
  SubscriptionPlan,
  UserSubscriptionInfo,
  cancelSubscription,
  createCustomerPortalSession,
  getMySubscription,
  getSubscriptionPlans,
  subscribeToPlan,
} from '@/services/api2/subscriptions';
import { humanizeQuota } from '@bodasdehoy/shared/plans';

const useStyles = createStyles(({ css, token }) => ({
  billingToggle: css`
    background: ${token.colorFillSecondary};
    border-radius: 20px;
    display: flex;
    gap: 4px;
    padding: 4px;
  `,
  billingToggleActive: css`
    background: ${token.colorPrimary};
    border-radius: 16px;
    color: white;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    padding: 6px 16px;
    border: none;
  `,
  billingToggleInactive: css`
    background: transparent;
    border: none;
    border-radius: 16px;
    color: ${token.colorTextSecondary};
    cursor: pointer;
    font-size: 13px;
    padding: 6px 16px;

    &:hover {
      color: ${token.colorText};
    }
  `,
  currentBadge: css`
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
  `,
  featureIcon: css`
    flex-shrink: 0;
    margin-top: 2px;
  `,
  featureRow: css`
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
  `,
  highlightCard: css`
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 16px;
    color: white;
    padding: 28px 24px;
    position: relative;
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.35);
  `,
  planCard: css`
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 16px;
    padding: 28px 24px;
    position: relative;
    transition: box-shadow 0.2s ease, transform 0.2s ease;

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }
  `,
  planName: css`
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 4px;
  `,
  price: css`
    font-size: 36px;
    font-weight: 800;
    letter-spacing: -1px;
  `,
  pricePeriod: css`
    font-size: 13px;
    opacity: 0.7;
    margin-top: 2px;
  `,
}));

// ============================================================
// PLAN COLOR MAP
// ============================================================

const PLAN_COLORS: Record<string, string> = {
  BASIC: '#3b82f6',
  CUSTOM: '#8b5cf6',
  ENTERPRISE: '#10b981',
  FREE: '#6b7280',
  MAX: '#f59e0b',
  PRO: '#667eea',
};

// ============================================================
// HELPERS
// ============================================================

function formatQuota(sku: string, quota: number): string {
  if (quota <= 0) return 'Sin acceso';
  // Use shared humanize for all SKUs
  const humanized = humanizeQuota(sku, quota);
  if (humanized !== `${quota}`) return humanized;
  // Fallback for unknown SKUs
  if (quota >= 999_999) return 'Ilimitado';
  return `${quota.toLocaleString()}/mes`;
}

interface LimitRow {
  label: string;
  value: string;
}

function extractLimits(plan: SubscriptionPlan): LimitRow[] {
  const rows: LimitRow[] = [];
  const seen = new Set<string>();

  const add = (label: string, value: string, key: string) => {
    if (!seen.has(key)) {
      seen.add(key);
      rows.push({ label, value });
    }
  };

  for (const l of plan.product_limits) {
    const s = l.sku.toLowerCase();
    if (
      s.includes('ai') ||
      s.includes('anthropic') ||
      s.includes('openai') ||
      s.includes('token')
    ) {
      add('Consultas IA', formatQuota(l.sku, l.free_quota), 'ai');
    } else if (
      s.includes('image') ||
      s.includes('dalle') ||
      s.includes('flux') ||
      s.includes('-sd')
    ) {
      add('Imágenes IA', formatQuota(l.sku, l.free_quota), 'images');
    } else if (s === 'storage-gb') {
      add('Almacenamiento', formatQuota(l.sku, l.free_quota), 'storage');
    } else if (s.includes('whatsapp') || s.includes('-wa')) {
      add('WhatsApp', formatQuota(l.sku, l.free_quota), 'whatsapp');
    } else switch (s) {
 case 'memories-albums': {
      add('Álbumes Memories', formatQuota(l.sku, l.free_quota), 'albums');
    
 break;
 }
 case 'memories-photos': {
      add('Fotos Memories', formatQuota(l.sku, l.free_quota), 'photos');
    
 break;
 }
 case 'events-count': {
      add('Eventos', formatQuota(l.sku, l.free_quota), 'events');
    
 break;
 }
 case 'guests-per-event': {
      add('Invitados/evento', formatQuota(l.sku, l.free_quota), 'guests');
    
 break;
 }
 case 'email-campaigns': {
      add('Emails campaña', formatQuota(l.sku, l.free_quota), 'emails');
    
 break;
 }
 case 'sms-invitations': {
      add('SMS', formatQuota(l.sku, l.free_quota), 'sms');
    
 break;
 }
 // No default
 }
  }

  if (!seen.has('storage') && plan.feature_restrictions.max_storage_gb) {
    add(
      'Almacenamiento',
      formatQuota('storage-gb', plan.feature_restrictions.max_storage_gb),
      'storage'
    );
  }

  const supportLabel = plan.feature_restrictions.white_label
    ? 'Dedicado'
    : plan.feature_restrictions.priority_support
      ? 'Prioritario'
      : 'Comunidad';
  add('Soporte', supportLabel, 'support');

  return rows;
}

interface FeatureRow {
  included: boolean;
  label: string;
  tooltip?: string;
}

function extractFeatures(plan: SubscriptionPlan): FeatureRow[] {
  const features: FeatureRow[] = [
    { included: true, label: 'Copiloto IA' },
    { included: true, label: 'Wallet prepago' },
  ];

  if (plan.global_discount?.value) {
    features.push({
      included: true,
      label: `${plan.global_discount.value}% descuento en servicios`,
      tooltip: 'Aplicado automáticamente al consumir tokens, imágenes y mensajes',
    });
  } else {
    features.push({ included: false, label: 'Descuentos en servicios' });
  }

  features.push({
    included: plan.feature_restrictions.priority_support || plan.feature_restrictions.white_label,
    label: 'Soporte prioritario',
  });

  if (plan.feature_restrictions.api_access) {
    features.push({ included: true, label: 'API acceso completo' });
  }

  if (plan.feature_restrictions.white_label) {
    features.push({ included: true, label: 'Gestor de cuenta dedicado' });
  }

  return features;
}

// ============================================================
// PLAN CARD
// ============================================================

const PlanCard = memo<{
  billing: 'monthly' | 'yearly';
  isCurrent?: boolean;
  onSelect?: (planId: string) => Promise<void>;
  plan: SubscriptionPlan;
  selecting?: boolean;
}>(({ plan, billing, isCurrent, onSelect, selecting }) => {
  const { styles } = useStyles();
  const isHighlighted = plan.tier === 'PRO';
  const color = PLAN_COLORS[plan.tier] ?? '#6b7280';

  const priceMonthly = plan.pricing.monthly_fee;
  const priceYearly =
    plan.pricing.annual_fee ??
    Math.round(priceMonthly * (1 - (plan.pricing.annual_discount_percent ?? 20) / 100));
  const price = billing === 'yearly' ? priceYearly : priceMonthly;
  const savingsPerYear = (priceMonthly - priceYearly) * 12;

  const limits = extractLimits(plan);
  const features = extractFeatures(plan);

  return (
    <div
      className={isHighlighted ? styles.highlightCard : styles.planCard}
      style={{ flex: 1, minWidth: 220 }}
    >
      {isCurrent && (
        <div className={styles.currentBadge}>
          <Tag color="green">Plan actual</Tag>
        </div>
      )}
      {isHighlighted && (
        <div className={styles.currentBadge}>
          <Tag color="gold" style={{ fontWeight: 700 }}>
            ✨ Más popular
          </Tag>
        </div>
      )}

      <Flexbox gap={12}>
        {/* Nombre y descripción */}
        <div>
          <div
            className={styles.planName}
            style={{ color: isHighlighted ? 'white' : color }}
          >
            {plan.name}
          </div>
          <div
            style={{
              color: isHighlighted
                ? 'rgba(255,255,255,0.8)'
                : 'var(--ant-color-text-secondary)',
              fontSize: 13,
            }}
          >
            {plan.description}
          </div>
        </div>

        {/* Precio */}
        <Flexbox align="baseline" gap={4} horizontal>
          <span
            className={styles.price}
            style={{ color: isHighlighted ? 'white' : 'inherit' }}
          >
            {price === 0 ? 'Gratis' : `€${price}`}
          </span>
          {price > 0 && (
            <span
              className={styles.pricePeriod}
              style={{ color: isHighlighted ? 'rgba(255,255,255,0.7)' : undefined }}
            >
              / mes{billing === 'yearly' ? ' (facturado anual)' : ''}
            </span>
          )}
        </Flexbox>

        {billing === 'yearly' && price > 0 && savingsPerYear > 0 && (
          <span
            style={{
              color: isHighlighted ? 'rgba(255,255,255,0.85)' : '#10b981',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Ahorras €{savingsPerYear}/año
          </span>
        )}

        {/* CTA */}
        <button
          disabled={isCurrent || selecting}
          onClick={() => !isCurrent && onSelect?.(plan.plan_id)}
          style={{
            background: isHighlighted
              ? 'white'
              : isCurrent
                ? 'transparent'
                : color,
            border: isCurrent ? `1px solid ${color}` : 'none',
            borderRadius: 8,
            color: isHighlighted ? color : isCurrent ? color : 'white',
            cursor: isCurrent || selecting ? 'default' : 'pointer',
            fontSize: 14,
            fontWeight: 600,
            marginTop: 4,
            opacity: isCurrent || selecting ? 0.7 : 1,
            padding: '10px 0',
            transition: 'opacity 0.2s',
            width: '100%',
          }}
        >
          {selecting
            ? '...'
            : isCurrent
              ? 'Plan actual'
              : price === 0
                ? 'Empezar gratis'
                : 'Elegir plan'}
        </button>

        {/* Separador */}
        <div
          style={{
            borderTop: isHighlighted
              ? '1px solid rgba(255,255,255,0.2)'
              : '1px solid var(--ant-color-border-secondary)',
            margin: '4px 0',
          }}
        />

        {/* Límites */}
        <Flexbox gap={6}>
          {limits.map(({ label, value }) => (
            <div
              className={styles.featureRow}
              key={label}
              style={{ color: isHighlighted ? 'rgba(255,255,255,0.9)' : undefined }}
            >
              <Check
                className={styles.featureIcon}
                color={isHighlighted ? 'rgba(255,255,255,0.8)' : '#10b981'}
                size={14}
              />
              <span>
                <strong>{value}</strong>
                {' — '}
                {label}
              </span>
            </div>
          ))}
        </Flexbox>

        {/* Features */}
        <Flexbox gap={6}>
          {features.map((f, i) => (
            <div
              className={styles.featureRow}
              key={i}
              style={{ color: f.included ? undefined : '#9ca3af' }}
            >
              {f.included ? (
                <Check
                  className={styles.featureIcon}
                  color={isHighlighted ? 'rgba(255,255,255,0.7)' : '#667eea'}
                  size={14}
                />
              ) : (
                <X className={styles.featureIcon} color="#d1d5db" size={14} />
              )}
              <span
                style={{
                  color:
                    isHighlighted && f.included ? 'rgba(255,255,255,0.85)' : undefined,
                }}
              >
                {f.label}
                {f.tooltip && (
                  <Tooltip title={f.tooltip}>
                    <Info size={12} style={{ cursor: 'help', marginLeft: 4, opacity: 0.6 }} />
                  </Tooltip>
                )}
              </span>
            </div>
          ))}
        </Flexbox>
      </Flexbox>
    </div>
  );
});

PlanCard.displayName = 'PlanCard';

// ============================================================

const PlanesPage = memo(() => {
  const { styles } = useStyles();
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [showCancelledBanner] = useState(searchParams?.get('cancelled') === '1');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [mySubscription, setMySubscription] = useState<UserSubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectingPlanId, setSelectingPlanId] = useState<string | null>(null);
  const [selectError, setSelectError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    Promise.all([getSubscriptionPlans(), getMySubscription()]).then(([plansData, subData]) => {
      setPlans(plansData);
      setMySubscription(subData);
      setLoading(false);
    });
  }, []);

  const handleSelectPlan = async (planId: string) => {
    setSelectingPlanId(planId);
    setSelectError(null);
    const result = await subscribeToPlan(planId, billing);
    if (result.success && result.checkout_url) {
      window.location.href = result.checkout_url;
    } else {
      setSelectError('No se pudo iniciar el checkout. Inténtalo de nuevo.');
      setSelectingPlanId(null);
    }
  };

  const handleOpenPortal = async () => {
    setOpeningPortal(true);
    const result = await createCustomerPortalSession();
    if (result.success && result.portal_url) {
      window.location.href = result.portal_url;
    } else {
      // Portal not available from api2 yet — show cancel modal as fallback
      setShowCancelModal(true);
    }
    setOpeningPortal(false);
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    const result = await cancelSubscription();
    setCancelling(false);
    setShowCancelModal(false);
    if (result.success) {
      setMySubscription(null);
      window.location.reload();
    } else {
      setSelectError('No se pudo cancelar la suscripción. Por favor, contacta con soporte.');
    }
  };

  const maxAnnualDiscount = plans.reduce((max, p) => {
    const pct = p.pricing.annual_discount_percent ?? 20;
    return pct > max ? pct : max;
  }, 20);

  const maxAnnualSavings = plans.reduce((max, p) => {
    const monthly = p.pricing.monthly_fee;
    const annual = p.pricing.annual_fee ?? Math.round(monthly * (1 - (p.pricing.annual_discount_percent ?? 20) / 100));
    const savings = (monthly - annual) * 12;
    return savings > max ? savings : max;
  }, 0);

  return (
    <Flexbox gap={32} style={{ maxWidth: 1100, padding: 24, width: '100%' }}>
      <Breadcrumb
        items={[
          { title: <Link href="/settings">Ajustes</Link> },
          { title: <Link href="/settings/billing">Facturación</Link> },
          { title: 'Planes' },
        ]}
      />

      <Flexbox align="center" gap={12} horizontal>
        <Link href="/settings/billing" style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
          <ArrowLeft size={18} />
          Volver a Facturación
        </Link>
      </Flexbox>

      {showCancelledBanner && (
        <Alert
          description="Puedes elegir un plan cuando quieras."
          message="Checkout cancelado"
          showIcon
          type="info"
        />
      )}

      {/* Trial banner */}
      {mySubscription?.status === 'TRIAL' && mySubscription.trial_end && (() => {
        const daysLeft = Math.max(0, Math.ceil((new Date(mySubscription.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        return (
          <Alert
            description={
              daysLeft > 0
                ? `Te quedan ${daysLeft} día${daysLeft !== 1 ? 's' : ''} de prueba. Tus datos se mantienen seguros.`
                : 'Tu prueba ha terminado. Elige un plan para mantener las funciones.'
            }
            message={daysLeft > 0 ? `Prueba ${mySubscription.plan?.name ?? 'Pro'} activa` : 'Prueba finalizada'}
            showIcon
            type={daysLeft > 3 ? 'info' : daysLeft > 0 ? 'warning' : 'error'}
          />
        );
      })()}

      {/* Header */}
      <Flexbox align="center" gap={12}>
        <Flexbox align="center" gap={8} horizontal>
          <Sparkles color="#667eea" size={28} />
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Elige tu plan</h1>
        </Flexbox>
        {/* Social proof */}
        <div
          style={{
            alignItems: 'center',
            background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)',
            border: '1px solid #e0e7ff',
            borderRadius: 20,
            display: 'flex',
            fontSize: 13,
            gap: 6,
            padding: '4px 14px',
          }}
        >
          <span style={{ fontSize: 16 }}>⭐</span>
          <span style={{ color: '#4338ca', fontWeight: 600 }}>+1.200 organizadores</span>
          <span style={{ color: 'var(--ant-color-text-secondary)' }}>ya organizan su boda con Bodas de Hoy</span>
        </div>
        <p
          style={{
            color: 'var(--ant-color-text-secondary)',
            fontSize: 15,
            margin: 0,
            textAlign: 'center',
          }}
        >
          Todos los planes incluyen wallet prepago. Los precios por uso se aplican sobre el saldo
          remanente.
        </p>

        {/* Toggle mensual / anual */}
        <Flexbox align="center" gap={6}>
          <div className={styles.billingToggle}>
            <button
              className={
                billing === 'monthly' ? styles.billingToggleActive : styles.billingToggleInactive
              }
              onClick={() => setBilling('monthly')}
            >
              Mensual
            </button>
            <button
              className={
                billing === 'yearly' ? styles.billingToggleActive : styles.billingToggleInactive
              }
              onClick={() => setBilling('yearly')}
            >
              Anual
              <Badge
                color="green"
                count={`−${maxAnnualDiscount}%`}
                style={{ fontSize: 10, marginLeft: 6 }}
              />
            </button>
          </div>
          {billing === 'yearly' && maxAnnualSavings > 0 && (
            <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>
              Ahorra hasta €{maxAnnualSavings}/año 🎉
            </span>
          )}
        </Flexbox>
      </Flexbox>

      {/* Grid de planes */}
      {loading ? (
        <Flexbox gap={16} horizontal style={{ flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                background: 'var(--ant-color-bg-container)',
                border: '1px solid var(--ant-color-border-secondary)',
                borderRadius: 16,
                flex: 1,
                minWidth: 220,
                padding: 28,
              }}
            >
              <Skeleton active paragraph={{ rows: 6 }} title />
            </div>
          ))}
        </Flexbox>
      ) : plans.length === 0 ? (
        <div
          style={{
            background: 'var(--ant-color-fill-quaternary)',
            borderRadius: 12,
            color: 'var(--ant-color-text-secondary)',
            padding: 40,
            textAlign: 'center',
          }}
        >
          No se pudieron cargar los planes. Por favor, inténtalo de nuevo.
        </div>
      ) : (
        <Flexbox gap={16} horizontal style={{ alignItems: 'stretch', flexWrap: 'wrap' }}>
          {selectError && (
            <div style={{ color: '#ef4444', fontSize: 13, width: '100%' }}>{selectError}</div>
          )}
          {plans.map((plan) => (
            <PlanCard
              billing={billing}
              isCurrent={
                mySubscription?.status === 'ACTIVE' &&
                (mySubscription.plan_id === plan._id ||
                  mySubscription.plan_id === plan.plan_id ||
                  mySubscription.plan?.tier === plan.tier)
              }
              key={plan._id}
              onSelect={handleSelectPlan}
              plan={plan}
              selecting={selectingPlanId === plan.plan_id}
            />
          ))}
        </Flexbox>
      )}

      {/* Nota explicativa */}
      <div
        style={{
          background: 'var(--ant-color-fill-quaternary)',
          borderRadius: 12,
          fontSize: 13,
          lineHeight: 1.6,
          padding: 20,
        }}
      >
        <strong style={{ display: 'block', marginBottom: 8 }}>
          ¿Cómo funciona el sistema de precios?
        </strong>
        <p style={{ margin: 0 }}>
          Pagás una cuota mensual por el plan (acceso a la plataforma y límites base) y además
          recargas tu wallet para consumir servicios de IA, imágenes y comunicaciones. El plan
          determina el descuento que obtenés sobre el precio por uso.
        </p>
      </div>

      {/* Comparativa completa de planes */}
      <PriceComparison />

      {/* Gestionar suscripción activa */}
      {mySubscription?.status === 'ACTIVE' && (
        <div style={{ textAlign: 'center' }}>
          <button
            disabled={openingPortal}
            onClick={handleOpenPortal}
            style={{
              background: 'none',
              border: '1px solid var(--ant-color-border)',
              borderRadius: 8,
              color: 'var(--ant-color-text-secondary)',
              cursor: openingPortal ? 'not-allowed' : 'pointer',
              fontSize: 13,
              padding: '8px 20px',
            }}
          >
            {openingPortal ? 'Abriendo portal...' : '⚙️ Gestionar suscripción / Cancelar'}
          </button>
        </div>
      )}

      <p style={{ color: 'var(--ant-color-text-quaternary)', fontSize: 12, margin: 0, textAlign: 'center' }}>
        Todos los precios mostrados no incluyen IVA. El IVA aplicable se calculará en el checkout según tu país de facturación.
        Puedes cancelar tu suscripción en cualquier momento desde esta página.
      </p>

      {/* Modal de confirmación de cancelación */}
      <Modal
        cancelText="No, mantener plan"
        okButtonProps={{ danger: true, loading: cancelling }}
        okText="Sí, cancelar suscripción"
        onCancel={() => setShowCancelModal(false)}
        onOk={handleCancelSubscription}
        open={showCancelModal}
        title="¿Cancelar suscripción?"
      >
        <p>
          Tu plan seguirá activo hasta el final del período de facturación actual.
          Después pasarás automáticamente al plan gratuito.
        </p>
        <p style={{ color: 'var(--ant-color-text-secondary)', fontSize: 13 }}>
          Tus datos, eventos e invitados se conservan. Solo perderás acceso a las
          funcionalidades del plan de pago.
        </p>
      </Modal>
    </Flexbox>
  );
});

PlanesPage.displayName = 'PlanesPage';

export default PlanesPage;
