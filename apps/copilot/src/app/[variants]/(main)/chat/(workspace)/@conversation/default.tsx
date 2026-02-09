import { DynamicLayoutProps } from '@/types/next';
import { RouteVariants } from '@/utils/server/routeVariants';
import { EventosAutoAuth } from '@/features/EventosAutoAuth';

import ChatHydration from './features/ChatHydration';
import ConditionalChatView from './features/ConditionalChatView';
import ThreadHydration from './features/ThreadHydration';
import ZenModeToast from './features/ZenModeToast';

const ChatConversation = async (props: DynamicLayoutProps) => {
  const isMobile = await RouteVariants.getIsMobile(props);

  return (
    <>
      <EventosAutoAuth />
      <ZenModeToast />
      <ConditionalChatView mobile={isMobile} />
      <ChatHydration />
      <ThreadHydration />
    </>
  );
};

ChatConversation.displayName = 'ChatConversation';

export default ChatConversation;
