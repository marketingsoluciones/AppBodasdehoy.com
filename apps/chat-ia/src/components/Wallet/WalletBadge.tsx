'use client';

import { Wallet } from 'lucide-react';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useWallet } from '@/hooks/useWallet';

export interface WalletBadgeProps {
  onClick?: () => void;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const WalletBadge = memo<WalletBadgeProps>(({ onClick, showDetails = false, size = 'medium' }) => {
  const { totalBalance, currency, isLowBalance, isNegativeBalance, loading, status, formatBalance } = useWallet();

  const sizeStyles = {
    large: { fontSize: 16, iconSize: 20, padding: '10px 16px' },
    medium: { fontSize: 14, iconSize: 18, padding: '8px 12px' },
    small: { fontSize: 12, iconSize: 14, padding: '4px 8px' },
  };

  const { fontSize, iconSize, padding } = sizeStyles[size];

  if (loading) {
    return (
      <Flexbox
        align="center"
        gap={6}
        horizontal
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 20,
          color: 'white',
          cursor: 'pointer',
          fontSize,
          fontWeight: 600,
          opacity: 0.7,
          padding,
        }}
      >
        <Wallet size={iconSize} />
        <span>...</span>
      </Flexbox>
    );
  }

  if (status !== 'ACTIVE') {
    return (
      <Flexbox
        align="center"
        gap={6}
        horizontal
        style={{
          background: '#6b7280',
          borderRadius: 20,
          color: 'white',
          cursor: 'not-allowed',
          fontSize,
          fontWeight: 600,
          padding,
        }}
        title="Wallet inactivo"
      >
        <span>Wallet inactivo</span>
      </Flexbox>
    );
  }

  return (
    <Flexbox
      align="center"
      as="button"
      gap={6}
      horizontal
      onClick={onClick}
      style={{
        animation: isLowBalance || isNegativeBalance ? 'pulse 2s infinite' : undefined,
        background: isNegativeBalance
          ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
          : isLowBalance
            ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        borderRadius: 20,
        color: 'white',
        cursor: 'pointer',
        fontSize,
        fontWeight: 600,
        padding,
        transition: 'all 0.2s ease',
      }}
      title={isNegativeBalance ? 'Saldo negativo - Click para recargar' : isLowBalance ? 'Saldo bajo - Click para recargar' : 'Ver wallet'}
    >
      <Wallet size={iconSize} />
      <span>{formatBalance(totalBalance)}</span>
      {(isLowBalance || isNegativeBalance) && (
        <span
          style={{
            alignItems: 'center',
            background: isNegativeBalance ? '#7f1d1d' : '#ef4444',
            borderRadius: '50%',
            display: 'flex',
            fontSize: 10,
            height: 16,
            justifyContent: 'center',
            width: 16,
          }}
        >
          {isNegativeBalance ? '−' : '!'}
        </span>
      )}

      {showDetails && (
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
        `}</style>
      )}
    </Flexbox>
  );
});

WalletBadge.displayName = 'WalletBadge';

export default WalletBadge;
