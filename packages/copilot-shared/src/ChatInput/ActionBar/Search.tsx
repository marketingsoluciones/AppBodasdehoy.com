'use client';

import { useTheme } from 'antd-style';
import { Globe, GlobeIcon } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useCopilotInput } from '../CopilotInputContext';
import Action from './Action';

const GlobeOff = memo(() => (
  <svg
    fill="none"
    height="20"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="20"
  >
    <path d="M21 12a9 9 0 0 0-9-9 9 9 0 0 0-5.66 2m-.34 3H3m18 0h-3M3 12h18M3 17h18m-9 4a9 9 0 0 0 9-9"/>
    <line x1="2" x2="22" y1="2" y2="22"/>
  </svg>
));

const Search = memo(() => {
  const { t } = useTranslation('chat');
  const { searchEnabled, onSearchToggle } = useCopilotInput();
  const theme = useTheme();

  return (
    <Action
      active={searchEnabled}
      color={searchEnabled ? theme.colorInfo : undefined}
      icon={searchEnabled ? Globe : GlobeIcon}
      onClick={() => onSearchToggle?.(!searchEnabled)}
      title={t('search.title', 'Búsqueda web')}
    />
  );
});

export default Search;
