/**
 * Página de Debugging del Frontend
 * URL: http://localhost:8080/debug-front
 *
 * Muestra en tiempo real:
 * - Estado de autenticación
 * - Eventos cargados
 * - Errores de JavaScript
 * - Network requests
 * - Estado del Copilot
 */

import { useEffect, useState } from 'react';
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from '../context';

export default function DebugFront() {
  const { user, verificationDone, config } = AuthContextProvider();
  const { event } = EventContextProvider();
  const { eventsGroup, eventsGroupDone } = EventsGroupContextProvider();
  const [logs, setLogs] = useState<any[]>([]);
  const [networkLogs, setNetworkLogs] = useState<any[]>([]);

  // Capturar todos los console.log
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      setLogs((prev) => [...prev.slice(-50), { type: 'log', time: new Date().toISOString(), data: args }]);
      originalLog(...args);
    };

    console.error = (...args) => {
      setLogs((prev) => [...prev.slice(-50), { type: 'error', time: new Date().toISOString(), data: args }]);
      originalError(...args);
    };

    console.warn = (...args) => {
      setLogs((prev) => [...prev.slice(-50), { type: 'warn', time: new Date().toISOString(), data: args }]);
      originalWarn(...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // Leer logs del servidor
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/dev/browser-log?limit=20');
        const data = await res.json();
        setNetworkLogs(data.logs || []);
      } catch (err) {
        console.error('Error loading logs:', err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px', backgroundColor: '#1a1a1a', color: '#00ff00', minHeight: '100vh' }}>
      <h1 style={{ color: '#ff00ff', marginBottom: '20px' }}>🔍 Debug Frontend - Bodas de Hoy</h1>

      {/* Estado de Autenticación */}
      <section style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2 style={{ color: '#00ffff', marginBottom: '10px' }}>🔐 Autenticación</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '10px' }}>
          <div>verificationDone:</div>
          <div style={{ color: verificationDone ? '#00ff00' : '#ff0000' }}>{String(verificationDone)}</div>

          <div>Usuario:</div>
          <div style={{ color: user ? '#00ff00' : '#ff0000' }}>{user?.email || user?.displayName || 'No logueado'}</div>

          <div>UID:</div>
          <div>{user?.uid || 'N/A'}</div>

          <div>Role:</div>
          <div>{user?.role?.join(', ') || 'N/A'}</div>

          <div>Config Development:</div>
          <div>{config?.development || 'N/A'}</div>
        </div>
      </section>

      {/* Estado de Eventos */}
      <section style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2 style={{ color: '#00ffff', marginBottom: '10px' }}>📅 Eventos</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '10px' }}>
          <div>eventsGroupDone:</div>
          <div style={{ color: eventsGroupDone ? '#00ff00' : '#ff0000' }}>{String(eventsGroupDone)}</div>

          <div>Eventos cargados:</div>
          <div>{eventsGroup?.length || 0}</div>

          <div>Evento seleccionado:</div>
          <div style={{ color: event ? '#00ff00' : '#ff0000' }}>{event?.nombre || 'Ninguno'}</div>

          <div>Evento ID:</div>
          <div>{event?._id || 'N/A'}</div>
        </div>

        {eventsGroup && eventsGroup.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <h3 style={{ color: '#ffff00', marginBottom: '10px' }}>Lista de Eventos:</h3>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {eventsGroup.map((evt: any, idx: number) => (
                <div key={idx} style={{ padding: '8px', backgroundColor: '#3a3a3a', marginBottom: '5px', borderRadius: '4px' }}>
                  <div><strong>{evt.nombre}</strong> (ID: {evt._id})</div>
                  <div style={{ fontSize: '10px', color: '#888' }}>Tipo: {evt.tipoDeEvento}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Console Logs en Vivo */}
      <section style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2 style={{ color: '#00ffff', marginBottom: '10px' }}>📝 Console Logs (últimos 20)</h2>
        <div style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: '#1a1a1a', padding: '10px', borderRadius: '4px' }}>
          {logs.slice(-20).map((log, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: '5px',
                color: log.type === 'error' ? '#ff0000' : log.type === 'warn' ? '#ffff00' : '#00ff00',
                borderBottom: '1px solid #333',
                paddingBottom: '5px',
              }}
            >
              <span style={{ color: '#888', marginRight: '10px' }}>[{new Date(log.time).toLocaleTimeString()}]</span>
              <span style={{ color: '#ff00ff', marginRight: '10px' }}>[{log.type}]</span>
              <span>{JSON.stringify(log.data, null, 2)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Network Logs del Servidor */}
      <section style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2 style={{ color: '#00ffff', marginBottom: '10px' }}>🌐 Network Logs (del servidor)</h2>
        <div style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: '#1a1a1a', padding: '10px', borderRadius: '4px' }}>
          {networkLogs.slice(-20).map((log: any, idx: number) => (
            <div
              key={idx}
              style={{
                marginBottom: '8px',
                color: log.type === 'error' ? '#ff0000' : '#00ff00',
                borderBottom: '1px solid #333',
                paddingBottom: '5px',
              }}
            >
              <div>
                <span style={{ color: '#888' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span style={{ color: '#ff00ff', marginLeft: '10px' }}>[{log.type}]</span>
              </div>
              {log.data && typeof log.data === 'object' && log.data.url && (
                <div style={{ marginLeft: '20px', fontSize: '10px' }}>
                  <div style={{ color: '#00ffff' }}>{log.data.method || 'GET'} {log.data.url}</div>
                  {log.data.status && (
                    <div style={{ color: log.data.ok ? '#00ff00' : '#ff0000' }}>
                      Status: {log.data.status} ({log.data.duration}ms)
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Acciones Rápidas */}
      <section style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2 style={{ color: '#00ffff', marginBottom: '10px' }}>⚡ Acciones Rápidas</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4a4a4a',
              color: '#00ff00',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            🏠 Ir a Home
          </button>
          <button
            onClick={() => window.location.href = '/login'}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4a4a4a',
              color: '#00ff00',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            🔑 Ir a Login
          </button>
          <button
            onClick={() => setLogs([])}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4a4a4a',
              color: '#ffff00',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            🗑️ Limpiar Logs
          </button>
          <button
            onClick={() => fetch('/api/dev/browser-log', { method: 'DELETE' })}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4a4a4a',
              color: '#ff0000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            🗑️ Limpiar Logs del Servidor
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4a4a4a',
              color: '#00ffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            🔄 Recargar Página
          </button>
        </div>
      </section>

      {/* Estado del Sistema */}
      <section style={{ padding: '15px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2 style={{ color: '#00ffff', marginBottom: '10px' }}>💻 Sistema</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '10px' }}>
          <div>URL Actual:</div>
          <div>{typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>

          <div>Hostname:</div>
          <div>{typeof window !== 'undefined' ? window.location.hostname : 'N/A'}</div>

          <div>User Agent:</div>
          <div style={{ fontSize: '10px' }}>{typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</div>

          <div>Viewport:</div>
          <div>
            {typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A'}
          </div>
        </div>
      </section>
    </div>
  );
}
