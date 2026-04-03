'use client';

import { Alert, Button } from 'antd';
import { memo, useEffect, useState } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { useChatStore } from '@/store/chat';

/**
 * Banner que se muestra cuando el usuario está identificado pero sin JWT válido.
 * - Posición fija en la parte superior (no sticky dentro de scroll containers).
 * - Dos opciones: re-login O continuar como visitante (degrada limpiamente a visitante).
 * - El email se resuelve desde múltiples fuentes para evitar los paréntesis vacíos.
 */
const ReloginBanner = memo(() => {
  const { checkAuth } = useAuthCheck();
  const { openLoginModal } = useLoginModal();
  const [showBanner, setShowBanner] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Fallback: leer email desde el chat store si dev-user-config no lo tiene
  const chatCurrentUserId = useChatStore((s) => s.currentUserId);
  const chatUserProfile = useChatStore((s) => s.userProfile);

  useEffect(() => {
    const recheck = () => {
      const result = checkAuth();
      setShowBanner(result.needsRelogin);

      // Resolver email: prioridad config > chatStore profile > chatStore userId (si es email)
      const resolvedEmail =
        result.userEmail ||
        chatUserProfile?.email ||
        (chatCurrentUserId?.includes('@') ? chatCurrentUserId : null);
      setUserEmail(resolvedEmail);
    };

    // Verificar al volver a la pestaña (el usuario puede haber estado inactivo horas)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') recheck();
    };

    recheck();
    window.addEventListener('api2:token-expired', recheck);
    document.addEventListener('visibilitychange', onVisibilityChange);
    const interval = setInterval(recheck, 30_000);
    return () => {
      window.removeEventListener('api2:token-expired', recheck);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(interval);
    };
  }, [checkAuth, chatCurrentUserId, chatUserProfile]);

  const handleLoginClick = () => {
    openLoginModal('session_expired');
  };

  /**
   * Degrada al usuario a visitante anónimo:
   * 1. Limpia JWT y config de usuario
   * 2. Genera un visitor_id nuevo en dev-user-config
   * 3. Recarga la página para aplicar el estado visitante correctamente
   */
  const handleContinueAsVisitor = () => {
    try {
      // Limpiar tokens
      localStorage.removeItem('api2_jwt_token');
      localStorage.removeItem('api2_jwt_expires_at');
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('jwt_token_cache');

      // Generar nuevo ID de visitante y resetear dev-user-config
      const visitorId = `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const rawConfig = localStorage.getItem('dev-user-config');
      const config = rawConfig ? JSON.parse(rawConfig) : {};
      const visitorConfig = {
        development: config.development || 'bodasdehoy',
        token: undefined,
        user_id: visitorId,
      };
      localStorage.setItem('dev-user-config', JSON.stringify(visitorConfig));

      // Recargar para aplicar estado visitante en todos los stores/hooks
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  if (!showBanner) return null;

  const accountLabel = userEmail ? `(${userEmail})` : '';

  return (
    <Alert
      action={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={handleContinueAsVisitor} size="small" type="default">
            Continuar como visitante
          </Button>
          <Button onClick={handleLoginClick} size="small" type="primary">
            Iniciar sesión
          </Button>
        </div>
      }
      banner
      message={
        <span>
          <strong>Sesión expirada.</strong> Tu cuenta {accountLabel} ha caducado.
          Inicia sesión para continuar o accede como visitante con funciones limitadas.
        </span>
      }
      showIcon
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
      }}
      type="warning"
    />
  );
});

ReloginBanner.displayName = 'ReloginBanner';

export default ReloginBanner;
