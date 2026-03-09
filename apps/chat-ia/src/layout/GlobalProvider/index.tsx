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
  // ✅ SOLUCIÓN RÁPIDA: No bloquear en getAntdLocale, usar timeout de 500ms
  let antdLocale;
  try {
    antdLocale = await Promise.race([
      getAntdLocale(userLocale),
      new Promise((resolve) => {
        setTimeout(() => {
          // Si tarda más de 500ms, usar locale por defecto (se cargará en cliente)
          resolve(undefined);
        }, 500);
      })
    ]) as any;
  } catch (error) {
    console.warn('⚠️ [GlobalLayout] Error obteniendo antdLocale, usando undefined (se cargará en cliente):', error);
    antdLocale = undefined;
  }

  // get default feature flags to use with ssr
  const serverFeatureFlags = getServerFeatureFlagsValue();

  // ✅ SOLUCIÓN RÁPIDA: No esperar getServerGlobalConfig, usar valores por defecto y cargar en background
  // Esto evita que bloquee el render del servidor
  let serverConfig;
  try {
    // Intentar obtener con timeout muy corto (500ms)
    serverConfig = await Promise.race([
      getServerGlobalConfig(),
      new Promise((resolve) => {
        setTimeout(() => {
          // Si tarda más de 500ms, usar configuración mínima
          resolve(null);
        }, 500);
      })
    ]) as any;
  } catch (error) {
    console.warn('⚠️ [GlobalLayout] Error obteniendo serverConfig, usando valores por defecto:', error);
    serverConfig = null;
  }

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
              <DevPanelWrapper />
            </Suspense>
          </ServerConfigStoreProvider>
        </AppTheme>
      </Locale>
      <AntdV5MonkeyPatch />
    </StyleRegistry>
  );
};

export default GlobalLayout;
