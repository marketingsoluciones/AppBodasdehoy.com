'use client';

import type { KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { useMessages } from '../hooks/useMessages';
import { useSendMessage } from '../hooks/useSendMessage';

interface MessageInputProps {
  channel: string;
  conversationId: string;
}

const DRAFT_KEY_PREFIX = 'msg-draft-';

const EMOJI_CATEGORIES: Record<string, string[]> = {
  'Caras': [
    '😊', '😂', '🥰', '😍', '🤔', '😅', '😢', '😎', '🙄', '😮', '🤗', '😏',
    '😁', '🤣', '😘', '🥲', '😤', '😳', '🫣', '🤭', '😴', '🥳', '😬', '🫠',
    '😇', '🤩', '😋', '😜', '🤪', '😷', '🤒', '🤑', '😈', '👻', '🤖', '👽',
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
  'Comida': [
    '🍕', '🍔', '🍰', '🎂', '🍷', '🥂', '☕', '🍾', '🧁', '🍩', '🍫', '🍿',
    '🥗', '🍝', '🍣', '🌮', '🥑', '🍓', '🍑', '🍒', '🫐', '🥝', '🍌', '🥐',
  ],
  'Viaje': [
    '✈️', '🚗', '🏠', '🏨', '⛪', '💒', '🎪', '🗺️', '🧳', '🏖️', '🏔️', '🎡',
    '🚀', '🛳️', '🚕', '🚌', '🏰', '🗼', '🌆', '🌅', '🏝️', '⛱️', '🎢', '🛫',
  ],
  'Objetos': [
    '📱', '💻', '📧', '📅', '💰', '🎁', '📷', '🔔', '💡', '📝', '🔑', '💎',
    '👗', '👠', '💄', '💍', '👰', '🤵', '🎵', '🎬', '📸', '🎤', '🛒', '📌',
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

function getDraftKey(conversationId: string): string {
  return `${DRAFT_KEY_PREFIX}${conversationId}`;
}

function loadDraft(conversationId: string): string {
  try {
    return localStorage.getItem(getDraftKey(conversationId)) || '';
  } catch {
    return '';
  }
}

function saveDraft(conversationId: string, text: string): void {
  try {
    if (text.trim()) {
      localStorage.setItem(getDraftKey(conversationId), text);
    } else {
      localStorage.removeItem(getDraftKey(conversationId));
    }
  } catch {
    // localStorage may be full or unavailable
  }
}

const SMS_MAX_CHARS = 160;

export function MessageInput({ channel, conversationId }: MessageInputProps) {
  const [text, setText] = useState(() => loadDraft(conversationId));
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
    setText(loadDraft(conversationId));
  }, [conversationId]);

  // Auto-save draft on text change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => saveDraft(conversationId, text), 300);
    return () => clearTimeout(timer);
  }, [text, conversationId]);

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
    saveDraft(conversationId, '');

    try {
      const result = await sendMessage(channel, conversationId, messageText);

      if (result.success && result.message) {
        addMessage(result.message);
      } else {
        setText(messageText);
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
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
                      key={cat}
                      className={`shrink-0 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                        emojiCategory === cat
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
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
          placeholder="Escribe un mensaje..."
          ref={textareaRef}
          rows={1}
          value={text}
        />

        {/* Send button */}
        <button
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xl text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!text.trim() || sending}
          onClick={handleSend}
          title="Enviar mensaje"
          type="button"
        >
          {sending ? '⏳' : '📤'}
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
