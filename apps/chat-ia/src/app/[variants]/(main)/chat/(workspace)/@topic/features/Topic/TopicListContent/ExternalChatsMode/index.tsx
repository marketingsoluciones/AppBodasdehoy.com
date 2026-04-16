'use client';

import { createStyles } from 'antd-style';
import { useRouter } from 'next/navigation';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';

const useStyles = createStyles(({ css, token }) => ({
  badge: css`
    display: inline-block;

    padding-block: 2px;
    padding-inline: ${token.paddingXS}px;
    border-radius: ${token.borderRadiusSM}px;

    font-size: ${token.fontSizeSM}px;
    font-weight: ${token.fontWeightStrong};
    color: ${token.colorPrimary};

    background: ${token.colorPrimaryBg};
  `,
  chatContent: css`
    overflow: hidden;
    flex: 1;
    min-width: 0;
  `,
  chatIcon: css`
    flex-shrink: 0;
    font-size: 24px;
  `,
  chatItem: css`
    cursor: pointer;

    display: flex;
    gap: ${token.marginSM}px;
    align-items: center;

    margin-block-end: ${token.marginXS}px;
    padding-block: ${token.paddingSM}px;
    padding-inline: ${token.padding}px;
    border-radius: ${token.borderRadius}px;

    transition: all ${token.motionDurationMid};

    &:hover {
      background: ${token.colorFillTertiary};
    }

    &.active {
      border-inline-start: 3px solid ${token.colorPrimary};
      background: ${token.colorPrimaryBg};
    }
  `,
  chatMeta: css`
    display: flex;
    gap: ${token.marginXS}px;
    align-items: center;

    margin-block-start: ${token.marginXXS}px;

    font-size: ${token.fontSizeSM}px;
    color: ${token.colorTextTertiary};
  `,
  chatPreview: css`
    overflow: hidden;

    font-size: ${token.fontSizeSM}px;
    color: ${token.colorTextSecondary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  chatTitle: css`
    overflow: hidden;

    margin-block-end: ${token.marginXXS}px;

    font-size: ${token.fontSize}px;
    font-weight: ${token.fontWeightStrong};
    color: ${token.colorText};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  container: css`
    overflow-y: auto;
    padding: ${token.paddingSM}px;
  `,
  emptyState: css`
    padding: ${token.paddingLG}px;
    color: ${token.colorTextTertiary};
    text-align: center;
  `,
}));

const getChannelIcon = (source: string) => {
  switch (source?.toLowerCase()) {
    case 'whatsapp': {
      return '💬';
    }
    case 'instagram': {
      return '📸';
    }
    case 'telegram': {
      return '✈️';
    }
    case 'email': {
      return '📧';
    }
    case 'web':
    case 'chat': {
      return '🌐';
    }
    default: {
      return '💬';
    }
  }
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;

    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  } catch {
    return '';
  }
};

const ExternalChatsMode = memo(() => {
  const { styles, cx } = useStyles();
  const router = useRouter();

  const externalChats = useChatStore((s) => s.externalChats || []);
  const activeExternalChatId = useChatStore((s) => s.activeExternalChatId);

  const handleChatClick = (chatId: string, source: string) => {
    // Navegar a la conversación externa en modo chat
    router.push(`/chat?external=true&session=${chatId}&channel=${source}&session_type=chat`);
  };

  if (!externalChats || externalChats.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
        <div>No hay conversaciones disponibles</div>
        <div style={{ fontSize: '12px', marginTop: '8px' }}>
          Las conversaciones aparecerán aquí cuando recibas mensajes
        </div>
      </div>
    );
  }

  return (
    <Flexbox className={styles.container}>
      {externalChats.map((chat) => {
        const isActive = activeExternalChatId === chat._id;
        const icon = getChannelIcon(chat.source || 'chat');
        // Obtener preview del último mensaje de la lista de mensajes
        const lastMsg = chat.mensajes?.[chat.mensajes.length - 1]?.mensaje;
        const lastMessagePreview = lastMsg?.slice(0, 50) || 'Sin mensajes';
        const hasUnread = (chat.unreadCount || 0) > 0;

        return (
          <div
            className={cx(styles.chatItem, isActive && 'active')}
            key={chat._id}
            onClick={() => handleChatClick(chat._id, chat.source || 'chat')}
          >
            <div className={styles.chatIcon}>{icon}</div>
            <div className={styles.chatContent}>
              <div className={styles.chatTitle}>
                {chat.contactName || 'Conversación sin título'}
              </div>
              <div className={styles.chatPreview}>{lastMessagePreview}</div>
              <div className={styles.chatMeta}>
                <span>
                  {formatDate(
                    (chat.lastMessageAt || chat.metadata?.fecha_ultima_actividad) as string,
                  )}
                </span>
                {hasUnread && <span className={styles.badge}>{chat.unreadCount}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </Flexbox>
  );
});

ExternalChatsMode.displayName = 'ExternalChatsMode';

export default ExternalChatsMode;
