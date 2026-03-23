/**
 * usePlanLimits — Hook para verificar límites del plan desde API2.
 * Usa Firebase JWT (del AuthContext) para consultar la suscripción del usuario.
 */
import { useEffect, useMemo, useState } from 'react';
import { AuthContextProvider } from '../context';
import {
  canAccess,
  humanizeQuota,
  humanizeUsage,
  usageColor,
  usagePercent,
  getNextTier,
  type PlanLimit,
  type SubscriptionTier,
  TIER_LABELS,
} from '@bodasdehoy/shared/plans';

// ========================================
// TYPES
// ========================================

interface SubscriptionPlanData {
  _id: string;
  plan_id: string;
  name: string;
  tier: SubscriptionTier;
  is_active?: boolean;
  pricing: { monthly_fee: number; annual_fee?: number; trial_days?: number };
  product_limits: PlanLimit[];
  feature_restrictions: Record<string, any>;
}

export interface UsePlanLimitsReturn {
  plan: SubscriptionPlanData | null;
  allPlans: SubscriptionPlanData[];
  tier: SubscriptionTier;
  loading: boolean;
  // Event limits
  eventLimit: number;
  canCreateEvent: (currentCount: number) => boolean;
  eventUsage: (currentCount: number) => { text: string; percent: number; color: string };
  // Guest limits
  guestLimit: number;
  canAddGuest: (currentCount: number) => boolean;
  guestUsage: (currentCount: number) => { text: string; percent: number; color: string };
  // Communication limits
  canSendWhatsApp: boolean;
  whatsappLimit: number;
  canSendSMS: boolean;
  smsLimit: number;
  canSendEmail: (currentCount: number) => boolean;
  emailLimit: number;
  // Upgrade info
  nextTier: SubscriptionTier | null;
  nextPlan: SubscriptionPlanData | null;
  upgradeMessage: (sku: string) => string;
}

// ========================================
// API2 GraphQL
// ========================================

const API2_URL = process.env.NEXT_PUBLIC_API2_URL || 'https://api2.eventosorganizador.com/graphql';

async function graphqlQuery<T>(query: string, variables?: Record<string, unknown>, token?: string | null, development?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Development': development || 'bodasdehoy',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API2_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

const GET_MY_SUBSCRIPTION = `
  query GetMySubscription {
    getMySubscription {
      _id plan_id status trial_end
      plan {
        _id plan_id name tier
        pricing { monthly_fee annual_fee trial_days }
        product_limits { sku service_name free_quota overage_enabled overage_price }
        feature_restrictions { max_users max_storage_gb api_access advanced_analytics priority_support white_label custom_integrations }
      }
    }
  }
`;

const GET_PUBLIC_PLANS = `
  query GetSubscriptionPlans($development: String!) {
    getSubscriptionPlans(development: $development, is_public: true) {
      _id plan_id name tier
      pricing { monthly_fee annual_fee trial_days }
      product_limits { sku service_name free_quota overage_enabled overage_price }
      feature_restrictions { max_users max_storage_gb }
    }
  }
`;

// ========================================
// HOOK
// ========================================

export function usePlanLimits(): UsePlanLimitsReturn {
  const { user, config } = AuthContextProvider();
  const [plan, setPlan] = useState<SubscriptionPlanData | null>(null);
  const [allPlans, setAllPlans] = useState<SubscriptionPlanData[]>([]);
  const [loading, setLoading] = useState(true);

  const development = config?.development || 'bodasdehoy';
  const isAuthenticated = !!user?.uid && user.displayName !== 'guest';

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Fetch public plans
        const plansData = await graphqlQuery<{ getSubscriptionPlans: SubscriptionPlanData[] }>(
          GET_PUBLIC_PLANS,
          { development },
          null,
          development
        );
        if (cancelled) return;
        setAllPlans(plansData.getSubscriptionPlans ?? []);

        // Fetch user subscription if authenticated
        if (isAuthenticated) {
          // Get Firebase token
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
          const token = await auth.currentUser?.getIdToken();

          if (token && !cancelled) {
            try {
              const subData = await graphqlQuery<{ getMySubscription: { plan?: SubscriptionPlanData } | null }>(
                GET_MY_SUBSCRIPTION,
                undefined,
                token,
                development
              );
              if (!cancelled && subData.getMySubscription?.plan) {
                setPlan(subData.getMySubscription.plan);
                return;
              }
            } catch {
              // Fall through to free plan
            }
          }
        }

        // Fallback: Free plan
        if (!cancelled) {
          const freePlan = plansData.getSubscriptionPlans?.find((p) => p.tier === 'FREE') ?? null;
          setPlan(freePlan);
        }
      } catch (err) {
        console.error('[usePlanLimits] Error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [isAuthenticated, development]);

  const tier: SubscriptionTier = plan?.tier ?? 'FREE';
  const nextTier = useMemo(() => getNextTier(tier), [tier]);
  const nextPlan = useMemo(() => allPlans.find((p) => p.tier === nextTier) ?? null, [allPlans, nextTier]);

  // ========================================
  // SKU helpers
  // ========================================

  const getSkuLimit = (sku: string) => plan?.product_limits.find((l) => l.sku === sku)?.free_quota ?? 0;

  const eventLimit = getSkuLimit('events-count') || 1;
  const guestLimit = getSkuLimit('guests-per-event') || 50;
  const whatsappLimit = getSkuLimit('whatsapp-msg');
  const smsLimit = getSkuLimit('sms-invitations');
  const emailLimit = getSkuLimit('email-campaigns') || 10;

  const canCreateEvent = (currentCount: number) => {
    if (!plan) return currentCount < 1;
    return canAccess('events-count', currentCount, plan).allowed;
  };

  const canAddGuest = (currentCount: number) => {
    if (!plan) return currentCount < 50;
    return canAccess('guests-per-event', currentCount, plan).allowed;
  };

  const canSendWhatsApp = whatsappLimit > 0;
  const canSendSMS = smsLimit > 0;

  const canSendEmail = (currentCount: number) => {
    if (!plan) return currentCount < 10;
    return canAccess('email-campaigns', currentCount, plan).allowed;
  };

  const eventUsage = (currentCount: number) => {
    const percent = usagePercent(currentCount, eventLimit);
    return {
      text: humanizeUsage('events-count', currentCount, eventLimit),
      percent,
      color: usageColor(percent),
    };
  };

  const guestUsage = (currentCount: number) => {
    const percent = usagePercent(currentCount, guestLimit);
    return {
      text: humanizeUsage('guests-per-event', currentCount, guestLimit),
      percent,
      color: usageColor(percent),
    };
  };

  const upgradeMessage = (sku: string) => {
    if (!nextPlan) return 'Actualiza tu plan para más funcionalidades.';
    const nextLimit = nextPlan.product_limits.find((l) => l.sku === sku);
    const quota = nextLimit ? humanizeQuota(sku, nextLimit.free_quota) : '';
    const price = nextPlan.pricing.monthly_fee;
    return `Con ${nextPlan.name} puedes tener ${quota} por ${price.toFixed(2)}\u20AC/mes.`;
  };

  return {
    plan,
    allPlans,
    tier,
    loading,
    eventLimit,
    canCreateEvent,
    eventUsage,
    guestLimit,
    canAddGuest,
    guestUsage,
    canSendWhatsApp,
    whatsappLimit,
    canSendSMS,
    smsLimit,
    canSendEmail,
    emailLimit,
    nextTier,
    nextPlan,
    upgradeMessage,
  };
}
