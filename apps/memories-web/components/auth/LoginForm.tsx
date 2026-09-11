import { useState } from 'react';
import Link from 'next/link';

import { resolvePublicApiIaOrigin } from '../../utils/endpoints';

const API_BASE = resolvePublicApiIaOrigin();
const DEVELOPMENT = (process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy').trim();
export const MEMORIES_TOKEN_KEY = 'memories_access_token';

const Spinner = () => (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
);

export default function LoginForm({ onLogin }: { onLogin: (userId: string) => void }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestOtp = async (emailValue: string): Promise<string> => {
    const res = await fetch(`${API_BASE}/api/memories/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailValue, development: DEVELOPMENT }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Error al enviar el código');
    return data.session_id as string;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const sid = await requestOtp(email.trim());
      setSessionId(sid);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Error al enviar el código. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/memories/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, code, development: DEVELOPMENT }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Código incorrecto o expirado');
      localStorage.setItem(MEMORIES_TOKEN_KEY, data.access_token);
      onLogin(data.email || email.trim());
    } catch (err: any) {
      setError(err.message || 'Código incorrecto o expirado. Inténtalo de nuevo.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setCode('');
    setError(null);
    setLoading(true);
    try {
      const sid = await requestOtp(email.trim());
      setSessionId(sid);
    } catch (err: any) {
      setError(err.message || 'Error al reenviar. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const card = 'min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-4';
  const inner = 'bg-white rounded-3xl shadow-xl p-10 w-full max-w-sm text-center';
  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition disabled:opacity-50';
  const btnCls = 'w-full bg-rose-500 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-600 disabled:opacity-70 transition flex items-center justify-center gap-2';

  if (step === 'otp') {
    return (
      <div className={card}>
        <div className={inner}>
          <div className="text-5xl mb-4">📬</div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Revisa tu email</h1>
          <p className="text-gray-500 text-sm mb-1">Hemos enviado un código de 6 dígitos a</p>
          <p className="text-gray-900 font-semibold text-sm mb-8">{email}</p>
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(null); }}
              placeholder="000000"
              required
              autoFocus
              disabled={loading}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-rose-300 transition disabled:opacity-50"
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button type="submit" disabled={loading || code.length !== 6} className={btnCls}>
              {loading ? <><Spinner /> Verificando…</> : 'Verificar →'}
            </button>
          </form>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={handleResend}
              disabled={loading}
              className="text-xs text-rose-500 hover:underline disabled:opacity-50"
            >
              ¿No llegó? Reenviar código
            </button>
            <button
              onClick={() => { setStep('email'); setCode(''); setError(null); }}
              className="text-xs text-gray-400 hover:text-gray-600 transition"
            >
              ← Cambiar email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={card}>
      <div className={inner}>
        <div className="text-5xl mb-4">📸</div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Memories</h1>
        <p className="text-gray-500 text-sm mb-8">Introduce tu email para acceder a tus álbumes.</p>
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            placeholder="tu@email.com"
            required
            autoFocus
            disabled={loading}
            className={inputCls}
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit" disabled={loading} className={btnCls}>
            {loading ? <><Spinner /> Enviando código…</> : 'Acceder →'}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/" className="text-rose-500 hover:underline">Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
}
