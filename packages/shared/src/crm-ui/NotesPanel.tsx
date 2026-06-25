'use client';

/**
 * NotesPanel — componente universal de notas CRM.
 *
 * Pintar en cualquier módulo donde tengas una entidad (contacto, evento,
 * tarea, gasto, invitado, conversación):
 *
 *   <NotesPanel
 *     entity={{ entityType: 'CONTACT', entityId: 'abc', entityName: 'Ana García' }}
 *     alsoShow={[{ entityType: 'EVENTO', entityId: 'evt_xyz', entityName: 'Boda Isabel & Raúl' }]}
 *   />
 *
 * El usuario crea notas que se vinculan a `entity` por defecto. La lista
 * muestra notas de entity + alsoShow (todas mezcladas, ordenadas por
 * pinned + createdAt desc).
 */

import React, { useCallback, useMemo, useState } from 'react';

import { MentionAutocomplete } from './MentionAutocomplete';
import { useCRMNotes } from './useCRMNotes';
import type { CRMNote, NotesPanelProps } from './types';

const cn = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' ');

function formatRelativeTime(iso: string): string {
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    if (diffMins < 1) return 'ahora';
    if (diffMins < 60) return `${diffMins}min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  } catch {
    return '—';
  }
}

function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

interface NoteItemProps {
  note: CRMNote;
  readOnly: boolean;
  onUpdate: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onTogglePin: (id: string) => Promise<void>;
  enableMentions: boolean;
  enableTags: boolean;
  compact: boolean;
}

function NoteItem({ note, readOnly, onUpdate, onDelete, onTogglePin, compact }: NoteItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    if (!draft.trim() || draft === note.content) {
      setEditing(false);
      setDraft(note.content);
      return;
    }
    setBusy(true);
    await onUpdate(note.id, draft.trim());
    setBusy(false);
    setEditing(false);
  };

  return (
    <div
      className={cn(
        'group rounded-lg border bg-white transition-shadow hover:shadow-sm',
        compact ? 'p-2' : 'p-3',
        note.isPinned ? 'border-gray-200' : 'border-gray-200',
      )}
      // P12 Diseño 24-jun: nota pinneada usa colores Tailwind amber-50/500/700
      // mapeados a los exactos #FFFBEB / #F59E0B / #B45309 vía style inline
      // para no depender del config de Tailwind del consumidor.
      style={
        note.isPinned
          ? { backgroundColor: '#FFFBEB', borderLeft: '3px solid #F59E0B' }
          : undefined
      }
    >
      <div className="flex items-start gap-2">
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-rose-500 text-white',
            compact ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs',
            'font-semibold',
          )}
          title={note.author.name}
        >
          {getInitials(note.author.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className={cn('truncate font-medium text-gray-800', compact ? 'text-xs' : 'text-sm')}>
              {note.author.name}
            </span>
            <span className={cn('shrink-0 text-gray-400', compact ? 'text-[9px]' : 'text-[10px]')}>
              {formatRelativeTime(note.createdAt)}
              {note.updatedAt && note.updatedAt !== note.createdAt && ' · editada'}
              {note.isPinned && (
                <span style={{ color: '#B45309' }} title="Nota fijada"> · 📌</span>
              )}
              {note.isPrivate && ' · 🔒'}
            </span>
          </div>

          {editing ? (
            <div className="mt-1 flex flex-col gap-1">
              <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setEditing(false);
                    setDraft(note.content);
                  }
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    void handleSave();
                  }
                }}
                disabled={busy}
                rows={3}
                className={cn(
                  'w-full resize-none rounded border border-gray-300 px-2 py-1 outline-none focus:border-violet-500',
                  compact ? 'text-xs' : 'text-sm',
                )}
              />
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setDraft(note.content);
                  }}
                  disabled={busy}
                  className="rounded px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={busy || !draft.trim()}
                  className="rounded bg-violet-600 px-2 py-0.5 text-xs text-white hover:bg-violet-700 disabled:opacity-50"
                >
                  {busy ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : (
            <p
              className={cn(
                'mt-0.5 whitespace-pre-wrap break-words text-gray-700',
                compact ? 'text-xs' : 'text-sm',
              )}
            >
              {renderContentWithMentions(note.content)}
            </p>
          )}

          {note.tags.length > 0 && !editing && (
            <div className="mt-1 flex flex-wrap gap-1">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    'rounded-full bg-violet-100 text-violet-700',
                    compact ? 'px-1.5 py-0 text-[9px]' : 'px-2 py-0.5 text-[10px]',
                  )}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {!readOnly && !editing && (
          <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => void onTogglePin(note.id)}
              title={note.isPinned ? 'Desfijar nota' : 'Fijar nota'}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-amber-600"
            >
              {note.isPinned ? '📌' : '📍'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              title="Editar"
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-violet-600"
            >
              ✎
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('¿Borrar esta nota?')) void onDelete(note.id);
              }}
              title="Borrar"
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-rose-600"
            >
              🗑
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function NotesPanel({
  entity,
  alsoShow,
  title = 'Notas internas',
  enableMentions = true,
  enableTags = true,
  enableAttachments = false,
  readOnly = false,
  onChange,
  compact = false,
}: NotesPanelProps) {
  const {
    notes,
    loading,
    error,
    hasMore,
    loadMore,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
  } = useCRMNotes({ entity, alsoShow });

  const [draft, setDraft] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [tagsInput, setTagsInput] = useState('');
  const [busy, setBusy] = useState(false);

  // Ordenar: pinneadas primero, después por fecha desc
  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notes]);

  const handleCreate = useCallback(async () => {
    const content = draft.trim();
    if (!content) return;
    setBusy(true);
    const tags = enableTags && tagsInput
      ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      : [];
    const note = await createNote({ content, tags, isPrivate });
    if (note) {
      setDraft('');
      setTagsInput('');
      onChange?.(note, 'create');
    }
    setBusy(false);
  }, [draft, tagsInput, isPrivate, enableTags, createNote, onChange]);

  const handleUpdate = useCallback(
    async (id: string, content: string) => {
      const note = await updateNote(id, { content });
      if (note) onChange?.(note, 'update');
    },
    [updateNote, onChange],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const ok = await deleteNote(id);
      if (ok) {
        const removed = notes.find((n) => n.id === id);
        if (removed) onChange?.(removed, 'delete');
      }
    },
    [deleteNote, onChange, notes],
  );

  // P12 Diseño 24-jun: máx 3 notas pinned por entidad. Si se supera, aviso inline.
  const MAX_PINNED = 3;
  const [pinLimitWarning, setPinLimitWarning] = useState(false);
  const pinnedCount = useMemo(() => notes.filter((n) => n.isPinned).length, [notes]);

  const handleTogglePin = useCallback(
    async (id: string) => {
      const target = notes.find((n) => n.id === id);
      if (!target) return;
      // Si NO está pinneada y ya hay 3 → mostrar aviso y no llamar al backend.
      if (!target.isPinned && pinnedCount >= MAX_PINNED) {
        setPinLimitWarning(true);
        setTimeout(() => setPinLimitWarning(false), 4000);
        return;
      }
      const ok = await togglePin(id);
      if (ok && target) onChange?.(target, target.isPinned ? 'unpin' : 'pin');
    },
    [togglePin, onChange, notes, pinnedCount],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between border-b border-gray-200',
          compact ? 'px-2 py-1.5' : 'px-3 py-2',
        )}
      >
        <h3 className={cn('font-semibold text-gray-700', compact ? 'text-xs' : 'text-sm')}>
          {title}
          {notes.length > 0 && (
            <span className={cn('ml-1 font-normal text-gray-400', compact ? 'text-[10px]' : 'text-xs')}>
              ({notes.length})
            </span>
          )}
        </h3>
        {loading && <span className="text-[10px] text-gray-400">Cargando…</span>}
      </div>

      {/* Lista */}
      <div
        className={cn(
          'flex-1 space-y-2 overflow-y-auto',
          compact ? 'p-2' : 'p-3',
        )}
      >
        {error && (
          <div className="rounded border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
            Error: {error.message}
          </div>
        )}

        {pinLimitWarning && (
          <div
            className="rounded p-2 text-xs"
            style={{ backgroundColor: '#FFFBEB', borderLeft: '3px solid #F59E0B', color: '#B45309' }}
            role="alert"
          >
            Ya tienes {MAX_PINNED} notas fijadas. Desclava una para fijar esta.
          </div>
        )}

        {!loading && sortedNotes.length === 0 && !error && (
          <div className="py-8 text-center text-xs text-gray-400">
            Aún no hay notas.
            {!readOnly && <div className="mt-1">Escribe la primera abajo.</div>}
          </div>
        )}

        {sortedNotes.map((note) => (
          <NoteItem
            key={note.id}
            note={note}
            readOnly={readOnly}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onTogglePin={handleTogglePin}
            enableMentions={enableMentions}
            enableTags={enableTags}
            compact={compact}
          />
        ))}

        {hasMore && (
          <button
            type="button"
            onClick={() => void loadMore()}
            className="w-full rounded border border-gray-200 py-1 text-xs text-gray-500 hover:bg-gray-50"
          >
            Cargar más
          </button>
        )}
      </div>

      {/* Composer */}
      {!readOnly && (
        <div
          className={cn(
            'border-t border-gray-200 bg-white',
            compact ? 'p-2' : 'p-3',
          )}
        >
          <MentionAutocomplete
            value={draft}
            onChange={setDraft}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                void handleCreate();
              }
            }}
            placeholder={
              enableMentions
                ? 'Escribe una nota interna… (usa @ para mencionar)'
                : 'Escribe una nota interna…'
            }
            disabled={busy}
            rows={compact ? 2 : 3}
            enableMentions={enableMentions}
            className={cn(
              'w-full resize-none rounded border border-gray-300 px-2 py-1 outline-none focus:border-violet-500',
              compact ? 'text-xs' : 'text-sm',
            )}
          />
          {enableTags && (
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="tags separados por comas (opcional)"
              disabled={busy}
              className={cn(
                'mt-1 w-full rounded border border-gray-200 px-2 py-0.5 outline-none focus:border-violet-500',
                compact ? 'text-[10px]' : 'text-xs',
              )}
            />
          )}
          <div className="mt-1 flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-1 text-[10px] text-gray-500">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                disabled={busy}
                className="cursor-pointer"
              />
              🔒 privada
            </label>
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={busy || !draft.trim()}
              className={cn(
                'rounded bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50',
                compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
              )}
            >
              {busy ? 'Guardando…' : 'Añadir nota'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Render del content con @menciones coloreadas (Diseño P8 24-jun).
 * Detecta tokens "@palabra" (alfanumérico + _ + - + .) y los pinta
 * en azul #2563EB. Resto del texto en gris.
 *
 * Limitación MVP: extracción por regex. Sin tooltip con datos del user.
 * Cuando api-mcp añada `mentions: [ID!]` al CRM_Note schema, switch a
 * resolver el userId real + tooltip.
 */
function renderContentWithMentions(content: string): React.ReactNode {
  if (!content) return null;
  const parts = content.split(/(@[A-Za-z0-9_.\-]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return (
        <span key={i} style={{ color: '#2563EB', fontWeight: 600 }}>
          {part}
        </span>
      );
    }
    // Plain text part — span sin estilo para mantener key uniforme
    return <span key={i}>{part}</span>;
  });
}

/**
 * Extrae menciones (@palabra) del content para guardar en
 * metadata.mentions del CRM_Note. Devuelve array sin duplicados.
 * Exported para uso desde callers que crean/editan notas.
 */
export function extractMentionsFromContent(content: string): string[] {
  if (!content) return [];
  const matches = content.match(/@[A-Za-z0-9_.\-]+/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(1)))];
}
