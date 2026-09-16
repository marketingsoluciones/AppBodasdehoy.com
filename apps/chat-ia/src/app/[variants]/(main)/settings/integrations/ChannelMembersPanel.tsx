'use client';

import { useCallback, useEffect, useState } from 'react';

import { searchPeople, resolvePersonName, type PersonSummary } from '@/services/mcpApi/users';
import {
  addWhatsAppChannelMember,
  getWhatsAppChannelMembers,
  removeWhatsAppChannelMember,
  updateWhatsAppChannelMemberRole,
  type WhatsAppChannelMember,
  type WhatsAppChannelRole,
} from '@/services/mcpApi/whatsapp';

/**
 * ChannelMembersPanel — quién del equipo tiene acceso a un número de WhatsApp.
 *
 * El modelo y las cuatro operaciones llevaban tiempo en api-mcp (`getWhatsAppChannelMembers`,
 * `add`, `updateRole`, `remove`) y el front solo llamaba a una, además con los tipos de
 * variable equivocados. Esto es lo que faltaba para poder repartir un número entre el equipo
 * sin entrar a la base de datos a mano.
 *
 * Los roles los define api-mcp y significan lo que dicen sus comentarios: ADMIN gestiona el
 * canal y sus miembros, AGENT lee y responde, READONLY solo mira.
 */

const ROLES: Array<{ label: string; value: WhatsAppChannelRole }> = [
  { label: 'Administra', value: 'ADMIN' },
  { label: 'Responde', value: 'AGENT' },
  { label: 'Solo lee', value: 'READONLY' },
];

interface ChannelMembersPanelProps {
  channelId: string;
  development: string;
}

export function ChannelMembersPanel({ channelId, development }: ChannelMembersPanelProps) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<WhatsAppChannelMember[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<PersonSummary[]>([]);
  const [role, setRole] = useState<WhatsAppChannelRole>('AGENT');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getWhatsAppChannelMembers(channelId);
      setMembers(list.filter((m) => m.isActive !== false));
      // Los miembros se guardan por id: sin resolver el nombre, el panel sería una lista
      // de identificadores y nadie sabría a quién está dando acceso.
      const pares = await Promise.all(
        list.map(async (m) => [m.userId, await resolvePersonName(m.userId)] as const),
      );
      setNames(Object.fromEntries(pares));
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setCandidates([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void searchPeople(query, development).then((r) => !cancelled && setCandidates(r));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, development]);

  const conError = async (accion: () => Promise<boolean>, quien: string, fallo: string) => {
    setBusy(quien);
    setError(null);
    const ok = await accion();
    if (ok) await load();
    else setError(fallo);
    setBusy(null);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'none',
          border: 'none',
          color: '#4F46E5',
          cursor: 'pointer',
          fontSize: 12,
          padding: 0,
        }}
        type="button"
      >
        Equipo con acceso
      </button>
    );
  }

  return (
    <div style={{ borderTop: '1px solid #EDEDF0', marginTop: 8, paddingTop: 8 }}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>Equipo con acceso</span>
        <button
          onClick={() => setOpen(false)}
          style={{ background: 'none', border: 'none', color: '#84848F', cursor: 'pointer', fontSize: 11 }}
          type="button"
        >
          Cerrar
        </button>
      </div>

      {loading && <p style={{ color: '#84848F', fontSize: 11, margin: '6px 0' }}>Cargando…</p>}

      {!loading && members.length === 0 && (
        <p style={{ color: '#84848F', fontSize: 11, margin: '6px 0' }}>
          Nadie más tiene acceso a este número todavía.
        </p>
      )}

      {members.map((m) => (
        <div
          key={m.userId}
          style={{ alignItems: 'center', display: 'flex', fontSize: 12, gap: 8, padding: '4px 0' }}
        >
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {names[m.userId] ?? m.userId}
          </span>
          <select
            disabled={busy === m.userId}
            onChange={(e) =>
              void conError(
                () =>
                  updateWhatsAppChannelMemberRole(
                    channelId,
                    m.userId,
                    e.target.value as WhatsAppChannelRole,
                  ),
                m.userId,
                'El servidor no aceptó el cambio de rol.',
              )
            }
            style={{ border: '1px solid #EDEDF0', borderRadius: 6, fontSize: 11, padding: '2px 4px' }}
            value={m.role}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <button
            disabled={busy === m.userId}
            onClick={() =>
              void conError(
                () => removeWhatsAppChannelMember(channelId, m.userId),
                m.userId,
                'El servidor no aceptó quitar el acceso.',
              )
            }
            style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: 11 }}
            type="button"
          >
            Quitar
          </button>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <input
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Añadir a alguien del equipo"
          style={{ border: '1px solid #EDEDF0', borderRadius: 6, flex: 1, fontSize: 12, padding: '4px 6px' }}
          value={query}
        />
        <select
          onChange={(e) => setRole(e.target.value as WhatsAppChannelRole)}
          style={{ border: '1px solid #EDEDF0', borderRadius: 6, fontSize: 11, padding: '2px 4px' }}
          value={role}
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {candidates.map((c) => (
        <button
          disabled={busy === c.id}
          key={c.id}
          onClick={() =>
            void conError(
              () => addWhatsAppChannelMember(channelId, c.id, role),
              c.id,
              'El servidor no aceptó dar acceso.',
            ).then(() => setQuery(''))
          }
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'block',
            fontSize: 12,
            padding: '4px 0',
            textAlign: 'left',
            width: '100%',
          }}
          type="button"
        >
          {c.name}
          {c.email ? <span style={{ color: '#84848F' }}> · {c.email}</span> : null}
        </button>
      ))}

      {error && <p style={{ color: '#DC2626', fontSize: 11, marginTop: 6 }}>{error}</p>}
    </div>
  );
}
