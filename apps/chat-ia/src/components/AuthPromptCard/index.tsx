'use client';

import { LoginOutlined, UserAddOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';
import React, { useMemo } from 'react';

import { useLoginModal } from '@/contexts/LoginModalContext';
import { getCurrentDevelopmentConfig } from '@/utils/developmentDetector';

interface AuthPromptCardProps {
  action?: string;
  messageContent?: string;
  onRegister?: () => void;
}

/**
 * Componente que se muestra en el chat cuando se requiere autenticación
 * Ofrece opciones claras para registrarse o iniciar sesión
 * Se adapta a los colores del whitelabel actual
 *
 * ✅ MEJORADO (28 Dic 2025): Detecta si el usuario tiene cuenta (sesión expirada)
 * vs. si es un usuario nuevo que necesita registrarse
 */
const AuthPromptCard: React.FC<AuthPromptCardProps> = ({
  action = 'continuar',
  messageContent = '',
  onRegister
}) => {
  const { openLoginModal } = useLoginModal();
  const developmentConfig = getCurrentDevelopmentConfig();

  // ✅ Detectar si es sesión expirada vs. usuario nuevo
  const isSessionExpired = useMemo(() => {
    const content = messageContent.toLowerCase();
    return (
      content.includes('sesión ha expirado') ||
      content.includes('sesion ha expirado') ||
      content.includes('session expired') ||
      content.includes('volver a iniciar sesión') ||
      content.includes('ya que tu cuenta') ||
      content.includes('tu cuenta está registrada') ||
      content.includes('solo necesitas volver a iniciar sesión')
    );
  }, [messageContent]);

  // Colores dinámicos según el whitelabel
  const brandColors = {
    gradient: `linear-gradient(135deg, ${developmentConfig.colors.primary} 0%, ${developmentConfig.colors.secondary} 100%)`,
    primary: developmentConfig.colors.primary,
  };

  const handleLogin = () => {
    openLoginModal('premium_feature');
  };

  const handleRegister = () => {
    if (onRegister) {
      onRegister();
    } else {
      // Abrir modal de login que también permite registro
      openLoginModal('premium_feature');
    }
  };

  // Mensajes diferentes según si es sesión expirada o usuario nuevo
  const title = isSessionExpired
    ? 'Tu sesión ha expirado'
    : `Para ${action} necesitas una cuenta`;

  const subtitle = isSessionExpired
    ? 'Inicia sesión para continuar con tu conversación'
    : 'Es gratis y solo toma unos segundos';

  return (
    <Card
      size="small"
      style={{
        background: brandColors.gradient,
        border: 'none',
        borderRadius: '12px',
        marginTop: '12px',
        maxWidth: '400px',
      }}
    >
      <div style={{ color: 'white', textAlign: 'center' }}>
        <div style={{ fontSize: '20px', marginBottom: '8px' }}>
          🔐
        </div>
        <div style={{
          fontSize: '15px',
          fontWeight: 600,
          marginBottom: '4px'
        }}>
          {title}
        </div>
        <div style={{
          fontSize: '13px',
          marginBottom: '16px',
          opacity: 0.9
        }}>
          {subtitle}
        </div>

        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center'
        }}>
          {/* Si es sesión expirada, mostrar solo botón de login primero */}
          {isSessionExpired ? (
            <>
              <Button
                icon={<LoginOutlined />}
                onClick={handleLogin}
                size="middle"
                style={{
                  background: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  color: brandColors.primary,
                  fontWeight: 600,
                }}
              >
                Iniciar Sesión
              </Button>
              <Button
                ghost
                icon={<UserAddOutlined />}
                onClick={handleRegister}
                size="middle"
                style={{
                  borderColor: 'white',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: 500,
                }}
              >
                Otra cuenta
              </Button>
            </>
          ) : (
            <>
              <Button
                icon={<UserAddOutlined />}
                onClick={handleRegister}
                size="middle"
                style={{
                  background: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  color: brandColors.primary,
                  fontWeight: 600,
                }}
              >
                Registrarme
              </Button>
              <Button
                ghost
                icon={<LoginOutlined />}
                onClick={handleLogin}
                size="middle"
                style={{
                  borderColor: 'white',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: 500,
                }}
              >
                Ya tengo cuenta
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AuthPromptCard;
