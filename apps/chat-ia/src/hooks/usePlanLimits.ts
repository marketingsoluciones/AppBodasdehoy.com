'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useChatStore } from '@/store/chat';
import {
  getMySubscription,
  getSubscriptionPlans,
  type SubscriptionPlan,
  type UserSubscriptionInfo,
} from '@/services/api2/subscriptions';
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
  const isAuthenticated = !!(currentUserId && currentUserId !== 'visitante@guest.local');

  const [subscription, setSubscription] = useState<UserSubscriptionInfo | null>(null);
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ========================================
  // FETCH
  // ========================================

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sub, plans] = await Promise.all([
        isAuthenticated ? getMySubscription() : null,
        getSubscriptionPlans(),
      ]);
      setSubscription(sub);
      setAllPlans(plans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando plan');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refetch();
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const planForUtils = plan as any;

  const getLimit = useCallback(
    (sku: string): PlanLimit | null => {
      return (plan?.product_limits.find((l) => l.sku === sku) as PlanLimit | undefined) ?? null;
    },
    [plan],
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
      const limit = plan?.product_limits.find((l) => l.sku === sku);
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
    [plan],
  );

  const humanQuota = useCallback(
    (sku: string): string => {
      const limit = plan?.product_limits.find((l) => l.sku === sku);
      if (!limit) return 'No disponible';
      return humanizeQuota(sku, limit.free_quota);
    },
    [plan],
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
