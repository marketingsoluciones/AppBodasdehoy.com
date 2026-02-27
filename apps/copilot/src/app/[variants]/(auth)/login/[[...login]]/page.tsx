'use client';

import { Alert, Button, Card, Divider, Form, Input, Tabs, Typography } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { FirebaseAuth } from '@/features/FirebaseAuth';
import { useChatStore } from '@/store/chat';
import { eventosAPI } from '@/config/eventos-api';
import { registerWithEmailPassword } from '@/services/firebase-auth';
import { optimizedApiClient } from '@/utils/api-client-optimized';

const { Title, Text } = Typography;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const development = searchParams.get('developer') || 'bodasdehoy';
  const defaultTab = searchParams.get('mode') === 'register' ? 'register' : 'login';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setExternalChatConfig, fetchExternalChats } = useChatStore();

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await eventosAPI.loginWithJWT(values.email, values.password, development);
      if (result.success && result.user_id) {
        if (result.token) {
          optimizedApiClient.setToken(result.token, result.user_id, result.development);
          localStorage.setItem('jwt_token', result.token);
          localStorage.setItem('api2_jwt_token', result.token);
        }
        const configToSave = {
          developer: result.development,
          timestamp: Date.now(),
          token: result.token || null,
          userId: result.user_id,
          user_data: result.user_data,
          user_type: 'registered',
        };
        localStorage.setItem('dev-user-config', JSON.stringify(configToSave));
        await setExternalChatConfig(result.user_id, result.development, result.token || undefined, 'registered', undefined, result.user_data);
        fetchExternalChats().catch(() => {});
        router.replace('/chat');
      } else {
        setError(result.message || 'Credenciales incorrectas.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await registerWithEmailPassword(values.email, values.password, development);
      if (result.success && result.user_id) {
        if (result.token) {
          optimizedApiClient.setToken(result.token, result.user_id, result.development);
          localStorage.setItem('jwt_token', result.token);
          localStorage.setItem('api2_jwt_token', result.token);
        }
        const configToSave = {
          developer: result.development,
          timestamp: Date.now(),
          token: result.token || null,
          userId: result.user_id,
          user_type: 'registered',
        };
        localStorage.setItem('dev-user-config', JSON.stringify(configToSave));
        await setExternalChatConfig(result.user_id, result.development, result.token || undefined, 'registered');
        fetchExternalChats().catch(() => {});
        router.replace('/chat');
      } else {
        setError((result as any).message || result.errors?.[0] || 'Error en el registro.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrarse.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
      }}
    >
      <Card
        style={{
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          maxWidth: '420px',
          width: '100%',
        }}
        styles={{ body: { padding: '28px 24px' } }}
      >
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>💒</div>
          <Title level={3} style={{ marginBottom: '4px' }}>
            Bienvenido
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Accede a tu asistente IA para bodas y eventos
          </Text>
        </div>

        {error && (
          <Alert
            closable
            message={error}
            onClose={() => setError(null)}
            showIcon
            style={{ marginBottom: 16 }}
            type="error"
          />
        )}

        <FirebaseAuth
          development={development}
          onError={(err) => setError(err.message)}
        />

        <Divider style={{ margin: '16px 0' }}>o con email</Divider>

        <Tabs
          centered
          defaultActiveKey={defaultTab}
          items={[
            {
              key: 'login',
              label: 'Iniciar sesión',
              children: (
                <Form layout="vertical" onFinish={handleLogin} size="large">
                  <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email válido requerido' }]}>
                    <Input placeholder="tu@email.com" type="email" />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, message: 'Contraseña requerida' }]}>
                    <Input.Password placeholder="Contraseña" />
                  </Form.Item>
                  <Button block htmlType="submit" loading={loading} type="primary">
                    Iniciar sesión
                  </Button>
                </Form>
              ),
            },
            {
              key: 'register',
              label: 'Crear cuenta',
              children: (
                <Form layout="vertical" onFinish={handleRegister} size="large">
                  <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email válido requerido' }]}>
                    <Input placeholder="tu@email.com" type="email" />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, min: 6, message: 'Mínimo 6 caracteres' }]}>
                    <Input.Password placeholder="Contraseña (mínimo 6 caracteres)" />
                  </Form.Item>
                  <Button block htmlType="submit" loading={loading} type="primary">
                    Crear cuenta gratis
                  </Button>
                </Form>
              ),
            },
          ]}
        />

        <div style={{ color: '#8c8c8c', fontSize: 11, marginTop: 16, textAlign: 'center' }}>
          Al continuar aceptas nuestros términos de uso y política de privacidad.
        </div>
      </Card>
    </div>
  );
}

const Page = () => {
  return (
    <Suspense fallback={
      <div style={{ alignItems: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', justifyContent: 'center', minHeight: '100vh' }}>
        <Card style={{ maxWidth: 420, width: '100%' }}>
          <div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>
        </Card>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
};

Page.displayName = 'Login';

export default Page;
