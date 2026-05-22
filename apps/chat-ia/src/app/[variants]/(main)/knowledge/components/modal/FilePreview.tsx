'use client';

import dynamic from 'next/dynamic';
import { memo } from 'react';

import { fileManagerSelectors, useFileStore } from '@/store/file';

const FileViewer = dynamic(() => import('@/features/FileViewer'), { ssr: false });

const FilePreview = memo<{ id: string }>(({ id }) => {
  const file = useFileStore(fileManagerSelectors.getFileById(id));

  if (!file) return;

  return <FileViewer {...file} />;
});
export default FilePreview;
