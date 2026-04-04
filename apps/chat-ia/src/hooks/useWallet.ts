'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useChatStore } from '@/store/chat';
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
  creditLimit: number;
  currency: string;
  error: string | null;
  isCreditExhausted: boolean;
  isLowBalance: boolean;
  isNegativeBalance: boolean;
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
  const currentUserId = useChatStore((s) => s.currentUserId);
  const isAuthenticated = !!(currentUserId && currentUserId !== 'visitante@guest.local');

  // Balance state
  const [balance, setBalance] = useState(0);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [creditLimit, setCreditLimit] = useState(0);
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

  // Retry guard: solo un reintento por sesión de error UNAUTHORIZED
  const unauthorizedRetryDoneRef = useRef(false);

  // Computed
  const isNegativeBalance = balance < 0;
  // Credit is exhausted only when ALL funds (balance + bonus + credit limit) are gone
  // e.g. balance=-0.90, creditLimit=50 → still has 49.10 available → NOT exhausted
  const isCreditExhausted = totalBalance + creditLimit <= 0;
  const isLowBalance = totalBalance <= lowBalanceThreshold && !isCreditExhausted;

  // ========================================
  // BALANCE FUNCTIONS
  // ========================================

  const refetchBalance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await walletService.getBalance();
      setBalance(data.balance ?? 0);
      setBonusBalance(data.bonus_balance ?? 0);
      setCreditLimit(data.credit_limit ?? 0);
      setTotalBalance(data.total_balance ?? 0);
      setCurrency(data.currency || 'EUR');
      setStatus(data.status || 'ACTIVE');
      if (!data.success) {
        const errorMsg = data.error || (data.errors as string[] | undefined)?.[0] || null;
        if (errorMsg) setError(errorMsg);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
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
    [currency],
  );

  // ========================================
  // RECHARGE FUNCTIONS
  // ========================================

  const startRecharge = useCallback(
    async (
      amount: number,
      successUrl?: string,
      cancelUrl?: string,
    ): Promise<RechargeSessionResponse> => {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const defaultSuccessUrl = `${baseUrl}/settings/billing?recharge=success`;
      const defaultCancelUrl = `${baseUrl}/settings/billing?recharge=cancelled`;
      try {
        const result = await walletService.createRechargeSession(
          amount,
          successUrl || defaultSuccessUrl,
          cancelUrl || defaultCancelUrl,
        );
        if (result.success && result.checkout_url) {
          window.location.href = result.checkout_url;
        }
        return result;
      } catch (error) {
        return {
          error_code: 'EXCEPTION',
          error_message: error instanceof Error ? error.message : 'Error desconocido al crear sesión de recarga',
          success: false,
        };
      }
    },
    [],
  );

  // ========================================
  // CONSUME FUNCTIONS
  // ========================================

  const consumeService = useCallback(
    async (
      sku: string,
      quantity: number = 1,
      description?: string,
      metadata?: Record<string, any>,
    ): Promise<ConsumeResponse> => {
      const result = await walletService.checkAndConsume(sku, quantity, description, metadata);
      if (!result.success && result.error_code === 'INSUFFICIENT_BALANCE' && result.balance_check) {
        setLastBalanceCheck(result.balance_check);
        setShowRechargeModal(true);
      } else if (result.success && result.new_balance !== undefined) {
        setTotalBalance(result.new_balance);
        setBalance(result.new_balance - bonusBalance);
      }
      return result;
    },
    [bonusBalance],
  );

  // ========================================
  // TRANSACTIONS FUNCTIONS
  // ========================================

  const fetchTransactions = useCallback(async (page: number = 1, limit: number = 20) => {
    setTransactionsLoading(true);
    setError(null);
    try {
      const data = await walletService.getTransactions(page, limit);
      if (data.success) {
        if (page === 1) {
          setTransactions(data.transactions || []);
        } else {
          setTransactions((prev) => [...prev, ...(data.transactions || [])]);
        }
        setHasMoreTransactions(data.hasMore || false);
      } else {
        const errorMsg = data.errors?.[0]?.message || 'Error al obtener transacciones';
        setError(errorMsg);
        setTransactions([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  // ========================================
  // EFFECTS
  // ========================================

  useEffect(() => {
    if (!isAuthenticated) return;
    unauthorizedRetryDoneRef.current = false;
    refetchBalance();
  }, [currentUserId]); // Re-fetch cada vez que cambia el userId (login event)

  // Auto-retry si UNAUTHORIZED y hay token disponible (solo UN reintento, evita loops)
  useEffect(() => {
    if (error !== 'UNAUTHORIZED' || !isAuthenticated || typeof window === 'undefined') return;
    if (unauthorizedRetryDoneRef.current) return;
    unauthorizedRetryDoneRef.current = true;
    const retryTimer = setTimeout(() => {
      if (localStorage.getItem('jwt_token')) {
        refetchBalance();
      }
    }, 500);
    return () => clearTimeout(retryTimer);
  }, [error, isAuthenticated, refetchBalance]);

  // Manejar retorno de Stripe
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const rechargeStatus = params.get('recharge');
    if (rechargeStatus === 'success') {
      refetchBalance();
      window.history.replaceState({}, '', window.location.pathname);
    } else if (rechargeStatus === 'cancelled') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refetchBalance]);

  // ========================================
  // RETURN
  // ========================================

  return {
    balance,
    bonusBalance,
    canAfford,
    consumeService,
    creditLimit,
    currency,
    error,
    fetchTransactions,
    formatBalance,
    hasMoreTransactions,
    isCreditExhausted,
    isLowBalance,
    isNegativeBalance,
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
