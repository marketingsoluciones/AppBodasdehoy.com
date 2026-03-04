import { useState, useEffect } from 'react';
import { AuthContextProvider } from '../context';
import { fetchApiBodas } from '../utils/Fetching';
import { queries } from '../utils/Fetching';

export default function TestEventos() {
  const { config, user } = AuthContextProvider();
  const [logs, setLogs] = useState<string[]>([]);
  const [eventos, setEventos] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    addLog('Página cargada');
    addLog(`Usuario: ${user?.email || user?.uid || 'No autenticado'}`);
    addLog(`Config development: ${config?.development}`);
  }, []);

  const testFetchEventos = async () => {
    setLogs([]);
    setEventos(null);
    setError(null);

    addLog('=== Iniciando test de carga de eventos ===');

    if (!user?.uid) {
      addLog('❌ No hay usuario autenticado');
      return;
    }

    try {
      addLog(`Usuario ID: ${user.uid}`);
      addLog(`Development: ${config?.development}`);
      addLog('Llamando a fetchApiBodas (API correcta para getEventsByID)...');

      const startTime = performance.now();
      const events = await fetchApiBodas({
        query: queries.getEventsByID,
        variables: {
          variable: "usuario_id",
          valor: user.uid,
          development: config?.development
        },
        development: config?.development
      });
      const endTime = performance.now();

      addLog(`✅ Respuesta recibida en ${(endTime - startTime).toFixed(0)}ms`);
      addLog(`Tipo de respuesta: ${typeof events}`);
      addLog(`Es array: ${Array.isArray(events)}`);
      addLog(`Longitud: ${Array.isArray(events) ? events.length : 0}`);

      setEventos(events);

      if (Array.isArray(events) && events.length > 0) {
        addLog(`✅ ${events.length} eventos encontrados:`);
        events.forEach((event, idx) => {
          addLog(`  ${idx + 1}. ${event.nombre || event._id || 'Sin nombre'}`);
        });
      } else {
        addLog('⚠️ No se encontraron eventos');
      }

    } catch (err: any) {
      const errorTime = performance.now();
      addLog(`❌ Error: ${err.message}`);
      addLog(`Error completo: ${err?.response?.data ? JSON.stringify(err.response.data) : err?.stack || ''}`);
      console.error('Error completo:', {
        message: err?.message,
        code: err?.code,
        name: err?.name,
        isAxiosError: err?.isAxiosError,
        response: err?.response?.data,
        status: err?.response?.status,
        stack: err?.stack
      });
      setError(err);
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
      <h1 style={{ fontSize: '20px', marginBottom: '20px' }}>🧪 Test de Carga de Eventos</h1>

      <div style={{
        background: '#f0f0f0',
        padding: '15px',
        marginBottom: '20px',
        borderRadius: '4px'
      }}>
        <h2 style={{ fontSize: '16px', marginBottom: '10px' }}>Estado Actual</h2>
        <div>Usuario: {user?.email || user?.displayName || user?.uid || 'No autenticado'}</div>
        <div>UID: {user?.uid || 'N/A'}</div>
        <div>Config Development: {config?.development || 'No disponible'}</div>
        <div>Config Domain: {config?.domain || 'No disponible'}</div>
      </div>

      <button
        onClick={testFetchEventos}
        style={{
          padding: '10px 20px',
          fontSize: '14px',
          cursor: 'pointer',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          marginBottom: '20px',
          marginRight: '10px'
        }}
      >
        🔍 Probar Carga de Eventos
      </button>

      <button
        onClick={() => {
          setLogs([]);
          setEventos(null);
          setError(null);
        }}
        style={{
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

      {eventos && (
        <div style={{
          background: '#d4edda',
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '4px',
          border: '2px solid #28a745'
        }}>
          <h2 style={{ fontSize: '16px', marginBottom: '10px' }}>✅ Eventos Cargados</h2>
          <pre style={{
            background: '#f8f9fa',
            padding: '10px',
            overflow: 'auto',
            fontSize: '11px',
            maxHeight: '300px'
          }}>
            {JSON.stringify(eventos, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div style={{
          background: '#f8d7da',
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '4px',
          border: '2px solid #dc3545'
        }}>
          <h2 style={{ fontSize: '16px', marginBottom: '10px' }}>❌ Error</h2>
          <div>Mensaje: {error.message}</div>
          <div>Tipo: {error.name}</div>
          {error.isAxiosError && (
            <>
              <div>Status: {error.response?.status}</div>
              <div>Data: {JSON.stringify(error.response?.data)}</div>
            </>
          )}
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
        <h2 style={{ fontSize: '16px', marginBottom: '10px', color: '#0f0' }}>📋 Logs</h2>
        {logs.length === 0 ? (
          <div>Haz clic en "Probar Carga de Eventos" para empezar...</div>
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
