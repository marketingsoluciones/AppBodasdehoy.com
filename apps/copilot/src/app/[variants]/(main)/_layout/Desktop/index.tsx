'use client';

import { useTheme } from 'antd-style';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { PropsWithChildren, Suspense, memo } from 'react';
import { HotkeysProvider } from 'react-hotkeys-hook';
import { Flexbox } from 'react-layout-kit';

import { isDesktop } from '@/const/version';
import { BANNER_HEIGHT } from '@/features/AlertBanner/CloudBanner';
import TitleBar, { TITLE_BAR_HEIGHT } from '@/features/ElectronTitlebar';
import HotkeyHelperPanel from '@/features/HotkeyHelperPanel';
import { usePlatform } from '@/hooks/usePlatform';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { HotkeyScopeEnum } from '@/types/hotkey';

import DesktopLayoutContainer from './DesktopLayoutContainer';
import RegisterHotkeys from './RegisterHotkeys';
import SideBar from './SideBar';

const CloudBanner = dynamic(() => import('@/features/AlertBanner/CloudBanner'));

const Layout = memo<PropsWithChildren>(({ children }) => {
  const searchParams = useSearchParams();
  // Detectar modo embebido:
  // - por query (?embed=1)
  // - o por estar dentro de un iframe (más robusto, algunos routers limpian query params)
  let isInIframe = false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  } catch {
    // Si hay error de cross-origin, asumimos que está embebido
    isInIframe = true;
  }

  const isEmbed =
    isInIframe ||
    searchParams?.get('embed') === '1' ||
    searchParams?.get('embedded') === '1' ||
    searchParams?.get('minimal') === '1';

  const { isPWA } = usePlatform();
  const theme = useTheme();

  const { showCloudPromotion } = useServerConfigStore(featureFlagsSelectors);

  // Modo embed: ocultar SideBar y elementos no esenciales.
  if (isEmbed) {
    return (
      <HotkeysProvider initiallyActiveScopes={[HotkeyScopeEnum.Global]}>
        <Flexbox
          height="100%"
          horizontal
          style={{
            borderTop: isPWA ? `1px solid ${theme.colorBorder}` : undefined,
            position: 'relative',
          }}
          width="100%"
        >
          {/* En embed quitamos el rail lateral, pero mantenemos contenedores base */}
          {isDesktop ? <DesktopLayoutContainer>{children}</DesktopLayoutContainer> : children}
        </Flexbox>
      </HotkeysProvider>
    );
  }

  return (
    <HotkeysProvider initiallyActiveScopes={[HotkeyScopeEnum.Global]}>
      {isDesktop && <TitleBar />}
      {showCloudPromotion && <CloudBanner />}
      <Flexbox
        height={
          isDesktop
            ? `calc(100% - ${TITLE_BAR_HEIGHT}px)`
            : showCloudPromotion
              ? `calc(100% - ${BANNER_HEIGHT}px)`
              : '100%'
        }
        horizontal
        style={{
          borderTop: isPWA ? `1px solid ${theme.colorBorder}` : undefined,
          position: 'relative',
        }}
        width={'100%'}
      >
        {isDesktop ? (
          <DesktopLayoutContainer>{children}</DesktopLayoutContainer>
        ) : (
          <>
            <Suspense>
              <SideBar />
            </Suspense>
            {children}
          </>
        )}
      </Flexbox>
      <HotkeyHelperPanel />
      <Suspense fallback={null}>
        <RegisterHotkeys />
      </Suspense>
    </HotkeysProvider>
  );
});

Layout.displayName = 'DesktopMainLayout';

export default Layout;
