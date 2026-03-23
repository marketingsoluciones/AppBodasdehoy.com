'use client';

import { Text } from '@lobehub/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import StorageFileList from './StorageFileList';

/**
 * Panel de archivos del Portal — siempre usa R2/api-ia.
 */
export const Files = memo(() => {
  const { t } = useTranslation('portal');

  return (
    <Flexbox gap={8}>
      <Text as={'h5'} style={{ marginInline: 12 }}>
        {t('files')}
      </Text>
      <StorageFileList />
    </Flexbox>
  );
});

export default Files;
