/**
 * Momentos (Memories) - Integración con @bodasdehoy/memories
 * Usa el paquete compartido; opcionalmente redirige a Copilot para la UI completa.
 */
import { AuthContextProvider, EventContextProvider } from '../context';
import { MemoriesProvider, useMemoriesStore } from '@bodasdehoy/memories';
import { resolveChatOrigin } from '@bodasdehoy/shared/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LiaLinkSolid } from 'react-icons/lia';
import { FiCheck, FiLoader, FiZap, FiCopy, FiGrid } from 'react-icons/fi';

const MOMENTOS_API_BASE =
  typeof window !== 'undefined'
    ? ''
    : (process.env.NEXT_PUBLIC_MEMORIES_API_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        '');

function ShareAlbumButton({ albumId }: { albumId: string }) {
  const { generateShareLink } = useMemoriesStore();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const result = await generateShareLink(albumId, 30);
      if (result) {
        const shareUrl = result.shareUrl ||
          `${window.location.origin}/memories/shared/${result.shareToken}`;
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      title="Compartir álbum"
      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors disabled:opacity-60"
    >
      {loading
        ? <FiLoader className="w-3.5 h-3.5 animate-spin" />
        : copied
          ? <FiCheck className="w-3.5 h-3.5 text-green-500" />
          : <LiaLinkSolid className="w-3.5 h-3.5" />
      }
      <span>{copied ? 'Copiado' : 'Compartir'}</span>
    </button>
  );
}

function AlbumQRButton({ albumId, eventId }: { albumId: string; eventId: string }) {
  const [open, setOpen] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.bodasdehoy.com';
  const momentUrl = `${origin}/e/${eventId}/m/${albumId}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(momentUrl)}`;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="QR de este momento"
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors"
      >
        <FiGrid className="w-3.5 h-3.5" />
        <span>QR</span>
      </button>
      {open && (
        <div className="absolute bottom-8 right-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex flex-col items-center gap-2">
          <img src={qrSrc} alt="QR momento" className="w-32 h-32" />
          <p className="text-xs text-gray-500 text-center max-w-[130px] break-all">{momentUrl}</p>
          <button
            onClick={() => { navigator.clipboard.writeText(momentUrl); setOpen(false); }}
            className="text-xs text-pink-500 hover:underline"
          >
            Copiar enlace
          </button>
        </div>
      )}
    </div>
  );
}

function MomentosContent() {
  const { albums, albumsLoading, fetchAlbums, createEventAlbumStructure } = useMemoriesStore();
  const { event } = EventContextProvider();
  const [creatingStructure, setCreatingStructure] = useState(false);
  const [structureResult, setStructureResult] = useState<'ok' | 'error' | null>(null);
  const [copiedPortal, setCopiedPortal] = useState(false);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.bodasdehoy.com';
  const portalUrl = event?._id ? `${origin}/e/${event._id}` : null;

  const handleCreateStructure = async () => {
    if (!event?._id) return;
    setCreatingStructure(true);
    setStructureResult(null);
    try {
      const itineraryItems = event.itinerarios_array
        ?.flatMap((it: any) => it.tasks ?? [])
        .filter((t: any) => t.spectatorView) ?? [];
      const result = await createEventAlbumStructure(event._id, event.nombre, itineraryItems);
      setStructureResult(result ? 'ok' : 'error');
      if (result) await fetchAlbums();
    } catch {
      setStructureResult('error');
    } finally {
      setCreatingStructure(false);
    }
  };

  const handleCopyPortal = () => {
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl);
    setCopiedPortal(true);
    setTimeout(() => setCopiedPortal(false), 2500);
  };

  const chatBase =
    typeof window !== 'undefined'
      ? resolveChatOrigin(window.location.hostname)
      : (process.env.NEXT_PUBLIC_CHAT || 'https://chat.bodasdehoy.com');

  return (
    <section className="bg-base w-full min-h-[60vh] md:py-10 px-4 md:px-0">
      <div className="md:max-w-screen-lg mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Momentos</h1>
        <p className="text-gray-600 mb-6">
          Tus álbumes de fotos por evento. Puedes verlos aquí o abrir la experiencia completa en Copilot.
        </p>

        {/* ── Portal del invitado ── */}
        {portalUrl && (
          <div className="mb-6 p-4 bg-pink-50 border border-pink-200 rounded-lg flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-pink-800 mb-1">Portal del evento para invitados</p>
              <p className="text-xs text-pink-600 break-all">{portalUrl}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(portalUrl)}`}
                alt="QR portal"
                className="w-16 h-16 rounded"
              />
              <div className="flex flex-col gap-2">
                <a
                  href={portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-pink-600 hover:underline"
                >
                  Ver portal →
                </a>
                <button
                  onClick={handleCopyPortal}
                  className="flex items-center gap-1 text-xs text-pink-600 hover:text-pink-800"
                >
                  {copiedPortal ? <FiCheck className="w-3 h-3 text-green-500" /> : <FiCopy className="w-3 h-3" />}
                  {copiedPortal ? 'Copiado' : 'Copiar URL'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Crear estructura de momentos ── */}
        {event?._id && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              onClick={handleCreateStructure}
              disabled={creatingStructure}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-60 text-sm"
            >
              {creatingStructure
                ? <FiLoader className="w-4 h-4 animate-spin" />
                : <FiZap className="w-4 h-4 text-yellow-500" />
              }
              Crear álbumes por momento del itinerario
            </button>
            {structureResult === 'ok' && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <FiCheck className="w-4 h-4" /> Álbumes creados
              </span>
            )}
            {structureResult === 'error' && (
              <span className="text-sm text-red-500">Error al crear la estructura</span>
            )}
          </div>
        )}

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
                className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col"
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
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
                  <ShareAlbumButton albumId={album._id} />
                  {event?._id && (
                    <AlbumQRButton albumId={album._id} eventId={event._id} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {!albumsLoading && albums.length === 0 && (
          <p className="text-gray-500 mb-6">Aún no tienes álbumes. Créalos desde Copilot o usa el botón de arriba.</p>
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
