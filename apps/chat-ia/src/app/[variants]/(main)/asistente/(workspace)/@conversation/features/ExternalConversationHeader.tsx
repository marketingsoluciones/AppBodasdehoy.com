'use client';

import { createStyles } from 'antd-style';
import { memo } from 'react';

import ChannelIcon from '../../../@session/features/SessionListContent/ConversationHistory/ChannelIcon';

const getChannelType = (
  channel: string,
): 'whatsapp' | 'instagram' | 'facebook' | 'telegram' | 'web' => {
  const channelLower = channel.toLowerCase();
  if (channelLower.includes('whatsapp')) return 'whatsapp';
  if (channelLower.includes('instagram')) return 'instagram';
  if (channelLower.includes('facebook')) return 'facebook';
  if (channelLower.includes('telegram')) return 'telegram';
  return 'web';
};

const useStyles = createStyles(({ css, token }) => ({
  header: css`
    position: sticky;
    z-index: 10;
    inset-block-start: 0;

    display: flex;
    gap: 12px;
    align-items: center;

    padding-block: 12px;
    padding-inline: 16px;
    border-block-end: 1px solid ${token.colorBorder};

    background: ${token.colorBgContainer};
    background: ${token.colorBgContainer}dd;
    backdrop-filter: blur(8px);
  `,
  info: css`
    flex: 1;
    min-width: 0;
  `,
  meta: css`
    margin-block-start: 2px;
    font-size: 12px;
    color: ${token.colorTextTertiary};
  `,
  title: css`
    overflow: hidden;

    margin: 0;

    font-size: 14px;
    font-weight: 600;
    color: ${token.colorText};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
}));

interface ExternalConversationHeaderProps {
  channel: string;
  conversationName?: string;
  messageCount: number;
}

const ExternalConversationHeader = memo<ExternalConversationHeaderProps>(
  ({ channel, messageCount, conversationName }) => {
    const { styles } = useStyles();

    const channelType = getChannelType(channel);
    const channelNames: Record<string, string> = {
      facebook: 'Facebook',
      instagram: 'Instagram',
      telegram: 'Telegram',
      web: 'Web',
      whatsapp: 'WhatsApp',
    };

    return (
      <div className={styles.header}>
        <ChannelIcon canal={channelType} />
        <div className={styles.info}>
          <h3 className={styles.title}>
            {conversationName || `Conversación ${channelNames[channelType] || channel}`}
          </h3>
          <div className={styles.meta}>
            {messageCount} {messageCount === 1 ? 'mensaje' : 'mensajes'}
          </div>
        </div>
      </div>
    );
  }
);

ExternalConversationHeader.displayName = 'ExternalConversationHeader';

export default ExternalConversationHeader;

