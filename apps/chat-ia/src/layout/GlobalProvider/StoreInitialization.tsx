'use client';

import { startSessionRefresh } from '@bodasdehoy/shared';
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

  // FASE 1 auth (fallback FB-2 de la auditoría 28-jul): refresco CENTRAL y proactivo de la
  // cookie SSO `idTokenV0.1.0`. Antes SOLO appEventos la refrescaba (SocketContext), así que
  // en chat-ia el token de 1 h moría dentro de la cookie de 30 d → sesión "muerta" en silencio.
  // Ahora chat-ia también la mantiene al día vía el primitivo compartido startSessionRefresh
  // (onIdTokenChanged + timer proactivo). Import diferido de firebase para no romper SSR.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let stop: (() => void) | undefined;
    (async () => {
      try {
        const { auth } = await import('@/libs/firebase');
        if (auth) stop = startSessionRefresh(auth as any);
      } catch (e) {
        console.warn('[StoreInitialization] no se pudo arrancar el refresco de sesión central:', e);
      }
    })();
    return () => stop?.();
  }, []);

  const router = useRouter();
  const useInitUserState = useUserStore((s) => s.useInitUserState);

  // QA 30-jun: hook puede devolver state parcial (sin serverConfig) tras un
  // setState fallido en initNonCritical. Destructuring strict → crash UI.
  const serverConfigState = useServerConfigStore();
  const currentServerConfig = serverConfigState?.serverConfig;

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
    onSuccess: () => {},
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

        // QA 30-jun: NO sobrescribir con undefined — si config no trae
        // serverConfig/serverFeatureFlags el store queda parcial y todos los
        // selectors crashean. Solo aplicar las claves que sí vienen.
        if (serverConfigStore && config) {
          const patch: Record<string, unknown> = {};
          if (config.serverFeatureFlags) patch.featureFlags = config.serverFeatureFlags;
          if (config.serverConfig) patch.serverConfig = config.serverConfig;
          if (Object.keys(patch).length > 0) serverConfigStore.setState(patch);
        }
      } catch {
        // globalService already returns a fallback config, no action needed
      }

      // QA 30-jun: state puede estar parcial; nunca pasar undefined al selector.
      let oAuthSSOProviders: string[] = [];
      try {
        const state = serverConfigStore?.getState?.();
        if (state?.serverConfig) {
          oAuthSSOProviders = serverConfigSelectors.oAuthSSOProviders(state) ?? [];
        }
      } catch {
        oAuthSSOProviders = [];
      }
      useUserStore.setState({ oAuthSSOProviders });
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(initNonCritical, { timeout: 2000 });
    } else {
      setTimeout(initNonCritical, 2000);
    }
  }, [router, useInitAgentStore, useInitAiProviderKeyVaults, useInitUserState]);

  return null;
});

export default StoreInitialization;
