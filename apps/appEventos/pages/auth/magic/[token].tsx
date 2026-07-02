/**
 * /auth/magic/[token] — Handler magic-link (STUB)
 * ─────────────────────────────────────────────────────────────────────────────
 * Estado: STUB acordado con BACKEND-api-mcp 1-jul. Espera specs finales.
 *
 * Contrato pendiente que BACKEND-api-mcp debe cerrar:
 *   1. Endpoint que emite el link:    (¿POST /auth/magic-link/send con {email}?)
 *   2. Formato del token:              JWT firmado con MAGIC_LINK_SECRET_KEY
 *   3. TTL del token:                  15 min (900 seg)
 *   4. Endpoint que valida:            (¿mutation validateMagicLink(token)?)
 *   5. Qué devuelve tras validar:      sessionCookie (mismo shape que auth mutation)
 *   6. Redirect base:                  MAGIC_LINK_REDIRECT_BASE (app.bodasdehoy.com)
 *
 * ENV vars server-side que necesitamos:
 *   MAGIC_LINK_SECRET_KEY       (para verificar firma JWT)
 *   MAGIC_LINK_TTL_SECONDS      (default 900)
 *   MAGIC_LINK_REDIRECT_BASE    (default resolveAppOrigin())
 *
 * Flow esperado (una vez con specs):
 *   1. Usuario click link recibido por email
 *   2. Browser → app-dev.bodasdehoy.com/auth/magic/<token>
 *   3. Server side: verificar firma + exp local (bail-out temprano)
 *   4. Server side: llamar api-mcp validateMagicLink(token) → sessionCookie
 *   5. Setear sessionBodas + idTokenV0.1.0 (Domain=.bodasdehoy.com)
 *   6. Redirect a MAGIC_LINK_REDIRECT_BASE (o al ?redirect= query si viene)
 *
 * Este stub responde 501 Not Implemented con las specs pedidas visibles
 * para que si algún link llega antes de tiempo, el usuario y el equipo
 * QA vean claramente qué falta.
 */
import type { GetServerSidePropsContext } from 'next';

interface Props {
  token: string;
  reason: string;
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const token = String(ctx.params?.token || '').slice(0, 200);
  ctx.res.statusCode = 501;
  return {
    props: {
      token,
      reason:
        'Endpoint pendiente de specs backend api-mcp: MAGIC_LINK_SECRET_KEY, ' +
        'MAGIC_LINK_TTL_SECONDS, validateMagicLink mutation contract.',
    },
  };
}

export default function MagicLinkPage({ token, reason }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      background: '#fafafa',
    }}>
      <div style={{
        maxWidth: 520,
        background: '#fff',
        borderRadius: 12,
        padding: 32,
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        <h1 style={{ margin: 0, fontSize: 24, color: '#111' }}>
          Enlace mágico — pendiente de activar
        </h1>
        <p style={{ marginTop: 16, color: '#4b5563', lineHeight: 1.6 }}>
          Recibiste este enlace pero el sistema aún no puede validarlo. El
          equipo está terminando los últimos detalles y quedará operativo muy
          pronto.
        </p>
        <p style={{ marginTop: 16, color: '#4b5563', lineHeight: 1.6 }}>
          Mientras tanto, puedes iniciar sesión normalmente con tu email y
          contraseña:
        </p>
        <a
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
        </a>
        <details style={{ marginTop: 24 }}>
          <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: 12 }}>
            Detalles técnicos
          </summary>
          <pre style={{
            marginTop: 8,
            padding: 12,
            background: '#f3f4f6',
            borderRadius: 6,
            fontSize: 11,
            color: '#374151',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>
{`token   : ${token.slice(0, 40)}${token.length > 40 ? '…' : ''}
motivo  : ${reason}
status  : 501 Not Implemented`}
          </pre>
        </details>
      </div>
    </div>
  );
}
