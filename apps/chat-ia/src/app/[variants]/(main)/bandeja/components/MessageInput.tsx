'use client';

import type { KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { useMessages } from '../hooks/useMessages';
import { useSendMessage } from '../hooks/useSendMessage';
import { approveDraft, generateDraft, useDraftSync, type ServerDraft } from '../hooks/useDraftSync';
import { useConversations } from '../hooks/useConversations';
import {
  isWhatsAppWindowExpired,
  templateBodyText,
  type WhatsAppTemplate,
} from '../hooks/useWhatsAppTemplates';
import { WhatsAppTemplatePicker } from './WhatsAppTemplatePicker';
import { EmojiPicker } from './EmojiPicker';
import { MiniMarkdown } from './MiniMarkdown';
import { useBandejaBrand } from '../utils/brand';

/**
 * Compara body original de la template (con `{{1}}`, `{{2}}`) contra el body ya
 * rellenado por el picker (con textos sustituidos), y extrae los valores en
 * orden posicional que Meta HSM espera en `parameters: string[]`.
 *
 * Uso: cuando el picker devuelve `filled = templateFillParams(body, values)`,
 * el `filled` puede contener los valores del user pero perdimos el array. Este
 * helper reconstruye el array desde el body original + el body rellenado.
 */
function extractHsmParamsFromFilledBody(filled: string, tpl: WhatsAppTemplate): string[] {
  const raw = templateBodyText(tpl);
  if (!raw) return [];
  // Detecta el nº máximo de placeholders en el raw
  let max = 0;
  const re = /{{\s*(\d+)\s*}}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > max) max = n;
  }
  if (max === 0) return [];
  // Reconstruye regex del raw como capturas
  const escaped = raw.replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&');
  const pattern = escaped.replaceAll(/\\{\\{\s*\d+\s*\\}\\}/g, '(.*?)');
  const captureRe = new RegExp('^' + pattern + '$', 's');
  const match = filled.match(captureRe);
  if (!match) return Array.from({ length: max }, (_, i) => `{{${i + 1}}}`);
  // match[1..N] son las capturas en el orden que aparecen en el body raw,
  // NO en el orden posicional 1..N. Necesitamos mapear.
  const raw2 = raw;
  const order: number[] = [];
  const re2 = /{{\s*(\d+)\s*}}/g;
  let m2: RegExpExecArray | null;
  while ((m2 = re2.exec(raw2)) !== null) order.push(Number(m2[1]));
  const out: string[] = Array.from({ length: max }, () => '');
  order.forEach((paramIdx, capIdx) => {
    const val = match[capIdx + 1] ?? '';
    if (paramIdx - 1 < out.length) out[paramIdx - 1] = val;
  });
  return out;
}

interface MessageInputProps {
  channel: string;
  conversationId: string;
  /** api-mcp jidType: user|group|newsletter|broadcast|... — HD-01: newsletter/broadcast
   *  son canales de UNA VÍA (status): no admiten respuesta externa, solo nota interna.
   *  (Mientras el backend no exponga el contrato de capacidades por conversación, el
   *  front lo deriva de aquí; ver Slack contrato 24-jul.) */
  jidType?: string | null;
  /** TICKET P1: la conversación pertenece a un canal no activo (conexión WA anterior) →
   *  banner + compositor solo-lectura. El backend debe canonicalizar el channelId (raíz). */
  readOnly?: boolean;
  /** HD-01: el backend (capabilities) exige plantilla (ventana 24h WA cerrada) → fuerza el
   *  picker de plantilla. Verdad autoritativa del backend sobre la heurística local. */
  requiresTemplate?: boolean;
}

/** Banner "canal desvinculado / solo lectura" (TICKET P1). Ámbar semántico fijo; el
 *  botón primario [Reconectar] usa el color de MARCA del whitelabel (no #EF5B94 fijo). */
function ChannelInactiveBanner({ brandColor, channel }: { brandColor: string; channel?: string }) {
  // A2-web: no rotular "WhatsApp anterior" en canales que NO son WhatsApp (el banner se
  // colaba en conversaciones Web). Texto genérico salvo en el canal de WhatsApp.
  // WhatsApp llega como kind 'whatsapp' o como channelParam 'wa-{id}' (URL del detalle).
  const isWhatsApp = channel === 'whatsapp' || channel?.startsWith('wa-') || !channel;
  const label = isWhatsApp
    ? 'Conexión de WhatsApp anterior — solo lectura'
    : 'Este canal está en solo lectura';
  return (
    <div
      style={{
        alignItems: 'center',
        background: '#FBF0DA',
        borderTop: '1px solid #EBD9A8',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 9,
        padding: '9px 14px',
      }}
    >
      <span aria-hidden style={{ color: '#B07E14', flexShrink: 0, fontSize: 16 }}>⚠</span>
      <span style={{ color: '#7A5A0E', flex: '1 1 130px', fontSize: 11.5, fontWeight: 700, minWidth: 0 }}>
        {label}
      </span>
      <a
        href="/settings/integrations"
        style={{ backgroundColor: brandColor, borderRadius: 999, color: '#fff', flexShrink: 0, fontSize: 11, fontWeight: 800, padding: '5px 11px' }}
      >
        Reconectar
      </a>
      <a
        href="/settings/integrations"
        style={{ background: '#fff', border: '1px solid #EBD9A8', borderRadius: 999, color: '#7A5A0E', flexShrink: 0, fontSize: 11, fontWeight: 700, padding: '5px 11px' }}
      >
        Conexiones
      </a>
    </div>
  );
}

type ComposerMode = 'reply' | 'internal';

const DRAFT_KEY_PREFIX: Record<ComposerMode, string> = {
  internal: 'note-draft-',
  reply: 'msg-draft-',
};

const INTERNAL_NOTES_KEY_PREFIX = 'internal-notes-';

// QA 15-09: contexto temporal para el banner "Borrador del asistente".
// El draft vive 24h en api-ia; sin marca de tiempo el agente no sabe si el
// texto propuesto sigue siendo válido para la conversación actual.
const DRAFT_STALE_MS = 6 * 60 * 60 * 1000;

function formatDraftAge(updatedAt?: string): string | null {
  if (!updatedAt) return null;
  const ms = Date.now() - new Date(updatedAt).getTime();
  if (Number.isNaN(ms) || ms < 0) return null;
  const min = Math.floor(ms / 60_000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

function getDraftKey(conversationId: string, mode: ComposerMode): string {
  return `${DRAFT_KEY_PREFIX[mode]}${conversationId}`;
}

function loadDraft(conversationId: string, mode: ComposerMode): string {
  // BUG-04 QA #13 (25-jun): SSR no tiene localStorage. Guard `typeof window`
  // + retornar '' en server. El caller carga el draft real en useEffect tras
  // hidratar, no en el useState initializer.
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(getDraftKey(conversationId, mode)) || '';
  } catch {
    return '';
  }
}

function saveDraft(conversationId: string, mode: ComposerMode, text: string): void {
  try {
    if (text.trim()) {
      localStorage.setItem(getDraftKey(conversationId, mode), text);
    } else {
      localStorage.removeItem(getDraftKey(conversationId, mode));
    }
  } catch {
    // localStorage may be full or unavailable
  }
}

function getInternalNotesKey(conversationId: string): string {
  return `${INTERNAL_NOTES_KEY_PREFIX}${conversationId}`;
}

function appendInternalNote(conversationId: string, note: { author: string; id: string; text: string; timestamp: string }): void {
  try {
    const raw = localStorage.getItem(getInternalNotesKey(conversationId));
    const prev = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(prev) ? prev : [];
    list.push(note);
    localStorage.setItem(getInternalNotesKey(conversationId), JSON.stringify(list));
    window.dispatchEvent(
      new CustomEvent('internal-notes-updated', { detail: { conversationId } }),
    );
  } catch {
    return;
  }
}

const SMS_MAX_CHARS = 160;

export function MessageInput({ channel, conversationId, jidType, readOnly, requiresTemplate }: MessageInputProps) {
  // HD-01: canal de UNA VÍA (status/newsletter/broadcast) → sin respuesta externa.
  const isOneWayChannel = jidType === 'newsletter' || jidType === 'broadcast';
  const composerBrand = useBandejaBrand();
  const [mode, setMode] = useState<ComposerMode>(isOneWayChannel ? 'internal' : 'reply');
  const [text, setText] = useState(() => loadDraft(conversationId, 'reply'));
  // HD-01: si el canal es de una vía, forzar modo nota interna (no hay respuesta externa).
  useEffect(() => {
    if (isOneWayChannel && mode === 'reply') setMode('internal');
  }, [isOneWayChannel, mode]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [iaDraft, setIaDraft] = useState<ServerDraft | null>(null);
  // FASE 4 Copilot (18-ago): estado del disparador manual "Sugerir respuesta".
  const [generating, setGenerating] = useState(false);
  // Fix 15-jul: HSM template pendiente de envío. Cuando el user selecciona una
  // template del picker, guardamos (name+lang+params) para que el próximo send
  // vaya via /api/whatsapp/messages/template en vez de /messages/send (Meta
  // rechazaría text-only si ventana 24h cerrada).
  const [pendingTemplate, setPendingTemplate] = useState<{
    languageCode: string;
    parameters: string[];
    templateName: string;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, sending } = useSendMessage();
  // F1 estabilización (informe 13-ago): el envío no dejaba claro el resultado — en error
  // restauraba el texto SIN avisar y en 200-sin-message también lo restauraba (parecía que
  // había fallado pese al 200). Estado visible: error (con reintento) + confirmación breve.
  const [sendError, setSendError] = useState<string | null>(null);
  const [justSent, setJustSent] = useState(false);
  const { addMessage } = useMessages(channel, conversationId);

  // Detección ventana 24h WhatsApp (Diseño P5): si lastInboundAt > 24h,
  // mostrar picker de plantillas HSM en lugar del composer normal.
  const { conversations: convList } = useConversations(channel);
  const currentConv = convList.find((c) => c.id === conversationId);
  const waWindowExpired = isWhatsAppWindowExpired(
    currentConv?.channel,
    currentConv?.lastInboundAt,
    // El tipo de conexión decide: la ventana de 24h es de Meta, no de WhatsApp. Ya viene en
    // el modelo ('WAB' | 'WEB_QR'); antes no se le pasaba y se bloqueaba también el QR.
    currentConv?.channelType,
  );
  const [waTemplateDismissed, setWaTemplateDismissed] = useState(false);
  // HD-01: OR con la capability del backend (requiresTemplate) — verdad autoritativa sobre
  // la heurística local de ventana 24h.
  const showTemplatePicker =
    (waWindowExpired || !!requiresTemplate) && !waTemplateDismissed && mode === 'reply';

  // M1 drafts api-ia (24-jun): sincroniza el texto del modo 'reply' con backend
  // (TTL 24h, cross-device). Si el backend devuelve un draft existente al
  // cargar la conversación, lo popula en el textarea o lo expone como
  // "Borrador IA" si iaGenerated=true.
  const { clearDraft } = useDraftSync({
    conversationId,
    disabled: mode !== 'reply',
    onRemoteDraft: (draft) => {
      if (draft.iaGenerated) {
        setIaDraft(draft);
      } else if (!text.trim()) {
        // Solo poblar si el textarea está vacío (no pisar lo que el user escribe).
        setText(draft.text);
      }
    },
    text,
  });

  // Load draft when conversation changes
  useEffect(() => {
    setText(loadDraft(conversationId, mode));
    setIaDraft(null);
  }, [conversationId, mode]);

  // Auto-save draft on text change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => saveDraft(conversationId, mode, text), 300);
    return () => clearTimeout(timer);
  }, [text, conversationId, mode]);

  // F1: ocultar la confirmación "Enviado" tras un instante.
  useEffect(() => {
    if (!justSent) return;
    const t = setTimeout(() => setJustSent(false), 1600);
    return () => clearTimeout(t);
  }, [justSent]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);



  const handleSend = async () => {
    if (!text.trim() || sending) return;

    const messageText = text.trim();
    setText('');
    saveDraft(conversationId, mode, '');

    if (mode === 'internal') {
      const now = new Date().toISOString();
      appendInternalNote(conversationId, {
        author: 'Tú',
        id: `note_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        text: messageText,
        timestamp: now,
      });
      return;
    }

    setSendError(null);
    try {
      // BUG 1-sep: con IDs conv_<ts> el envío no sabía el teléfono destino (lo sacaba del jid del
      // ID, que no existe) → no se podía enviar. Pasamos el teléfono de la conversación actual.
      const currentConv = convList.find((c) => c.id === conversationId);
      const result = await sendMessage(
        channel,
        conversationId,
        messageText,
        pendingTemplate ?? undefined,
        undefined,
        currentConv?.contact?.phone,
      );

      if (result.success) {
        // 200 = enviado. Si el backend devolvió el message lo pintamos ya; si no, llegará
        // por SSE/refresh — pero NO restauramos el texto (antes eso, en 200-sin-message,
        // hacía parecer que el envío había fallado pese al éxito).
        if (result.message) addMessage(result.message);
        // M1: limpia draft cross-device tras envío exitoso.
        void clearDraft();
        setIaDraft(null);
        setPendingTemplate(null);
        setJustSent(true);
      } else {
        setText(messageText);
        setSendError('No se pudo enviar el mensaje. Reinténtalo.');
      }
    } catch {
      setText(messageText);
      setSendError('No se pudo enviar (error de conexión). Reinténtalo.');
    }
  };

  const handleUseIaDraft = () => {
    if (!iaDraft) return;
    setText(iaDraft.text);
    setIaDraft(null);
    textareaRef.current?.focus();
  };

  const handleDiscardIaDraft = () => {
    setIaDraft(null);
    void clearDraft();
  };

  // FASE 4 Copilot (18-ago): dispara la generación de un borrador IA a demanda
  // (api-ia POST /draft/generate, consciente del evento). El resultado se muestra
  // en el MISMO panel "Borrador del asistente" que ya existe (setIaDraft). Best-effort:
  // si falla, no bloquea el compositor (el humano escribe a mano). 0 fallback.
  const handleGenerateDraft = async () => {
    if (generating || !conversationId) return;
    setGenerating(true);
    try {
      const draft = await generateDraft(conversationId);
      if (draft) setIaDraft(draft);
    } finally {
      setGenerating(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = text.slice(0, start) + emoji + text.slice(end);
      setText(newText);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      });
    } else {
      setText((prev) => prev + emoji);
    }
  };

  const isSmsChannel = channel === 'sms';
  const charCount = text.length;
  const smsSegments = Math.ceil(charCount / SMS_MAX_CHARS) || 1;

  // TICKET P1: canal no activo → banner solo-lectura + compositor deshabilitado
  // (opacity .45 + pointer-events:none). El banner va FUERA del contenedor
  // deshabilitado para que [Reconectar]/[Conexiones] sí sean clicables.
  return (
    <>
      {readOnly && <ChannelInactiveBanner brandColor={composerBrand.brand} channel={channel} />}
      <div
        aria-disabled={readOnly || undefined}
        className="space-y-1"
        style={readOnly ? { opacity: 0.45, pointerEvents: 'none' } : undefined}
      >
      {/* P5 Diseño — Picker plantillas HSM cuando ventana 24h WA expira */}
      {showTemplatePicker && (
        <WhatsAppTemplatePicker
          onDismiss={() => setWaTemplateDismissed(true)}
          onSelect={(tpl, body) => {
            if (body) setText(body);
            // 15-jul: guardar template pendiente. El próximo send usará el
            // endpoint HSM en vez de text-only (Meta rechaza text si 24h cerrada).
            // Extraer params rellenados: los tokens {{N}} deberían haber sido
            // sustituidos por el picker; si sobran, van vacíos (Meta rechaza).
            const parameters = extractHsmParamsFromFilledBody(body, tpl);
            setPendingTemplate({
              languageCode: tpl.language || 'es',
              parameters,
              templateName: tpl.name,
            });
          }}
        />
      )}
      {pendingTemplate && (
        <div className="mb-1 flex items-center justify-between rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
          <span>
            📝 Enviando como plantilla HSM: <b>{pendingTemplate.templateName}</b> ({pendingTemplate.languageCode})
            {pendingTemplate.parameters.length > 0 && (
              <> · {pendingTemplate.parameters.length} {pendingTemplate.parameters.length === 1 ? 'parámetro' : 'parámetros'}</>
            )}
          </span>
          <button
            className="text-[11px] font-semibold text-amber-800 hover:text-amber-900"
            onClick={() => setPendingTemplate(null)}
            type="button"
          >
            Cancelar plantilla
          </button>
        </div>
      )}

      {/* M1 — Borrador IA pendiente (cross-device, TTL 24h api-ia) */}
      {mode === 'reply' && iaDraft && (
        <div className="flex items-start gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs">
            🤖
          </div>
          <div className="flex-1 text-xs">
            <p className="font-semibold text-violet-900">
              Borrador del asistente {iaDraft.iaModel ? `(${iaDraft.iaModel})` : ''}
              {formatDraftAge(iaDraft.updatedAt) && (
                <span className="ml-1 font-normal text-violet-500">
                  · {formatDraftAge(iaDraft.updatedAt)}
                </span>
              )}
            </p>
            {/* QA 15-09: aviso de borrador antiguo (>6h). El draft persiste 24h
                y sin este aviso el agente podría aprobar texto descontextualizado. */}
            {iaDraft.updatedAt &&
              Date.now() - new Date(iaDraft.updatedAt).getTime() > DRAFT_STALE_MS && (
                <p className="mt-0.5 text-[10px] font-medium text-amber-700">
                  ⚠️ Borrador antiguo (más de 6 h) — revisa que siga siendo válido antes de enviar.
                </p>
              )}
            <MiniMarkdown clampLines={2} className="mt-0.5 break-words text-xs text-violet-800" text={iaDraft.text} />
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              className="rounded-md bg-violet-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-violet-700"
              onClick={handleUseIaDraft}
              title="Editar antes de enviar"
              type="button"
            >
              Usar
            </button>
            {/* Fix 15-jul (auditoría api-ia): endpoint /draft/approve existe y funciona
                (POST body vacío → envía + borra). Antes sin caller. Ahora el user
                puede aprobar directamente sin pasar por el textarea. */}
            <button
              className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
              onClick={async () => {
                if (!iaDraft) return;
                const optimistic: ServerDraft = { ...iaDraft };
                setIaDraft(null);
                const ok = await approveDraft(conversationId);
                if (!ok) {
                  // Rollback: si falla el approve, restauramos el banner y avisamos
                  setIaDraft(optimistic);
                  // eslint-disable-next-line no-alert
                  alert('No se pudo aprobar el borrador. Prueba con "Usar" y envíalo manualmente.');
                }
              }}
              title="Aprobar y enviar en un click"
              type="button"
            >
              ✓ Aprobar
            </button>
            <button
              className="rounded-md border border-violet-300 bg-[var(--b-surface)] px-2 py-1 text-[11px] font-semibold text-violet-700 hover:bg-violet-100"
              onClick={handleDiscardIaDraft}
              type="button"
            >
              Descartar
            </button>
          </div>
        </div>
      )}
      {/* HD-01: banda de MODO del composer. Canal de una vía (status/newsletter/
          broadcast) → no admite respuesta externa; solo nota interna. */}
      {isOneWayChannel && (
        <div
          className="mb-1 flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium"
          style={{ backgroundColor: '#F6F4FB', borderColor: '#E6E5EC', color: 'var(--b-text-2)' }}
        >
          <span aria-hidden>📢</span>
          <span>Canal informativo (status/newsletter): no admite respuesta externa. Solo nota interna.</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg bg-[var(--b-surface-2)] p-1">
          <button
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              isOneWayChannel
                ? 'cursor-not-allowed text-[var(--b-text-3)]'
                : mode === 'reply'
                  ? 'bg-[var(--b-surface)] text-[var(--b-text-1)] shadow-sm'
                  : 'text-[var(--b-text-3)] hover:bg-[var(--b-surface)]/60 hover:text-[var(--b-text-1)]'
            }`}
            disabled={isOneWayChannel}
            onClick={() => setMode('reply')}
            title={isOneWayChannel ? 'Este canal no admite respuesta externa' : 'Responder'}
            type="button"
          >
            Responder
          </button>
          <button
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              mode === 'internal'
                ? 'bg-amber-50 text-amber-900 shadow-sm'
                : 'text-[var(--b-text-3)] hover:bg-[var(--b-surface)]/60 hover:text-[var(--b-text-1)]'
            }`}
            onClick={() => setMode('internal')}
            type="button"
          >
            Nota interna
          </button>
        </div>
        {mode === 'internal' && (
          <span className="text-[11px] font-medium text-amber-700">
            Visible solo para tu equipo
          </span>
        )}
        {/* FASE 4 Copilot (18-ago): disparador manual de borrador IA. Solo en modo
            respuesta, cuando no hay ya un borrador pendiente y el canal admite respuesta.
            El resultado cae en el panel "Borrador del asistente" existente (arriba). */}
        {mode === 'reply' && !iaDraft && !isOneWayChannel && (
          <button
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-60"
            disabled={generating}
            onClick={handleGenerateDraft}
            style={{ backgroundColor: composerBrand.brandBg, color: composerBrand.brand }}
            title="Genera una respuesta sugerida por IA (usa el evento del cliente)"
            type="button"
          >
            <span aria-hidden="true">{generating ? '⏳' : '✨'}</span>
            {generating ? 'Generando…' : 'Sugerir respuesta'}
          </button>
        )}
      </div>
      <div className="flex items-end gap-2">
        {/* Attach button */}
        <button
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xl text-[var(--b-text-3)] cursor-not-allowed"
          disabled
          title="Adjuntar archivo (próximamente)"
          type="button"
        >
          📎
        </button>

        {/* Emoji picker */}
        <div className="relative">
          <button
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xl transition-colors ${
              emojiOpen ? 'bg-yellow-50 text-yellow-600' : 'text-[var(--b-text-3)] hover:text-[var(--b-text-2)]'
            }`}
            onClick={() => setEmojiOpen(!emojiOpen)}
            title="Emojis"
            type="button"
          >
            😊
          </button>

          {emojiOpen && (
            <EmojiPicker onClose={() => setEmojiOpen(false)} onPick={insertEmoji} />
          )}
        </div>

        {/* Textarea */}
        <textarea
          className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
          disabled={sending}
          onChange={(e) => { setText(e.target.value); if (sendError) setSendError(null); }}
          onKeyDown={handleKeyDown}
          placeholder={mode === 'internal' ? 'Escribe una nota interna...' : 'Escribe un mensaje...'}
          ref={textareaRef}
          rows={1}
          value={text}
        />

        {/* Send button */}
        <button
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xl text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!text.trim() || sending}
          onClick={handleSend}
          title={mode === 'internal' ? 'Guardar nota interna' : 'Enviar mensaje'}
          type="button"
        >
          {sending ? '⏳' : mode === 'internal' ? '🔒' : '📤'}
        </button>
      </div>

      {/* F1: estado del envío — error con reintento + confirmación breve (antes el fallo
          restauraba el texto sin avisar y el usuario creía que no había pasado nada). */}
      {sendError && (
        <div className="mt-1 flex items-center justify-between gap-2 rounded-md bg-red-50 px-3 py-1.5 text-xs text-red-700">
          <span>⚠️ {sendError}</span>
          <button className="flex-shrink-0 font-semibold text-red-700 underline hover:text-red-800" onClick={handleSend} type="button">
            Reintentar
          </button>
        </div>
      )}
      {justSent && !sendError && (
        <div className="mt-1 px-1 text-xs text-green-600">✓ Enviado</div>
      )}

      {/* SMS character counter */}
      {isSmsChannel && text.length > 0 && (
        <div className="flex justify-end px-1">
          <span className={`text-xs ${charCount > SMS_MAX_CHARS ? 'text-orange-500' : 'text-[var(--b-text-3)]'}`}>
            {charCount}/{SMS_MAX_CHARS} {smsSegments > 1 && `(${smsSegments} segmentos)`}
          </span>
        </div>
      )}
      </div>
    </>
  );
}
