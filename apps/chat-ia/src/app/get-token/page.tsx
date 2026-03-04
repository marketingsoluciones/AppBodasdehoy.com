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
    } catch {
      alert('Error al copiar. Selecciona y copia manualmente.');
    }
  };

  const copyCommand = async () => {
    const command = `FIREBASE_TOKEN="${token}" node test-memories-api.js`;
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Error al copiar. Selecciona y copia manualmente.');
    }
  };

  return (
    <div style={{
      backgroundColor: '#1e1e1e',
      color: '#d4d4d4',
      fontFamily: 'monospace',
      minHeight: '100vh',
      padding: '2rem'
    }}>
      <div style={{ margin: '0 auto', maxWidth: '800px' }}>
        <h1 style={{ color: '#4ec9b0', marginBottom: '1rem' }}>
          🔑 Firebase Token - Testing
        </h1>

        <p style={{ color: '#9cdcfe', marginBottom: '2rem' }}>
          Token para validación de Memories API
        </p>

        {loading && (
          <div style={{ backgroundColor: '#252526', borderRadius: '4px', padding: '1rem' }}>
            <p>⏳ Obteniendo token...</p>
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: '#5a1d1d',
            borderRadius: '4px',
            marginBottom: '1rem',
            padding: '1rem'
          }}>
            <p style={{ color: '#f48771' }}>❌ {error}</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Por favor asegúrate de estar logueado en la aplicación.
            </p>
          </div>
        )}

        {token && (
          <>
            <div style={{
              backgroundColor: '#1d3d1d',
              borderRadius: '4px',
              marginBottom: '1rem',
              padding: '1rem'
            }}>
              <p style={{ color: '#4ec9b0' }}>✅ Token obtenido exitosamente</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Longitud: {token.length} caracteres
              </p>
            </div>

            {/* Token */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <h3 style={{ margin: 0 }}>Token:</h3>
                <button
                  onClick={copyToClipboard}
                  style={{
                    backgroundColor: copied ? '#4ec9b0' : '#0e639c',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: '0.5rem 1rem'
                  }}
                >
                  {copied ? '✓ Copiado' : '📋 Copiar Token'}
                </button>
              </div>
              <textarea
                readOnly
                style={{
                  backgroundColor: '#252526',
                  border: '1px solid #3e3e42',
                  borderRadius: '4px',
                  color: '#d4d4d4',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  minHeight: '150px',
                  padding: '1rem',
                  width: '100%',
                  wordBreak: 'break-all'
                }}
                value={token}
              />
            </div>

            {/* Comando para ejecutar */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <h3 style={{ margin: 0 }}>Comando para testing:</h3>
                <button
                  onClick={copyCommand}
                  style={{
                    backgroundColor: copied ? '#4ec9b0' : '#0e639c',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: '0.5rem 1rem'
                  }}
                >
                  {copied ? '✓ Copiado' : '📋 Copiar Comando'}
                </button>
              </div>
              <pre style={{
                backgroundColor: '#252526',
                border: '1px solid #3e3e42',
                borderRadius: '4px',
                fontSize: '0.85rem',
                overflow: 'auto',
                padding: '1rem'
              }}>
                {`FIREBASE_TOKEN="${token}" node test-memories-api.js`}
              </pre>
            </div>

            {/* Instrucciones */}
            <div style={{
              backgroundColor: '#252526',
              borderRadius: '4px',
              padding: '1rem'
            }}>
              <h3 style={{ color: '#4ec9b0', marginTop: 0 }}>📝 Instrucciones:</h3>
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
                backgroundColor: '#1e1e1e',
                borderRadius: '4px',
                fontSize: '0.85rem',
                marginTop: '1rem',
                padding: '0.5rem'
              }}>
                💡 <strong>Tip:</strong> Este token expira en 1 hora. Si los tests fallan por autenticación,
                recarga esta página para obtener un nuevo token.
              </p>
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{
          borderTop: '1px solid #3e3e42',
          color: '#858585',
          fontSize: '0.85rem',
          marginTop: '2rem',
          paddingTop: '1rem'
        }}>
          <p>⚠️ Esta página es solo para desarrollo y testing.</p>
          <p>No expongas este token públicamente.</p>
        </div>
      </div>
    </div>
  );
}
