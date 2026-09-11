'use client';

/**
 * MemoryManager — UI de gestión de la memoria del usuario (api-ia).
 * Listar · buscar (semántica) · editar · borrar · ver consumo/plan.
 *
 * Vive en Ajustes › Avanzado (junto a Notificaciones). Estilo Tailwind
 * consistente con esa página (español hardcodeado, sin i18n plumbing).
 */
import { useState } from 'react';

import { MemoryItem, useMemories } from './useMemories';

function formatDate(value?: string): string {
  if (!value) return '';
  const d = new Date(/^\d+$/.test(value) ? Number(value) : value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function MemoryRow({
  item,
  onDelete,
  onEdit,
}: {
  item: MemoryItem;
  onDelete: (id: string) => Promise<boolean>;
  onEdit: (id: string, text: string) => Promise<boolean>;
}) {
  const [mode, setMode] = useState<'view' | 'edit' | 'confirmDelete'>('view');
  const [draft, setDraft] = useState(item.text);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!draft.trim() || draft.trim() === item.text) {
      setMode('view');
      return;
    }
    setBusy(true);
    const ok = await onEdit(item.memory_id, draft.trim());
    setBusy(false);
    if (ok) setMode('view');
  };

  const del = async () => {
    setBusy(true);
    await onDelete(item.memory_id);
    setBusy(false);
  };

  return (
    <div className="rounded-lg border border-gray-100 px-3 py-2">
      {mode === 'edit' ? (
        <div className="space-y-2">
          <textarea
            className="w-full resize-y rounded border border-gray-200 p-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none"
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            value={draft}
          />
          <div className="flex items-center gap-2">
            <button
              className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-40"
              disabled={busy}
              onClick={save}
              type="button"
            >
              Guardar
            </button>
            <button
              className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-300"
              onClick={() => {
                setDraft(item.text);
                setMode('view');
              }}
              type="button"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm text-gray-800">{item.text}</div>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-400">
              {item.source ? <span className="rounded bg-gray-100 px-1.5 py-0.5">{item.source}</span> : null}
              {formatDate(item.created_at) ? <span>{formatDate(item.created_at)}</span> : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {mode === 'confirmDelete' ? (
              <>
                <button
                  className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600 disabled:opacity-40"
                  disabled={busy}
                  onClick={del}
                  type="button"
                >
                  Confirmar
                </button>
                <button
                  className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-300"
                  onClick={() => setMode('view')}
                  type="button"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button
                  className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
                  onClick={() => {
                    setDraft(item.text);
                    setMode('edit');
                  }}
                  type="button"
                >
                  Editar
                </button>
                <button
                  className="rounded bg-gray-100 px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                  onClick={() => setMode('confirmDelete')}
                  type="button"
                >
                  Borrar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function MemoryManager() {
  const { memories, usage, count, loading, error, searching, searchResults, refresh, remove, edit, search, clearSearch } =
    useMemories();
  const [query, setQuery] = useState('');

  const list = searchResults ?? memories;
  const cap = usage.cap ?? null;
  const used = usage.usage ?? count;

  const runSearch = () => void search(query);

  return (
    <div className="space-y-3">
      {/* Consumo / plan */}
      <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
        <div>
          <div className="text-xs text-gray-500">Recuerdos guardados</div>
          <div className="text-lg font-bold text-gray-900">
            {used}
            {cap ? <span className="text-sm font-normal text-gray-400"> / {cap}</span> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {usage.sku ? <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600">{usage.sku}</span> : null}
          {usage.billable ? (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">de pago</span>
          ) : (
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">incluida</span>
          )}
        </div>
      </div>

      {/* Búsqueda semántica */}
      <div className="flex items-center gap-2">
        <input
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') runSearch();
          }}
          placeholder="Buscar en tus recuerdos por significado…"
          value={query}
        />
        <button
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
          disabled={searching || !query.trim()}
          onClick={runSearch}
          type="button"
        >
          {searching ? 'Buscando…' : 'Buscar'}
        </button>
        {searchResults ? (
          <button
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            onClick={() => {
              setQuery('');
              clearSearch();
            }}
            type="button"
          >
            Limpiar
          </button>
        ) : null}
      </div>

      {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div> : null}

      {/* Lista */}
      {loading ? (
        <div className="text-sm text-gray-400">Cargando…</div>
      ) : list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 px-3 py-6 text-center text-sm text-gray-400">
          {searchResults ? 'Sin resultados para esa búsqueda.' : 'Aún no tienes recuerdos guardados.'}
        </div>
      ) : (
        <div className="space-y-2">
          {searchResults ? (
            <div className="text-xs text-gray-400">
              {searchResults.length} resultado{searchResults.length === 1 ? '' : 's'} de búsqueda
            </div>
          ) : null}
          {list.map((m) => (
            <MemoryRow item={m} key={m.memory_id} onDelete={remove} onEdit={edit} />
          ))}
        </div>
      )}

      <div>
        <button
          className="text-xs text-gray-400 hover:text-gray-600"
          disabled={loading}
          onClick={() => void refresh()}
          type="button"
        >
          Actualizar
        </button>
      </div>
    </div>
  );
}
