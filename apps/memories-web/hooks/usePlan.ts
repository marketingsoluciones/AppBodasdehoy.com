/**
 * usePlan — Hook para verificar el plan del usuario desde API2.
 * Usa AuthBridge para obtener el JWT y consulta getMySubscription + getPublicSubscriptionPlans.
 */
import { useEffect, useMemo, useState } from 'react';
import { authBridge } from '@bodasdehoy/shared';
import {
  canAccess,
  humanizeQuota,
  humanizeUsage,
  usageColor,
  usagePercent,
  type PlanLimit,
  type SubscriptionTier,
} from '@bodasdehoy/shared/plans';

// ========================================
// TYPES
// ========================================

interface SubscriptionPlanData {
  _id: string;
  plan_id: string;
  name: string;
  description?: string;
  tier: SubscriptionTier;
  pricing: { monthly_fee: number; annual_fee?: number; annual_discount_percent?: number; trial_days?: number };
  product_limits: PlanLimit[];
  feature_restrictions: Record<string, any>;
  is_active: boolean;
  is_public: boolean;
}

interface UserSubscriptionData {
  _id: string;
  plan_id: string;
  status: string;
  plan?: SubscriptionPlanData;
  trial_end?: string;
}

export interface UsePlanReturn {
  plan: SubscriptionPlanData | null;
  allPlans: SubscriptionPlanData[];
  tier: SubscriptionTier;
  loading: boolean;
  // Album limits
  albumLimit: number;
  canCreateAlbum: (currentCount: number) => boolean;
  albumUsage: (currentCount: number) => { text: string; percent: number; color: string };
  // Photo limits
  photoLimit: number;
  canUploadPhoto: (currentCount: number) => boolean;
  photoUsage: (currentCount: number) => { text: string; percent: number; color: string };
}

// ========================================
// API2 GraphQL calls
// ========================================

const API2_URL = process.env.NEXT_PUBLIC_API2_URL || 'https://api2.eventosorganizador.com/graphql';
const DEVELOPMENT = (process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy').trim();

async function graphqlQuery<T>(query: string, variables?: Record<string, unknown>, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Development': DEVELOPMENT,
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
      _id
      plan_id
      status
      trial_end
      plan {
        _id plan_id name description tier is_active is_public
        pricing { monthly_fee annual_fee annual_discount_percent trial_days }
        product_limits { sku service_name free_quota overage_enabled overage_price }
        feature_restrictions { max_users max_storage_gb api_access advanced_analytics priority_support white_label custom_integrations }
      }
    }
  }
`;

const GET_PUBLIC_PLANS = `
  query GetSubscriptionPlans($development: String!) {
    getSubscriptionPlans(development: $development, is_public: true) {
      _id plan_id name description tier is_active is_public
      pricing { monthly_fee annual_fee annual_discount_percent trial_days }
      product_limits { sku service_name free_quota overage_enabled overage_price }
      feature_restrictions { max_users max_storage_gb api_access advanced_analytics priority_support white_label custom_integrations }
    }
  }
`;

// ========================================
// HOOK
// ========================================

export function usePlan(): UsePlanReturn {
  const [plan, setPlan] = useState<SubscriptionPlanData | null>(null);
  const [allPlans, setAllPlans] = useState<SubscriptionPlanData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const authState = authBridge.getSharedAuthState();
        const token = authState.idToken;

        // Fetch public plans always
        const plansData = await graphqlQuery<{ getSubscriptionPlans: SubscriptionPlanData[] }>(
          GET_PUBLIC_PLANS,
          { development: DEVELOPMENT }
        );
        if (cancelled) return;
        setAllPlans(plansData.getSubscriptionPlans ?? []);

        // Fetch user subscription if authenticated
        if (token) {
          try {
            const subData = await graphqlQuery<{ getMySubscription: UserSubscriptionData | null }>(
              GET_MY_SUBSCRIPTION,
              undefined,
              token
            );
            if (!cancelled && subData.getMySubscription?.plan) {
              setPlan(subData.getMySubscription.plan);
              return;
            }
          } catch {
            // Fall through to free plan
          }
        }

        // Fallback: Free plan
        if (!cancelled) {
          const freePlan = plansData.getSubscriptionPlans?.find((p) => p.tier === 'FREE') ?? null;
          setPlan(freePlan);
        }
      } catch (err) {
        console.error('[usePlan] Error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const tier: SubscriptionTier = plan?.tier ?? 'FREE';

  const albumLimit = useMemo(() => {
    const limit = plan?.product_limits.find((l) => l.sku === 'memories-albums');
    return limit?.free_quota ?? 1;
  }, [plan]);

  const photoLimit = useMemo(() => {
    const limit = plan?.product_limits.find((l) => l.sku === 'memories-photos');
    return limit?.free_quota ?? 50;
  }, [plan]);

  const canCreateAlbum = (currentCount: number) => {
    if (!plan) return currentCount < 1;
    return canAccess('memories-albums', currentCount, plan).allowed;
  };

  const canUploadPhoto = (currentCount: number) => {
    if (!plan) return currentCount < 50;
    return canAccess('memories-photos', currentCount, plan).allowed;
  };

  const albumUsage = (currentCount: number) => {
    const percent = usagePercent(currentCount, albumLimit);
    return {
      text: humanizeUsage('memories-albums', currentCount, albumLimit),
      percent,
      color: usageColor(percent),
    };
  };

  const photoUsage = (currentCount: number) => {
    const percent = usagePercent(currentCount, photoLimit);
    return {
      text: humanizeUsage('memories-photos', currentCount, photoLimit),
      percent,
      color: usageColor(percent),
    };
  };

  return {
    plan,
    allPlans,
    tier,
    loading,
    albumLimit,
    canCreateAlbum,
    albumUsage,
    photoLimit,
    canUploadPhoto,
    photoUsage,
  };
}
