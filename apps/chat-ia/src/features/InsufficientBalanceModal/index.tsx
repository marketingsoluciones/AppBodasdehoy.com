'use client';

import { Clock, X } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import RechargeModal from '@/components/Wallet/RechargeModal';
import { walletService } from '@/services/api2/wallet';
import { useChatStore } from '@/store/chat';

const allowNegativeBalance = process.env.NEXT_PUBLIC_ALLOW_NEGATIVE_BALANCE === 'true';

/**
 * Modal para límites de tiempo (velocity_throttle, daily_limit).
 * Muestra countdown cuando hay reset_at; de lo contrario solo el mensaje.
 * Se auto-cierra cuando el countdown llega a 0.
 */
const ThrottleModal = memo<{
  message?: string;
  onClose: () => void;
  resetAt?: string;
  screenType?: string;
}>(({ message, onClose, resetAt, screenType }) => {
  const [secsLeft, setSecsLeft] = useState(() =>
    resetAt ? Math.max(0, Math.floor((new Date(resetAt).getTime() - Date.now()) / 1000)) : 0,
  );

  useEffect(() => {
    if (!resetAt) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.floor((new Date(resetAt).getTime() - Date.now()) / 1000));
      setSecsLeft(left);
      if (left === 0) {
        clearInterval(id);
        onClose();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [resetAt, onClose]);

  const isDaily = screenType === 'daily_limit';
  const title = isDaily ? 'Límite diario alcanzado' : 'Vas muy rápido';
  const subtitle = isDaily
    ? (message ?? 'Has agotado tu límite diario de consultas. Se renueva mañana.')
    : (message ?? 'Has enviado demasiados mensajes en poco tiempo. Espera un momento.');

  const mins = Math.floor(secsLeft / 60);
  const secs = secsLeft % 60;

  return (
    <div
      onClick={onClose}
      style={{
        alignItems: 'center',
        background: 'rgba(0,0,0,0.5)',
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
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          maxWidth: 400,
          padding: 24,
          width: '90%',
        }}
      >
        {/* Header */}
        <Flexbox horizontal justify="space-between" style={{ marginBottom: 16 }}>
          <Flexbox align="center" gap={8} horizontal>
            <Clock size={22} style={{ color: '#d97706' }} />
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{title}</h2>
          </Flexbox>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <X size={18} />
          </button>
        </Flexbox>

        <p style={{ color: 'var(--lobe-color-text-secondary)', fontSize: 14, marginBottom: 16 }}>
          {subtitle}
        </p>

        {!isDaily && secsLeft > 0 && (
          <Flexbox
            align="center"
            justify="center"
            style={{
              background: '#fef3c7',
              borderRadius: 12,
              color: '#92400e',
              fontSize: 28,
              fontWeight: 700,
              marginBottom: 16,
              padding: '12px 0',
            }}
          >
            {mins > 0 ? `${mins}m ${secs}s` : `${secs}s`}
          </Flexbox>
        )}

        <button
          onClick={onClose}
          style={{
            background: 'var(--lobe-color-fill-tertiary, #f5f5f5)',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            padding: '10px 16px',
            width: '100%',
          }}
        >
          Entendido
        </button>
      </Flexbox>
    </div>
  );
});

ThrottleModal.displayName = 'ThrottleModal';

/**
 * Modal que se abre automáticamente cuando el backend devuelve 402 (saldo/cuota insuficiente)
 * o 429 (límite de velocidad/diario) durante una conversación en el chat.
 *
 * Comportamiento por screen_type:
 *   velocity_throttle → ThrottleModal con countdown hasta reset_at
 *   daily_limit       → ThrottleModal con mensaje "vuelve mañana"
 *   both_exhausted    → RechargeModal + botón "Ver planes"
 *   plan_upgrade      → RechargeModal + botón "Ver planes"
 *   wallet_exhausted  → RechargeModal (solo recarga)
 *   (default)         → RechargeModal (solo recarga)
 */
const InsufficientBalanceModal = memo(() => {
  const showInsufficientBalance = useChatStore((s) => s.showInsufficientBalance);
  const apiErrorDetail = useChatStore((s) => s.apiErrorDetail);
  const apiErrorScreenType = useChatStore((s) => s.apiErrorScreenType);
  const throttleResetAt = useChatStore((s) => s.throttleResetAt);

  const handleClose = useCallback(() => {
    useChatStore.setState({
      apiErrorDetail: undefined,
      apiErrorScreenType: undefined,
      showInsufficientBalance: false,
      throttleResetAt: undefined,
    });
  }, []);

  const handleContinueInDebt = useCallback(() => {
    useChatStore.setState({
      apiErrorDetail: undefined,
      apiErrorScreenType: undefined,
      negativeBalanceMode: true,
      showInsufficientBalance: false,
      throttleResetAt: undefined,
    });
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

  if (!showInsufficientBalance) return null;

  // Límites de tiempo (no de dinero) → ThrottleModal con countdown o mensaje
  const isTimeLimit =
    apiErrorScreenType === 'velocity_throttle' || apiErrorScreenType === 'daily_limit';

  if (isTimeLimit) {
    return (
      <ThrottleModal
        message={apiErrorDetail}
        onClose={handleClose}
        resetAt={throttleResetAt}
        screenType={apiErrorScreenType}
      />
    );
  }

  // Límites de dinero → RechargeModal con botón extra "Ver planes" si corresponde
  const plansUrl =
    apiErrorScreenType === 'both_exhausted' || apiErrorScreenType === 'plan_upgrade'
      ? '/settings/billing/planes'
      : undefined;

  return (
    <RechargeModal
      allowDebtMode={allowNegativeBalance}
      detailMessage={apiErrorDetail}
      isOpen={showInsufficientBalance}
      onClose={handleClose}
      onContinueInDebt={handleContinueInDebt}
      onRecharge={handleRecharge}
      plansUrl={plansUrl}
    />
  );
});

InsufficientBalanceModal.displayName = 'InsufficientBalanceModal';

export default InsufficientBalanceModal;
