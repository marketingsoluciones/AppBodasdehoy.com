/**
 * Detalle de álbum — /app/album/[id]
 * Vista del organizador: fotos, gestión, compartir QR.
 * Auth igual que /app: AuthBridge → localStorage → redirect a /app
 */
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { MemoriesProvider, useMemoriesStore } from '@bodasdehoy/memories';
import type { AlbumMedia } from '@bodasdehoy/memories';
import { authBridge } from '@bodasdehoy/shared';

const API_BASE = process.env.NEXT_PUBLIC_MEMORIES_API_URL || 'https://api-ia.bodasdehoy.com';
const DEVELOPMENT = process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy';
const USER_ID_KEY = 'memories_user_id';

// ─── Photo grid ────────────────────────────────────────────────────────────────

function PhotoGrid({
  media,
  onClickPhoto,
  onSetCover,
}: {
  media: AlbumMedia[];
  onClickPhoto: (i: number) => void;
  onSetCover: (m: AlbumMedia) => void;
}) {
  if (media.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
      {media.map((m, i) => (
        <button
          key={m._id}
          data-testid="photo-item"
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
          {/* Set as cover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-200 flex items-end justify-center pb-2">
            <span
              role="button"
              data-testid="btn-set-cover"
              onClick={(e) => { e.stopPropagation(); onSetCover(m); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-gray-800 text-xs px-3 py-1 rounded-full font-medium shadow"
            >
              Usar como portada
            </span>
          </div>
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
  const [shareError, setShareError] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);

  useEffect(() => {
    generateShareLink(albumId, 30)
      .then((result) => {
        if (result?.shareUrl) setShareUrl(result.shareUrl);
        else setShareError(true);
      })
      .catch(() => setShareError(true))
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
      <div data-testid="share-modal" className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Compartir álbum</h2>

        {loading ? (
          <div className="h-48 flex items-center justify-center text-gray-400 animate-pulse">Generando enlace…</div>
        ) : shareError ? (
          <div data-testid="share-error" className="h-48 flex flex-col items-center justify-center gap-3">
            <p className="text-red-500 text-sm font-medium">No se pudo generar el enlace</p>
            <p className="text-gray-400 text-xs">Comprueba tu conexión e inténtalo de nuevo.</p>
          </div>
        ) : (
          <>
            {/* QR code */}
            {qrUrl && !qrFailed && (
              <div className="flex justify-center mb-6">
                <div className="p-3 bg-white border-2 border-gray-100 rounded-2xl shadow-sm">
                  <img
                    src={qrUrl}
                    alt="QR del álbum"
                    className="w-40 h-40"
                    onError={() => setQrFailed(true)}
                  />
                </div>
              </div>
            )}
            {qrFailed && (
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xs text-gray-400 text-center">
                  QR no disponible.<br />Usa el enlace de abajo.
                </div>
              </div>
            )}

            {/* Copy link */}
            <div className="flex gap-2 mb-4">
              <input
                readOnly
                data-testid="share-link"
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

// ─── Invite modal ──────────────────────────────────────────────────────────────

type InviteTab = 'email' | 'whatsapp';

function InviteModal({
  albumId,
  initialShareUrl,
  onClose,
}: {
  albumId: string;
  initialShareUrl: string;
  onClose: () => void;
}) {
  const { inviteMember, fetchAlbumMembers, generateShareLink, currentAlbumMembers, membersLoading } = useMemoriesStore();
  const [tab, setTab] = useState<InviteTab>('email');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [shareUrl, setShareUrl] = useState(initialShareUrl);
  const [shareUrlLoading, setShareUrlLoading] = useState(!initialShareUrl);

  useEffect(() => { fetchAlbumMembers(albumId); }, [albumId, fetchAlbumMembers]);

  // Si no teníamos shareUrl precargado, lo pedimos al abrir el modal
  useEffect(() => {
    if (initialShareUrl) return;
    setShareUrlLoading(true);
    generateShareLink(albumId, 30)
      .then((r) => { if (r?.shareUrl) setShareUrl(r.shareUrl); })
      .catch(() => {})
      .finally(() => setShareUrlLoading(false));
  }, [albumId, initialShareUrl, generateShareLink]);

  const handleEmailInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError('');
    const token = await inviteMember(albumId, email.trim(), role);
    setSending(false);
    if (token) {
      setSent(true);
      setEmail('');
      setTimeout(() => setSent(false), 3000);
    } else {
      setError('No se pudo enviar la invitación. Comprueba el email e inténtalo de nuevo.');
    }
  };

  // WhatsApp deep link con el share URL del álbum
  const whatsappText = shareUrl
    ? `¡Te invito a ver y subir fotos en nuestro álbum compartido! Entra aquí: ${shareUrl}`
    : '';
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-900 mb-5">Invitar personas</h2>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setTab('email')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${tab === 'email' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            ✉️ Por email
          </button>
          <button
            onClick={() => setTab('whatsapp')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${tab === 'whatsapp' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            💬 WhatsApp
          </button>
        </div>

        {tab === 'email' && (
          <form onSubmit={handleEmailInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email del invitado</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="invitado@email.com"
                required
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Permiso</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
              >
                <option value="viewer">Solo ver fotos</option>
                <option value="editor">Ver y subir fotos</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            {sent && <p className="text-green-600 text-xs font-medium">✓ Invitación enviada correctamente</p>}
            <button
              type="submit"
              disabled={!email.trim() || sending}
              className="w-full bg-rose-500 text-white rounded-2xl py-3 text-sm font-semibold hover:bg-rose-600 disabled:opacity-50 transition"
            >
              {sending ? 'Enviando…' : 'Enviar invitación'}
            </button>
          </form>
        )}

        {tab === 'whatsapp' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Se abrirá WhatsApp con un mensaje listo para enviar. El destinatario podrá acceder al álbum directamente desde el enlace.
            </p>
            {shareUrlLoading ? (
              <div className="h-24 flex items-center justify-center text-gray-400 animate-pulse text-sm">
                Preparando enlace…
              </div>
            ) : shareUrl ? (
              <>
                <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500 break-all">
                  {whatsappText.slice(0, 120)}…
                </div>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-green-500 text-white rounded-2xl py-3 text-sm font-semibold hover:bg-green-600 transition"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Abrir WhatsApp
                </a>
              </>
            ) : (
              <div className="h-24 flex flex-col items-center justify-center gap-2">
                <p className="text-sm text-gray-500">No se pudo generar el enlace.</p>
                <button
                  onClick={() => {
                    setShareUrlLoading(true);
                    generateShareLink(albumId, 30)
                      .then((r) => { if (r?.shareUrl) setShareUrl(r.shareUrl); })
                      .catch(() => {})
                      .finally(() => setShareUrlLoading(false));
                  }}
                  className="text-xs text-rose-500 underline hover:text-rose-600"
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Members list */}
        {currentAlbumMembers.length > 0 && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Miembros actuales ({currentAlbumMembers.length})
            </p>
            {membersLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <ul className="space-y-2 max-h-40 overflow-y-auto">
                {currentAlbumMembers.map((m) => (
                  <li key={m.userId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-xs font-bold text-rose-500">
                        {(m.userName || m.userEmail || '?')[0].toUpperCase()}
                      </div>
                      <span className="text-gray-700 truncate max-w-[180px]">{m.userEmail || m.userName || m.userId}</span>
                    </div>
                    <span className="text-xs text-gray-400 capitalize">{m.role}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button onClick={onClose} className="mt-5 text-sm text-gray-400 hover:text-gray-700 transition w-full text-center">
          Cerrar
        </button>
      </div>
    </div>
  );
}

// ─── Album detail content ──────────────────────────────────────────────────────

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
  } = useMemoriesStore();

  const isOwner = !!currentAlbum && currentAlbum.ownerId === userId;
  const watermarkEnabled = currentAlbum?.settings?.allow_watermark ?? false;

  const handleToggleWatermark = async () => {
    if (!currentAlbum) return;
    await updateAlbum(albumId, {
      settings: { ...currentAlbum.settings, allow_watermark: !watermarkEnabled },
    });
  };

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [coverSaved, setCoverSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { generateShareLink } = useMemoriesStore();

  const handleSetCover = async (m: AlbumMedia) => {
    await updateAlbum(albumId, { coverImageUrl: m.thumbnailUrl || m.originalUrl });
    setCoverSaved(true);
    setTimeout(() => setCoverSaved(false), 2500);
  };

  useEffect(() => {
    fetchAlbum(albumId);
    fetchAlbumMedia(albumId);
    // Precargamos el shareUrl para que el modal de invitación via WhatsApp lo tenga listo
    generateShareLink(albumId, 30)
      .then((r) => { if (r?.shareUrl) setShareUrl(r.shareUrl); })
      .catch(() => {});
  }, [albumId, fetchAlbum, fetchAlbumMedia, generateShareLink]);

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
            <div data-testid="album-detail">
              <h1 data-testid="album-detail-title" className="text-base font-bold text-gray-900 leading-tight">{currentAlbum.name}</h1>
              <p className="text-xs text-gray-400">{currentAlbumMedia.length} foto{currentAlbumMedia.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              data-testid="btn-invite"
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-500 px-3 py-2 rounded-xl text-sm font-medium transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Invitar
            </button>
            <button
              data-testid="btn-share"
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:border-rose-300 hover:text-rose-500 px-3 py-2 rounded-xl text-sm font-medium transition"
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
                className={`flex items-center gap-1.5 border px-3 py-2 rounded-xl text-sm font-medium transition ${watermarkEnabled ? 'border-violet-300 text-violet-600 bg-violet-50 hover:bg-violet-100' : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="hidden sm:inline">{watermarkEnabled ? 'Protegido' : 'Proteger'}</span>
              </button>
            )}
            <button
              data-testid="btn-upload"
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

        {/* Watermark info banner (visible only to owner when enabled) */}
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

        {/* Cover saved toast */}
        {coverSaved && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full shadow-lg z-50">
            ✓ Portada actualizada
          </div>
        )}

        {/* Photo grid */}
        {!mediaLoading && currentAlbumMedia.length > 0 && (
          <PhotoGrid media={currentAlbumMedia} onClickPhoto={setLightboxIndex} onSetCover={handleSetCover} />
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

      {/* Invite modal */}
      {showInvite && (
        <InviteModal albumId={albumId} initialShareUrl={shareUrl} onClose={() => setShowInvite(false)} />
      )}
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
    // 1. Intentar auth via sessionBodas cross-subdomain cookie (AuthBridge)
    const authState = authBridge.getSharedAuthState();
    if (authState.isAuthenticated && authState.user) {
      const bridgeId = authState.user.email || authState.user.uid;
      localStorage.setItem(USER_ID_KEY, bridgeId);
      setUserId(bridgeId);
      setHydrated(true);
      return;
    }

    // 2. Fallback: userId de localStorage
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
          <AlbumDetailContent albumId={albumId} userId={userId} />
        </div>
      </MemoriesProvider>
    </>
  );
}
