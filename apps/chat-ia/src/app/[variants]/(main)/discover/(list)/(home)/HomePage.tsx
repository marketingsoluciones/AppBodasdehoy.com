'use client';

import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useDiscoverStore } from '@/store/discover';

import Title from '../../components/Title';
import AssistantList from '../assistant/features/List';
import Loading from './loading';

// MCP oculto (decisión producto 1-ago): el marketplace MCP apunta al hub PÚBLICO de LobeHub
// (MARKET_BASE_URL sin configurar) y su endpoint MCP falla → doble toast "Failed to fetch mcp
// list" en /discover. Los asistentes usan el mismo hub y SÍ cargan. Se oculta la sección/tab MCP
// hasta tener marketplace propio del cliente. Ver también useNav.tsx.
const HomePage = memo<{ mobile?: boolean }>(() => {
  const { t } = useTranslation('discover');
  const useAssistantList = useDiscoverStore((s) => s.useAssistantList);

  const { data: assistantList, isLoading: assistantLoading } = useAssistantList({
    page: 1,
    pageSize: 12,
  });

  if (assistantLoading) return <Loading />;

  return (
    <>
      <Title more={t('home.more')} moreLink={'/assistant'}>
        {t('home.featuredAssistants')}
      </Title>
      <AssistantList data={assistantList?.items ?? []} rows={4} />
    </>
  );
});

export default HomePage;
