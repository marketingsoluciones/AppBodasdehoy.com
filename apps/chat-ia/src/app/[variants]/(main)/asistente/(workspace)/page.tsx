import StructuredData from '@/components/StructuredData';
import { BRANDING_NAME } from '@/const/branding';
import { ldModule } from '@/server/ld';
import { metadataModule } from '@/server/metadata';
import { translation } from '@/server/translation';
import { DynamicLayoutProps } from '@/types/next';
import { RouteVariants } from '@/utils/server/routeVariants';

import PageTitle from '../features/PageTitle';
// SPRINT-AB revertido SPRINT-AG: page.tsx es Server Component; next/dynamic ssr:false
// NO está permitido en Server Components (Next 15+). El componente ya es 'use client'
// internamente — Next maneja el code splitting via routing convention.
import TelemetryNotification from './features/TelemetryNotification';

export const generateMetadata = async (props: DynamicLayoutProps) => {
  try {
    const locale = await RouteVariants.getLocale(props);
    const { t } = await translation('metadata', locale);
    return metadataModule.generate({
      description: t('chat.description', { appName: BRANDING_NAME }),
      title: t('chat.title', { appName: BRANDING_NAME }),
      url: '/asistente',
    });
  } catch (error) {
    console.error('❌ Error in chat page generateMetadata:', error);
    return metadataModule.generate({
      description: 'AI Chat Assistant',
      title: BRANDING_NAME,
      url: '/asistente',
    });
  }
};

const Page = async (props: DynamicLayoutProps) => {
  try {
    const { isMobile, locale } = await RouteVariants.getVariantsFromProps(props);
    const { t } = await translation('metadata', locale);
    const ld = ldModule.generate({
      description: t('chat.description', { appName: BRANDING_NAME }),
      title: t('chat.title', { appName: BRANDING_NAME }),
      url: '/asistente',
    });

    return (
      <>
        <StructuredData ld={ld} />
        <PageTitle />
        <TelemetryNotification mobile={isMobile} />
        {/* ✅ OPTIMIZACIÓN: Changelog deshabilitado - fetch a GitHub bloqueaba SSR 4+ segundos */}
      </>
    );
  } catch (error) {
    console.error('❌ Error in chat page:', error);
    return <PageTitle />;
  }
};

Page.displayName = 'Chat';

export default Page;
