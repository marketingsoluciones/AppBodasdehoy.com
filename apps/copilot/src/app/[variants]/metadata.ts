import { BRANDING_LOGO_URL, BRANDING_NAME, ORG_NAME } from '@/const/branding';
import { DEFAULT_LANG } from '@/const/locale';
import { OFFICIAL_URL, OG_URL } from '@/const/url';
import { isCustomBranding, isCustomORG } from '@/const/version';
import { translation } from '@/server/translation';
import { getDeveloperBranding, ServerBranding } from '@/server/branding';
import { DynamicLayoutProps } from '@/types/next';
import { RouteVariants } from '@/utils/server/routeVariants';

const isDev = process.env.NODE_ENV === 'development';

// ✅ OPTIMIZACIÓN: Timeout máximo para metadata (no debe bloquear SSR)
const METADATA_TIMEOUT = 800; // 800ms máximo

export const generateMetadata = async (props: DynamicLayoutProps) => {
  try {
    // ✅ OPTIMIZACIÓN: En desarrollo, skip fetch de branding (usa valores por defecto)
    // Esto reduce el tiempo de carga de 2+ minutos a <1 segundo
    if (isDev) {
      const locale = await RouteVariants.getLocale(props);
      const { t } = await translation('metadata', locale);
      const appName = BRANDING_NAME;

      return {
        title: {
          default: t('chat.title', { appName }),
          template: `%s · ${appName}`,
        },
        description: t('chat.description', { appName }),
        metadataBase: new URL(OFFICIAL_URL),
        icons: {
          icon: '/favicon-dev.ico',
          shortcut: '/favicon-32x32-dev.ico',
          apple: '/apple-touch-icon.png?v=1',
        },
      };
    }

    // ✅ Ejecutar en paralelo con timeout global (solo en producción)
    const [locale, branding] = await Promise.all([
      RouteVariants.getLocale(props),
      Promise.race([
        getDeveloperBranding(),
        new Promise<Partial<ServerBranding>>((resolve) =>
          setTimeout(() => resolve({}), METADATA_TIMEOUT)
        ),
      ]),
    ]);

    const { t } = await translation('metadata', locale);

    const appName = branding?.name || BRANDING_NAME;
    const ogImage = branding?.og_image || OG_URL;
    const logo = branding?.logo || BRANDING_LOGO_URL;
    const favicon = branding?.favicon;
    const appleTouchIcon = branding?.apple_touch_icon;

  return {
    alternates: {
      canonical: OFFICIAL_URL,
    },
    appleWebApp: {
      statusBarStyle: 'black-translucent',
      title: appName,
    },
    description: t('chat.description', { appName }),
    icons: isCustomBranding || favicon
      ? {
          apple: appleTouchIcon || logo || '/apple-touch-icon.png?v=1',
          icon: favicon || '/favicon.ico?v=1',
          shortcut: favicon || '/favicon-32x32.ico?v=1',
        }
      : {
          apple: '/apple-touch-icon.png?v=1',
          icon: isDev ? '/favicon-dev.ico' : '/favicon.ico?v=1',
          shortcut: isDev ? '/favicon-32x32-dev.ico' : '/favicon-32x32.ico?v=1',
        },
    manifest: '/manifest.json',
    metadataBase: new URL(OFFICIAL_URL),
    openGraph: {
      description: t('chat.description', { appName }),
      images: [
        {
          alt: t('chat.title', { appName }),
          height: 640,
          url: ogImage,
          width: 1200,
        },
      ],
      locale: DEFAULT_LANG,
      siteName: appName,
      title: appName,
      type: 'website',
      url: OFFICIAL_URL,
    },
    title: {
      default: t('chat.title', { appName }),
      template: `%s · ${appName}`,
    },
    twitter: {
      card: 'summary_large_image',
      description: t('chat.description', { appName }),
      images: [ogImage],
      site: isCustomORG ? `@${ORG_NAME}` : `@${branding?.developer || ORG_NAME}`,
      title: t('chat.title', { appName }),
    },
  };
  } catch (error) {
    console.error('❌ Error in generateMetadata:', error);
    // Retornar metadata básica si falla
    return {
      description: 'AI Chat Assistant',
      metadataBase: new URL(OFFICIAL_URL),
      title: {
        default: BRANDING_NAME,
        template: `%s · ${BRANDING_NAME}`,
      },
    };
  }
};
