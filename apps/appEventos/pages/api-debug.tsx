import { useState } from 'react';
import { AuthContextProvider } from '../context';
import Cookies from 'js-cookie';

export default function ApiDebug() {
  const { config, user } = AuthContextProvider();
  const [logs, setLogs] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testAuthMutation = async () => {
    addLog('=== Iniciando test de auth mutation ===');

    try {
      // Obtener idToken de cookies
      const idToken = Cookies.get("idTokenV0.1.0");
      addLog(`IdToken de cookie: ${idToken ? 'PRESENTE' : 'AUSENTE'}`);

      if (!idToken) {
        addLog('❌ No hay idToken en cookies');
        return;
      }

      addLog(`IdToken (primeros 50): ${idToken.substring(0, 50)}...`);
      addLog(`Config development: ${config?.development}`);

      // Test 1: Llamada directa a API Bodas
      addLog('--- Test 1: Llamada directa a https://api.bodasdehoy.com/graphql ---');

      const directResponse = await fetch('https://api.bodasdehoy.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Development': config?.development || 'bodasdehoy',
        },
        body: JSON.stringify({
          query: `mutation ($idToken: String) {
            auth(idToken: $idToken) {
              sessionCookie
            }
          }`,
          variables: { idToken }
        })
      });

      const directData = await directResponse.json();
      addLog(`Status directo: ${directResponse.status}`);
      addLog(`Resultado directo: ${JSON.stringify(directData, null, 2)}`);

      // Test 2: Llamada via proxy
      addLog('--- Test 2: Llamada via proxy /api/proxy-bodas/graphql ---');

      const proxyResponse = await fetch('/api/proxy-bodas/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Development': config?.development || 'bodasdehoy',
        },
        body: JSON.stringify({
          query: `mutation ($idToken: String) {
            auth(idToken: $idToken) {
              sessionCookie
            }
          }`,
          variables: { idToken }
        })
      });

      const proxyData = await proxyResponse.json();
      addLog(`Status proxy: ${proxyResponse.status}`);
      addLog(`Resultado proxy: ${JSON.stringify(proxyData, null, 2)}`);

      setTestResult({
        direct: directData,
        proxy: proxyData,
        directStatus: directResponse.status,
        proxyStatus: proxyResponse.status
      });

    } catch (error: any) {
      addLog(`❌ Error en test: ${error.message}`);
      addLog(`Stack: ${error.stack}`);
    }
  };

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'monospace',
      fontSize: '12px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{ fontSize: '20px', marginBottom: '20px' }}>🔍 Diagnóstico de API de Autenticación</h1>

      <div style={{
        background: '#f0f0f0',
        padding: '15px',
        marginBottom: '20px',
        borderRadius: '4px'
      }}>
        <h2 style={{ fontSize: '16px', marginBottom: '10px' }}>Estado Actual</h2>
        <div>Usuario actual: {user?.email || user?.displayName || 'No autenticado'}</div>
        <div>Config Development: {config?.development || 'No disponible'}</div>
        <div>Config Domain: {config?.domain || 'No disponible'}</div>
        <div>Config Cookie: {config?.cookie || 'No disponible'}</div>
        <div>IdToken presente: {Cookies.get("idTokenV0.1.0") ? '✅ Sí' : '❌ No'}</div>
        <div>SessionCookie presente: {Cookies.get(config?.cookie) ? '✅ Sí' : '❌ No'}</div>
      </div>

      <button
        onClick={testAuthMutation}
        style={{
          padding: '10px 20px',
          fontSize: '14px',
          cursor: 'pointer',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          marginBottom: '20px'
        }}
      >
        🧪 Probar Auth Mutation
      </button>

      <button
        onClick={() => {
          setLogs([]);
          setTestResult(null);
        }}
        style={{
          marginLeft: '10px',
          padding: '10px 20px',
          fontSize: '14px',
          cursor: 'pointer',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          marginBottom: '20px'
        }}
      >
        🗑️ Limpiar
      </button>

      {testResult && (
        <div style={{
          background: '#fff',
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '4px',
          border: '2px solid #007bff'
        }}>
          <h2 style={{ fontSize: '16px', marginBottom: '10px' }}>📊 Resultado del Test</h2>

          <div style={{ marginBottom: '15px' }}>
            <strong>Llamada Directa (Status {testResult.directStatus}):</strong>
            <pre style={{
              background: '#f8f9fa',
              padding: '10px',
              overflow: 'auto',
              fontSize: '11px'
            }}>
              {JSON.stringify(testResult.direct, null, 2)}
            </pre>
          </div>

          <div>
            <strong>Llamada via Proxy (Status {testResult.proxyStatus}):</strong>
            <pre style={{
              background: '#f8f9fa',
              padding: '10px',
              overflow: 'auto',
              fontSize: '11px'
            }}>
              {JSON.stringify(testResult.proxy, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div style={{
        background: '#000',
        color: '#0f0',
        padding: '15px',
        borderRadius: '4px',
        maxHeight: '500px',
        overflow: 'auto'
      }}>
        <h2 style={{ fontSize: '16px', marginBottom: '10px', color: '#0f0' }}>📋 Logs Detallados</h2>
        {logs.length === 0 ? (
          <div>Haz clic en "Probar Auth Mutation" para empezar...</div>
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
