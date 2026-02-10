/**
 * MessageContent Wrapper for apps/copilot
 *
 * This wrapper connects Zustand stores to the shared prop-based MessageContent component.
 * It maintains backward compatibility with the existing apps/copilot codebase.
 */

import { memo } from 'react';
import MessageContentBase from '@bodasdehoy/copilot-shared/src/ChatItem/components/MessageContent';
import type { MessageContentProps as MessageContentBaseProps } from '@bodasdehoy/copilot-shared/src/ChatItem/components/MessageContent';

import { useChatStore } from '@/store/chat';
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/selectors';

// Extend base props but make fontSize, onChange, and onEditingChange optional
// since they'll be provided by the wrapper
export interface MessageContentProps extends Omit<MessageContentBaseProps, 'fontSize' | 'onChange' | 'onEditingChange'> {
  fontSize?: number;
  onChange?: (value: string) => void;
  onEditingChange?: (editing: boolean) => void;
}

/**
 * MessageContent wrapper that connects Zustand stores to the shared component
 */
const MessageContent = memo<MessageContentProps>(
  ({
    id,
    fontSize: propFontSize,
    onChange: propOnChange,
    onEditingChange: propOnEditingChange,
    ...restProps
  }) => {
    // Get fontSize from user store if not provided via props
    const storeFontSize = useUserStore(userGeneralSettingsSelectors.fontSize);
    const fontSize = propFontSize ?? storeFontSize;

    // Get store functions
    const [toggleMessageEditing, updateMessageContent] = useChatStore((s) => [
      s.toggleMessageEditing,
      s.modifyMessageContent,
    ]);

    // Default handlers that use stores if no custom handlers provided
    const handleChange = (value: string) => {
      if (propOnChange) {
        propOnChange(value);
      } else {
        updateMessageContent(id, value);
      }
    };

    const handleEditingChange = (editing: boolean) => {
      if (propOnEditingChange) {
        propOnEditingChange(editing);
      } else {
        toggleMessageEditing(id, editing);
      }
    };

    return (
      <MessageContentBase
        {...restProps}
        fontSize={fontSize}
        id={id}
        onChange={handleChange}
        onEditingChange={handleEditingChange}
      />
    );
  },
);

export default MessageContent;
