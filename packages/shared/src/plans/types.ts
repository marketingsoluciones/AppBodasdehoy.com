/**
 * Tipos compartidos para el sistema de planes de suscripción.
 * Alineados con la API2 GraphQL (SubscriptionPlan, ProductLimit, etc.)
 */

// ========================================
// SKUs conocidos en el sistema
// ========================================

export type PlanSku =
  | 'ai-tokens'
  | 'image-gen'
  | 'storage-gb'
  | 'whatsapp-msg'
  | 'memories-albums'
  | 'memories-photos'
  | 'events-count'
  | 'guests-per-event'
  | 'email-campaigns'
  | 'sms-invitations';

export type SubscriptionTier = 'FREE' | 'BASIC' | 'PRO' | 'MAX' | 'ENTERPRISE' | 'CUSTOM';
export type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED';

// ========================================
// Plan limits (product_limits de API2)
// ========================================

export interface PlanLimit {
  sku: string;
  service_name: string;
  free_quota: number;
  daily_quota?: number;
  overage_enabled: boolean;
  overage_price: number;
}

// ========================================
// Feature restrictions (feature_restrictions de API2)
// ========================================

export interface PlanRestrictions {
  max_users: number | null;
  max_storage_gb: number | null;
  api_access: boolean;
  advanced_analytics: boolean;
  priority_support: boolean;
  white_label: boolean;
  custom_integrations: boolean;
}

// ========================================
// Pricing (pricing de API2)
// ========================================

export interface PlanPricing {
  monthly_fee: number;
  annual_fee?: number;
  annual_discount_percent?: number;
  trial_days?: number;
}

// ========================================
// Plan completo
// ========================================

export interface SubscriptionPlan {
  _id: string;
  plan_id: string;
  name: string;
  description?: string;
  tier: SubscriptionTier;
  pricing: PlanPricing;
  product_limits: PlanLimit[];
  feature_restrictions: PlanRestrictions;
  is_active: boolean;
  is_public: boolean;
  development: string;
  created_at: string;
  updated_at: string;
}

// ========================================
// Suscripción del usuario
// ========================================

export interface UserSubscription {
  _id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  cancelled_at?: string;
  plan?: SubscriptionPlan;
}

// ========================================
// Resultado de verificación de acceso
// ========================================

export interface AccessCheck {
  allowed: boolean;
  remaining: number;
  limit: number;
  percentUsed: number;
  overageAvailable: boolean;
}

// ========================================
// Tier ordering para comparaciones
// ========================================

export const TIER_ORDER: Record<SubscriptionTier, number> = {
  FREE: 0,
  BASIC: 1,
  PRO: 2,
  MAX: 3,
  ENTERPRISE: 4,
  CUSTOM: 5,
};

export const TIER_LABELS: Record<SubscriptionTier, string> = {
  FREE: 'Gratuito',
  BASIC: 'Básico',
  PRO: 'Profesional',
  MAX: 'Máximo',
  ENTERPRISE: 'Empresa',
  CUSTOM: 'Personalizado',
};

export const TIER_COLORS: Record<SubscriptionTier, string> = {
  FREE: '#6b7280',
  BASIC: '#3b82f6',
  PRO: '#667eea',
  MAX: '#f59e0b',
  ENTERPRISE: '#10b981',
  CUSTOM: '#8b5cf6',
};

// ========================================
// Credit Packages
// ========================================

export interface CreditPackage {
  package_id: string;
  name: string;
  price: number;
  currency: string;
  credits_amount: number;
  bonus_credits: number;
  description?: string;
  is_active: boolean;
}
