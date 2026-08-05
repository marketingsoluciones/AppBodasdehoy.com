'use client';

import { Button } from 'antd';
import { createStyles } from 'antd-style';
import { FolderLock, Sparkles } from 'lucide-react';
import { memo, type ReactNode } from 'react';
import { Flexbox } from 'react-layout-kit';

import CircleLoading from '@/components/Loading/CircleLoading';
import { useDomainGuestUser } from '@/hooks/useDomainGuestUser';
import { useUserStore } from '@/store/user';
import { preferenceSelectors } from '@/store/user/selectors';

// BUG QA 30-jul: el gate mandaba a app*.bodasdehoy.com/login (la app de eventos) →
// desde chat-dev saltaba a PRODUCCIÓN (app.bodasdehoy.com) y sacaba al usuario de
// chat-dev. El login unificado vive en chat-ia mismo, así que apuntamos a /login del
// MISMO origen: en chat-dev se queda en chat-dev, en chat en chat, etc. El middleware
// SSO (idTokenV0.1.0 → /api/auth/sso-auto) resuelve la sesión sin salir de la app.
const getLoginUrl = () => '/login';

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
  // HD-03/HD-04 QA (24-jul): antes decidía guest solo por currentUserId/dev-config →
  // cuando Firebase perdía el token (HD-05), mostraba el gate de VISITANTE aunque el
  // usuario tuviera sesión (isSignedIn). Ahora usa la detección CANÓNICA
  // useDomainGuestUser (requiere !isSignedIn Y confirmación del chat store), consistente
  // con el fix raíz de auth (PR #207). Evita la caída silenciosa a visitante.
  const isGuest = useDomainGuestUser();
  // #10 (QA 5-ago): no decidir "invitado" hasta que el estado de usuario esté
  // inicializado. Antes, durante el arranque de auth (recarga forzada), el gate caía
  // a guest=true por defecto y mostraba el muro de "Crear cuenta" pese a haber sesión
  // válida (falso-negativo). Mientras inicializa, mostramos loader (no cambiamos la
  // lógica de determinación de guest → cero impacto de seguridad).
  const isUserStateInit = useUserStore(preferenceSelectors.isPreferenceInit);

  if (!isUserStateInit) {
    return (
      <Flexbox className={styles.container} gap={16}>
        <CircleLoading />
      </Flexbox>
    );
  }

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
            href={getLoginUrl()}
            icon={<Sparkles size={15} />}
            size="large"
            style={{ fontWeight: 600 }}
            target="_self"
            type="primary"
          >
            Crear cuenta gratis
          </Button>
          <Button href={getLoginUrl()} size="large" target="_self">
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
