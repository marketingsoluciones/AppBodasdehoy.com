/**
 * InputEditor - Simple prop-based chat input component
 *
 * A controlled text input component for chat interfaces.
 * Supports keyboard shortcuts (Enter to send, Shift+Enter for new line).
 */

import { memo, KeyboardEvent, useCallback, useRef, useEffect } from 'react';
import { createStyles } from 'antd-style';

export interface InputEditorProps {
  /**
   * @description Current content of the editor
   */
  content: string;
  /**
   * @description Placeholder text when editor is empty
   * @default "Type a message..."
   */
  placeholder?: string;
  /**
   * @description Whether the editor is in loading state
   * @default false
   */
  loading?: boolean;
  /**
   * @description Whether the editor is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * @description Whether to auto-focus on mount
   * @default false
   */
  autoFocus?: boolean;
  /**
   * @description Minimum number of rows (height)
   * @default 2
   */
  minRows?: number;
  /**
   * @description Maximum number of rows (height)
   * @default 8
   */
  maxRows?: number;
  /**
   * @description Callback when content changes
   */
  onChange: (content: string) => void;
  /**
   * @description Callback when user wants to send message
   * Triggered by Enter key (without Shift)
   */
  onSend: (content: string) => void;
  /**
   * @description Callback when editor receives focus
   */
  onFocus?: () => void;
  /**
   * @description Callback when editor loses focus
   */
  onBlur?: () => void;
  /**
   * @description Custom className
   */
  className?: string;
  /**
   * @description Custom style
   */
  style?: React.CSSProperties;
}

const useStyles = createStyles(({ token, css, cx }) => ({
  container: cx(css`
    position: relative;
    width: 100%;
  `),
  textarea: cx(css`
    width: 100%;
    min-height: 46px;
    padding: 12px 16px;
    font-size: 14px;
    line-height: 1.5;
    color: ${token.colorText};
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    resize: none;
    outline: none;
    font-family: inherit;
    transition: all 0.2s;

    &:hover {
      border-color: ${token.colorBorder};
    }

    &:focus {
      border-color: ${token.colorPrimary};
      box-shadow: 0 0 0 2px ${token.colorPrimaryBg};
    }

    &:disabled {
      background: ${token.colorBgContainerDisabled};
      color: ${token.colorTextDisabled};
      cursor: not-allowed;
    }

    &::placeholder {
      color: ${token.colorTextPlaceholder};
    }
  `),
  loading: cx(css`
    opacity: 0.6;
    cursor: wait;
  `),
}));

/**
 * Simple chat input editor component
 *
 * @example
 * ```tsx
 * const [content, setContent] = useState('');
 *
 * <InputEditor
 *   content={content}
 *   placeholder="Type a message..."
 *   onChange={setContent}
 *   onSend={(message) => {
 *     sendMessage(message);
 *     setContent('');
 *   }}
 * />
 * ```
 */
export const InputEditor = memo<InputEditorProps>(
  ({
    content,
    placeholder = 'Type a message...',
    loading = false,
    disabled = false,
    autoFocus = false,
    minRows = 2,
    maxRows = 8,
    onChange,
    onSend,
    onFocus,
    onBlur,
    className,
    style,
  }) => {
    const { styles, cx } = useStyles();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea based on content
    const adjustHeight = useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';

      const lineHeight = 23; // 1.5 * 14px (fontSize)
      const minHeight = minRows * lineHeight + 24; // + padding
      const maxHeight = maxRows * lineHeight + 24;

      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    }, [minRows, maxRows]);

    // Adjust height when content changes
    useEffect(() => {
      adjustHeight();
    }, [content, adjustHeight]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
      },
      [onChange],
    );

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLTextAreaElement>) => {
        // Enter without Shift = send message
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (content.trim() && !loading && !disabled) {
            onSend(content);
          }
        }
        // Shift + Enter = new line (default behavior, do nothing)
      },
      [content, loading, disabled, onSend],
    );

    return (
      <div className={cx(styles.container, className)} style={style}>
        <textarea
          ref={textareaRef}
          autoFocus={autoFocus}
          className={cx(styles.textarea, loading && styles.loading)}
          disabled={disabled || loading}
          onBlur={onBlur}
          onChange={handleChange}
          onFocus={onFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          value={content}
        />
      </div>
    );
  },
);

InputEditor.displayName = 'InputEditor';
