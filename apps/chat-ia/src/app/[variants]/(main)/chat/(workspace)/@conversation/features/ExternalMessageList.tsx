'use client';

import { createStyles } from 'antd-style';
import { Button, Spin } from 'antd';
import { memo } from 'react';
import { Markdown } from '@lobehub/ui';

import { ExternalMessage } from '@/hooks/useExternalConversationMessages';

import ExternalConversationHeader from './ExternalConversationHeader';

const useStyles = createStyles(({ css, token }) => ({
  avatar: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;

    width: 32px;
    height: 32px;
    border-radius: 50%;
  `,
  container: css`
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;

    max-width: 100%;
    padding: 16px;
  `,
  content: css`
    flex: 1;
    min-width: 0;

    .markdown {
      p {
        margin: 0 0 0.75em 0;
        word-wrap: break-word;
        line-height: 1.6;
      }

      ol, ul {
        margin: 0.5em 0;
        padding-left: 1.5em;
      }

      li {
        margin-bottom: 0.4em;
      }

      pre {
        overflow-x: auto;
        padding: 8px;
        border-radius: 4px;
        background: ${token.colorFillSecondary};
      }

      code {
        padding-block: 2px;
        padding-inline: 4px;
        border-radius: 2px;

        font-size: 0.9em;

        background: ${token.colorFillSecondary};
      }
    }
  `,
  message: css`
    display: flex;
    gap: 12px;

    padding: 12px;
    border-radius: 8px;

    transition: background-color 0.2s;

    &.user {
      flex-direction: row-reverse;
      background: ${token.colorPrimaryBg};
    }

    &.assistant {
      background: ${token.colorFillTertiary};
    }
  `,
  timestamp: css`
    margin-block-start: 4px;
    font-size: 11px;
    color: ${token.colorTextTertiary};
  `,
}));

interface ExternalMessageListProps {
  channel: string;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  messages: ExternalMessage[];
  onLoadMore?: () => Promise<unknown> | void;
  onReload?: () => Promise<unknown> | void;
}

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

const ExternalMessageList = memo<ExternalMessageListProps>(
  ({ channel, hasMore, isLoadingMore, messages, onLoadMore, onReload }) => {
    const { styles } = useStyles();

    return (
      <div className={styles.container}>
        {/* Header con información del canal */}
        <ExternalConversationHeader channel={channel} messageCount={messages.length} />

        {hasMore && (
          <Button
            block
            loading={isLoadingMore}
            onClick={() => void onLoadMore?.()}
            size="small"
            style={{ marginBottom: 8 }}
            type="default"
          >
            Cargar mensajes anteriores
          </Button>
        )}

        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm mt-12">
            No hay mensajes todavía.
            {onReload && (
              <div>
                <Button onClick={() => void onReload()} type="link">
                  Reintentar
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Lista de mensajes */}
        {messages.map((message, index) => (
          <div
            className={`${styles.message} ${message.role === 'user' ? 'user' : 'assistant'}`}
            key={index}
          >
            <div className={styles.avatar}>
              {message.role === 'user' ? (
                <span className="text-lg">👤</span>
              ) : (
                <span className="text-lg">🤖</span>
              )}
            </div>
            <div className={styles.content}>
              <Markdown>{message.content}</Markdown>
              {message.timestamp && (
                <div className={styles.timestamp}>{formatTimestamp(message.timestamp)}</div>
              )}
            </div>
          </div>
        ))}

        {isLoadingMore && (
          <div className="flex items-center justify-center py-4">
            <Spin />
          </div>
        )}
      </div>
    );
  }
);

ExternalMessageList.displayName = 'ExternalMessageList';

export default ExternalMessageList;

