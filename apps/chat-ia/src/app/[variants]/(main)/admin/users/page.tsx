'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

interface User {
  email: string;
  eventsCount: number;
  id: string;
  lastAccess: string;
  name: string;
  role: 'CREATOR' | 'SHARED_WRITE' | 'SHARED_READ' | 'GUEST';
  status: 'active' | 'suspended';
}

type SortKey = 'name' | 'role' | 'eventsCount' | 'lastAccess' | 'status';
type SortDir = 'asc' | 'desc';

const getRoleBadge = (role: string) => {
  const configs: Record<string, { color: string; label: string }> = {
    CREATOR: { color: 'bg-purple-100 text-purple-700', label: 'Creador' },
    GUEST: { color: 'bg-gray-100 text-gray-700', label: 'Invitado' },
    SHARED_READ: { color: 'bg-green-100 text-green-700', label: 'Lector' },
    SHARED_WRITE: { color: 'bg-blue-100 text-blue-700', label: 'Editor' },
  };
  const config = configs[role] || { color: 'bg-gray-100 text-gray-700', label: role };
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${config.color}`}>{config.label}</span>
  );
};

const formatLastAccess = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 60) return `Hace ${diffMins} minutos`;
  if (diffHours < 24) return `Hace ${diffHours} horas`;
  return `Hace ${diffDays} días`;
};

function SortableHeader({ label, sortKey, currentSort, currentDir, onSort, className }: {
  label: string; sortKey: SortKey; currentSort: SortKey; currentDir: SortDir;
  onSort: (key: SortKey) => void; className?: string;
}) {
  const isActive = currentSort === sortKey;
  return (
    <th
      className={`px-4 py-3 cursor-pointer hover:bg-gray-100 select-none ${className || ''}`}
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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/backend/debug/chat-users?days=30&limit=100');
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const mapped: User[] = (data.users ?? []).map((u: any) => ({
        email: u.user_id?.includes('@') ? u.user_id : '',
        eventsCount: u.total ?? 0,
        id: u.user_id ?? 'anon',
        lastAccess: u.last_seen ?? new Date().toISOString(),
        name: u.user_id?.includes('@') ? u.user_id.split('@')[0] : (u.user_id || 'anónimo'),
        role: 'CREATOR' as const,
        status: 'active' as const,
      }));
      setUsers(mapped);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) { setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); return prev; }
      setSortDir('asc');
      return key;
    });
  }, []);

  const filteredUsers = useMemo(() => {
    let result = users.filter((user) => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = !selectedRole || user.role === selectedRole;
      return matchesSearch && matchesRole;
    });
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'role': cmp = a.role.localeCompare(b.role); break;
        case 'eventsCount': cmp = a.eventsCount - b.eventsCount; break;
        case 'lastAccess': cmp = new Date(a.lastAccess).getTime() - new Date(b.lastAccess).getTime(); break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [users, searchTerm, selectedRole, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === pagedUsers.length) return new Set();
      return new Set(pagedUsers.map((u) => u.id));
    });
  }, [pagedUsers]);

  const handleBulkAction = useCallback((action: 'suspend' | 'activate') => {
    if (selectedIds.size === 0) return;
    const label = action === 'suspend' ? 'suspender' : 'activar';
    if (!confirm(`¿${label.charAt(0).toUpperCase() + label.slice(1)} ${selectedIds.size} usuario(s)?`)) return;
    setUsers((prev) => prev.map((u) => selectedIds.has(u.id) ? { ...u, status: action === 'suspend' ? 'suspended' as const : 'active' as const } : u));
    setSelectedIds(new Set());
  }, [selectedIds]);

  const handleSuspendUser = useCallback((userId: string) => {
    if (confirm('¿Estás seguro de suspender este usuario?')) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: 'suspended' as const } : u)));
    }
  }, []);

  const handleActivateUser = useCallback((userId: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: 'active' as const } : u)));
  }, []);

  const handleDeleteUser = useCallback((userId: string) => {
    if (confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  }, []);

  const handleExportCSV = useCallback(() => {
    const headers = ['Nombre', 'Email', 'Rol', 'Eventos', 'Último Acceso', 'Estado'];
    const rows = filteredUsers.map((u) => [u.name, u.email, u.role, u.eventsCount, new Date(u.lastAccess).toLocaleString('es-ES'), u.status]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredUsers]);

  const roleCounts = useMemo(() => ({
    CREATOR: users.filter((u) => u.role === 'CREATOR').length,
    GUEST: users.filter((u) => u.role === 'GUEST').length,
    SHARED_READ: users.filter((u) => u.role === 'SHARED_READ').length,
    SHARED_WRITE: users.filter((u) => u.role === 'SHARED_WRITE').length,
  }), [users]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="mt-2 text-gray-600">Administra los usuarios, roles y permisos del sistema</p>
        </div>
        <button
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          onClick={handleExportCSV}
          type="button"
        >
          Exportar CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-600">Total Usuarios</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{users.length}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4">
          <div className="text-sm text-gray-600">Creadores</div>
          <div className="mt-1 text-2xl font-bold text-purple-700">{roleCounts.CREATOR}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4">
          <div className="text-sm text-gray-600">Editores</div>
          <div className="mt-1 text-2xl font-bold text-blue-700">{roleCounts.SHARED_WRITE}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-green-50 to-green-100 p-4">
          <div className="text-sm text-gray-600">Lectores</div>
          <div className="mt-1 text-2xl font-bold text-green-700">{roleCounts.SHARED_READ}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-4">
          <div className="text-sm text-gray-600">Invitados</div>
          <div className="mt-1 text-2xl font-bold text-gray-700">{roleCounts.GUEST}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <input
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          placeholder="Buscar por nombre o email..."
          type="text"
          value={searchTerm}
        />
        <select
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
          onChange={(e) => { setSelectedRole(e.target.value); setCurrentPage(1); }}
          value={selectedRole}
        >
          <option value="">Todos los roles</option>
          <option value="CREATOR">Creador</option>
          <option value="SHARED_WRITE">Editor</option>
          <option value="SHARED_READ">Lector</option>
          <option value="GUEST">Invitado</option>
        </select>
        <button
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          onClick={() => { setSearchTerm(''); setSelectedRole(''); setCurrentPage(1); }}
          type="button"
        >
          Limpiar
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <span className="text-sm font-medium text-blue-700">{selectedIds.size} seleccionado(s)</span>
          <button
            className="rounded-lg bg-yellow-500 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-600"
            onClick={() => handleBulkAction('suspend')}
            type="button"
          >
            Suspender
          </button>
          <button
            className="rounded-lg bg-green-500 px-3 py-1 text-xs font-medium text-white hover:bg-green-600"
            onClick={() => handleBulkAction('activate')}
            type="button"
          >
            Activar
          </button>
          <button
            className="ml-auto text-xs text-gray-500 hover:text-gray-700"
            onClick={() => setSelectedIds(new Set())}
            type="button"
          >
            Deseleccionar todo
          </button>
        </div>
      )}

      {/* Demo notice */}
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
        <span>⚠️</span>
        <span>Datos de demostración. Conectar endpoint <code className="rounded bg-amber-100 px-1 text-xs">GET /api/admin/users</code> para datos reales.</span>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-4 py-3 w-10"><div className="h-4 w-4 rounded bg-gray-200" /></th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3 text-center">Eventos</th>
                <th className="px-4 py-3">Último Acceso</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  <td className="px-4 py-3"><div className="h-4 w-4 animate-pulse rounded bg-gray-200" /></td>
                  <td className="px-4 py-3"><div className="space-y-1"><div className="h-4 w-32 animate-pulse rounded bg-gray-200" /><div className="h-3 w-40 animate-pulse rounded bg-gray-100" /></div></td>
                  <td className="px-4 py-3"><div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" /></td>
                  <td className="px-4 py-3 text-center"><div className="mx-auto h-4 w-6 animate-pulse rounded bg-gray-200" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-24 animate-pulse rounded bg-gray-200" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" /></td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-2"><div className="h-6 w-16 animate-pulse rounded bg-gray-200" /><div className="h-6 w-16 animate-pulse rounded bg-gray-200" /></div></td>
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
                <th className="px-4 py-3 w-10">
                  <input
                    checked={selectedIds.size === pagedUsers.length && pagedUsers.length > 0}
                    onChange={toggleSelectAll}
                    type="checkbox"
                  />
                </th>
                <SortableHeader label="Usuario" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Rol" sortKey="role" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Eventos" sortKey="eventsCount" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="text-center" />
                <SortableHeader label="Último Acceso" sortKey="lastAccess" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Estado" sortKey="status" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((user) => (
                <tr className={`border-b hover:bg-gray-50 ${selectedIds.has(user.id) ? 'bg-blue-50' : ''}`} key={user.id}>
                  <td className="px-4 py-3">
                    <input checked={selectedIds.has(user.id)} onChange={() => toggleSelect(user.id)} type="checkbox" />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900">{user.eventsCount}</td>
                  <td className="px-4 py-3 text-gray-600">{formatLastAccess(user.lastAccess)}</td>
                  <td className="px-4 py-3">
                    {user.status === 'active' ? (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">Activo</span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">Suspendido</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {user.status === 'active' ? (
                        <button className="rounded-lg border border-yellow-300 px-2 py-1 text-xs text-yellow-600 hover:bg-yellow-50" onClick={() => handleSuspendUser(user.id)} type="button">Suspender</button>
                      ) : (
                        <button className="rounded-lg border border-green-300 px-2 py-1 text-xs text-green-600 hover:bg-green-50" onClick={() => handleActivateUser(user.id)} type="button">Activar</button>
                      )}
                      <button className="rounded-lg border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50" onClick={() => handleDeleteUser(user.id)} type="button">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-gray-500">No se encontraron usuarios con los filtros aplicados</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {(safePage - 1) * PAGE_SIZE + 1} - {Math.min(safePage * PAGE_SIZE, filteredUsers.length)} de {filteredUsers.length}
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled={safePage === 1} onClick={() => setCurrentPage((p) => p - 1)} type="button">Anterior</button>
            <span className="flex items-center px-4 text-sm text-gray-600">Página {safePage} de {totalPages}</span>
            <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled={safePage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} type="button">Siguiente</button>
          </div>
        </div>
      )}
    </div>
  );
}
