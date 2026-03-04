'use client';

import { SearchBar } from '@lobehub/ui';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useUserStore } from '@/store/user';
import { settingsSelectors } from '@/store/user/selectors';
import { HotkeyEnum } from '@/types/hotkey';

import { useFileManagerQueryState } from '../hooks/useFileManagerQueryState';

const FilesSearchBar = memo<{ mobile?: boolean }>(({ mobile }) => {
  const { t } = useTranslation('file');
  const hotkey = useUserStore(settingsSelectors.getHotkeyById(HotkeyEnum.Search));
  const [keywords, setKeywords] = useState<string>('');

  // Use react-router-dom compatible hook for MemoryRouter
  const { query, setQuery } = useFileManagerQueryState();

  // Sync local state with URL query parameter
  useEffect(() => {
    setKeywords(query || '');
  }, [query]);

  return (
    <SearchBar
      allowClear
      enableShortKey={!mobile}
      onChange={(e) => {
        setKeywords(e.target.value);
        if (!e.target.value) setQuery(null);
      }}
      onPressEnter={() => setQuery(keywords)}
      placeholder={t('searchFilePlaceholder')}
      shortKey={hotkey}
      spotlight={!mobile}
      style={{ width: 320 }}
      value={keywords}
      variant={'filled'}
    />
  );
});

export default FilesSearchBar;
