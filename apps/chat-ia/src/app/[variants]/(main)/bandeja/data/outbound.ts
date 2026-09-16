/**
 * data/outbound — enviar un WhatsApp nuevo y leer el resumen del propietario.
 *
 * M1, cierre (16-09). Las dos últimas llamadas que quedaban dentro de componentes.
 *
 * El envío devuelve la respuesta cruda a propósito: el modal necesita distinguir el fallo de
 * "ventana de 24 h cerrada" —que se resuelve mandando una plantilla aprobada— de cualquier
 * otro error, y para eso tiene que leer el mensaje del backend.
 */

import { buildHeaders } from '../utils/auth';

export interface SendResult {
  data: any;
  ok: boolean;
  status: number;
}

async function post(url: string, body: string): Promise<SendResult> {
  const res = await fetch(url, { body, headers: buildHeaders(), method: 'POST' });
  const data = await res.json().catch(() => ({}));
  return { data, ok: res.ok, status: res.status };
}

/** Texto libre: solo válido dentro de la ventana de 24 h de WhatsApp. */
export function sendFreeText(
  development: string,
  phoneNumber: string,
  content: string,
): Promise<SendResult> {
  return post(
    `/api/messages/whatsapp/messages/send?development=${encodeURIComponent(development)}`,
    JSON.stringify({ content, phone_number: phoneNumber }),
  );
}

/** Plantilla aprobada (HSM): lo que hay que usar fuera de la ventana de 24 h. */
export function sendTemplate(
  development: string,
  phoneNumber: string,
  template: { language?: string; name: string; parameters: string[] },
): Promise<SendResult> {
  return post(
    `/api/messages/whatsapp/messages/template?development=${encodeURIComponent(development)}`,
    JSON.stringify({
      language_code: template.language || 'es',
      parameters: template.parameters,
      phone_number: phoneNumber,
      template_name: template.name,
    }),
  );
}

/** Resumen del propietario. null si el backend no responde: mejor '…' que números inventados. */
export async function fetchOwnerSummary(
  development: string,
  ownerEmail: string,
): Promise<any | null> {
  const qs = new URLSearchParams({ development, owner_email: ownerEmail });
  try {
    const res = await fetch(`/api/backend/api/owner/summary?${qs.toString()}`, {
      headers: buildHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.success !== false ? data : null;
  } catch {
    return null;
  }
}
