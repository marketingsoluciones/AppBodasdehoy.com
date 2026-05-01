'use client';

import Script from 'next/script';
import { message } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { LoginForm, SplitLoginPage } from '@bodasdehoy/auth-ui';
import { developments, getDevelopmentConfig } from '@bodasdehoy/shared/types';
import { resolvePublicMcpGraphqlUrl } from '@/const/mcpEndpoints';
import { useChatStore } from '@/store/chat';
import { loginWithEmailPassword, loginWithFacebook, loginWithGoogle } from '@/services/firebase-auth';
import { optimizedApiClient } from '@/utils/api-client-optimized';
import { registerReferralIfPending, sendAttributionToApi } from '@bodasdehoy/shared';

// ─── Config panel izquierdo (branding dinámico por tenant) ───────────────────
function buildLeftPanel(developer?: string | null) {
  const config = developer ? getDevelopmentConfig(developer) : undefined;
  const brandName = config?.headTitle || 'Copilot IA';
  return {
    brandName: `${brandName} · Copilot IA`,
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
      { label: 'eventos organizados', value: '+5.000' },
      { label: 'fotos compartidas', value: '+200K' },
      { label: 'valoración media', value: '4.9★' },
    ],
  };
}

// ─── Dominios permitidos para redirect (generado desde shared — 11 tenants) ──
const ALLOWED_REDIRECT_HOSTS: string[] = [
  'localhost',
  ...developments.flatMap((d) => {
    const root = d.domain.replace(/^\./, '');
    return [
      root,
      `www.${root}`,
      `app.${root}`, `app-test.${root}`, `app-dev.${root}`,
      `chat.${root}`, `chat-test.${root}`, `chat-dev.${root}`,
      `memories.${root}`, `memories-test.${root}`, `memories-dev.${root}`,
      `editor.${root}`, `editor-test.${root}`, `editor-dev.${root}`,
      `organizador.${root}`,
    ];
  }),
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

// ─── WhatsApp OTP flow — tipos ────────────────────────────────────────────────
type WaStep = 'idle' | 'phone' | 'otp';

// ─── Panel derecho ────────────────────────────────────────────────────────────
function RightPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const development = searchParams.get('developer') || 'bodasdehoy';
  const redirectAfterLogin = searchParams.get('redirect') || null;
  const reason = searchParams.get('reason');

  const [messageApi, contextHolder] = message.useMessage();
  const { setExternalChatConfig, fetchExternalChats } = useChatStore();

  // ── WhatsApp OTP state ──
  const [waStep, setWaStep] = useState<WaStep>('idle');
  const [waPhone, setWaPhone] = useState('');
  const [waCode, setWaCode] = useState('');
  const [waLoading, setWaLoading] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);

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

  const api2Url = resolvePublicMcpGraphqlUrl();

  // ── Email/password ──
  const handleEmailLogin = async (email: string, password: string) => {
    const result = await loginWithEmailPassword(email, password, development);
    if (!result.success) throw new Error(result.errors?.[0] || 'Credenciales incorrectas.');
    saveSession(result.user_id!, result.development, result.token || null, email);
    await setExternalChatConfig(result.user_id!, result.development, result.token || undefined, 'registered');
    fetchExternalChats().catch(() => {});
    if (result.token) {
      registerReferralIfPending(result.token, result.development, api2Url).catch(() => {});
      sendAttributionToApi(result.token, result.development, api2Url).catch(() => {});
    }
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
    if (token) {
      registerReferralIfPending(token, result.development, api2Url).catch(() => {});
      sendAttributionToApi(token, result.development, api2Url).catch(() => {});
    }
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
    if (token) {
      registerReferralIfPending(token, result.development, api2Url).catch(() => {});
      sendAttributionToApi(token, result.development, api2Url).catch(() => {});
    }
    afterLogin();
  };

  // ── WhatsApp OTP: enviar código ──
  const handleWaSendCode = async () => {
    setWaError(null);
    setWaLoading(true);
    try {
      const res = await fetch('/api/auth/whatsapp-otp-send', {
        body: JSON.stringify({ development, phone: waPhone }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Error al enviar el código.');
      setWaStep('otp');
    } catch (err: any) {
      setWaError(err?.message || 'Error al enviar el código.');
    } finally {
      setWaLoading(false);
    }
  };

  // ── WhatsApp OTP: verificar código ──
  const handleWaVerify = async () => {
    setWaError(null);
    setWaLoading(true);
    try {
      const res = await fetch('/api/auth/whatsapp-otp-verify', {
        body: JSON.stringify({ code: waCode, development, phone: waPhone }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.detail || 'Código incorrecto.');
      saveSession(result.user_id, development, result.token, result.email ?? undefined);
      await setExternalChatConfig(result.user_id, development, result.token || undefined, 'registered');
      fetchExternalChats().catch(() => {});
      if (result.token) {
        registerReferralIfPending(result.token, development, api2Url).catch(() => {});
        sendAttributionToApi(result.token, development, api2Url).catch(() => {});
      }
      afterLogin();
    } catch (err: any) {
      setWaError(err?.message || 'Código incorrecto o expirado.');
    } finally {
      setWaLoading(false);
    }
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

  // ── Render WhatsApp OTP inline ───────────────────────────────────────────────
  if (waStep !== 'idle') {
    const inputStyle: React.CSSProperties = {
      background: '#fafafa',
      border: '1px solid #d9d9d9',
      borderRadius: 8,
      boxSizing: 'border-box',
      fontSize: 14,
      height: 44,
      outline: 'none',
      padding: '0 12px',
      width: '100%',
    };
    const btnStyle: React.CSSProperties = {
      background: waLoading ? '#f0f0f0' : 'linear-gradient(90deg, #25d366, #128c7e)',
      border: 'none',
      borderRadius: 8,
      color: waLoading ? '#8c8c8c' : 'white',
      cursor: waLoading ? 'not-allowed' : 'pointer',
      fontSize: 15,
      fontWeight: 700,
      height: 48,
      opacity: waLoading ? 0.7 : 1,
      width: '100%',
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', justifyContent: 'center', padding: '40px 36px' }}>
        {contextHolder}
        <button
          onClick={() => { setWaStep('idle'); setWaError(null); setWaCode(''); }}
          style={{ background: 'none', border: 'none', color: '#8c8c8c', cursor: 'pointer', fontSize: 13, padding: 0, textAlign: 'left' }}
          type="button"
        >
          ← Volver al inicio de sesión
        </button>

        <div>
          <h2 style={{ color: '#262626', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>
            {waStep === 'phone' ? 'Introduce tu teléfono' : 'Introduce el código'}
          </h2>
          <p style={{ color: '#8c8c8c', fontSize: 14, margin: 0 }}>
            {waStep === 'phone'
              ? 'Te enviaremos un código por WhatsApp.'
              : `Código enviado a ${waPhone}. Válido 10 minutos.`}
          </p>
        </div>

        {waError && (
          <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 8, color: '#cf1322', fontSize: 13, padding: '10px 14px' }}>
            {waError}
          </div>
        )}

        {waStep === 'phone' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ color: '#595959', fontSize: 13, fontWeight: 500 }}>
                Teléfono (formato internacional)
              </label>
              <input
                autoComplete="tel"
                disabled={waLoading}
                onChange={(e) => setWaPhone(e.target.value)}
                placeholder="+34612345678"
                style={inputStyle}
                type="tel"
                value={waPhone}
              />
            </div>
            <button disabled={waLoading} onClick={handleWaSendCode} style={btnStyle} type="button">
              {waLoading ? 'Enviando...' : 'Enviar código por WhatsApp'}
            </button>
          </>
        )}

        {waStep === 'otp' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ color: '#595959', fontSize: 13, fontWeight: 500 }}>Código de verificación</label>
              <input
                autoComplete="one-time-code"
                disabled={waLoading}
                inputMode="numeric"
                maxLength={8}
                onChange={(e) => setWaCode(e.target.value.replaceAll(/\D/g, ''))}
                placeholder="123456"
                style={{ ...inputStyle, fontSize: 20, letterSpacing: 6, textAlign: 'center' }}
                type="text"
                value={waCode}
              />
            </div>
            <button disabled={waLoading} onClick={handleWaVerify} style={btnStyle} type="button">
              {waLoading ? 'Verificando...' : 'Verificar código'}
            </button>
            <button
              onClick={handleWaSendCode}
              style={{ background: 'none', border: 'none', color: '#25d366', cursor: 'pointer', fontSize: 13, padding: 0, textAlign: 'center' }}
              type="button"
            >
              Reenviar código
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '40px 36px' }}>
      {contextHolder}
      <LoginForm
        onEmailLogin={handleEmailLogin}
        onFacebookLogin={handleFacebookLogin}
        onGoogleLogin={handleGoogleLogin}
        onVisitor={handleVisitor}
        onWhatsAppLogin={() => { setWaStep('phone'); setWaError(null); }}
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
  const developer = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('developer')
    : null;
  return (
    <SplitLoginPage leftPanel={buildLeftPanel(developer)}>
      <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>}>
        <RightPanel />
      </Suspense>
    </SplitLoginPage>
  );
}

const LoginPageClient = () => (
  <>
    {/* Script SSO: detecta idTokenV0.1.0 y autentica sin React useEffect */}
    <Script dangerouslySetInnerHTML={{ __html: SSO_SCRIPT }} id="sso-check" strategy="afterInteractive" />
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
