import { notFound } from 'next/navigation';

import { metadataModule } from '@/server/metadata';
import { translation } from '@/server/translation';
import { DynamicLayoutProps } from '@/types/next';

// SPRINT-N 2026-05-19 — migración Clerk-out:
// La ruta /profile/security era SOLO Clerk UI nativa. bodasdehoy usa Firebase
// via api-ia, no hay panel security propio en chat-ia. Retornamos 404.

export const generateMetadata = async (props: DynamicLayoutProps) => {
  const locale = await (await import('@/utils/server/routeVariants')).RouteVariants.getLocale(props);
  const { t } = await translation('auth', locale);
  return metadataModule.generate({
    description: t('header.desc'),
    title: t('tab.security'),
    url: '/profile/security',
  });
};

const Page = async () => notFound();

export default Page;
