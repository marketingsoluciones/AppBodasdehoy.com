/**
 * Página de prueba simple sin AuthContext
 * URL: http://localhost:8080/test-simple
 */

import Link from 'next/link';

export default function TestSimple() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#f3f4f6',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '2rem', color: '#1f2937', marginBottom: '1rem' }}>
        ✅ Servidor Next.js Funcionando
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#6b7280' }}>
        Si ves esto, el servidor está respondiendo correctamente
      </p>
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <p><strong>Hora del servidor:</strong> {new Date().toLocaleString()}</p>
        <p><strong>Puerto:</strong> 8080</p>
        <p><strong>Entorno:</strong> {process.env.NODE_ENV}</p>
      </div>
      <Link
        href="/"
        style={{
          marginTop: '2rem',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#F7628C',
          color: '#fff',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: '600'
        }}
      >
        Ir a la página principal
      </Link>
    </div>
  );
}
