'use client';

/**
 * MentionAutocomplete — wrapper de textarea con autocompletado @ usuarios.
 *
 * Detecta cuando el usuario escribe `@xxx` en el textarea, busca en api-mcp
 * via `searchCRMUsers`, muestra dropdown debajo del input, y al click
 * inserta `@{name} ` reemplazando el token actual.
 *
 * Diseño P8 (handoff v2 24-jun): notas con @menciones generan notificación.
 * Esta MVP solo cubre el INPUT — la generación de notificación al persistir
 * con mentions[] queda pendiente del backend (campo no expuesto aún).
 *
 * Uso:
 *   <MentionAutocomplete value={text} onChange={setText} placeholder="..." />
 *
 * Backwards compat: textarea normal si el caller pasa enableMentions=false.
 */
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';

import { callMcpGraphQL } from './client';
import { GQL_SEARCH_CRM_USERS } from './graphql';

interface MentionedUser {
  user_id: string;
  name: string;
  email?: string | null;
}

interface MentionAutocompleteProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  /** Si false → textarea sin autocomplete. Default true. */
  enableMentions?: boolean;
  autoFocus?: boolean;
}

export function MentionAutocomplete({
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled = false,
  className = '',
  onKeyDown,
  enableMentions = true,
  autoFocus = false,
}: MentionAutocompleteProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MentionedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  /** Posición de inicio del @ actual (para reemplazar al insertar). */
  const tokenStartRef = useRef<number | null>(null);

  // Detectar @ token bajo el cursor
  const detectMention = useCallback((text: string, caret: number) => {
    if (!enableMentions) {
      setOpen(false);
      return;
    }
    // Buscar el último @ antes del caret que no esté precedido por carácter
    // alfanumérico (para no detectar emails como @gmail.com).
    let i = caret - 1;
    while (i >= 0) {
      const ch = text[i];
      if (ch === '@') {
        const before = i > 0 ? text[i - 1] : ' ';
        if (/\s/.test(before) || i === 0) {
          // Token candidato encontrado
          const token = text.slice(i + 1, caret);
          if (/^[A-Za-z0-9_.\-]*$/.test(token)) {
            tokenStartRef.current = i;
            setQuery(token);
            setOpen(true);
            return;
          }
        }
        break;
      }
      if (/\s/.test(ch)) break;
      i--;
    }
    setOpen(false);
    tokenStartRef.current = null;
  }, [enableMentions]);

  // Búsqueda debounced cuando cambia query
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await callMcpGraphQL<{
          searchCRMUsers: { users: MentionedUser[] };
        }>(GQL_SEARCH_CRM_USERS, { search: query || null, limit: 8 });
        setResults(data?.searchCRMUsers?.users ?? []);
        setActiveIdx(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [open, query]);

  const insertMention = useCallback(
    (user: MentionedUser) => {
      const ta = textareaRef.current;
      if (!ta || tokenStartRef.current === null) return;
      const start = tokenStartRef.current;
      const caret = ta.selectionEnd;
      const before = value.slice(0, start);
      const after = value.slice(caret);
      // Sanitiza el name para que sea token-friendly (sin espacios)
      const tag = user.name.replace(/\s+/g, '_');
      const next = `${before}@${tag} ${after}`;
      onChange(next);
      setOpen(false);
      tokenStartRef.current = null;
      // Reposicionar cursor al final del tag insertado
      requestAnimationFrame(() => {
        if (ta) {
          const pos = start + tag.length + 2; // @ + tag + espacio
          ta.selectionStart = ta.selectionEnd = pos;
          ta.focus();
        }
      });
    },
    [value, onChange],
  );

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    onChange(v);
    detectMention(v, e.target.selectionStart);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (open && results.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => (i + 1) % results.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => (i - 1 + results.length) % results.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(results[activeIdx]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }
    }
    onKeyDown?.(e);
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        autoFocus={autoFocus}
        className={className}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        value={value}
      />
      {open && (
        <div
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
          role="listbox"
        >
          {loading && (
            <div className="px-3 py-2 text-[11px] text-gray-400">Buscando…</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-[11px] text-gray-400">
              Sin coincidencias para @{query}
            </div>
          )}
          {!loading &&
            results.map((u, i) => (
              <button
                aria-selected={i === activeIdx}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] transition-colors ${
                  i === activeIdx ? 'bg-violet-50' : 'hover:bg-gray-50'
                }`}
                key={u.user_id}
                onMouseDown={(e) => {
                  e.preventDefault(); // evita perder focus textarea
                  insertMention(u);
                }}
                role="option"
                type="button"
              >
                <span aria-hidden className="text-base">👤</span>
                <span className="min-w-0 flex-1 truncate">
                  <span className="block truncate text-gray-800">{u.name}</span>
                  {u.email && (
                    <span className="block truncate text-[9px] text-gray-500">
                      {u.email}
                    </span>
                  )}
                </span>
                <span className="text-[9px] text-violet-600 font-semibold">
                  @
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
