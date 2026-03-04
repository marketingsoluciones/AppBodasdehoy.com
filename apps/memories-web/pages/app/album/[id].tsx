/**
 * Detalle de álbum — /app/album/[id]
 * Vista del organizador: fotos, gestión, compartir QR.
 */
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { MemoriesProvider, useMemoriesStore } from '@bodasdehoy/memories';
import type { AlbumMedia } from '@bodasdehoy/memories';

const API_BASE = process.env.NEXT_PUBLIC_MEMORIES_API_URL || 'https://api-ia.bodasdehoy.com';
const DEVELOPMENT = process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy';
const USER_ID_KEY = 'memories_user_id';

// ─── Photo grid ────────────────────────────────────────────────────────────────

function PhotoGrid({
  media,
  onClickPhoto,
}: {
  media: AlbumMedia[];
  onClickPhoto: (i: number) => void;
}) {
  if (media.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
      {media.map((m, i) => (
        <button
          key={m._id}
          onClick={() => onClickPhoto(i)}
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
        </button>
      ))}
    </div>
  );
}

// ─── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({ media, initialIndex, onClose }: { media: AlbumMedia[]; initialIndex: number; onClose: () => void }) {
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
        className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl z-10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition"
      >
        ✕
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); setCurrent((c) => Math.max(0, c - 1)); }}
        className="absolute left-4 text-white/70 hover:text-white z-10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition disabled:opacity-30"
        disabled={current === 0}
      >
        ←
      </button>
      <img
        src={m?.originalUrl}
        alt={m?.caption || ''}
        className="max-w-full max-h-full object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={(e) => { e.stopPropagation(); setCurrent((c) => Math.min(media.length - 1, c + 1)); }}
        className="absolute right-4 text-white/70 hover:text-white z-10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition disabled:opacity-30"
        disabled={current === media.length - 1}
      >
        →
      </button>
      <p className="absolute bottom-4 text-white/50 text-sm">
        {current + 1} / {media.length}
        {m?.caption && <span className="ml-3 text-white/70">{m.caption}</span>}
      </p>
    </div>
  );
}

// ─── Share modal ───────────────────────────────────────────────────────────────

function ShareModal({ albumId, onClose }: { albumId: string; onClose: () => void }) {
  const { generateShareLink } = useMemoriesStore();
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generateShareLink(albumId, 30)
      .then((result) => { if (result?.shareUrl) setShareUrl(result.shareUrl); })
      .finally(() => setLoading(false));
  }, [albumId, generateShareLink]);

  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const qrUrl = shareUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(shareUrl)}&size=200x200&margin=10`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Compartir álbum</h2>

        {loading ? (
          <div className="h-48 flex items-center justify-center text-gray-400 animate-pulse">Generando enlace…</div>
        ) : (
          <>
            {/* QR code */}
            {qrUrl && (
              <div className="flex justify-center mb-6">
                <div className="p-3 bg-white border-2 border-gray-100 rounded-2xl shadow-sm">
                  <img src={qrUrl} alt="QR del álbum" className="w-40 h-40" />
                </div>
              </div>
            )}

            {/* Copy link */}
            <div className="flex gap-2 mb-4">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 truncate"
              />
              <button
                onClick={copyToClipboard}
                className="bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-rose-600 transition flex-shrink-0"
              >
                {copied ? '✓' : 'Copiar'}
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Comparte este enlace o código QR con tus invitados para que puedan ver y subir fotos sin registro.
            </p>
          </>
        )}

        <button onClick={onClose} className="mt-6 text-sm text-gray-400 hover:text-gray-700 transition">Cerrar</button>
      </div>
    </div>
  );
}

// ─── Album detail content ──────────────────────────────────────────────────────

function AlbumDetailContent({ albumId }: { albumId: string }) {
  const {
    currentAlbum,
    currentAlbumLoading,
    currentAlbumError,
    currentAlbumMedia,
    mediaLoading,
    fetchAlbum,
    fetchAlbumMedia,
    uploadMedia,
    uploadProgress,
  } = useMemoriesStore();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAlbum(albumId);
    fetchAlbumMedia(albumId);
  }, [albumId, fetchAlbum, fetchAlbumMedia]);

  const handleUpload = async (files: FileList) => {
    if (!files.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      await uploadMedia(albumId, file);
    }
    await fetchAlbumMedia(albumId);
    setUploading(false);
  };

  if (currentAlbumLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 animate-pulse">
        Cargando álbum…
      </div>
    );
  }

  if (currentAlbumError || !currentAlbum) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">{currentAlbumError || 'Álbum no encontrado'}</p>
        <Link href="/app" className="text-rose-500 text-sm mt-4 inline-block hover:underline">← Volver a mis álbumes</Link>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/app" className="text-gray-400 hover:text-gray-700 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">{currentAlbum.name}</h1>
              <p className="text-xs text-gray-400">{currentAlbumMedia.length} foto{currentAlbumMedia.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:border-rose-300 hover:text-rose-500 px-3 py-2 rounded-xl text-sm font-medium transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Compartir
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-rose-600 disabled:opacity-50 transition flex items-center gap-1.5"
            >
              📷 {uploading ? `Subiendo ${uploadProgress}%` : 'Subir fotos'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Description */}
        {currentAlbum.description && (
          <p className="text-gray-500 text-sm mb-6">{currentAlbum.description}</p>
        )}

        {/* Upload progress bar */}
        {uploading && (
          <div className="mb-6">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-2 bg-rose-500 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Subiendo… {uploadProgress}%</p>
          </div>
        )}

        {/* Empty state */}
        {!mediaLoading && currentAlbumMedia.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📷</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Aún no hay fotos</h2>
            <p className="text-gray-500 mb-8">Sube las primeras fotos o comparte el QR con tus invitados.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-rose-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-rose-600 transition"
              >
                Subir fotos
              </button>
              <button
                onClick={() => setShowShare(true)}
                className="border border-gray-200 text-gray-600 px-6 py-3 rounded-full font-semibold hover:border-rose-300 hover:text-rose-500 transition"
              >
                Compartir QR
              </button>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {mediaLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Photo grid */}
        {!mediaLoading && currentAlbumMedia.length > 0 && (
          <PhotoGrid media={currentAlbumMedia} onClickPhoto={setLightboxIndex} />
        )}
      </main>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          media={currentAlbumMedia}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Share modal */}
      {showShare && <ShareModal albumId={albumId} onClose={() => setShowShare(false)} />}
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AlbumPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const albumId = typeof router.query.id === 'string' ? router.query.id : null;

  useEffect(() => {
    const stored = localStorage.getItem(USER_ID_KEY);
    setUserId(stored);
    setHydrated(true);
  }, []);

  if (!hydrated || !albumId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 animate-pulse text-sm">Cargando…</div>
      </div>
    );
  }

  if (!userId) {
    if (typeof window !== 'undefined') router.push('/app');
    return null;
  }

  return (
    <>
      <Head>
        <title>Álbum — Memories</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <MemoriesProvider apiBaseUrl={API_BASE} userId={userId} development={DEVELOPMENT}>
        <div className="min-h-screen bg-gray-50">
          <AlbumDetailContent albumId={albumId} />
        </div>
      </MemoriesProvider>
    </>
  );
}
