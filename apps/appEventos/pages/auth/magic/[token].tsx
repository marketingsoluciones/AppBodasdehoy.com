/**
 * /auth/magic/[token] — Handler magic-link (ACTIVO)
 * ─────────────────────────────────────────────────────────────────────────────
 * Contrato cerrado con BACKEND-api-mcp (07-jul):
 *   mutation validateMagicLink(token: String!): MagicLinkAuthResponse! {
 *     success token expiresAt user { id email development firstName lastName } error
 *   }
 *
 * Flow:
 *   1. Usuario hace click en el enlace recibido por email
 *   2. Browser → app(-dev).bodasdehoy.com/auth/magic/<token>
 *   3. Server side: llamar api-mcp validateMagicLink(token)
 *   4. success:true  → setear cookie sessionBodas (mismo shape que auth mutation)
 *                      + redirect al ?redirect= (si es ruta interna segura) o "/"
 *   5. success:false → render de página de error con mensaje del backend
 *
 * Nota tenant: el token es auto-descriptivo (el backend resuelve el usuario y su
 * `development` desde el propio token), por eso NO forzamos header Development
 * (`development: false`) para no constreñir magic-links cross-tenant.
 */
import type { GetServerSidePropsContext } from 'next';
import Link from 'next/link';
import Cookies from 'cookies';
import { fetchApiEventosServer } from '../../../utils/Fetching';

const VALIDATE_MAGIC_LINK = `mutation ($token: String!) {
  validateMagicLink(token: $token) {
    success
    token
    expiresAt
    user { id email development firstName lastName }
    error
  }
}`;

interface Props {
  error: string;
}

/** Solo permite redirects a rutas internas ("/algo"), nunca a URLs absolutas. */
function safeRedirect(redirect: unknown): string {
  if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect;
  }
  return '/';
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const token = String(ctx.params?.token || '').slice(0, 4096);

  if (!token) {
    return { props: { error: 'Enlace inválido: falta el token.' } };
  }

  let result: any = null;
  try {
    const data = await fetchApiEventosServer({
      query: VALIDATE_MAGIC_LINK,
      variables: { token },
      development: false,
    });
    result = data?.validateMagicLink || null;
  } catch (err: any) {
    console.error('[auth/magic] validateMagicLink falló:', err?.message || err);
    return {
      props: {
        error: 'No se pudo validar el enlace en este momento. Inténtalo de nuevo en unos minutos.',
      },
    };
  }

  if (!result?.success || !result?.token) {
    return {
      props: { error: result?.error || 'Enlace inválido o expirado.' },
    };
  }

  // Éxito → setear sessionBodas (mismo patrón que /api/dev/refresh-session)
  const host = ctx.req.headers.host || '';
  const isLocalHost = host.includes('localhost') || host.includes('127.0.0.1');
  const isBehindProxy =
    ctx.req.headers['x-forwarded-proto'] === 'https' || Boolean(ctx.req.headers['cf-visitor']);
  const useSecureCookies = !isLocalHost && !isBehindProxy;

  // expiresAt del backend (epoch ms o ISO); si no es parseable, 30 días por defecto.
  let expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  if (result.expiresAt) {
    const parsed = new Date(
      typeof result.expiresAt === 'number' ? result.expiresAt : String(result.expiresAt),
    );
    if (!Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now()) {
      expires = parsed;
    }
  }

  const cookies = new Cookies(ctx.req, ctx.res);
  cookies.set('sessionBodas', result.token, {
    domain: isLocalHost ? undefined : '.bodasdehoy.com',
    path: '/',
    expires,
    httpOnly: false,
    secure: useSecureCookies,
    sameSite: 'lax',
  });

  return {
    redirect: {
      destination: safeRedirect(ctx.query?.redirect),
      permanent: false,
    },
  };
}

export default function MagicLinkPage({ error }: Props) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        background: '#fafafa',
      }}
    >
      <div
        style={{
          maxWidth: 520,
          background: '#fff',
          borderRadius: 12,
          padding: 32,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24, color: '#111' }}>No pudimos validar tu enlace</h1>
        <p style={{ marginTop: 16, color: '#4b5563', lineHeight: 1.6 }}>{error}</p>
        <p style={{ marginTop: 16, color: '#4b5563', lineHeight: 1.6 }}>
          Los enlaces mágicos caducan por seguridad. Puedes iniciar sesión con tu email y contraseña,
          o solicitar un enlace nuevo.
        </p>
        <Link
          href="/login"
          style={{
            display: 'inline-block',
            marginTop: 20,
            padding: '10px 20px',
            borderRadius: 8,
            background: 'linear-gradient(135deg, #ec4899, #f472b6)',
            color: '#fff',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Ir al login
        </Link>
      </div>
    </div>
  );
}
