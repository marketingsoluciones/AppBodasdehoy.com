/**
 * Tests del Subscriptions Service
 * ================================
 * Simulan acciones reales del usuario con planes de suscripción:
 * - Usuario consulta su plan actual
 * - Usuario ve catálogo de planes disponibles
 * - Usuario se suscribe a un plan vía Stripe
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getMySubscription, getSubscriptionPlans, subscribeToPlan } from './subscriptions';

vi.mock('./client', () => ({
  mcpClient: { query: vi.fn() },
}));

import { mcpClient } from './client';

const mockQuery = vi.mocked(mcpClient.query);

beforeEach(() => {
  mockQuery.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('Subscriptions Service', () => {
  describe('Usuario consulta su plan actual', () => {
    it('retorna suscripción activa con info del plan', async () => {
      mockQuery.mockResolvedValueOnce({
        getMySubscription: {
          _id: 'sub-1',
          plan_id: 'plan-pro',
          status: 'ACTIVE',
          plan: { name: 'Profesional', tier: 'PRO' },
        },
      });

      const result = await getMySubscription();

      expect(result?.status).toBe('ACTIVE');
      expect(result?.plan?.name).toBe('Profesional');
    });

    it('retorna null si no tiene suscripción', async () => {
      mockQuery.mockResolvedValueOnce({ getMySubscription: null });

      const result = await getMySubscription();

      expect(result).toBeNull();
    });

    it('retorna null si la API falla', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Network error'));

      const result = await getMySubscription();

      expect(result).toBeNull();
    });
  });

  describe('Usuario ve catálogo de planes', () => {
    it('retorna planes públicos', async () => {
      mockQuery.mockResolvedValueOnce({
        getSubscriptionPlans: [
          { plan_id: 'free', name: 'Gratuito', tier: 'FREE', pricing: { monthly_fee: 0 } },
          { plan_id: 'pro', name: 'Profesional', tier: 'PRO', pricing: { monthly_fee: 29.99 } },
        ],
      });

      const plans = await getSubscriptionPlans();

      expect(plans).toHaveLength(2);
      expect(plans[0].tier).toBe('FREE');
      expect(plans[1].pricing.monthly_fee).toBe(29.99);
    });

    it('filtra por tier específico', async () => {
      mockQuery.mockResolvedValueOnce({ getSubscriptionPlans: [] });

      await getSubscriptionPlans('PRO');

      const vars = mockQuery.mock.calls[0][1] as any;
      expect(vars.tier).toBe('PRO');
      expect(vars.is_public).toBe(true);
    });

    it('retorna array vacío si la API falla', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Timeout'));

      const plans = await getSubscriptionPlans();

      expect(plans).toEqual([]);
    });
  });

  describe('Usuario se suscribe a un plan', () => {
    it('retorna checkout URL de Stripe', async () => {
      mockQuery.mockResolvedValueOnce({
        subscribeToPlan: {
          checkout_url: 'https://checkout.stripe.com/session/xyz',
          plan_name: 'Profesional',
          session_id: 'cs_xyz',
          success: true,
        },
      });

      const result = await subscribeToPlan('plan-pro', 'monthly');

      expect(result.success).toBe(true);
      expect(result.checkout_url).toContain('stripe.com');
    });

    it('envía billing_period y URLs de retorno', async () => {
      mockQuery.mockResolvedValueOnce({
        subscribeToPlan: { success: true },
      });

      await subscribeToPlan('plan-max', 'yearly');

      const vars = mockQuery.mock.calls[0][1] as any;
      expect(vars.plan_id).toBe('plan-max');
      expect(vars.billing_period).toBe('yearly');
      expect(vars.success_url).toContain('upgraded=1');
      expect(vars.cancel_url).toContain('cancelled=1');
    });

    it('retorna success=false si la API falla', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Error'));

      const result = await subscribeToPlan('plan-pro');

      expect(result.success).toBe(false);
    });
  });
});
