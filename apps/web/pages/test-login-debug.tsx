import { useState, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { AuthContextProvider } from '../context';

export default function TestLoginDebug() {
  const [email, setEmail] = useState('bodasdehoy.com@gmail.com');
  const [password, setPassword] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const { config, user } = AuthContextProvider();

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    addLog('Página cargada');
    addLog(`Config: ${JSON.stringify(config)}`);
    addLog(`User actual: ${user ? user.email : 'No autenticado'}`);

    try {
      const auth = getAuth();
      addLog(`Firebase Auth inicializado: ${!!auth}`);
      addLog(`Firebase App: ${auth.app?.name || 'No disponible'}`);
      setFirebaseInitialized(!!auth);
    } catch (error: any) {
      addLog(`Error al obtener Firebase Auth: ${error.message}`);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    addLog('=== Iniciando proceso de login ===');

    if (!firebaseInitialized) {
      addLog('❌ Firebase no está inicializado');
      return;
    }

    try {
      const auth = getAuth();
      addLog(`Intentando login con email: ${email}`);
      addLog(`Firebase config actual: ${auth.app.name}`);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      addLog(`✅ Login exitoso en Firebase`);
      addLog(`User UID: ${userCredential.user.uid}`);
      addLog(`User Email: ${userCredential.user.email}`);

      const token = await userCredential.user.getIdToken();
      addLog(`Token obtenido: ${token.substring(0, 50)}...`);

    } catch (error: any) {
      addLog(`❌ Error en login: ${error.code}`);
      addLog(`Mensaje: ${error.message}`);
      console.error('Error completo:', error);
    }
  };

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'monospace',
      fontSize: '12px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ fontSize: '20px', marginBottom: '20px' }}>🔍 Diagnóstico de Login</h1>

      <div style={{
        background: '#f0f0f0',
        padding: '15px',
        marginBottom: '20px',
        borderRadius: '4px'
      }}>
        <h2 style={{ fontSize: '16px', marginBottom: '10px' }}>Estado Actual</h2>
        <div>Firebase Inicializado: {firebaseInitialized ? '✅ Sí' : '❌ No'}</div>
        <div>Config Domain: {config?.domain || 'No disponible'}</div>
        <div>Config Cookie: {config?.cookie || 'No disponible'}</div>
        <div>Config Development: {config?.development || 'No disponible'}</div>
        <div>Usuario actual: {user?.email || 'No autenticado'}</div>
      </div>

      <form onSubmit={handleLogin} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          🔐 Probar Login
        </button>

        <button
          type="button"
          onClick={() => setLogs([])}
          style={{
            marginLeft: '10px',
            padding: '10px 20px',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          🗑️ Limpiar Logs
        </button>
      </form>

      <div style={{
        background: '#000',
        color: '#0f0',
        padding: '15px',
        borderRadius: '4px',
        maxHeight: '400px',
        overflow: 'auto'
      }}>
        <h2 style={{ fontSize: '16px', marginBottom: '10px', color: '#0f0' }}>📋 Logs</h2>
        {logs.length === 0 ? (
          <div>No hay logs todavía...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ marginBottom: '5px' }}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
