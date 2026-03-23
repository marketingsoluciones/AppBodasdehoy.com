'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

interface Session {
  duration: number;
  id: string;
  lastActivity: string;
  messagesCount: number;
  model: string;
  provider: string;
  status: 'active' | 'idle' | 'closed';
  userEmail: string;
  userId: string;
  userName: string;
}

type SortKey = 'userName' | 'model' | 'messagesCount' | 'duration' | 'lastActivity';
type SortDir = 'asc' | 'desc';

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatLastActivity = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  return date.toLocaleString('es-ES', { day: '2-digit', hour: '2-digit', minute: '2-digit', month: '2-digit' });
};

function SortableHeader({ label, sortKey, currentSort, currentDir, onSort }: {
  currentDir: SortDir;
  currentSort: SortKey;
  label: string;
  onSort: (key: SortKey) => void;
  sortKey: SortKey;
}) {
  const isActive = currentSort === sortKey;
  return (
    <th
      className="px-4 py-3 cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => onSort(sortKey)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSort(sortKey); } }}
      role="button"
      tabIndex={0}
    >
      <span className="flex items-center gap-1">
        {label}
        {isActive && <span className="text-blue-600">{currentDir === 'asc' ? '▲' : '▼'}</span>}
      </span>
    </th>
  );
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('lastActivity');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/backend/debug/chat-events?days=7&only_real=true&limit=200');
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      // Agrupar eventos por user_id como sesiones
      const byUser: Record<string, Session> = {};
      for (const e of (data.events ?? [])) {
        const uid = e.user_id || 'anon';
        if (!byUser[uid]) {
          byUser[uid] = {
            duration: 0, id: uid,
            lastActivity: e.ts,
            messagesCount: 0, model: e.model ?? '', provider: e.provider ?? '',
            status: 'closed', userEmail: uid.includes('@') ? uid : '',
            userId: uid, userName: uid.includes('@') ? uid.split('@')[0] : uid,
          };
        }
        const s = byUser[uid];
        s.messagesCount += 1;
        if (e.ts > s.lastActivity) {
          s.lastActivity = e.ts; s.model = e.model; s.provider = e.provider;
        }
        s.duration += e.processing_time_ms ? Math.round(e.processing_time_ms / 1000) : 0;
      }
      // Estado basado en última actividad
      const now = Date.now();
      const result = Object.values(byUser).map((s) => {
        const diffMin = (now - new Date(s.lastActivity).getTime()) / 60_000;
        s.status = diffMin < 5 ? 'active' : diffMin < 30 ? 'idle' : 'closed';
        return s;
      });
      setSessions(result);
    } catch (error) {
      console.error('Error al cargar sesiones:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 30_000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) { setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); return prev; }
      setSortDir('asc');
      return key;
    });
  }, []);

  const filteredSessions = useMemo(() => {
    let result = sessions;
    if (selectedStatus) result = result.filter((s) => s.status === selectedStatus);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (s) => s.userName.toLowerCase().includes(q) || s.userEmail.toLowerCase().includes(q) || s.model.toLowerCase().includes(q),
      );
    }
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'userName': { cmp = a.userName.localeCompare(b.userName); break;
        }
        case 'model': { cmp = a.model.localeCompare(b.model); break;
        }
        case 'messagesCount': { cmp = a.messagesCount - b.messagesCount; break;
        }
        case 'duration': { cmp = a.duration - b.duration; break;
        }
        case 'lastActivity': { cmp = new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime(); break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [sessions, selectedStatus, searchTerm, sortKey, sortDir]);

  const activeSessions = useMemo(() => sessions.filter((s) => s.status === 'active'), [sessions]);
  const totalMessages = useMemo(() => sessions.reduce((sum, s) => sum + s.messagesCount, 0), [sessions]);
  const avgDuration = useMemo(
    () => sessions.length > 0 ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length : 0,
    [sessions],
  );

  const handleTerminateSession = useCallback((sessionId: string) => {
    if (confirm('¿Estás seguro de terminar esta sesión?')) {
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, status: 'closed' as const } : s)));
    }
  }, []);

  const handleExportCSV = useCallback(() => {
    const headers = ['ID', 'Usuario', 'Email', 'Modelo', 'Proveedor', 'Mensajes', 'Duración (s)', 'Estado', 'Última Actividad'];
    const rows = filteredSessions.map((s) => [
      s.id, s.userName, s.userEmail, s.model, s.provider,
      s.messagesCount, s.duration, s.status,
      new Date(s.lastActivity).toLocaleString('es-ES'),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sessions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredSessions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sesiones Activas</h1>
          <p className="mt-2 text-gray-600">Monitoreo en tiempo real de sesiones de usuario</p>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={handleExportCSV}
            type="button"
          >
            Exportar CSV
          </button>
          <button
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => fetchSessions()}
            type="button"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-600">Total Sesiones</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{sessions.length}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-green-50 to-green-100 p-4">
          <div className="text-sm text-gray-600">Activas</div>
          <div className="mt-1 text-2xl font-bold text-green-700">{activeSessions.length}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4">
          <div className="text-sm text-gray-600">Mensajes Total</div>
          <div className="mt-1 text-2xl font-bold text-blue-700">{totalMessages}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4">
          <div className="text-sm text-gray-600">Duración Promedio</div>
          <div className="mt-1 text-2xl font-bold text-purple-700">{formatDuration(avgDuration)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <input
          className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, email o modelo..."
          type="text"
          value={searchTerm}
        />
        <div className="flex gap-2">
          {[
            { label: `Todas (${sessions.length})`, value: '' },
            { label: `Activas (${activeSessions.length})`, value: 'active' },
            { label: `Inactivas (${sessions.filter((s) => s.status === 'idle').length})`, value: 'idle' },
            { label: `Cerradas (${sessions.filter((s) => s.status === 'closed').length})`, value: 'closed' },
          ].map((f) => (
            <button
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                selectedStatus === f.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              key={f.value}
              onClick={() => setSelectedStatus(f.value)}
              type="button"
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Demo notice */}
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
        <span>⚠️</span>
        <span>Datos de demostración. Conectar endpoint <code className="rounded bg-amber-100 px-1 text-xs">GET /api/admin/sessions</code> para datos reales.</span>
      </div>

      {/* Sessions Table */}
      {loading ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Modelo</th>
                <th className="px-4 py-3 text-center">Mensajes</th>
                <th className="px-4 py-3">Duración</th>
                <th className="px-4 py-3">Actividad</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 4 }).map((_, i) => (
                <tr className="border-b" key={i}>
                  <td className="px-4 py-3"><div className="space-y-1"><div className="h-4 w-28 animate-pulse rounded bg-gray-200" /><div className="h-3 w-36 animate-pulse rounded bg-gray-100" /></div></td>
                  <td className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-gray-200" /></td>
                  <td className="px-4 py-3 text-center"><div className="mx-auto h-4 w-6 animate-pulse rounded bg-gray-200" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-16 animate-pulse rounded bg-gray-200" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-24 animate-pulse rounded bg-gray-200" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-14 animate-pulse rounded-full bg-gray-200" /></td>
                  <td className="px-4 py-3"><div className="flex justify-end"><div className="h-6 w-14 animate-pulse rounded bg-gray-200" /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-4 py-3">ID Sesión</th>
                <SortableHeader currentDir={sortDir} currentSort={sortKey} label="Usuario" onSort={handleSort} sortKey="userName" />
                <SortableHeader currentDir={sortDir} currentSort={sortKey} label="Modelo" onSort={handleSort} sortKey="model" />
                <SortableHeader currentDir={sortDir} currentSort={sortKey} label="Mensajes" onSort={handleSort} sortKey="messagesCount" />
                <SortableHeader currentDir={sortDir} currentSort={sortKey} label="Duración" onSort={handleSort} sortKey="duration" />
                <SortableHeader currentDir={sortDir} currentSort={sortKey} label="Última Actividad" onSort={handleSort} sortKey="lastActivity" />
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <tr className="border-b hover:bg-gray-50" key={session.id}>
                  <td className="px-4 py-3">
                    <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">{session.id}</code>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{session.userName}</div>
                      <div className="text-xs text-gray-500">{session.userEmail}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{session.model}</div>
                      <div className="text-xs text-gray-500">{session.provider}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900">{session.messagesCount}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{formatDuration(session.duration)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatLastActivity(session.lastActivity)}</td>
                  <td className="px-4 py-3">
                    {session.status === 'active' && (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">Activa</span>
                    )}
                    {session.status === 'idle' && (
                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">Inactiva</span>
                    )}
                    {session.status === 'closed' && (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">Cerrada</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {session.status !== 'closed' && (
                        <button
                          className="rounded-lg border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          onClick={() => handleTerminateSession(session.id)}
                          type="button"
                        >
                          Terminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSessions.length === 0 && (
            <div className="p-8 text-center text-gray-500">No se encontraron sesiones con el filtro aplicado</div>
          )}
        </div>
      )}
    </div>
  );
}
