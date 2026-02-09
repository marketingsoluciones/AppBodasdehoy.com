'use client';

import { createStyles } from 'antd-style';
import { memo, useMemo } from 'react';

import { IExternalChat, getChatSourceIcon } from '@/types/externalChat';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    cursor: pointer;

    padding-block: 12px;
    padding-inline: 16px;
    border-block-end: 1px solid ${token.colorBorderSecondary};

    transition: background-color 0.2s ease;

    &:hover {
      background-color: ${token.colorFillSecondary};
    }
  `,
  header: css`
    display: flex;
    gap: 8px;
    align-items: center;

    font-weight: 600;
    color: ${token.colorText};
  `,
  message: css`
    overflow: hidden;

    margin-block-start: 6px;

    font-size: 13px;
    color: ${token.colorTextSecondary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  meta: css`
    margin-inline-start: auto;
    font-size: 12px;
    color: ${token.colorTextTertiary};
  `,
}));

const formatLastActivity = (value?: string | Date) => {
  if (!value) return 'Sin actividad';
  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return 'Sin actividad';
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: '2-digit',
    });
  } catch {
    return 'Sin actividad';
  }
};

interface ConversationItemProps {
  chat: IExternalChat;
}

const ConversationItem = memo<ConversationItemProps>(({ chat }) => {
  const { styles } = useStyles();
  const lastMessage = useMemo(
    () => chat.mensajes?.[chat.mensajes.length - 1]?.mensaje ?? 'Sin mensajes',
    [chat.mensajes],
  );
  const lastActivity = chat.lastMessageAt ?? chat.metadata?.fecha_ultima_actividad;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span>{getChatSourceIcon(chat.source)}</span>
        <span>{chat.contactName || 'Contacto sin nombre'}</span>
        {chat.unreadCount ? (
          <span className={styles.meta}>{chat.unreadCount} sin leer</span>
        ) : (
          <span className={styles.meta}>{formatLastActivity(lastActivity)}</span>
        )}
      </div>
      <div className={styles.message}>{lastMessage}</div>
    </div>
  );
});

ConversationItem.displayName = 'ConversationItem';

export default ConversationItem;
