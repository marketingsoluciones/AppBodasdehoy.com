'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface SystemHealth {
  metrics: {
    active_sessions: number;
    avg_response_time_ms: number;
    requests_per_minute: number;
  };
  services: {
    api2_graphql: string;
    ollama: string;
    redis: string;
  };
  status: string;
  timestamp: string;
  version: string;
}

const getStatusColor = (status: string | undefined) => {
  switch (status) {
    case 'ok':
    case 'healthy': {
      return 'text-green-600';
    }
    case 'degraded': {
      return 'text-yellow-600';
    }
    case 'error':
    case 'down': {
      return 'text-red-600';
    }
    default: {
      return 'text-gray-600';
    }
  }
};

export default function AdminDashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemHealth = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8030/api/health/detailed');
      if (!response.ok) throw new Error('Error al obtener health');
      const data = await response.json();
      setHealth(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30_000); // Refresh cada 30s
    return () => clearInterval(interval);
  }, [fetchSystemHealth]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">⏳</div>
          <p className="text-gray-600">Cargando estado del sistema...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">❌</div>
          <p className="text-red-600">Error: {error}</p>
          <button
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            onClick={fetchSystemHealth}
            type="button"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <p className="mt-2 text-gray-600">Monitoreo y gestión del sistema IA V2</p>
      </div>

      {/* System Health */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">Estado del Sistema</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-green-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Redis</span>
              <span className={getStatusColor(health?.services.redis)}>
                {health?.services.redis || 'unknown'}
              </span>
            </div>
          </div>
          <div className="rounded-lg bg-green-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">API2 GraphQL</span>
              <span className={getStatusColor(health?.services.api2_graphql)}>
                {health?.services.api2_graphql || 'unknown'}
              </span>
            </div>
          </div>
          <div className="rounded-lg bg-green-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Ollama</span>
              <span className={getStatusColor(health?.services.ollama)}>
                {health?.services.ollama || 'unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="text-sm text-gray-600">Sesiones Activas</div>
          <div className="mt-2 text-3xl font-bold text-blue-700">
            {health?.metrics.active_sessions || 0}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="text-sm text-gray-600">Requests/min</div>
          <div className="mt-2 text-3xl font-bold text-green-700">
            {health?.metrics.requests_per_minute || 0}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="text-sm text-gray-600">Tiempo de Respuesta</div>
          <div className="mt-2 text-3xl font-bold text-purple-700">
            {health?.metrics.avg_response_time_ms || 0}ms
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Link
          className="rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:bg-gray-50"
          href="/admin/billing"
        >
          <div className="mb-2 text-3xl">💰</div>
          <div className="font-semibold">Facturación</div>
          <div className="mt-1 text-sm text-gray-600">Costos y métricas</div>
        </Link>
        <Link
          className="rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:bg-gray-50"
          href="/admin/tests"
        >
          <div className="mb-2 text-3xl">🧪</div>
          <div className="font-semibold">Tests de Calidad</div>
          <div className="mt-1 text-sm text-gray-600">Validación IA</div>
        </Link>
        <Link
          className="rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:bg-gray-50"
          href="/admin/training"
        >
          <div className="mb-2 text-3xl">🎓</div>
          <div className="font-semibold">Entrenamiento</div>
          <div className="mt-1 text-sm text-gray-600">Q&A para IA</div>
        </Link>
        <Link
          className="rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:bg-gray-50"
          href="/admin/mcps"
        >
          <div className="mb-2 text-3xl">🔧</div>
          <div className="font-semibold">MCPs</div>
          <div className="mt-1 text-sm text-gray-600">Plugins sistema</div>
        </Link>
        <Link
          className="rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:bg-gray-50"
          href="/admin/users"
        >
          <div className="mb-2 text-3xl">👥</div>
          <div className="font-semibold">Usuarios</div>
          <div className="mt-1 text-sm text-gray-600">Gestión usuarios</div>
        </Link>
        <Link
          className="rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:bg-gray-50"
          href="/admin/sessions"
        >
          <div className="mb-2 text-3xl">🔐</div>
          <div className="font-semibold">Sesiones</div>
          <div className="mt-1 text-sm text-gray-600">Monitoreo activo</div>
        </Link>
      </div>

      {/* System Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">Información del Sistema</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600">Versión:</span>
            <span className="ml-2 font-mono text-sm font-semibold text-gray-900">
              {health?.version || 'unknown'}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-600">Estado:</span>
            <span className="ml-2 font-semibold text-green-600">{health?.status || 'unknown'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
