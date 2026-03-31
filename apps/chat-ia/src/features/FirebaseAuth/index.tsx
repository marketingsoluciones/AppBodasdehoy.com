'use client';

import React, { useState } from 'react';

import { FacebookOutlined, GoogleOutlined } from '@ant-design/icons';
import { Button, message } from 'antd';
import { useRouter } from 'next/navigation';

import { getCurrentDevelopment } from '@/utils/developmentDetector';
import { loginWithFacebook, loginWithGoogle } from '@/services/firebase-auth';
import { useChatStore } from '@/store/chat';

interface FirebaseAuthProps {
  development?: string;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

export const FirebaseAuth: React.FC<FirebaseAuthProps> = ({
  development,
  onError,
  onSuccess,
}) => {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { setExternalChatConfig } = useChatStore();

  const currentDevelopment = development || getCurrentDevelopment();

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle(currentDevelopment);

      // Si el resultado es undefined, significa que se está redirigiendo
      if (!result) {
        messageApi.info('Redirigiendo a Google para iniciar sesión...');
        return; // El redirect se encargará del resto
      }

      if (result.success && result.user) {
        messageApi.success('¡Inicio de sesión exitoso! 🎉');

        // Configurar usuario en el chat store
        const userEmail = result.user.email || '';
        const jwtToken = localStorage.getItem('api2_jwt_token') || undefined;

        const configToSave = {
          developer: currentDevelopment,
          development: currentDevelopment,
          email: userEmail || undefined,
          role: 'user',
          timestamp: Date.now(),
          token: jwtToken || null,
          userId: userEmail,
          user_data: {
            displayName: result.user.displayName || '',
            photoURL: result.user.photoURL || '',
            uid: result.user.uid,
          },
          user_id: userEmail,
          user_type: 'registered'
        };
        localStorage.setItem('dev-user-config', JSON.stringify(configToSave));

        const cookieValue = encodeURIComponent(JSON.stringify(configToSave));
        document.cookie = `dev-user-config=${cookieValue}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;

        try {
          await setExternalChatConfig(
            userEmail,
            currentDevelopment,
            jwtToken,
            'registered',
            undefined,
            {
              displayName: result.user.displayName || '',
              photoURL: result.user.photoURL || '',
              uid: result.user.uid,
            }
          );
        } catch { /* non-critical */ }

        onSuccess?.(result);

        setTimeout(() => {
          router.push('/chat');
          router.refresh();
        }, 500);
      } else {
        throw new Error(result.errors?.join(', ') || 'Error desconocido');
      }
    } catch (error: any) {
      if (error.message === 'REDIRECT_IN_PROGRESS') {
        messageApi.info('Redirigiendo a Google para iniciar sesión...');
        return; // No detener el loading, el redirect se encargará
      }
      
      messageApi.error(error.message || 'Error al iniciar sesión con Google');
      onError?.(error);
      setGoogleLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setFacebookLoading(true);
    try {
      const result = await loginWithFacebook(currentDevelopment);

      // Si el resultado es undefined, significa que se está redirigiendo
      if (!result) {
        messageApi.info('Redirigiendo a Facebook para iniciar sesión...');
        return; // El redirect se encargará del resto
      }

      if (result.success && result.user) {
        messageApi.success('¡Inicio de sesión exitoso! 🎉');

        // Configurar usuario en el chat store
        const userEmail = result.user.email || '';
        const jwtToken = localStorage.getItem('api2_jwt_token') || undefined;

        const configToSave = {
          developer: currentDevelopment,
          development: currentDevelopment,
          email: userEmail || undefined,
          role: 'user',
          timestamp: Date.now(),
          token: jwtToken || null,
          userId: userEmail,
          user_data: {
            displayName: result.user.displayName || '',
            photoURL: result.user.photoURL || '',
            uid: result.user.uid,
          },
          user_id: userEmail,
          user_type: 'registered'
        };
        localStorage.setItem('dev-user-config', JSON.stringify(configToSave));

        const cookieValue = encodeURIComponent(JSON.stringify(configToSave));
        document.cookie = `dev-user-config=${cookieValue}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;

        try {
          await setExternalChatConfig(
            userEmail,
            currentDevelopment,
            jwtToken,
            'registered',
            undefined,
            {
              displayName: result.user.displayName || '',
              photoURL: result.user.photoURL || '',
              uid: result.user.uid,
            }
          );
        } catch { /* non-critical */ }

        onSuccess?.(result);

        setTimeout(() => {
          router.push('/chat');
          router.refresh();
        }, 500);
      } else {
        throw new Error(result.errors?.join(', ') || 'Error desconocido');
      }
    } catch (error: any) {
      if (error.message === 'REDIRECT_IN_PROGRESS') {
        messageApi.info('Redirigiendo a Facebook para iniciar sesión...');
        return; // No detener el loading, el redirect se encargará
      }
      
      messageApi.error(error.message || 'Error al iniciar sesión con Facebook');
      onError?.(error);
      setFacebookLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {contextHolder}

      {/* Botón Google */}
      <Button
        icon={<GoogleOutlined />}
        loading={googleLoading}
        onClick={handleGoogleLogin}
        size="large"
        style={{
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 500,
          height: '48px',
          width: '100%',
        }}
        type="default"
      >
        Continuar con Google
      </Button>

      {/* Botón Facebook */}
      <Button
        icon={<FacebookOutlined />}
        loading={facebookLoading}
        onClick={handleFacebookLogin}
        size="large"
        style={{
          backgroundColor: '#1877f2',
          borderColor: '#1877f2',
          borderRadius: '8px',
          color: 'white',
          fontSize: '16px',
          fontWeight: 500,
          height: '48px',
          width: '100%',
        }}
        type="default"
      >
        Continuar con Facebook
      </Button>
    </div>
  );
};

export default FirebaseAuth;
