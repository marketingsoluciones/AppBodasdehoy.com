'use client';

/**
 * GuestRegisterBanner — nudge de registro PERSISTENTE para visitantes (P0 fricción 3, 5-sep).
 * ============================================================================================
 * Feedback dispositivo real (JCP): la app "no incita a registrarse", que es lo que MÁS
 * interesa (captar data). El GuestWelcomeMessage solo aparece en la conversación de bienvenida
 * y se pierde al navegar; el límite de mensajes solo empuja cuando ya te quedaste sin ellos.
 * Este banner slim va SIEMPRE visible mientras seas visitante, con el beneficio concreto y un
 * CTA claro → /login?q=register. Se oculta en cuanto hay sesión real.
 */
import { createStyles } from 'antd-style';
import { UserPlus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo, useState } from 'react';

import { useDomainGuestUser } from '@/hooks/useDomainGuestUser';

const useStyles = createStyles(({ css, token }) => ({
  bar: css`
    display: flex;
    z-index: 50;
    gap: 10px;
    align-items: center;
    padding: 8px 12px;
    color: #fff;
    background: linear-gradient(90deg, ${token.colorPrimary}, ${token.magenta6 || token.colorPrimary});
  `,
  close: css`
    display: flex;
    flex: none;
    padding: 4px;
    color: rgba(255, 255, 255, 0.85);
    cursor: pointer;
  `,
  cta: css`
    flex: none;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    color: ${token.colorPrimary};
    white-space: nowrap;
    cursor: pointer;
    background: #fff;
    border: none;
    border-radius: 8px;
  `,
  text: css`
    flex: 1;
    min-width: 0;
    font-size: 12.5px;
    line-height: 1.3;
  `,
}));

const GuestRegisterBanner = memo(() => {
  const isGuest = useDomainGuestUser();
  const router = useRouter();
  const { styles } = useStyles();
  const [dismissed, setDismissed] = useState(false);

  if (!isGuest || dismissed) return null;

  return (
    <div className={styles.bar}>
      <UserPlus size={16} style={{ flex: 'none' }} />
      <span className={styles.text}>
        <b>Regístrate gratis</b> y guarda tu evento — invitados, mesas, presupuesto y web, sin
        límites.
      </span>
      <button className={styles.cta} onClick={() => router.push('/login?q=register')} type="button">
        Crear cuenta
      </button>
      <span
        aria-label="Cerrar"
        className={styles.close}
        onClick={() => setDismissed(true)}
        role="button"
      >
        <X size={15} />
      </span>
    </div>
  );
});

GuestRegisterBanner.displayName = 'GuestRegisterBanner';

export default GuestRegisterBanner;
