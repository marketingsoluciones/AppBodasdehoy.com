import { ReactNode, Suspense } from 'react';

import { LobeAnalyticsProviderWrapper } from '@/components/Analytics/LobeAnalyticsProviderWrapper';
import { getServerFeatureFlagsValue } from '@/config/featureFlags';
import { appEnv } from '@/envs/app';
import DevPanelWrapper from '@/features/DevPanel/DevPanelWrapper';
import CaptationProvider from '@/providers/CaptationProvider';
import { getServerGlobalConfig } from '@/server/globalConfig';
import { ServerConfigStoreProvider } from '@/store/serverConfig/Provider';
import { getAntdLocale } from '@/utils/locale';

import AntdV5MonkeyPatch from './AntdV5MonkeyPatch';
import ApolloProviderWrapper from './Apollo';
import AppTheme from './AppTheme';
import ImportSettings from './ImportSettings';
import Locale from './Locale';
import QueryProvider from './Query';
import StoreInitialization from './StoreInitialization';
import StyleRegistry from './StyleRegistry';

interface GlobalLayoutProps {
  appearance: string;
  children: ReactNode;
  isMobile: boolean;
  locale: string;
  neutralColor?: string;
  primaryColor?: string;
  variants?: string;
}

const GlobalLayout = async ({
  children,
  neutralColor,
  primaryColor,
  locale: userLocale,
  appearance,
  isMobile,
  variants,
}: GlobalLayoutProps) => {
  const SSR_FAST_TIMEOUT_MS = 200;

  const antdLocalePromise = Promise.race([
    getAntdLocale(userLocale),
    new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), SSR_FAST_TIMEOUT_MS)),
  ]).catch(() => undefined);

  // get default feature flags to use with ssr
  const serverFeatureFlags = getServerFeatureFlagsValue();

  const serverConfigPromise = Promise.race([
    getServerGlobalConfig(),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), SSR_FAST_TIMEOUT_MS)),
  ]).catch(() => null);

  const [antdLocale, serverConfigResult] = await Promise.all([antdLocalePromise, serverConfigPromise]);

  let serverConfig = serverConfigResult as any;

  // Si no se obtuvo configuración, usar valores por defecto mínimos
  if (!serverConfig) {
    serverConfig = {
      aiProvider: {},
      defaultAgent: { config: {} },
      enableUploadFileToServer: false,
      enabledAccessCode: false,
      enabledOAuthSSO: false,
      image: {},
      languageModel: {},
      oAuthSSOProviders: [],
      systemAgent: {},
      telemetry: { langfuse: false },
    };

    // Cargar configuración completa en background (no bloquea)
    getServerGlobalConfig().catch(err => {
      console.warn('⚠️ [GlobalLayout] Error cargando serverConfig en background:', err);
    });
  }

  return (
    <StyleRegistry>
      <Locale antdLocale={antdLocale} defaultLang={userLocale}>
        <AppTheme
          customFontFamily={appEnv.CUSTOM_FONT_FAMILY}
          customFontURL={appEnv.CUSTOM_FONT_URL}
          defaultAppearance={appearance}
          defaultNeutralColor={neutralColor as any}
          defaultPrimaryColor={primaryColor as any}
          globalCDN={appEnv.CDN_USE_GLOBAL}
        >
          <ServerConfigStoreProvider
            featureFlags={serverFeatureFlags}
            isMobile={isMobile}
            segmentVariants={variants}
            serverConfig={serverConfig}
          >
            <QueryProvider>
              <ApolloProviderWrapper>
                <CaptationProvider>
                  <LobeAnalyticsProviderWrapper>{children}</LobeAnalyticsProviderWrapper>
                </CaptationProvider>
              </ApolloProviderWrapper>
            </QueryProvider>
            <StoreInitialization />
            <Suspense fallback={null}>
              <ImportSettings />
              {process.env.NODE_ENV === 'development' && <DevPanelWrapper />}
            </Suspense>
          </ServerConfigStoreProvider>
        </AppTheme>
      </Locale>
      <AntdV5MonkeyPatch />
    </StyleRegistry>
  );
};

export default GlobalLayout;
