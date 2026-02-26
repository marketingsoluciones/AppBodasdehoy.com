'use client';

import { AlertTriangle, X } from 'lucide-react';
import { memo, useCallback } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { useWallet } from '@/hooks/useWallet';

/**
 * Banner no-bloqueante que aparece cuando el chat está en modo saldo negativo.
 * El usuario puede seguir chateando, pero se le recuerda que tiene deuda.
 */
const NegativeBalanceBanner = memo(() => {
  const negativeBalanceMode = useChatStore((s) => s.negativeBalanceMode);
  const { totalBalance, formatBalance, isNegativeBalance } = useWallet();

  const handleDismiss = useCallback(() => {
    useChatStore.setState({ negativeBalanceMode: false });
  }, []);

  const handleRecharge = useCallback(() => {
    useChatStore.setState({ negativeBalanceMode: false, showInsufficientBalance: true });
  }, []);

  if (!negativeBalanceMode && !isNegativeBalance) return null;

  return (
    <Flexbox
      align="center"
      gap={8}
      horizontal
      justify="space-between"
      style={{
        background: 'linear-gradient(90deg, #92400e 0%, #b45309 100%)',
        color: 'white',
        fontSize: 13,
        padding: '8px 16px',
        position: 'relative',
        width: '100%',
      }}
    >
      <Flexbox align="center" gap={8} horizontal>
        <AlertTriangle size={15} style={{ flexShrink: 0 }} />
        <span>
          Modo crédito activo — Saldo:{' '}
          <strong>{formatBalance(totalBalance)}</strong>
          {' '}· El chat continúa, pero tienes deuda pendiente.
        </span>
      </Flexbox>
      <Flexbox align="center" gap={8} horizontal style={{ flexShrink: 0 }}>
        <button
          onClick={handleRecharge}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: 6,
            color: 'white',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            padding: '4px 10px',
          }}
        >
          Recargar
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            padding: 2,
          }}
        >
          <X size={14} />
        </button>
      </Flexbox>
    </Flexbox>
  );
});

NegativeBalanceBanner.displayName = 'NegativeBalanceBanner';

export default NegativeBalanceBanner;
