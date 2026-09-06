/**
 * Mi web creador - Redirige a Copilot (wedding-creator).
 * El Creador de webs vive en Copilot; aquí enlazamos a la experiencia completa.
 */
import { AuthContextProvider } from '../context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { resolveChatOrigin } from '@bodasdehoy/shared/utils';

const getCreatorUrl = () => {
  if (typeof window === 'undefined') return '';
  // BUG-H-04: usar resolveChatOrigin (basado en hostname actual) en vez de
  // process.env.NEXT_PUBLIC_CHAT que podía apuntar a chat.bodasdehoy.com (prod)
  // incluso desde app-dev.
  const base = resolveChatOrigin(window.location.hostname);
  return `${base}/bodasdehoy/wedding-creator`;
};

export default function MiWebCreadorPage() {
  const { user, verificationDone } = AuthContextProvider();
  const router = useRouter();

  useEffect(() => {
    if (!verificationDone) return;
    if (!user?.uid && !user?.email) {
      router.replace('/login');
      return;
    }
  }, [verificationDone, user, router]);

  if (!verificationDone) {
    return (
      <section className="bg-base w-full min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Cargando...</div>
      </section>
    );
  }

  if (!user?.uid && !user?.email) {
    return null;
  }

  const url = getCreatorUrl();

  return (
    <section className="bg-base w-full min-h-[60vh] md:py-10 px-4 md:px-0">
      <div className="md:max-w-screen-lg mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Mi web creador</h1>
        <p className="text-gray-600 mb-6">
          Crea y edita la web de tu boda o evento. Se abrirá en Copilot con el editor completo.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:opacity-80 transition-opacity"
        >
          Abrir Creador de webs en Copilot
        </a>
      </div>
    </section>
  );
}
