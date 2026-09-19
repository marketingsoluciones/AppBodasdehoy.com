'use client';

import { createStyles } from 'antd-style';
import { memo } from 'react';

import { ConversationHistoryItem } from '@/hooks/useConversationHistory';

import ChannelIcon from './ChannelIcon';
import { useOpenExternalConversation } from './useOpenExternalConversation';

const useStyles = createStyles(({ css, token }) => ({
  channelBadge: css`
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    background: ${token.colorFillSecondary};
    color: ${token.colorTextTertiary};
    text-transform: capitalize;
    flex-shrink: 0;
  `,
  container: css`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.15s ease;
    border-bottom: 1px solid ${token.colorBorderSecondary};

    &:hover {
      background-color: ${token.colorFillQuaternary};
    }

    &:active {
      background-color: ${token.colorFillTertiary};
    }
  `,
  content: css`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
  header: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  `,
  message: css`
    font-size: 13px;
    color: ${token.colorTextSecondary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    line-height: 1.4;
  `,
  messageRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  `,
  name: css`
    font-size: 14px;
    font-weight: 600;
    color: ${token.colorText};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  `,
  time: css`
    font-size: 11px;
    color: ${token.colorTextQuaternary};
    flex-shrink: 0;
  `,
}));

interface ConversationItemProps {
  conversation: ConversationHistoryItem;
  onClick?: (conversation: ConversationHistoryItem) => void;
}

const ConversationItem = memo<ConversationItemProps>(
  ({ conversation, onClick }) => {
    const { styles } = useStyles();
    const { openExternalConversation } = useOpenExternalConversation();

    const handleClick = () => {
      if (onClick) {
        onClick(conversation);
      } else {
        openExternalConversation(conversation);
      }
    };

    return (
      <div
        className={styles.container}
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        <ChannelIcon canal={conversation.canal} />
        <div className={styles.content}>
          <div className={styles.header}>
            <span className={styles.name}>{conversation.nombre}</span>
            <span className={styles.time}>{conversation.fecha}</span>
          </div>
          <div className={styles.messageRow}>
            <span className={styles.message}>{conversation.ultimoMensaje}</span>
            <span className={styles.channelBadge}>{conversation.canal}</span>
          </div>
        </div>
      </div>
    );
  }
);

ConversationItem.displayName = 'ConversationItem';

export default ConversationItem;
