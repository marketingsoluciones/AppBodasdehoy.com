/**
 * Vista pública de álbum — /album/[shareToken]
 * Accessible via QR o enlace compartido. Sin auth.
 * Los invitados pueden ver fotos y subir las suyas con nombre.
 */
import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { useEffect, useRef, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_MEMORIES_API_URL || 'https://api-ia.bodasdehoy.com';
const DEVELOPMENT = process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy';

interface PublicMedia {
  _id: string;
  originalUrl: string;
  thumbnailUrl?: string;
  mediaType: 'photo' | 'video';
  caption?: string;
  userId: string;
  createdAt: string;
}

interface PublicAlbum {
  _id: string;
  name: string;
  description?: string;
  visibility: string;
  mediaCount: number;
  settings?: {
    allow_uploads?: boolean;
    allow_downloads?: boolean;
  };
}

// ─── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({
  media,
  initialIndex,
  onClose,
}: {
  media: PublicMedia[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(initialIndex);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setCurrent((c) => Math.max(0, c - 1));
      if (e.key === 'ArrowRight') setCurrent((c) => Math.min(media.length - 1, c + 1));
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [media.length, onClose]);

  const m = media[current];
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white text-xl z-10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition"
      >
        ✕
      </button>
      {current > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setCurrent((c) => c - 1); }}
          className="absolute left-4 text-white/70 hover:text-white z-10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition"
        >
          ←
        </button>
      )}
      <img
        src={m?.originalUrl}
        alt={m?.caption || ''}
        className="max-w-full max-h-full object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
      {current < media.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setCurrent((c) => c + 1); }}
          className="absolute right-4 text-white/70 hover:text-white z-10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition"
        >
          →
        </button>
      )}
      <p className="absolute bottom-4 text-white/50 text-sm">
        {current + 1} / {media.length}
        {m?.caption && <span className="ml-3 text-white/70">{m.caption}</span>}
      </p>
    </div>
  );
}

// ─── Name modal ────────────────────────────────────────────────────────────────

function NameModal({
  onConfirm,
  onClose,
}: {
  onConfirm: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center">
        <div className="text-4xl mb-3">📸</div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">¿Cómo te llamas?</h2>
        <p className="text-sm text-gray-500 mb-5">
          Tu nombre aparecerá junto a las fotos que subas.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = name.trim();
            if (trimmed.length >= 2) onConfirm(trimmed);
          }}
          className="space-y-3"
        >
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
          />
          <button
            type="submit"
            disabled={name.trim().length < 2}
            className="w-full bg-rose-500 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-600 disabled:opacity-40 transition"
          >
            Subir foto →
          </button>
          <button type="button" onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 transition">
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

interface Props {
  shareToken: string;
}

export default function PublicAlbumPage({ shareToken }: Props) {
  const [album, setAlbum] = useState<PublicAlbum | null>(null);
  const [media, setMedia] = useState<PublicMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore guest name from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem(`memories_guest_${shareToken}`);
    if (stored) setGuestName(stored);
  }, [shareToken]);

  // Load album + media
  useEffect(() => {
    // Dev demo mode — token "demo" returns mock data without hitting the API
    if (process.env.NODE_ENV === 'development' && shareToken === 'demo') {
      setAlbum({
        _id: 'demo-album',
        name: 'Boda de Ana & Carlos 💍',
        description: 'Bodega El Pinar, 14 de junio de 2026',
        visibility: 'members',
        mediaCount: 3,
        settings: { allow_uploads: true, allow_downloads: true },
      });
      setMedia([
        { _id: '1', originalUrl: 'https://picsum.photos/seed/boda1/800/600', thumbnailUrl: 'https://picsum.photos/seed/boda1/400/300', mediaType: 'photo', caption: 'Laura', userId: 'guest1', createdAt: new Date().toISOString() },
        { _id: '2', originalUrl: 'https://picsum.photos/seed/boda2/800/600', thumbnailUrl: 'https://picsum.photos/seed/boda2/400/300', mediaType: 'photo', caption: 'Pedro', userId: 'guest2', createdAt: new Date().toISOString() },
        { _id: '3', originalUrl: 'https://picsum.photos/seed/boda3/800/600', thumbnailUrl: 'https://picsum.photos/seed/boda3/400/300', mediaType: 'photo', caption: 'María', userId: 'guest3', createdAt: new Date().toISOString() },
      ]);
      setLoading(false);
      return;
    }

    const dev = DEVELOPMENT;
    const params = new URLSearchParams({ development: dev });

    fetch(`${API_BASE}/api/memories/public/${shareToken}?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || data.error || data.detail) {
          setError('Álbum no encontrado o enlace caducado.');
          return;
        }
        const albumData: PublicAlbum = data.album ?? data;
        setAlbum(albumData);

        const albumId = albumData._id;
        return fetch(`${API_BASE}/api/memories/albums/${albumId}/media?${params}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((mediaData) => {
            const items: PublicMedia[] = (mediaData?.media ?? mediaData ?? []).filter(Boolean);
            setMedia(items);
          });
      })
      .catch(() => setError('Error al cargar el álbum.'))
      .finally(() => setLoading(false));
  }, [shareToken]);

  const handleUploadClick = () => {
    if (!guestName) {
      setShowNameModal(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleNameConfirm = (name: string) => {
    sessionStorage.setItem(`memories_guest_${shareToken}`, name);
    setGuestName(name);
    setShowNameModal(false);
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const handleFileChange = async (files: FileList) => {
    if (!files.length || !album || !guestName) return;
    setUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('shareToken', shareToken);
      formData.append('guestName', guestName);
      formData.append('development', DEVELOPMENT);

      // Guest anonymous upload: guestId = anon_timestamp
      const guestId = sessionStorage.getItem(`memories_anon_${shareToken}`) || `anon_${Date.now()}`;
      sessionStorage.setItem(`memories_anon_${shareToken}`, guestId);

      const params = new URLSearchParams({
        development: DEVELOPMENT,
        user_id: guestId,
        caption: guestName,
      });

      await fetch(`${API_BASE}/api/memories/albums/${album._id}/upload?${params}`, {
        method: 'POST',
        body: formData,
      }).catch(() => null);

      setUploadProgress(Math.round(((i + 1) / files.length) * 100));
    }

    // Reload media
    const params = new URLSearchParams({ development: DEVELOPMENT });
    fetch(`${API_BASE}/api/memories/albums/${album._id}/media?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const items: PublicMedia[] = (data?.media ?? data ?? []).filter(Boolean);
        setMedia(items);
      })
      .finally(() => {
        setUploading(false);
        setUploadProgress(0);
      });
  };

  return (
    <>
      <Head>
        <title>{album?.name || 'Álbum compartido'} — Memories</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={album?.description || 'Álbum de fotos colaborativo'} />
      </Head>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <span>📸</span>
            <span className="text-base font-bold text-rose-500">Memories</span>
          </Link>
          {guestName && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-rose-100 rounded-full flex items-center justify-center text-sm">
                {guestName[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{guestName}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Loading */}
        {loading && (
          <div className="text-center py-20 text-gray-400 animate-pulse">Cargando álbum…</div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">😕</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Enlace no válido</h2>
            <p className="text-gray-500">{error}</p>
            <Link href="/" className="text-rose-500 text-sm mt-4 inline-block hover:underline">Ir a Memories →</Link>
          </div>
        )}

        {/* Album */}
        {!loading && album && (
          <>
            {/* Album header */}
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">{album.name}</h1>
              {album.description && (
                <p className="text-gray-500 text-sm">{album.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">{media.length} foto{media.length !== 1 ? 's' : ''}</p>
            </div>

            {/* Upload bar */}
            {uploading && (
              <div className="mb-5">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-rose-500 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Subiendo fotos… {uploadProgress}%</p>
              </div>
            )}

            {/* Upload button */}
            <div className="mb-6">
              <button
                onClick={handleUploadClick}
                disabled={uploading}
                className="w-full bg-rose-500 text-white py-3.5 rounded-2xl font-semibold text-sm hover:bg-rose-600 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                <span className="text-lg">📷</span>
                {uploading ? `Subiendo… ${uploadProgress}%` : 'Subir mis fotos'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFileChange(e.target.files)}
              />
            </div>

            {/* Empty state */}
            {media.length === 0 && (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-3xl">
                <div className="text-5xl mb-3">📷</div>
                <p className="text-gray-500 font-medium">Sé el primero en subir una foto</p>
                <p className="text-xs text-gray-400 mt-1">Toca el botón de arriba para empezar</p>
              </div>
            )}

            {/* Photo grid */}
            {media.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {media.map((m, i) => (
                  <button
                    key={m._id}
                    onClick={() => setLightboxIndex(i)}
                    className="relative aspect-square bg-gray-100 overflow-hidden rounded-xl group"
                  >
                    <img
                      src={m.thumbnailUrl || m.originalUrl}
                      alt={m.caption || `Foto ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {m.mediaType === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/50 rounded-full p-2">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                    {m.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1 opacity-0 group-hover:opacity-100 transition">
                        <p className="text-white text-[10px] truncate">{m.caption}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Footer branding */}
            <div className="mt-10 text-center">
              <Link href="/" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-rose-500 transition">
                <span>📸</span> Crea tu álbum gratis con <strong className="text-rose-400">Memories</strong>
              </Link>
            </div>
          </>
        )}
      </main>

      {/* Name modal */}
      {showNameModal && (
        <NameModal onConfirm={handleNameConfirm} onClose={() => setShowNameModal(false)} />
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox media={media} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const shareToken = typeof params?.shareToken === 'string' ? params.shareToken : '';
  return { props: { shareToken } };
};
