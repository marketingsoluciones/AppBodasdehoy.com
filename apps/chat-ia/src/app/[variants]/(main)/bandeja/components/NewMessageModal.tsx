'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { buildHeaders, getUserContext } from '../utils/auth';

/**
 * NewMessageModal — iniciar una conversación de WhatsApp con un número NUEVO.
 *
 * Antes solo se podía RESPONDER a conversaciones existentes: el envío deriva el teléfono del
 * `conversationId` (`${dev}:${jid}`) de una conversación ya creada, así que sin conversación
 * previa no había forma de escribir a un número. El backend SÍ lo soporta:
 *   POST /api/whatsapp/messages/send      { phone_number, content }        (texto, ventana 24h / QR)
 *   POST /api/whatsapp/messages/template  { phone_number, template_name }  (HSM, inicio en frío)
 *
 * Diseño (decisión owner 26-ago): el contacto nuevo es AUTÓNOMO — se crea como conversación de
 * WhatsApp independiente (`/api/messages/internal/conversation`) y luego, desde la conversación,
 * se puede vincular a un evento/proyecto, a un invitado o a un cliente del CRM.
 *
 * Reutiliza el flujo existente: construimos `${dev}:${phone}@s.whatsapp.net` y navegamos al
 * detalle, cuyo compositor ya sabe enviar por número.
 */
function normalizePhone(raw: string): string {
  // Deja solo dígitos (WhatsApp usa el número con prefijo de país, sin +, espacios ni guiones).
  return (raw || '').replaceAll(/\D/g, '');
}

export function NewMessageModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneClean = normalizePhone(phone);
  const canSend = phoneClean.length >= 8 && text.trim().length > 0 && !sending;

  const handleSend = async () => {
    setError(null);
    const { development } = getUserContext();
    if (!development) {
      setError('No hay sesión activa (falta development).');
      return;
    }
    if (phoneClean.length < 8) {
      setError('Introduce un número con prefijo de país (ej. 34600111222).');
      return;
    }
    setSending(true);
    const jid = `${phoneClean}@s.whatsapp.net`;
    const conversationId = `${development}:${jid}`;
    try {
      // Enviar el primer mensaje por número. El backend (api-ia) PERSISTE la conversación al
      // enviar, así que aparece en la bandeja como contacto autónomo (vinculable después) — no
      // hace falta crearla aparte (internal/conversation es interno y rechaza el token de usuario).
      // El proxy /api/messages/whatsapp/messages/* enruta a api-ia (MCP ya no expone /whatsapp/messages/*).
      const res = await fetch(
        `/api/messages/whatsapp/messages/send?development=${encodeURIComponent(development)}`,
        {
          body: JSON.stringify({ content: text.trim(), phone_number: phoneClean }),
          headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
          method: 'POST',
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // Fuera de la ventana 24h (o Business API) WhatsApp exige plantilla HSM aprobada.
        const needsTemplate = res.status === 403 || body?.error === 'template_required' || body?.requiresTemplate;
        setError(
          needsTemplate
            ? 'Ese número no ha escrito en 24h: WhatsApp exige una plantilla aprobada (HSM). Ábrelo y usa "Plantilla" en el compositor.'
            : `No se pudo enviar (HTTP ${res.status}). ${body?.message || body?.error || ''}`,
        );
        setSending(false);
        return;
      }

      // 3) Ir a la conversación (el compositor del detalle ya envía por este mismo número).
      router.push(`/bandeja/whatsapp/${encodeURIComponent(conversationId)}`);
      onClose();
    } catch (e) {
      setError(`Error de red: ${(e as Error)?.message || 'inténtalo de nuevo'}`);
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">✍️ Nuevo mensaje</h2>
          <button
            aria-label="Cerrar"
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="nm-phone">
          Teléfono (con prefijo de país)
        </label>
        <input
          autoFocus
          className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
          id="nm-phone"
          inputMode="tel"
          onChange={(e) => setPhone(e.target.value)}
          placeholder="34600111222"
          value={phone}
        />

        <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="nm-name">
          Nombre del contacto <span className="text-gray-400">(opcional)</span>
        </label>
        <input
          className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
          id="nm-name"
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Verónica Castro"
          value={name}
        />

        <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="nm-text">
          Mensaje
        </label>
        <textarea
          className="mb-2 h-24 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
          id="nm-text"
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe el primer mensaje…"
          value={text}
        />

        <p className="mb-3 text-[11px] leading-snug text-gray-400">
          Se crea como conversación independiente; luego podrás vincularla a un evento, invitado o
          cliente. Si el número no te ha escrito en 24h (o usas Business API), WhatsApp exige una
          plantilla aprobada.
        </p>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
        )}

        <div className="flex justify-end gap-2">
          <button
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
            onClick={onClose}
            style={{ color: '#374151' }}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="rounded-lg bg-pink-500 px-4 py-2 text-xs font-semibold text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSend}
            onClick={handleSend}
            type="button"
          >
            {sending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}
