'use client';

import { Alert, Button } from 'antd';
import { memo, useEffect, useState } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';
import { useLoginModal } from '@/contexts/LoginModalContext';

/**
 * Banner que se muestra cuando el usuario está identificado pero sin JWT válido
 * Solicita que vuelva a iniciar sesión para poder ejecutar acciones de escritura
 */
const ReloginBanner = memo(() => {
  const { checkAuth } = useAuthCheck();
  const { openLoginModal } = useLoginModal();
  const [showBanner, setShowBanner] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Verificar estado de autenticación al montar
    const authResult = checkAuth();
    setShowBanner(authResult.needsRelogin);
    setUserEmail(authResult.userEmail);

    // También verificar periódicamente (cada 30 segundos)
    const interval = setInterval(() => {
      const result = checkAuth();
      setShowBanner(result.needsRelogin);
      setUserEmail(result.userEmail);
    }, 30_000);

    return () => clearInterval(interval);
  }, [checkAuth]);

  const handleLoginClick = () => {
    openLoginModal('session_expired');
  };

  if (!showBanner) return null;

  return (
    <Alert
      action={
        <Button onClick={handleLoginClick} size="small" type="primary">
          Iniciar Sesion
        </Button>
      }
      banner
      closable
      message={
        <span>
          <strong>Sesion expirada:</strong> Tu cuenta ({userEmail}) esta identificada pero tu sesion
          ha expirado. Para crear eventos y realizar otras acciones, necesitas volver a iniciar
          sesion.
        </span>
      }
      onClose={() => setShowBanner(false)}
      showIcon
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
      type="warning"
    />
  );
});

ReloginBanner.displayName = 'ReloginBanner';

export default ReloginBanner;
