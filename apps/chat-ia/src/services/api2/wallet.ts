/**
 * Servicio de Wallet - Cliente para API2 GraphQL
 * ==============================================
 *
 * Gestiona operaciones de wallet/saldo prepago:
 * - Consulta de saldo
 * - Verificación de saldo
 * - Crear sesión de recarga
 * - Consumir saldo
 * - Historial de transacciones
 */

import { api2Client } from './client';

// ========================================
// TYPES
// ========================================

export interface WalletBalance {
  balance: number;
  bonus_balance: number;
  credit_limit?: number;
  currency: string;
  error?: string;
  errors?: string[];
  status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  success: boolean;
  total_balance: number;
}

export interface BalanceCheck {
  allowed: boolean;
  balance: number;
  bonus_balance?: number;
  error_code?: string;
  error_message?: string;
  recharge_url?: string;
  required_amount: number;
  shortfall: number;
  total_balance: number;
}

export interface ServicePrice {
  base_price: number;
  currency: string;
  discount_applied: boolean;
  discount_percentage?: number;
  error?: string;
  final_price: number;
  name: string;
  price_list_applied?: {
    id: string;
    name: string;
    rule_type: string;
  };
  sku: string;
  unit: string;
}

export interface WalletTransaction {
  _id: string;
  amount: number;
  balance_after: number;
  created_at: string;
  description: string;
  metadata?: Record<string, any>;
  payment_method?: string;
  payment_reference?: string;
  service_quantity?: number;
  service_sku?: string;
  stripe_payment_intent_id?: string;
  type: 'RECHARGE' | 'CONSUMPTION' | 'REFUND' | 'BONUS' | 'ADJUSTMENT' | 'TRANSFER' | 'EXPIRATION';
  unit_price?: number;
}

export interface TransactionsResponse {
  errors?: Array<{ code: string; field: string; message: string }>;
  hasMore: boolean;
  success: boolean;
  total: number;
  transactions: WalletTransaction[];
}

export interface RechargeSessionResponse {
  checkout_url?: string;
  error_code?: string;
  error_message?: string;
  session_id?: string;
  success: boolean;
}

export interface ConsumeResponse {
  balance_check?: BalanceCheck;
  error_code?: string;
  error_message?: string;
  new_balance?: number;
  success: boolean;
  transaction?: WalletTransaction;
}

export interface AutoRechargeAttempt {
  amount: number;
  attempted_at: string;
  error?: string;
  payment_intent_id?: string;
  success: boolean;
  triggered_by: string;
}

export interface WalletAutoRechargeConfig {
  amount?: number;
  attempts_count?: number;
  enabled: boolean;
  failed_count?: number;
  last_triggered_at?: string;
  payment_method_id?: string;
  recent_attempts?: AutoRechargeAttempt[];
  threshold?: number;
}

export interface ConfigureAutoRechargeResponse {
  errors?: string[];
  success: boolean;
  wallet?: { auto_recharge_enabled: boolean };
}

export interface StoredPaymentMethod {
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  id: string;
  is_default: boolean;
  last4?: string;
}

// ========================================
// QUERIES
// ========================================

const GET_BALANCE_QUERY = `
  query GetBalance {
    wallet_getBalance {
      success
      balance
      bonus_balance
      credit_limit
      total_balance
      currency
      status
      errors
    }
  }
`;

const CHECK_BALANCE_QUERY = `
  query CheckBalance($amount: Float!) {
    wallet_checkBalance(amount: $amount) {
      allowed
      balance
      bonus_balance
      total_balance
      required_amount
      shortfall
      error_code
      error_message
      recharge_url
    }
  }
`;

const GET_SERVICE_PRICE_QUERY = `
  query GetServicePrice($sku: String!, $quantity: Float) {
    wallet_getServicePrice(sku: $sku, quantity: $quantity) {
      sku
      name
      base_price
      final_price
      discount_applied
      discount_percentage
      unit
      currency
      price_list_applied {
        id
        name
        rule_type
      }
    }
  }
`;

const GET_TRANSACTIONS_QUERY = `
  query GetTransactions($page: Int, $limit: Int, $filter: WalletTransactionsFilter) {
    wallet_getTransactions(page: $page, limit: $limit, filter: $filter) {
      success
      transactions {
        _id
        type
        amount
        balance_after
        description
        service_sku
        service_quantity
        unit_price
        payment_method
        payment_reference
        stripe_payment_intent_id
        metadata
        created_at
      }
      total
      hasMore
      errors {
        field
        message
        code
      }
    }
  }
`;

// ========================================
// MUTATIONS
// ========================================

const CREATE_RECHARGE_SESSION_MUTATION = `
  mutation CreateRechargeSession($input: WalletRechargeInput!) {
    wallet_createRechargeSession(input: $input) {
      success
      checkout_url
      session_id
      error_code
      error_message
    }
  }
`;

const GET_PAYMENT_METHODS_QUERY = `
  query GetPaymentMethods {
    wallet_getPaymentMethods {
      id
      brand
      last4
      exp_month
      exp_year
      is_default
    }
  }
`;

const GET_AUTO_RECHARGE_CONFIG_QUERY = `
  query GetAutoRechargeConfig {
    wallet_getAutoRechargeConfig {
      enabled
      threshold
      amount
      payment_method_id
      last_triggered_at
      attempts_count
      failed_count
      recent_attempts {
        attempted_at
        amount
        success
        error
        payment_intent_id
        triggered_by
      }
    }
  }
`;

const CONFIGURE_AUTO_RECHARGE_MUTATION = `
  mutation ConfigureAutoRecharge($input: WalletAutoRechargeInput!) {
    wallet_configureAutoRecharge(input: $input) {
      success
      errors
    }
  }
`;

const CHECK_AND_CONSUME_MUTATION = `
  mutation CheckAndConsume($input: WalletConsumeInput!) {
    wallet_checkAndConsume(input: $input) {
      success
      transaction {
        _id
        type
        amount
        balance_after
        description
        service_sku
        service_quantity
        created_at
      }
      new_balance
      balance_check {
        allowed
        total_balance
        required_amount
        shortfall
        error_code
        error_message
        recharge_url
      }
      error_code
      error_message
    }
  }
`;

// ========================================
// SERVICE CLASS
// ========================================

export class WalletService {
  /**
   * Obtiene el saldo actual del wallet
   */
  async getBalance(): Promise<WalletBalance> {
    try {
      console.log('🔍 [walletService] Obteniendo balance...');
      const data = await api2Client.query<{ wallet_getBalance: WalletBalance }>(GET_BALANCE_QUERY);
      console.log('📊 [walletService] Respuesta de balance:', {
        balance: data.wallet_getBalance?.balance,
        error: data.wallet_getBalance?.error,
        success: data.wallet_getBalance?.success,
        total_balance: data.wallet_getBalance?.total_balance,
      });
      return data.wallet_getBalance;
    } catch (error) {
      console.error('❌ [walletService] Error obteniendo balance:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ [walletService] Detalles del error:', {
        message: errorMsg,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return {
        balance: 0,
        bonus_balance: 0,
        currency: 'EUR',
        error: errorMsg,
        status: 'ACTIVE',
        success: false,
        total_balance: 0,
      };
    }
  }

  /**
   * Verifica si hay saldo suficiente para una operación
   */
  async checkBalance(amount: number): Promise<BalanceCheck> {
    try {
      const data = await api2Client.query<{ wallet_checkBalance: BalanceCheck }>(CHECK_BALANCE_QUERY, {
        amount,
      });
      return data.wallet_checkBalance;
    } catch (error) {
      console.error('Error verificando balance:', error);
      return {
        allowed: false,
        balance: 0,
        error_code: 'API_ERROR',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        required_amount: amount,
        shortfall: amount,
        total_balance: 0,
      };
    }
  }

  /**
   * Obtiene el precio de un servicio
   */
  async getServicePrice(sku: string, quantity: number = 1): Promise<ServicePrice> {
    try {
      const data = await api2Client.query<{ wallet_getServicePrice: ServicePrice }>(
        GET_SERVICE_PRICE_QUERY,
        { quantity, sku }
      );
      return data.wallet_getServicePrice;
    } catch (error) {
      console.error('Error obteniendo precio:', error);
      return {
        base_price: 0,
        currency: 'EUR',
        discount_applied: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        final_price: 0,
        name: 'Unknown',
        sku,
        unit: '',
      };
    }
  }

  /**
   * Obtiene el historial de transacciones
   */
  async getTransactions(
    page: number = 1,
    limit: number = 20,
    type?: WalletTransaction['type']
  ): Promise<TransactionsResponse> {
    try {
      console.log('🔍 [walletService] Obteniendo transacciones...', { limit, page, type });
      const data = await api2Client.query<{ wallet_getTransactions: TransactionsResponse }>(
        GET_TRANSACTIONS_QUERY,
        { filter: type ? { type } : undefined, limit, page }
      );
      console.log('📊 [walletService] Respuesta de transacciones:', {
        count: data.wallet_getTransactions?.transactions?.length || 0,
        errors: data.wallet_getTransactions?.errors,
        hasMore: data.wallet_getTransactions?.hasMore,
        success: data.wallet_getTransactions?.success,
        total: data.wallet_getTransactions?.total || 0,
      });
      return data.wallet_getTransactions;
    } catch (error) {
      console.error('❌ [walletService] Error obteniendo transacciones:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ [walletService] Detalles del error:', {
        message: errorMsg,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return {
        errors: [{ code: 'API_ERROR', field: 'wallet_getTransactions', message: errorMsg }],
        hasMore: false,
        success: false,
        total: 0,
        transactions: [],
      };
    }
  }

  /**
   * Crea una sesión de recarga via Stripe
   */
  async createRechargeSession(
    amount: number,
    successUrl: string,
    cancelUrl: string,
    customerEmail?: string
  ): Promise<RechargeSessionResponse> {
    try {
      console.log('🔍 [walletService] Creando sesión de recarga:', {
        amount,
        cancelUrl,
        customerEmail,
        successUrl,
      });

      const input: Record<string, any> = {
        amount,
        cancel_url: cancelUrl,
        success_url: successUrl,
      };

      if (customerEmail) {
        input.customer_email = customerEmail;
      }

      console.log('📤 [walletService] Enviando mutation:', {
        mutation: CREATE_RECHARGE_SESSION_MUTATION,
        variables: { input },
      });

      const data = await api2Client.query<{ wallet_createRechargeSession: RechargeSessionResponse }>(
        CREATE_RECHARGE_SESSION_MUTATION,
        { input }
      );

      console.log('📥 [walletService] Respuesta de API:', data);

      const result = data.wallet_createRechargeSession;

      // Mapear UNAUTHORIZED a mensaje legible para el usuario
      if (!result.success && (result.error_code === 'UNAUTHORIZED' || result.error_message?.toUpperCase() === 'UNAUTHORIZED')) {
        return {
          ...result,
          error_message: 'Para recargar tu saldo necesitas iniciar sesión. Por favor, accede a tu cuenta.',
        };
      }

      if (!result.success) {
        console.error('❌ [walletService] Error en respuesta:', {
          error_code: result.error_code,
          error_message: result.error_message,
        });
      } else {
        console.log('✅ [walletService] Sesión creada exitosamente:', {
          hasCheckoutUrl: !!result.checkout_url,
          session_id: result.session_id,
        });
      }

      return result;
    } catch (error) {
      console.error('❌ [walletService] Excepción al crear sesión de recarga:', error);
      return {
        error_code: 'API_ERROR',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      };
    }
  }

  /**
   * Obtiene los métodos de pago guardados en Stripe
   */
  async getPaymentMethods(): Promise<StoredPaymentMethod[]> {
    try {
      const data = await api2Client.query<{ wallet_getPaymentMethods: StoredPaymentMethod[] }>(
        GET_PAYMENT_METHODS_QUERY
      );
      return data.wallet_getPaymentMethods ?? [];
    } catch (error) {
      console.error('[walletService] Error obteniendo métodos de pago:', error);
      return [];
    }
  }

  /**
   * Obtiene la configuración actual de auto-recarga
   */
  async getAutoRechargeConfig(): Promise<WalletAutoRechargeConfig | null> {
    try {
      const data = await api2Client.query<{ wallet_getAutoRechargeConfig: WalletAutoRechargeConfig | null }>(
        GET_AUTO_RECHARGE_CONFIG_QUERY
      );
      return data.wallet_getAutoRechargeConfig ?? null;
    } catch (error) {
      console.error('[walletService] Error obteniendo config auto-recarga:', error);
      return null;
    }
  }

  /**
   * Configura o deshabilita la auto-recarga del wallet
   */
  async configureAutoRecharge(
    enabled: boolean,
    threshold?: number,
    amount?: number,
    paymentMethodId?: string
  ): Promise<ConfigureAutoRechargeResponse> {
    try {
      const input: Record<string, any> = { enabled };
      if (threshold !== undefined) input.threshold = threshold;
      if (amount !== undefined) input.amount = amount;
      if (paymentMethodId) input.payment_method_id = paymentMethodId;

      const data = await api2Client.query<{ wallet_configureAutoRecharge: ConfigureAutoRechargeResponse }>(
        CONFIGURE_AUTO_RECHARGE_MUTATION,
        { input }
      );
      return data.wallet_configureAutoRecharge;
    } catch (error) {
      console.error('[walletService] Error configurando auto-recarga:', error);
      return {
        errors: [error instanceof Error ? error.message : 'Error desconocido'],
        success: false,
      };
    }
  }

  /**
   * Verifica y consume saldo en una operación atómica
   */
  async checkAndConsume(
    serviceSku: string,
    quantity: number = 1,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<ConsumeResponse> {
    try {
      const input: Record<string, any> = {
        quantity,
        service_sku: serviceSku,
      };

      if (description) input.description = description;
      if (metadata) input.metadata = metadata;

      const data = await api2Client.query<{ wallet_checkAndConsume: ConsumeResponse }>(
        CHECK_AND_CONSUME_MUTATION,
        { input }
      );
      return data.wallet_checkAndConsume;
    } catch (error) {
      console.error('Error en checkAndConsume:', error);
      return {
        error_code: 'API_ERROR',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      };
    }
  }
}

// Singleton instance
export const walletService = new WalletService();

// ========================================
// SKUS COMUNES
// ========================================

export const SERVICE_SKUS = {
  // Tokens de IA
  AI_ANTHROPIC_HAIKU: 'SRV-AI-ANTHROPIC-HAIKU',
  AI_ANTHROPIC_OPUS: 'SRV-AI-ANTHROPIC-OPUS',
  AI_ANTHROPIC_SONNET: 'SRV-AI-ANTHROPIC-SONNET',
  // Generación de imágenes
AI_IMAGE_DALLE2: 'SRV-AI-IMAGE-DALLE2',
  
AI_IMAGE_DALLE3: 'SRV-AI-IMAGE-DALLE3',
  
AI_IMAGE_FLUX: 'SRV-AI-IMAGE-FLUX',

  
  AI_IMAGE_SD: 'SRV-AI-IMAGE-SD',
  AI_IMAGE_SDXL: 'SRV-AI-IMAGE-SDXL',
  AI_OPENAI_GPT35: 'SRV-AI-OPENAI-GPT35',
  AI_OPENAI_GPT4: 'SRV-AI-OPENAI-GPT4',
  AI_OPENAI_GPT4O: 'SRV-AI-OPENAI-GPT4O',

  // Comunicaciones
  EMAIL_SEND: 'SRV-EMAIL-SES-SEND',
  SMS_ES: 'SRV-SMS-TWILIO-ES',
  SMS_INTL: 'SRV-SMS-TWILIO-INTL',
  // Almacenamiento
STORAGE_CDN: 'SRV-STORAGE-CDN-GB',
  
STORAGE_TRANSFER: 'SRV-STORAGE-TRANSFER-GB',

  
  WHATSAPP_INBOUND: 'SRV-WHATSAPP-MSG-INBOUND',
  WHATSAPP_OUTBOUND: 'SRV-WHATSAPP-MSG-OUTBOUND',
} as const;
