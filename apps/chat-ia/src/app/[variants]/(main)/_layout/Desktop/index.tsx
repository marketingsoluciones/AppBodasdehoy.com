'use client';

import { useTheme } from 'antd-style';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { PropsWithChildren, Suspense, memo } from 'react';
import { HotkeysProvider } from 'react-hotkeys-hook';
import { Flexbox } from 'react-layout-kit';

import { isDesktop } from '@/const/version';
import { BANNER_HEIGHT } from '@/features/AlertBanner/CloudBanner';
// SPRINT-G 2026-05-19: TitleBar import dynamic + ssr:false — solo se renderiza si isDesktop,
// pero antes era static y arrastraba @lobechat/electron-client-ipc + 39 archivos al bundle web.
import { TITLE_BAR_HEIGHT } from '@/features/ElectronTitlebar/const';
import { useCrossAppActiveEventSync } from '@/hooks/useCrossAppActiveEventSync';
import { usePlatform } from '@/hooks/usePlatform';
import { useStickyEventPerSession } from '@/hooks/useStickyEventPerSession';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { HotkeyScopeEnum } from '@/types/hotkey';

import { resolveChatEmbedMode } from '@/utils/resolveChatEmbedMode';
import { hydrateDomainConfigFromCookie } from '@/utils/domainSessionBridge';

import DesktopLayoutContainer from './DesktopLayoutContainer';
import RegisterHotkeys from './RegisterHotkeys';
import SideBar from './SideBar';

const CloudBanner = dynamic(() => import('@/features/AlertBanner/CloudBanner'));
const TitleBar = dynamic(() => import('@/features/ElectronTitlebar'), { ssr: false });
// SPRINT-X 2026-05-20: HotkeyHelperPanel usa Modal + Grid + Segmented de @lobehub/ui —
// solo se abre cuando user presiona Cmd+/ → dynamic ssr:false saca Modal del bundle inicial.
const HotkeyHelperPanel = dynamic(() => import('@/features/HotkeyHelperPanel'), { ssr: false });

const Layout = memo<PropsWithChildren>(({ children }) => {
  // P0 sesión coherente (QA 15-ago): sembrar localStorage desde la cookie SSO ANTES
  // de que rendericen los hijos (SideBar/UserInfo) y EventosAutoAuth, para cerrar la
  // ventana de "Visitante"/gate-invitado en llegada por SSO. Idempotente + no-op en
  // sesión caliente (ver domainSessionBridge). Corre en cliente (guard interno SSR).
  hydrateDomainConfigFromCookie();

  const searchParams = useSearchParams();
  const isEmbed = resolveChatEmbedMode(
    searchParams,
    typeof window !== 'undefined' ? window : undefined,
  );

  const { isPWA } = usePlatform();
  const theme = useTheme();

  useCrossAppActiveEventSync();
  useStickyEventPerSession();

  // QA 30-jun: si StoreInitialization llega a hacer setState con featureFlags=undefined
  // (caso `getGlobalConfig` retorna serverFeatureFlags=undefined), el selector devuelve
  // undefined y el destructuring crashea la página entera. Defensa: empty obj fallback.
  const featureFlags = useServerConfigStore(featureFlagsSelectors) || {};
  const showCloudPromotion = (featureFlags as any).showCloudPromotion === true;

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
