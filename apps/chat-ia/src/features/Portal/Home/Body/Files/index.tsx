'use client';

import { Text } from '@lobehub/ui';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import FileList from './FileList';
import StorageFileList from './StorageFileList';

export const Files = memo(() => {
  const { t } = useTranslation('portal');

  // Verificar si Storage R2 está habilitado
  // En Next.js, las variables NEXT_PUBLIC_ están disponibles directamente en process.env en el cliente
  const useStorageR2 = useMemo(() => {
    if (typeof window === 'undefined') {
      return false; // SSR no puede usar Storage R2
    }
    // En cliente, verificar desde múltiples fuentes
    const enabled =
      process.env.NEXT_PUBLIC_USE_STORAGE_R2 === 'true' ||
      (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_USE_STORAGE_R2 === 'true';
    return enabled;
  }, []);

  // Usar Storage R2 si está habilitado (eventId puede ser null, usaremos "default" como fallback)
  const useR2 = useStorageR2;

  return (
    <Flexbox gap={8}>
      <Text as={'h5'} style={{ marginInline: 12 }}>
        {t('files')}
      </Text>
      {useR2 ? <StorageFileList /> : <FileList />}
    </Flexbox>
  );
});

export default Files;
