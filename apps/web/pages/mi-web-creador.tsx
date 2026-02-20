/**
 * Mi web creador - Redirige a Copilot (wedding-creator).
 * El Creador de webs vive en Copilot; aquí enlazamos a la experiencia completa.
 */
import { AuthContextProvider } from '../context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const getCreatorUrl = () => {
  if (typeof window === 'undefined') return '';
  const base = (process.env.NEXT_PUBLIC_CHAT || 'https://chat.bodasdehoy.com').replace(/\/$/, '');
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500 text-white font-medium hover:bg-pink-600 transition-colors"
        >
          Abrir Creador de webs en Copilot
        </a>
      </div>
    </section>
  );
}
