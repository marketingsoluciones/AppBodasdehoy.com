'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  BalanceCheck,
  ConsumeResponse,
  RechargeSessionResponse,
  WalletBalance,
  WalletTransaction,
  walletService,
} from '@/services/api2/wallet';

// ========================================
// TYPES
// ========================================

export interface UseWalletState {
  balance: number;
  bonusBalance: number;
  currency: string;
  error: string | null;
  isLowBalance: boolean;
  loading: boolean;
  lowBalanceThreshold: number;
  status: WalletBalance['status'];
  totalBalance: number;
}

export interface UseWalletActions {
  canAfford: (amount: number) => Promise<BalanceCheck>;
  consumeService: (
    sku: string,
    quantity?: number,
    description?: string,
    metadata?: Record<string, any>
  ) => Promise<ConsumeResponse>;
  formatBalance: (amount: number) => string;
  refetchBalance: () => Promise<void>;
  startRecharge: (amount: number, successUrl?: string, cancelUrl?: string) => Promise<RechargeSessionResponse>;
}

export interface UseWalletReturn extends UseWalletState, UseWalletActions {
  // Transactions
  fetchTransactions: (page?: number, limit?: number) => Promise<void>;
  hasMoreTransactions: boolean;
  // Modal state
  lastBalanceCheck: BalanceCheck | null;
  setShowRechargeModal: (show: boolean) => void;
  showRechargeModal: boolean;
  transactions: WalletTransaction[];
  transactionsLoading: boolean;
}

// ========================================
// HOOK
// ========================================

export const useWallet = (): UseWalletReturn => {
  // Balance state
  const [balance, setBalance] = useState(0);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [currency, setCurrency] = useState('EUR');
  const [status, setStatus] = useState<WalletBalance['status']>('ACTIVE');
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [lastBalanceCheck, setLastBalanceCheck] = useState<BalanceCheck | null>(null);

  // Transactions state
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(false);

  // Computed
  const isLowBalance = totalBalance <= lowBalanceThreshold;

  // ========================================
  // BALANCE FUNCTIONS
  // ========================================

  const refetchBalance = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 [useWallet] Obteniendo saldo...');
      const data = await walletService.getBalance();
      console.log('📊 [useWallet] Respuesta de saldo:', { 
        balance: data.balance, 
        error: data.error,
        success: data.success,
        total_balance: data.total_balance 
      });

      if (data.success) {
        setBalance(data.balance);
        setBonusBalance(data.bonus_balance);
        setTotalBalance(data.total_balance);
        setCurrency(data.currency);
        setStatus(data.status);
        setLowBalanceThreshold(data.low_balance_threshold);
      } else {
        const errorMsg = data.error || 'Error al obtener saldo';
        console.error('❌ [useWallet] Error en respuesta:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ [useWallet] Excepción al obtener saldo:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const canAfford = useCallback(async (amount: number): Promise<BalanceCheck> => {
    const check = await walletService.checkBalance(amount);

    if (!check.allowed) {
      setLastBalanceCheck(check);
      setShowRechargeModal(true);
    }

    return check;
  }, []);

  const formatBalance = useCallback(
    (amount: number): string => {
      const symbol = currency === 'EUR' ? '\u20AC' : currency;
      return `${symbol}${amount.toFixed(2)}`;
    },
    [currency]
  );

  // ========================================
  // RECHARGE FUNCTIONS
  // ========================================

  const startRecharge = useCallback(
    async (
      amount: number,
      successUrl?: string,
      cancelUrl?: string
    ): Promise<RechargeSessionResponse> => {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const defaultSuccessUrl = `${baseUrl}/settings/billing?recharge=success`;
      const defaultCancelUrl = `${baseUrl}/settings/billing?recharge=cancelled`;

      console.log('🔍 [useWallet] Iniciando recarga:', {
        amount,
        cancelUrl: cancelUrl || defaultCancelUrl,
        successUrl: successUrl || defaultSuccessUrl,
      });

      try {
        const result = await walletService.createRechargeSession(
          amount,
          successUrl || defaultSuccessUrl,
          cancelUrl || defaultCancelUrl
        );

        console.log('📊 [useWallet] Respuesta de recarga:', {
          error_code: result.error_code,
          error_message: result.error_message,
          hasCheckoutUrl: !!result.checkout_url,
          sessionId: result.session_id,
          success: result.success,
        });

        if (result.success && result.checkout_url) {
          console.log('✅ [useWallet] Redirigiendo a Stripe Checkout:', result.checkout_url);
          // Redirigir a Stripe Checkout
          window.location.href = result.checkout_url;
        } else {
          console.error('❌ [useWallet] Error al crear sesión de recarga:', {
            error_code: result.error_code,
            error_message: result.error_message,
          });
        }

        return result;
      } catch (error) {
        console.error('❌ [useWallet] Excepción al crear sesión de recarga:', error);
        return {
          error_code: 'EXCEPTION',
          error_message: error instanceof Error ? error.message : 'Error desconocido al crear sesión de recarga',
          success: false,
        };
      }
    },
    []
  );

  // ========================================
  // CONSUME FUNCTIONS
  // ========================================

  const consumeService = useCallback(
    async (
      sku: string,
      quantity: number = 1,
      description?: string,
      metadata?: Record<string, any>
    ): Promise<ConsumeResponse> => {
      const result = await walletService.checkAndConsume(sku, quantity, description, metadata);

      if (!result.success && result.error_code === 'INSUFFICIENT_BALANCE' && result.balance_check) {
        setLastBalanceCheck(result.balance_check);
        setShowRechargeModal(true);
      } else if (result.success && // Actualizar balance local
        result.new_balance !== undefined) {
          setTotalBalance(result.new_balance);
          // Aproximar balance (asumiendo que el consumo viene del balance principal)
          setBalance(result.new_balance - bonusBalance);
        }

      return result;
    },
    [bonusBalance]
  );

  // ========================================
  // TRANSACTIONS FUNCTIONS
  // ========================================

  const fetchTransactions = useCallback(async (page: number = 1, limit: number = 20) => {
    setTransactionsLoading(true);
    setError(null);

    try {
      console.log('🔍 [useWallet] Obteniendo transacciones...', { limit, page });
      const data = await walletService.getTransactions(page, limit);
      console.log('📊 [useWallet] Respuesta de transacciones:', { 
        count: data.transactions?.length || 0, 
        errors: data.errors,
        hasMore: data.hasMore,
        success: data.success,
        total: data.total 
      });

      if (data.success) {
        if (page === 1) {
          setTransactions(data.transactions || []);
        } else {
          setTransactions((prev) => [...prev, ...(data.transactions || [])]);
        }
        setHasMoreTransactions(data.hasMore || false);
      } else {
        const errorMsg = data.errors?.[0]?.message || 'Error al obtener transacciones';
        console.error('❌ [useWallet] Error en respuesta:', errorMsg);
        setError(errorMsg);
        setTransactions([]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ [useWallet] Excepción al obtener transacciones:', err);
      setError(errorMsg);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  // ========================================
  // EFFECTS
  // ========================================

  // Cargar balance inicial
  useEffect(() => {
    refetchBalance();
  }, [refetchBalance]);

  // Manejar retorno de Stripe
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const rechargeStatus = params.get('recharge');

    if (rechargeStatus === 'success') {
      // Refrescar balance
      refetchBalance();
      // Limpiar URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (rechargeStatus === 'cancelled') {
      // Limpiar URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refetchBalance]);

  // ========================================
  // RETURN
  // ========================================

  return {
    // State
    balance,
    bonusBalance,
    // Actions
canAfford,
    
consumeService,
    
currency,
    
error,
    
// Transactions
fetchTransactions,
    

formatBalance,
    


hasMoreTransactions,

    
    


isLowBalance,
    

// Modal
lastBalanceCheck,
    

loading,
    

lowBalanceThreshold,
    

refetchBalance,

    
    
setShowRechargeModal,
    
showRechargeModal,
    
startRecharge,

    
    status,
    totalBalance,
    transactions,
    transactionsLoading,
  };
};

export default useWallet;
