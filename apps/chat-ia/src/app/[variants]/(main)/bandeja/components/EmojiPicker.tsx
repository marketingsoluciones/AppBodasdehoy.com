'use client';

import { useEffect, useRef, useState } from 'react';

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

/**
 * EmojiPicker — selector de emojis del compositor.
 *
 * M4 (16-09): vivía dentro de MessageInput, que iba por 804 líneas mezclando el editor, las
 * plantillas de WhatsApp, el borrador de la IA y esto. Separado, el compositor se lee y esta
 * pieza se puede probar sola.
 *
 * Los recientes siguen en localStorage a propósito: son una preferencia de este navegador,
 * no estado del negocio, y no tiene sentido llevarlos al servidor.
 */
interface EmojiPickerProps {
  onClose: () => void;
  onPick: (emoji: string) => void;
}

export function EmojiPicker({ onClose, onPick }: EmojiPickerProps) {
  const [category, setCategory] = useState('Caras');
  const [search, setSearch] = useState('');
  const [recents, setRecents] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecents(getRecentEmojis());
  }, []);

  // Cerrar al pulsar fuera: el picker flota sobre el hilo y si no, tapa la conversación.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const pick = (emoji: string) => {
    addRecentEmoji(emoji);
    setRecents(getRecentEmojis());
    onPick(emoji);
  };

  return (
    <div ref={ref}>
        <div className="absolute bottom-12 left-0 z-10 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
          {/* Search */}
          <div className="border-b border-gray-100 px-3 pt-3 pb-2">
            <input
              className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar emoji..."
              type="text"
              value={search}
            />
          </div>

          {/* Recent emojis */}
          {!search && recents.length > 0 && (
            <div className="border-b border-gray-50 px-3 py-2">
              <p className="mb-1 text-[10px] font-medium uppercase text-gray-400">Recientes</p>
              <div className="flex flex-wrap gap-0.5">
                {recents.map((emoji, i) => (
                  <button
                    aria-label={`Emoji ${emoji}`}
                    className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-gray-100"
                    key={`recent-${i}`}
                    onClick={() => pick(emoji)}
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category tabs */}
          {!search && (
            <div className="flex gap-0.5 overflow-x-auto border-b border-gray-100 px-3 py-1.5">
              {Object.keys(EMOJI_CATEGORIES).map((cat) => (
                <button
                  className={`shrink-0 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                    category === cat
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  key={cat}
                  onClick={() => setCategory(cat)}
                  type="button"
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Emoji grid */}
          <div className="max-h-48 overflow-auto px-3 py-2">
            {search ? (
              <div className="grid grid-cols-8 gap-0.5">
                {Object.values(EMOJI_CATEGORIES)
                  .flat()
                  .filter((e) => e.includes(search))
                  .map((emoji) => (
                    <button
                      aria-label={`Emoji ${emoji}`}
                      className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-gray-100"
                      key={emoji}
                      onClick={() => pick(emoji)}
                      type="button"
                    >
                      {emoji}
                    </button>
                  ))}
                {Object.values(EMOJI_CATEGORIES).flat().filter((e) => e.includes(search)).length === 0 && (
                  <p className="col-span-8 py-4 text-center text-xs text-gray-400">Sin resultados</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-8 gap-0.5">
                {EMOJI_CATEGORIES[category]?.map((emoji) => (
                  <button
                    aria-label={`Emoji ${emoji}`}
                    className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-gray-100"
                    key={emoji}
                    onClick={() => pick(emoji)}
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
