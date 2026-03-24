/**
 * Tests del Wallet Service
 * ========================
 * Simulan las acciones reales del usuario con el sistema de saldo:
 * - Usuario consulta su saldo disponible
 * - Usuario verifica si tiene saldo para usar IA
 * - Usuario consulta precio de un servicio
 * - Usuario recarga saldo vía Stripe Checkout
 * - El sistema consume saldo al usar servicios de IA
 * - Backend no disponible → error controlado sin crash
 * - Error UNAUTHORIZED al recargar → mensaje amigable
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SERVICE_SKUS, WalletService } from './wallet';

// ─── Mock del client GraphQL ─────────────────────────────

vi.mock('./client', () => ({
  api2Client: {
    query: vi.fn(),
  },
}));

import { api2Client } from './client';

const mockQuery = vi.mocked(api2Client.query);

let wallet: WalletService;

beforeEach(() => {
  mockQuery.mockReset();
  wallet = new WalletService();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// ─── Tests ───────────────────────────────────────────────

describe('Wallet Service', () => {
  // ━━━ Usuario consulta su saldo ━━━

  describe('Usuario consulta su saldo', () => {
    it('retorna balance, bonus y total correctamente', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_getBalance: {
          balance: 25.50,
          bonus_balance: 5.00,
          currency: 'EUR',
          status: 'ACTIVE',
          success: true,
          total_balance: 30.50,
        },
      });

      const result = await wallet.getBalance();

      expect(result.success).toBe(true);
      expect(result.balance).toBe(25.50);
      expect(result.bonus_balance).toBe(5.00);
      expect(result.total_balance).toBe(30.50);
      expect(result.currency).toBe('EUR');
      expect(result.status).toBe('ACTIVE');
    });

    it('retorna saldo 0 con error si el backend falla', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Network error'));

      const result = await wallet.getBalance();

      expect(result.success).toBe(false);
      expect(result.balance).toBe(0);
      expect(result.total_balance).toBe(0);
      expect(result.error).toBe('Network error');
    });
  });

  // ━━━ Usuario verifica saldo antes de usar IA ━━━

  describe('Usuario verifica si tiene saldo para usar IA', () => {
    it('allowed=true cuando tiene saldo suficiente', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_checkBalance: {
          allowed: true,
          balance: 25.00,
          required_amount: 0.05,
          shortfall: 0,
          total_balance: 25.00,
        },
      });

      const result = await wallet.checkBalance(0.05);

      expect(result.allowed).toBe(true);
      expect(result.shortfall).toBe(0);
    });

    it('allowed=false cuando no tiene saldo, incluye recharge_url', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_checkBalance: {
          allowed: false,
          balance: 0.01,
          error_code: 'INSUFFICIENT_BALANCE',
          error_message: 'Saldo insuficiente',
          recharge_url: 'https://checkout.stripe.com/session/123',
          required_amount: 0.05,
          shortfall: 0.04,
          total_balance: 0.01,
        },
      });

      const result = await wallet.checkBalance(0.05);

      expect(result.allowed).toBe(false);
      expect(result.shortfall).toBe(0.04);
      expect(result.recharge_url).toContain('stripe.com');
    });

    it('retorna error controlado si la API falla', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Timeout'));

      const result = await wallet.checkBalance(1.00);

      expect(result.allowed).toBe(false);
      expect(result.error_code).toBe('API_ERROR');
      expect(result.error_message).toBe('Timeout');
    });
  });

  // ━━━ Usuario consulta precio de servicio ━━━

  describe('Usuario consulta precio de un servicio', () => {
    it('retorna precio con descuento aplicado', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_getServicePrice: {
          base_price: 0.10,
          currency: 'EUR',
          discount_applied: true,
          discount_percentage: 20,
          final_price: 0.08,
          name: 'Claude Sonnet',
          sku: 'SRV-AI-ANTHROPIC-SONNET',
          unit: 'request',
        },
      });

      const result = await wallet.getServicePrice('SRV-AI-ANTHROPIC-SONNET');

      expect(result.final_price).toBe(0.08);
      expect(result.discount_applied).toBe(true);
      expect(result.discount_percentage).toBe(20);
    });

    it('envía quantity como variable', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_getServicePrice: {
          base_price: 0.50,
          currency: 'EUR',
          discount_applied: false,
          final_price: 2.50,
          name: 'DALL-E 3',
          sku: 'SRV-AI-IMAGE-DALLE3',
          unit: 'image',
        },
      });

      await wallet.getServicePrice('SRV-AI-IMAGE-DALLE3', 5);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('GetServicePrice'),
        { quantity: 5, sku: 'SRV-AI-IMAGE-DALLE3' },
      );
    });
  });

  // ━━━ Usuario recarga saldo vía Stripe ━━━

  describe('Usuario recarga saldo vía Stripe', () => {
    it('crea sesión de checkout y retorna URL', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_createRechargeSession: {
          checkout_url: 'https://checkout.stripe.com/session/abc123',
          session_id: 'cs_abc123',
          success: true,
        },
      });

      const result = await wallet.createRechargeSession(
        10.00,
        'https://app.bodasdehoy.com/billing?success=1',
        'https://app.bodasdehoy.com/billing?cancel=1',
        'user@boda.com',
      );

      expect(result.success).toBe(true);
      expect(result.checkout_url).toContain('stripe.com');
      expect(result.session_id).toBe('cs_abc123');
    });

    it('incluye customer_email en el input solo si se proporciona', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_createRechargeSession: { success: true, checkout_url: 'https://x' },
      });

      await wallet.createRechargeSession(5, 'https://ok', 'https://cancel');

      const input = (mockQuery.mock.calls[0][1]! as any).input;
      expect(input.customer_email).toBeUndefined();
      expect(input.amount).toBe(5);
    });

    it('UNAUTHORIZED retorna mensaje amigable en español', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_createRechargeSession: {
          error_code: 'UNAUTHORIZED',
          error_message: 'UNAUTHORIZED',
          success: false,
        },
      });

      const result = await wallet.createRechargeSession(10, 'https://ok', 'https://cancel');

      expect(result.success).toBe(false);
      expect(result.error_message).toContain('iniciar sesión');
    });

    it('error de red retorna error controlado', async () => {
      mockQuery.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const result = await wallet.createRechargeSession(10, 'https://ok', 'https://cancel');

      expect(result.success).toBe(false);
      expect(result.error_code).toBe('API_ERROR');
    });
  });

  // ━━━ Sistema consume saldo al usar IA ━━━

  describe('Sistema consume saldo al usar servicios de IA', () => {
    it('consume exitosamente y retorna nuevo balance', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_checkAndConsume: {
          new_balance: 24.95,
          success: true,
          transaction: {
            _id: 'tx-001',
            amount: -0.05,
            balance_after: 24.95,
            description: 'Claude Sonnet - 1 request',
            service_sku: 'SRV-AI-ANTHROPIC-SONNET',
            type: 'CONSUMPTION',
          },
        },
      });

      const result = await wallet.checkAndConsume(
        'SRV-AI-ANTHROPIC-SONNET',
        1,
        'Chat message processing',
      );

      expect(result.success).toBe(true);
      expect(result.new_balance).toBe(24.95);
      expect(result.transaction?.type).toBe('CONSUMPTION');
    });

    it('rechaza consumo por saldo insuficiente', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_checkAndConsume: {
          balance_check: {
            allowed: false,
            error_code: 'INSUFFICIENT_BALANCE',
            recharge_url: 'https://checkout.stripe.com/x',
            required_amount: 0.50,
            shortfall: 0.49,
            total_balance: 0.01,
          },
          error_code: 'INSUFFICIENT_BALANCE',
          success: false,
        },
      });

      const result = await wallet.checkAndConsume('SRV-AI-IMAGE-DALLE3');

      expect(result.success).toBe(false);
      expect(result.balance_check?.allowed).toBe(false);
      expect(result.balance_check?.recharge_url).toContain('stripe.com');
    });

    it('envía description y metadata opcionales', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_checkAndConsume: { success: true, new_balance: 10 },
      });

      await wallet.checkAndConsume(
        'SRV-AI-OPENAI-GPT4O',
        2,
        'Group chat analysis',
        { session_id: 'sess-123' },
      );

      const input = (mockQuery.mock.calls[0][1]! as any).input;
      expect(input.service_sku).toBe('SRV-AI-OPENAI-GPT4O');
      expect(input.quantity).toBe(2);
      expect(input.description).toBe('Group chat analysis');
      expect(input.metadata).toEqual({ session_id: 'sess-123' });
    });
  });

  // ━━━ Transacciones ━━━

  describe('Usuario consulta historial de transacciones', () => {
    it('retorna lista paginada de transacciones', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_getTransactions: {
          hasMore: true,
          success: true,
          total: 50,
          transactions: [
            { _id: 'tx-1', amount: 10, type: 'RECHARGE', description: 'Recarga Stripe' },
            { _id: 'tx-2', amount: -0.05, type: 'CONSUMPTION', description: 'Claude Sonnet' },
          ],
        },
      });

      const result = await wallet.getTransactions(1, 20);

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.total).toBe(50);
    });

    it('filtra por tipo de transacción', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_getTransactions: { success: true, transactions: [], total: 0, hasMore: false },
      });

      await wallet.getTransactions(1, 10, 'RECHARGE');

      const vars = mockQuery.mock.calls[0][1];
      expect(vars?.filter).toEqual({ type: 'RECHARGE' });
    });

    it('retorna array vacío si la API falla', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Timeout'));

      const result = await wallet.getTransactions();

      expect(result.success).toBe(false);
      expect(result.transactions).toEqual([]);
    });
  });

  // ━━━ Métodos de pago ━━━

  describe('Métodos de pago guardados', () => {
    it('retorna tarjetas guardadas en Stripe', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_getPaymentMethods: [
          { id: 'pm_1', brand: 'visa', last4: '4242', is_default: true },
          { id: 'pm_2', brand: 'mastercard', last4: '8888', is_default: false },
        ],
      });

      const methods = await wallet.getPaymentMethods();

      expect(methods).toHaveLength(2);
      expect(methods[0].brand).toBe('visa');
      expect(methods[0].is_default).toBe(true);
    });

    it('retorna array vacío si la API falla', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Error'));

      const methods = await wallet.getPaymentMethods();

      expect(methods).toEqual([]);
    });
  });

  // ━━━ Auto-recarga ━━━

  describe('Configuración de auto-recarga', () => {
    it('obtiene configuración actual', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_getAutoRechargeConfig: {
          amount: 10,
          enabled: true,
          payment_method_id: 'pm_1',
          threshold: 2,
        },
      });

      const config = await wallet.getAutoRechargeConfig();

      expect(config?.enabled).toBe(true);
      expect(config?.threshold).toBe(2);
      expect(config?.amount).toBe(10);
    });

    it('habilita auto-recarga con parámetros', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_configureAutoRecharge: { success: true },
      });

      const result = await wallet.configureAutoRecharge(true, 2, 10, 'pm_1');

      expect(result.success).toBe(true);
      const input = (mockQuery.mock.calls[0][1]! as any).input;
      expect(input.enabled).toBe(true);
      expect(input.threshold).toBe(2);
      expect(input.amount).toBe(10);
      expect(input.payment_method_id).toBe('pm_1');
    });

    it('deshabilita auto-recarga enviando solo enabled=false', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_configureAutoRecharge: { success: true },
      });

      await wallet.configureAutoRecharge(false);

      const input = (mockQuery.mock.calls[0][1]! as any).input;
      expect(input.enabled).toBe(false);
      expect(input.threshold).toBeUndefined();
    });
  });

  // ━━━ SERVICE_SKUS ━━━

  describe('SERVICE_SKUS constantes', () => {
    it('contiene SKUs de IA', () => {
      expect(SERVICE_SKUS.AI_ANTHROPIC_SONNET).toBe('SRV-AI-ANTHROPIC-SONNET');
      expect(SERVICE_SKUS.AI_OPENAI_GPT4O).toBe('SRV-AI-OPENAI-GPT4O');
      expect(SERVICE_SKUS.AI_IMAGE_DALLE3).toBe('SRV-AI-IMAGE-DALLE3');
    });

    it('contiene SKUs de comunicaciones', () => {
      expect(SERVICE_SKUS.WHATSAPP_OUTBOUND).toBe('SRV-WHATSAPP-MSG-OUTBOUND');
      expect(SERVICE_SKUS.SMS_ES).toBe('SRV-SMS-TWILIO-ES');
      expect(SERVICE_SKUS.EMAIL_SEND).toBe('SRV-EMAIL-SES-SEND');
    });
  });
});
