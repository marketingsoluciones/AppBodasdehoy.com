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

import { resolveChatEmbedMode } from '@/utils/resolveChatEmbedMode';

import { LayoutProps } from '../type';
import RegisterHotkeys from './RegisterHotkeys';
import SessionPanel from './SessionPanel';
import Workspace from './Workspace';

// Lazy load para componente no crítico
const PendingIntentModal = lazy(() => import('@/features/PendingIntentModal'));
const InsufficientBalanceModal = lazy(() => import('@/features/InsufficientBalanceModal'));
const LoginRequiredModal = lazy(() => import('@/features/LoginRequiredModal'));
const NegativeBalanceBanner = lazy(() => import('@/components/Wallet/NegativeBalanceBanner'));

const Layout = ({ children, session }: LayoutProps) => {
  const searchParams = useSearchParams();
  const isEmbed = resolveChatEmbedMode(
    searchParams,
    typeof window !== 'undefined' ? window : undefined,
  );

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
      {/* Modal de saldo insuficiente - se abre automáticamente con errores 402 */}
      <Suspense fallback={null}>
        <InsufficientBalanceModal />
      </Suspense>
      {/* Modal de login requerido - se abre automáticamente con errores 401 (community users) */}
      <Suspense fallback={null}>
        <LoginRequiredModal />
      </Suspense>
      {/* Contenedor en columna: banner modo crédito horizontal arriba, luego contenido del chat */}
      <Flexbox
        height={'100%'}
        style={{ flexDirection: 'column', maxWidth: '100%', overflow: 'hidden', position: 'relative' }}
        width={'100%'}
      >
        {/* Banner de modo crédito (saldo negativo) — horizontal, justo encima del contenido */}
        <Suspense fallback={null}>
          <NegativeBalanceBanner />
        </Suspense>
        <Flexbox
          flex={1}
          height={'100%'}
          style={{ flexDirection: 'row', minHeight: 0, overflow: 'hidden', position: 'relative' }}
          width={'100%'}
        >
          {/* En modo embed ocultamos el panel izquierdo (sessions) para dejar solo conversación + input */}
          {!isEmbed && !isFullscreen && <SessionPanel>{session}</SessionPanel>}
          <Workspace>{children}</Workspace>
        </Flexbox>
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
