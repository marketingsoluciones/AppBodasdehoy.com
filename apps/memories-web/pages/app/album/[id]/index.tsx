/**
 * Detalle de álbum — /app/album/[id]
 * Vista del organizador: fotos, gestión, compartir QR.
 */
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { MemoriesProvider, useMemoriesStore } from '@bodasdehoy/memories';
import type { AlbumMedia } from '@bodasdehoy/memories';
import { useAuth } from '../../../../hooks/useAuth';
import { usePlan } from '../../../../hooks/usePlan';
import { PhotoGrid } from '../../../../components/album-detail/PhotoGrid';
import Toast from '../../../../components/shared/Toast';
import { convertHeicIfNeeded, PHOTO_VIDEO_ACCEPT } from '@bodasdehoy/shared/upload';

const Lightbox = dynamic(() => import('../../../../components/shared/Lightbox'));
const ShareModal = dynamic(() => import('../../../../components/album-detail/ShareModal'));
const InviteModal = dynamic(() => import('../../../../components/album-detail/InviteModal'));

const API_BASE = process.env.NEXT_PUBLIC_MEMORIES_API_URL || 'https://api-ia.bodasdehoy.com';
const DEVELOPMENT = process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy';

function AlbumDetailContent({ albumId, userId }: { albumId: string; userId: string }) {
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
    updateAlbum,
    generateShareLink,
  } = useMemoriesStore();

  const { canUploadPhoto, photoUsage, photoLimit } = usePlan();

  const isOwner = !!currentAlbum && currentAlbum.ownerId === userId;
  const watermarkEnabled = currentAlbum?.settings?.allow_watermark ?? false;

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showPhotoUpgradeModal, setShowPhotoUpgradeModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [coverSaved, setCoverSaved] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; variant: 'success' | 'error' | 'info' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggleWatermark = async () => {
    if (!currentAlbum) return;
    await updateAlbum(albumId, {
      settings: { ...currentAlbum.settings, allow_watermark: !watermarkEnabled },
    });
  };

  const handleSetCover = async (m: AlbumMedia) => {
    await updateAlbum(albumId, { coverImageUrl: m.thumbnailUrl || m.originalUrl });
    setCoverSaved(true);
  };

  useEffect(() => {
    // fetchAlbum primero para que resolveWriteId tenga el slug cuando fetchAlbumMedia lo necesite
    fetchAlbum(albumId).then(() => fetchAlbumMedia(albumId));
  }, [albumId, fetchAlbum, fetchAlbumMedia]);

  // Genera el share link solo cuando el owner abre el modal (no en mount para todos los roles)
  const handleOpenShare = async () => {
    if (!shareUrl && isOwner) {
      const r = await generateShareLink(albumId, 30).catch(() => null);
      if (r?.shareUrl) setShareUrl(r.shareUrl);
    }
    setShowShare(true);
  };

  const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

  const handleUpload = async (files: FileList) => {
    if (!files.length) return;
    setUploading(true);
    let uploadedCount = 0;
    for (const rawFile of Array.from(files)) {
      if (rawFile.size > MAX_FILE_SIZE_BYTES) {
        setToastMsg({ text: `${rawFile.name} supera el límite de 50 MB`, variant: 'error' });
        continue;
      }
      try {
        const file = await convertHeicIfNeeded(rawFile);
        await uploadMedia(albumId, file);
        uploadedCount++;
      } catch (e: any) {
        setToastMsg({ text: `Error subiendo ${rawFile.name}: ${e.message || 'Error'}`, variant: 'error' });
      }
    }
    await fetchAlbumMedia(albumId);
    setUploading(false);
    if (uploadedCount > 0) {
      setToastMsg({ text: `${uploadedCount} foto${uploadedCount !== 1 ? 's' : ''} subida${uploadedCount !== 1 ? 's' : ''}`, variant: 'success' });
    }
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
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link href="/app" className="text-gray-400 hover:text-gray-700 transition flex items-center min-h-[44px] min-w-[44px] justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div data-testid="album-detail" className="min-w-0">
              <h1 data-testid="album-detail-title" className="text-base font-bold text-gray-900 leading-tight truncate">{currentAlbum.name}</h1>
              <p className="text-xs text-gray-400">{currentAlbumMedia.length} foto{currentAlbumMedia.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isOwner && (
              <Link
                href={`/app/album/${albumId}/settings`}
                data-testid="btn-settings"
                className="flex items-center gap-1.5 border border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-700 px-3 py-3 rounded-xl text-sm font-medium transition"
                title="Administrar miembros y permisos"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline">Miembros</span>
              </Link>
            )}
            <button
              data-testid="btn-invite"
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-500 px-3 py-3 rounded-xl text-sm font-medium transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Invitar
            </button>
            <button
              data-testid="btn-share"
              onClick={handleOpenShare}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:border-rose-300 hover:text-rose-500 px-3 py-3 rounded-xl text-sm font-medium transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Compartir
            </button>
            {isOwner && (
              <button
                data-testid="btn-watermark-toggle"
                onClick={handleToggleWatermark}
                title={watermarkEnabled ? 'Desactivar marca de agua' : 'Activar protección con marca de agua'}
                className={`flex items-center gap-1.5 border px-3 py-3 rounded-xl text-sm font-medium transition ${watermarkEnabled ? 'border-violet-300 text-violet-600 bg-violet-50 hover:bg-violet-100' : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="hidden sm:inline">{watermarkEnabled ? 'Protegido' : 'Proteger'}</span>
              </button>
            )}
            <button
              data-testid="btn-upload"
              onClick={() => {
                if (canUploadPhoto(currentAlbumMedia.length)) {
                  fileInputRef.current?.click();
                } else {
                  setShowPhotoUpgradeModal(true);
                }
              }}
              disabled={uploading}
              className="bg-rose-500 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-rose-600 disabled:opacity-50 transition flex items-center gap-1.5"
            >
              📷 {uploading ? `Subiendo ${uploadProgress}%` : 'Subir fotos'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={PHOTO_VIDEO_ACCEPT}
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {currentAlbum.description && (
          <p className="text-gray-500 text-sm mb-6">{currentAlbum.description}</p>
        )}

        {isOwner && watermarkEnabled && (
          <div className="mb-6 flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3">
            <svg className="w-5 h-5 text-violet-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-sm text-violet-700">
              <strong>Protección activada.</strong> Los invitados ven las fotos con marca de agua. Tú las ves sin marca de agua.
            </p>
          </div>
        )}

        {/* Photo usage bar */}
        {!mediaLoading && photoLimit < 999_999 && (
          <div className="mb-6 flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Fotos usadas</span>
                <span className="text-xs font-semibold" style={{ color: photoUsage(currentAlbumMedia.length).color }}>
                  {photoUsage(currentAlbumMedia.length).text}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${photoUsage(currentAlbumMedia.length).percent}%`,
                    backgroundColor: photoUsage(currentAlbumMedia.length).color,
                  }}
                />
              </div>
            </div>
            <a href="/pro" className="text-xs text-rose-500 font-semibold hover:underline whitespace-nowrap">
              Cambiar plan
            </a>
          </div>
        )}

        {uploading && (
          <div className="mb-6">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-2 bg-rose-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">Subiendo… {uploadProgress}%</p>
          </div>
        )}

        {!mediaLoading && currentAlbumMedia.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📷</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Aún no hay fotos</h2>
            <p className="text-gray-500 mb-8">Sube las primeras fotos o comparte el QR con tus invitados.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => fileInputRef.current?.click()} className="bg-rose-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-rose-600 transition">
                Subir fotos
              </button>
              <button onClick={handleOpenShare} className="border border-gray-200 text-gray-600 px-6 py-3 rounded-full font-semibold hover:border-rose-300 hover:text-rose-500 transition">
                Compartir QR
              </button>
            </div>
          </div>
        )}

        {mediaLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {coverSaved && <Toast message="Portada actualizada" onClose={() => setCoverSaved(false)} />}
        {toastMsg && <Toast message={toastMsg.text} variant={toastMsg.variant} onClose={() => setToastMsg(null)} />}

        {!mediaLoading && currentAlbumMedia.length > 0 && (
          <PhotoGrid media={currentAlbumMedia} onClickPhoto={setLightboxIndex} onSetCover={handleSetCover} />
        )}
      </main>

      {lightboxIndex !== null && (
        <Lightbox media={currentAlbumMedia} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}

      {showShare && <ShareModal albumId={albumId} onClose={() => setShowShare(false)} />}

      {showInvite && (
        <InviteModal albumId={albumId} initialShareUrl={shareUrl} onClose={() => setShowInvite(false)} />
      )}

      {/* Photo limit upgrade modal */}
      {showPhotoUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowPhotoUpgradeModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-4xl mb-4">📷</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Has capturado {photoLimit} momentos</h2>
              <p className="text-gray-500 text-sm mb-6">
                Actualiza tu plan para seguir añadiendo recuerdos a este álbum.
              </p>
              <div className="flex gap-3 justify-center">
                <a
                  href="/pro"
                  className="bg-rose-500 text-white px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-rose-600 transition no-underline"
                >
                  Ver planes
                </a>
                <button
                  onClick={() => setShowPhotoUpgradeModal(false)}
                  className="border border-gray-200 text-gray-600 px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AlbumPage() {
  const router = useRouter();
  const { userId, hydrated } = useAuth({ redirectTo: '/app' });
  const albumId = typeof router.query.id === 'string' ? router.query.id : null;

  if (!hydrated || !albumId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 animate-pulse text-sm">Cargando…</div>
      </div>
    );
  }

  if (!userId) return null;

  return (
    <>
      <Head>
        <title>Álbum — Memories</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <MemoriesProvider apiBaseUrl={API_BASE} userId={userId} development={DEVELOPMENT}>
        <div className="min-h-screen bg-gray-50">
          <AlbumDetailContent albumId={albumId} userId={userId} />
        </div>
      </MemoriesProvider>
    </>
  );
}
