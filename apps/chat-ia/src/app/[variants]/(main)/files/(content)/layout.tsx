import ServerLayout from '@/components/server/ServerLayout';

import Desktop from './_layout/Desktop';
import FileGuestGate from './FileGuestGate';
import Mobile from './_layout/Mobile';
import { LayoutProps } from './_layout/type';

const Layout = ServerLayout<LayoutProps>({ Desktop, Mobile });

Layout.displayName = 'FileLayout';

/**
 * Layout de archivos:
 * - Visitantes/guests → pantalla de registro (FileGuestGate)
 * - Registrados sin saldo → ven archivos, upload bloqueado (en UploadFileButton)
 * - Registrados con saldo → acceso completo
 */
export default (props: LayoutProps) => {
  return (
    <FileGuestGate>
      <Layout {...props} />
    </FileGuestGate>
  );
};
