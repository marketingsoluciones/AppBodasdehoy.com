'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useChatStore } from '@/store/chat';
import { safeLocalStorage } from '@/utils/safeLocalStorage';
import {
  getMySubscription,
  getSubscriptionPlans,
  type SubscriptionPlan,
  type UserSubscriptionInfo,
} from '@/services/mcpApi/subscriptions';
import {
  canAccess,
  getConversionMessage,
  getNextTier,
  getUpgradeMessage,
  humanizeQuota,
  humanizeUsage,
  usageColor,
  usagePercent,
  type AccessCheck,
  type PlanLimit,
  type SubscriptionTier,
} from '@bodasdehoy/shared/plans';

// ========================================
// TYPES
// ========================================

export interface SkuUsage {
  color: string;
  humanized: string;
  limit: number;
  percent: number;
  used: number;
}

export interface UsePlanLimitsReturn {
  allPlans: SubscriptionPlan[];
  canUse: (sku: string, currentUsage: number, quantity?: number) => AccessCheck;
  error: string | null;
  getConversionMsg: (sku: string, percentUsed: number) => string | null;
  // SKU operations
  getLimit: (sku: string) => PlanLimit | null;
  getUpgradeMsg: (sku: string, currentUsage: number) => string;
  getUsage: (sku: string, currentUsage: number) => SkuUsage;
  humanQuota: (sku: string) => string;

  isFreePlan: boolean;
  isTrial: boolean;

  // Loading
  loading: boolean;
  plan: SubscriptionPlan | null;
  // Refetch
  refetch: () => Promise<void>;
  // Plan info
  subscription: UserSubscriptionInfo | null;
  tier: SubscriptionTier;
  trialDaysLeft: number;

  upgradeTier: SubscriptionTier | null;
}

// ========================================
// HOOK
// ========================================

export const usePlanLimits = (): UsePlanLimitsReturn => {
  const currentUserId = useChatStore((s) => s.currentUserId);
  const hasApi2Token = useMemo(() => {
    if (typeof window === 'undefined') return false;

    const directToken = safeLocalStorage.getItem('jwt_token');
    if (directToken && directToken !== 'null' && directToken !== 'undefined') return true;

    const firebaseToken = safeLocalStorage.getItem('api2_jwt_token');
    if (firebaseToken && firebaseToken !== 'null' && firebaseToken !== 'undefined') return true;

    const cache = safeLocalStorage.getItem('jwt_token_cache');
    if (cache) {
      try {
        const parsed = JSON.parse(cache) as { expiry?: number; token?: string };
        if (parsed?.token && parsed?.expiry && Date.now() < parsed.expiry) return true;
      } catch {}
    }

    return false;
  }, [currentUserId]);
  const canQueryApi2 = hasApi2Token;

  const [subscription, setSubscription] = useState<UserSubscriptionInfo | null>(null);
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ========================================
  // FETCH
  // ========================================

  const refetch = useCallback(async () => {
    if (!canQueryApi2) {
      setSubscription(null);
      setAllPlans([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [sub, plans] = await Promise.all([
        getMySubscription(),
        getSubscriptionPlans(),
      ]);
      setSubscription(sub);
      setAllPlans(plans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando plan');
    } finally {
      setLoading(false);
    }
  }, [canQueryApi2]);

  useEffect(() => {
    if (!canQueryApi2) {
      refetch();
      return;
    }

    const start = () => void refetch();
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(start, { timeout: 4000 });
      return;
    }
    const t = setTimeout(start, 1000);
    return () => clearTimeout(t);
  }, [refetch]);

  // ========================================
  // COMPUTED
  // ========================================

  const plan = useMemo(() => {
    if (subscription?.plan) return subscription.plan as unknown as SubscriptionPlan;
    // Fallback: buscar el plan Free si no hay suscripción
    return allPlans.find((p) => p.tier === 'FREE') ?? null;
  }, [subscription, allPlans]);

  const tier: SubscriptionTier = plan?.tier ?? 'FREE';
  const isFreePlan = tier === 'FREE';

  const isTrial = subscription?.status === 'TRIAL';
  const trialDaysLeft = useMemo(() => {
    if (!isTrial || !subscription?.trial_end) return 0;
    const diff = new Date(subscription.trial_end).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [isTrial, subscription?.trial_end]);

  const upgradeTier = useMemo(() => getNextTier(tier), [tier]);

  // ========================================
  // SKU HELPERS
  // ========================================

  // Cast ProductLimit → PlanLimit: structurally identical; overage_price is optional in API response
  // Normalizar product_limits para evitar crashes cuando el backend no lo envía.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const planForUtils = useMemo(() => {
    if (!plan) return null as any;
    const product_limits = Array.isArray((plan as any).product_limits) ? (plan as any).product_limits : [];
    return { ...(plan as any), product_limits };
  }, [plan]);

  const getLimit = useCallback(
    (sku: string): PlanLimit | null => {
      return (planForUtils?.product_limits?.find((l: any) => l.sku === sku) as PlanLimit | undefined) ?? null;
    },
    [planForUtils],
  );

  const canUse = useCallback(
    (sku: string, currentUsage: number, quantity: number = 1): AccessCheck => {
      if (!planForUtils) return { allowed: true, limit: Infinity, overageAvailable: false, percentUsed: 0, remaining: Infinity };
      return canAccess(sku, currentUsage + quantity - 1, planForUtils);
    },
    [planForUtils],
  );

  const getUsage = useCallback(
    (sku: string, currentUsage: number): SkuUsage => {
      const limit = planForUtils?.product_limits?.find((l: any) => l.sku === sku);
      const limitValue = limit?.free_quota ?? Infinity;
      const percent = usagePercent(currentUsage, limitValue);
      return {
        color: usageColor(percent),
        humanized: humanizeUsage(sku, currentUsage, limitValue),
        limit: limitValue,
        percent,
        used: currentUsage,
      };
    },
    [planForUtils],
  );

  const humanQuota = useCallback(
    (sku: string): string => {
      const limit = planForUtils?.product_limits?.find((l: any) => l.sku === sku);
      if (!limit) return 'No disponible';
      return humanizeQuota(sku, limit.free_quota);
    },
    [planForUtils],
  );

  const getUpgradeMsg = useCallback(
    (sku: string, currentUsage: number): string => {
      if (!planForUtils) return 'Actualiza tu plan.';
      return getUpgradeMessage(sku, currentUsage, planForUtils, allPlans as any);
    },
    [planForUtils, allPlans],
  );

  const getConversionMsg = useCallback(
    (sku: string, percentUsed: number): string | null => {
      if (!planForUtils) return null;
      return getConversionMessage(sku, percentUsed, planForUtils, allPlans as any);
    },
    [planForUtils, allPlans],
  );

  // ========================================
  // RETURN
  // ========================================

  return {
    allPlans,
    canUse,
    error,
    getConversionMsg,
    getLimit,
    getUpgradeMsg,
    getUsage,
    humanQuota,
    isFreePlan,
    isTrial,
    loading,
    plan,
    refetch,
    subscription,
    tier,
    trialDaysLeft,
    upgradeTier,
  };
};

export default usePlanLimits;
