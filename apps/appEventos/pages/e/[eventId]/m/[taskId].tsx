import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGuestSession } from '../../../../hooks/useGuestSession';

// ──────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────

interface AlbumMedia {
  _id: string;
  albumId: string;
  mediaType: 'photo' | 'video';
  originalUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  userId: string;
  createdAt: string;
}

interface PublicAlbum {
  _id?: string;
  album_id?: string;
  name: string;
  description?: string;
  eventId?: string;
  itineraryId?: string;
  visibility?: string;
  settings?: {
    allow_comments?: boolean;
    allow_downloads?: boolean;
    allow_reactions?: boolean;
  };
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDisplayName(userId: string, caption?: string): string {
  if (caption) return caption;
  if (userId?.startsWith('anon_')) return 'Invitado';
  if (userId?.startsWith('guest_')) return 'Invitado';
  return userId?.slice(0, 8) || 'Anónimo';
}

// ──────────────────────────────────────────────
// Modal "¿Cómo te llamas?"
// ──────────────────────────────────────────────

function NameModal({ onConfirm, onClose }: { onConfirm: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    onConfirm(trimmed);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <div className="text-center mb-5">
          <span className="text-4xl">📸</span>
          <h2 className="text-lg font-bold text-gray-900 mt-2">¿Cómo te llamas?</h2>
          <p className="text-sm text-gray-500 mt-1">Para que todos sepan quién hizo las fotos</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            maxLength={50}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 bg-gray-50"
          />
          <button
            type="submit"
            disabled={name.trim().length < 2}
            className="w-full bg-rose-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition active:scale-95"
          >
            Subir foto →
          </button>
        </form>
        <button onClick={onClose} className="w-full text-center text-sm text-gray-400 mt-3 py-1">
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Visor fullscreen
// ──────────────────────────────────────────────

function PhotoViewer({
  media, index, onClose, allowDownload,
}: {
  media: AlbumMedia[]; index: number; onClose: () => void; allowDownload: boolean;
}) {
  const [current, setCurrent] = useState(index);
  const item = media[current];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrent((c) => Math.min(c + 1, media.length - 1));
      if (e.key === 'ArrowLeft') setCurrent((c) => Math.max(c - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [media.length, onClose]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <button onClick={onClose} className="text-white/70 hover:text-white p-1">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <span className="text-white/50 text-sm">{current + 1} / {media.length}</span>
        {allowDownload && (
          <a href={item.originalUrl} download target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center px-4 relative min-h-0">
        {current > 0 && (
          <button onClick={() => setCurrent((c) => c - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-2 z-10">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {item.mediaType === 'video' ? (
          <video src={item.originalUrl} controls className="max-h-full max-w-full rounded-lg" />
        ) : (
          <img src={item.originalUrl} alt={item.caption || ''} className="max-h-full max-w-full object-contain rounded-lg" />
        )}
        {current < media.length - 1 && (
          <button onClick={() => setCurrent((c) => c + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-2 z-10">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {(item.caption || item.userId) && (
        <div className="px-4 py-3 text-center flex-shrink-0">
          {item.caption && <p className="text-white/80 text-sm">{item.caption}</p>}
          <p className="text-white/40 text-xs mt-1">
            {getDisplayName(item.userId, item.caption)} · {formatDate(item.createdAt)}
          </p>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Página principal
// ──────────────────────────────────────────────

const MomentGallery: NextPage = () => {
  const router = useRouter();
  const { eventId, taskId } = router.query as { eventId: string; taskId: string };
  const { session, canUpload, setAnonName } = useGuestSession(eventId);

  const [album, setAlbum] = useState<PublicAlbum | null>(null);
  const [media, setMedia] = useState<AlbumMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Cargar álbum: primero por itineraryId, si no por albumId directo ──
  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    const development = process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy';
    const params = new URLSearchParams({ development });

    const loadMedia = (albumData: PublicAlbum, shareToken?: string) => {
      const albumId = albumData._id ?? albumData.album_id;
      if (!albumId) { setError('no_album'); return Promise.resolve(); }
      if (shareToken) {
        return fetch(`/api/memories/shared/${shareToken}?${params}`)
          .then((r) => r.json())
          .then((shared) => setMedia(shared.media ?? []));
      }
      return fetch(`/api/memories/albums/${albumId}/media?${params}`)
        .then((r) => r.json())
        .then((mediaData) => setMedia(mediaData.media ?? mediaData ?? []));
    };

    // Intento 1: by-itinerary (taskId es un ID de tarea del itinerario)
    fetch(`/api/memories/by-itinerary/${taskId}?${params}`)
      .then(async (r) => r.ok ? r.json() : null)
      .then(async (data) => {
        if (data && !data.error && !data.detail) {
          const albumData: PublicAlbum = data.album ?? data;
          setAlbum(albumData);
          return loadMedia(albumData, data.share_token);
        }
        // Intento 2: albumId directo
        return fetch(`/api/memories/albums/${taskId}?${params}`)
          .then(async (r) => r.ok ? r.json() : null)
          .then(async (data2) => {
            if (data2 && !data2.error && !data2.detail) {
              const albumData: PublicAlbum = data2.album ?? data2;
              setAlbum(albumData);
              return loadMedia(albumData, data2.share_token);
            }
            setError('no_album');
          });
      })
      .catch(() => setError('load_error'))
      .finally(() => setLoading(false));
  }, [taskId]);

  // ── Lógica al pulsar "Subir foto" ──
  const handleUploadClick = useCallback(
    (e: React.MouseEvent) => {
      if (!canUpload) {
        e.preventDefault();
        setShowNameModal(true);
      }
      // Si canUpload, el label abre el input de archivo normalmente
    },
    [canUpload]
  );

  // ── El usuario confirma su nombre en el modal ──
  const handleNameConfirm = useCallback(
    (name: string) => {
      setAnonName(name);
      setShowNameModal(false);
      // Pequeño delay para que la sesión se actualice antes de abrir el selector
      setTimeout(() => fileInputRef.current?.click(), 100);
    },
    [setAnonName]
  );

  // ── Upload real ──
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !album) return;
      const albumId = album._id ?? album.album_id;
      if (!albumId || !session) return;

      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const development = process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy';
      const params = new URLSearchParams({ albumId, development });

      // Modo A: QR personalizado (nivel 2)
      if (session.pGuestToken) {
        params.set('pGuestToken', session.pGuestToken);
      } else {
        // Modo B: nombre libre (nivel 1)
        params.set('guestId', session.guestId);
        params.set('guestName', session.guestName);
      }

      try {
        const response = await fetch(`/api/memories/guest-upload?${params}`, {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        if (result.success && result.media) {
          setMedia((prev) => [result.media, ...prev]);
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 3000);
        } else {
          alert(result.error || 'Error al subir la foto. Inténtalo de nuevo.');
        }
      } catch {
        alert('Error de red al subir la foto.');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [album, session]
  );

  const allowDownload = album?.settings?.allow_downloads !== false;

  // ── Render ──

  if (loading) {
    return (
      <main className="absolute z-[50] w-full min-h-[100vh] top-0 bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Cargando fotos…</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>{album?.name ?? 'Fotos del momento'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f43f5e" />
      </Head>

      <main className="absolute z-[50] w-full min-h-[100vh] top-0 bg-white overflow-y-auto pb-24">
        {/* ── Header sticky ── */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <Link href={`/e/${eventId}`} className="text-gray-500 hover:text-gray-700 transition flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-900 text-base truncate">{album?.name ?? 'Fotos del momento'}</h1>
            {media.length > 0 && (
              <p className="text-xs text-gray-400">{media.length} {media.length === 1 ? 'foto' : 'fotos'}</p>
            )}
          </div>

          {/* Botón subir — solo visible si hay álbum activo */}
          {error !== 'no_album' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                id="guest-upload-input"
              />
              <label
                htmlFor={canUpload ? 'guest-upload-input' : undefined}
                onClick={handleUploadClick}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer select-none transition ${
                  uploading
                    ? 'bg-gray-100 text-gray-400 pointer-events-none'
                    : uploadSuccess
                      ? 'bg-green-100 text-green-600'
                      : 'bg-rose-500 text-white active:scale-95'
                }`}
              >
                {uploading ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                    <span className="hidden sm:inline">Subiendo…</span>
                  </>
                ) : uploadSuccess ? (
                  <>✓ <span className="hidden sm:inline">¡Subida!</span></>
                ) : (
                  <>📷 <span className="hidden sm:inline">Subir foto</span></>
                )}
              </label>
            </div>
          )}
        </div>

        {/* ── Banner de identidad ── */}
        {session && (
          <div className="mx-4 mt-3 mb-1 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
              <span className="text-rose-500 text-[10px] font-bold">{session.guestName.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-xs text-gray-500">{session.guestName}</span>
            {session.level === 2 && (
              <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-medium">verificado</span>
            )}
          </div>
        )}

        {/* ── Galería ── */}
        <div className="max-w-lg mx-auto px-3 pt-3">
          {error === 'no_album' || (!loading && media.length === 0 && !error) ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <span className="text-4xl">📸</span>
              <p className="text-gray-600 font-medium">
                {error === 'no_album' ? 'Aún no hay álbum para este momento' : 'Aún no hay fotos'}
              </p>
              <p className="text-gray-400 text-sm">
                {error === 'no_album'
                  ? 'Los organizadores irán publicando las fotos del evento'
                  : '¡Pulsa "📷 Subir foto" y sé el primero!'}
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <span className="text-4xl">😕</span>
              <p className="text-gray-600 font-medium">No se pudieron cargar las fotos</p>
              <button onClick={() => router.reload()} className="text-rose-500 text-sm underline">Reintentar</button>
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 gap-2 space-y-2">
              {media.map((item, idx) => (
                <div key={item._id} className="break-inside-avoid cursor-pointer" onClick={() => setViewerIndex(idx)}>
                  {item.mediaType === 'video' ? (
                    <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-video">
                      <video src={item.originalUrl} className="w-full h-full object-cover" muted preload="metadata" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/40 rounded-full p-2">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.thumbnailUrl ?? item.originalUrl}
                      alt={item.caption ?? ''}
                      className="w-full rounded-xl object-cover hover:opacity-95 transition"
                      loading="lazy"
                    />
                  )}
                  {item.caption && (
                    <p className="text-[11px] text-gray-400 px-1 pt-1 line-clamp-1">{item.caption}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal nombre */}
      {showNameModal && (
        <NameModal
          onConfirm={handleNameConfirm}
          onClose={() => setShowNameModal(false)}
        />
      )}

      {/* Visor fullscreen */}
      {viewerIndex !== null && (
        <PhotoViewer
          media={media}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
          allowDownload={allowDownload}
        />
      )}
    </>
  );
};

export default MomentGallery;
