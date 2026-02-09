'use client';

import React, { memo, useCallback, useEffect } from 'react';

import { SkeletonList, VirtualizedList } from '@/features/Conversation';
import WideScreenContainer from '@/features/Conversation/components/WideScreenContainer';
import { useFetchMessages } from '@/hooks/useFetchMessages';
import { useChatStore } from '@/store/chat';
import { chatSelectors } from '@/store/chat/selectors';

import MainChatItem from './ChatItem';
import Welcome from './WelcomeChatItem';

interface ListProps {
  mobile?: boolean;
}

const Content = memo<ListProps>(({ mobile }) => {
  const [isCurrentChatLoaded] = useChatStore((s) => [chatSelectors.isCurrentChatLoaded(s)]);
  const activeId = useChatStore((s) => s.activeId);
  const messagesInit = useChatStore((s) => s.messagesInit);

  useFetchMessages();
  const data = useChatStore(chatSelectors.mainDisplayChatIDs);

  // Debug logging para diagnosticar el problema de reset
  // Solo logueamos en cliente (typeof window !== 'undefined')
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('📊 [ChatList/Content] Estado actual:', {
        activeId,
        isClient: true,
        isCurrentChatLoaded,
        messagesCount: data.length,
        messagesInit,
        timestamp: new Date().toISOString(),
      });
    }
  }, [activeId, isCurrentChatLoaded, data.length, messagesInit]);

  const itemContent = useCallback(
    (index: number, id: string) => <MainChatItem id={id} index={index} />,
    [mobile],
  );

  // Solo loguear en cliente para evitar spam en SSR
  const isClient = typeof window !== 'undefined';

  if (!isCurrentChatLoaded) {
    if (isClient)
      console.log('⏳ [ChatList/Content] Mostrando skeleton - chat no cargado', {
        activeId,
        messagesInit,
      });
    return <SkeletonList mobile={mobile} />;
  }

  if (data.length === 0) {
    if (isClient)
      console.log('👋 [ChatList/Content] Mostrando Welcome - sin mensajes', {
        activeId,
        isCurrentChatLoaded,
      });
    return (
      <WideScreenContainer flex={1} height={'100%'}>
        <Welcome />
      </WideScreenContainer>
    );
  }

  if (isClient) console.log(`💬 [ChatList/Content] Mostrando ${data.length} mensajes`);
  return <VirtualizedList dataSource={data} itemContent={itemContent} mobile={mobile} />;
});

Content.displayName = 'ChatListRender';

export default Content;
