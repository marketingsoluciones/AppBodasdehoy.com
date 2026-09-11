'use client';

import DocViewer from '@cyntler/react-doc-viewer';
import { css, cx } from 'antd-style';
import { CSSProperties, memo } from 'react';

import { FileListItem } from '@/types/files';

import NotSupport from './NotSupport';
import { FileViewRenderers } from './Renderer';

// SPRINT-N 2026-05-19 — migración: Renderer/PDF eliminado (pdfjs-dist dep removida).
// PDFs delegados a DocViewer pluginRenderers fallback / NotSupport overlay.

const container = css`
  background: transparent !important;

  #proxy-renderer {
    height: 100%;
  }
`;

interface FileViewerProps extends FileListItem {
  className?: string;
  style?: CSSProperties;
}

const FileViewer = memo<FileViewerProps>(({ style, fileType, url, name }) => {
  return (
    <DocViewer
      className={cx(container)}
      config={{
        header: { disableHeader: true },
        noRenderer: { overrideComponent: NotSupport },
      }}
      documents={[{ fileName: name, fileType, uri: url }]}
      pluginRenderers={FileViewRenderers}
      style={style}
    />
  );
});

export default FileViewer;
