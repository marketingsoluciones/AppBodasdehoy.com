/**
 * Vista pública de álbum — /album/[shareToken]
 * Accessible via QR o enlace compartido. Sin auth.
 */
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import NameModal from '../../components/public-album/NameModal';
import Toast from '../../components/shared/Toast';
import { validateFile, convertHeicIfNeeded, PHOTO_VIDEO_TYPES, PHOTO_VIDEO_ACCEPT } from '@bodasdehoy/shared/upload';

const Lightbox = dynamic(() => import('../../components/shared/Lightbox'));

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
    allow_watermark?: boolean;
  };
}

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
  const [toast, setToast] = useState<{ msg: string; variant: 'success' | 'error' | 'info' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`memories_guest_${shareToken}`);
    if (stored) setGuestName(stored);
  }, [shareToken]);

  useEffect(() => {
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

    let uploadedCount = 0;

    for (let i = 0; i < files.length; i++) {
      let file = files[i];

      // Validate file
      const validation = validateFile(file, { allowedTypes: [...PHOTO_VIDEO_TYPES] });
      if (!validation.valid) {
        setToast({ msg: `${file.name}: ${validation.error}`, variant: 'error' });
        continue;
      }

      // Convert HEIC/HEIF to JPEG
      try {
        file = await convertHeicIfNeeded(file);
      } catch {
        // Continue with original file
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('shareToken', shareToken);
      formData.append('guestName', guestName);
      formData.append('development', DEVELOPMENT);

      const guestId = sessionStorage.getItem(`memories_anon_${shareToken}`) || `anon_${Date.now()}`;
      sessionStorage.setItem(`memories_anon_${shareToken}`, guestId);

      const params = new URLSearchParams({
        development: DEVELOPMENT,
        user_id: guestId,
        caption: guestName,
      });

      try {
        const res = await fetch(`${API_BASE}/api/memories/albums/${album._id}/upload?${params}`, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        uploadedCount++;
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          setToast({ msg: `Error subiendo ${file.name}`, variant: 'error' });
        }
      }

      setUploadProgress(Math.round(((i + 1) / files.length) * 100));
    }

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
        if (uploadedCount > 0) {
          setToast({ msg: `${uploadedCount} foto${uploadedCount !== 1 ? 's' : ''} subida${uploadedCount !== 1 ? 's' : ''}`, variant: 'success' });
        }
      });
  };

  return (
    <>
      <Head>
        <title>{album?.name || 'Álbum compartido'} — Memories</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={album?.description || 'Álbum de fotos colaborativo'} />
        {album?.settings?.allow_watermark && (
          <style>{`@media print { body { display: none !important; } }`}</style>
        )}
      </Head>

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
        {loading && (
          <div className="text-center py-20 text-gray-400 animate-pulse">Cargando álbum…</div>
        )}

        {!loading && error && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">😕</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Enlace no válido</h2>
            <p className="text-gray-500">{error}</p>
            <Link href="/" className="text-rose-500 text-sm mt-4 inline-block hover:underline">Ir a Memories →</Link>
          </div>
        )}

        {!loading && album && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">{album.name}</h1>
              {album.description && (
                <p className="text-gray-500 text-sm">{album.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">{media.length} foto{media.length !== 1 ? 's' : ''}</p>
            </div>

            {uploading && (
              <div className="mb-5">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-2 bg-rose-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">Subiendo fotos… {uploadProgress}%</p>
              </div>
            )}

            {album.settings?.allow_uploads !== false && (
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
                  accept={PHOTO_VIDEO_ACCEPT}
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileChange(e.target.files)}
                />
              </div>
            )}

            {media.length === 0 && (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-3xl">
                <div className="text-5xl mb-3">📷</div>
                <p className="text-gray-500 font-medium">Sé el primero en subir una foto</p>
                <p className="text-xs text-gray-400 mt-1">Toca el botón de arriba para empezar</p>
              </div>
            )}

            {album.settings?.allow_watermark && (
              <div className="mb-4 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-xs text-gray-500">Las fotos están protegidas con marca de agua.</p>
              </div>
            )}

            {media.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {media.map((m, i) => (
                  <button
                    key={m._id}
                    onClick={() => setLightboxIndex(i)}
                    className="relative aspect-square bg-gray-100 overflow-hidden rounded-xl group"
                  >
                    <Image
                      src={m.thumbnailUrl || m.originalUrl}
                      alt={m.caption || `Foto ${i + 1}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      draggable={album.settings?.allow_watermark ? false : undefined}
                      onContextMenu={album.settings?.allow_watermark ? (e) => e.preventDefault() : undefined}
                      className="object-cover group-hover:scale-105 transition duration-300"
                    />
                    {album.settings?.allow_watermark && (
                      <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center" style={{ userSelect: 'none' }}>
                        <span className="text-white/40 font-bold text-sm rotate-[-35deg] whitespace-nowrap" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                          {album.name}
                        </span>
                      </div>
                    )}
                    {m.mediaType === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/50 rounded-full p-2">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                    {m.caption && !album.settings?.allow_watermark && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1 opacity-0 group-hover:opacity-100 transition">
                        <p className="text-white text-[10px] truncate">{m.caption}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-10 text-center">
              <Link href="/" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-rose-500 transition">
                <span>📸</span> Crea tu álbum gratis con <strong className="text-rose-400">Memories</strong>
              </Link>
            </div>
          </>
        )}
      </main>

      {toast && (
        <Toast message={toast.msg} variant={toast.variant} onClose={() => setToast(null)} />
      )}

      {showNameModal && (
        <NameModal onConfirm={handleNameConfirm} onClose={() => setShowNameModal(false)} />
      )}

      {lightboxIndex !== null && (
        <Lightbox
          media={media}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          watermarkText={album?.settings?.allow_watermark ? (album.name || 'Memories') : undefined}
        />
      )}
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const shareToken = typeof params?.shareToken === 'string' ? params.shareToken : '';
  return { props: { shareToken } };
};
