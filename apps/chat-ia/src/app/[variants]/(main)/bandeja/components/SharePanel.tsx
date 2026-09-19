'use client';

import { useEffect, useMemo, useState } from 'react';

import { useBandejaBrand } from '../utils/brand';

import {
  listTeams,
  resolvePrincipalName,
  searchPeople,
  share,
  unshare,
  type SharePermission,
  type ShareCandidate,
} from '../data/sharing';
import type { SharedPrincipal } from '../data/conversations';

/**
 * SharePanel — compartir una conversación con personas o equipos, y retirar el acceso.
 *
 * M5 (16-09). Las cuatro operaciones existían en api-mcp desde hace tiempo y el front no
 * llamaba a ninguna. Este panel es todo lo que faltaba.
 *
 * Dos decisiones que importan:
 *  - `shared_with` guarda ids, así que los nombres se resuelven al abrir. Si el backend no
 *    responde, se enseña el id: es feo, pero no mentir sobre quién tiene acceso.
 *  - Tras cada cambio se pide un refresco real de la lista en vez de tocar el estado local.
 *    Si el backend rechaza la operación, la interfaz no debe decir que se hizo.
 */

interface SharePanelProps {
  conversationId: string;
  development: string;
  onChanged: () => void;
  onClose: () => void;
  sharedWith: SharedPrincipal[];
}

const PERMISSIONS: Array<{ label: string; value: SharePermission }> = [
  { label: 'Solo ver', value: 'view' },
  { label: 'Puede responder', value: 'reply' },
];

export function SharePanel({
  conversationId,
  development,
  onChanged,
  onClose,
  sharedWith,
}: SharePanelProps) {
  const brand = useBandejaBrand();
  const [query, setQuery] = useState('');
  const [permission, setPermission] = useState<SharePermission>('view');
  const [candidates, setCandidates] = useState<ShareCandidate[]>([]);
  const [teams, setTeams] = useState<ShareCandidate[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Equipos: se piden una vez, no cambian mientras el panel está abierto.
  useEffect(() => {
    let cancelled = false;
    listTeams(development)
      .then((t) => !cancelled && setTeams(t))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [development]);

  // Nombres de quien ya tiene acceso (shared_with solo trae ids).
  useEffect(() => {
    let cancelled = false;
    const pending = sharedWith
      .map((s) => s.principalId)
      .filter((id): id is string => !!id && !(id in names));
    if (pending.length === 0) return;
    Promise.all(pending.map(async (id) => [id, await resolvePrincipalName(id)] as const)).then(
      (pairs) => {
        if (!cancelled) setNames((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [sharedWith, names]);

  // Búsqueda con espera: no una petición por tecla.
  useEffect(() => {
    if (query.trim().length < 2) {
      setCandidates([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      searchPeople(query, development)
        .then((r) => !cancelled && setCandidates(r))
        .catch(() => !cancelled && setCandidates([]));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, development]);

  const alreadyShared = useMemo(
    () => new Set(sharedWith.map((s) => s.principalId).filter(Boolean) as string[]),
    [sharedWith],
  );

  const doShare = async (candidate: ShareCandidate) => {
    setBusy(candidate.id);
    setError(null);
    try {
      const ok = await share(conversationId, candidate, permission);
      if (ok) {
        setQuery('');
        setCandidates([]);
        onChanged();
      } else setError('El servidor no aceptó la compartición.');
    } catch {
      setError('No se pudo compartir.');
    } finally {
      setBusy(null);
    }
  };

  const doUnshare = async (principalId: string) => {
    setBusy(principalId);
    setError(null);
    try {
      const ok = await unshare(conversationId, principalId);
      if (ok) onChanged();
      else setError('El servidor no aceptó quitar el acceso.');
    } catch {
      setError('No se pudo quitar el acceso.');
    } finally {
      setBusy(null);
    }
  };

  const options = query.trim().length >= 2 ? candidates : teams;

  return (
    <div
      className="absolute right-0 top-full z-20 mt-1 w-80 rounded-lg p-3"
      style={{
        backgroundColor: 'var(--b-surface)',
        border: '1px solid var(--b-border)',
        boxShadow: '0 4px 12px rgba(28,28,34,0.08)',
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: 'var(--b-text-1)' }}>
          Compartir conversación
        </span>
        <button
          aria-label="Cerrar"
          className="text-xs"
          onClick={onClose}
          style={{ color: 'var(--b-text-2)' }}
          type="button"
        >
          Cerrar
        </button>
      </div>

      {sharedWith.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-[11px] font-medium" style={{ color: 'var(--b-text-2)' }}>
            Con acceso
          </p>
          {sharedWith.map((s) => (
            <div
              className="flex items-center justify-between py-1 text-xs"
              key={s.principalId ?? Math.random()}
            >
              <span style={{ color: 'var(--b-text-1)' }}>
                {s.principalType === 'team' ? '👥 ' : ''}
                {names[s.principalId ?? ''] ?? s.principalId}
                {s.permission ? (
                  <span style={{ color: 'var(--b-text-2)' }}>
                    {' '}
                    · {s.permission === 'reply' ? 'puede responder' : 'solo ver'}
                  </span>
                ) : null}
              </span>
              <button
                className="font-semibold"
                disabled={busy === s.principalId}
                onClick={() => s.principalId && void doUnshare(s.principalId)}
                style={{ color: '#DC2626' }}
                type="button"
              >
                {busy === s.principalId ? '…' : 'Quitar'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mb-2 flex gap-1">
        {PERMISSIONS.map((p) => (
          <button
            className="flex-1 rounded-md px-2 py-1 text-[11px] font-medium"
            key={p.value}
            onClick={() => setPermission(p.value)}
            style={{
              backgroundColor: permission === p.value ? brand.brandBg : 'transparent',
              border: '1px solid var(--b-border)',
              color: permission === p.value ? brand.brand : 'var(--b-text-2)',
            }}
            type="button"
          >
            {p.label}
          </button>
        ))}
      </div>

      <input
        className="mb-2 w-full rounded-md px-2 py-1.5 text-xs outline-none"
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar persona por nombre o email"
        style={{ border: '1px solid var(--b-border)' }}
        value={query}
      />

      <div className="max-h-44 overflow-y-auto">
        {options.length === 0 && (
          <p className="py-2 text-center text-[11px]" style={{ color: 'var(--b-text-2)' }}>
            {query.trim().length >= 2 ? 'Sin resultados' : 'Escribe para buscar personas'}
          </p>
        )}
        {options.map((c) => {
          const yaTiene = alreadyShared.has(c.id);
          return (
            <button
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs"
              disabled={yaTiene || busy === c.id}
              key={`${c.type}-${c.id}`}
              onClick={() => void doShare(c)}
              style={{ color: yaTiene ? 'var(--b-text-2)' : 'var(--b-text-1)' }}
              type="button"
            >
              <span>
                {c.type === 'team' ? '👥 ' : ''}
                {c.name}
                {c.detail ? (
                  <span style={{ color: 'var(--b-text-2)' }}> · {c.detail}</span>
                ) : null}
              </span>
              <span style={{ color: brand.brand }}>
                {yaTiene ? 'ya tiene' : busy === c.id ? '…' : 'Compartir'}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-2 text-[11px]" style={{ color: '#DC2626' }}>
          {error}
        </p>
      )}
    </div>
  );
}
