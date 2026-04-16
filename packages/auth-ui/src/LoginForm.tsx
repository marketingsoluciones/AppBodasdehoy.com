import React, { useState } from 'react';

export interface LoginFormProps {
  /** Handler para login con email/contraseña */
  onEmailLogin: (email: string, password: string) => Promise<void>;
  /** Handler para login con Google (omitir para ocultar botón) */
  onGoogleLogin?: () => Promise<void>;
  /** Handler para login con Facebook (omitir para ocultar botón) */
  onFacebookLogin?: () => Promise<void>;
  /** Handler para login con WhatsApp OTP — abre el flujo de teléfono (omitir para ocultar botón) */
  onWhatsAppLogin?: () => void;
  /** Handler para modo visitante (omitir para ocultar opción) */
  onVisitor?: () => void;
  /** Navegar a formulario de recuperar contraseña */
  onForgotPassword?: () => void;
  /** Navegar a formulario de registro */
  onRegister?: () => void;
  /** Error externo (de auth) — se combina con el error interno del form */
  error?: string | null;
  /** Mensaje de sesión expirada */
  sessionExpiredMessage?: string | null;
}

// Iconos inline — sin dependencias externas
const GoogleIcon = () => (
  <svg height="18" viewBox="0 0 18 18" width="18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const FacebookIcon = () => (
  <svg height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#fff"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="#fff"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.852L.054 23.25a.75.75 0 00.916.916l5.398-1.478A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.713 9.713 0 01-4.94-1.348l-.355-.21-3.676 1.004 1.004-3.676-.21-.355A9.713 9.713 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" fill="#fff"/>
  </svg>
);

const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" x2="23" y1="1" y2="23"/>
  </svg>
);

const s = {
  root: { display: 'flex', flexDirection: 'column' as const, gap: 16, width: '100%' },
  alert: (type: 'error' | 'warning') => ({
    background: type === 'error' ? '#fff2f0' : '#fffbe6',
    border: `1px solid ${type === 'error' ? '#ffccc7' : '#ffe58f'}`,
    borderRadius: 8,
    color: type === 'error' ? '#cf1322' : '#874d00',
    fontSize: 13,
    padding: '10px 14px',
  }),
  divider: { alignItems: 'center', color: '#bfbfbf', display: 'flex', fontSize: 12, gap: 8 },
  dividerLine: { background: '#f0f0f0', flex: 1, height: 1 },
  fieldWrap: { display: 'flex', flexDirection: 'column' as const, gap: 4 },
  label: { color: '#595959', fontSize: 13, fontWeight: 500 },
  inputWrap: { position: 'relative' as const },
  input: {
    background: '#fafafa',
    border: '1px solid #d9d9d9',
    borderRadius: 8,
    fontSize: 14,
    height: 44,
    outline: 'none',
    padding: '0 40px 0 12px',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  eyeBtn: {
    background: 'none',
    border: 'none',
    color: '#8c8c8c',
    cursor: 'pointer',
    padding: 4,
    position: 'absolute' as const,
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
  },
  forgotLink: {
    background: 'none',
    border: 'none',
    color: '#ec4899',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    padding: 0,
    textAlign: 'right' as const,
    width: '100%',
  },
  btnPrimary: (loading: boolean) => ({
    background: loading ? '#f0f0f0' : 'linear-gradient(90deg, #ec4899, #a855f7)',
    border: 'none',
    borderRadius: 8,
    color: loading ? '#8c8c8c' : 'white',
    cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: 15,
    fontWeight: 700,
    height: 48,
    opacity: loading ? 0.7 : 1,
    transition: 'opacity 0.2s',
    width: '100%',
  }),
  btnSocial: (bg?: string) => ({
    alignItems: 'center',
    background: bg || '#ffffff',
    border: `1px solid ${bg ? 'transparent' : '#d9d9d9'}`,
    borderRadius: 8,
    color: bg ? 'white' : '#262626',
    cursor: 'pointer',
    display: 'flex',
    fontSize: 14,
    fontWeight: 500,
    gap: 10,
    height: 44,
    justifyContent: 'center',
    transition: 'opacity 0.2s',
    width: '100%',
  }),
  registerRow: { color: '#8c8c8c', fontSize: 13, textAlign: 'center' as const },
  registerLink: {
    background: 'none',
    border: 'none',
    color: '#ec4899',
    cursor: 'pointer',
    font: 'inherit',
    fontSize: 13,
    fontWeight: 600,
    padding: 0,
  },
  visitorWrap: { borderTop: '1px solid #f0f0f0', paddingTop: 16, textAlign: 'center' as const },
  visitorBtn: {
    background: 'none',
    border: 'none',
    color: '#8c8c8c',
    cursor: 'pointer',
    fontSize: 12,
    textDecoration: 'underline',
  },
};

export function LoginForm({
  onEmailLogin,
  onGoogleLogin,
  onFacebookLogin,
  onWhatsAppLogin,
  onVisitor,
  onForgotPassword,
  onRegister,
  error: externalError,
  sessionExpiredMessage,
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayError = error || externalError || null;
  const anyLoading = loading || googleLoading || facebookLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Introduce tu email y contraseña.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onEmailLogin(email, password);
    } catch (err: any) {
      setError(err?.message || 'Email o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!onGoogleLogin) return;
    setError(null);
    setGoogleLoading(true);
    try {
      await onGoogleLogin();
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión con Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebook = async () => {
    if (!onFacebookLogin) return;
    setError(null);
    setFacebookLoading(true);
    try {
      await onFacebookLogin();
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión con Facebook.');
    } finally {
      setFacebookLoading(false);
    }
  };

  return (
    <div style={s.root}>
      {/* Sesión expirada */}
      {sessionExpiredMessage && (
        <div style={s.alert('warning')}>{sessionExpiredMessage}</div>
      )}

      {/* Error */}
      {displayError && (
        <div style={s.alert('error')}>{displayError}</div>
      )}

      {/* Botones sociales */}
      {(onGoogleLogin || onFacebookLogin || onWhatsAppLogin) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {onGoogleLogin && (
            <button
              disabled={anyLoading}
              onClick={handleGoogle}
              style={s.btnSocial()}
              type="button"
            >
              <GoogleIcon />
              {googleLoading ? 'Conectando...' : 'Continuar con Google'}
            </button>
          )}
          {onFacebookLogin && (
            <button
              disabled={anyLoading}
              onClick={handleFacebook}
              style={s.btnSocial('#1877f2')}
              type="button"
            >
              <FacebookIcon />
              {facebookLoading ? 'Conectando...' : 'Continuar con Facebook'}
            </button>
          )}
          {onWhatsAppLogin && (
            <button
              disabled={anyLoading}
              onClick={onWhatsAppLogin}
              style={s.btnSocial('#25d366')}
              type="button"
            >
              <WhatsAppIcon />
              Continuar con WhatsApp
            </button>
          )}
        </div>
      )}

      {/* Separador */}
      {(onGoogleLogin || onFacebookLogin || onWhatsAppLogin) && (
        <div style={s.divider}>
          <div style={s.dividerLine} />
          <span>o con email</span>
          <div style={s.dividerLine} />
        </div>
      )}

      {/* Formulario email/contraseña */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={s.fieldWrap}>
          <label style={s.label}>Email</label>
          <div style={s.inputWrap}>
            <input
              autoComplete="email"
              disabled={anyLoading}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              style={s.input}
              type="email"
              value={email}
            />
          </div>
        </div>

        <div style={s.fieldWrap}>
          <label style={s.label}>Contraseña</label>
          <div style={s.inputWrap}>
            <input
              autoComplete="current-password"
              disabled={anyLoading}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={s.input}
              type={showPassword ? 'text' : 'password'}
              value={password}
            />
            <button
              onClick={() => setShowPassword((v) => !v)}
              style={s.eyeBtn}
              tabIndex={-1}
              type="button"
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>

        {onForgotPassword && (
          <button onClick={onForgotPassword} style={s.forgotLink} type="button">
            ¿Olvidaste tu contraseña?
          </button>
        )}

        <button disabled={anyLoading} style={s.btnPrimary(loading)} type="submit">
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </form>

      {/* Enlace a registro */}
      {onRegister && (
        <div style={s.registerRow}>
          ¿No tienes cuenta?{' '}
          <button onClick={onRegister} style={s.registerLink} type="button">
            Crear cuenta gratis
          </button>
        </div>
      )}

      {/* Modo visitante */}
      {onVisitor && (
        <div style={s.visitorWrap}>
          <button onClick={onVisitor} style={s.visitorBtn} type="button">
            Continuar como visitante (funciones limitadas)
          </button>
        </div>
      )}
    </div>
  );
}

export default LoginForm;
