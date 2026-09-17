import type { NextApiRequest, NextApiResponse } from 'next';

import { resolveApiBodasOrigin } from '../../../utils/apiEndpoints';

/**
 * POST /api/public/rsvp-confirm
 *
 * Guarda la confirmación del invitado desde el portal público (el enlace personal
 * que comparte el anfitrión). Sustituye la llamada directa a `agregarInvitadosBatch`
 * desde el navegador, que fallaba SIEMPRE con "Usuario no autenticado": esa mutación
 * exige sesión de usuario y el invitado no la tiene ni debe tenerla.
 *
 * api-mcp expone `confirmarAsistenciaPublica` (entregada 17-09), que hace UPSERT por
 * `_id` y solo permite tocar asistencia / nombre_menu / alergenos. Requiere una
 * CREDENCIAL DE SERVICIO, y por eso esta llamada tiene que vivir en el servidor: la
 * clave no puede bajar al navegador.
 *
 * ── Qué autoriza qué ────────────────────────────────────────────────────────────
 * La autoridad es el TOKEN del enlace, no lo que manda el cliente. El navegador
 * podría enviar cualquier `_id` y cualquier `evento_id`; aquí se ignoran ambos:
 *   1. el token se resuelve contra `getPGuestEvent` (la misma vía que usa
 *      /api/public/rsvp-guest para pintar el formulario),
 *   2. de ahí sale el `evento_id` REAL y la lista de invitados que ese enlace puede
 *      tocar (el invitado principal y sus acompañantes),
 *   3. se descarta todo lo que no esté en esa lista.
 * Sin este filtro, la ruta dejaría confirmar invitados de cualquier evento a quien
 * supiera adivinar un ObjectId.
 *
 * Body:  { p: string (token del enlace), invitados: any[] }
 * Resp:  { success: boolean, processed?: number, error?: string }
 */

const GET_PGUEST = `
  query($p: String) {
    getPGuestEvent(p: $p) {
      _id
      invitados { id nombre }
    }
  }
`;

const CONFIRMAR = `
  mutation($evento_id: ID!, $invitados: [JSON!]!) {
    confirmarAsistenciaPublica(evento_id: $evento_id, invitados: $invitados) {
      success
      processed
      errors { field message code }
    }
  }
`;

/** Campos que el invitado puede cambiar. Cualquier otro se descarta aquí también. */
const CAMPOS_PERMITIDOS = new Set([
  '_id',
  'father',
  'nombre',        // solo se usa al CREAR un acompañante nuevo
  'grupo_edad',    // idem
  'sexo',          // idem
  'asistencia',
  'nombre_menu',
  'alergenos',
]);

function graphql(query: string, variables: any, conClaveServicio: boolean) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Next.js-Server/rsvp-confirm',
  };
  if (conClaveServicio) {
    const support = process.env.SUPPORT_KEY_BODASDEHOY || process.env.SUPPORT_SECRET_KEY;
    const internal = process.env.INTERNAL_SECRET;
    if (support) headers['X-Support-Key'] = support;
    else if (internal) headers['X-Internal-Secret'] = internal;
  }
  return fetch(`${resolveApiBodasOrigin()}/graphql`, {
    body: JSON.stringify({ query, variables }),
    headers,
    method: 'POST',
    signal: AbortSignal.timeout(20_000),
  }).then((r) => r.json());
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed', success: false });
  }

  const token = typeof req.body?.p === 'string' ? req.body.p : '';
  const entrantes: any[] = Array.isArray(req.body?.invitados) ? req.body.invitados : [];

  if (!token || token.length < 4) {
    return res.status(400).json({ error: 'Enlace no válido.', success: false });
  }
  if (entrantes.length === 0) {
    return res.status(400).json({ error: 'No hay nada que guardar.', success: false });
  }

  try {
    // 1 · El token manda: de él salen el evento y los invitados que puede tocar.
    const previo = await graphql(GET_PGUEST, { p: token }, false);
    const guestEvent = previo?.data?.getPGuestEvent;
    const eventoId: string | undefined = guestEvent?._id;
    const permitidos = new Set<string>(
      (guestEvent?.invitados || []).map((g: any) => String(g?.id)).filter(Boolean),
    );

    if (!eventoId || permitidos.size === 0) {
      return res.status(404).json({ error: 'Enlace no válido o caducado.', success: false });
    }

    // 2 · Quedarse solo con lo que este enlace puede modificar.
    const saneados = entrantes
      .filter((inv) => {
        const id = inv?._id ? String(inv._id) : '';
        if (id) return permitidos.has(id);          // actualización: debe ser suyo
        return permitidos.has(String(inv?.father));  // acompañante nuevo del titular
      })
      .map((inv) =>
        Object.fromEntries(Object.entries(inv).filter(([k]) => CAMPOS_PERMITIDOS.has(k))),
      );

    if (saneados.length === 0) {
      return res
        .status(403)
        .json({ error: 'Ese invitado no corresponde a este enlace.', success: false });
    }

    // 3 · Guardar con credencial de servicio (nunca expuesta al navegador).
    const r = await graphql(CONFIRMAR, { evento_id: eventoId, invitados: saneados }, true);
    const payload = r?.data?.confirmarAsistenciaPublica;

    if (!payload?.success) {
      const motivo =
        payload?.errors?.[0]?.message || r?.errors?.[0]?.message || 'No se pudo guardar.';
      // El detalle va al log del servidor; al invitado solo el motivo legible.
      console.error('[rsvp-confirm] backend rechazó el guardado:', JSON.stringify(r)?.slice(0, 400));
      return res.status(502).json({ error: motivo, success: false });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ processed: payload.processed ?? saneados.length, success: true });
  } catch (error: any) {
    console.error('[rsvp-confirm] error:', error?.message);
    return res
      .status(502)
      .json({ error: 'No se pudo guardar tu confirmación. Inténtalo de nuevo.', success: false });
  }
}
