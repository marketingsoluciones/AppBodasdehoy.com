'use client';

import { Alert, Button, Divider, Form, Input, message, Typography } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { FirebaseAuth } from '@/features/FirebaseAuth';
import { useChatStore } from '@/store/chat';
import { loginWithEmailPassword, registerWithEmailPassword } from '@/services/firebase-auth';
import { optimizedApiClient } from '@/utils/api-client-optimized';

const { Title, Text } = Typography;

// SplitLoginPage inline — emotion compiler de chat-ia impide importar desde @bodasdehoy/auth-ui
// Ver packages/auth-ui/src/SplitLoginPage.tsx para la versión compartida (usada en appEventos)
function SplitLoginPage({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'clamp(260px, 42%, 460px) 1fr', minHeight: '100vh' }}>
      <div className="auth-ui-left-panel" style={{ background: 'linear-gradient(150deg, #ec4899 0%, #a855f7 60%, #6366f1 100%)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100%', overflow: 'hidden', padding: '48px 40px', position: 'relative' }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '50%', height: 300, left: -80, position: 'absolute', top: -80, width: 300 }} />
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '50%', bottom: -60, height: 200, position: 'absolute', right: -40, width: 200 }} />
        <div style={{ marginBottom: 32, position: 'relative' }}>
          <div style={{ fontSize: 40, marginBottom: 4 }}>💒</div>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, opacity: 0.9, textTransform: 'uppercase' }}>Bodas de Hoy · Copilot IA</div>
        </div>
        <h1 style={{ color: 'white', fontSize: 'clamp(22px, 2.8vw, 34px)', fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>Tu asistente IA para organizar la boda perfecta</h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 32, opacity: 0.9 }}>Planifica cada detalle con inteligencia artificial. Invitados, presupuesto, itinerario y mucho más — en un solo lugar.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
          {[['✨','Asistente IA para bodas y eventos'],['👥','Gestión inteligente de invitados'],['💰','Control de presupuesto en tiempo real'],['📋','Itinerario y coordinación todo en uno'],['🎨','Creador de webs de boda personalizado']].map(([icon, text]) => (
            <div key={text} style={{ alignItems: 'center', display: 'flex', gap: 10 }}><span style={{ fontSize: 18 }}>{icon}</span><span style={{ fontSize: 14, opacity: 0.95 }}>{text}</span></div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', display: 'flex', gap: 24, paddingTop: 24 }}>
          {[{v:'+5.000',l:'bodas organizadas'},{v:'+200K',l:'fotos compartidas'},{v:'4.9★',l:'valoración media'}].map(s => (
            <div key={s.l}><div style={{ fontSize: 20, fontWeight: 800 }}>{s.v}</div><div style={{ fontSize: 12, opacity: 0.8 }}>{s.l}</div></div>
          ))}
        </div>
      </div>
      <div style={{ background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh', overflowY: 'auto' }}>
        {children}
      </div>
      <style>{`@media (max-width: 768px) { .auth-ui-left-panel { display: none !important; } }`}</style>
    </div>
  );
}


// Dominios permitidos para redirect cross-app (seguridad: evitar open redirect)
const ALLOWED_REDIRECT_HOSTS = [
  'organizador.bodasdehoy.com',
  'app.bodasdehoy.com',
  'app-test.bodasdehoy.com',
  'organizador.eventosorganizador.com',
  'chat.bodasdehoy.com',
  'chat-test.bodasdehoy.com',
  'memories.bodasdehoy.com',
  'vivetuboda.com',
  'localhost',
];

function isSafeRedirect(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_REDIRECT_HOSTS.some(host =>
      parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
    );
  } catch {
    // URL relativa — siempre segura
    return url.startsWith('/');
  }
}

// ─── Panel derecho — formulario ───────────────────────────────────────────────
function RightPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const development = searchParams.get('developer') || 'bodasdehoy';
  // ?redirect= para volver a la app de origen tras login (cross-app SSO)
  const redirectAfterLogin = searchParams.get('redirect') || null;

  // La ruta es /login → mostrar login por defecto. Registro es secundario.
  const [view, setView] = useState<'landing' | 'login'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const { setExternalChatConfig, fetchExternalChats } = useChatStore();

  // ── Login ──
  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      // Usar Firebase client SDK directamente (correcto SSO + no depende de endpoint custom)
      const result = await loginWithEmailPassword(values.email, values.password, development);
      if (result.success && result.user_id) {
        if (result.token) {
          optimizedApiClient.setToken(result.token, result.user_id, result.development);
          localStorage.setItem('jwt_token', result.token);
          localStorage.setItem('api2_jwt_token', result.token);
        }
        localStorage.setItem('dev-user-config', JSON.stringify({
          developer: result.development,
          development: result.development,
          timestamp: Date.now(),
          token: result.token || null,
          userId: result.user_id,
          user_id: result.user_id,
          user_type: 'registered',
        }));
        await setExternalChatConfig(result.user_id, result.development, result.token || undefined, 'registered');
        fetchExternalChats().catch(() => {});
        // Redirigir a ?redirect= (cross-app SSO) o al chat por defecto
        if (redirectAfterLogin && isSafeRedirect(redirectAfterLogin)) {
          window.location.href = redirectAfterLogin;
        } else {
          router.replace('/chat');
        }
      } else {
        setError(result.errors?.[0] || 'Credenciales incorrectas.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  // ── Registro ──
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
        localStorage.setItem('dev-user-config', JSON.stringify({
          developer: result.development,
          development: result.development,
          timestamp: Date.now(),
          token: result.token || null,
          userId: result.user_id,
          user_id: result.user_id,
          user_type: 'registered',
        }));
        await setExternalChatConfig(result.user_id, result.development, result.token || undefined, 'registered');
        fetchExternalChats().catch(() => {});
        // Redirigir a ?redirect= (cross-app SSO) o al chat por defecto
        if (redirectAfterLogin && isSafeRedirect(redirectAfterLogin)) {
          window.location.href = redirectAfterLogin;
        } else {
          router.replace('/chat');
        }
      } else {
        setError((result as any).message || result.errors?.[0] || 'Error en el registro.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrarse.');
    } finally {
      setLoading(false);
    }
  };

  // ── Modo visitante ──
  const handleVisitor = async () => {
    // Reusar visitor ID existente para mantener historial de conversación y límite de mensajes
    const existingId = (() => {
      try {
        const saved = localStorage.getItem('dev-user-config');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.userId?.startsWith('visitor_') && parsed.user_type === 'visitor') return parsed.userId;
        }
      } catch { /* ignorar */ }
      return null;
    })();
    const visitorId = existingId ?? `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem('dev-user-config', JSON.stringify({
      developer: development,
      timestamp: Date.now(),
      token: null,
      userId: visitorId,
      user_type: 'visitor',
    }));
    try {
      await setExternalChatConfig(visitorId, development, undefined, 'visitor');
    } catch { /* continuar sin config */ }
    messageApi.info('Modo visitante activado. Algunas funciones requieren cuenta.');
    // Visitantes siempre van al chat (no redirigir a app externa)
    setTimeout(() => router.replace('/chat'), 800);
  };

  // ── Vista: registro (landing) ──
  if (view === 'landing') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '40px 36px' }}>
        {contextHolder}

        <div style={{ marginBottom: 8, textAlign: 'center' }}>
          <span style={{ background: '#fdf2f8', borderRadius: 20, color: '#ec4899', fontSize: 12, fontWeight: 600, padding: '4px 12px' }}>
            🆓 Gratis para empezar
          </span>
        </div>
        <Title level={3} style={{ marginBottom: 6, textAlign: 'center' }}>
          Empieza a organizar tu boda
        </Title>
        <Text type="secondary" style={{ display: 'block', fontSize: 14, marginBottom: 28, textAlign: 'center' }}>
          Crea tu cuenta gratuita en 30 segundos
        </Text>

        {error && (
          <Alert closable message={error} onClose={() => setError(null)} showIcon style={{ marginBottom: 16 }} type="error" />
        )}

        {/* Social auth */}
        <FirebaseAuth development={development} onError={(e) => setError(e.message)} />

        <Divider style={{ margin: '20px 0' }}>o con email</Divider>

        {/* Formulario de registro rápido */}
        <Form layout="vertical" onFinish={handleRegister} size="large">
          <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email válido requerido' }]}>
            <Input placeholder="tu@email.com" type="email" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, min: 6, message: 'Mínimo 6 caracteres' }]}>
            <Input.Password placeholder="Elige una contraseña" />
          </Form.Item>
          <Button
            block
            htmlType="submit"
            loading={loading}
            size="large"
            style={{
              background: 'linear-gradient(90deg, #ec4899, #a855f7)',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              height: 48,
            }}
            type="primary"
          >
            Crear cuenta gratis →
          </Button>
        </Form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={() => { setError(null); setView('login'); }}
              style={{ background: 'none', border: 'none', color: '#ec4899', cursor: 'pointer', font: 'inherit', fontSize: 13, fontWeight: 600, padding: 0 }}
              type="button"
            >
              Iniciar sesión
            </button>
          </Text>
        </div>

        {/* Modo visitante */}
        <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 24, paddingTop: 20, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>¿Solo quieres explorar?</Text>
          <br />
          <Button
            onClick={handleVisitor}
            size="small"
            style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}
            type="link"
          >
            Continuar como visitante (funciones limitadas)
          </Button>
        </div>

        <div style={{ color: '#bfbfbf', fontSize: 11, marginTop: 16, textAlign: 'center' }}>
          Al continuar aceptas nuestros{' '}
          <a href="https://bodasdehoy.com/terminos" rel="noreferrer" style={{ color: '#bfbfbf' }} target="_blank">términos de uso</a>
          {' '}y{' '}
          <a href="https://bodasdehoy.com/privacidad" rel="noreferrer" style={{ color: '#bfbfbf' }} target="_blank">política de privacidad</a>.
        </div>
      </div>
    );
  }

  // ── Vista: login ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '40px 36px' }}>
      {contextHolder}
      <button
        onClick={() => { setError(null); setView('landing'); }}
        style={{ background: 'none', border: 'none', color: '#8c8c8c', cursor: 'pointer', fontSize: 13, marginBottom: 20, padding: 0, textAlign: 'left' }}
        type="button"
      >
        ← Volver
      </button>
      <Title level={3} style={{ marginBottom: 6 }}>Iniciar sesión</Title>
      <Text type="secondary" style={{ display: 'block', fontSize: 14, marginBottom: 24 }}>Bienvenido de vuelta</Text>

      {error && (
        <Alert closable message={error} onClose={() => setError(null)} showIcon style={{ marginBottom: 16 }} type="error" />
      )}

      <FirebaseAuth development={development} onError={(e) => setError(e.message)} />

      <Divider style={{ margin: '20px 0' }}>o con email</Divider>

      <Form layout="vertical" onFinish={handleLogin} size="large">
        <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email válido requerido' }]}>
          <Input placeholder="tu@email.com" type="email" />
        </Form.Item>
        <Form.Item name="password" rules={[{ required: true, message: 'Contraseña requerida' }]}>
          <Input.Password placeholder="Contraseña" />
        </Form.Item>
        <Button block htmlType="submit" loading={loading} size="large" style={{ height: 48 }} type="primary">
          Iniciar sesión
        </Button>
      </Form>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          ¿No tienes cuenta?{' '}
          <button
            onClick={() => { setError(null); setView('landing'); }}
            style={{ background: 'none', border: 'none', color: '#ec4899', cursor: 'pointer', font: 'inherit', fontSize: 13, fontWeight: 600, padding: 0 }}
            type="button"
          >
            Crear cuenta gratis
          </button>
        </Text>
      </div>
      <div style={{ color: '#bfbfbf', fontSize: 11, marginTop: 16, textAlign: 'center' }}>
        Al continuar aceptas nuestros términos de uso y política de privacidad.
      </div>
    </div>
  );
}

// ─── Layout principal split-screen ───────────────────────────────────────────
function LoginContent() {
  return (
    <SplitLoginPage>
      <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>}>
        <RightPanel />
      </Suspense>
    </SplitLoginPage>
  );
}

const Page = () => (
  <Suspense
    fallback={
      <div style={{ alignItems: 'center', background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)', display: 'flex', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ color: 'white', fontSize: 16 }}>Cargando...</div>
      </div>
    }
  >
    <LoginContent />
  </Suspense>
);

Page.displayName = 'Login';

export default Page;
