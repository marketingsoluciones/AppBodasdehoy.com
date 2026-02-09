'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Divider,
  Form,
  Input,
  Radio,
  Select,
  Typography,
  message,
} from 'antd';
import { createStyles } from 'antd-style';
import { GoogleOutlined } from '@ant-design/icons';

import { DEMO_CREDENTIALS, loginAPI2 } from '@/services/api2/auth';

const { Paragraph, Title, Text } = Typography;

type LoginMode = 'middleware' | 'api2';

interface LoginResponse {
  development?: string;
  message?: string;
  success?: boolean;
  token?: string | null;
  token_source?: string;
  user_data?: {
    displayName?: string;
    email?: string;
    phone?: string;
  };
  user_id?: string;
}

const DEV_OPTIONS = [
  { label: 'bodasdehoy', value: 'bodasdehoy' },
  { label: 'eventosorganizador', value: 'eventosorganizador' },
  { label: 'eventosintegrados', value: 'eventosintegrados' },
  { label: 'annloevents', value: 'annloevents' },
  { label: 'vivetuboda', value: 'vivetuboda' },
  { label: 'ohmaratilano', value: 'ohmaratilano' },
];

const persistLocalSession = ({
  developer,
  email,
  token,
}: {
  developer: string;
  email: string;
  token?: string;
}) => {
  if (typeof window === 'undefined') return;

  if (token) {
    localStorage.setItem('jwt_token', token);
  }
  localStorage.setItem('developer', developer);
  localStorage.setItem('dev_login_email', email);
};

const useStyles = createStyles(({ css }) => ({
  alert: css`
    margin-block-end: 16px;
  `,
  buttonRow: css`
    display: flex;
    gap: 8px;
  `,
  card: css`
    width: 100%;
    max-width: 520px;
  `,
  container: css`
    display: flex;
    align-items: center;
    justify-content: center;

    min-height: 100vh;
    padding: 24px;

    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  `,
  divider: css`
    margin-block: 24px 16px;
margin-inline: 0;
  `,
  googleButton: css`
    width: 100%;
    max-width: 320px;
  `,
  googleContainer: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
  `,
  googlePlaceholder: css`
    min-height: 44px;
    transition: opacity 0.3s ease;
  `,
  googlePlaceholderDisabled: css`
    pointer-events: none;
    opacity: 0.5;
  `,
  googlePlaceholderEnabled: css`
    pointer-events: auto;
    opacity: 1;
  `,
  resultCard: css`
    margin-block-start: 24px;
    background: #f7f8fc;
  `,
}));

const DevLoginPage = () => {
  const [form] = Form.useForm();
  const { styles } = useStyles();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [mode, setMode] = useState<LoginMode>('middleware');
  const [result, setResult] = useState<LoginResponse | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleGoogleLoginResponse = useCallback(
    async (response: { credential?: string } | undefined) => {
      if (!response?.credential) {
        messageApi.error('No se recibió el token de Google. Intenta de nuevo.');
        return;
      }

      const developer = form.getFieldValue('developer') || 'bodasdehoy';

      try {
        setGoogleLoading(true);
        setResult(null);

        const googleLoginResponse = await fetch('/api/auth/login-with-google', {
          body: JSON.stringify({
            credential: response.credential,
            developer,
          }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        });

        const data: LoginResponse & {
          eventos?: unknown[];
          google_profile?: { email?: string; name?: string; picture?: string };
        } = await googleLoginResponse.json();

        if (!googleLoginResponse.ok || !data.success) {
          throw new Error(data.message || 'No se pudo iniciar sesión con Google');
        }

        const resolvedEmail =
          data.user_data?.email ||
          data.google_profile?.email ||
          data.user_id ||
          form.getFieldValue('email') ||
          '';

        persistLocalSession({
          developer: data.development ?? developer,
          email: resolvedEmail,
          token: data.token ?? response.credential,
        });

        setResult({
          ...data,
          token: data.token ?? response.credential,
          token_source: data.token_source ?? 'google-identity',
        });

        if (Array.isArray(data.eventos)) {
          console.debug('Eventos recuperados tras login con Google:', data.eventos.length);
        }

        messageApi.success('Sesión iniciada con Google. Token guardado en localStorage.');
      } catch (error: unknown) {
        const err = error as Error;
        messageApi.error(err.message || 'Error inesperado iniciando sesión con Google');
      } finally {
        setGoogleLoading(false);
      }
    },
    [form, messageApi]
  );

  useEffect(() => {
    if (!googleClientId) return;

    const initializeGoogleIdentity = () => {
      const google = window.google;
      if (!google?.accounts?.id) {
        return;
      }

      google.accounts.id.initialize({
        callback: handleGoogleLoginResponse,
        client_id: googleClientId,
      });

      const button = document.getElementById('googleSignInButton');
      if (button) {
        google.accounts.id.renderButton(button, {
          shape: 'pill',
          size: 'large',
          text: 'continue_with',
          theme: 'outline',
          width: 320,
        });
      }

      setGoogleReady(true);
    };

    if (window.google?.accounts?.id) {
      initializeGoogleIdentity();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.addEventListener('load', initializeGoogleIdentity);
    script.addEventListener('error', () => {
      console.error('No se pudo cargar Google Identity Services');
      messageApi.error('No se pudo cargar Google Identity Services');
    });

    document.head.append(script);

    return () => {
      script.remove();
    };
  }, [googleClientId, handleGoogleLoginResponse, messageApi]);

  const handleGoogleLoginClick = useCallback(() => {
    if (!googleClientId) {
      messageApi.warning('Configura NEXT_PUBLIC_GOOGLE_CLIENT_ID para activar el login con Google.');
      return;
    }

    const google = window.google;
    if (google?.accounts?.id) {
      google.accounts.id.prompt((notification) => {
        if (notification?.isNotDisplayed()) {
          messageApi.warning('No se pudo mostrar el selector de Google. Intenta nuevamente.');
        }
      });
    } else {
      messageApi.warning('Google Identity aún se está inicializando. Intenta en unos segundos.');
    }
  }, [googleClientId, messageApi]);

  const handleMiddlewareLogin = async (developer: string, email: string, password: string) => {
    const response = await fetch('/api/auth/login-with-jwt', {
      body: JSON.stringify({ developer, email, password }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    const data: LoginResponse = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'No se pudo iniciar sesión');
    }

    persistLocalSession({ developer: data.development ?? developer, email, token: data.token ?? undefined });
    setResult(data);

    if (data.token) {
      messageApi.success('Sesión iniciada (middleware). Token guardado en localStorage.');
    } else {
      messageApi.warning('Sesión iniciada en modo middleware sin token emitido.');
    }
  };

  const handleAPI2Login = async (developer: string, email: string, password: string) => {
    const resultAPI2 = await loginAPI2({
      development: developer,
      email,
      password,
    });

    if (!resultAPI2.success || !resultAPI2.token) {
      throw new Error(resultAPI2.errors?.join(', ') || 'No se pudo autenticar en API2');
    }

    persistLocalSession({ developer, email, token: resultAPI2.token });
    setResult({
      development: developer,
      message: 'Login exitoso directo contra API2',
      success: true,
      token: resultAPI2.token,
      token_source: 'generateCRMToken',
      user_data: {
        displayName: email,
        email,
      },
      user_id: email,
    });
    messageApi.success('Sesión iniciada directamente en API2. Token guardado en localStorage.');
  };

  const handleSubmit = async () => {
    try {
      const { developer, email, password } = await form.validateFields();

      setLoading(true);
      setResult(null);

      if (mode === 'middleware') {
        await handleMiddlewareLogin(developer, email, password);
      } else {
        await handleAPI2Login(developer, email, password);
      }
    } catch (error: unknown) {
      const err = error as Error;
      messageApi.error(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoCredentials = () => {
    form.setFieldsValue({
      email: DEMO_CREDENTIALS.email,
      password: DEMO_CREDENTIALS.password,
    });
    messageApi.info('Credenciales demo cargadas.');
  };

  return (
    <div className={styles.container}>
      {contextHolder}
      <Card className={styles.card} title={<Title level={3}>Configura tus credenciales para acceder</Title>}>
        <Paragraph type="secondary">
          Esta pantalla está pensada para entornos de desarrollo. El formulario realiza una
          petición a <code>/api/auth/login-with-jwt</code>, almacena el token JWT (si lo hay) en
          <code>localStorage</code> y deja listo el navegador para consumir el middleware en
          <code>http://localhost:8030</code>.
        </Paragraph>

        <Alert
          className={styles.alert}
          description="Puedes autenticarte contra el middleware local (recomendado para desarrollo) o directamente contra API2 utilizando la mutación generateCRMToken."
          message="Modo de autenticación"
          showIcon
          type="info"
        />
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            initialValue="bodasdehoy"
            label="Whitelabel / Developer"
            name="developer"
            rules={[{ message: 'Selecciona el developer', required: true }]}
          >
            <Select options={DEV_OPTIONS} placeholder="Selecciona tu marca" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { message: 'Introduce tu email', required: true },
              { message: 'Email inválido', type: 'email' },
            ]}
          >
            <Input placeholder="usuario@tumarca.com" />
          </Form.Item>

          <Form.Item
            label="Contraseña"
            name="password"
            rules={[{ message: 'Introduce tu contraseña', required: true }]}
          >
            <Input.Password placeholder="Contraseña" />
          </Form.Item>

          <Form.Item initialValue={mode} label="Modo de autenticación" name="mode">
            <Radio.Group
              buttonStyle="solid"
              onChange={(event) => {
                setMode(event.target.value);
              }}
              optionType="button"
              value={mode}
            >
              <Radio.Button value="middleware">Middleware (FastAPI)</Radio.Button>
              <Radio.Button value="api2">API2 directo</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <div className={styles.buttonRow}>
            <Button block htmlType="submit" loading={loading} type="primary">
              Iniciar sesión
            </Button>
            <Button block disabled={loading || googleLoading} onClick={handleFillDemoCredentials}>
              Usar credenciales demo
            </Button>
          </div>
        </Form>

        <Divider className={styles.divider} plain>
          Ó conéctate usando Google
        </Divider>

        {!googleClientId ? (
          <Alert
            description="Configura la variable NEXT_PUBLIC_GOOGLE_CLIENT_ID para habilitar el inicio de sesión con Google."
            message="Google Sign-In no configurado"
            showIcon
            type="warning"
          />
        ) : (
          <div className={styles.googleContainer}>
            <div
              className={[
                styles.googlePlaceholder,
                googleReady ? styles.googlePlaceholderEnabled : styles.googlePlaceholderDisabled,
              ].join(' ')}
              id="googleSignInButton"
            />
            <Button
              className={styles.googleButton}
              icon={<GoogleOutlined />}
              loading={googleLoading}
              onClick={handleGoogleLoginClick}
              size="large"
              type="default"
            >
              Iniciar sesión con Google
            </Button>
          </div>
        )}

        {result && (
          <Card className={styles.resultCard} size="small" title="Resultado">
            <Paragraph>
              <Text strong>Estado:</Text>{' '}
              {result.success ? (
                <Text type="success">Autenticación correcta</Text>
              ) : (
                <Text type="danger">Falló el login</Text>
              )}
            </Paragraph>
            <Paragraph>
              <Text strong>Usuario:</Text> {result.user_data?.displayName || result.user_id || '—'}
            </Paragraph>
            <Paragraph>
              <Text strong>Email:</Text> {result.user_data?.email || '—'}
            </Paragraph>
            <Paragraph>
              <Text strong>Token JWT:</Text>{' '}
              {result.token ? (
                <Text code copyable>
                  {result.token}
                </Text>
              ) : (
                <Text type="secondary">El backend no devolvió token (modo desarrollo)</Text>
              )}
            </Paragraph>
            {result.token_source && (
              <Paragraph>
                <Text strong>Fuente del token:</Text> {result.token_source}
              </Paragraph>
            )}
            <Paragraph>
              <Text strong>Message:</Text> {result.message || '—'}
            </Paragraph>
          </Card>
        )}
      </Card>
    </div>
  );
};

export default DevLoginPage;

