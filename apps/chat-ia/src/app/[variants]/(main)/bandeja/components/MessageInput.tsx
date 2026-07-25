'use client';

import type { KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { useMessages } from '../hooks/useMessages';
import { useSendMessage } from '../hooks/useSendMessage';
import { approveDraft, useDraftSync, type ServerDraft } from '../hooks/useDraftSync';
import { useConversations } from '../hooks/useConversations';
import {
  isWhatsAppWindowExpired,
  templateBodyText,
  type WhatsAppTemplate,
} from '../hooks/useWhatsAppTemplates';
import { WhatsAppTemplatePicker } from './WhatsAppTemplatePicker';
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
  const re = /\{\{\s*(\d+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > max) max = n;
  }
  if (max === 0) return [];
  // Reconstruye regex del raw como capturas
  const escaped = raw.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = escaped.replaceAll(/\\\{\\\{\s*\d+\s*\\\}\\\}/g, '(.*?)');
  const captureRe = new RegExp('^' + pattern + '$', 's');
  const match = filled.match(captureRe);
  if (!match) return Array.from({ length: max }, (_, i) => `{{${i + 1}}}`);
  // match[1..N] son las capturas en el orden que aparecen en el body raw,
  // NO en el orden posicional 1..N. Necesitamos mapear.
  const raw2 = raw;
  const order: number[] = [];
  const re2 = /\{\{\s*(\d+)\s*\}\}/g;
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
function ChannelInactiveBanner({ brandColor }: { brandColor: string }) {
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
        Conexión de WhatsApp anterior — solo lectura
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

const EMOJI_CATEGORIES: Record<string, string[]> = {
  'Caras': [
    '😊', '😂', '🥰', '😍', '🤔', '😅', '😢', '😎', '🙄', '😮', '🤗', '😏',
    '😁', '🤣', '😘', '🥲', '😤', '😳', '🫣', '🤭', '😴', '🥳', '😬', '🫠',
    '😇', '🤩', '😋', '😜', '🤪', '😷', '🤒', '🤑', '😈', '👻', '🤖', '👽',
  ],
  'Comida': [
    '🍕', '🍔', '🍰', '🎂', '🍷', '🥂', '☕', '🍾', '🧁', '🍩', '🍫', '🍿',
    '🥗', '🍝', '🍣', '🌮', '🥑', '🍓', '🍑', '🍒', '🫐', '🥝', '🍌', '🥐',
  ],
  'Gestos': [
    '👍', '👎', '👋', '🤝', '🙏', '❤️', '💪', '👏', '🎉', '🔥', '✅', '⭐',
    '🫶', '✌️', '🤞', '🫡', '🙌', '💕', '💔', '💯', '🎊', '✨', '❌', '💫',
    '🤙', '👌', '🤟', '🫰', '👊', '💖', '💗', '💝', '🏆', '🌟', '🔔', '💥',
  ],
  'Naturaleza': [
    '🌸', '🌺', '🌻', '🌷', '🌹', '🍀', '🌈', '☀️', '🌙', '⭐', '🦋', '🐶',
    '🐱', '🐻', '🌊', '🍃', '🌿', '🍁', '🐾', '🦊', '🐰', '🐥', '🌎', '🪻',
  ],
  'Objetos': [
    '📱', '💻', '📧', '📅', '💰', '🎁', '📷', '🔔', '💡', '📝', '🔑', '💎',
    '👗', '👠', '💄', '💍', '👰', '🤵', '🎵', '🎬', '📸', '🎤', '🛒', '📌',
  ],
  'Viaje': [
    '✈️', '🚗', '🏠', '🏨', '⛪', '💒', '🎪', '🗺️', '🧳', '🏖️', '🏔️', '🎡',
    '🚀', '🛳️', '🚕', '🚌', '🏰', '🗼', '🌆', '🌅', '🏝️', '⛱️', '🎢', '🛫',
  ],
};

const RECENT_EMOJIS_KEY = 'msg-recent-emojis';
const MAX_RECENT = 12;

function getRecentEmojis(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_EMOJIS_KEY) || '[]');
  } catch { return []; }
}

function addRecentEmoji(emoji: string): void {
  try {
    const recent = getRecentEmojis().filter((e) => e !== emoji);
    recent.unshift(emoji);
    localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch { /* ignore */ }
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
  const [emojiCategory, setEmojiCategory] = useState('Caras');
  const [emojiSearch, setEmojiSearch] = useState('');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [iaDraft, setIaDraft] = useState<ServerDraft | null>(null);
  // Fix 15-jul: HSM template pendiente de envío. Cuando el user selecciona una
  // template del picker, guardamos (name+lang+params) para que el próximo send
  // vaya via /api/whatsapp/messages/template en vez de /messages/send (Meta
  // rechazaría text-only si ventana 24h cerrada).
  const [pendingTemplate, setPendingTemplate] = useState<{
    templateName: string;
    languageCode: string;
    parameters: string[];
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const { sendMessage, sending } = useSendMessage();
  const { addMessage } = useMessages(channel, conversationId);

  // Detección ventana 24h WhatsApp (Diseño P5): si lastInboundAt > 24h,
  // mostrar picker de plantillas HSM en lugar del composer normal.
  const { conversations: convList } = useConversations(channel);
  const currentConv = convList.find((c) => c.id === conversationId);
  const waWindowExpired = isWhatsAppWindowExpired(
    currentConv?.channel,
    currentConv?.lastInboundAt,
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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  // Load recent emojis when picker opens
  useEffect(() => {
    if (emojiOpen) setRecentEmojis(getRecentEmojis());
  }, [emojiOpen]);

  // Close emoji picker on outside click
  useEffect(() => {
    if (!emojiOpen) return;
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setEmojiOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [emojiOpen]);

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

    try {
      const result = await sendMessage(
        channel,
        conversationId,
        messageText,
        pendingTemplate ?? undefined,
      );

      if (result.success && result.message) {
        addMessage(result.message);
        // M1: limpia draft cross-device tras envío exitoso.
        void clearDraft();
        setIaDraft(null);
        setPendingTemplate(null);
      } else {
        setText(messageText);
      }
    } catch {
      setText(messageText);
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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    addRecentEmoji(emoji);
    setRecentEmojis(getRecentEmojis());
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
      {readOnly && <ChannelInactiveBanner brandColor={composerBrand.brand} />}
      <div
        aria-disabled={readOnly || undefined}
        className="space-y-1"
        style={readOnly ? { opacity: 0.45, pointerEvents: 'none' } : undefined}
      >
      {/* P5 Diseño — Picker plantillas HSM cuando ventana 24h WA expira */}
      {showTemplatePicker && (
        <WhatsAppTemplatePicker
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
          onDismiss={() => setWaTemplateDismissed(true)}
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
            </p>
            <p className="mt-0.5 line-clamp-2 text-violet-800">{iaDraft.text}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              className="rounded-md bg-violet-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-violet-700"
              onClick={handleUseIaDraft}
              type="button"
              title="Editar antes de enviar"
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
              type="button"
              title="Aprobar y enviar en un click"
            >
              ✓ Aprobar
            </button>
            <button
              className="rounded-md border border-violet-300 bg-white px-2 py-1 text-[11px] font-semibold text-violet-700 hover:bg-violet-100"
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
          style={{ backgroundColor: '#F6F4FB', borderColor: '#E6E5EC', color: '#6B6678' }}
        >
          <span aria-hidden>📢</span>
          <span>Canal informativo (status/newsletter): no admite respuesta externa. Solo nota interna.</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg bg-gray-50 p-1">
          <button
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              isOneWayChannel
                ? 'cursor-not-allowed text-gray-300'
                : mode === 'reply'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:bg-white/60 hover:text-gray-800'
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
                : 'text-gray-500 hover:bg-white/60 hover:text-gray-800'
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
      </div>
      <div className="flex items-end gap-2">
        {/* Attach button */}
        <button
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xl text-gray-300 cursor-not-allowed"
          disabled
          title="Adjuntar archivo (próximamente)"
          type="button"
        >
          📎
        </button>

        {/* Emoji picker */}
        <div className="relative" ref={emojiRef}>
          <button
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xl transition-colors ${
              emojiOpen ? 'bg-yellow-50 text-yellow-600' : 'text-gray-400 hover:text-gray-600'
            }`}
            onClick={() => setEmojiOpen(!emojiOpen)}
            title="Emojis"
            type="button"
          >
            😊
          </button>

          {emojiOpen && (
            <div className="absolute bottom-12 left-0 z-10 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
              {/* Search */}
              <div className="border-b border-gray-100 px-3 pt-3 pb-2">
                <input
                  className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
                  onChange={(e) => setEmojiSearch(e.target.value)}
                  placeholder="Buscar emoji..."
                  type="text"
                  value={emojiSearch}
                />
              </div>

              {/* Recent emojis */}
              {!emojiSearch && recentEmojis.length > 0 && (
                <div className="border-b border-gray-50 px-3 py-2">
                  <p className="mb-1 text-[10px] font-medium uppercase text-gray-400">Recientes</p>
                  <div className="flex flex-wrap gap-0.5">
                    {recentEmojis.map((emoji, i) => (
                      <button
                        aria-label={`Emoji ${emoji}`}
                        className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-gray-100"
                        key={`recent-${i}`}
                        onClick={() => insertEmoji(emoji)}
                        type="button"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category tabs */}
              {!emojiSearch && (
                <div className="flex gap-0.5 overflow-x-auto border-b border-gray-100 px-3 py-1.5">
                  {Object.keys(EMOJI_CATEGORIES).map((cat) => (
                    <button
                      className={`shrink-0 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                        emojiCategory === cat
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                      key={cat}
                      onClick={() => setEmojiCategory(cat)}
                      type="button"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Emoji grid */}
              <div className="max-h-48 overflow-auto px-3 py-2">
                {emojiSearch ? (
                  <div className="grid grid-cols-8 gap-0.5">
                    {Object.values(EMOJI_CATEGORIES)
                      .flat()
                      .filter((e) => e.includes(emojiSearch))
                      .map((emoji) => (
                        <button
                          aria-label={`Emoji ${emoji}`}
                          className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-gray-100"
                          key={emoji}
                          onClick={() => insertEmoji(emoji)}
                          type="button"
                        >
                          {emoji}
                        </button>
                      ))}
                    {Object.values(EMOJI_CATEGORIES).flat().filter((e) => e.includes(emojiSearch)).length === 0 && (
                      <p className="col-span-8 py-4 text-center text-xs text-gray-400">Sin resultados</p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-8 gap-0.5">
                    {EMOJI_CATEGORIES[emojiCategory]?.map((emoji) => (
                      <button
                        aria-label={`Emoji ${emoji}`}
                        className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-gray-100"
                        key={emoji}
                        onClick={() => insertEmoji(emoji)}
                        type="button"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Textarea */}
        <textarea
          className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
          disabled={sending}
          onChange={(e) => setText(e.target.value)}
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

      {/* SMS character counter */}
      {isSmsChannel && text.length > 0 && (
        <div className="flex justify-end px-1">
          <span className={`text-xs ${charCount > SMS_MAX_CHARS ? 'text-orange-500' : 'text-gray-400'}`}>
            {charCount}/{SMS_MAX_CHARS} {smsSegments > 1 && `(${smsSegments} segmentos)`}
          </span>
        </div>
      )}
      </div>
    </>
  );
}
