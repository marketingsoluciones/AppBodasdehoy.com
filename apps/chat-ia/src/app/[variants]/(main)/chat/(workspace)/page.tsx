import StructuredData from '@/components/StructuredData';
import { BRANDING_NAME } from '@/const/branding';
import { ldModule } from '@/server/ld';
import { metadataModule } from '@/server/metadata';
import { translation } from '@/server/translation';
import { DynamicLayoutProps } from '@/types/next';
import { RouteVariants } from '@/utils/server/routeVariants';

import PageTitle from '../features/PageTitle';
import TelemetryNotification from './features/TelemetryNotification';

export const generateMetadata = async (props: DynamicLayoutProps) => {
  try {
    const locale = await RouteVariants.getLocale(props);
    const { t } = await translation('metadata', locale);
    return metadataModule.generate({
      description: t('chat.description', { appName: BRANDING_NAME }),
      title: t('chat.title', { appName: BRANDING_NAME }),
      url: '/chat',
    });
  } catch (error) {
    console.error('❌ Error in chat page generateMetadata:', error);
    return metadataModule.generate({
      description: 'AI Chat Assistant',
      title: BRANDING_NAME,
      url: '/chat',
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
      url: '/chat',
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
