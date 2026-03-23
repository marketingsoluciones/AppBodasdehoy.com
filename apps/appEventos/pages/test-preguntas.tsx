/**
 * Testing desde el front
 * - Estado del front (auth, config, eventos)
 * - Login si no hay sesión
 * - Lanzar varias preguntas (enlaces al Copilot / TestSuite y lista de preguntas de prueba)
 *
 * URL: /test-preguntas
 */

import Link from 'next/link';
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from '../context';

const PREGUNTAS_EJEMPLO = [
  '¿Cuántos invitados tengo?',
  '¿Cuál es la boda de Raul?',
  'Muéstrame la lista de todas las bodas',
  '¿Qué tareas tengo pendientes para mi boda?',
  'Dame ideas para el menú del banquete',
  '¿Cuánto llevo gastado en el presupuesto?',
];

// Para que el agente/navegador de Cursor pueda abrir y hacer pruebas: si la web se abre en localhost, usar Copilot en localhost.
const CHAT_TEST_BASE = (() => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost') return `${window.location.protocol}//localhost:3210`;
    if (window.location.hostname.includes('-dev.')) return 'https://chat-dev.bodasdehoy.com';
    if (window.location.hostname.includes('-test.')) return 'https://chat-test.bodasdehoy.com';
  }
  return (process.env.NEXT_PUBLIC_CHAT || 'https://chat.bodasdehoy.com').replace(/\/$/, '');
})();
const TEST_SUITE_PATH = '/bodasdehoy/admin/test-suite';

export default function TestPreguntas() {
  const { user, verificationDone, config } = AuthContextProvider();
  const { event } = EventContextProvider();
  const { eventsGroup, eventsGroupDone } = EventsGroupContextProvider();

  const openCopilot = () => {
    const url = `${CHAT_TEST_BASE}/bodasdehoy/chat`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openTestSuite = () => {
    window.open(`${CHAT_TEST_BASE}${TEST_SUITE_PATH}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      style={{
        padding: '24px',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '900px',
        margin: '0 auto',
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
      }}
    >
      <h1 style={{ fontSize: '24px', marginBottom: '8px', color: '#0f172a' }}>
        🧪 Testing desde el front
      </h1>
      <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '14px' }}>
        Revisa el estado del front, haz login si hace falta y lanza pruebas con varias preguntas.
      </p>
      <p style={{ marginBottom: '16px', fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>
        ✅ Usa el <strong>origen real</strong> (app-test). Si los subdominios <strong>siguen sin cargar</strong>: local = <code>/etc/hosts</code> + web en 8080 y Copilot en 3210; remoto = proxy a puertos 3000 (web) y 3210 (Copilot). Guía: <code>docs/SUBDOMINIOS-APUNTAN-REPOSITORIO.md</code>.
      </p>

      {/* Canal que da menos errores */}
      <div
        style={{
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#ecfdf5',
          border: '1px solid #10b981',
          borderRadius: '12px',
          fontSize: '14px',
          color: '#065f46',
        }}
      >
        <strong>✅ Canal que da menos errores:</strong> Entra en <strong>app-test</strong> (o el mismo origen donde haces login), inicia sesión ahí y usa el <strong>Copilot desde el panel lateral</strong> (iframe en la misma página). No abras chat-test en otra pestaña para las pruebas; así evitas errores por subdominio.
        <br />
        <strong>⚠️ Recordatorio:</strong> <strong>chat-test tiene que estar arriba</strong> para que el Copilot funcione (el panel lateral carga el iframe de chat-test). Los subdominios dependen de configuración; ya están configurados y funcionan.
      </div>

      {/* Estado del front */}
      <section
        style={{
          marginBottom: '24px',
          padding: '20px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0',
        }}
      >
        <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#0f172a' }}>
          📊 Estado del front
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '10px', fontSize: '14px' }}>
          <div style={{ color: '#64748b' }}>Sesión</div>
          <div style={{ color: user ? '#059669' : '#dc2626', fontWeight: 500 }}>
            {user ? (user.email || user.displayName || user.uid) : 'No autenticado'}
          </div>
          <div style={{ color: '#64748b' }}>UID</div>
          <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>{user?.uid || '—'}</div>
          <div style={{ color: '#64748b' }}>Verificación hecha</div>
          <div style={{ color: verificationDone ? '#059669' : '#dc2626' }}>
            {verificationDone ? 'Sí' : 'No'}
          </div>
          <div style={{ color: '#64748b' }}>Development</div>
          <div>{config?.development || '—'}</div>
          <div style={{ color: '#64748b' }}>Eventos cargados</div>
          <div>
            {eventsGroupDone ? `${eventsGroup?.length ?? 0} eventos` : 'Cargando…'}
            {event && ` · Activo: ${event.nombre}`}
          </div>
        </div>
      </section>

      {/* Login */}
      <section
        style={{
          marginBottom: '24px',
          padding: '20px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0',
        }}
      >
        <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#0f172a' }}>
          🔑 Login
        </h2>
        {user ? (
          <p style={{ color: '#059669', margin: 0 }}>
            Ya estás logueado. Si quieres cambiar de cuenta, cierra sesión y vuelve a entrar.
          </p>
        ) : (
          <p style={{ marginBottom: '12px', color: '#475569' }}>
            Necesitas estar logueado para que el Copilot tenga contexto de tu usuario y eventos.
          </p>
        )}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {!user && (
            <Link
              href="/login/"
              style={{
                padding: '10px 20px',
                backgroundColor: '#2563eb',
                color: '#fff',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '14px',
              }}
            >
              Ir a Login
            </Link>
          )}
          <Link
            href="/"
            style={{
              padding: '10px 20px',
              backgroundColor: '#64748b',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '14px',
            }}
          >
            Ir al Home
          </Link>
        </div>
      </section>

      {/* Lanzar varias preguntas */}
      <section
        style={{
          marginBottom: '24px',
          padding: '20px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0',
        }}
      >
        <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#0f172a' }}>
          💬 Lanzar varias preguntas
        </h2>
        <p style={{ color: '#475569', marginBottom: '8px', fontSize: '14px' }}>
          <strong>Recomendado (menos errores):</strong> desde esta misma página, abre el Copilot con el botón del header (panel lateral). Así las pruebas van por el mismo origen.
        </p>
        <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '13px' }}>
          Si necesitas TestSuite o chat-test en pestaña aparte, usa los botones de abajo.
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <Link
            href="/"
            style={{
              padding: '12px 20px',
              backgroundColor: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px',
              textDecoration: 'none',
            }}
          >
            Ir al Home y abrir Copilot (panel lateral)
          </Link>
          <button
            type="button"
            onClick={openCopilot}
            style={{
              padding: '12px 20px',
              backgroundColor: '#7c3aed',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px',
            }}
          >
            Abrir Copilot (chat-test)
          </button>
          <button
            type="button"
            onClick={openTestSuite}
            style={{
              padding: '12px 20px',
              backgroundColor: '#0d9488',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px',
            }}
          >
            Abrir TestSuite (1000 preguntas)
          </button>
        </div>

        <h3 style={{ fontSize: '14px', marginBottom: '10px', color: '#475569' }}>
          Preguntas de ejemplo para copiar y pegar en el Copilot
        </h3>
        <ul
          style={{
            margin: 0,
            paddingLeft: '20px',
            color: '#334155',
            fontSize: '14px',
            lineHeight: 1.8,
          }}
        >
          {PREGUNTAS_EJEMPLO.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>

        <p style={{ marginTop: '16px', fontSize: '13px', color: '#64748b' }}>
          Para automatizar muchas preguntas desde terminal:{' '}
          <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
            node scripts/test-copilot-questions.js
          </code>
          {' '}(requiere Playwright y app-test en marcha).
        </p>
      </section>

      {/* Enlaces rápidos */}
      <section
        style={{
          padding: '20px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0',
        }}
      >
        <h2 style={{ fontSize: '18px', marginBottom: '12px', color: '#0f172a' }}>
          🔗 Otras páginas de test
        </h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/test-eventos/" style={{ color: '#2563eb', fontSize: '14px' }}>
            Test carga de eventos
          </Link>
          <Link href="/api-debug/" style={{ color: '#2563eb', fontSize: '14px' }}>
            API Debug
          </Link>
          <Link href="/debug-front/" style={{ color: '#2563eb', fontSize: '14px' }}>
            Debug front (logs y red)
          </Link>
        </div>
      </section>
    </div>
  );
}
