/**
 * MessageList - List of chat messages with auto-scroll
 *
 * Renders a list of chat messages using ChatItem components.
 * Automatically scrolls to bottom when new messages arrive.
 */

import { memo, useEffect, useRef } from 'react';
import { createStyles } from 'antd-style';
import { ChatItem } from '../ChatItem';
import type { MessageListProps } from './types';

const useStyles = createStyles(({ token, css, cx }) => ({
  container: cx(css`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 16px;
    background: ${token.colorBgLayout};

    /* Custom scrollbar */
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: ${token.colorBorderSecondary};
      border-radius: 3px;

      &:hover {
        background: ${token.colorBorder};
      }
    }
  `),
  messagesWrapper: cx(css`
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  `),
  emptyState: cx(css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: ${token.colorTextDescription};
    font-size: 14px;
    padding: 48px 24px;
  `),
  loadingIndicator: cx(css`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    color: ${token.colorTextDescription};
    font-size: 14px;
  `),
  scrollAnchor: cx(css`
    height: 1px;
    width: 1px;
  `),
}));

/**
 * MessageList component
 *
 * @example
 * ```tsx
 * const messages = [
 *   {
 *     id: '1',
 *     role: 'user',
 *     message: 'Hello!',
 *     avatar: { title: 'User' },
 *   },
 *   {
 *     id: '2',
 *     role: 'assistant',
 *     message: 'Hi! How can I help?',
 *     avatar: { title: 'Assistant' },
 *     loading: false,
 *   },
 * ];
 *
 * <MessageList
 *   messages={messages}
 *   autoScroll
 *   onAction={(action, messageId) => {
 *     console.log(action, messageId);
 *   }}
 * />
 * ```
 */
export const MessageList = memo<MessageListProps>(
  ({
    messages,
    autoScroll = true,
    loading = false,
    onAction,
    className,
    style,
    emptyState,
    showAvatars = true,
  }) => {
    const { styles, cx } = useStyles();
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollAnchorRef = useRef<HTMLDivElement>(null);
    const previousMessageCountRef = useRef(messages.length);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
      if (!autoScroll || !scrollAnchorRef.current) return;

      // Only scroll if messages were added (not on initial render or message updates)
      const messageCountIncreased = messages.length > previousMessageCountRef.current;
      previousMessageCountRef.current = messages.length;

      if (messageCountIncreased) {
        // Use smooth scroll for better UX
        scrollAnchorRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        });
      }
    }, [messages, autoScroll]);

    // Scroll to bottom on initial load
    useEffect(() => {
      if (autoScroll && scrollAnchorRef.current && messages.length > 0) {
        // Immediate scroll on mount
        scrollAnchorRef.current.scrollIntoView({
          behavior: 'auto',
          block: 'end',
        });
      }
    }, []); // Only on mount

    // Show empty state if no messages
    if (messages.length === 0 && !loading) {
      return (
        <div className={cx(styles.container, className)} ref={containerRef} style={style}>
          {emptyState || (
            <div className={styles.emptyState}>
              <span>No messages yet</span>
              <span style={{ fontSize: '12px', marginTop: '8px' }}>
                Start a conversation by sending a message
              </span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={cx(styles.container, className)} ref={containerRef} style={style}>
        <div className={styles.messagesWrapper}>
          {messages.map((message) => (
            <ChatItem
              key={message.id}
              {...message}
              id={message.id}
              avatar={message.avatar}
              message={message.message}
              placement={message.role === 'user' ? 'right' : 'left'}
              primary={message.role === 'user'}
              showAvatar={showAvatars}
              time={message.createdAt ? message.createdAt.getTime() : undefined}
              onMessageChange={
                message.onMessageChange
                  ? (value) => message.onMessageChange?.(value)
                  : undefined
              }
              onEditingChange={
                message.onEditingChange
                  ? (editing) => message.onEditingChange?.(editing)
                  : undefined
              }
            />
          ))}

          {loading && (
            <div className={styles.loadingIndicator}>
              <span>Loading...</span>
            </div>
          )}

          {/* Invisible anchor for auto-scroll */}
          <div ref={scrollAnchorRef} className={styles.scrollAnchor} />
        </div>
      </div>
    );
  },
);

MessageList.displayName = 'MessageList';
