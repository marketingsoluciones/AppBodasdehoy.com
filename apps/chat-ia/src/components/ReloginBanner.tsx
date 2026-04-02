'use client';

import { Alert, Button } from 'antd';
import { memo, useEffect, useState } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { useChatStore } from '@/store/chat';

/**
 * Banner que se muestra cuando el usuario está identificado pero sin JWT válido.
 * - Posición fija en la parte superior (no sticky dentro de scroll containers).
 * - No se puede cerrar sin iniciar sesión — evita que el usuario lo descarte y trabaje con datos erróneos.
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

    recheck();
    window.addEventListener('api2:token-expired', recheck);
    const interval = setInterval(recheck, 30_000);
    return () => {
      window.removeEventListener('api2:token-expired', recheck);
      clearInterval(interval);
    };
  }, [checkAuth, chatCurrentUserId, chatUserProfile]);

  const handleLoginClick = () => {
    openLoginModal('session_expired');
  };

  if (!showBanner) return null;

  const accountLabel = userEmail ? `(${userEmail})` : '';

  return (
    <Alert
      action={
        <Button onClick={handleLoginClick} size="small" type="primary">
          Iniciar sesión
        </Button>
      }
      banner
      message={
        <span>
          <strong>Sesión expirada.</strong> Tu cuenta {accountLabel} está identificada pero la
          sesión ha caducado. Inicia sesión para seguir gestionando tu evento.
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
