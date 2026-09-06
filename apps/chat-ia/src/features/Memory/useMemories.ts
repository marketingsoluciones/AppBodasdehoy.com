'use client';

/**
 * useMemories — gestión de la memoria del usuario (api-ia).
 *
 * Habla con api-ia a través del proxy genérico /api/backend/[...path] (que
 * reenvía Authorization + X-Development). api-ia resuelve el usuario desde el
 * JWT, igual que el resto de servicios apiIa.
 *
 * Endpoints api-ia (verificados en prod, 08-jul):
 *   GET    /api/memory              → { success, memories, count, usage, cap, sku, billable }
 *   DELETE /api/memory/{id}         → { success, deleted }
 *   PATCH  /api/memory/{id} {text}  → { success }
 *   POST   /api/memory/recall {query, limit} → { success, memories }
 */
import { useCallback, useEffect, useState } from 'react';

import { buildAuthHeaders } from '@/utils/authToken';
import { getCurrentDevelopment } from '@/utils/developmentDetector';

export interface MemoryItem {
  created_at?: string;
  memory_id: string;
  source?: string;
  text: string;
}

export interface MemoryUsage {
  billable?: boolean;
  cap?: number | null;
  sku?: string | null;
  usage?: number | null;
}

export interface UseMemories {
  clearSearch: () => void;
  count: number;
  edit: (id: string, text: string) => Promise<boolean>;
  error: string | null;
  loading: boolean;
  memories: MemoryItem[];
  refresh: () => Promise<void>;
  remove: (id: string) => Promise<boolean>;
  search: (query: string) => Promise<void>;
  searchResults: MemoryItem[] | null;
  searching: boolean;
  usage: MemoryUsage;
}

const BASE = '/api/backend/api/memory';

/** userId + development desde dev-user-config (misma fuente que messages/utils/auth). */
function getMemoryUser(): { development?: string; userId?: string } {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('dev-user-config');
    if (raw) {
      const parsed = JSON.parse(raw);
      return { development: parsed?.development, userId: parsed?.userId };
    }
  } catch {
    /* ignore */
  }
  return {};
}

function memoryHeaders(): Record<string, string> {
  const { userId, development } = getMemoryUser();
  const headers: Record<string, string> = {
    ...buildAuthHeaders(),
    'Content-Type': 'application/json',
    // api-ia exige X-User-Id (no lo resuelve del JWT en /api/memory).
    'X-Development': development || getCurrentDevelopment(),
  };
  if (userId) headers['X-User-ID'] = userId;
  return headers;
}

export function useMemories(): UseMemories {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [usage, setUsage] = useState<MemoryUsage>({});
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<MemoryItem[] | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(BASE, { credentials: 'include', headers: memoryHeaders() });
      if (!res.ok) throw new Error(`No se pudo cargar la memoria (HTTP ${res.status}).`);
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || 'La memoria no está disponible.');
      setMemories(Array.isArray(data.memories) ? data.memories : []);
      setCount(typeof data.count === 'number' ? data.count : (data.memories?.length ?? 0));
      setUsage({ billable: data.billable, cap: data.cap, sku: data.sku, usage: data.usage });
    } catch (e: any) {
      setError(e?.message || 'Error al cargar la memoria.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
        credentials: 'include',
        headers: memoryHeaders(),
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`No se pudo borrar (HTTP ${res.status}).`);
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || 'No se pudo borrar el recuerdo.');
      setMemories((prev) => prev.filter((m) => m.memory_id !== id));
      setSearchResults((prev) => prev?.filter((m) => m.memory_id !== id) ?? null);
      setCount((c) => Math.max(0, c - 1));
      return true;
    } catch (e: any) {
      setError(e?.message || 'Error al borrar el recuerdo.');
      return false;
    }
  }, []);

  const edit = useCallback(async (id: string, text: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
        body: JSON.stringify({ text }),
        credentials: 'include',
        headers: memoryHeaders(),
        method: 'PATCH',
      });
      if (!res.ok) throw new Error(`No se pudo editar (HTTP ${res.status}).`);
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || 'No se pudo editar el recuerdo.');
      const patch = (m: MemoryItem) => (m.memory_id === id ? { ...m, text } : m);
      setMemories((prev) => prev.map(patch));
      setSearchResults((prev) => prev?.map(patch) ?? null);
      return true;
    } catch (e: any) {
      setError(e?.message || 'Error al editar el recuerdo.');
      return false;
    }
  }, []);

  const search = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/recall`, {
        body: JSON.stringify({ limit: 20, query: q }),
        credentials: 'include',
        headers: memoryHeaders(),
        method: 'POST',
      });
      if (!res.ok) throw new Error(`No se pudo buscar (HTTP ${res.status}).`);
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || 'La búsqueda no está disponible.');
      setSearchResults(Array.isArray(data.memories) ? data.memories : []);
    } catch (e: any) {
      setError(e?.message || 'Error al buscar en la memoria.');
    } finally {
      setSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => setSearchResults(null), []);

  return {
    clearSearch,
    count,
    edit,
    error,
    loading,
    memories,
    refresh,
    remove,
    search,
    searchResults,
    searching,
    usage,
  };
}
