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

const getStatusBg = (status: string | undefined) => {
  switch (status) {
    case 'ok':
    case 'healthy': {
      return 'bg-green-50 border-green-200';
    }
    case 'degraded': {
      return 'bg-yellow-50 border-yellow-200';
    }
    case 'error':
    case 'down': {
      return 'bg-red-50 border-red-200';
    }
    default: {
      return 'bg-gray-50 border-gray-200';
    }
  }
};

function UptimeRing({ status }: { status: string | undefined }) {
  const isHealthy = status === 'ok' || status === 'healthy';
  const color = isHealthy ? '#22c55e' : status === 'degraded' ? '#eab308' : '#ef4444';
  const pct = isHealthy ? 100 : status === 'degraded' ? 75 : 0;
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" fill="none" r="36" stroke="#e5e7eb" strokeWidth="6" />
        <circle
          className="transition-all duration-1000" cx="40" cy="40" fill="none"
          r="36" stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="6"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-bold" style={{ color }}>{pct}%</span>
        <span className="text-[10px] text-gray-500">uptime</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchSystemHealth = useCallback(async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api-ia.bodasdehoy.com';
      const response = await fetch(`${backendUrl}/api/health/detailed`);
      if (!response.ok) throw new Error('Error al obtener health');
      const data = await response.json();
      setHealth(data);
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30_000);
    return () => clearInterval(interval);
  }, [fetchSystemHealth]);

  const QUICK_LINKS = [
    { desc: 'Costos y métricas', href: '/admin/billing', icon: '💰', title: 'Facturación' },
    { desc: 'Verificar costos', href: '/admin/audit', icon: '🔍', title: 'Auditoría' },
    { desc: 'Validación IA', href: '/admin/tests', icon: '🧪', title: 'Tests de Calidad' },
    { desc: 'Q&A para IA', href: '/admin/training', icon: '🎓', title: 'Entrenamiento' },
    { desc: 'Plugins sistema', href: '/admin/mcps', icon: '🔧', title: 'MCPs' },
    { desc: 'CRM y marketing', href: '/admin/campaigns', icon: '📣', title: 'Campañas' },
    { desc: 'Gestión usuarios', href: '/admin/users', icon: '👥', title: 'Usuarios' },
    { desc: 'Monitoreo activo', href: '/admin/sessions', icon: '🔐', title: 'Sesiones' },
    { desc: 'Peticiones API', href: '/admin/debug', icon: '🐛', title: 'Debug' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="mt-2 text-gray-600">Monitoreo y gestión del sistema IA V2</p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-gray-400">
              Actualizado: {lastRefresh.toLocaleTimeString('es-ES')}
            </span>
          )}
          <button
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            onClick={fetchSystemHealth}
            type="button"
          >
            {loading ? '⏳' : '🔄'} Actualizar
          </button>
        </div>
      </div>

      {/* System Health + Uptime */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Uptime Ring */}
        <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-6">
          <div className="text-center">
            <UptimeRing status={health?.status} />
            <p className="mt-2 text-sm font-medium text-gray-700">
              {health?.status === 'healthy' || health?.status === 'ok' ? 'Sistema Operativo' : health?.status || 'Desconocido'}
            </p>
            <p className="text-xs text-gray-400">v{health?.version || '?'}</p>
          </div>
        </div>

        {/* Service Cards */}
        {[
          { key: 'redis' as const, label: 'Redis' },
          { key: 'api2_graphql' as const, label: 'API2 GraphQL' },
          { key: 'ollama' as const, label: 'Ollama' },
        ].map(({ label, key }) => (
          <div
            className={`rounded-lg border p-4 ${getStatusBg(health?.services?.[key])}`}
            key={key}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{label}</span>
              <span className={`text-sm font-semibold ${getStatusColor(health?.services?.[key])}`}>
                {health?.services?.[key] || 'unknown'}
              </span>
            </div>
            <div className="mt-3">
              <div className="h-1.5 w-full rounded-full bg-gray-200">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    health?.services?.[key] === 'ok' || health?.services?.[key] === 'healthy'
                      ? 'w-full bg-green-500'
                      : health?.services?.[key] === 'degraded'
                        ? 'w-3/4 bg-yellow-500'
                        : 'w-0 bg-red-500'
                  }`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && !loading && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <span className="text-lg">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Sin conexión con api-ia</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
          <button
            className="rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
            onClick={fetchSystemHealth}
            type="button"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-lg">👥</span>
            Sesiones Activas
          </div>
          <div className="mt-2 text-3xl font-bold text-blue-700">
            {health?.metrics?.active_sessions || 0}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-lg">📊</span>
            Requests/min
          </div>
          <div className="mt-2 text-3xl font-bold text-green-700">
            {health?.metrics?.requests_per_minute || 0}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-lg">⚡</span>
            Tiempo de Respuesta
          </div>
          <div className="mt-2 text-3xl font-bold text-purple-700">
            {health?.metrics?.avg_response_time_ms || 0}
            <span className="text-base font-normal text-gray-400">ms</span>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Acceso Rápido</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {QUICK_LINKS.map((link) => (
            <Link
              className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm"
              href={link.href}
              key={link.href}
            >
              <span className="text-2xl">{link.icon}</span>
              <div>
                <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">{link.title}</div>
                <div className="text-xs text-gray-500">{link.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* System Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Información del Sistema</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <span className="block text-xs text-gray-500">Versión</span>
            <span className="font-mono text-sm font-semibold text-gray-900">
              {health?.version || 'unknown'}
            </span>
          </div>
          <div>
            <span className="block text-xs text-gray-500">Estado General</span>
            <span className={`text-sm font-semibold ${getStatusColor(health?.status)}`}>
              {health?.status || 'unknown'}
            </span>
          </div>
          <div>
            <span className="block text-xs text-gray-500">Último Health Check</span>
            <span className="text-sm text-gray-700">
              {health?.timestamp ? new Date(health.timestamp).toLocaleString('es-ES') : '-'}
            </span>
          </div>
          <div>
            <span className="block text-xs text-gray-500">Backend URL</span>
            <span className="text-xs font-mono text-gray-500">
              {process.env.NEXT_PUBLIC_BACKEND_URL || 'api-ia.bodasdehoy.com'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
