/**
 * Tests del Admin Wallet Service
 * ================================
 * Simulan acciones del super admin gestionando wallets:
 * - Admin ve dashboard de estadísticas globales
 * - Admin consulta wallet de un usuario específico
 * - Admin revisa transacciones de un usuario
 * - Admin detecta wallets con saldo bajo
 * - Admin revisa tracking de uso por filtros
 * - Admin realiza recarga manual
 * - Admin añade bonus a un usuario
 * - Admin suspende y reactiva wallets
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminWalletService } from './admin-wallet';

vi.mock('./client', () => ({
  api2Client: { query: vi.fn() },
}));

import { api2Client } from './client';

const mockQuery = vi.mocked(api2Client.query);
let service: AdminWalletService;

beforeEach(() => {
  mockQuery.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  service = new AdminWalletService();
});

describe('Admin Wallet Service', () => {
  describe('Admin ve dashboard de estadísticas', () => {
    it('retorna stats globales de wallets', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_getStats: {
          active_wallets: 42,
          currency: 'USD',
          monthly_consumption: 1500.0,
          monthly_revenue: 3200.0,
          suspended_wallets: 3,
          total_balance: 8500.5,
          total_bonus_balance: 200.0,
          total_wallets: 45,
        },
      });

      const stats = await service.getStats();

      expect(stats?.total_wallets).toBe(45);
      expect(stats?.active_wallets).toBe(42);
      expect(stats?.suspended_wallets).toBe(3);
      expect(stats?.monthly_revenue).toBe(3200.0);
      expect(stats?.currency).toBe('USD');
    });

    it('retorna null si la API falla', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Forbidden'));

      const stats = await service.getStats();

      expect(stats).toBeNull();
    });
  });

  describe('Admin consulta wallet de usuario', () => {
    it('retorna wallet con balance y status', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_getUserWallet: {
          balance: 25.5,
          bonus_balance: 5.0,
          created_at: '2025-01-10',
          currency: 'USD',
          development: 'bodasdehoy',
          email: 'maria@example.com',
          status: 'ACTIVE',
          total_balance: 30.5,
          userId: 'user-1',
        },
      });

      const wallet = await service.getUserWallet('user-1');

      expect(wallet?.userId).toBe('user-1');
      expect(wallet?.balance).toBe(25.5);
      expect(wallet?.status).toBe('ACTIVE');
    });

    it('envía userId como variable', async () => {
      mockQuery.mockResolvedValueOnce({ wallet_getUserWallet: null });

      await service.getUserWallet('user-abc');

      const vars = mockQuery.mock.calls[0][1] as any;
      expect(vars.userId).toBe('user-abc');
    });

    it('retorna null si la API falla', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Not found'));

      const wallet = await service.getUserWallet('invalid');

      expect(wallet).toBeNull();
    });
  });

  describe('Admin revisa transacciones de usuario', () => {
    it('retorna transacciones paginadas', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_getUserTransactions: {
          hasMore: true,
          success: true,
          total: 100,
          transactions: [
            { _id: 'tx-1', amount: -0.5, type: 'CONSUMPTION' },
            { _id: 'tx-2', amount: 20.0, type: 'RECHARGE' },
          ],
        },
      });

      const result = await service.getUserTransactions('user-1', 1, 50);

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.total).toBe(100);
    });

    it('envía page y limit por defecto', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_getUserTransactions: { hasMore: false, success: true, total: 0, transactions: [] },
      });

      await service.getUserTransactions('user-1');

      const vars = mockQuery.mock.calls[0][1] as any;
      expect(vars.page).toBe(1);
      expect(vars.limit).toBe(50);
    });

    it('retorna vacío si la API falla', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Error'));

      const result = await service.getUserTransactions('user-1');

      expect(result.success).toBe(false);
      expect(result.transactions).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('Admin detecta wallets con saldo bajo', () => {
    it('retorna wallets bajo el threshold', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_getLowBalanceWallets: [
          { balance: 0.2, email: 'low@test.com', status: 'ACTIVE', total_balance: 0.2, userId: 'u-1' },
          { balance: 0.0, email: 'zero@test.com', status: 'ACTIVE', total_balance: 0.5, userId: 'u-2' },
        ],
      });

      const wallets = await service.getLowBalanceWallets(1.0);

      expect(wallets).toHaveLength(2);
      expect(wallets[0].balance).toBe(0.2);
    });

    it('usa threshold por defecto de 1.0', async () => {
      mockQuery.mockResolvedValueOnce({ wallet_getLowBalanceWallets: [] });

      await service.getLowBalanceWallets();

      const vars = mockQuery.mock.calls[0][1] as any;
      expect(vars.threshold).toBe(1.0);
    });

    it('retorna array vacío si la API falla', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Error'));

      const wallets = await service.getLowBalanceWallets();

      expect(wallets).toEqual([]);
    });

    it('retorna array vacío si el campo es null', async () => {
      mockQuery.mockResolvedValueOnce({ wallet_getLowBalanceWallets: null });

      const wallets = await service.getLowBalanceWallets();

      expect(wallets).toEqual([]);
    });
  });

  describe('Admin revisa tracking de uso', () => {
    it('retorna entries con filtros', async () => {
      mockQuery.mockResolvedValueOnce({
        getUsageTracking: {
          entries: [
            { _id: 'e-1', action: 'ai_chat', cost: 0.02, quantity: 1, userId: 'u-1' },
          ],
          hasMore: false,
          success: true,
          total: 1,
        },
      });

      const result = await service.getUsageTracking({
        action: 'ai_chat',
        userId: 'u-1',
      });

      expect(result.success).toBe(true);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].action).toBe('ai_chat');
    });

    it('envía defaults de paginación', async () => {
      mockQuery.mockResolvedValueOnce({
        getUsageTracking: { entries: [], hasMore: false, success: true, total: 0 },
      });

      await service.getUsageTracking({});

      const vars = mockQuery.mock.calls[0][1] as any;
      expect(vars.page).toBe(1);
      expect(vars.limit).toBe(50);
    });

    it('envía filtros de fecha y development', async () => {
      mockQuery.mockResolvedValueOnce({
        getUsageTracking: { entries: [], hasMore: false, success: true, total: 0 },
      });

      await service.getUsageTracking({
        development: 'bodasdehoy',
        endDate: '2025-12-31',
        startDate: '2025-01-01',
      });

      const vars = mockQuery.mock.calls[0][1] as any;
      expect(vars.development).toBe('bodasdehoy');
      expect(vars.startDate).toBe('2025-01-01');
      expect(vars.endDate).toBe('2025-12-31');
    });

    it('retorna vacío si la API falla', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Error'));

      const result = await service.getUsageTracking({});

      expect(result.success).toBe(false);
      expect(result.entries).toEqual([]);
    });
  });

  describe('Admin realiza recarga manual', () => {
    it('recarga exitosa retorna nuevo balance y transacción', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_manualRecharge: {
          new_balance: 70.0,
          success: true,
          transaction: { _id: 'tx-new', amount: 50.0, type: 'RECHARGE' },
        },
      });

      const result = await service.manualRecharge('user-1', 50.0, 'REF-123');

      expect(result.success).toBe(true);
      expect(result.new_balance).toBe(70.0);
      expect(result.transaction?._id).toBe('tx-new');
    });

    it('envía amount y reference como variables', async () => {
      mockQuery.mockResolvedValueOnce({ wallet_manualRecharge: { success: true } });

      await service.manualRecharge('user-1', 100, 'TRANSFER-456');

      const vars = mockQuery.mock.calls[0][1] as any;
      expect(vars.userId).toBe('user-1');
      expect(vars.amount).toBe(100);
      expect(vars.reference).toBe('TRANSFER-456');
    });

    it('retorna error con código API_ERROR si falla', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await service.manualRecharge('user-1', 50.0);

      expect(result.success).toBe(false);
      expect(result.error_code).toBe('API_ERROR');
      expect(result.error_message).toBe('Connection refused');
    });

    it('error no-Error retorna mensaje genérico', async () => {
      mockQuery.mockRejectedValueOnce('unexpected');

      const result = await service.manualRecharge('user-1', 50.0);

      expect(result.error_message).toBe('Error desconocido');
    });
  });

  describe('Admin añade bonus a usuario', () => {
    it('añade bonus exitosamente', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_addBonus: {
          new_balance: 35.0,
          success: true,
          transaction: { _id: 'tx-bonus', amount: 10.0, type: 'BONUS' },
        },
      });

      const result = await service.addBonus('user-1', 10.0, 'Bienvenida');

      expect(result.success).toBe(true);
      expect(result.new_balance).toBe(35.0);
    });

    it('envía description como variable', async () => {
      mockQuery.mockResolvedValueOnce({ wallet_addBonus: { success: true } });

      await service.addBonus('user-1', 5.0, 'Promo verano');

      const vars = mockQuery.mock.calls[0][1] as any;
      expect(vars.description).toBe('Promo verano');
      expect(vars.amount).toBe(5.0);
    });

    it('retorna error si falla', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Forbidden'));

      const result = await service.addBonus('user-1', 10.0);

      expect(result.success).toBe(false);
      expect(result.error_code).toBe('API_ERROR');
    });
  });

  describe('Admin suspende wallet', () => {
    it('suspende exitosamente con razón', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_suspend: { success: true },
      });

      const result = await service.suspendWallet('user-1', 'Fraude detectado');

      expect(result.success).toBe(true);
    });

    it('envía reason como variable', async () => {
      mockQuery.mockResolvedValueOnce({ wallet_suspend: { success: true } });

      await service.suspendWallet('user-1', 'Uso indebido');

      const vars = mockQuery.mock.calls[0][1] as any;
      expect(vars.userId).toBe('user-1');
      expect(vars.reason).toBe('Uso indebido');
    });

    it('retorna error si falla', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Already suspended'));

      const result = await service.suspendWallet('user-1');

      expect(result.success).toBe(false);
      expect(result.error_message).toBe('Already suspended');
    });
  });

  describe('Admin reactiva wallet', () => {
    it('reactiva exitosamente', async () => {
      mockQuery.mockResolvedValueOnce({
        wallet_reactivate: { success: true },
      });

      const result = await service.reactivateWallet('user-1');

      expect(result.success).toBe(true);
    });

    it('envía solo userId', async () => {
      mockQuery.mockResolvedValueOnce({ wallet_reactivate: { success: true } });

      await service.reactivateWallet('user-abc');

      const vars = mockQuery.mock.calls[0][1] as any;
      expect(vars.userId).toBe('user-abc');
    });

    it('retorna error si falla', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Wallet not found'));

      const result = await service.reactivateWallet('invalid');

      expect(result.success).toBe(false);
      expect(result.error_message).toBe('Wallet not found');
    });
  });
});
