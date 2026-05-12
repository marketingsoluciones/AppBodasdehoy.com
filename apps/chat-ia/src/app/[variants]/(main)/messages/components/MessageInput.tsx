'use client';

import type { KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { useMessages } from '../hooks/useMessages';
import { useSendMessage } from '../hooks/useSendMessage';

interface MessageInputProps {
  channel: string;
  conversationId: string;
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

export function MessageInput({ channel, conversationId }: MessageInputProps) {
  const [mode, setMode] = useState<ComposerMode>('reply');
  const [text, setText] = useState(() => loadDraft(conversationId, 'reply'));
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState('Caras');
  const [emojiSearch, setEmojiSearch] = useState('');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const { sendMessage, sending } = useSendMessage();
  const { addMessage } = useMessages(channel, conversationId);

  // Load draft when conversation changes
  useEffect(() => {
    setText(loadDraft(conversationId, mode));
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
      const result = await sendMessage(channel, conversationId, messageText);

      if (result.success && result.message) {
        addMessage(result.message);
      } else {
        setText(messageText);
      }
    } catch {
      setText(messageText);
    }
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

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg bg-gray-50 p-1">
          <button
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              mode === 'reply'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:bg-white/60 hover:text-gray-800'
            }`}
            onClick={() => setMode('reply')}
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
  );
}
