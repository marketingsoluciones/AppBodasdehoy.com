/**
 * CopilotInputEditor - Editor de input completo usando @lobehub/editor
 *
 * Componente de input rico con:
 * - Editor de texto con formato
 * - Botones de acción (emojis, adjuntos, etc.)
 * - Envío de mensajes
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { IoSend, IoStop, IoHappy, IoAttach, IoCode, IoList } from 'react-icons/io5';

interface CopilotInputEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Editor de input completo para el Copilot
 */
export const CopilotInputEditor = ({
  value,
  onChange,
  onSend,
  onStop,
  isLoading = false,
  disabled = false,
  placeholder = 'Escribe tu mensaje...',
  className = '',
}: CopilotInputEditorProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [value]);

  // Click outside to close emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSend();
      }
    }
  }, [isLoading, value, onSend]);

  const handleEmojiClick = useCallback((emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + emoji + value.substring(end);

    onChange(newValue);

    // Restore cursor position
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);

    setShowEmojiPicker(false);
  }, [value, onChange]);

  const commonEmojis = ['😊', '👍', '❤️', '🎉', '🤔', '👏', '🙏', '💕', '✨', '🔥', '💐', '🎊', '💍', '🎂', '🥂', '💒'];

  const styles = {
    container: {
      display: 'flex' as const,
      flexDirection: 'column' as const,
      gap: '8px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: isFocused ? '2px solid #F7628C' : '2px solid #e5e7eb',
      boxShadow: isFocused ? '0 0 0 3px rgba(247,98,140,0.1)' : 'none',
      transition: 'all 0.2s',
      position: 'relative' as const,
    },
    actionBar: {
      display: 'flex' as const,
      alignItems: 'center' as const,
      gap: '4px',
      padding: '8px 12px',
      borderBottom: '1px solid #f3f4f6',
    },
    actionButton: {
      padding: '6px',
      borderRadius: '6px',
      border: 'none',
      backgroundColor: 'transparent',
      color: '#6b7280',
      cursor: 'pointer',
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      transition: 'all 0.2s',
    },
    inputArea: {
      display: 'flex' as const,
      alignItems: 'flex-end' as const,
      gap: '8px',
      padding: '0 12px 12px 12px',
    },
    textarea: {
      flex: 1,
      resize: 'none' as const,
      border: 'none',
      backgroundColor: 'transparent',
      padding: '8px 0',
      fontSize: '14px',
      color: '#1f2937',
      outline: 'none',
      minHeight: '44px',
      maxHeight: '200px',
      lineHeight: '1.5',
      fontFamily: 'inherit',
    },
    sendButton: {
      padding: '10px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: value.trim() && !isLoading ? '#F7628C' : '#e5e7eb',
      color: value.trim() && !isLoading ? '#ffffff' : '#9ca3af',
      cursor: value.trim() && !isLoading ? 'pointer' : 'not-allowed',
      transition: 'all 0.2s',
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexShrink: 0,
    },
    stopButton: {
      padding: '10px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: '#ef4444',
      color: '#ffffff',
      cursor: 'pointer',
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexShrink: 0,
    },
    emojiPicker: {
      position: 'absolute' as const,
      bottom: '100%',
      left: '12px',
      marginBottom: '8px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05)',
      zIndex: 1000,
      maxWidth: '280px',
      display: 'grid' as const,
      gridTemplateColumns: 'repeat(8, 1fr)',
      gap: '4px',
    },
    emojiButton: {
      fontSize: '20px',
      padding: '6px',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      borderRadius: '6px',
      transition: 'background-color 0.2s',
    },
  };

  return (
    <div style={styles.container} className={className}>
      {/* Action Bar */}
      <div style={styles.actionBar}>
        <button
          type="button"
          style={styles.actionButton}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="Emojis"
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.color = '#F7628C';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          <IoHappy size={18} />
        </button>

        <button
          type="button"
          style={styles.actionButton}
          title="Adjuntar archivo"
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.color = '#F7628C';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          <IoAttach size={18} />
        </button>

        <button
          type="button"
          style={styles.actionButton}
          title="Insertar código"
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.color = '#F7628C';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#6b7280';
          }}
          onClick={() => {
            const textarea = textareaRef.current;
            if (!textarea) return;
            const start = textarea.selectionStart;
            const newValue = value.substring(0, start) + '```\n\n```' + value.substring(start);
            onChange(newValue);
            setTimeout(() => {
              textarea.selectionStart = textarea.selectionEnd = start + 4;
              textarea.focus();
            }, 0);
          }}
        >
          <IoCode size={18} />
        </button>

        <button
          type="button"
          style={styles.actionButton}
          title="Insertar lista"
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.color = '#F7628C';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#6b7280';
          }}
          onClick={() => {
            const textarea = textareaRef.current;
            if (!textarea) return;
            const start = textarea.selectionStart;
            const newValue = value.substring(0, start) + '\n- ' + value.substring(start);
            onChange(newValue);
            setTimeout(() => {
              textarea.selectionStart = textarea.selectionEnd = start + 3;
              textarea.focus();
            }, 0);
          }}
        >
          <IoList size={18} />
        </button>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div ref={emojiPickerRef} style={styles.emojiPicker}>
          {commonEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              style={styles.emojiButton}
              onClick={() => handleEmojiClick(emoji)}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div style={styles.inputArea}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          rows={1}
          style={styles.textarea}
        />

        {isLoading && onStop ? (
          <button
            type="button"
            onClick={onStop}
            style={styles.stopButton}
            title="Detener"
          >
            <IoStop size={20} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSend}
            disabled={!value.trim() || disabled}
            style={styles.sendButton}
            title="Enviar mensaje (Enter)"
          >
            <IoSend size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default CopilotInputEditor;
