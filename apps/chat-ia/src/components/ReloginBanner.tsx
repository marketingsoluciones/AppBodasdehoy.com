'use client';

import { Alert, Button } from 'antd';
import { memo, useEffect, useState } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { useChatStore } from '@/store/chat';

/** Minutos restantes hasta que expire el JWT de api-ia. null = sin info. */
const getJwtMinutesRemaining = (): number | null => {
  if (typeof window === 'undefined') return null;
  const expiresAt = localStorage.getItem('api2_jwt_expires_at');
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.floor(ms / 60_000);
};

/** Umbral (minutos) para mostrar la advertencia proactiva. */
const WARN_THRESHOLD_MIN = 5;

/**
 * Banner que se muestra:
 * - (amarillo) cuando el JWT expira en < 5 min — aviso proactivo
 * - (naranja) cuando el JWT ya expiró — usuario identificado sin JWT válido
 *
 * Posición fija en la parte superior. Sin scroll.
 * Dos opciones: re-login O continuar como visitante.
 */
const ReloginBanner = memo(() => {
  const { checkAuth } = useAuthCheck();
  const { openLoginModal } = useLoginModal();
  const [showBanner, setShowBanner] = useState(false);
  const [showWarningSoon, setShowWarningSoon] = useState(false);
  const [minutesRemaining, setMinutesRemaining] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Fallback: leer email desde el chat store si dev-user-config no lo tiene
  const chatCurrentUserId = useChatStore((s) => s.currentUserId);
  const chatUserProfile = useChatStore((s) => s.userProfile);

  useEffect(() => {
    const recheck = () => {
      const result = checkAuth();
      setShowBanner(result.needsRelogin);

      // Proactive warning: autenticado + JWT válido pero expira pronto
      const mins = getJwtMinutesRemaining();
      setMinutesRemaining(mins);
      const expiringSoon =
        result.isAuthenticated &&
        !result.needsRelogin &&
        mins !== null &&
        mins >= 0 &&
        mins < WARN_THRESHOLD_MIN;
      setShowWarningSoon(expiringSoon);

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
    window.addEventListener('api2:token-refreshed', recheck);
    document.addEventListener('visibilitychange', onVisibilityChange);
    const interval = setInterval(recheck, 30_000);
    return () => {
      window.removeEventListener('api2:token-expired', recheck);
      window.removeEventListener('api2:token-refreshed', recheck);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(interval);
    };
  }, [checkAuth, chatCurrentUserId, chatUserProfile]);

  const handleLoginClick = () => {
    openLoginModal('session_expired');
  };

  const handleRenewClick = () => {
    openLoginModal('session_expiring_soon');
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

  if (!showBanner && !showWarningSoon) return null;

  const accountLabel = userEmail ? ` (${userEmail})` : '';
  const bannerStyle = { position: 'fixed' as const, top: 0, left: 0, right: 0, zIndex: 9999 };

  // Sesión expirada — acción requerida
  if (showBanner) {
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
            <strong>Sesión expirada.</strong> Tu cuenta{accountLabel} ha caducado.
            Inicia sesión para continuar o accede como visitante con funciones limitadas.
          </span>
        }
        showIcon
        style={bannerStyle}
        type="warning"
      />
    );
  }

  // Sesión expirará pronto — aviso proactivo
  const minsLabel = minutesRemaining === 1 ? '1 minuto' : `${minutesRemaining} minutos`;
  return (
    <Alert
      action={
        <Button onClick={handleRenewClick} size="small" type="primary">
          Renovar sesión
        </Button>
      }
      banner
      message={
        <span>
          Tu sesión expirará en <strong>{minsLabel}</strong>. Renuévala para no perder el trabajo.
        </span>
      }
      showIcon
      style={bannerStyle}
      type="info"
    />
  );
});

ReloginBanner.displayName = 'ReloginBanner';

export default ReloginBanner;
