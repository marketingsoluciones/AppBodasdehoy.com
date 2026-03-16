'use client';

import { CreditCard, Loader2, Lock, X } from 'lucide-react';
import { memo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { BalanceCheck } from '@/services/api2/wallet';

export interface RechargeModalProps {
  allowDebtMode?: boolean;
  balanceCheck?: BalanceCheck | null;
  /** Mensaje de detalle de api-ia (402/503) para mostrar en la UI */
  detailMessage?: string;
  isOpen: boolean;
  onClose: () => void;
  onContinueInDebt?: () => void;
  onRecharge: (amount: number) => Promise<{ error?: string; success: boolean }>;
}

const RECHARGE_AMOUNTS = [5, 10, 20, 50, 100];

const RechargeModal = memo<RechargeModalProps>(({ isOpen, onClose, balanceCheck, detailMessage, onRecharge, allowDebtMode, onContinueInDebt }) => {
  const suggestedAmount = balanceCheck ? Math.max(5, Math.ceil(balanceCheck.shortfall)) : 20;

  const [selectedAmount, setSelectedAmount] = useState(suggestedAmount);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const finalAmount = customAmount ? Number.parseFloat(customAmount) : selectedAmount;

  const handleRecharge = async () => {
    if (finalAmount < 5) {
      setError('El monto minimo es 5 EUR');
      return;
    }

    if (isNaN(finalAmount) || finalAmount <= 0) {
      setError('Por favor ingresa un monto válido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await onRecharge(finalAmount);

      if (!result.success) {
        const errorMsg = result.error || 'Error al crear sesión de pago';
        console.error('❌ [RechargeModal] Error:', errorMsg);
        setError(errorMsg);
        setLoading(false);
      } else {
        // Si es exitoso, se redirige automaticamente a Stripe
        // No resetear loading aquí porque la página se va a redirigir
      }
    } catch (error) {
      console.error('❌ [RechargeModal] Excepción:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido al procesar la recarga');
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `\u20AC${amount.toFixed(2)}`;

  return (
    <div
      onClick={onClose}
      style={{
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        height: '100vh',
        justifyContent: 'center',
        left: 0,
        position: 'fixed',
        top: 0,
        width: '100vw',
        zIndex: 1000,
      }}
    >
      <Flexbox
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--lobe-color-bg-container, #fff)',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: 480,
          padding: 24,
          width: '90%',
        }}
      >
        {/* Header */}
        <Flexbox horizontal justify="space-between" style={{ marginBottom: 20 }}>
          <Flexbox align="center" gap={8} horizontal>
            <CreditCard size={24} style={{ color: '#667eea' }} />
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Recargar Wallet</h2>
          </Flexbox>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </Flexbox>

        {detailMessage && (
          <p style={{ color: 'var(--lobe-color-text-secondary)', fontSize: 14, margin: '0 0 16px 0' }}>{detailMessage}</p>
        )}

        {/* Balance Info */}
        {balanceCheck && (
          <Flexbox
            gap={8}
            style={{
              background: 'var(--lobe-color-fill-tertiary, #f5f5f5)',
              borderRadius: 12,
              marginBottom: 20,
              padding: 16,
            }}
          >
            <Flexbox horizontal justify="space-between">
              <span style={{ color: 'var(--lobe-color-text-secondary)' }}>Tu saldo actual:</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(balanceCheck.total_balance)}</span>
            </Flexbox>
            <Flexbox horizontal justify="space-between">
              <span style={{ color: 'var(--lobe-color-text-secondary)' }}>Costo de operacion:</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(balanceCheck.required_amount)}</span>
            </Flexbox>
            <Flexbox
              horizontal
              justify="space-between"
              style={{
                borderTop: '1px solid var(--lobe-color-border)',
                marginTop: 8,
                paddingTop: 8,
              }}
            >
              <span style={{ color: '#ef4444', fontWeight: 500 }}>Te faltan:</span>
              <span style={{ color: '#ef4444', fontWeight: 700 }}>
                {formatCurrency(balanceCheck.shortfall)}
              </span>
            </Flexbox>
          </Flexbox>
        )}

        {/* Amount Selection */}
        <Flexbox gap={12} style={{ marginBottom: 20 }}>
          <label style={{ color: 'var(--lobe-color-text-secondary)', fontSize: 14 }}>
            Selecciona un monto:
          </label>
          <Flexbox gap={8} horizontal style={{ flexWrap: 'wrap' }}>
            {RECHARGE_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomAmount('');
                }}
                style={{
                  background:
                    selectedAmount === amount && !customAmount
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'var(--lobe-color-fill-tertiary, #f5f5f5)',
                  border: 'none',
                  borderRadius: 8,
                  color: selectedAmount === amount && !customAmount ? 'white' : 'inherit',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  padding: '10px 16px',
                  transition: 'all 0.2s ease',
                }}
              >
                {formatCurrency(amount)}
              </button>
            ))}
          </Flexbox>
        </Flexbox>

        {/* Custom Amount */}
        <Flexbox gap={8} style={{ marginBottom: 20 }}>
          <label style={{ color: 'var(--lobe-color-text-secondary)', fontSize: 14 }}>
            O ingresa otro monto:
          </label>
          <Flexbox
            align="center"
            horizontal
            style={{
              background: 'var(--lobe-color-fill-tertiary, #f5f5f5)',
              borderRadius: 8,
              padding: '0 12px',
            }}
          >
            <span style={{ color: 'var(--lobe-color-text-secondary)', fontSize: 16 }}>{'\u20AC'}</span>
            <input
              max="1000"
              min="5"
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Monto personalizado"
              step="0.01"
              style={{
                background: 'transparent',
                border: 'none',
                flex: 1,
                fontSize: 16,
                outline: 'none',
                padding: '12px 8px',
              }}
              type="number"
              value={customAmount}
            />
          </Flexbox>
        </Flexbox>

        {/* Error Message */}
        {error && (
          <Flexbox
            style={{
              background: '#fef2f2',
              borderRadius: 8,
              color: '#dc2626',
              marginBottom: 16,
              padding: 12,
            }}
          >
            {error}
          </Flexbox>
        )}

        {/* Actions */}
        <Flexbox gap={12} horizontal>
          <button
            onClick={onClose}
            style={{
              background: 'var(--lobe-color-fill-tertiary, #f5f5f5)',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              flex: 1,
              fontSize: 14,
              fontWeight: 500,
              padding: '12px 16px',
            }}
          >
            Cancelar
          </button>
          <button
            disabled={loading || finalAmount < 5}
            onClick={handleRecharge}
            style={{
              alignItems: 'center',
              background:
                loading || finalAmount < 5
                  ? '#d1d5db'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              cursor: loading || finalAmount < 5 ? 'not-allowed' : 'pointer',
              display: 'flex',
              flex: 2,
              fontSize: 14,
              fontWeight: 600,
              gap: 8,
              justifyContent: 'center',
              padding: '12px 16px',
            }}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Procesando...
              </>
            ) : (
              `Recargar ${formatCurrency(finalAmount)}`
            )}
          </button>
        </Flexbox>

        {/* Modo crédito (saldo negativo) — solo si está habilitado */}
        {allowDebtMode && onContinueInDebt && (
          <button
            onClick={onContinueInDebt}
            style={{
              background: 'none',
              border: '1px dashed #d97706',
              borderRadius: 8,
              color: '#d97706',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              marginTop: 8,
              padding: '10px 16px',
              width: '100%',
            }}
            title="Continuar en modo crédito. Se registrará la deuda para pago posterior."
          >
            Continuar en modo crédito (saldo negativo)
          </button>
        )}

        {/* Security Info */}
        <Flexbox
          align="center"
          gap={16}
          horizontal
          justify="center"
          style={{
            color: 'var(--lobe-color-text-tertiary)',
            fontSize: 12,
            marginTop: 16,
          }}
        >
          <Flexbox align="center" gap={4} horizontal>
            <Lock size={12} />
            <span>Pago seguro con Stripe</span>
          </Flexbox>
          <span>Visa, Mastercard, AmEx</span>
        </Flexbox>
      </Flexbox>
    </div>
  );
});

RechargeModal.displayName = 'RechargeModal';

export default RechargeModal;
