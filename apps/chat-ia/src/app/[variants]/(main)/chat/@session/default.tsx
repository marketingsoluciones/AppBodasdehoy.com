import ServerLayout from '@/components/server/ServerLayout';
import { DynamicLayoutProps } from '@/types/next';

import Desktop from './_layout/Desktop';
import Mobile from './_layout/Mobile';
import SessionHydration from './features/SessionHydration';
import SessionListContent from './features/SessionListContent';

// ✅ OPTIMIZACIÓN: Importar directamente sin lazy() para evitar loading intermedio
// El chunk se carga con el bundle principal, eliminando el CircleLoading

const Layout = ServerLayout({ Desktop, Mobile });

const Session = (props: DynamicLayoutProps) => {
  return (
    <>
      <Layout {...props}>
        {/* ✅ Sin Suspense adicional - el componente se renderiza inmediatamente */}
        <SessionListContent />
      </Layout>
      <SessionHydration />
    </>
  );
};

Session.displayName = 'Session';

export default Session;
