/**
 * Dashboard del organizador — /app
 * Muestra todos los álbumes del usuario.
 */
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { MemoriesProvider, useMemoriesStore } from '@bodasdehoy/memories';
import type { Album } from '@bodasdehoy/memories';
import { useAuth } from '../../hooks/useAuth';
import { usePlan } from '../../hooks/usePlan';
import { trackSubscriptionComplete } from '@bodasdehoy/shared';
import LoginForm from '../../components/auth/LoginForm';
import { AlbumCard } from '../../components/albums/AlbumCard';
import { EventGroup } from '../../components/albums/EventGroup';

const CreateAlbumModal = dynamic(() => import('../../components/albums/CreateAlbumModal'));

const API_BASE = process.env.NEXT_PUBLIC_MEMORIES_API_URL || 'https://api-ia.bodasdehoy.com';
const DEVELOPMENT = (process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy').trim();

type ViewMode = 'grid' | 'event';

function AlbumsDashboard({ onLogout }: { onLogout: () => void }) {
  const { albums, albumsLoading, albumsError, fetchAlbums } = useMemoriesStore();
  const { canCreateAlbum, albumUsage, albumLimit } = usePlan();
  const [showCreate, setShowCreate] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { fetchAlbums(); }, [fetchAlbums]);

  const { eventGroups, standalone } = (() => {
    const groups: Record<string, Album[]> = {};
    const solo: Album[] = [];
    for (const a of albums) {
      if (a.eventId) {
        if (!groups[a.eventId]) groups[a.eventId] = [];
        groups[a.eventId].push(a);
      } else {
        solo.push(a);
      }
    }
    return { eventGroups: groups, standalone: solo };
  })();

  const hasEvents = Object.keys(eventGroups).length > 0;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between min-h-[56px] py-2">
          <Link href="/" className="flex items-center gap-2 min-h-[44px]">
            <span className="text-xl">📸</span>
            <span className="text-lg font-bold text-rose-500">Memories</span>
          </Link>
          <div className="flex items-center gap-2">
            {/* Desktop actions */}
            {hasEvents && (
              <div className="hidden sm:flex bg-gray-100 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${viewMode === 'grid' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Todos
                </button>
                <button
                  data-testid="view-toggle-event"
                  onClick={() => setViewMode('event')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${viewMode === 'event' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Por evento
                </button>
              </div>
            )}
            <button
              data-testid="btn-new-album"
              onClick={() => {
                if (canCreateAlbum(albums.length)) {
                  setShowCreate(true);
                } else {
                  setShowUpgradeModal(true);
                }
              }}
              className="bg-rose-500 text-white px-3 sm:px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-rose-600 transition min-h-[44px] flex items-center"
            >
              <span className="hidden sm:inline">+ Nuevo álbum</span>
              <span className="inline sm:hidden">+</span>
            </button>
            <Link href="/app/referral" className="text-sm text-rose-500 font-semibold hover:text-rose-700 transition hidden sm:flex items-center min-h-[44px]">
              🎁 Invita amigos
            </Link>
            <button onClick={onLogout} className="text-sm text-gray-400 hover:text-gray-700 transition hidden sm:flex items-center min-h-[44px] px-2">
              Salir
            </button>
            {/* Hamburger — visible only on mobile */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="sm:hidden flex items-center justify-center min-h-[44px] min-w-[44px] text-gray-500 hover:text-gray-800 transition"
              aria-label="Menú"
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            <Link
              href="/app/referral"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 text-sm text-rose-500 font-semibold py-2.5 min-h-[44px]"
            >
              🎁 Invita amigos
            </Link>
            <button
              onClick={() => { setMenuOpen(false); onLogout(); }}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition py-2.5 min-h-[44px] w-full text-left"
            >
              Salir
            </button>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Mis álbumes</h1>
              <p className="text-gray-500 text-sm mt-1">
                {albumsLoading ? 'Cargando…' : `${albums.length} álbum${albums.length !== 1 ? 'es' : ''}`}
              </p>
            </div>
            {!albumsLoading && albumLimit < 999_999 && (
              <Link href="/pro" className="flex items-center gap-2 text-sm no-underline min-h-[44px]">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(albumUsage(albums.length).percent, 100)}%`,
                        backgroundColor: albumUsage(albums.length).color,
                      }}
                    />
                  </div>
                  <span style={{ color: albumUsage(albums.length).color, fontWeight: 600 }}>
                    {albums.length > albumLimit
                      ? `${albums.length} álbumes (límite: ${albumLimit})`
                      : albumUsage(albums.length).text}
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>

        {albumsError && albums.length === 0 && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 mb-6 text-sm">
            No se pudieron cargar los álbumes. Comprueba tu conexión e inténtalo de nuevo.
          </div>
        )}

        {albumsLoading && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-100 rounded-3xl h-56 animate-pulse" />
            ))}
          </div>
        )}

        {!albumsLoading && albums.length === 0 && !albumsError && (
          <div data-testid="empty-state" className="text-center py-20">
            <div className="text-6xl mb-4">📸</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Aún no tienes álbumes</h2>
            <p className="text-gray-500 mb-8">Crea tu primer álbum y empieza a recoger los recuerdos de tu evento.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-rose-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-rose-600 transition"
            >
              Crear primer álbum
            </button>
          </div>
        )}

        {!albumsLoading && albums.length > 0 && viewMode === 'event' && (
          <div className="space-y-6">
            {Object.entries(eventGroups).map(([eventId, evAlbums]) => (
              <EventGroup key={eventId} eventId={eventId} albums={evAlbums} />
            ))}
            {standalone.length > 0 && (
              <>
                {Object.keys(eventGroups).length > 0 && (
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-8 mb-3">Sin evento asignado</p>
                )}
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-5">
                  {standalone.map((album) => <AlbumCard key={album._id} album={album} />)}
                </div>
              </>
            )}
          </div>
        )}

        {!albumsLoading && albums.length > 0 && viewMode === 'grid' && (
          <div data-testid="albums-grid" className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-5">
            {albums.map((album) => <AlbumCard key={album._id} album={album} />)}
          </div>
        )}
      </main>

      {showCreate && <CreateAlbumModal onClose={() => setShowCreate(false)} />}

      {/* Upgrade modal when album limit reached */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowUpgradeModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-4xl mb-4">📸</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Has usado todos tus álbumes</h2>
              <p className="text-gray-500 text-sm mb-6">
                Tu plan actual incluye {albumLimit} álbum{albumLimit !== 1 ? 'es' : ''}. Actualiza para crear más álbumes y guardar más recuerdos.
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/pro"
                  className="bg-rose-500 text-white px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-rose-600 transition no-underline"
                >
                  Ver planes
                </Link>
                <button
                  onClick={() => setShowUpgradeModal(false)}
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

export default function AppPage() {
  const { userId, hydrated, handleLogin, handleLogout } = useAuth();
  const router = useRouter();
  const [showUpgradedBanner, setShowUpgradedBanner] = useState(false);

  useEffect(() => {
    if (router.query.upgraded === '1') {
      setShowUpgradedBanner(true);
      const pending = (() => {
        try { return JSON.parse(localStorage.getItem('pending_purchase') || '{}'); } catch { return {}; }
      })();
      trackSubscriptionComplete(pending.planId || 'memories-plan', pending.price || 0);
      localStorage.removeItem('pending_purchase');
      // Limpiar el query param de la URL sin recargar
      router.replace('/app', undefined, { shallow: true });
    }
  }, [router.query.upgraded]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 animate-pulse text-sm">Cargando…</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Mis álbumes — Memories</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Banner de pago exitoso */}
      {showUpgradedBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3 text-sm font-semibold animate-fade-in">
          <span>🎉</span>
          <span>¡Plan activado! Ya puedes crear más álbumes.</span>
          <button onClick={() => setShowUpgradedBanner(false)} className="ml-2 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {!userId ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <MemoriesProvider apiBaseUrl={API_BASE} userId={userId} development={DEVELOPMENT}>
          <div className="min-h-screen bg-gray-50">
            <AlbumsDashboard onLogout={handleLogout} />
          </div>
        </MemoriesProvider>
      )}
    </>
  );
}
