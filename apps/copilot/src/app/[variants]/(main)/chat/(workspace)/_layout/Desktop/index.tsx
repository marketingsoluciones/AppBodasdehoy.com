'use client';

import { ActionIcon } from '@lobehub/ui';
import { Minimize2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Flexbox } from 'react-layout-kit';

import MainInterfaceTracker from '@/components/Analytics/MainInterfaceTracker';
import { EventosAutoAuth } from '@/features/EventosAutoAuth';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

import { LayoutProps } from '../type';
import ChatHeader from './ChatHeader';
import Portal from './Portal';
import TopicPanel from './TopicPanel';

const Layout = ({ children, topic, conversation, portal }: LayoutProps) => {
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
  const toggleFullscreen = useGlobalStore((s) => s.toggleFullscreen);

  return (
    <>
      <EventosAutoAuth />
      {/* En embed queremos solo conversación + input (sin header/paneles) */}
      {!isEmbed && !isFullscreen && <ChatHeader />}
      {/* Floating exit button when in fullscreen */}
      {isFullscreen && (
        <ActionIcon
          icon={Minimize2}
          onClick={() => toggleFullscreen(false)}
          size="large"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            borderRadius: '50%',
            color: 'white',
            position: 'fixed',
            right: 16,
            top: 16,
            zIndex: 1000,
          }}
          title="Salir de pantalla completa"
        />
      )}
      <Flexbox
        height={'100%'}
        horizontal
        style={{ overflow: 'hidden', position: 'relative' }}
        width={'100%'}
      >
        <Flexbox
          height={'100%'}
          style={{ overflow: 'hidden', position: 'relative' }}
          width={'100%'}
        >
          {conversation}
        </Flexbox>
        {children}
        {!isEmbed && !isFullscreen && (
          <>
            <Portal>
              {/* ✅ OPTIMIZACIÓN: fallback=null para no mostrar loading intermedio */}
              <Suspense fallback={null}>{portal}</Suspense>
            </Portal>
            <TopicPanel>{topic}</TopicPanel>
          </>
        )}
      </Flexbox>
      <MainInterfaceTracker />
    </>
  );
};

Layout.displayName = 'DesktopConversationLayout';

export default Layout;
