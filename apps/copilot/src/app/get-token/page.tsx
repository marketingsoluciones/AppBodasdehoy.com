'use client';

import { useEffect, useState } from 'react';

/**
 * Página temporal para obtener token de Firebase
 * SOLO PARA DESARROLLO Y TESTING
 */
export default function GetTokenPage() {
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchToken() {
      try {
        setLoading(true);
        setError('');

        // Intentar obtener desde Firebase Auth directamente
        if (typeof window !== 'undefined') {
          // @ts-ignore - Firebase global
          const firebase = window.firebase;

          if (firebase?.auth) {
            const user = firebase.auth().currentUser;

            if (user) {
              const idToken = await user.getIdToken();
              setToken(idToken);
              setLoading(false);
              return;
            }
          }
        }

        setError('No se pudo obtener el token. Asegúrate de estar logueado.');
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setLoading(false);
      }
    }

    fetchToken();
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('Error al copiar. Selecciona y copia manualmente.');
    }
  };

  const copyCommand = async () => {
    const command = `FIREBASE_TOKEN="${token}" node test-memories-api.js`;
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('Error al copiar. Selecciona y copia manualmente.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'monospace',
      backgroundColor: '#1e1e1e',
      color: '#d4d4d4'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#4ec9b0', marginBottom: '1rem' }}>
          🔑 Firebase Token - Testing
        </h1>

        <p style={{ marginBottom: '2rem', color: '#9cdcfe' }}>
          Token para validación de Memories API
        </p>

        {loading && (
          <div style={{ padding: '1rem', backgroundColor: '#252526', borderRadius: '4px' }}>
            <p>⏳ Obteniendo token...</p>
          </div>
        )}

        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#5a1d1d',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            <p style={{ color: '#f48771' }}>❌ {error}</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Por favor asegúrate de estar logueado en la aplicación.
            </p>
          </div>
        )}

        {token && (
          <>
            <div style={{
              padding: '1rem',
              backgroundColor: '#1d3d1d',
              borderRadius: '4px',
              marginBottom: '1rem'
            }}>
              <p style={{ color: '#4ec9b0' }}>✅ Token obtenido exitosamente</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Longitud: {token.length} caracteres
              </p>
            </div>

            {/* Token */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <h3 style={{ margin: 0 }}>Token:</h3>
                <button
                  onClick={copyToClipboard}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: copied ? '#4ec9b0' : '#0e639c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {copied ? '✓ Copiado' : '📋 Copiar Token'}
                </button>
              </div>
              <textarea
                readOnly
                value={token}
                style={{
                  width: '100%',
                  minHeight: '150px',
                  padding: '1rem',
                  backgroundColor: '#252526',
                  color: '#d4d4d4',
                  border: '1px solid #3e3e42',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  wordBreak: 'break-all'
                }}
              />
            </div>

            {/* Comando para ejecutar */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <h3 style={{ margin: 0 }}>Comando para testing:</h3>
                <button
                  onClick={copyCommand}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: copied ? '#4ec9b0' : '#0e639c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {copied ? '✓ Copiado' : '📋 Copiar Comando'}
                </button>
              </div>
              <pre style={{
                padding: '1rem',
                backgroundColor: '#252526',
                border: '1px solid #3e3e42',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.85rem'
              }}>
                {`FIREBASE_TOKEN="${token}" node test-memories-api.js`}
              </pre>
            </div>

            {/* Instrucciones */}
            <div style={{
              padding: '1rem',
              backgroundColor: '#252526',
              borderRadius: '4px'
            }}>
              <h3 style={{ marginTop: 0, color: '#4ec9b0' }}>📝 Instrucciones:</h3>
              <ol style={{ paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  Copia el comando completo (botón arriba)
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  Abre una terminal en la raíz del proyecto
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  Pega y ejecuta el comando
                </li>
                <li>
                  Verás los resultados de los tests de Memories API
                </li>
              </ol>

              <p style={{
                marginTop: '1rem',
                padding: '0.5rem',
                backgroundColor: '#1e1e1e',
                borderRadius: '4px',
                fontSize: '0.85rem'
              }}>
                💡 <strong>Tip:</strong> Este token expira en 1 hora. Si los tests fallan por autenticación,
                recarga esta página para obtener un nuevo token.
              </p>
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '1px solid #3e3e42',
          fontSize: '0.85rem',
          color: '#858585'
        }}>
          <p>⚠️ Esta página es solo para desarrollo y testing.</p>
          <p>No expongas este token públicamente.</p>
        </div>
      </div>
    </div>
  );
}
