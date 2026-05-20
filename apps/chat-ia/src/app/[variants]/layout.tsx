import '@/styles/tailwind.css';

import { SpeedInsights } from '@vercel/speed-insights/next';
import { ThemeAppearance } from 'antd-style';
import { ResolvingViewport } from 'next';
import nextDynamic from 'next/dynamic';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { ReactNode } from 'react';
import { isRtlLang } from 'rtl-detect';

import LoginModal from '@/components/LoginModal';
import { DEFAULT_LANG } from '@/const/locale';
import { isDesktop } from '@/const/version';
import { LoginModalProvider } from '@/contexts/LoginModalContext';
import AuthProvider from '@/layout/AuthProvider';
import GlobalProvider from '@/layout/GlobalProvider';

// SPRINT-Z2 revertido SPRINT-AG: layout.tsx es Server Component — next/dynamic ssr:false
// NO está permitido. Dynamic sin ssr permite SSR pero sigue generando chunk separado
// → bundle inicial más ligero, sin crash RSC.
const Analytics = nextDynamic(() => import('@/components/Analytics'), {});
const TrackingCapture = nextDynamic(() => import('@/components/TrackingCapture'), {});
const DeveloperTheme = nextDynamic(() => import('@/components/DeveloperTheme'), {});
const DynamicFavicon = nextDynamic(() => import('@/components/DynamicFavicon'), {});
const PWAInstall = nextDynamic(() => import('@/features/PWAInstall'), {});
import { Locales } from '@/locales/resources';
import { DynamicLayoutProps } from '@/types/next';
import { RouteVariants } from '@/utils/server/routeVariants';

const inVercel = process.env.VERCEL === '1';

interface RootLayoutProps extends DynamicLayoutProps {
  children: ReactNode;
  modal: ReactNode;
}

const RootLayout = async ({ children, params, modal }: RootLayoutProps) => {
  let locale: Locales = DEFAULT_LANG;
  let isMobile = false;
  let theme: ThemeAppearance = 'light';
  let primaryColor: string | undefined;
  let neutralColor: string | undefined;
  let variants: string = '';

  try {
    const paramsData = await params;
    variants = paramsData.variants;

    const deserialized = RouteVariants.deserializeVariants(variants);
    locale = deserialized.locale;
    isMobile = deserialized.isMobile;
    theme = deserialized.theme;
    primaryColor = deserialized.primaryColor;
    neutralColor = deserialized.neutralColor;
  } catch (error) {
    console.error('❌ Error deserializing variants in RootLayout:', error);
    console.error('   Variants received:', variants);
    // Usar valores por defecto si falla
    locale = DEFAULT_LANG;
    isMobile = false;
    theme = 'light';
  }

  const direction = isRtlLang(locale) ? 'rtl' : 'ltr';

  // URLs de APIs externas para preconnect
  const backendUrl =
    process.env.NEXT_PUBLIC_API_IA_URL || 'https://api-ia.bodasdehoy.com';
  const mcpUrl = 'https://api-mcp.eventosorganizador.com';

  return (
    <div dir={direction} lang={locale} style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }} suppressHydrationWarning>
      <NuqsAdapter>
          <GlobalProvider
            appearance={theme}
            isMobile={isMobile}
            locale={locale}
            neutralColor={neutralColor}
            primaryColor={primaryColor}
            variants={variants}
          >
            <DynamicFavicon />
            <DeveloperTheme />
            <LoginModalProvider>
              <AuthProvider>
                {children}
                {!isMobile && modal}
              </AuthProvider>
              <LoginModal />
            </LoginModalProvider>
            <PWAInstall />
          </GlobalProvider>
        </NuqsAdapter>
      <TrackingCapture />
      <Analytics />
      {inVercel && <SpeedInsights />}
    </div>
  );
};

export default RootLayout;

export { generateMetadata } from './metadata';

export const generateViewport = async (props: RootLayoutProps): ResolvingViewport => {
  try {
    const isMobile = await RouteVariants.getIsMobile(props);

    const dynamicScale = isMobile ? { maximumScale: 1, userScalable: false } : {};

    return {
      ...dynamicScale,
      colorScheme: 'dark light',
      initialScale: 1,
      minimumScale: 1,
      themeColor: [
        { color: '#f8f8f8', media: '(prefers-color-scheme: light)' },
        { color: '#000', media: '(prefers-color-scheme: dark)' },
      ],
      viewportFit: 'cover',
      width: 'device-width',
    };
  } catch (error) {
    console.error('❌ Error in generateViewport:', error);
    // Retornar viewport por defecto si falla
    return {
      colorScheme: 'dark light',
      initialScale: 1,
      minimumScale: 1,
      themeColor: [
        { color: '#f8f8f8', media: '(prefers-color-scheme: light)' },
        { color: '#000', media: '(prefers-color-scheme: dark)' },
      ],
      viewportFit: 'cover',
      width: 'device-width',
    };
  }
};

// ✅ Forzar renderizado dinámico para evitar errores durante build
// El build falla cuando intenta pre-generar páginas estáticas porque
// StoreInitialization intenta acceder a localStorage (que no existe en Node.js)
export const dynamic = 'force-dynamic';

export const generateStaticParams = () => {
  const themes: ThemeAppearance[] = ['dark', 'light'];
  // ⚡ PERF 2026-05-13: reducido de 8 → 4 variants (eliminado mobile preset estático).
  // Mobile se detecta runtime via User-Agent middleware. Build SSG -50% tiempo.
  const mobileOptions = [false];
  // only static for serveral page, other go to dynamtic
  const staticLocales: Locales[] = [DEFAULT_LANG, 'zh-CN'];

  const variants: { variants: string }[] = [];

  for (const locale of staticLocales) {
    for (const theme of themes) {
      for (const isMobile of mobileOptions) {
        variants.push({
          variants: RouteVariants.serializeVariants({ isMobile, locale, theme }),
        });
      }
    }
  }

  return variants;
};
