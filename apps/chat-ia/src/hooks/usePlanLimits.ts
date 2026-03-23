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
  used: number;
  limit: number;
  percent: number;
  color: string;
  humanized: string;
}

export interface UsePlanLimitsReturn {
  // Plan info
  subscription: UserSubscriptionInfo | null;
  plan: SubscriptionPlan | null;
  allPlans: SubscriptionPlan[];
  tier: SubscriptionTier;
  isFreePlan: boolean;
  isTrial: boolean;
  trialDaysLeft: number;
  upgradeTier: SubscriptionTier | null;

  // Loading
  loading: boolean;
  error: string | null;

  // SKU operations
  getLimit: (sku: string) => PlanLimit | null;
  canUse: (sku: string, currentUsage: number, quantity?: number) => AccessCheck;
  getUsage: (sku: string, currentUsage: number) => SkuUsage;
  humanQuota: (sku: string) => string;
  getUpgradeMsg: (sku: string, currentUsage: number) => string;
  getConversionMsg: (sku: string, percentUsed: number) => string | null;

  // Refetch
  refetch: () => Promise<void>;
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

  const getLimit = useCallback(
    (sku: string): PlanLimit | null => {
      return plan?.product_limits.find((l) => l.sku === sku) ?? null;
    },
    [plan],
  );

  const canUse = useCallback(
    (sku: string, currentUsage: number, quantity: number = 1): AccessCheck => {
      if (!plan) return { allowed: true, remaining: Infinity, limit: Infinity, percentUsed: 0, overageAvailable: false };
      return canAccess(sku, currentUsage + quantity - 1, plan);
    },
    [plan],
  );

  const getUsage = useCallback(
    (sku: string, currentUsage: number): SkuUsage => {
      const limit = plan?.product_limits.find((l) => l.sku === sku);
      const limitValue = limit?.free_quota ?? Infinity;
      const percent = usagePercent(currentUsage, limitValue);
      return {
        used: currentUsage,
        limit: limitValue,
        percent,
        color: usageColor(percent),
        humanized: humanizeUsage(sku, currentUsage, limitValue),
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
      if (!plan) return 'Actualiza tu plan.';
      return getUpgradeMessage(sku, currentUsage, plan, allPlans);
    },
    [plan, allPlans],
  );

  const getConversionMsg = useCallback(
    (sku: string, percentUsed: number): string | null => {
      if (!plan) return null;
      return getConversionMessage(sku, percentUsed, plan, allPlans);
    },
    [plan, allPlans],
  );

  // ========================================
  // RETURN
  // ========================================

  return {
    subscription,
    plan,
    allPlans,
    tier,
    isFreePlan,
    isTrial,
    trialDaysLeft,
    upgradeTier,
    loading,
    error,
    getLimit,
    canUse,
    getUsage,
    humanQuota,
    getUpgradeMsg,
    getConversionMsg,
    refetch,
  };
};

export default usePlanLimits;
