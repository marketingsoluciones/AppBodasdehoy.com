// BUG-CW-N33 (QA3 reporte 23-jun BUG 3): Baileys envía contactos como JIDs.
//
// FIX REAL EN PROD: api-mcp commit 7d52fec (25-jun) añadió campos jidType +
// jidRaw al schema WhatsAppConversation. Cuando los recibimos, usamos el
// valor del backend en lugar de adivinar.
//
// La heurística antigua se mantiene como FALLBACK para:
//   · Conversaciones legacy en BD que aún no fueron normalizadas
//   · Otros canales que no expongan jidType (no-WhatsApp)

export type JidKind = 'person' | 'newsletter' | 'group' | 'broadcast' | 'unknown';

/** Normaliza el jidType crudo de api-mcp a nuestro JidKind interno.
 *  api-mcp devuelve: user | group | newsletter | broadcast | lid | unknown. */
export function jidTypeToKind(jidType: string | null | undefined): JidKind {
  if (!jidType) return 'unknown';
  const v = String(jidType).toLowerCase().trim();
  if (v === 'user' || v === 'lid') return 'person';
  if (v === 'newsletter') return 'newsletter';
  if (v === 'group') return 'group';
  if (v === 'broadcast') return 'broadcast';
  return 'unknown';
}

/** Heurística legacy: detecta el tipo a partir del valor crudo.
 *  Solo se usa cuando jidType del backend no está disponible. */
export function classifyJidLike(raw: string | null | undefined): JidKind {
  if (!raw) return 'unknown';
  const v = String(raw).trim();

  // Caso 1: viene con dominio @ explícito
  if (v.includes('@')) {
    const [, domain = ''] = v.split('@');
    const d = domain.toLowerCase();
    if (d === 's.whatsapp.net' || d === 'c.us') return 'person';
    if (d === 'newsletter') return 'newsletter';
    if (d === 'g.us') return 'group';
    if (d === 'broadcast') return 'broadcast';
    return 'unknown';
  }

  // Caso 2: solo el prefijo (lo que api-ia guarda actualmente)
  if (v === 'status') return 'broadcast';
  if (/^\d{18,20}$/.test(v)) return 'newsletter'; // JIDs Newsletter son 18-20 dígitos
  if (/^\d{8,15}$/.test(v)) return 'person';      // teléfono internacional E.164
  return 'unknown';
}

/** Devuelve un nombre amigable a mostrar al usuario cuando el campo
 *  recibido es probablemente un JID/prefijo y no un nombre real.
 *
 *  Si `jidType` viene del backend (api-mcp 7d52fec) lo usamos como
 *  fuente de verdad. Si no, heurística legacy sobre el rawPhone. */
export function friendlyContactName(
  rawName: string | null | undefined,
  rawPhone?: string | null,
  jidType?: string | null,
): string {
  const name = (rawName ?? '').trim();
  const phone = (rawPhone ?? '').trim();

  // Si el nombre NO parece un identificador, mostrarlo tal cual.
  // (i.e. no es solo dígitos y no contiene @)
  const looksLikeId = /^\d{8,}$/.test(name) || name.includes('@');
  if (name && !looksLikeId) return name;

  // Si backend nos dio jidType, lo usamos directo. Si no, heurística.
  const candidate = name || phone;
  const kind = jidType ? jidTypeToKind(jidType) : classifyJidLike(candidate);
  switch (kind) {
    case 'newsletter':
      return `Canal ${(candidate || '').replace(/@.*$/, '').slice(-6)}`;
    case 'group':
      return `Grupo ${(candidate || '').replace(/@.*$/, '').slice(-6)}`;
    case 'broadcast':
      return 'Status Broadcast';
    case 'person': {
      const digits = (candidate || '').replace(/@.*$/, '');
      return digits ? `+${digits}` : 'Desconocido';
    }
    default:
      return name || phone || 'Desconocido';
  }
}

/** Devuelve el teléfono solo si es realmente un teléfono (no JID de Newsletter
 *  ni de Grupo). Si `jidType` viene del backend, fuente de verdad. */
export function safePhoneOrEmpty(
  rawPhone: string | null | undefined,
  jidType?: string | null,
): string {
  const phone = (rawPhone ?? '').trim();
  if (!phone) return '';
  const kind = jidType ? jidTypeToKind(jidType) : classifyJidLike(phone);
  return kind === 'person' ? phone : '';
}
