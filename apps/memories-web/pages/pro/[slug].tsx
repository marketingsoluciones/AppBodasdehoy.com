/**
 * /pro/[slug] — Portfolio público del profesional
 *
 * Fotos protegidas:
 *  - Overlay con marca de agua (CSS, pointer-events: none)
 *  - draggable="false" + onContextMenu disabled en la img
 *  - Print CSS: propietario autenticado imprime sin marca de agua
 *  - Los clientes nunca ven URL directa de descarga
 */
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { useEffect, useRef, useState } from 'react';
import { MemoriesProvider, useMemoriesStore } from '@bodasdehoy/memories';
import type { ProfessionalProfile, AlbumMedia } from '@bodasdehoy/memories';
import { authBridge } from '@bodasdehoy/shared';

const API_BASE = process.env.NEXT_PUBLIC_MEMORIES_API_URL || 'https://api-ia.bodasdehoy.com';
const DEVELOPMENT = process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy';

// ─── Protected photo ────────────────────────────────────────────────────────────

/**
 * Muestra una foto con:
 * 1. Overlay con marca de agua (visible siempre para viewers)
 * 2. CSS print: marca de agua oculta solo cuando isOwner=true
 * 3. Sin drag, sin menú contextual (dificulta descarga directa)
 */
function ProtectedPhoto({
  src,
  alt,
  watermarkText,
  isOwner,
  onClick,
}: {
  src: string;
  alt: string;
  watermarkText: string;
  isOwner: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gray-100 aspect-square cursor-pointer group ${
        isOwner ? 'photo-owner' : 'photo-viewer'
      }`}
      onClick={onClick}
      style={{ userSelect: 'none' }}
    >
      {/* Imagen — draggable=false evita arrastrar y guardar */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full object-cover group-hover:scale-105 transition duration-300 pointer-events-none"
      />

      {/* Marca de agua diagonal — pointer-events:none para que no bloquee el click */}
      <div
        className="watermark-overlay absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden
      >
        {/* Repetición diagonal de la marca */}
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className="absolute text-white/25 font-semibold text-sm select-none whitespace-nowrap"
            style={{
              transform: `rotate(-35deg) translate(${(i % 3 - 1) * 100}%, ${(Math.floor(i / 3) - 1) * 80}%)`,
              fontSize: '13px',
              letterSpacing: '0.05em',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            }}
          >
            {watermarkText}
          </span>
        ))}
      </div>

      {/* Hover overlay sutil */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />

      <style jsx>{`
        /* Propietario: ocultar marca de agua al imprimir */
        .photo-owner .watermark-overlay {
          display: flex;
        }
        @media print {
          .photo-owner .watermark-overlay {
            display: none !important;
          }
          .photo-viewer .watermark-overlay {
            display: flex !important;
            opacity: 0.5 !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Lightbox with protection ──────────────────────────────────────────────────

function ProtectedLightbox({
  media,
  index,
  watermarkText,
  isOwner,
  onClose,
  onPrev,
  onNext,
}: {
  media: AlbumMedia[];
  index: number;
  watermarkText: string;
  isOwner: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const current = media[index];
  if (!current) return null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
        onClick={onClose}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {index > 0 && (
        <button
          className="absolute left-4 text-white/70 hover:text-white p-2"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <div
        className="relative max-w-4xl max-h-screen p-4"
        onClick={(e) => e.stopPropagation()}
        style={{ userSelect: 'none' }}
      >
        <img
          src={current.originalUrl}
          alt={current.caption || `Foto ${index + 1}`}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          className="max-h-[85vh] max-w-full object-contain pointer-events-none"
        />

        {/* Watermark en lightbox */}
        <div className="absolute inset-4 flex items-center justify-center pointer-events-none" aria-hidden>
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-white/20 font-semibold select-none whitespace-nowrap"
              style={{
                transform: `rotate(-35deg) translate(${(i % 4 - 1.5) * 150}%, ${(Math.floor(i / 4) - 1) * 100}%)`,
                fontSize: '15px',
              }}
            >
              {watermarkText}
            </span>
          ))}
        </div>

        {/* Print CSS — propietario sin watermark */}
        <style jsx>{`
          @media print {
            ${isOwner ? `
              div[aria-hidden] { display: none !important; }
            ` : ''}
          }
        `}</style>
      </div>

      {index < media.length - 1 && (
        <button
          className="absolute right-4 text-white/70 hover:text-white p-2"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div className="absolute bottom-4 text-white/50 text-sm">
        {index + 1} / {media.length}
        {isOwner && (
          <button
            className="ml-4 text-white/70 hover:text-white underline"
            onClick={(e) => { e.stopPropagation(); window.print(); }}
          >
            Imprimir
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Album section ─────────────────────────────────────────────────────────────

function PortfolioAlbumSection({
  albumId,
  watermarkText,
  isOwner,
}: {
  albumId: string;
  watermarkText: string;
  isOwner: boolean;
}) {
  const { fetchAlbum, fetchAlbumMedia, currentAlbum, currentAlbumMedia } = useMemoriesStore();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [album, setAlbum] = useState<any>(null);
  const [media, setMedia] = useState<AlbumMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [albumRes, mediaRes] = await Promise.all([
          fetch(`${API_BASE}/api/memories/albums/${albumId}?development=${DEVELOPMENT}`),
          fetch(`${API_BASE}/api/memories/albums/${albumId}/media?development=${DEVELOPMENT}`),
        ]);
        const albumData = await albumRes.json();
        const mediaData = await mediaRes.json();
        if (albumData?.success) setAlbum(albumData.album);
        if (mediaData?.success) setMedia(mediaData.media || []);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [albumId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!album) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        {album.coverImageUrl && (
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
            <img src={album.coverImageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{album.name}</h2>
          {album.description && (
            <p className="text-sm text-gray-500">{album.description}</p>
          )}
        </div>
        <span className="ml-auto text-sm text-gray-400">{media.length} fotos</span>
      </div>

      {media.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">Este álbum no tiene fotos todavía.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {media.map((m, i) => (
            <ProtectedPhoto
              key={m._id}
              src={m.thumbnailUrl || m.originalUrl}
              alt={m.caption || `Foto ${i + 1}`}
              watermarkText={watermarkText}
              isOwner={isOwner}
              onClick={() => setLightboxIdx(i)}
            />
          ))}
        </div>
      )}

      {lightboxIdx !== null && (
        <ProtectedLightbox
          media={media}
          index={lightboxIdx}
          watermarkText={watermarkText}
          isOwner={isOwner}
          onClose={() => setLightboxIdx(null)}
          onPrev={() => setLightboxIdx((i) => Math.max(0, (i ?? 0) - 1))}
          onNext={() => setLightboxIdx((i) => Math.min(media.length - 1, (i ?? 0) + 1))}
        />
      )}
    </section>
  );
}

// ─── Specialty badge ────────────────────────────────────────────────────────────

const SPECIALTY_LABELS: Record<string, string> = {
  photographer: '📷 Fotógrafo/a',
  videographer: '🎬 Videógrafo/a',
  dj: '🎧 DJ',
  florist: '💐 Florista',
  catering: '🍽️ Catering',
  venue: '🏛️ Sala / Venue',
  makeup: '💄 Maquillaje',
  hairstylist: '✂️ Peluquería',
  wedding_planner: '📋 Wedding Planner',
  musician: '🎵 Músico/a',
  officiant: '⛪ Officiante',
  other: '🌟 Profesional',
};

// ─── Public portfolio page ─────────────────────────────────────────────────────

function PublicPortfolioContent({ profile }: { profile: ProfessionalProfile }) {
  const [isOwner, setIsOwner] = useState(false);
  const watermark = profile.watermarkText || profile.name;

  useEffect(() => {
    // Check if the visiting user is the owner of this profile
    const check = () => {
      try {
        const state = authBridge.getSharedAuthState();
        if (state?.user?.uid && state.user.uid === profile.userId) {
          setIsOwner(true);
          return;
        }
      } catch {}
      const stored = localStorage.getItem('memories_user_id');
      if (stored && stored === profile.userId) setIsOwner(true);
    };
    check();
  }, [profile.userId]);

  return (
    <MemoriesProvider apiBaseUrl={API_BASE} userId={profile.userId} development={DEVELOPMENT}>
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>{profile.name} — Portfolio Profesional</title>
          <meta name="description" content={profile.bio || `Portfolio de ${profile.name}`} />
        </Head>

        {/* Print styles — owner: clean photos; viewer: watermark in print */}
        <style jsx global>{`
          @media print {
            header, .no-print { display: none !important; }
            body { background: white; }
          }
        `}</style>

        {/* Header / Profile hero */}
        <header className="bg-white border-b border-gray-100 no-print">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center flex-shrink-0">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                ) : (
                  <span className="text-3xl text-white">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                  {isOwner && (
                    <span className="bg-pink-100 text-pink-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      Mi perfil
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  {SPECIALTY_LABELS[profile.specialty] || profile.specialty}
                  {profile.location && ` · ${profile.location}`}
                </p>
                {profile.bio && (
                  <p className="text-sm text-gray-700 max-w-xl">{profile.bio}</p>
                )}

                {/* Links */}
                <div className="flex flex-wrap gap-3 mt-3">
                  {profile.email && (
                    <a
                      href={`mailto:${profile.email}`}
                      className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-pink-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {profile.email}
                    </a>
                  )}
                  {profile.whatsapp && (
                    <a
                      href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-green-600 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      WhatsApp
                    </a>
                  )}
                  {profile.instagram && (
                    <a
                      href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-pink-600 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                      {profile.instagram}
                    </a>
                  )}
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-pink-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                      </svg>
                      Web
                    </a>
                  )}
                </div>
              </div>

              {/* Edit button for owner */}
              {isOwner && (
                <a
                  href="/app/profile"
                  className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                >
                  Editar perfil
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Portfolio */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          {isOwner && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm mb-6 flex items-center gap-2 no-print">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Estás viendo tu propio portfolio. Tus clientes verán la marca de agua "{watermark}" sobre las fotos.
              {profile.printPermission === 'owner_only' && ' Solo tú puedes imprimir sin marca de agua.'}
            </div>
          )}

          {profile.portfolioAlbumIds.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">📷</p>
              <p className="text-lg font-medium text-gray-600">Portfolio vacío</p>
              <p className="text-sm mt-1">
                {isOwner ? (
                  <>
                    <a href="/app/profile" className="text-pink-600 hover:underline">
                      Añade álbumes a tu portfolio
                    </a>{' '}
                    para que los clientes puedan verlos.
                  </>
                ) : (
                  'Este profesional no tiene fotos publicadas todavía.'
                )}
              </p>
            </div>
          ) : (
            profile.portfolioAlbumIds.map((albumId) => (
              <PortfolioAlbumSection
                key={albumId}
                albumId={albumId}
                watermarkText={watermark}
                isOwner={isOwner}
              />
            ))
          )}
        </main>
      </div>
    </MemoriesProvider>
  );
}

// ─── Page with server-side profile fetch ──────────────────────────────────────

interface Props {
  profile: ProfessionalProfile | null;
  slug: string;
}

export default function ProPage({ profile, slug }: Props) {
  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
        <Head>
          <title>Perfil no encontrado — Memories</title>
        </Head>
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Perfil no encontrado</h1>
        <p className="text-sm text-gray-500 mb-6">
          No existe ningún profesional con la URL{' '}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-pink-600">/pro/{slug}</code>
        </p>
        <a href="/" className="text-pink-600 hover:underline text-sm">
          Volver al inicio
        </a>
      </div>
    );
  }

  if (!profile.isPublic) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
        <Head>
          <title>Perfil privado — Memories</title>
        </Head>
        <p className="text-5xl mb-4">🔒</p>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Este portfolio es privado</h1>
        <p className="text-sm text-gray-500">El profesional ha desactivado su portfolio público.</p>
      </div>
    );
  }

  return <PublicPortfolioContent profile={profile} />;
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const slug = ctx.params?.slug as string;
  const development = process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy';
  const apiBase = process.env.NEXT_PUBLIC_MEMORIES_API_URL || 'https://api-ia.bodasdehoy.com';

  try {
    const res = await fetch(
      `${apiBase}/api/memories/professionals/slug/${slug}?development=${development}`,
    );
    const data = await res.json();
    const profile: ProfessionalProfile | null = data?.success && data.profile ? data.profile : null;
    return { props: { profile, slug } };
  } catch {
    return { props: { profile: null, slug } };
  }
};
