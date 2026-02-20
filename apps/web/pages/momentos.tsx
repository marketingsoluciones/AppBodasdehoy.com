/**
 * Momentos (Memories) - Integración con @bodasdehoy/memories
 * Usa el paquete compartido; opcionalmente redirige a Copilot para la UI completa.
 */
import { AuthContextProvider } from '../context';
import { MemoriesProvider, useMemoriesStore } from '@bodasdehoy/memories';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const MOMENTOS_API_BASE =
  typeof window !== 'undefined'
    ? ''
    : (process.env.NEXT_PUBLIC_MEMORIES_API_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        '');

function MomentosContent() {
  const router = useRouter();
  const { albums, albumsLoading, fetchAlbums } = useMemoriesStore();

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  const chatBase =
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_CHAT || 'https://chat.bodasdehoy.com'
      : 'https://chat.bodasdehoy.com';

  return (
    <section className="bg-base w-full min-h-[60vh] md:py-10 px-4 md:px-0">
      <div className="md:max-w-screen-lg mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Momentos</h1>
        <p className="text-gray-600 mb-6">
          Tus álbumes de fotos por evento. Puedes verlos aquí o abrir la experiencia completa en Copilot.
        </p>

        {albumsLoading && (
          <div className="flex items-center gap-2 text-gray-500">
            <span className="animate-pulse">Cargando álbumes...</span>
          </div>
        )}

        {!albumsLoading && albums.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {albums.map((album) => (
              <li
                key={album._id}
                className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="font-medium text-gray-900 truncate">{album.name}</div>
                {album.description && (
                  <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {album.description}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  {album.mediaCount} fotos · {album.memberCount} miembros
                </div>
              </li>
            ))}
          </ul>
        )}

        {!albumsLoading && albums.length === 0 && (
          <p className="text-gray-500 mb-6">Aún no tienes álbumes. Créalos desde Copilot.</p>
        )}

        <a
          href={`${chatBase.replace(/\/$/, '')}/bodasdehoy/memories`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500 text-white font-medium hover:bg-pink-600 transition-colors"
        >
          Abrir Momentos en Copilot
        </a>
      </div>
    </section>
  );
}

export default function MomentosPage() {
  const { user, config, verificationDone } = AuthContextProvider();
  const development = config?.development || 'bodasdehoy';
  const userId = user?.uid || user?.email || '';

  if (!verificationDone) {
    return (
      <section className="bg-base w-full min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Cargando...</div>
      </section>
    );
  }

  if (!userId) {
    return (
      <section className="bg-base w-full min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-gray-700 mb-4">Inicia sesión para ver tus Momentos.</p>
          <Link
            href="/login/"
            className="inline-block px-4 py-2 rounded-lg bg-pink-500 text-white font-medium hover:bg-pink-600"
          >
            Iniciar sesión
          </Link>
        </div>
      </section>
    );
  }

  return (
    <MemoriesProvider
      apiBaseUrl={MOMENTOS_API_BASE}
      userId={userId}
      development={development}
    >
      <MomentosContent />
    </MemoriesProvider>
  );
}
