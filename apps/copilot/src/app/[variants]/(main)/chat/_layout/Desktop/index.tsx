'use client';

import { Suspense, lazy } from 'react';
import { useSearchParams } from 'next/navigation';
import { Flexbox } from 'react-layout-kit';

import ReloginBanner from '@/components/ReloginBanner';
import { isDesktop } from '@/const/version';
import InitClientDB from '@/features/InitClientDB';
import ProtocolUrlHandler from '@/features/ProtocolUrlHandler';
import { EventosAutoAuth } from '@/features/EventosAutoAuth';
import { CopilotBridgeListener } from '@/features/CopilotBridgeListener';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

import { LayoutProps } from '../type';
import RegisterHotkeys from './RegisterHotkeys';
import SessionPanel from './SessionPanel';
import Workspace from './Workspace';

// Lazy load para componente no crítico
const PendingIntentModal = lazy(() => import('@/features/PendingIntentModal'));

const Layout = ({ children, session }: LayoutProps) => {
  const searchParams = useSearchParams();
  let isInIframe = false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  } catch {
    isInIframe = true;
  }

  const isEmbed =
    isInIframe ||
    searchParams?.get('embed') === '1' ||
    searchParams?.get('embedded') === '1' ||
    searchParams?.get('minimal') === '1';

  const isFullscreen = useGlobalStore(systemStatusSelectors.isFullscreen);

  return (
    <>
      <EventosAutoAuth />
      <CopilotBridgeListener />
      {!isEmbed && <ReloginBanner />}
      {/* Modal para continuar conversación después del login */}
      {!isEmbed && (
        <Suspense fallback={null}>
          <PendingIntentModal />
        </Suspense>
      )}
      <Flexbox
        height={'100%'}
        horizontal
        style={{ maxWidth: '100%', overflow: 'hidden', position: 'relative' }}
        width={'100%'}
      >
        {/* En modo embed ocultamos el panel izquierdo (sessions) para dejar solo conversación + input */}
        {!isEmbed && !isFullscreen && <SessionPanel>{session}</SessionPanel>}
        <Workspace>{children}</Workspace>
      </Flexbox>
      {!isDesktop && <InitClientDB bottom={60} />}
      {/* ↓ cloud slot ↓ */}

      {/* ↑ cloud slot ↑ */}
      {!isEmbed && (
        <Suspense fallback={null}>
          <RegisterHotkeys />
        </Suspense>
      )}
      {isDesktop && <ProtocolUrlHandler />}
    </>
  );
};

Layout.displayName = 'DesktopChatLayout';

export default Layout;
