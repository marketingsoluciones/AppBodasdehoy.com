'use client';

import { Button, Skeleton } from 'antd';
import { createStyles } from 'antd-style';
import { Lock, Sparkles, Wallet } from 'lucide-react';
import { memo, type ReactNode, useEffect, useRef, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useWallet } from '@/hooks/useWallet';
import { useChatStore } from '@/store/chat';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    align-items: center;
    display: flex;
    flex: 1;
    flex-direction: column;
    height: 100%;
    justify-content: center;
    min-height: 400px;
    padding: 40px 24px;
  `,
  description: css`
    color: ${token.colorTextSecondary};
    font-size: 14px;
    line-height: 1.6;
    max-width: 380px;
    text-align: center;
  `,
  icon: css`
    align-items: center;
    border-radius: 50%;
    display: flex;
    height: 80px;
    justify-content: center;
    margin-bottom: 20px;
    width: 80px;
  `,
  iconBalance: css`
    background: linear-gradient(135deg, #f59e0b22, #f59e0b44);
    color: #f59e0b;
  `,
  iconGuest: css`
    background: linear-gradient(135deg, #667eea22, #764ba244);
    color: #667eea;
  `,
  title: css`
    color: ${token.colorText};
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 10px;
    text-align: center;
  `,
}));

interface FeatureGateProps {
  /** Contenido a mostrar si el acceso está permitido */
  children: ReactNode;
  /**
   * Descripción de la feature (para el mensaje de "sin saldo")
   * Ej: "para generar imágenes con IA" o "para acceder a tus recuerdos"
   */
  featureDescription?: string;
  /** Nombre de la feature para mostrar en el título */
  featureName: string;
  /**
   * Precio mínimo estimado por uso (€).
   * Si se pasa, se muestra en el mensaje de saldo insuficiente.
   */
  minCostEur?: number;
}

/**
 * FeatureGate — Envuelve features que requieren usuario registrado + saldo.
 *
 * Muestra 3 estados:
 *   1. Cargando — skeleton mientras se resuelve el estado
 *   2. Guest (no registrado) — pantalla "Regístrate para acceder"
 *   3. Sin saldo — pantalla "Recarga para acceder" + botón a billing
 *   4. OK — renderiza children
 */
const FeatureGate = memo<FeatureGateProps>(({
  children,
  featureDescription = 'para usar esta función',
  featureName,
  minCostEur,
}) => {
  const { styles } = useStyles();
  const currentUserId = useChatStore((s) => s.currentUserId);

  // Fallback: si el store Zustand aún no se hidrató, verificar localStorage
  const resolvedUserId = currentUserId || (() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('dev-user-config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.userId || parsed.user_id || null;
      }
    } catch { /* ignore */ }
    return null;
  })();

  const isGuest =
    !resolvedUserId ||
    resolvedUserId === 'visitante@guest.local' ||
    resolvedUserId === 'guest' ||
    resolvedUserId === 'anonymous' ||
    (typeof resolvedUserId === 'string' && resolvedUserId.startsWith('visitor_'));

  const { loading, totalBalance, setShowRechargeModal } = useWallet();

  // Timeout de escape: si el wallet no resuelve en 5s, renderizar igualmente.
  // Evita skeleton infinito cuando currentUserId llega tarde al store Zustand.
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isGuest && loading) {
      timerRef.current = setTimeout(() => setLoadingTimedOut(true), 5000);
    } else {
      setLoadingTimedOut(false);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isGuest, loading]);

  // Mientras carga el balance (solo para usuarios autenticados — guests no esperan)
  if (!isGuest && loading && !loadingTimedOut) {
    return (
      <Flexbox className={styles.container}>
        <Skeleton active paragraph={{ rows: 4 }} style={{ maxWidth: 400 }} title />
      </Flexbox>
    );
  }

  // Guest — no registrado
  if (isGuest) {
    return (
      <Flexbox className={styles.container} gap={16}>
        <div className={`${styles.icon} ${styles.iconGuest}`}>
          <Lock size={36} />
        </div>
        <div className={styles.title}>Función exclusiva para usuarios registrados</div>
        <div className={styles.description}>
          <strong>{featureName}</strong> solo está disponible para usuarios con cuenta.
          {' '}Regístrate gratis para acceder a esta y otras funciones del asistente.
        </div>
        <Flexbox gap={10} horizontal style={{ flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
          <Button
            href="https://organizador.bodasdehoy.com/login"
            icon={<Sparkles size={15} />}
            size="large"
            style={{ fontWeight: 600 }}
            target="_parent"
            type="primary"
          >
            Crear cuenta gratis
          </Button>
          <Button href="https://organizador.bodasdehoy.com/login" size="large" target="_parent">
            Iniciar sesión
          </Button>
        </Flexbox>
      </Flexbox>
    );
  }

  // Sin saldo — usuario registrado pero balance ≤ 0
  if (totalBalance <= 0) {
    return (
      <Flexbox className={styles.container} gap={16}>
        <div className={`${styles.icon} ${styles.iconBalance}`}>
          <Wallet size={36} />
        </div>
        <div className={styles.title}>Saldo insuficiente</div>
        <div className={styles.description}>
          <strong>{featureName}</strong> requiere saldo en tu wallet{' '}
          {featureDescription}.
          {minCostEur !== undefined && (
            <> El costo mínimo estimado es <strong>€{minCostEur.toFixed(2)}</strong> por uso.</>
          )}
          {' '}Recarga tu cuenta para continuar.
        </div>
        <Flexbox gap={10} horizontal style={{ flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
          <Button
            icon={<Wallet size={15} />}
            onClick={() => setShowRechargeModal(true)}
            size="large"
            style={{ fontWeight: 600 }}
            type="primary"
          >
            Recargar wallet
          </Button>
          <Button href="/settings/billing" size="large">
            Ver facturación
          </Button>
        </Flexbox>
      </Flexbox>
    );
  }

  // OK — acceso permitido
  return <>{children}</>;
});

FeatureGate.displayName = 'FeatureGate';

export { FeatureGate };
export type { FeatureGateProps };
