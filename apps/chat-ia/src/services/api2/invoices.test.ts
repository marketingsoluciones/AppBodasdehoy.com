/**
 * Tests del Invoices Service
 * ==========================
 * Simulan las acciones reales del usuario en la sección de facturación:
 * - Usuario consulta sus facturas
 * - Usuario descarga PDF de una factura
 * - Usuario ve historial de pagos
 * - Usuario consulta estadísticas de uso por período
 * - Backend devuelve "Cannot query field" → fallback vacío silencioso
 * - Cálculo de fechas para cada período (TODAY, THIS_WEEK, etc.)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  INVOICE_STATUS_LABELS,
  InvoicesService,
  PAYMENT_TYPE_LABELS,
  PLAN_TIER_LABELS,
} from './invoices';

// ─── Mock del client GraphQL ─────────────────────────────

vi.mock('./client', () => ({
  api2Client: {
    query: vi.fn(),
  },
}));

import { api2Client } from './client';

const mockQuery = vi.mocked(api2Client.query);

let service: InvoicesService;

beforeEach(() => {
  mockQuery.mockReset();
  service = new InvoicesService();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

// ─── Tests ───────────────────────────────────────────────

describe('Invoices Service', () => {
  // ━━━ Facturas ━━━

  describe('Usuario consulta sus facturas', () => {
    it('retorna lista paginada de facturas', async () => {
      mockQuery.mockResolvedValueOnce({
        getInvoices: {
          invoices: [
            { _id: 'inv-1', invoice_number: 'INV-2025-001', total: 25.50, status: 'PAID' },
          ],
          pagination: { limit: 20, page: 1, total: 1, totalPages: 1 },
          success: true,
        },
      });

      const result = await service.getInvoices();

      expect(result.success).toBe(true);
      expect(result.invoices).toHaveLength(1);
      expect(result.invoices[0].invoice_number).toBe('INV-2025-001');
    });

    it('filtra por status', async () => {
      mockQuery.mockResolvedValueOnce({
        getInvoices: {
          invoices: [],
          pagination: { limit: 20, page: 1, total: 0, totalPages: 0 },
          success: true,
        },
      });

      await service.getInvoices(1, 20, 'PAID');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('GetInvoices'),
        { limit: 20, page: 1, status: 'PAID' },
      );
    });

    it('"Cannot query field" retorna vacío silencioso (campo no existe en API2 aún)', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Cannot query field "getInvoices"'));

      const result = await service.getInvoices();

      expect(result.success).toBe(true);
      expect(result.invoices).toEqual([]);
    });

    it('otro error retorna success=false con mensaje', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.getInvoices();

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Network error');
    });
  });

  // ━━━ Detalle de factura ━━━

  describe('Usuario ve detalle de una factura', () => {
    it('retorna factura por ID', async () => {
      mockQuery.mockResolvedValueOnce({
        getInvoiceById: {
          invoice: { _id: 'inv-1', total: 25.50, status: 'PAID' },
          success: true,
        },
      });

      const result = await service.getInvoiceById('inv-1');

      expect(result.success).toBe(true);
      expect(result.invoice?.total).toBe(25.50);
    });
  });

  // ━━━ PDF ━━━

  describe('Usuario descarga PDF de factura', () => {
    it('retorna URL del PDF', async () => {
      mockQuery.mockResolvedValueOnce({
        getInvoicePDF: {
          expires_at: '2025-06-15T12:00:00Z',
          pdf_url: 'https://storage.example.com/invoices/inv-1.pdf',
          success: true,
        },
      });

      const result = await service.getInvoicePDF('inv-1');

      expect(result.success).toBe(true);
      expect(result.pdf_url).toContain('.pdf');
    });

    it('error retorna success=false con mensaje', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Not found'));

      const result = await service.getInvoicePDF('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error_message).toBe('Not found');
    });
  });

  // ━━━ Historial de pagos ━━━

  describe('Usuario ve historial de pagos', () => {
    it('retorna pagos con paginación', async () => {
      mockQuery.mockResolvedValueOnce({
        getPaymentHistory: {
          pagination: { limit: 20, page: 1, total: 2, totalPages: 1 },
          payments: [
            { _id: 'pay-1', amount: 10, type: 'WALLET_RECHARGE' },
            { _id: 'pay-2', amount: 25, type: 'SUBSCRIPTION_PAYMENT' },
          ],
          success: true,
        },
      });

      const result = await service.getPaymentHistory();

      expect(result.payments).toHaveLength(2);
      expect(result.payments[0].type).toBe('WALLET_RECHARGE');
    });

    it('"Cannot query field" retorna vacío silencioso', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Cannot query field "getPaymentHistory"'));

      const result = await service.getPaymentHistory();

      expect(result.success).toBe(true);
      expect(result.payments).toEqual([]);
    });
  });

  // ━━━ Suscripción ━━━

  describe('Usuario consulta su suscripción', () => {
    it('retorna suscripción activa', async () => {
      mockQuery.mockResolvedValueOnce({
        getMySubscription: {
          _id: 'sub-1',
          plan_id: 'plan-pro',
          status: 'ACTIVE',
        },
      });

      const result = await service.getSubscription();

      expect(result.success).toBe(true);
      expect(result.subscription?.status).toBe('ACTIVE');
    });

    it('retorna success sin suscripción cuando es null', async () => {
      mockQuery.mockResolvedValueOnce({ getMySubscription: null });

      const result = await service.getSubscription();

      expect(result.success).toBe(true);
      expect(result.subscription).toBeUndefined();
    });
  });

  // ━━━ Estadísticas de uso ━━━

  describe('Usuario consulta estadísticas de uso', () => {
    it('retorna stats con totalCost y actionCounts', async () => {
      mockQuery.mockResolvedValueOnce({
        getUsageStats: {
          stats: {
            actionCounts: [{ action: 'chat', count: 50, cost: 2.5, tokens: 5000 }],
            totalCost: 2.5,
            totalTokens: 5000,
          },
          success: true,
        },
      });

      const result = await service.getUsageStats('THIS_MONTH');

      expect(result.success).toBe(true);
      expect(result.stats?.totalCost).toBe(2.5);
      expect(result.stats?.actionCounts).toHaveLength(1);
    });

    it('período TODAY calcula startDate de hoy a las 00:00', async () => {
      mockQuery.mockResolvedValueOnce({ getUsageStats: { success: true } });

      await service.getUsageStats('TODAY');

      const filters = (mockQuery.mock.calls[0][1]! as any).filters;
      const start = new Date(filters.startDate);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
    });

    it('período LAST_30_DAYS calcula fecha de hace 30 días', async () => {
      mockQuery.mockResolvedValueOnce({ getUsageStats: { success: true } });

      await service.getUsageStats('LAST_30_DAYS');

      const filters = (mockQuery.mock.calls[0][1]! as any).filters;
      const start = new Date(filters.startDate);
      const now = new Date();
      const diffDays = Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBeGreaterThanOrEqual(29);
      expect(diffDays).toBeLessThanOrEqual(31);
    });

    it('fechas CUSTOM pasan startDate y endDate directamente', async () => {
      mockQuery.mockResolvedValueOnce({ getUsageStats: { success: true } });

      await service.getUsageStats('CUSTOM', '2025-01-01', '2025-01-31');

      const filters = (mockQuery.mock.calls[0][1]! as any).filters;
      expect(filters.startDate).toBe('2025-01-01');
      expect(filters.endDate).toBe('2025-01-31');
    });
  });

  // ━━━ Labels constantes ━━━

  describe('Labels de facturación en español', () => {
    it('INVOICE_STATUS_LABELS tiene todos los estados', () => {
      expect(INVOICE_STATUS_LABELS.PAID).toBe('Pagada');
      expect(INVOICE_STATUS_LABELS.PENDING).toBe('Pendiente');
      expect(INVOICE_STATUS_LABELS.VOID).toBe('Anulada');
    });

    it('PAYMENT_TYPE_LABELS tiene todos los tipos', () => {
      expect(PAYMENT_TYPE_LABELS.WALLET_RECHARGE).toBe('Recarga de saldo');
      expect(PAYMENT_TYPE_LABELS.SUBSCRIPTION_PAYMENT).toBe('Pago de suscripción');
    });

    it('PLAN_TIER_LABELS tiene todos los tiers', () => {
      expect(PLAN_TIER_LABELS.FREE).toBe('Gratuito');
      expect(PLAN_TIER_LABELS.PRO).toBe('Profesional');
      expect(PLAN_TIER_LABELS.ENTERPRISE).toBe('Empresa');
    });
  });
});
