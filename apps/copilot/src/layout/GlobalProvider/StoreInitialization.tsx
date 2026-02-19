'use client';

import { useRouter } from 'next/navigation';
import { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createStoreUpdater } from 'zustand-utils';

import { enableNextAuth } from '@/const/auth';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { useAgentStore } from '@/store/agent';
import { useAiInfraStore } from '@/store/aiInfra';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';
import { useServerConfigStore } from '@/store/serverConfig';
import { serverConfigSelectors } from '@/store/serverConfig/selectors';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/selectors';

const StoreInitialization = memo(() => {
  // prefetch error ns to avoid don't show error content correctly
  useTranslation('error');

  useTokenRefresh();

  const router = useRouter();
  const [, , useInitUserState] = useUserStore((s) => [
    authSelectors.isLogin(s),
    s.isSignedIn,
    s.useInitUserState,
  ]);

  const { serverConfig: currentServerConfig } = useServerConfigStore();

  const useInitSystemStatus = useGlobalStore((s) => s.useInitSystemStatus);

  const useInitAgentStore = useAgentStore((s) => s.useInitInboxAgentStore);
  const useInitAiProviderKeyVaults = useAiInfraStore((s) => s.useFetchAiProviderRuntimeState);

  const isDBInited = useGlobalStore(systemStatusSelectors.isDBInited);
  const currentIsSignedIn = useUserStore((s) => s.isSignedIn);
  const currentIsLogin = useUserStore(authSelectors.isLogin);
  const isLoginOnInit = isDBInited
    ? Boolean(enableNextAuth ? currentIsSignedIn : currentIsLogin)
    : false;

  useInitAgentStore(isLoginOnInit, currentServerConfig?.defaultAgent?.config);
  useInitAiProviderKeyVaults(isLoginOnInit);
  useInitUserState(isLoginOnInit, currentServerConfig, {
    onSuccess: (_state) => {},
  });

  const useStoreUpdater = createStoreUpdater(useGlobalStore);
  const mobile = useIsMobile();

  useStoreUpdater('isMobile', mobile);
  useStoreUpdater('router', router);

  useInitSystemStatus();

  // Force isUserStateInit=true immediately during render to prevent redirect blocking
  if (typeof window !== 'undefined') {
    const userStore = useUserStore.getState();
    if (!userStore.isUserStateInit) {
      useUserStore.setState({ isUserStateInit: true });
    }
  }

  // Fallback: ensure isUserStateInit is set even if the sync path was skipped
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const userStore = useUserStore.getState();
    if (!userStore.isUserStateInit) {
      useUserStore.setState({ isUserStateInit: true });
    }
  }, []);

  // Deferred non-critical initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initNonCritical = async () => {
      const serverConfigStore =
        typeof window !== 'undefined' && (window as any).global_serverConfigStore
          ? (window as any).global_serverConfigStore
          : null;

      try {
        const { globalService } = await import('@/services/global');
        const config = await globalService.getGlobalConfig();

        if (serverConfigStore) {
          serverConfigStore.setState({
            featureFlags: config.serverFeatureFlags,
            serverConfig: config.serverConfig,
          });
        }
      } catch {
        // globalService already returns a fallback config, no action needed
      }

      const oAuthSSOProviders = serverConfigStore
        ? serverConfigSelectors.oAuthSSOProviders(serverConfigStore.getState())
        : [];
      useUserStore.setState({ oAuthSSOProviders });
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(initNonCritical, { timeout: 10 });
    } else {
      setTimeout(initNonCritical, 10);
    }
  }, [router, useInitAgentStore, useInitAiProviderKeyVaults, useInitUserState]);

  return null;
});

export default StoreInitialization;
