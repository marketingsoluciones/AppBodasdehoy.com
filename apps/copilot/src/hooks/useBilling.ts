'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  Invoice,
  InvoiceDetail,
  InvoicePDFResponse,
  Payment,
  Subscription,
  UsageStats,
  invoicesService,
} from '@/services/api2/invoices';

// ========================================
// TYPES
// ========================================

export interface UseBillingState {
  // General
  error: string | null;
  invoiceDetail: InvoiceDetail | null;
  invoiceDetailLoading: boolean;
  // Invoices
  invoices: Invoice[];
  invoicesLoading: boolean;

  invoicesPagination: {
    hasMore: boolean;
    page: number;
    total: number;
    totalPages: number;
  };
  // Payments
  payments: Payment[];
  paymentsLoading: boolean;

  paymentsPagination: {
    hasMore: boolean;
    page: number;
    total: number;
    totalPages: number;
  };
  // Subscription
  subscription: Subscription | null;

  subscriptionLoading: boolean;
  // Usage Stats
  usageStats: UsageStats | null;

  usageStatsLoading: boolean;
}

export interface UseBillingActions {
  downloadInvoicePDF: (invoiceId: string) => Promise<InvoicePDFResponse>;
  fetchInvoiceById: (invoiceId: string) => Promise<void>;
  fetchInvoices: (page?: number, status?: Invoice['status']) => Promise<void>;
  fetchPayments: (page?: number) => Promise<void>;
  fetchSubscription: () => Promise<void>;
  fetchUsageStats: (period?: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_30_DAYS') => Promise<void>;
  refreshAll: () => Promise<void>;
}

export interface UseBillingReturn extends UseBillingState, UseBillingActions {}

// ========================================
// HOOK
// ========================================

export const useBilling = (): UseBillingReturn => {
  // Invoices state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState<InvoiceDetail | null>(null);
  const [invoiceDetailLoading, setInvoiceDetailLoading] = useState(false);
  const [invoicesPagination, setInvoicesPagination] = useState({
    hasMore: false,
    page: 1,
    total: 0,
    totalPages: 0,
  });

  // Payments state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsPagination, setPaymentsPagination] = useState({
    hasMore: false,
    page: 1,
    total: 0,
    totalPages: 0,
  });

  // Subscription state
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // Usage stats state
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [usageStatsLoading, setUsageStatsLoading] = useState(false);

  // General state
  const [error, setError] = useState<string | null>(null);

  // ========================================
  // FETCH FUNCTIONS
  // ========================================

  const fetchInvoices = useCallback(async (page: number = 1, status?: Invoice['status']) => {
    setInvoicesLoading(true);
    setError(null);

    try {
      console.log('🔍 [useBilling] Obteniendo facturas...', { page, status });
      const data = await invoicesService.getInvoices(page, 20, status);
      console.log('📊 [useBilling] Respuesta de facturas:', { 
        count: data.invoices?.length || 0, 
        errors: data.errors,
        success: data.success,
        total: data.pagination?.total || 0 
      });

      if (data.success) {
        if (page === 1) {
          setInvoices(data.invoices || []);
        } else {
          setInvoices((prev) => [...prev, ...(data.invoices || [])]);
        }
        setInvoicesPagination({
          hasMore: (data.pagination?.page || 0) < (data.pagination?.totalPages || 0),
          page: data.pagination?.page || 1,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
        });
      } else {
        const errorMsg = data.errors?.[0]?.message || 'Error al cargar facturas';
        console.error('❌ [useBilling] Error en respuesta:', errorMsg);
        setError(errorMsg);
        setInvoices([]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar facturas';
      console.error('❌ [useBilling] Excepción al obtener facturas:', err);
      setError(errorMsg);
      setInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  const fetchPayments = useCallback(async (page: number = 1) => {
    setPaymentsLoading(true);
    setError(null);

    try {
      const data = await invoicesService.getPaymentHistory(page, 20);

      if (data.success) {
        if (page === 1) {
          setPayments(data.payments);
        } else {
          setPayments((prev) => [...prev, ...data.payments]);
        }
        setPaymentsPagination({
          hasMore: data.pagination.page < data.pagination.totalPages,
          page: data.pagination.page,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pagos');
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  const fetchSubscription = useCallback(async () => {
    setSubscriptionLoading(true);
    setError(null);

    try {
      console.log('🔍 [useBilling] Obteniendo suscripción...');
      const data = await invoicesService.getSubscription();
      console.log('📊 [useBilling] Respuesta de suscripción:', { 
        errors: data.errors, 
        hasSubscription: !!data.subscription,
        success: data.success 
      });

      if (data.success && data.subscription) {
        setSubscription(data.subscription);
      } else {
        // No es error si no hay suscripción, solo no se muestra
        console.log('ℹ️ [useBilling] Usuario sin suscripción activa');
        setSubscription(null);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar suscripcion';
      console.error('❌ [useBilling] Excepción al obtener suscripción:', err);
      setError(errorMsg);
      setSubscription(null);
    } finally {
      setSubscriptionLoading(false);
    }
  }, []);

  const fetchUsageStats = useCallback(
    async (period: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_30_DAYS' = 'THIS_MONTH') => {
      setUsageStatsLoading(true);
      setError(null);

      try {
        console.log('🔍 [useBilling] Obteniendo estadísticas de uso...', { period });
        const data = await invoicesService.getUsageStats(period);
        console.log('📊 [useBilling] Respuesta de estadísticas:', { 
          errors: data.errors, 
          hasStats: !!data.stats,
          success: data.success,
          totalCost: data.stats?.total_cost 
        });

        if (data.success && data.stats) {
          setUsageStats(data.stats);
        } else {
          const errorMsg = data.errors?.[0]?.message || 'No hay estadísticas disponibles';
          console.warn('⚠️ [useBilling] Sin estadísticas:', errorMsg);
          setUsageStats(null);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al cargar estadisticas';
        console.error('❌ [useBilling] Excepción al obtener estadísticas:', err);
        setError(errorMsg);
        setUsageStats(null);
      } finally {
        setUsageStatsLoading(false);
      }
    },
    []
  );

  const fetchInvoiceById = useCallback(async (invoiceId: string) => {
    setInvoiceDetailLoading(true);
    setError(null);

    try {
      const data = await invoicesService.getInvoiceById(invoiceId);

      if (data.success && data.invoice) {
        setInvoiceDetail(data.invoice);
      } else {
        setError(data.errors?.[0]?.message || 'Error obteniendo detalle de factura');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar detalle de factura');
    } finally {
      setInvoiceDetailLoading(false);
    }
  }, []);

  const downloadInvoicePDF = useCallback(async (invoiceId: string): Promise<InvoicePDFResponse> => {
    try {
      console.log('🔍 [useBilling] Descargando PDF de factura:', invoiceId);
      const data = await invoicesService.getInvoicePDF(invoiceId);
      console.log('📊 [useBilling] Respuesta PDF:', { 
        error: data.error_message, 
        hasPdfUrl: !!data.pdf_url,
        success: data.success 
      });

      if (data.success && data.pdf_url) {
        // ✅ FIX: Abrir PDF en nueva ventana
        console.log('✅ [useBilling] Abriendo PDF:', data.pdf_url);
        window.open(data.pdf_url, '_blank');
      } else {
        // ✅ FIX: Mostrar error si no se pudo obtener PDF
        const errorMsg = data.error_message || 'No se pudo obtener el PDF de la factura';
        console.error('❌ [useBilling] Error al obtener PDF:', errorMsg);
        if (typeof window !== 'undefined' && (window as any).alert) {
          alert(`Error al descargar PDF: ${errorMsg}`);
        }
      }

      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al descargar PDF';
      console.error('❌ [useBilling] Excepción al descargar PDF:', err);
      if (typeof window !== 'undefined' && (window as any).alert) {
        alert(`Error al descargar PDF: ${errorMsg}`);
      }
      return {
        error_message: errorMsg,
        success: false,
      };
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchInvoices(1),
      fetchPayments(1),
      fetchSubscription(),
      fetchUsageStats('THIS_MONTH'),
    ]);
  }, [fetchInvoices, fetchPayments, fetchSubscription, fetchUsageStats]);

  // ========================================
  // EFFECTS
  // ========================================

  // Cargar datos iniciales
  useEffect(() => {
    fetchSubscription();
    fetchUsageStats('THIS_MONTH');
  }, [fetchSubscription, fetchUsageStats]);

  // ========================================
  // RETURN
  // ========================================

  return {
    
    downloadInvoicePDF,
    
    
    
// General
error,
    


fetchInvoiceById,
    

// Actions
fetchInvoices,
    

fetchPayments,
    

fetchSubscription,
    
    
    

fetchUsageStats,
    


invoiceDetail,
    


invoiceDetailLoading,
    
    
    

// Invoices
invoices,
    


invoicesLoading,
    
    
    


invoicesPagination,
    


// Payments
payments,
    
    
    

paymentsLoading,
    

paymentsPagination,
    

refreshAll,
    
// Subscription
subscription,
    
subscriptionLoading,
    // Usage Stats
usageStats,
    usageStatsLoading,
  };
};

export default useBilling;
