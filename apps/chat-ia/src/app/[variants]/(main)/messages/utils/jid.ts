// BUG-CW-N33 (QA3 reporte 23-jun BUG 3): Baileys envía contactos como JIDs.
// api-ia guardaba solo el prefijo (antes del @) en `phoneNumber` Y en
// `contactInfo.name`, así que la UI mostraba el JID de Newsletter
// "120363242494972533" como si fuera un número de teléfono real.
// 6 de 8 conversaciones en MongoDB tenían datos basura.
//
// Fix REAL va en api-ia (función parseJid + schema con jidRaw + jidType).
// Defensa front mientras: detectar patrón y mostrar etiqueta sensata
// ("Canal", "Grupo", "Status Broadcast") en lugar del número crudo.

export type JidKind = 'person' | 'newsletter' | 'group' | 'broadcast' | 'unknown';

/** Heurística: detecta el tipo de identificador a partir del valor crudo
 *  (puede ser un JID `id@domain` o solo el prefijo guardado por api-ia). */
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
 *  recibido es probablemente un JID/prefijo y no un nombre real. */
export function friendlyContactName(rawName: string | null | undefined, rawPhone?: string | null): string {
  const name = (rawName ?? '').trim();
  const phone = (rawPhone ?? '').trim();

  // Si el nombre NO parece un identificador, mostrarlo tal cual.
  // (i.e. no es solo dígitos y no contiene @)
  const looksLikeId = /^\d{8,}$/.test(name) || name.includes('@');
  if (name && !looksLikeId) return name;

  const candidate = name || phone;
  const kind = classifyJidLike(candidate);
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
 *  ni de Grupo). Útil para no mostrar un número de 18 dígitos como tel. */
export function safePhoneOrEmpty(rawPhone: string | null | undefined): string {
  const phone = (rawPhone ?? '').trim();
  if (!phone) return '';
  return classifyJidLike(phone) === 'person' ? phone : '';
}
