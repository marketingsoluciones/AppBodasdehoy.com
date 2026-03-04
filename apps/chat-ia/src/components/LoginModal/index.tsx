'use client';

import { CloseOutlined, FacebookOutlined, GoogleOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Divider, Form, Input, Modal, Tabs, message } from 'antd';
import React, { useState } from 'react';

import { useLoginModal } from '@/contexts/LoginModalContext';
import {
  loginWithEmailPassword,
  loginWithFacebook,
  loginWithGoogle,
  registerWithEmailPassword,
} from '@/services/firebase-auth';
import { getCurrentDevelopment, getCurrentDevelopmentConfig } from '@/utils/developmentDetector';

interface LoginModalProps {
  onLoginSuccess?: () => void;
}

/**
 * Modal de Login/Registro adaptable al branding de cada whitelabel
 * Compatible con el sistema de autenticación de bodasdehoy.com
 * Soporta: bodasdehoy, eventosorganizador, champagneevents, annloevents
 */
const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const { isLoginModalOpen, closeLoginModal, loginReason, openLoginModal } = useLoginModal();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState<'google' | 'facebook' | 'email' | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();

  const development = getCurrentDevelopment();
  const developmentConfig = getCurrentDevelopmentConfig();

  // Colores dinámicos según el whitelabel actual
  const brandColors = {
    accent: developmentConfig.colors.accent,
    gradient: `linear-gradient(135deg, ${developmentConfig.colors.primary} 0%, ${developmentConfig.colors.secondary} 100%)`,
    primary: developmentConfig.colors.primary,
    secondary: developmentConfig.colors.secondary,
  };

  const handleSuccess = (data: any) => {
    console.log('✅ Login exitoso:', data);
    messageApi.success('¡Bienvenido!');
    closeLoginModal();
    onLoginSuccess?.();
    // Recargar para actualizar el estado
    setTimeout(() => window.location.reload(), 500);
  };

  const handleError = (error: Error) => {
    console.error('❌ Error en autenticación:', error);
    messageApi.error(error.message || 'Error al autenticar');
    setLoading(null);
  };

  const handleGoogleLogin = async () => {
    setLoading('google');
    try {
      const result = await loginWithGoogle(development);
      if (result?.success) {
        // ✅ Mostrar advertencia si hay error de JWT pero login parcialmente exitoso
        if (result.jwtError) {
          messageApi.warning(result.jwtError);
        }
        handleSuccess(result);
      } else {
        // ✅ Manejar caso donde login retorna pero success es false
        setLoading(null);
        messageApi.error('Error al iniciar sesión con Google');
      }
    } catch (error: any) {
      handleError(error);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading('facebook');
    try {
      const result = await loginWithFacebook(development);
      if (result?.success) {
        // ✅ Mostrar advertencia si hay error de JWT pero login parcialmente exitoso
        if (result.jwtError) {
          messageApi.warning(result.jwtError);
        }
        handleSuccess(result);
      } else {
        // ✅ Manejar caso donde login retorna pero success es false
        setLoading(null);
        messageApi.error('Error al iniciar sesión con Facebook');
      }
    } catch (error: any) {
      handleError(error);
    }
  };

  const handleEmailSubmit = async (values: { email: string; password: string }) => {
    setLoading('email');
    try {
      let result;
      if (activeTab === 'login') {
        result = await loginWithEmailPassword(values.email, values.password, development);
      } else {
        result = await registerWithEmailPassword(values.email, values.password, development);
      }
      if (result?.success) {
        handleSuccess(result);
      }
    } catch (error: any) {
      handleError(error);
    }
  };

  const getTitle = () => {
    if (loginReason === 'session_expired') {
      return 'Sesión expirada';
    }
    return activeTab === 'login' ? 'Accede a tu cuenta' : 'Crea tu cuenta';
  };

  const getSubtitle = () => {
    switch (loginReason) {
      case 'session_expired': {
        return 'Tu sesión ha expirado. Inicia sesión nuevamente.';
      }
      case 'premium_feature':
      case 'create_event': {
        return 'Necesitas una cuenta para continuar. Es gratis.';
      }
      default: {
        return activeTab === 'login'
          ? 'Inicia sesión para acceder a todas las funciones'
          : 'Regístrate gratis y comienza a crear';
      }
    }
  };

  // Exponer función global para testing/automatización
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).openLoginModal = (reason?: string) => {
        openLoginModal(reason);
      };
    }
  }, [openLoginModal]);

  return (
    <Modal
      centered
      closable
      closeIcon={<CloseOutlined style={{ color: '#999' }} />}
      data-testid="login-modal"
      footer={null}
      maskClosable={true}
      onCancel={closeLoginModal}
      open={isLoginModalOpen}
      styles={{
        body: { padding: 0 },
        content: { borderRadius: '16px', overflow: 'hidden' },
        mask: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0, 0, 0, 0.45)' },
      }}
      width={420}
    >
      {contextHolder}

      {/* Header con gradiente */}
      <div
        style={{
          background: brandColors.gradient,
          color: 'white',
          padding: '32px 24px 24px',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>
          {getTitle()}
        </h2>
        <p style={{ fontSize: '14px', margin: '8px 0 0', opacity: 0.9 }}>
          {getSubtitle()}
        </p>
      </div>

      {/* Contenido */}
      <div style={{ padding: '24px' }}>
        {/* Botones sociales */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button
            block
            data-testid="google-login-button"
            icon={<GoogleOutlined />}
            loading={loading === 'google'}
            onClick={handleGoogleLogin}
            size="large"
            style={{
              borderRadius: '8px',
              fontWeight: 500,
              height: '48px',
            }}
          >
            Continuar con Google
          </Button>

          <Button
            block
            data-testid="facebook-login-button"
            icon={<FacebookOutlined />}
            loading={loading === 'facebook'}
            onClick={handleFacebookLogin}
            size="large"
            style={{
              backgroundColor: '#1877f2',
              borderColor: '#1877f2',
              borderRadius: '8px',
              color: 'white',
              fontWeight: 500,
              height: '48px',
            }}
          >
            Continuar con Facebook
          </Button>
        </div>

        <Divider style={{ margin: '20px 0' }}>
          <span style={{ color: '#999', fontSize: '13px' }}>o con tu email</span>
        </Divider>

        {/* Tabs Login/Registro */}
        <Tabs
          activeKey={activeTab}
          centered
          data-testid="login-tabs"
          items={[
            { key: 'login', label: 'Iniciar sesión' },
            { key: 'register', label: 'Registrarse' },
          ]}
          onChange={(key) => {
            setActiveTab(key as 'login' | 'register');
            form.resetFields();
          }}
          size="small"
        />

        {/* Formulario Email/Password */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEmailSubmit}
          style={{ marginTop: '16px' }}
        >
          <Form.Item
            name="email"
            rules={[
              { message: 'Ingresa tu email', required: true },
              { message: 'Email inválido', type: 'email' },
            ]}
          >
            <Input
              data-testid="email-input"
              placeholder="tu@email.com"
              prefix={<MailOutlined style={{ color: '#999' }} />}
              size="large"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { message: 'Ingresa tu contraseña', required: true },
              { message: 'Mínimo 6 caracteres', min: 6 },
            ]}
          >
            <Input.Password
              data-testid="password-input"
              placeholder="Contraseña"
              prefix={<LockOutlined style={{ color: '#999' }} />}
              size="large"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          {activeTab === 'login' && (
            <div style={{ marginBottom: '16px', textAlign: 'right' }}>
              <a
                href={`${developmentConfig.domain}/recuperar-password`}
                rel="noopener noreferrer"
                style={{ color: brandColors.primary, fontSize: '13px' }}
                target="_blank"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          )}

          <Button
            block
            data-testid="submit-button"
            htmlType="submit"
            loading={loading === 'email'}
            size="large"
            style={{
              background: brandColors.gradient,
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontWeight: 600,
              height: '48px',
            }}
            type="primary"
          >
            {activeTab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </Button>
        </Form>

        {/* Link alternativo */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <span style={{ color: '#666', fontSize: '13px' }}>
            {activeTab === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <a
              onClick={() => {
                setActiveTab(activeTab === 'login' ? 'register' : 'login');
                form.resetFields();
              }}
              style={{ color: brandColors.primary, cursor: 'pointer', fontWeight: 500 }}
            >
              {activeTab === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </a>
          </span>
        </div>

        {/* Términos */}
        <p style={{
          color: '#999',
          fontSize: '11px',
          lineHeight: '1.4',
          marginTop: '20px',
          textAlign: 'center',
        }}>
          Al continuar, aceptas nuestros{' '}
          <a
            href={`${developmentConfig.domain}/terminos`}
            rel="noopener noreferrer"
            style={{ color: brandColors.primary }}
            target="_blank"
          >
            términos de servicio
          </a>{' '}
          y{' '}
          <a
            href={`${developmentConfig.domain}/privacidad`}
            rel="noopener noreferrer"
            style={{ color: brandColors.primary }}
            target="_blank"
          >
            política de privacidad
          </a>
        </p>
      </div>
    </Modal>
  );
};

export default LoginModal;
