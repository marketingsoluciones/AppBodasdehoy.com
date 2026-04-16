/**
 * Utilidades de feature gating basadas en el plan del usuario.
 * Verifica si un usuario puede usar un SKU y genera mensajes de upgrade.
 */

import type { AccessCheck, PlanLimit, SubscriptionPlan, SubscriptionTier } from './types';
import { TIER_ORDER } from './types';
import { humanizeQuota, humanizeSku } from './humanize';

/**
 * Verifica si el usuario puede usar un SKU dado su uso actual.
 */
export function canAccess(
  sku: string,
  currentUsage: number,
  plan: { product_limits: PlanLimit[] }
): AccessCheck {
  const limit = plan.product_limits.find((l) => l.sku === sku);

  // Sin limit definido = acceso libre (backwards compat)
  if (!limit) {
    return {
      allowed: true,
      remaining: Infinity,
      limit: Infinity,
      percentUsed: 0,
      overageAvailable: false,
    };
  }

  const remaining = Math.max(0, limit.free_quota - currentUsage);
  const percentUsed = limit.free_quota > 0
    ? Math.min(100, Math.round((currentUsage / limit.free_quota) * 100))
    : 100;

  const withinQuota = currentUsage < limit.free_quota;
  const allowed = withinQuota || limit.overage_enabled;

  return {
    allowed,
    remaining,
    limit: limit.free_quota,
    percentUsed,
    overageAvailable: limit.overage_enabled,
  };
}

/**
 * Verifica si el usuario puede usar un SKU dado su uso DEL DÍA.
 * Solo aplica si el plan tiene daily_quota definido para ese SKU.
 */
export function canAccessDaily(
  sku: string,
  todayUsage: number,
  plan: { product_limits: PlanLimit[] }
): AccessCheck | null {
  const limit = plan.product_limits.find((l) => l.sku === sku);

  if (!limit?.daily_quota) return null; // Sin límite diario → no aplica

  const remaining = Math.max(0, limit.daily_quota - todayUsage);
  const percentUsed = Math.min(100, Math.round((todayUsage / limit.daily_quota) * 100));
  const allowed = todayUsage < limit.daily_quota;

  return {
    allowed,
    remaining,
    limit: limit.daily_quota,
    percentUsed,
    overageAvailable: false,
  };
}

/**
 * Obtiene el siguiente tier recomendado para upgrade.
 */
export function getNextTier(currentTier: SubscriptionTier): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = ['FREE', 'BASIC', 'PRO', 'MAX', 'ENTERPRISE'];
  const currentIndex = TIER_ORDER[currentTier];
  if (currentIndex >= tiers.length - 1) return null;
  return tiers[currentIndex + 1] ?? null;
}

/**
 * Genera un mensaje contextual de upgrade para un SKU específico.
 * @example "Has usado 50/50 fotos. Actualiza a Basic para 500 fotos"
 */
export function getUpgradeMessage(
  sku: string,
  currentUsage: number,
  currentPlan: { product_limits: PlanLimit[]; tier: SubscriptionTier },
  availablePlans?: SubscriptionPlan[]
): string {
  const currentLimit = currentPlan.product_limits.find((l) => l.sku === sku);
  const skuLabel = humanizeSku(sku);

  if (!currentLimit) {
    return `Actualiza tu plan para acceder a ${skuLabel}.`;
  }

  const nextTier = getNextTier(currentPlan.tier);
  if (!nextTier) {
    return `Has alcanzado el límite de ${skuLabel} en tu plan actual.`;
  }

  // Buscar el siguiente plan que mejore este SKU
  const nextPlan = availablePlans?.find((p) => p.tier === nextTier);
  const nextLimit = nextPlan?.product_limits.find((l) => l.sku === sku);

  const currentQuota = humanizeQuota(sku, currentLimit.free_quota);
  const nextQuota = nextLimit ? humanizeQuota(sku, nextLimit.free_quota) : '';
  const nextPlanName = nextPlan?.name ?? nextTier;
  const nextPrice = nextPlan?.pricing.monthly_fee;

  const usageText = `Has usado ${currentQuota}`;
  const upgradeText = nextQuota
    ? `Actualiza a ${nextPlanName} para ${nextQuota}`
    : `Actualiza a ${nextPlanName}`;
  const priceText = nextPrice ? ` por ${nextPrice.toFixed(2)}\u20AC/mes` : '';

  return `${usageText}. ${upgradeText}${priceText}.`;
}

/**
 * Mensajes específicos para momentos de conversión clave.
 */
export function getConversionMessage(
  sku: string,
  percentUsed: number,
  plan: { tier: SubscriptionTier; product_limits: PlanLimit[] },
  availablePlans?: SubscriptionPlan[]
): string | null {
  const limit = plan.product_limits.find((l) => l.sku === sku);
  if (!limit) return null;

  const nextTier = getNextTier(plan.tier);
  const nextPlan = availablePlans?.find((p) => p.tier === nextTier);
  const nextLimit = nextPlan?.product_limits.find((l) => l.sku === sku);

  if (percentUsed >= 100) {
    if (sku === 'ai-tokens') {
      return 'Has llegado al límite. Actualiza para seguir usando el Copilot IA.';
    }
    if (sku === 'memories-photos') {
      const nextQuota = nextLimit ? humanizeQuota(sku, nextLimit.free_quota) : '';
      return `Has capturado todas las fotos disponibles. Actualiza para seguir añadiendo recuerdos${nextQuota ? ` (${nextQuota})` : ''}.`;
    }
    if (sku === 'memories-albums') {
      const nextQuota = nextLimit ? humanizeQuota(sku, nextLimit.free_quota) : '';
      return `Has usado todos tus álbumes. Actualiza para crear más${nextQuota ? ` (${nextQuota})` : ''}.`;
    }
    if (sku === 'events-count') {
      const price = nextPlan?.pricing.monthly_fee;
      return `Has llegado al límite de eventos. Con ${nextPlan?.name ?? 'Basic'} puedes crear más${price ? ` por ${price.toFixed(2)}\u20AC/mes` : ''}.`;
    }
    if (sku === 'guests-per-event') {
      const nextQuota = nextLimit ? humanizeQuota(sku, nextLimit.free_quota) : '';
      return `Tu evento tiene el máximo de invitados. Actualiza para invitar a más${nextQuota ? ` (${nextQuota})` : ''}.`;
    }
    return getUpgradeMessage(sku, limit.free_quota, plan, availablePlans);
  }

  if (percentUsed >= 80) {
    if (sku === 'ai-tokens') {
      const remaining = Math.round(((100 - percentUsed) / 100) * limit.free_quota / 500);
      return `Te quedan ~${remaining} consultas IA. Actualiza tu plan para más.`;
    }
    return null;
  }

  if (percentUsed >= 50) {
    if (sku === 'ai-tokens') {
      return 'Has usado la mitad de tus consultas IA este mes.';
    }
    return null;
  }

  return null;
}

/**
 * Verifica si un feature está restringido por el plan.
 */
export function isFeatureRestricted(
  feature: 'api_access' | 'advanced_analytics' | 'priority_support' | 'white_label' | 'custom_integrations',
  restrictions: { [key: string]: boolean | number | null | undefined }
): boolean {
  return !restrictions[feature];
}

/**
 * Genera el mensaje de bienvenida para un plan Free.
 */
export function getWelcomeMessage(plan: { product_limits: PlanLimit[] }): string {
  const parts: string[] = [];

  const ai = plan.product_limits.find((l) => l.sku === 'ai-tokens');
  if (ai) parts.push(humanizeQuota('ai-tokens', ai.free_quota));

  const albums = plan.product_limits.find((l) => l.sku === 'memories-albums');
  if (albums) parts.push(`${albums.free_quota} álbum${albums.free_quota > 1 ? 'es' : ''} de fotos`);

  const events = plan.product_limits.find((l) => l.sku === 'events-count');
  if (events) parts.push(`${events.free_quota} evento${events.free_quota > 1 ? 's' : ''}`);

  if (parts.length === 0) return 'Bienvenido! Tienes acceso a las funcionalidades básicas gratis.';

  const lastPart = parts.pop();
  const joined = parts.length > 0 ? `${parts.join(', ')} y ${lastPart}` : lastPart;
  return `Bienvenido! Tienes acceso a ${joined} gratis.`;
}
