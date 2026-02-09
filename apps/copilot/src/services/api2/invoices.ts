/**
 * Servicio de Facturas - Cliente para API2 GraphQL
 * =================================================
 *
 * Gestiona operaciones de facturación:
 * - Listado de facturas
 * - Detalle de factura
 * - Descarga de PDF
 * - Historial de pagos
 * - Suscripción
 */

import { api2Client } from './client';

// ========================================
// TYPES
// ========================================

export interface InvoiceLineItem {
  amount: number;
  description: string;
  quantity: number;
  service_category?: string;
  service_sku?: string;
  unit_price: number;
}

export interface BillingInfo {
  address?: string;
  company_name?: string;
  email?: string;
  name?: string;
  tax_id?: string;
}

export interface Invoice {
  _id: string;
  billing_info?: BillingInfo;
  created_at: string;
  currency: string;
  due_date?: string;
  hosted_invoice_url?: string;
  invoice_number: string;
  line_items: InvoiceLineItem[];
  payment_date?: string;
  payment_method?: string;
  pdf_url?: string;
  period_end: string;
  period_start: string;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE';
  stripe_invoice_id?: string;
  stripe_payment_intent_id?: string;
  subtotal: number;
  tax_amount: number;
  tax_rate: number;
  total: number;
}

export interface InvoiceDetail extends Invoice {
  billing_info?: BillingInfo;
}

export interface InvoicesResponse {
  errors?: Array<{ code: string; field: string; message: string }>;
  invoices: Invoice[];
  pagination: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
  success: boolean;
}

export interface InvoiceDetailResponse {
  errors?: Array<{ code: string; field: string; message: string }>;
  invoice?: InvoiceDetail;
  success: boolean;
}

export interface InvoicePDFResponse {
  error_message?: string;
  expires_at?: string;
  pdf_url?: string;
  success: boolean;
}

export interface PaymentMethodDetails {
  card_brand?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  card_last4?: string;
  type: string;
}

export interface Payment {
  _id: string;
  amount: number;
  created_at: string;
  currency: string;
  description: string;
  invoice_id?: string;
  payment_method: string;
  payment_method_details?: PaymentMethodDetails;
  receipt_url?: string;
  status: string;
  stripe_charge_id?: string;
  stripe_payment_intent_id?: string;
  type: 'WALLET_RECHARGE' | 'SUBSCRIPTION_PAYMENT' | 'ONE_TIME_PURCHASE' | 'OVERAGE_CHARGE';
}

export interface PaymentsResponse {
  errors?: Array<{ code: string; field: string; message: string }>;
  pagination: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
  payments: Payment[];
  success: boolean;
}

export interface SubscriptionLimits {
  current_ai_tokens?: number;
  current_emails?: number;
  current_images?: number;
  current_sms?: number;
  current_storage_gb?: number;
  current_whatsapp_messages?: number;
  monthly_ai_tokens?: number;
  monthly_emails?: number;
  monthly_images?: number;
  monthly_sms?: number;
  monthly_whatsapp_messages?: number;
  storage_gb?: number;
}

export interface SubscriptionFeatures {
  has_advanced_analytics?: boolean;
  has_api_access?: boolean;
  has_custom_branding?: boolean;
  has_priority_support?: boolean;
  max_events?: number;
  max_team_members?: number;
}

export interface Subscription {
  _id: string;
  cancel_at_period_end?: boolean;
  canceled_at?: string;
  created_at: string;
  current_period_end: string;
  current_period_start: string;
  features?: SubscriptionFeatures;
  limits?: SubscriptionLimits;
  plan_id: string;
  plan_name: string;
  plan_tier: 'FREE' | 'BASIC' | 'PRO' | 'MAX' | 'ENTERPRISE';
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' | 'INCOMPLETE';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  updated_at: string;
  user_id: string;
}

export interface SubscriptionResponse {
  errors?: Array<{ code: string; field: string; message: string }>;
  subscription?: Subscription;
  success: boolean;
}

export interface UsageByModel {
  cost: number;
  model: string;
  tokens: number;
}

export interface UsageByProvider {
  cost: number;
  count: number;
  provider: string;
}

export interface UsageStats {
  ai_tokens?: {
    by_model: UsageByModel[];
    total: number;
  };
  billing_source_breakdown?: {
    free_tier: number;
    subscription: number;
    wallet: number;
  };
  communications?: {
    emails_sent: number;
    sms_sent: number;
    total_cost: number;
    whatsapp_received: number;
    whatsapp_sent: number;
  };
  images?: {
    by_provider: UsageByProvider[];
    total: number;
  };
  period_end: string;
  period_start: string;
  storage?: {
    cost: number;
    total_gb: number;
    transfer_gb: number;
  };
  total_cost: number;
}

export interface UsageStatsResponse {
  errors?: Array<{ code: string; field: string; message: string }>;
  stats?: UsageStats;
  success: boolean;
}

// ========================================
// QUERIES
// ========================================

const GET_INVOICES_QUERY = `
  query GetInvoices($page: Int, $limit: Int, $status: InvoiceStatus) {
    getInvoices(page: $page, limit: $limit, status: $status) {
      success
      invoices {
        _id
        invoice_number
        period_start
        period_end
        subtotal
        tax_amount
        tax_rate
        total
        currency
        status
        line_items {
          description
          quantity
          unit_price
          amount
          service_sku
          service_category
        }
        payment_method
        payment_date
        stripe_invoice_id
        pdf_url
        hosted_invoice_url
        due_date
        created_at
      }
      pagination {
        page
        limit
        total
        totalPages
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

const GET_INVOICE_BY_ID_QUERY = `
  query GetInvoiceById($invoiceId: ID!) {
    getInvoiceById(invoiceId: $invoiceId) {
      success
      invoice {
        _id
        invoice_number
        period_start
        period_end
        subtotal
        tax_amount
        tax_rate
        total
        currency
        status
        line_items {
          description
          quantity
          unit_price
          amount
          service_sku
          service_category
        }
        payment_method
        payment_date
        stripe_invoice_id
        stripe_payment_intent_id
        pdf_url
        hosted_invoice_url
        due_date
        created_at
        billing_info {
          name
          email
          address
          tax_id
          company_name
        }
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

const GET_INVOICE_PDF_QUERY = `
  query GetInvoicePDF($invoiceId: ID!) {
    getInvoicePDF(invoiceId: $invoiceId) {
      success
      pdf_url
      expires_at
      error_message
    }
  }
`;

const GET_PAYMENT_HISTORY_QUERY = `
  query GetPaymentHistory($page: Int, $limit: Int) {
    getPaymentHistory(page: $page, limit: $limit) {
      success
      payments {
        _id
        type
        amount
        currency
        status
        description
        payment_method
        stripe_payment_intent_id
        invoice_id
        created_at
        payment_method_details {
          type
          card_brand
          card_last4
          card_exp_month
          card_exp_year
        }
        receipt_url
      }
      pagination {
        page
        limit
        total
        totalPages
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

const GET_SUBSCRIPTION_QUERY = `
  query GetUserSubscription {
    getUserSubscription {
      success
      subscription {
        _id
        user_id
        plan_id
        plan_name
        plan_tier
        status
        current_period_start
        current_period_end
        stripe_subscription_id
        stripe_customer_id
        limits {
          monthly_ai_tokens
          monthly_images
          monthly_whatsapp_messages
          monthly_sms
          monthly_emails
          storage_gb
          current_ai_tokens
          current_images
          current_whatsapp_messages
          current_sms
          current_emails
          current_storage_gb
        }
        features {
          has_api_access
          has_priority_support
          has_custom_branding
          has_advanced_analytics
          max_team_members
          max_events
        }
        cancel_at_period_end
        canceled_at
        created_at
        updated_at
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

const GET_USAGE_STATS_QUERY = `
  query GetUsageStats($period: UsagePeriod!, $startDate: DateTime, $endDate: DateTime) {
    getUsageStats(period: $period, startDate: $startDate, endDate: $endDate) {
      success
      stats {
        period_start
        period_end
        ai_tokens {
          total
          by_model {
            model
            tokens
            cost
          }
        }
        images {
          total
          by_provider {
            provider
            count
            cost
          }
        }
        communications {
          whatsapp_sent
          whatsapp_received
          sms_sent
          emails_sent
          total_cost
        }
        storage {
          total_gb
          transfer_gb
          cost
        }
        total_cost
        billing_source_breakdown {
          subscription
          wallet
          free_tier
        }
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

// ========================================
// SERVICE CLASS
// ========================================

export class InvoicesService {
  /**
   * Obtiene el listado de facturas
   */
  async getInvoices(
    page: number = 1,
    limit: number = 20,
    status?: Invoice['status']
  ): Promise<InvoicesResponse> {
    try {
      console.log('🔍 [invoicesService] Obteniendo facturas...', { limit, page, status });
      const data = await api2Client.query<{ getInvoices: InvoicesResponse }>(GET_INVOICES_QUERY, {
        limit,
        page,
        status,
      });
      console.log('📊 [invoicesService] Respuesta de facturas:', {
        count: data.getInvoices?.invoices?.length || 0,
        errors: data.getInvoices?.errors,
        success: data.getInvoices?.success,
        total: data.getInvoices?.pagination?.total || 0,
      });
      return data.getInvoices;
    } catch (error) {
      console.error('❌ [invoicesService] Error obteniendo facturas:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ [invoicesService] Detalles del error:', {
        message: errorMsg,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return {
        errors: [{ code: 'API_ERROR', field: 'getInvoices', message: errorMsg }],
        invoices: [],
        pagination: { limit, page, total: 0, totalPages: 0 },
        success: false,
      };
    }
  }

  /**
   * Obtiene el detalle completo de una factura
   */
  async getInvoiceById(invoiceId: string): Promise<InvoiceDetailResponse> {
    try {
      console.log('🔍 [invoicesService] Obteniendo detalle de factura...', { invoiceId });
      const data = await api2Client.query<{ getInvoiceById: InvoiceDetailResponse }>(
        GET_INVOICE_BY_ID_QUERY,
        { invoiceId }
      );
      console.log('📊 [invoicesService] Respuesta de detalle:', {
        errors: data.getInvoiceById?.errors,
        hasInvoice: !!data.getInvoiceById?.invoice,
        success: data.getInvoiceById?.success,
      });
      return data.getInvoiceById;
    } catch (error) {
      console.error('❌ [invoicesService] Error obteniendo detalle de factura:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      return {
        errors: [{ code: 'API_ERROR', field: 'getInvoiceById', message: errorMsg }],
        success: false,
      };
    }
  }

  /**
   * Obtiene la URL del PDF de una factura
   */
  async getInvoicePDF(invoiceId: string): Promise<InvoicePDFResponse> {
    try {
      console.log('🔍 [invoicesService] Obteniendo PDF de factura...', { invoiceId });
      const data = await api2Client.query<{ getInvoicePDF: InvoicePDFResponse }>(
        GET_INVOICE_PDF_QUERY,
        { invoiceId }
      );
      console.log('📊 [invoicesService] Respuesta de PDF:', {
        error: data.getInvoicePDF?.error_message,
        expiresAt: data.getInvoicePDF?.expires_at,
        hasPdfUrl: !!data.getInvoicePDF?.pdf_url,
        success: data.getInvoicePDF?.success,
      });
      return data.getInvoicePDF;
    } catch (error) {
      console.error('❌ [invoicesService] Error obteniendo PDF:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return {
        error_message: errorMsg,
        success: false,
      };
    }
  }

  /**
   * Obtiene el historial de pagos
   */
  async getPaymentHistory(page: number = 1, limit: number = 20): Promise<PaymentsResponse> {
    try {
      console.log('🔍 [invoicesService] Obteniendo historial de pagos...', { limit, page });
      const data = await api2Client.query<{ getPaymentHistory: PaymentsResponse }>(
        GET_PAYMENT_HISTORY_QUERY,
        { limit, page }
      );
      console.log('📊 [invoicesService] Respuesta de pagos:', {
        count: data.getPaymentHistory?.payments?.length || 0,
        errors: data.getPaymentHistory?.errors,
        success: data.getPaymentHistory?.success,
        total: data.getPaymentHistory?.pagination?.total || 0,
      });
      return data.getPaymentHistory;
    } catch (error) {
      console.error('❌ [invoicesService] Error obteniendo pagos:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      return {
        errors: [{ code: 'API_ERROR', field: 'getPaymentHistory', message: errorMsg }],
        pagination: { limit, page, total: 0, totalPages: 0 },
        payments: [],
        success: false,
      };
    }
  }

  /**
   * Obtiene la suscripción del usuario
   */
  async getSubscription(): Promise<SubscriptionResponse> {
    try {
      console.log('🔍 [invoicesService] Obteniendo suscripción...');
      const data = await api2Client.query<{ getUserSubscription: SubscriptionResponse }>(
        GET_SUBSCRIPTION_QUERY
      );
      console.log('📊 [invoicesService] Respuesta de suscripción:', {
        errors: data.getUserSubscription?.errors,
        hasSubscription: !!data.getUserSubscription?.subscription,
        success: data.getUserSubscription?.success,
      });
      return data.getUserSubscription;
    } catch (error) {
      console.error('❌ [invoicesService] Error obteniendo suscripción:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      return {
        errors: [{ code: 'API_ERROR', field: 'getSubscription', message: errorMsg }],
        success: false,
      };
    }
  }

  /**
   * Obtiene estadísticas de uso
   */
  async getUsageStats(
    period: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_30_DAYS' | 'CUSTOM' = 'THIS_MONTH',
    startDate?: string,
    endDate?: string
  ): Promise<UsageStatsResponse> {
    try {
      console.log('🔍 [invoicesService] Obteniendo estadísticas de uso...', { endDate, period, startDate });
      const data = await api2Client.query<{ getUsageStats: UsageStatsResponse }>(
        GET_USAGE_STATS_QUERY,
        { endDate, period, startDate }
      );
      console.log('📊 [invoicesService] Respuesta de estadísticas:', {
        errors: data.getUsageStats?.errors,
        hasStats: !!data.getUsageStats?.stats,
        success: data.getUsageStats?.success,
        totalCost: data.getUsageStats?.stats?.total_cost,
      });
      return data.getUsageStats;
    } catch (error) {
      console.error('❌ [invoicesService] Error obteniendo estadísticas:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      return {
        errors: [{ code: 'API_ERROR', field: 'getUsageStats', message: errorMsg }],
        success: false,
      };
    }
  }
}

// Singleton instance
export const invoicesService = new InvoicesService();

// ========================================
// CONSTANTS
// ========================================

export const INVOICE_STATUS_LABELS: Record<Invoice['status'], string> = {
  DRAFT: 'Borrador',
  PAID: 'Pagada',
  PENDING: 'Pendiente',
  UNCOLLECTIBLE: 'Incobrable',
  VOID: 'Anulada',
};

export const PAYMENT_TYPE_LABELS: Record<Payment['type'], string> = {
  ONE_TIME_PURCHASE: 'Compra única',
  OVERAGE_CHARGE: 'Cargo por exceso',
  SUBSCRIPTION_PAYMENT: 'Pago de suscripción',
  WALLET_RECHARGE: 'Recarga de saldo',
};

export const PLAN_TIER_LABELS: Record<Subscription['plan_tier'], string> = {
  BASIC: 'Básico',
  ENTERPRISE: 'Empresa',
  FREE: 'Gratuito',
  MAX: 'Máximo',
  PRO: 'Profesional',
};
