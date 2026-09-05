'use client';

import { ActionIcon } from '@lobehub/ui';
import { Minimize2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, lazy } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

import { resolveChatEmbedMode } from '@/utils/resolveChatEmbedMode';

import { LayoutProps } from '../type';
import ChatHeader from './ChatHeader';
import Portal from './Portal';

const MainInterfaceTracker = lazy(() => import('@/components/Analytics/MainInterfaceTracker'));

const Layout = ({ children, conversation, portal }: LayoutProps) => {
  const searchParams = useSearchParams();
  const isEmbed = resolveChatEmbedMode(
    searchParams,
    typeof window !== 'undefined' ? window : undefined,
  );

  const isFullscreen = useGlobalStore(systemStatusSelectors.isFullscreen);
  const toggleFullscreen = useGlobalStore((s) => s.toggleFullscreen);

  return (
    <>
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
        data-testid="chat-shell"
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
          <Portal>
            {/* ✅ OPTIMIZACIÓN: fallback=null para no mostrar loading intermedio */}
            <Suspense fallback={null}>{portal}</Suspense>
          </Portal>
        )}
      </Flexbox>
      <Suspense fallback={null}>
        <MainInterfaceTracker />
      </Suspense>
    </>
  );
};

Layout.displayName = 'DesktopConversationLayout';

export default Layout;
