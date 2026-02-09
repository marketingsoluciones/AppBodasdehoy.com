'use client';

import { memo } from 'react';

import { useWallet } from '@/hooks/useWallet';

import RechargeModal from './RechargeModal';
import WalletBadge from './WalletBadge';



/**
 * Componente completo de Wallet que incluye:
 * - Badge para mostrar saldo
 * - Modal de recarga
 *
 * Uso:
 * ```tsx
 * <WalletWidget size="medium" />
 * ```
 */
export interface WalletWidgetProps {
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const WalletWidget = memo<WalletWidgetProps>(({ size = 'medium', showDetails = false }) => {
  const {
    showRechargeModal,
    setShowRechargeModal,
    lastBalanceCheck,
    startRecharge,
  } = useWallet();

  const handleRecharge = async (amount: number) => {
    const result = await startRecharge(amount);
    return {
      error: result.error_message,
      success: result.success,
    };
  };

  return (
    <>
      <WalletBadge
        onClick={() => setShowRechargeModal(true)}
        showDetails={showDetails}
        size={size}
      />

      <RechargeModal
        balanceCheck={lastBalanceCheck}
        isOpen={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
        onRecharge={handleRecharge}
      />
    </>
  );
});

WalletWidget.displayName = 'WalletWidget';

export default WalletWidget;

export {default as RechargeModal} from './RechargeModal';
export {default as WalletBadge} from './WalletBadge';