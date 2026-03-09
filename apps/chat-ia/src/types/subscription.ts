/**
 * Tipos para planes de suscripción
 */

export type Plans = 'free' | 'basic' | 'pro' | 'max' | 'enterprise' | 'ultimate' | 'premium';

export interface SubscriptionInfo {
  expiresAt?: Date;
  features?: string[];
  plan: Plans;
}
