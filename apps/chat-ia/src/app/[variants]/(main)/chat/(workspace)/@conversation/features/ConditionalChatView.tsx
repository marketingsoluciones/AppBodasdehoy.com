'use client';

import { memo } from 'react';

import ChatInput from './ChatInput';
import ChatList from './ChatList';
import ExternalConversationView, { useExternalConversation } from './ExternalConversationView';

interface ConditionalChatViewProps {
  mobile: boolean;
}

/**
 * Componente que decide qué mostrar: conversación externa o chat normal de Lobe Chat
 */
export const ConditionalChatView = memo<ConditionalChatViewProps>(({ mobile }) => {
  const { isExternalConversation } = useExternalConversation();

  return isExternalConversation ? (
    <ExternalConversationView />
  ) : (
    <>
      {/* Mostrar chat normal de Lobe Chat */}
      <ChatList mobile={mobile} />
      <ChatInput mobile={mobile} />
    </>
  );
});

ConditionalChatView.displayName = 'ConditionalChatView';

export default ConditionalChatView;

