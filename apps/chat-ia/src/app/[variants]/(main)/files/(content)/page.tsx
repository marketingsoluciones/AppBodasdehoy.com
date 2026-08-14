'use client';

import dynamic from 'next/dynamic';
import { memo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import FilePanel from '@/features/FileSidePanel';
import { useShowMobileWorkspace } from '@/hooks/useShowMobileWorkspace';

import BibliotecaTabs from './BibliotecaTabs';

const FileManager = dynamic(() => import('@/features/FileManager'), {
  loading: () => <div style={{ padding: 24 }}>Cargando archivos...</div>,
  ssr: false,
});

// NOTA: NO usar aquí FileModalQueryRoute. Ese componente usa useSearchParams de
// react-router-dom (pensado para el MemoryRouter de /knowledge) y esta página es App
// Router de Next, SIN Router padre → crash "useLocation() may be used only in the
// context of a <Router>" + React #418 (informe 14-jun, /files se rompía). El modal de
// esta página ya se gestiona con estado local (fileModalId → FilePanel) → es redundante.

const FilesPage = memo(() => {
  const [fileModalId, setFileModalId] = useState<string | undefined>();
  const showMobile = useShowMobileWorkspace();

  return (
    <Flexbox height={'100%'} style={{ overflow: 'hidden' }} width={'100%'}>
      {/* Fase C (15-ago): cabecera "Biblioteca" — Archivos + Conocimiento como una
          sola superficie. Ver BibliotecaTabs para el porqué (no se fusionan módulos). */}
      <BibliotecaTabs />
      <Flexbox
        flex={1}
        horizontal={!showMobile}
        style={{ overflow: 'hidden', position: 'relative' }}
        width={'100%'}
      >
        <Flexbox flex={1} style={{ overflow: 'hidden' }}>
          <FileManager onOpenFile={setFileModalId} title="Archivos" />
        </Flexbox>
        {fileModalId && <FilePanel id={fileModalId} />}
      </Flexbox>
    </Flexbox>
  );
});

FilesPage.displayName = 'FilesPage';

export default FilesPage;
