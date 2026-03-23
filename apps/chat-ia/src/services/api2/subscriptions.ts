/**
 * Servicio de Planes de Suscripción — API2 GraphQL
 * =================================================
 * Obtiene el catálogo de planes disponibles.
 * getSubscriptionPlans es pública (no requiere auth).
 * Usuarios no-admin reciben automáticamente is_public: true, is_active: true.
 */

import { api2Client } from './client';

const DEFAULT_DEVELOPMENT =
  process.env.NEXT_PUBLIC_API2_DEVELOPMENT ??
  process.env.NEXT_PUBLIC_WHITELABEL ??
  'bodasdehoy';

// ========================================
// TYPES
// ========================================

export type SubscriptionTier = 'FREE' | 'BASIC' | 'PRO' | 'MAX' | 'ENTERPRISE' | 'CUSTOM';
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface PlanPricing {
  annual_discount_percent?: number;
  annual_fee?: number;
  monthly_fee: number;
  trial_days?: number;
}

export interface ProductLimit {
  free_quota: number;
  overage_enabled: boolean;
  overage_price?: number;
  service_name: string;
  sku: string;
}

export interface GlobalDiscount {
  applies_to: string;
  type: DiscountType;
  value: number;
}

export interface FeatureRestrictions {
  advanced_analytics: boolean;
  api_access: boolean;
  custom_integrations: boolean;
  max_storage_gb?: number;
  max_users?: number;
  priority_support: boolean;
  white_label: boolean;
}

export interface SubscriptionPlan {
  _id: string;
  created_at: string;
  description?: string;
  development: string;
  feature_restrictions: FeatureRestrictions;
  global_discount?: GlobalDiscount;
  is_active: boolean;
  is_public: boolean;
  name: string;
  plan_id: string;
  pricing: PlanPricing;
  product_limits: ProductLimit[];
  tier: SubscriptionTier;
  updated_at: string;
}

export interface UserSubscriptionInfo {
  _id: string;
  current_period_end: string;
  current_period_start: string;
  plan?: SubscriptionPlan;
  plan_id: string;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'TRIAL' | 'SUSPENDED';
  trial_end?: string;
  user_id: string;
}

// ========================================
// QUERIES
// ========================================

const GET_MY_SUBSCRIPTION_QUERY = `
  query GetMySubscription {
    getMySubscription {
      _id
      user_id
      plan_id
      status
      current_period_start
      current_period_end
      trial_end
      plan {
        _id
        plan_id
        name
        tier
      }
    }
  }
`;

const GET_SUBSCRIPTION_PLANS_QUERY = `
  query GetSubscriptionPlans($development: String!, $tier: SubscriptionTier, $is_public: Boolean) {
    getSubscriptionPlans(development: $development, tier: $tier, is_public: $is_public) {
      _id
      plan_id
      name
      description
      tier
      is_active
      is_public
      pricing {
        monthly_fee
        annual_fee
        annual_discount_percent
        trial_days
      }
      product_limits {
        sku
        service_name
        free_quota
        overage_price
        overage_enabled
      }
      global_discount {
        type
        value
        applies_to
      }
      feature_restrictions {
        max_users
        max_storage_gb
        api_access
        advanced_analytics
        priority_support
        white_label
        custom_integrations
      }
    }
  }
`;

// ========================================
// SERVICE
// ========================================

export async function getMySubscription(): Promise<UserSubscriptionInfo | null> {
  try {
    const data = await api2Client.query<{ getMySubscription: UserSubscriptionInfo | null }>(
      GET_MY_SUBSCRIPTION_QUERY
    );
    return data.getMySubscription ?? null;
  } catch (error) {
    console.error('[subscriptions] Error obteniendo suscripción actual:', error);
    return null;
  }
}

// ========================================
// MUTATIONS
// ========================================

export interface SubscribePlanResult {
  checkout_url?: string;
  plan_name?: string;
  session_id?: string;
  success: boolean;
}

export async function subscribeToPlan(
  planId: string,
  billingPeriod: 'monthly' | 'yearly' = 'monthly'
): Promise<SubscribePlanResult> {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const data = await api2Client.query<{ subscribeToPlan: SubscribePlanResult }>(
      `mutation SubscribeToPlan($plan_id: String!, $billing_period: String, $success_url: String!, $cancel_url: String!) {
        subscribeToPlan(plan_id: $plan_id, billing_period: $billing_period, success_url: $success_url, cancel_url: $cancel_url) {
          success checkout_url session_id plan_name
        }
      }`,
      {
        billing_period: billingPeriod,
        cancel_url: `${origin}/settings/billing/planes?cancelled=1`,
        plan_id: planId,
        success_url: `${origin}/settings/billing?upgraded=1`,
      }
    );
    return data.subscribeToPlan ?? { success: false };
  } catch (error) {
    console.error('[subscriptions] subscribeToPlan error:', error);
    return { success: false };
  }
}

export interface CancelSubscriptionResult {
  message?: string;
  success: boolean;
}

export async function cancelSubscription(): Promise<CancelSubscriptionResult> {
  try {
    const data = await api2Client.query<{ cancelSubscription: CancelSubscriptionResult }>(
      `mutation CancelSubscription {
        cancelSubscription {
          success message
        }
      }`
    );
    return data.cancelSubscription ?? { success: false };
  } catch (error) {
    console.error('[subscriptions] cancelSubscription error:', error);
    return { success: false };
  }
}

export interface CustomerPortalResult {
  portal_url?: string;
  success: boolean;
}

export async function createCustomerPortalSession(returnUrl?: string): Promise<CustomerPortalResult> {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const data = await api2Client.query<{ createCustomerPortalSession: CustomerPortalResult }>(
      `mutation CreateCustomerPortalSession($return_url: String!) {
        createCustomerPortalSession(return_url: $return_url) {
          success portal_url
        }
      }`,
      { return_url: returnUrl ?? `${origin}/settings/billing/planes` }
    );
    return data.createCustomerPortalSession ?? { success: false };
  } catch (error) {
    console.error('[subscriptions] createCustomerPortalSession error:', error);
    return { success: false };
  }
}

export async function getSubscriptionPlans(
  tier?: SubscriptionTier
): Promise<SubscriptionPlan[]> {
  try {
    const variables: Record<string, unknown> = {
      development: DEFAULT_DEVELOPMENT,
      is_public: true,
    };
    if (tier) variables.tier = tier;

    const data = await api2Client.query<{ getSubscriptionPlans: SubscriptionPlan[] }>(
      GET_SUBSCRIPTION_PLANS_QUERY,
      variables
    );
    return data.getSubscriptionPlans ?? [];
  } catch (error) {
    console.error('[subscriptions] Error obteniendo planes:', error);
    return [];
  }
}
