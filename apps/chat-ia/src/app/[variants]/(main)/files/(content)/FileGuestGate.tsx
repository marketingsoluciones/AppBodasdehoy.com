'use client';

import { Button } from 'antd';
import { createStyles } from 'antd-style';
import { FolderLock, Sparkles } from 'lucide-react';
import { memo, type ReactNode } from 'react';
import { Flexbox } from 'react-layout-kit';

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
    background: linear-gradient(135deg, #667eea22, #764ba244);
    border-radius: 50%;
    color: #667eea;
    display: flex;
    height: 80px;
    justify-content: center;
    margin-bottom: 20px;
    width: 80px;
  `,
  title: css`
    color: ${token.colorText};
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 10px;
    text-align: center;
  `,
}));

/**
 * Gate que solo bloquea visitantes/guests en la página de archivos.
 * Usuarios registrados (con o sin saldo) siempre pueden ver sus archivos.
 */
const FileGuestGate = memo<{ children: ReactNode }>(({ children }) => {
  const { styles } = useStyles();
  const currentUserId = useChatStore((s) => s.currentUserId);

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

  if (isGuest) {
    return (
      <Flexbox className={styles.container} gap={16}>
        <div className={styles.icon}>
          <FolderLock size={36} />
        </div>
        <div className={styles.title}>Archivos disponibles para usuarios registrados</div>
        <div className={styles.description}>
          Sube fotos, documentos y archivos de tu evento. Organiza todo en un solo lugar
          con almacenamiento seguro en la nube.
          Crea tu cuenta gratis para empezar.
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
            Iniciar sesion
          </Button>
        </Flexbox>
      </Flexbox>
    );
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
});

FileGuestGate.displayName = 'FileGuestGate';

export default FileGuestGate;
