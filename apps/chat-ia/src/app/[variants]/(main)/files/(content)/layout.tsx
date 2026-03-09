import ServerLayout from '@/components/server/ServerLayout';
import { isServerMode } from '@/const/version';

import NotSupportClient from './NotSupportClient';
import Desktop from './_layout/Desktop';
import Mobile from './_layout/Mobile';
import { LayoutProps } from './_layout/type';

const Layout = ServerLayout<LayoutProps>({ Desktop, Mobile });

Layout.displayName = 'FileLayout';

/**
 * Verificar si Storage R2 está habilitado
 * Permite usar gestión de archivos incluso en modo cliente si Storage R2 está configurado
 */
function isStorageR2Enabled(): boolean {
  // Verificar en múltiples formas para asegurar compatibilidad
  if (typeof window !== 'undefined') {
    // En cliente: verificar desde window.__NEXT_DATA__ o process.env
    return (
      (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_USE_STORAGE_R2 === 'true' ||
      process.env.NEXT_PUBLIC_USE_STORAGE_R2 === 'true'
    );
  }
  // En servidor: solo process.env
  return process.env.NEXT_PUBLIC_USE_STORAGE_R2 === 'true';
}

export default (props: LayoutProps) => {
  const storageR2Enabled = isStorageR2Enabled();
  
  // Si Storage R2 está habilitado, permitir acceso aunque no esté en modo servidor
  // Si no está en modo servidor y Storage R2 no está habilitado, mostrar mensaje
  if (!isServerMode && !storageR2Enabled) {
    return <NotSupportClient />;
  }

  return <Layout {...props} />;
};
