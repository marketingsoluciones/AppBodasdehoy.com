import { metadataModule } from '@/server/metadata';
import { translation } from '@/server/translation';
import { DynamicLayoutProps } from '@/types/next';
import { RouteVariants } from '@/utils/server/routeVariants';

import Client from '../Client';

// SPRINT-N 2026-05-19 — migración Clerk-out:
// Eliminada rama ClerkProfile (UI nativa de Clerk). bodasdehoy usa Firebase via
// api-ia: el profile es siempre el Client local con AvatarWithUpload + UserAvatar.

export const generateMetadata = async (props: DynamicLayoutProps) => {
  const locale = await RouteVariants.getLocale(props);
  const { t } = await translation('auth', locale);
  return metadataModule.generate({
    description: t('header.desc'),
    title: t('tab.profile'),
    url: '/profile',
  });
};

const Page = async (props: DynamicLayoutProps) => {
  const mobile = await RouteVariants.getIsMobile(props);
  return <Client mobile={mobile} />;
};

export default Page;
