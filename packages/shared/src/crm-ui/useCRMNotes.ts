'use client';

/**
 * useCRMNotes — hook universal para notas CRM.
 *
 * Multi-usuario realtime (FASE B v2.0):
 *  · Optimistic UI: mutaciones aparecen instantes antes del round trip backend.
 *  · Polling 30s con visibility-pause (no consume bateria en background).
 *  · On-focus invalidate: al volver al tab, refetch inmediato.
 *  · Listener socket.io stub: si SocketControlator está montado y backend
 *    emite `crm:entity:changed`, refetch dirigido. Stub porque api-ia
 *    aún no emite; cuando lo hagan funciona auto sin tocar este hook.
 *
 * El hook acepta UNA entidad principal (donde se crea la nota nueva por
 * defecto) + alsoShow (entidades secundarias cuyas notas también se ven).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { callMcpGraphQL } from './client';
import {
  GQL_ADD_NOTE_RELATION,
  GQL_CREATE_CRM_NOTE,
  GQL_DELETE_CRM_NOTE,
  GQL_GET_CRM_NOTES_BY_MULTIPLE_ENTITIES,
  GQL_PIN_NOTE,
  GQL_REMOVE_NOTE_RELATION,
  GQL_UNPIN_NOTE,
  GQL_UPDATE_CRM_NOTE,
} from './graphql';
import type {
  CRMEntityRef,
  CRMNote,
  CRMNoteEntityType,
  CreateCRMNoteInput,
  UpdateCRMNoteInput,
  UseCRMNotesResult,
} from './types';

const POLL_INTERVAL_MS = 30_000;

interface UseCRMNotesOptions {
  /** Entidad principal (donde se crea la nota por defecto). */
  entity: CRMEntityRef;
  /** Entidades secundarias para mostrar notas vinculadas. */
  alsoShow?: CRMEntityRef[];
  /** Polling activo (default true). false = solo carga inicial + acciones manuales. */
  enablePolling?: boolean;
  /** Listener socket activo si la app tiene SocketControlator (default true). */
  enableSocket?: boolean;
}

function entityKey(e: CRMEntityRef): string {
  return `${e.entityType}:${e.entityId}`;
}

function entitiesKey(entities: CRMEntityRef[]): string {
  return entities
    .map(entityKey)
    .sort()
    .join('|');
}

export function useCRMNotes({
  entity,
  alsoShow,
  enablePolling = true,
  enableSocket = true,
}: UseCRMNotesOptions): UseCRMNotesResult {
  const [notes, setNotes] = useState<CRMNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Entidades estables a consultar
  const entities = useMemo<CRMEntityRef[]>(
    () => [entity, ...(alsoShow ?? [])],
    // re-evaluar solo si las claves cambian (no por identidad de objeto)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entitiesKey([entity, ...(alsoShow ?? [])])],
  );

  // Cursor opaco para paginación (api-mcp usa page/limit, ajustamos)
  const pageRef = useRef(1);
  const LIMIT = 50;

  // Mantener última request para no re-renderizar con resultados viejos
  const requestIdRef = useRef(0);

  const fetchNotes = useCallback(
    async (reset: boolean = true): Promise<void> => {
      const currentRequest = ++requestIdRef.current;
      if (reset) {
        pageRef.current = 1;
        setLoading(true);
      }

      try {
        const data = await callMcpGraphQL<{
          getCRMNotesByMultipleEntities: {
            notes: CRMNote[];
            totalCount: number;
          };
        }>(GQL_GET_CRM_NOTES_BY_MULTIPLE_ENTITIES, {
          entities,
          pagination: { page: pageRef.current, limit: LIMIT },
        });

        // Resultado viejo (otro fetch ya está en curso)
        if (currentRequest !== requestIdRef.current) return;

        const result = data.getCRMNotesByMultipleEntities;
        const fetched = result?.notes ?? [];
        setNotes((prev) => (reset ? fetched : [...prev, ...fetched]));
        setHasMore(fetched.length === LIMIT && pageRef.current * LIMIT < (result.totalCount ?? 0));
        setError(null);
      } catch (e: any) {
        if (currentRequest !== requestIdRef.current) return;
        setError(e instanceof Error ? e : new Error(String(e)));
        if (reset) setNotes([]);
      } finally {
        if (currentRequest === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [entities],
  );

  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || loading) return;
    pageRef.current += 1;
    await fetchNotes(false);
  }, [fetchNotes, hasMore, loading]);

  // Carga inicial + cambio de entidad
  useEffect(() => {
    void fetchNotes(true);
  }, [fetchNotes]);

  // Polling 30s + visibility pause
  useEffect(() => {
    if (!enablePolling) return;
    if (typeof document === 'undefined') return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        if (!document.hidden) void fetchNotes(true);
      }, POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        // Volver al tab: refetch inmediato + reanudar polling.
        void fetchNotes(true);
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
  }, [enablePolling, fetchNotes]);

  // Listener socket.io para realtime universal (stub hasta que api-ia emita).
  // Si la app tiene un objeto window.__bodasdehoy_socket con .on/.off lo usamos.
  useEffect(() => {
    if (!enableSocket) return;
    if (typeof window === 'undefined') return;
    const sock: any = (window as any).__bodasdehoy_socket;
    if (!sock || typeof sock.on !== 'function') return;

    const handler = (msg: any) => {
      if (!msg || msg.entityType !== 'CRM_Note') return;
      // Solo refetch si la nota afecta a alguna de nuestras entidades.
      const affected = Array.isArray(msg.payload?.relatedTo)
        ? (msg.payload.relatedTo as CRMEntityRef[]).some((r) =>
            entities.some((e) => e.entityType === r.entityType && e.entityId === r.entityId),
          )
        : true; // sin info de relatedTo, refetch defensivo
      if (affected) void fetchNotes(true);
    };
    sock.on('crm:entity:changed', handler);
    return () => {
      if (typeof sock.off === 'function') sock.off('crm:entity:changed', handler);
    };
  }, [enableSocket, entities, fetchNotes]);

  // ──────────────────────────────────────────────────────────────────
  // Mutations con optimistic UI
  // ──────────────────────────────────────────────────────────────────

  const createNote = useCallback<UseCRMNotesResult['createNote']>(
    async (input) => {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const optimisticNote: CRMNote = {
        id: tempId,
        content: input.content,
        author: { userId: 'me', name: 'Tú' },
        relatedTo: [entity],
        tags: input.tags ?? [],
        isPrivate: input.isPrivate ?? false,
        isPinned: false,
        attachments: input.attachments ?? [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        development: 'pending',
      };
      setNotes((prev) => [optimisticNote, ...prev]);

      try {
        const fullInput: CreateCRMNoteInput = {
          content: input.content,
          relatedTo: [entity],
          tags: input.tags,
          isPrivate: input.isPrivate,
          attachments: input.attachments,
        };
        const data = await callMcpGraphQL<{ createCRMNote: { success: boolean; note: CRMNote } }>(
          GQL_CREATE_CRM_NOTE,
          { input: fullInput },
        );
        const realNote = data.createCRMNote?.note;
        if (!realNote) throw new Error('Backend no devolvió la nota creada');
        setNotes((prev) => prev.map((n) => (n.id === tempId ? realNote : n)));
        return realNote;
      } catch (e) {
        // Revertir optimistic
        setNotes((prev) => prev.filter((n) => n.id !== tempId));
        setError(e instanceof Error ? e : new Error(String(e)));
        return null;
      }
    },
    [entity],
  );

  const updateNote = useCallback<UseCRMNotesResult['updateNote']>(async (id, input) => {
    const prevNote = notes.find((n) => n.id === id);
    if (!prevNote) return null;

    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              content: input.content ?? n.content,
              tags: input.tags ?? n.tags,
              isPrivate: input.isPrivate ?? n.isPrivate,
              updatedAt: new Date().toISOString(),
            }
          : n,
      ),
    );

    try {
      const data = await callMcpGraphQL<{ updateCRMNote: { success: boolean; note: CRMNote } }>(
        GQL_UPDATE_CRM_NOTE,
        { id, input },
      );
      const real = data.updateCRMNote?.note;
      if (real) {
        setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...real } : n)));
      }
      return real ?? null;
    } catch (e) {
      // Revertir
      setNotes((prev) => prev.map((n) => (n.id === id ? prevNote : n)));
      setError(e instanceof Error ? e : new Error(String(e)));
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteNote = useCallback<UseCRMNotesResult['deleteNote']>(async (id) => {
    const prevNote = notes.find((n) => n.id === id);
    if (!prevNote) return false;

    setNotes((prev) => prev.filter((n) => n.id !== id));

    try {
      // api-mcp deleteCRMNote devuelve CRM_SimpleError { message, code }.
      // Éxito = ausencia de excepción GraphQL. `code` viene solo si es error.
      const data = await callMcpGraphQL<{ deleteCRMNote: { message: string; code?: string } }>(
        GQL_DELETE_CRM_NOTE,
        { id },
      );
      return !data.deleteCRMNote?.code;
    } catch (e) {
      // Revertir
      setNotes((prev) => [prevNote, ...prev]);
      setError(e instanceof Error ? e : new Error(String(e)));
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePin = useCallback<UseCRMNotesResult['togglePin']>(async (id) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return false;
    const willPin = !target.isPinned;

    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, isPinned: willPin } : n)));

    try {
      const mutation = willPin ? GQL_PIN_NOTE : GQL_UNPIN_NOTE;
      const data = await callMcpGraphQL<{ pinNote?: { success: boolean }; unpinNote?: { success: boolean } }>(
        mutation,
        { id },
      );
      return !!(data.pinNote?.success ?? data.unpinNote?.success);
    } catch (e) {
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, isPinned: target.isPinned } : n)));
      setError(e instanceof Error ? e : new Error(String(e)));
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addRelation = useCallback<UseCRMNotesResult['addRelation']>(async (noteId, ent) => {
    try {
      const data = await callMcpGraphQL<{ addNoteRelation: { success: boolean; note: CRMNote } }>(
        GQL_ADD_NOTE_RELATION,
        { noteId, entity: ent },
      );
      const real = data.addNoteRelation?.note;
      if (real) {
        setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, relatedTo: real.relatedTo } : n)));
      }
      return real ?? null;
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      return null;
    }
  }, []);

  const removeRelation = useCallback<UseCRMNotesResult['removeRelation']>(
    async (noteId, entityType: CRMNoteEntityType, entityId) => {
      try {
        const data = await callMcpGraphQL<{ removeNoteRelation: { success: boolean; note: CRMNote } }>(
          GQL_REMOVE_NOTE_RELATION,
          { noteId, entityType, entityId },
        );
        const real = data.removeNoteRelation?.note;
        if (real) {
          setNotes((prev) =>
            prev.map((n) => (n.id === noteId ? { ...n, relatedTo: real.relatedTo } : n)),
          );
        }
        return real ?? null;
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        return null;
      }
    },
    [],
  );

  const refetch = useCallback(async (): Promise<void> => {
    await fetchNotes(true);
  }, [fetchNotes]);

  return {
    notes,
    loading,
    error,
    hasMore,
    loadMore,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    addRelation,
    removeRelation,
    refetch,
  };
}
