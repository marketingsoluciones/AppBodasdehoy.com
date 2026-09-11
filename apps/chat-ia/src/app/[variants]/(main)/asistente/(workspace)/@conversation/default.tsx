import { DynamicLayoutProps } from '@/types/next';
import { RouteVariants } from '@/utils/server/routeVariants';
import { EventosAutoAuth } from '@/features/EventosAutoAuth';

import ConditionalChatView from './features/ConditionalChatView';
import ConditionalHydration from './features/ConditionalHydration';
import ZenModeToast from './features/ZenModeToast';

const ChatConversation = async (props: DynamicLayoutProps) => {
  const isMobile = await RouteVariants.getIsMobile(props);

  return (
    <>
      <EventosAutoAuth />
      <ZenModeToast />
      <ConditionalChatView mobile={isMobile} />
      <ConditionalHydration />
    </>
  );
};

ChatConversation.displayName = 'ChatConversation';

export default ChatConversation;
