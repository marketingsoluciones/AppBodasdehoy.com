'use client';

import { Text } from '@lobehub/ui';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import StorageFileList from '@/features/Portal/Home/Body/Files/StorageFileList';

import Header from './Header';
import UploadDock from './UploadDock';

interface FileManagerProps {
  category?: string;
  knowledgeBaseId?: string;
  onOpenFile: (id: string) => void;
  title: string;
}

/**
 * FileManager unificado — usa R2/api-ia como única fuente de verdad.
 * Ya no depende de tRPC/Postgres para listar archivos.
 */
const FileManager = memo<FileManagerProps>(({ title, knowledgeBaseId }) => {
  return (
    <>
      <Header knowledgeBaseId={knowledgeBaseId} />
      <Flexbox gap={12} height={'100%'} style={{ overflow: 'auto' }}>
        <Text strong style={{ fontSize: 16, marginBlock: 16, marginInline: 24 }}>
          {title}
        </Text>
        <StorageFileList />
      </Flexbox>
      <UploadDock />
    </>
  );
});

export default FileManager;
