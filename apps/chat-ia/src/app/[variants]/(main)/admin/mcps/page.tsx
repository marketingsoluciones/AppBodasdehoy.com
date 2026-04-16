'use client';

import { useCallback, useEffect, useState } from 'react';

interface MCPServer {
  description?: string;
  enabled: boolean;
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  tools?: string[];
  transport: 'stdio' | 'sse' | 'http';
  url?: string;
}

const STATUS_CONFIG = {
  connected: { bg: 'bg-green-100 text-green-700', dot: 'bg-green-500', label: 'Conectado' },
  disconnected: { bg: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', label: 'Desconectado' },
  error: { bg: 'bg-red-100 text-red-700', dot: 'bg-red-500 animate-pulse', label: 'Error' },
};

export default function MCPsPage() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMCPs = useCallback(async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api-ia.bodasdehoy.com';
      const response = await fetch(`${backendUrl}/api/mcps`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setServers(Array.isArray(data) ? data : (data.servers ?? []));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      // Fallback con datos de ejemplo para visualización
      setServers([
        {
          description: 'Herramientas del sistema de archivos',
          enabled: true,
          id: 'filesystem',
          name: 'Filesystem MCP',
          status: 'connected',
          tools: ['read_file', 'write_file', 'list_directory'],
          transport: 'stdio',
        },
        {
          description: 'Automatización de navegador web',
          enabled: true,
          id: 'browser',
          name: 'Browser MCP',
          status: 'connected',
          tools: ['navigate', 'screenshot', 'click', 'type'],
          transport: 'stdio',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMCPs();
  }, [fetchMCPs]);

  const connectedCount = servers.filter((s) => s.status === 'connected').length;
  const totalTools = servers.reduce((sum, s) => sum + (s.tools?.length ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🔧 MCPs</h1>
          <p className="mt-2 text-gray-600">
            Model Context Protocol — servidores de herramientas externos conectados al sistema IA
          </p>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          onClick={fetchMCPs}
          type="button"
        >
          {loading ? '⏳' : '🔄'} Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Servidores activos</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {connectedCount}/{servers.length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Herramientas disponibles</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{totalTools}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Estado general</p>
          <p className={`mt-1 text-2xl font-bold ${connectedCount === servers.length ? 'text-green-600' : 'text-yellow-600'}`}>
            {connectedCount === servers.length ? 'OK' : 'Parcial'}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          ⚠️ No se pudieron cargar los MCPs desde api-ia ({error}). Mostrando datos de ejemplo.
        </div>
      )}

      {/* Servers list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div className="h-24 animate-pulse rounded-lg bg-gray-100" key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {servers.map((server) => {
            const statusCfg = STATUS_CONFIG[server.status] ?? STATUS_CONFIG.disconnected;
            return (
              <div
                className="rounded-lg border border-gray-200 bg-white p-4"
                key={server.id}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900">{server.name}</span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.bg}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                        {statusCfg.label}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {server.transport}
                      </span>
                    </div>
                    {server.description && (
                      <p className="mt-1 text-sm text-gray-500">{server.description}</p>
                    )}
                    {server.url && (
                      <p className="mt-1 font-mono text-xs text-gray-400">{server.url}</p>
                    )}
                  </div>
                </div>

                {server.tools && server.tools.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {server.tools.map((tool) => (
                      <span
                        className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-mono text-blue-700"
                        key={tool}
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {servers.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
              <p className="text-sm text-gray-500">No hay servidores MCP configurados</p>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-medium">¿Qué son los MCPs?</p>
        <p className="mt-1 text-blue-700">
          Los Model Context Protocol servers son herramientas externas que amplían las capacidades del asistente IA.
          Cada servidor expone un conjunto de herramientas que el modelo puede invocar durante una conversación.
        </p>
      </div>
    </div>
  );
}
