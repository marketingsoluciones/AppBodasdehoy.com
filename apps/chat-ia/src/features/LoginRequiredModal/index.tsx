'use client';

import { memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createStyles } from 'antd-style';
import { Modal } from 'antd';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';

const useStyles = createStyles(({ css, token }) => ({
  featureItem: css`
    color: ${token.colorTextSecondary};
    font-size: 13px;
  `,
  features: css`
    background: ${token.colorFillAlter};
    border-radius: 10px;
    padding: 14px 16px;
    width: 100%;
  `,
  icon: css`
    font-size: 52px;
    line-height: 1;
    margin-bottom: 8px;
    text-align: center;
  `,
  primaryBtn: css`
    background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%);
    border: none;
    border-radius: 10px;
    color: white;
    cursor: pointer;
    font-size: 15px;
    font-weight: 600;
    padding: 12px 24px;
    width: 100%;
    transition: opacity 0.2s;
    &:hover { opacity: 0.9; }
  `,
  secondaryBtn: css`
    background: transparent;
    border: 1px solid ${token.colorBorder};
    border-radius: 10px;
    color: ${token.colorText};
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    padding: 10px 24px;
    width: 100%;
    transition: background 0.2s;
    &:hover { background: ${token.colorFillAlter}; }
  `,
  subtitle: css`
    color: ${token.colorTextSecondary};
    font-size: 14px;
    line-height: 1.6;
    text-align: center;
  `,
  title: css`
    color: ${token.colorText};
    font-size: 20px;
    font-weight: 700;
    text-align: center;
  `,
}));

/**
 * Modal que se abre automáticamente cuando api-ia devuelve 401 (login_required)
 * Ocurre cuando un usuario "visitor" sin cuenta registrada alcanza el límite de uso gratuito.
 */
const LoginRequiredModal = memo(() => {
  const { styles } = useStyles();
  const router = useRouter();
  const showLoginRequired = useChatStore((s) => s.showLoginRequired);

  const handleClose = useCallback(() => {
    useChatStore.setState({ showLoginRequired: false });
  }, []);

  const handleRegister = useCallback(() => {
    useChatStore.setState({ showLoginRequired: false });
    router.push('/login?mode=register');
  }, [router]);

  const handleLogin = useCallback(() => {
    useChatStore.setState({ showLoginRequired: false });
    router.push('/login');
  }, [router]);

  const features = [
    '✨ Asistente IA sin límites de sesión',
    '📋 Gestión completa de invitados y mesas',
    '💰 Control de presupuesto en tiempo real',
    '📸 Álbum de fotos Memories ilimitado',
  ];

  return (
    <Modal
      centered
      footer={null}
      onCancel={handleClose}
      open={showLoginRequired}
      width={420}
    >
      <Flexbox align="center" gap={16} style={{ padding: '8px 0 4px' }}>
        <div className={styles.icon}>🎉</div>
        <div className={styles.title}>¡Crea tu cuenta gratis!</div>
        <div className={styles.subtitle}>
          Has usado tu sesión de prueba. Regístrate para seguir organizando tu boda con el Copilot IA
          y acceder a todas las herramientas sin límites.
        </div>

        <div className={styles.features}>
          <Flexbox gap={8}>
            {features.map((f) => (
              <div className={styles.featureItem} key={f}>{f}</div>
            ))}
          </Flexbox>
        </div>

        <Flexbox gap={10} style={{ width: '100%' }}>
          <button className={styles.primaryBtn} onClick={handleRegister} type="button">
            Crear cuenta gratis
          </button>
          <button className={styles.secondaryBtn} onClick={handleLogin} type="button">
            Ya tengo cuenta — Iniciar sesión
          </button>
        </Flexbox>
      </Flexbox>
    </Modal>
  );
});

LoginRequiredModal.displayName = 'LoginRequiredModal';

export default LoginRequiredModal;
