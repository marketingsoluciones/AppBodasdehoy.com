/**
 * Placeholder - Simple placeholder component for InputEditor
 *
 * Displays helpful text when the input is empty
 */

import { memo } from 'react';
import { createStyles } from 'antd-style';

export interface PlaceholderProps {
  /**
   * @description Placeholder text
   * @default "Type a message..."
   */
  text?: string;
  /**
   * @description Show keyboard shortcut hint
   * @default true
   */
  showShortcut?: boolean;
  /**
   * @description Keyboard shortcut to display
   * @default "Enter"
   */
  shortcut?: string;
}

const useStyles = createStyles(({ token, css, cx }) => ({
  container: cx(css`
    display: flex;
    align-items: center;
    gap: 4px;
    color: ${token.colorTextPlaceholder};
    font-size: 14px;
    user-select: none;
  `),
  shortcut: cx(css`
    padding: 2px 6px;
    font-size: 12px;
    color: ${token.colorTextDescription};
    background: ${token.colorBgTextHover};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 4px;
    font-family: monospace;
  `),
}));

/**
 * Simple placeholder component
 *
 * @example
 * ```tsx
 * <Placeholder
 *   text="Type a message..."
 *   showShortcut
 *   shortcut="Enter"
 * />
 * ```
 */
export const Placeholder = memo<PlaceholderProps>(
  ({ text = 'Type a message...', showShortcut = true, shortcut = 'Enter' }) => {
    const { styles } = useStyles();

    return (
      <span className={styles.container}>
        <span>{text}</span>
        {showShortcut && (
          <>
            <span>Press</span>
            <kbd className={styles.shortcut}>{shortcut}</kbd>
            <span>to send</span>
          </>
        )}
      </span>
    );
  },
);

Placeholder.displayName = 'Placeholder';
