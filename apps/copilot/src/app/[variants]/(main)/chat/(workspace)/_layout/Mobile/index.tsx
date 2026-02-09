import { Suspense, lazy } from 'react';
import MainInterfaceTracker from '@/components/Analytics/MainInterfaceTracker';
import MobileContentLayout from '@/components/server/MobileNavLayout';
import { EventosAutoAuth } from '@/features/EventosAutoAuth';
import { CopilotBridgeListener } from '@/features/CopilotBridgeListener';

import { LayoutProps } from '../type';
import ChatHeader from './ChatHeader';
import TopicModal from './TopicModal';

// Lazy load para componente no crítico
const PendingIntentModal = lazy(() => import('@/features/PendingIntentModal'));

const Layout = ({ children, topic, conversation, portal }: LayoutProps) => {
  return (
    <>
      <EventosAutoAuth />
      <CopilotBridgeListener />
      {/* Modal para continuar conversación después del login */}
      <Suspense fallback={null}>
        <PendingIntentModal />
      </Suspense>
      <MobileContentLayout header={<ChatHeader />} style={{ overflowY: 'hidden' }}>
        {conversation}
        {children}
      </MobileContentLayout>
      <TopicModal>{topic}</TopicModal>
      {portal}
      <MainInterfaceTracker />
    </>
  );
};

Layout.displayName = 'MobileConversationLayout';

export default Layout;
