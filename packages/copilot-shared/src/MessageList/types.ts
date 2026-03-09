/**
 * MessageList Types
 *
 * Type definitions for MessageList component
 */

import type { ChatItemProps } from '../ChatItem/type';

/**
 * Message item for MessageList
 * Extends ChatItemProps with required id
 */
export interface MessageItem extends Omit<ChatItemProps, 'id'> {
  /**
   * @description Unique identifier for the message
   */
  id: string;
  /**
   * @description Role of the message sender
   */
  role: 'user' | 'assistant' | 'system';
  /**
   * @description Message content
   */
  message: string;
  /**
   * @description Timestamp of the message
   */
  createdAt?: Date;
}

/**
 * Props for MessageList component
 */
export interface MessageListProps {
  /**
   * @description Array of messages to display
   */
  messages: MessageItem[];
  /**
   * @description Whether to auto-scroll to bottom when new messages arrive
   * @default true
   */
  autoScroll?: boolean;
  /**
   * @description Whether the list is in loading state (shows loading indicator)
   * @default false
   */
  loading?: boolean;
  /**
   * @description Callback when user performs an action on a message
   */
  onAction?: (action: string, messageId: string) => void;
  /**
   * @description Custom className for the container
   */
  className?: string;
  /**
   * @description Custom style for the container
   */
  style?: React.CSSProperties;
  /**
   * @description Empty state component when no messages
   */
  emptyState?: React.ReactNode;
  /**
   * @description Whether to show avatars
   * @default true
   */
  showAvatars?: boolean;
}
