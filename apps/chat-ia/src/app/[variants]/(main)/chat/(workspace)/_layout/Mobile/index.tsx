import { Suspense, lazy } from 'react';
import MobileContentLayout from '@/components/server/MobileNavLayout';
import { EventosAutoAuth } from '@/features/EventosAutoAuth';
import { withSuspense } from '@/components/withSuspense';

import { LayoutProps } from '../type';
import ChatHeader from './ChatHeader';

// Lazy load para componente no crítico
const PendingIntentModal = lazy(() => import('@/features/PendingIntentModal'));
const CopilotBridgeListener = lazy(() => import('@/features/CopilotBridgeListener'));
const MainInterfaceTracker = lazy(() => import('@/components/Analytics/MainInterfaceTracker'));

const Layout = ({ children, conversation, portal }: LayoutProps) => {
  return (
    <>
      <EventosAutoAuth />
      <Suspense fallback={null}>
        <CopilotBridgeListener />
      </Suspense>
      {/* Modal para continuar conversación después del login */}
      <Suspense fallback={null}>
        <PendingIntentModal />
      </Suspense>
      <MobileContentLayout data-testid="chat-shell" header={<ChatHeader />} style={{ overflowY: 'hidden' }}>
        {conversation}
        {children}
      </MobileContentLayout>
      {portal}
      <Suspense fallback={null}>
        <MainInterfaceTracker />
      </Suspense>
    </>
  );
};

Layout.displayName = 'MobileConversationLayout';

export default withSuspense(Layout);
