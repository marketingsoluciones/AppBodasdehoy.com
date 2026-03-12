'use client';

import dynamic from 'next/dynamic';
import { memo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import FilePanel from '@/features/FileSidePanel';
import { useShowMobileWorkspace } from '@/hooks/useShowMobileWorkspace';

const FileManager = dynamic(() => import('@/features/FileManager'), {
  loading: () => <div style={{ padding: 24 }}>Cargando archivos...</div>,
  ssr: false,
});

const FileModalQueryRoute = dynamic(
  () =>
    import(
      '@/app/[variants]/(main)/knowledge/shared/FileModalQueryRoute'
    ),
  { ssr: false },
);

const FilesPage = memo(() => {
  const [fileModalId, setFileModalId] = useState<string | undefined>();
  const showMobile = useShowMobileWorkspace();

  return (
    <Flexbox
      height={'100%'}
      horizontal={!showMobile}
      style={{ overflow: 'hidden', position: 'relative' }}
      width={'100%'}
    >
      <Flexbox flex={1} style={{ overflow: 'hidden' }}>
        <FileManager onOpenFile={setFileModalId} title="Archivos" />
      </Flexbox>
      {fileModalId && <FilePanel id={fileModalId} />}
      <FileModalQueryRoute />
    </Flexbox>
  );
});

FilesPage.displayName = 'FilesPage';

export default FilesPage;
