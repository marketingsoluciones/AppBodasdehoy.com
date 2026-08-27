'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { buildHeaders, getUserContext } from '../utils/auth';
import {
  templateBodyText,
  templateFillParams,
  templateParamCount,
  useWhatsAppTemplates,
} from '../hooks/useWhatsAppTemplates';

/**
 * NewMessageModal — iniciar una conversación con un contacto NUEVO (v2, multi-red).
 *
 * v1 solo hacía WhatsApp por texto libre. v2 añade:
 *  - Selector de RED (canal). Cada red usa un identificador distinto y tiene reglas propias
 *    de la PLATAFORMA sobre iniciar conversaciones (no es limitación nuestra):
 *      · WhatsApp/SMS → teléfono. WhatsApp fuera de 24h exige plantilla HSM (Meta).
 *      · Email        → dirección de email (libre).
 *      · Instagram / Telegram / Messenger → NO se puede iniciar en frío (solo responder
 *        dentro de la ventana / si el usuario inició el bot). Se muestran deshabilitados.
 *  - Envío por PLANTILLA HSM para escribir a un número fuera de la ventana de 24h.
 *
 * Nota: elegir el NÚMERO EMISOR (QR vs Meta API) requiere que api-ia acepte un param `from`
 * en el send (hoy solo {phone_number, content} → usa el número por defecto del whitelabel).
 * Cuando el backend lo soporte, aquí se añade el selector de emisor.
 *
 * El contacto es AUTÓNOMO (decisión owner): se crea como conversación y luego se vincula a
 * evento/invitado/CRM. El backend persiste la conversación al enviar.
 */
type Network = 'whatsapp' | 'sms' | 'email' | 'instagram' | 'telegram';

const NETWORKS: Array<{
  id: Network;
  label: string;
  icon: string;
  enabled: boolean;
  hint: string;
}> = [
  { enabled: true, hint: 'Teléfono con prefijo. Fuera de 24h: plantilla HSM.', icon: '💬', id: 'whatsapp', label: 'WhatsApp' },
  { enabled: false, hint: 'Próximamente (requiere canal SMS).', icon: '✉️', id: 'sms', label: 'SMS' },
  { enabled: false, hint: 'Próximamente.', icon: '📧', id: 'email', label: 'Email' },
  { enabled: false, hint: 'Instagram no permite escribir en frío: solo responder dentro de 24h.', icon: '📷', id: 'instagram', label: 'Instagram' },
  { enabled: false, hint: 'Telegram solo permite escribir a quien haya iniciado el bot.', icon: '✈️', id: 'telegram', label: 'Telegram' },
];

function normalizePhone(raw: string): string {
  return (raw || '').replaceAll(/\D/g, '');
}

export function NewMessageModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [network, setNetwork] = useState<Network>('whatsapp');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [useTemplate, setUseTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [tplParams, setTplParams] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Plantillas HSM solo cuando el usuario las pide (evita la query si no hace falta).
  const { templates, loading: tplLoading } = useWhatsAppTemplates(network === 'whatsapp' && useTemplate);

  const phoneClean = normalizePhone(phone);
  const selectedTpl = templates.find((t) => t.name === templateName);
  const tplNeeded = selectedTpl ? templateParamCount(templateBodyText(selectedTpl)) : 0;

  const canSend =
    !sending &&
    phoneClean.length >= 8 &&
    (useTemplate ? !!templateName : text.trim().length > 0);

  const netHint = NETWORKS.find((n) => n.id === network)?.hint || '';

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
    const conversationId = `${development}:${phoneClean}@s.whatsapp.net`;
    try {
      let url: string;
      let body: string;
      if (useTemplate && selectedTpl) {
        // Plantilla HSM (fuera de la ventana 24h) → endpoint de plantillas.
        url = `/api/messages/whatsapp/messages/template?development=${encodeURIComponent(development)}`;
        body = JSON.stringify({
          language_code: selectedTpl.language || 'es',
          parameters: tplParams.slice(0, tplNeeded),
          phone_number: phoneClean,
          template_name: selectedTpl.name,
        });
      } else {
        // Texto libre (solo válido dentro de la ventana de 24h) → endpoint de envío.
        url = `/api/messages/whatsapp/messages/send?development=${encodeURIComponent(development)}`;
        body = JSON.stringify({ content: text.trim(), phone_number: phoneClean });
      }
      const res = await fetch(url, { body, headers: { ...buildHeaders(), 'Content-Type': 'application/json' }, method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        const msg = data?.message || data?.error || `HTTP ${res.status}`;
        const isWindow = /24|window|template|hsm|re-?engage/i.test(String(msg));
        setError(
          isWindow && !useTemplate
            ? 'Ese número no ha escrito en 24h. Activa "Usar plantilla" y elige una plantilla aprobada (HSM).'
            : `No se pudo enviar: ${msg}`,
        );
        setSending(false);
        return;
      }
      router.push(`/bandeja/whatsapp/${encodeURIComponent(conversationId)}`);
      onClose();
    } catch (e) {
      setError(`Error de red: ${(e as Error)?.message || 'inténtalo de nuevo'}`);
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose} role="presentation">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">✍️ Nuevo mensaje</h2>
          <button aria-label="Cerrar" className="text-gray-400 hover:text-gray-600" onClick={onClose} type="button">✕</button>
        </div>

        {/* Selector de RED */}
        <div className="mb-1 text-xs font-medium text-gray-600">Red</div>
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {NETWORKS.map((n) => (
            <button
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                network === n.id
                  ? 'border-violet-400 bg-violet-50 text-violet-700'
                  : n.enabled
                    ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    : 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300'
              }`}
              disabled={!n.enabled}
              key={n.id}
              onClick={() => n.enabled && setNetwork(n.id)}
              title={n.hint}
              type="button"
            >
              <span aria-hidden>{n.icon}</span> {n.label}
            </button>
          ))}
        </div>
        <p className="mb-3 text-[11px] leading-snug text-gray-400">{netHint}</p>

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

        {/* Toggle plantilla HSM */}
        <label className="mb-2 flex items-center gap-2 text-xs text-gray-700">
          <input checked={useTemplate} onChange={(e) => setUseTemplate(e.target.checked)} type="checkbox" />
          El número no me ha escrito en 24h → usar plantilla aprobada (HSM)
        </label>

        {useTemplate ? (
          <div className="mb-3">
            <select
              className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
              onChange={(e) => { setTemplateName(e.target.value); setTplParams([]); }}
              value={templateName}
            >
              <option value="">{tplLoading ? 'Cargando plantillas…' : 'Elige una plantilla…'}</option>
              {templates.map((t) => (
                <option key={t.name} value={t.name}>{t.name} ({t.language})</option>
              ))}
            </select>
            {selectedTpl && (
              <div className="rounded-lg bg-gray-50 p-2 text-[11px] text-gray-500">
                {templateFillParams(templateBodyText(selectedTpl), tplParams) || '(sin cuerpo)'}
              </div>
            )}
            {Array.from({ length: tplNeeded }).map((_, i) => (
              <input
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-violet-400"
                key={i}
                onChange={(e) => setTplParams((p) => { const n = [...p]; n[i] = e.target.value; return n; })}
                placeholder={`Valor {{${i + 1}}}`}
                value={tplParams[i] || ''}
              />
            ))}
          </div>
        ) : (
          <textarea
            className="mb-2 h-24 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe el primer mensaje…"
            value={text}
          />
        )}

        <p className="mb-3 text-[11px] leading-snug text-gray-400">
          Se enviará desde el número WhatsApp del negocio. Se crea como conversación independiente
          (vinculable después a evento, invitado o cliente).
        </p>

        {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}

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
