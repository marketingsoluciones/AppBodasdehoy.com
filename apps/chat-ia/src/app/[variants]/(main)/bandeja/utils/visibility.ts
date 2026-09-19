/**
 * visibility — ¿quién ve esta conversación?
 *
 * Auditoría 15-09 (Problema 1): en la bandeja no había forma de saber si una conversación
 * la ve solo quien la trabaja o está compartida. El backend lo guarda desde hace tiempo
 * (`shared_with` en el modelo de api-mcp) y viaja en el payload, pero el normalizador de
 * `useConversations` se quedaba con `channelId` y `assignedUserId` y descartaba el resto,
 * así que la UI nunca llegó a verlo.
 *
 * Deliberadamente NO etiquetamos como "Privada" una conversación sin comparticiones: hoy
 * la línea del negocio es una bandeja de equipo (regla `inboxAccessClause` de api-mcp), así
 * que decir "privada" sería mentirle al usuario sobre quién puede leerla. Hasta que la
 * conversación exponga el tipo de canal (`channelInfo.type`), solo afirmamos lo que consta.
 */

export interface SharedPrincipal {
  permission?: string | null;
  principalId?: string | null;
  principalType?: string | null;
}

export interface VisibilityDescriptor {
  /** Texto corto para el chip. */
  label: string;
  /** Detalle para el title/tooltip. */
  title: string;
}

export function describeVisibility(
  sharedWith: SharedPrincipal[] | null | undefined,
): VisibilityDescriptor | null {
  if (!Array.isArray(sharedWith) || sharedWith.length === 0) return null;

  const teams = sharedWith.filter((s) => s?.principalType === 'team').length;
  const users = sharedWith.length - teams;

  if (teams > 0 && users === 0) {
    return {
      label: teams === 1 ? 'Equipo' : `${teams} equipos`,
      title: `Compartida con ${teams} equipo${teams === 1 ? '' : 's'}`,
    };
  }

  const label = `Compartida · ${sharedWith.length}`;
  const detalle = [
    users > 0 ? `${users} usuario${users === 1 ? '' : 's'}` : null,
    teams > 0 ? `${teams} equipo${teams === 1 ? '' : 's'}` : null,
  ]
    .filter(Boolean)
    .join(' y ');

  return { label, title: `Compartida con ${detalle}` };
}

/** Normaliza el campo tal y como llega de api-ia (snake) o de api-mcp (camel). */
export function readSharedWith(raw: any): SharedPrincipal[] {
  const list = raw?.shared_with ?? raw?.sharedWith;
  if (!Array.isArray(list)) return [];
  return list.map((s: any) => ({
    permission: s?.permission ?? null,
    principalId: s?.principal_id ?? s?.principalId ?? null,
    principalType: s?.principal_type ?? s?.principalType ?? null,
  }));
}
