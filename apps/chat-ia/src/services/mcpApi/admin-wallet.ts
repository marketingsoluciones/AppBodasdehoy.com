/**
 * Servicio de Wallet Admin - Queries para Super Admin
 * ====================================================
 *
 * Solo accesible con role === 'admin' en el JWT.
 * El backend (MCP) valida isAdmin(context) en cada resolver.
 */

import { mcpClient } from './client';
import type { WalletTransaction } from './wallet';

// ========================================
// TYPES
// ========================================

export interface WalletStats {
  active_wallets: number;
  currency: string;
  monthly_consumption: number;
  monthly_revenue: number;
  suspended_wallets: number;
  total_balance: number;
  total_bonus_balance: number;
  total_wallets: number;
}

export interface AdminWalletUser {
  balance: number;
  bonus_balance: number;
  created_at: string;
  currency: string;
  development?: string;
  email?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  total_balance: number;
  updated_at?: string;
  userId: string;
}

export interface AdminTransactionsResponse {
  hasMore: boolean;
  success: boolean;
  total: number;
  transactions: WalletTransaction[];
}

export interface LowBalanceWallet {
  balance: number;
  bonus_balance: number;
  currency: string;
  development?: string;
  email?: string;
  status: string;
  total_balance: number;
  userId: string;
}

export interface AdminActionResponse {
  error_code?: string;
  error_message?: string;
  new_balance?: number;
  success: boolean;
  transaction?: WalletTransaction;
}

export interface UsageTrackingEntry {
  _id: string;
  action: string;
  cost?: number;
  created_at: string;
  development?: string;
  metadata?: Record<string, any>;
  quantity: number;
  userId: string;
}

export interface UsageTrackingResponse {
  entries: UsageTrackingEntry[];
  hasMore: boolean;
  success: boolean;
  total: number;
}

// ========================================
// QUERIES
// ========================================

const GET_STATS_QUERY = `
  query AdminGetWalletStats {
    wallet_getStats {
      total_wallets
      active_wallets
      suspended_wallets
      total_balance
      total_bonus_balance
      monthly_revenue
      monthly_consumption
      currency
    }
  }
`;

const GET_USER_WALLET_QUERY = `
  query AdminGetUserWallet($userId: ID!) {
    wallet_getUserWallet(userId: $userId) {
      userId
      email
      development
      balance
      bonus_balance
      total_balance
      currency
      status
      created_at
      updated_at
    }
  }
`;

const GET_USER_TRANSACTIONS_QUERY = `
  query AdminGetUserTransactions($userId: ID!, $page: Int, $limit: Int) {
    wallet_getUserTransactions(userId: $userId, page: $page, limit: $limit) {
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
    }
  }
`;

const GET_LOW_BALANCE_WALLETS_QUERY = `
  query AdminGetLowBalanceWallets($threshold: Float) {
    wallet_getLowBalanceWallets(threshold: $threshold) {
      userId
      email
      development
      balance
      bonus_balance
      total_balance
      currency
      status
    }
  }
`;

const GET_USAGE_TRACKING_QUERY = `
  query AdminGetUsageTracking($page: Int, $limit: Int, $userId: ID, $action: String, $development: String, $startDate: String, $endDate: String) {
    getUsageTracking(
      pagination: { page: $page, limit: $limit }
      filters: { userId: $userId, action: $action, development: $development, startDate: $startDate, endDate: $endDate }
    ) {
      success
      entries {
        _id
        userId
        development
        action
        quantity
        cost
        metadata
        created_at
      }
      total
      hasMore
    }
  }
`;

// ========================================
// MUTATIONS
// ========================================

const MANUAL_RECHARGE_MUTATION = `
  mutation AdminManualRecharge($userId: ID!, $amount: Float!, $reference: String) {
    wallet_manualRecharge(userId: $userId, amount: $amount, reference: $reference) {
      success
      error_code
      error_message
      new_balance
      transaction {
        _id
        type
        amount
        balance_after
        description
        created_at
      }
    }
  }
`;

const ADD_BONUS_MUTATION = `
  mutation AdminAddBonus($userId: ID!, $amount: Float!, $description: String) {
    wallet_addBonus(userId: $userId, amount: $amount, description: $description) {
      success
      error_code
      error_message
      new_balance
      transaction {
        _id
        type
        amount
        balance_after
        description
        created_at
      }
    }
  }
`;

const SUSPEND_WALLET_MUTATION = `
  mutation AdminSuspendWallet($userId: ID!, $reason: String) {
    wallet_suspend(userId: $userId, reason: $reason) {
      success
      error_code
      error_message
    }
  }
`;

const REACTIVATE_WALLET_MUTATION = `
  mutation AdminReactivateWallet($userId: ID!) {
    wallet_reactivate(userId: $userId) {
      success
      error_code
      error_message
    }
  }
`;

// ========================================
// SERVICE CLASS
// ========================================

export class AdminWalletService {
  async getStats(): Promise<WalletStats | null> {
    try {
      const data = await mcpClient.query<{ wallet_getStats: WalletStats }>(GET_STATS_QUERY);
      return data.wallet_getStats;
    } catch (error) {
      console.error('[adminWallet] Error obteniendo stats:', error);
      return null;
    }
  }

  async getUserWallet(userId: string): Promise<AdminWalletUser | null> {
    try {
      const data = await mcpClient.query<{ wallet_getUserWallet: AdminWalletUser }>(
        GET_USER_WALLET_QUERY,
        { userId }
      );
      return data.wallet_getUserWallet;
    } catch (error) {
      console.error('[adminWallet] Error obteniendo wallet de usuario:', error);
      return null;
    }
  }

  async getUserTransactions(
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<AdminTransactionsResponse> {
    try {
      const data = await mcpClient.query<{ wallet_getUserTransactions: AdminTransactionsResponse }>(
        GET_USER_TRANSACTIONS_QUERY,
        { limit, page, userId }
      );
      return data.wallet_getUserTransactions;
    } catch (error) {
      console.error('[adminWallet] Error obteniendo transacciones de usuario:', error);
      return { hasMore: false, success: false, total: 0, transactions: [] };
    }
  }

  async getLowBalanceWallets(threshold: number = 1): Promise<LowBalanceWallet[]> {
    try {
      const data = await mcpClient.query<{ wallet_getLowBalanceWallets: LowBalanceWallet[] }>(
        GET_LOW_BALANCE_WALLETS_QUERY,
        { threshold }
      );
      return data.wallet_getLowBalanceWallets ?? [];
    } catch (error) {
      console.error('[adminWallet] Error obteniendo wallets con saldo bajo:', error);
      return [];
    }
  }

  async getUsageTracking(params: {
    action?: string;
    development?: string;
    endDate?: string;
    limit?: number;
    page?: number;
    startDate?: string;
    userId?: string;
  }): Promise<UsageTrackingResponse> {
    try {
      const data = await mcpClient.query<{ getUsageTracking: UsageTrackingResponse }>(
        GET_USAGE_TRACKING_QUERY,
        {
          action: params.action,
          development: params.development,
          endDate: params.endDate,
          limit: params.limit ?? 50,
          page: params.page ?? 1,
          startDate: params.startDate,
          userId: params.userId,
        }
      );
      return data.getUsageTracking;
    } catch (error) {
      console.error('[adminWallet] Error obteniendo usage tracking:', error);
      return { entries: [], hasMore: false, success: false, total: 0 };
    }
  }

  async manualRecharge(
    userId: string,
    amount: number,
    reference?: string
  ): Promise<AdminActionResponse> {
    try {
      const data = await mcpClient.query<{ wallet_manualRecharge: AdminActionResponse }>(
        MANUAL_RECHARGE_MUTATION,
        { amount, reference, userId }
      );
      return data.wallet_manualRecharge;
    } catch (error) {
      console.error('[adminWallet] Error en recarga manual:', error);
      return {
        error_code: 'API_ERROR',
        error_message: error instanceof Error ? error.message : 'Error desconocido',
        success: false,
      };
    }
  }

  async addBonus(
    userId: string,
    amount: number,
    description?: string
  ): Promise<AdminActionResponse> {
    try {
      const data = await mcpClient.query<{ wallet_addBonus: AdminActionResponse }>(
        ADD_BONUS_MUTATION,
        { amount, description, userId }
      );
      return data.wallet_addBonus;
    } catch (error) {
      console.error('[adminWallet] Error añadiendo bonus:', error);
      return {
        error_code: 'API_ERROR',
        error_message: error instanceof Error ? error.message : 'Error desconocido',
        success: false,
      };
    }
  }

  async suspendWallet(userId: string, reason?: string): Promise<AdminActionResponse> {
    try {
      const data = await mcpClient.query<{ wallet_suspend: AdminActionResponse }>(
        SUSPEND_WALLET_MUTATION,
        { reason, userId }
      );
      return data.wallet_suspend;
    } catch (error) {
      console.error('[adminWallet] Error suspendiendo wallet:', error);
      return {
        error_code: 'API_ERROR',
        error_message: error instanceof Error ? error.message : 'Error desconocido',
        success: false,
      };
    }
  }

  async reactivateWallet(userId: string): Promise<AdminActionResponse> {
    try {
      const data = await mcpClient.query<{ wallet_reactivate: AdminActionResponse }>(
        REACTIVATE_WALLET_MUTATION,
        { userId }
      );
      return data.wallet_reactivate;
    } catch (error) {
      console.error('[adminWallet] Error reactivando wallet:', error);
      return {
        error_code: 'API_ERROR',
        error_message: error instanceof Error ? error.message : 'Error desconocido',
        success: false,
      };
    }
  }
}

export const adminWalletService = new AdminWalletService();
