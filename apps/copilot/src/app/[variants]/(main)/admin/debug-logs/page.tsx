'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Typography } from 'antd';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import { getDebugLogs, clearDebugLogs } from '@/utils/debugLogger';

const { Text } = Typography;

export default function DebugLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);

  const loadLogs = async () => {
    // Cargar de localStorage
    const debugLogs = getDebugLogs();
    setLogs(debugLogs);

    // También intentar cargar del backend
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030';
      const response = await fetch(`${BACKEND_URL}/api/debug-logs`);
      if (response.ok) {
        const backendData = await response.json();
        if (backendData.logs && backendData.logs.length > 0) {
          // Combinar logs del backend con localStorage
          const combined = [...debugLogs, ...backendData.logs];
          // Ordenar por timestamp
          combined.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          setLogs(combined);
        }
      }
    } catch {
      // Ignorar errores de backend
    }
  };

  useEffect(() => {
    loadLogs();
    // Auto-refresh cada 2 segundos
    const interval = setInterval(loadLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  const downloadLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debug-logs-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Agrupar logs por hypothesisId
  const logsByHypothesis = logs.reduce((acc, log) => {
    const id = log.hypothesisId || 'X';
    if (!acc[id]) acc[id] = [];
    acc[id].push(log);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🐛 Debug Logs</h1>
          <p className="mt-2 text-gray-600">
            Logs de inicialización capturados desde localStorage
          </p>
        </div>
        <div className="space-x-2">
          <Button icon={<ReloadOutlined />} onClick={loadLogs}>
            Actualizar
          </Button>
          <Button icon={<DownloadOutlined />} onClick={downloadLogs}>
            Descargar JSON
          </Button>
          <Button danger onClick={() => { clearDebugLogs(); loadLogs(); }}>
            Limpiar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold">{logs.length}</div>
            <div className="text-sm text-gray-600">Total Logs</div>
          </div>
        </Card>
      </div>

      {/* Logs por hipótesis */}
      {Object.entries(logsByHypothesis).map(([hypothesisId, hypothesisLogs]) => (
        <Card key={hypothesisId} title={`Hipótesis ${hypothesisId} (${hypothesisLogs.length} logs)`}>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {hypothesisLogs.map((log, idx) => (
              <div className="border-b pb-2" key={idx}>
                <div className="text-xs text-gray-500">
                  {new Date(log.timestamp).toLocaleTimeString()} - {log.location}
                </div>
                <div className="font-semibold">{log.message}</div>
                {log.data && Object.keys(log.data).length > 0 && (
                  <pre className="text-xs mt-1 bg-gray-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Logs completos en formato JSON */}
      <Card title="Logs Completos (JSON)">
        <pre className="max-h-96 overflow-y-auto text-xs bg-gray-50 p-4 rounded">
          {JSON.stringify(logs, null, 2)}
        </pre>
      </Card>
    </div>
  );
}

































