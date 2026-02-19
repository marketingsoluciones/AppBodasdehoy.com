'use client';

import { memo, useCallback } from 'react';

import RechargeModal from '@/components/Wallet/RechargeModal';
import { walletService } from '@/services/api2/wallet';
import { useChatStore } from '@/store/chat';

/**
 * Modal que se abre automáticamente cuando el backend devuelve 402 (saldo insuficiente)
 * durante una conversación en el chat.
 */
const InsufficientBalanceModal = memo(() => {
  const showInsufficientBalance = useChatStore((s) => s.showInsufficientBalance);

  const handleClose = useCallback(() => {
    useChatStore.setState({ showInsufficientBalance: false });
  }, []);

  const handleRecharge = useCallback(async (amount: number) => {
    try {
      const successUrl = `${window.location.origin}/settings/billing?recharge=success`;
      const cancelUrl = `${window.location.origin}/chat`;

      const result = await walletService.createRechargeSession(amount, successUrl, cancelUrl);

      if (result.success && result.checkout_url) {
        window.location.href = result.checkout_url;
        return { success: true };
      }

      return {
        error: result.error_message || 'Error al crear sesión de pago',
        success: false,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Error desconocido',
        success: false,
      };
    }
  }, []);

  return (
    <RechargeModal
      isOpen={showInsufficientBalance}
      onClose={handleClose}
      onRecharge={handleRecharge}
    />
  );
});

InsufficientBalanceModal.displayName = 'InsufficientBalanceModal';

export default InsufficientBalanceModal;
