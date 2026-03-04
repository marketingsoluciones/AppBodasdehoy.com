'use client';

import { memo } from 'react';

import { useSessionStore } from '@/store/session';

import SearchMode from './SearchMode';
import SubTabs from './SubTabs';

const SessionListContent = memo(() => {
  const isSearching = useSessionStore((s) => s.isSearching);

  // Si está buscando, mostrar modo de búsqueda
  if (isSearching) {
    return <SearchMode />;
  }

  // Si no está buscando, mostrar sub-pestañas (Conversaciones e Historial)
  return <SubTabs />;
});

SessionListContent.displayName = 'SessionListContent';

export default SessionListContent;
