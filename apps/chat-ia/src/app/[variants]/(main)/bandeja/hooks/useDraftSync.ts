/**
 * useDraftSync — sincronización de drafts del composer con api-ia (M1, 24-jun-2026).
 *
 * Endpoints api-ia (en prod 24-jun):
 *   PUT    /api/messages/conversations/{id}/draft         → guarda (TTL 24h)
 *   GET    /api/messages/conversations/{id}/draft         → lee o 404
 *   POST   /api/messages/conversations/{id}/draft/approve → envía + borra (idempotente)
 *   DELETE /api/messages/conversations/{id}/draft         → descarta
 *
 * Estrategia:
 *   1. Al montar / cambiar conversation → GET draft. Si hay → llamar onRemoteDraft
 *      con el contenido (caller decide si popular textarea o mostrar barra UI).
 *   2. Mientras el user edita → PUT debounced 1.5s (cross-device sync 24h).
 *   3. Al enviar/borrar conversación → DEL silently para limpiar.
 *
 * Fallback offline: localStorage sigue siendo la fuente local; este hook
 * NO bloquea el envío si el backend está caído.
 */
import { useEffect, useRef } from 'react';

import { buildHeaders } from '../utils/auth';

// Shape ratificado 07-jul contra api-ia:
//   PUT body → { text: string }  (Pydantic model exige `text`, no `content`)
//   GET res  → { text, iaGenerated?, iaModel?, updatedAt? }
export interface ServerDraft {
  text: string;
  iaGenerated?: boolean;
  iaModel?: string | null;
  updatedAt?: string;
}

interface UseDraftSyncOpts {
  conversationId: string;
  text: string;
  /** Si true, NO sincroniza con backend (modo nota interna por ej.). */
  disabled?: boolean;
  /** Callback al recibir draft del backend en mount (cross-device). */
  onRemoteDraft?: (draft: ServerDraft) => void;
}

const DEBOUNCE_MS = 1500;

async function fetchDraft(conversationId: string): Promise<ServerDraft | null> {
  try {
    const res = await fetch(`/api/messages/conversations/${encodeURIComponent(conversationId)}/draft`, {
      headers: buildHeaders(),
      method: 'GET',
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const json = await res.json();
    if (typeof json?.text === 'string') return json as ServerDraft;
    return null;
  } catch {
    return null;
  }
}

async function putDraft(conversationId: string, text: string): Promise<void> {
  try {
    await fetch(`/api/messages/conversations/${encodeURIComponent(conversationId)}/draft`, {
      body: JSON.stringify({ text }),
      headers: buildHeaders(),
      method: 'PUT',
    });
  } catch {
    /* offline o backend caído — fallback localStorage sigue activo */
  }
}

async function deleteDraft(conversationId: string): Promise<void> {
  try {
    await fetch(`/api/messages/conversations/${encodeURIComponent(conversationId)}/draft`, {
      headers: buildHeaders(),
      method: 'DELETE',
    });
  } catch {
    /* ignorar */
  }
}

/**
 * Aprueba el draft IA: envía el mensaje y borra el draft.
 * Devuelve true si OK, false si falló.
 */
export async function approveDraft(conversationId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/messages/conversations/${encodeURIComponent(conversationId)}/draft/approve`,
      { headers: buildHeaders(), method: 'POST' },
    );
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * FASE 4 Copilot (20-ago): "Resumir conversación" para el agente. Endpoint LIVE en api-ia
 * (verificado: {success, summary, model:gemini-2.5-flash}). NO persiste como draft (es
 * lectura, no una respuesta al cliente). Best-effort: devuelve {summary} o null sin lanzar.
 */
export async function generateSummary(
  conversationId: string,
  opts?: { instructions?: string; lastN?: number },
): Promise<{ model?: string; summary: string } | null> {
  try {
    const res = await fetch(
      `/api/messages/conversations/${encodeURIComponent(conversationId)}/summary`,
      { body: JSON.stringify(opts ?? {}), headers: buildHeaders(), method: 'POST' },
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json && typeof json.summary === 'string') return { model: json.model, summary: json.summary };
    return null;
  } catch {
    return null;
  }
}

/**
 * FASE 4 Copilot (18-ago): genera una respuesta IA sugerida para la conversación.
 * Endpoint cableado por api-ia (07-ago, "os pido cablear un botón Sugerir respuesta"):
 *   POST /api/messages/conversations/{id}/draft/generate
 *   → 200 { success, draft: { text, iaGenerated:true, iaModel } }
 * Es CONSCIENTE DEL EVENTO (usa el teléfono del cliente para resolver su evento).
 * Aditivo y best-effort (nunca 500). Devuelve el draft o null (sin lanzar).
 */
export async function generateDraft(
  conversationId: string,
  opts?: { instructions?: string; provider?: string },
): Promise<ServerDraft | null> {
  try {
    const res = await fetch(
      `/api/messages/conversations/${encodeURIComponent(conversationId)}/draft/generate`,
      { body: JSON.stringify(opts ?? {}), headers: buildHeaders(), method: 'POST' },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const draft = json?.draft ?? json;
    if (draft && typeof draft.text === 'string') return draft as ServerDraft;
    return null;
  } catch {
    return null;
  }
}

export function useDraftSync({ conversationId, text, disabled = false, onRemoteDraft }: UseDraftSyncOpts) {
  const lastSentTextRef = useRef<string>('');
  const initialLoadDoneRef = useRef<string>(''); // tracks conversationId loaded

  // 1. Cargar draft al cambiar conversación
  useEffect(() => {
    if (disabled || !conversationId) return;
    if (initialLoadDoneRef.current === conversationId) return;

    let cancelled = false;
    (async () => {
      const draft = await fetchDraft(conversationId);
      if (cancelled) return;
      initialLoadDoneRef.current = conversationId;
      if (draft && onRemoteDraft) {
        onRemoteDraft(draft);
      }
    })();

    return () => {
      cancelled = true;
    };
    // onRemoteDraft intencionalmente excluido — debe ser estable (useCallback en caller)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, disabled]);

  // 2. Auto-guardar texto debounced
  useEffect(() => {
    if (disabled || !conversationId) return;
    if (initialLoadDoneRef.current !== conversationId) return; // no PUT antes del GET inicial

    const trimmed = text.trim();
    if (trimmed === lastSentTextRef.current) return;

    const timer = setTimeout(() => {
      if (trimmed.length === 0) {
        void deleteDraft(conversationId);
      } else {
        void putDraft(conversationId, trimmed);
      }
      lastSentTextRef.current = trimmed;
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [text, conversationId, disabled]);

  // 3. Helper para borrar tras envío exitoso
  const clearDraft = async () => {
    if (!conversationId) return;
    lastSentTextRef.current = '';
    await deleteDraft(conversationId);
  };

  return { clearDraft };
}
