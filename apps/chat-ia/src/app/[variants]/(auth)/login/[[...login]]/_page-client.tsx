'use client';

import Script from 'next/script';
import { message } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { LoginForm, SplitLoginPage } from '@bodasdehoy/auth-ui';
import { useChatStore } from '@/store/chat';
import { loginWithEmailPassword, loginWithFacebook, loginWithGoogle } from '@/services/firebase-auth';
import { optimizedApiClient } from '@/utils/api-client-optimized';

// ─── Config panel izquierdo (branding de chat-ia) ────────────────────────────
const CHAT_IA_LEFT_PANEL = {
  brandName: 'Bodas de Hoy · Copilot IA',
  description:
    'Planifica cada detalle con inteligencia artificial. Invitados, presupuesto, itinerario y mucho más — en un solo lugar.',
  features: [
    { icon: '✨', text: 'Asistente IA para bodas y todo tipo de eventos' },
    { icon: '👥', text: 'Gestión inteligente de invitados' },
    { icon: '💰', text: 'Control de presupuesto en tiempo real' },
    { icon: '📋', text: 'Itinerario y coordinación todo en uno' },
    { icon: '🎨', text: 'Creador de webs de evento personalizado' },
  ],
  stats: [
    { label: 'bodas organizadas', value: '+5.000' },
    { label: 'fotos compartidas', value: '+200K' },
    { label: 'valoración media', value: '4.9★' },
  ],
};

// ─── Dominios permitidos para redirect (evitar open redirect) ─────────────────
const ALLOWED_REDIRECT_HOSTS = [
  'app.bodasdehoy.com',
  'chat.bodasdehoy.com',
  'memories.bodasdehoy.com',
  'editor.bodasdehoy.com',
  'wedding-creator.bodasdehoy.com',
  'app-test.bodasdehoy.com',
  'chat-test.bodasdehoy.com',
  'memories-test.bodasdehoy.com',
  'editor-test.bodasdehoy.com',
  'app-dev.bodasdehoy.com',
  'chat-dev.bodasdehoy.com',
  'memories-dev.bodasdehoy.com',
  'editor-dev.bodasdehoy.com',
  'organizador.bodasdehoy.com',
  'iachat.bodasdehoy.com',
  'organizador.eventosorganizador.com',
  'vivetuboda.com',
  'localhost',
];

function isSafeRedirect(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_REDIRECT_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
    );
  } catch {
    return url.startsWith('/');
  }
}

// ─── Panel derecho ────────────────────────────────────────────────────────────
function RightPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const development = searchParams.get('developer') || 'bodasdehoy';
  const redirectAfterLogin = searchParams.get('redirect') || null;
  const reason = searchParams.get('reason');

  const [messageApi, contextHolder] = message.useMessage();
  const { setExternalChatConfig, fetchExternalChats } = useChatStore();

  // Redirigir tras login exitoso: a ?redirect= si es seguro, o al chat
  const afterLogin = () => {
    if (redirectAfterLogin && isSafeRedirect(redirectAfterLogin)) {
      window.location.href = redirectAfterLogin;
    } else {
      router.replace('/chat');
    }
  };

  // Guardar sesión en localStorage/cookie
  const saveSession = (userId: string, dev: string, token: string | null, email?: string) => {
    const config = {
      developer: dev,
      development: dev,
      email,
      timestamp: Date.now(),
      token,
      userId,
      user_id: userId,
      user_type: 'registered',
    };
    localStorage.setItem('dev-user-config', JSON.stringify(config));
    document.cookie = `dev-user-config=${encodeURIComponent(JSON.stringify(config))}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
    if (token) {
      optimizedApiClient.setToken(token, userId, dev);
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('api2_jwt_token', token);
    }
  };

  // ── Email/password ──
  const handleEmailLogin = async (email: string, password: string) => {
    const result = await loginWithEmailPassword(email, password, development);
    if (!result.success) throw new Error(result.errors?.[0] || 'Credenciales incorrectas.');
    saveSession(result.user_id!, result.development, result.token || null, email);
    await setExternalChatConfig(result.user_id!, result.development, result.token || undefined, 'registered');
    fetchExternalChats().catch(() => {});
    afterLogin();
  };

  // ── Google ──
  const handleGoogleLogin = async () => {
    const result = await loginWithGoogle(development);
    if (!result) return; // signInWithRedirect en progreso
    if (!result.success) throw new Error(result.errors?.join(', ') || 'Error con Google.');
    const email = result.user?.email || '';
    const token = localStorage.getItem('api2_jwt_token') || null;
    saveSession(email, result.development, token, email);
    await setExternalChatConfig(email, result.development, token || undefined, 'registered');
    fetchExternalChats().catch(() => {});
    afterLogin();
  };

  // ── Facebook ──
  const handleFacebookLogin = async () => {
    const result = await loginWithFacebook(development);
    if (!result) return;
    if (!result.success) throw new Error(result.errors?.join(', ') || 'Error con Facebook.');
    const email = result.user?.email || '';
    const token = localStorage.getItem('api2_jwt_token') || null;
    saveSession(email, result.development, token, email);
    await setExternalChatConfig(email, result.development, token || undefined, 'registered');
    fetchExternalChats().catch(() => {});
    afterLogin();
  };

  // ── Visitante ──
  const handleVisitor = async () => {
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
    setTimeout(() => router.replace('/chat'), 800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '40px 36px' }}>
      {contextHolder}
      <LoginForm
        onEmailLogin={handleEmailLogin}
        onFacebookLogin={handleFacebookLogin}
        onGoogleLogin={handleGoogleLogin}
        onVisitor={handleVisitor}
        sessionExpiredMessage={
          reason === 'session_expired' ? 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.' : null
        }
      />
    </div>
  );
}

// ─── Script SSO inline (strategy="afterInteractive") ─────────────────────────
// Alternativa a useEffect: Next.js Script se inyecta como <script> DOM real,
// independiente del ciclo de vida React/Suspense. Dispara tras hydration.
const SSO_SCRIPT = `
(function() {
  try {
    var ssoEntry = document.cookie.split('; ').find(function(c) { return c.startsWith('idTokenV0.1.0='); });
    if (!ssoEntry) return;
    var ssoToken = ssoEntry.slice('idTokenV0.1.0='.length);
    if (!ssoToken) return;
    console.log('[sso-script] token encontrado, len=' + ssoToken.length);
    var urlDev = new URLSearchParams(window.location.search).get('developer') || 'bodasdehoy';
    fetch('/api/auth/firebase-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        development: urlDev,
        device: navigator.userAgent,
        fingerprint: 'sso-script',
        firebaseIdToken: ssoToken,
      }),
    })
    .then(function(r) { return r.json(); })
    .then(function(result) {
      if (!result.success) return;
      var userId = result.user_id || result.email;
      var token = result.token || result.jwt_token || null;
      var config = {
        developer: urlDev, development: urlDev, email: result.email,
        timestamp: Date.now(), token: token, userId: userId, user_id: userId, user_type: 'registered',
      };
      try { localStorage.setItem('dev-user-config', JSON.stringify(config)); } catch(e) {}
      try { document.cookie = 'dev-user-config=' + encodeURIComponent(JSON.stringify(config)) + '; path=/; max-age=' + (30 * 24 * 60 * 60) + '; SameSite=Lax'; } catch(e) {}
      if (token) {
        try { localStorage.setItem('jwt_token', token); } catch(e) {}
        try { localStorage.setItem('api2_jwt_token', token); } catch(e) {}
      }
      var redirectParam = new URLSearchParams(window.location.search).get('redirect');
      var ALLOWED = ['app.bodasdehoy.com','chat.bodasdehoy.com','memories.bodasdehoy.com','editor.bodasdehoy.com',
        'app-test.bodasdehoy.com','chat-test.bodasdehoy.com','memories-test.bodasdehoy.com',
        'app-dev.bodasdehoy.com','chat-dev.bodasdehoy.com','memories-dev.bodasdehoy.com',
        'organizador.bodasdehoy.com','iachat.bodasdehoy.com','localhost'];
      var isSafe = false;
      if (redirectParam) {
        try {
          var parsed = new URL(redirectParam);
          isSafe = ALLOWED.some(function(h) { return parsed.hostname === h || parsed.hostname.endsWith('.' + h); });
        } catch(e) { isSafe = redirectParam.startsWith('/'); }
      }
      window.location.replace(isSafe ? redirectParam : '/chat');
    })
    .catch(function() {}); // falla → formulario normal
  } catch(e) {}
})();
`;

// ─── Layout ───────────────────────────────────────────────────────────────────
function LoginContent() {
  return (
    <SplitLoginPage leftPanel={CHAT_IA_LEFT_PANEL}>
      <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>}>
        <RightPanel />
      </Suspense>
    </SplitLoginPage>
  );
}

const LoginPageClient = () => (
  <>
    {/* Script SSO: detecta idTokenV0.1.0 y autentica sin React useEffect */}
    <Script id="sso-check" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: SSO_SCRIPT }} />
    <Suspense
      fallback={
        <div style={{ alignItems: 'center', background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)', display: 'flex', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ color: 'white', fontSize: 16 }}>Cargando...</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  </>
);

LoginPageClient.displayName = 'Login';

export default LoginPageClient;
