'use client';

import { memo } from 'react';

import PageTitle from '@/components/PageTitle';
import { withSuspense } from '@/components/withSuspense';
import { useChatStore } from '@/store/chat';
import { topicSelectors } from '@/store/chat/selectors';
import { useSessionStore } from '@/store/session';
import { sessionMetaSelectors } from '@/store/session/selectors';

// Tope del título de pestaña: un topic auto-titulado puede traer el contenido completo del
// primer mensaje (p.ej. un presupuesto largo) → el <title> absorbería cientos de chars.
// Truncamos para que la pestaña/historial/SEO no se contaminen. Ver reporte 2026-06-11.
const MAX_TITLE_LEN = 60;
const truncateTitle = (s?: string) =>
  s && s.length > MAX_TITLE_LEN ? `${s.slice(0, MAX_TITLE_LEN).trimEnd()}…` : s;

const Title = memo(() => {
  const agentTitle = useSessionStore(sessionMetaSelectors.currentAgentTitle);

  const topicTitle = useChatStore((s) => topicSelectors.currentActiveTopic(s)?.title);
  return (
    <PageTitle title={[truncateTitle(topicTitle), agentTitle].filter(Boolean).join(' · ')} />
  );
});

export default withSuspense(Title);
