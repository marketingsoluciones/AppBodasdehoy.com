'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLeads, type Lead, type LeadStatus, type LeadListFilters, type LeadNote } from '@/hooks/useLeads';

type SortKey = 'contact' | 'event_type' | 'status' | 'created_at';
type SortDir = 'asc' | 'desc';

const STATUS_CONFIG: Record<LeadStatus, { color: string; label: string }> = {
  contacted: { color: 'bg-yellow-100 text-yellow-700', label: 'Contactado' },
  converted: { color: 'bg-green-100 text-green-700', label: 'Convertido' },
  lost: { color: 'bg-red-100 text-red-700', label: 'Perdido' },
  new: { color: 'bg-blue-100 text-blue-700', label: 'Nuevo' },
  qualified: { color: 'bg-purple-100 text-purple-700', label: 'Cualificado' },
};

const ALL_STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'converted', 'lost'];

function StatusBadge({ status }: { status: LeadStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatRelativeDate(dateStr?: string) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return formatDate(dateStr);
}

function SortableHeader({ label, sortKey, currentSort, currentDir, onSort, className }: {
  className?: string; currentDir: SortDir; currentSort: SortKey;
  label: string; onSort: (key: SortKey) => void; sortKey: SortKey;
}) {
  const isActive = currentSort === sortKey;
  return (
    <th
      className={`px-4 py-3 cursor-pointer hover:bg-gray-100 select-none ${className || ''}`}
      onClick={() => onSort(sortKey)}
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

/** Lead detail modal/drawer */
function LeadDetailModal({ lead, onClose, onStatusChange, onAddNote }: {
  lead: Lead;
  onAddNote: (leadId: string, text: string) => Promise<void>;
  onClose: () => void;
  onStatusChange: (leadId: string, status: LeadStatus) => Promise<void>;
}) {
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    await onAddNote(lead.id, noteText.trim());
    setNoteText('');
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="relative mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {lead.contact?.name || lead.contact?.email || lead.contact?.phone || 'Lead sin nombre'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Session: {lead.session_id} | Fuente: {lead.source}
            </p>
          </div>
          <button className="text-2xl text-gray-400 hover:text-gray-600" onClick={onClose} type="button">×</button>
        </div>

        {/* Contact info */}
        <div className="mb-4 grid grid-cols-3 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div>
            <div className="text-xs text-gray-500">Nombre</div>
            <div className="font-medium">{lead.contact?.name || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Email</div>
            <div className="font-medium">{lead.contact?.email || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Teléfono</div>
            <div className="font-medium">{lead.contact?.phone || '—'}</div>
          </div>
        </div>

        {/* Qualifying data */}
        <div className="mb-4 rounded-lg border border-gray-200 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Datos de cualificación</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Tipo evento:</span> {lead.qualifying_data?.event_type || '—'}</div>
            <div><span className="text-gray-500">Fecha:</span> {lead.qualifying_data?.event_date || '—'}</div>
            <div><span className="text-gray-500">Invitados:</span> {lead.qualifying_data?.guest_count || '—'}</div>
            <div><span className="text-gray-500">Presupuesto:</span> {lead.qualifying_data?.budget || '—'}</div>
            <div><span className="text-gray-500">Ubicación:</span> {lead.qualifying_data?.location || '—'}</div>
            <div>
              <span className="text-gray-500">Servicios:</span>{' '}
              {lead.qualifying_data?.services_needed?.length
                ? lead.qualifying_data.services_needed.join(', ')
                : '—'}
            </div>
          </div>
        </div>

        {/* Status change */}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600">Estado:</span>
          {ALL_STATUSES.map((s) => (
            <button
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                lead.status === s
                  ? STATUS_CONFIG[s].color + ' ring-2 ring-offset-1 ring-gray-300'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              key={s}
              onClick={() => onStatusChange(lead.id, s)}
              type="button"
            >
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>

        {/* Notes */}
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Notas</h3>
          <div className="mb-3 max-h-48 space-y-2 overflow-y-auto">
            {(!lead.notes || lead.notes.length === 0) && (
              <p className="text-sm text-gray-400">Sin notas todavía</p>
            )}
            {lead.notes?.map((note: LeadNote, i: number) => (
              <div className="rounded-lg border bg-gray-50 p-3 text-sm" key={i}>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{note.author === 'ai' ? 'IA' : 'Admin'}</span>
                  <span>{formatDate(note.created_at)}</span>
                </div>
                <p className="mt-1 text-gray-700">{note.text}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(); } }}
              placeholder="Agregar una nota..."
              value={noteText}
            />
            <button
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={saving || !noteText.trim()}
              onClick={handleAddNote}
              type="button"
            >
              {saving ? '...' : 'Agregar'}
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className="border-t pt-3 text-xs text-gray-400">
          Creado: {formatDate(lead.created_at)} | Actualizado: {formatDate(lead.updated_at)} | ID: {lead.id}
        </div>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const { getLeads, updateLeadStatus, addLeadNote, deleteLead } = useLeads();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const PAGE_SIZE = 20;

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const filters: LeadListFilters = {
        limit: PAGE_SIZE,
        page: currentPage,
      };
      if (selectedStatus) filters.status = selectedStatus as LeadStatus;
      if (searchTerm) filters.search = searchTerm;

      const result = await getLeads(filters);
      if (result) {
        setLeads(result.leads || []);
        setTotalPages(result.total_pages || 1);
        setTotalLeads(result.total || 0);
      }
    } catch (error) {
      console.error('Error al cargar leads:', error);
    } finally {
      setLoading(false);
    }
  }, [getLeads, currentPage, selectedStatus, searchTerm]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) { setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); return prev; }
      setSortDir('asc');
      return key;
    });
  }, []);

  const sortedLeads = useMemo(() => {
    return [...leads].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'contact': {
          cmp = (a.contact?.name || a.contact?.email || '').localeCompare(b.contact?.name || b.contact?.email || '');
          break;
        }
        case 'event_type': {
          cmp = (a.qualifying_data?.event_type || '').localeCompare(b.qualifying_data?.event_type || '');
          break;
        }
        case 'status': {
          cmp = a.status.localeCompare(b.status);
          break;
        }
        case 'created_at': {
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [leads, sortKey, sortDir]);

  const handleStatusChange = useCallback(async (leadId: string, status: LeadStatus) => {
    const success = await updateLeadStatus(leadId, status);
    if (success) {
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status } : l));
      if (selectedLead?.id === leadId) {
        setSelectedLead((prev) => prev ? { ...prev, status } : null);
      }
    }
  }, [updateLeadStatus, selectedLead]);

  const handleAddNote = useCallback(async (leadId: string, text: string) => {
    const success = await addLeadNote(leadId, text);
    if (success) {
      const newNote: LeadNote = { author: 'admin', created_at: new Date().toISOString(), text };
      setLeads((prev) => prev.map((l) =>
        l.id === leadId ? { ...l, notes: [...(l.notes || []), newNote] } : l
      ));
      if (selectedLead?.id === leadId) {
        setSelectedLead((prev) => prev ? { ...prev, notes: [...(prev.notes || []), newNote] } : null);
      }
    }
  }, [addLeadNote, selectedLead]);

  const handleDeleteLead = useCallback(async (leadId: string) => {
    if (!confirm('¿Estás seguro de eliminar este lead? Esta acción no se puede deshacer.')) return;
    const success = await deleteLead(leadId);
    if (success) {
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      if (selectedLead?.id === leadId) setSelectedLead(null);
    }
  }, [deleteLead, selectedLead]);

  const handleExportCSV = useCallback(() => {
    const headers = ['Nombre', 'Email', 'Teléfono', 'Tipo Evento', 'Fecha Evento', 'Invitados', 'Presupuesto', 'Ubicación', 'Estado', 'Fuente', 'Creado'];
    const rows = leads.map((l) => [
      l.contact?.name || '',
      l.contact?.email || '',
      l.contact?.phone || '',
      l.qualifying_data?.event_type || '',
      l.qualifying_data?.event_date || '',
      l.qualifying_data?.guest_count || '',
      l.qualifying_data?.budget || '',
      l.qualifying_data?.location || '',
      STATUS_CONFIG[l.status]?.label || l.status,
      l.source,
      formatDate(l.created_at),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [leads]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { total: leads.length };
    for (const s of ALL_STATUSES) {
      counts[s] = leads.filter((l) => l.status === s).length;
    }
    return counts;
  }, [leads]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Leads</h1>
          <p className="mt-2 text-gray-600">Leads capturados desde el chatbot IA y formularios de contacto</p>
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-600">Total Leads</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{totalLeads}</div>
        </div>
        {ALL_STATUSES.map((s) => (
          <div
            className={`cursor-pointer rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-300 ${selectedStatus === s ? 'ring-2 ring-blue-400' : ''}`}
            key={s}
            onClick={() => { setSelectedStatus(selectedStatus === s ? '' : s); setCurrentPage(1); }}
          >
            <div className="text-sm text-gray-600">{STATUS_CONFIG[s].label}</div>
            <div className={`mt-1 text-2xl font-bold ${STATUS_CONFIG[s].color.split(' ')[1]}`}>
              {statusCounts[s] || 0}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <input
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          placeholder="Buscar por nombre, email o teléfono..."
          type="text"
          value={searchTerm}
        />
        <select
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
          onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
          value={selectedStatus}
        >
          <option value="">Todos los estados</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>
        <button
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          onClick={() => { setSearchTerm(''); setSelectedStatus(''); setCurrentPage(1); }}
          type="button"
        >
          Limpiar
        </button>
      </div>

      {/* Leads Table */}
      {loading ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Tipo Evento</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3 text-center">Invitados</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Creado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr className="border-b" key={i}>
                  <td className="px-4 py-3"><div className="space-y-1"><div className="h-4 w-32 animate-pulse rounded bg-gray-200" /><div className="h-3 w-40 animate-pulse rounded bg-gray-100" /></div></td>
                  <td className="px-4 py-3"><div className="h-4 w-16 animate-pulse rounded bg-gray-200" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-gray-200" /></td>
                  <td className="px-4 py-3 text-center"><div className="mx-auto h-4 w-6 animate-pulse rounded bg-gray-200" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-gray-200" /></td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-2"><div className="h-6 w-12 animate-pulse rounded bg-gray-200" /></div></td>
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
                <SortableHeader currentDir={sortDir} currentSort={sortKey} label="Contacto" onSort={handleSort} sortKey="contact" />
                <SortableHeader currentDir={sortDir} currentSort={sortKey} label="Tipo Evento" onSort={handleSort} sortKey="event_type" />
                <th className="px-4 py-3">Fecha Evento</th>
                <th className="px-4 py-3 text-center">Invitados</th>
                <SortableHeader currentDir={sortDir} currentSort={sortKey} label="Estado" onSort={handleSort} sortKey="status" />
                <SortableHeader currentDir={sortDir} currentSort={sortKey} label="Creado" onSort={handleSort} sortKey="created_at" />
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedLeads.map((lead) => (
                <tr
                  className="cursor-pointer border-b hover:bg-gray-50"
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                >
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{lead.contact?.name || '—'}</div>
                      <div className="text-xs text-gray-500">
                        {lead.contact?.email || lead.contact?.phone || '—'}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-700">
                    {lead.qualifying_data?.event_type || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {lead.qualifying_data?.event_date || '—'}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900">
                    {lead.qualifying_data?.guest_count || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatRelativeDate(lead.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="rounded-lg border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                        onClick={() => setSelectedLead(lead)}
                        type="button"
                      >
                        Ver
                      </button>
                      <button
                        className="rounded-lg border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteLead(lead.id)}
                        type="button"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {searchTerm || selectedStatus
                ? 'No se encontraron leads con los filtros aplicados'
                : 'No hay leads capturados todavía. Los leads aparecerán aquí cuando visitantes interactúen con el chatbot.'}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Página {currentPage} de {totalPages} ({totalLeads} leads)
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              type="button"
            >
              Anterior
            </button>
            <button
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              type="button"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onAddNote={handleAddNote}
          onClose={() => setSelectedLead(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
