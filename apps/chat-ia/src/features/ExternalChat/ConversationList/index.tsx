'use client';

import { createStyles } from 'antd-style';
import React, { memo, useEffect } from 'react';
import { Flexbox, Center } from 'react-layout-kit';
import { Loader2Icon } from 'lucide-react';
import { Icon } from '@lobehub/ui';

import { useChatStore } from '@/store/chat';
import { externalChatSelectors } from '@/store/chat/selectors';

import ConversationItem from './ConversationItem';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    overflow-y: auto;
    border-radius: ${token.borderRadius}px;
    background: ${token.colorBgContainer};
  `,
  emptyState: css`
    color: ${token.colorTextSecondary};
  `,
  loadingContainer: css`
    padding: ${token.paddingLG}px;
  `,
}));

const ExternalConversationList = memo(() => {
  const { styles } = useStyles();

  const [chats, isLoading, isInit, fetchChats] = useChatStore((s) => [
    externalChatSelectors.sortedExternalChats(s),
    externalChatSelectors.isExternalChatsLoading(s),
    externalChatSelectors.isExternalChatsInit(s),
    s.fetchExternalChats,
  ]);

  // Cargar chats al montar el componente
  useEffect(() => {
    if (!isInit && !isLoading) {
      fetchChats();
    }
  }, [isInit, isLoading, fetchChats]);

  // Refrescar cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchChats();
    }, 30_000);

    return () => clearInterval(interval);
  }, [fetchChats]);

  // Estado de carga inicial
  if (isLoading && !isInit) {
    return (
      <Center className={styles.loadingContainer} width={'100%'}>
        <Icon icon={Loader2Icon} size={24} spin />
      </Center>
    );
  }

  // Estado vacío
  if (chats.length === 0 && isInit) {
    return (
      <Center className={styles.emptyState} height={'100%'} width={'100%'}>
        <Flexbox align={'center'} gap={8}>
          <span style={{ fontSize: 48 }}>💬</span>
          <p>Sin conversaciones</p>
        </Flexbox>
      </Center>
    );
  }

  return (
    <Flexbox className={styles.container} flex={1} width={'100%'}>
      {chats.map((chat) => (
        <ConversationItem chat={chat} key={chat._id} />
      ))}
    </Flexbox>
  );
});

ExternalConversationList.displayName = 'ExternalConversationList';

export default ExternalConversationList;









