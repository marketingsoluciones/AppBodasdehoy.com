/**
 * Dashboard del organizador — /app
 * Muestra todos los álbumes del usuario.
 * Auth (prioridad):
 *   1. sessionBodas cross-subdomain cookie via AuthBridge (@bodasdehoy/shared)
 *   2. userId guardado en localStorage (sessions previas)
 *   3. Email input manual (fallback)
 */
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { MemoriesProvider, useMemoriesStore } from '@bodasdehoy/memories';
import type { Album } from '@bodasdehoy/memories';
import { authBridge } from '@bodasdehoy/shared';

const API_BASE = process.env.NEXT_PUBLIC_MEMORIES_API_URL || 'https://api-ia.bodasdehoy.com';
const DEVELOPMENT = process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy';
const USER_ID_KEY = 'memories_user_id';

// ─── Album card ────────────────────────────────────────────────────────────────

function AlbumCard({ album }: { album: Album }) {
  const dateLabel = album.createdAt
    ? new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(album.createdAt))
    : '';
  return (
    <Link
      href={`/app/album/${album._id}`}
      className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-rose-200 transition overflow-hidden flex flex-col"
    >
      {/* Cover */}
      <div className="aspect-video bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center overflow-hidden relative">
        {album.coverImageUrl ? (
          <img src={album.coverImageUrl} alt={album.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
        ) : (
          <span className="text-6xl opacity-50">📸</span>
        )}
        {/* Photo count badge */}
        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          {album.mediaCount} {album.mediaCount === 1 ? 'foto' : 'fotos'}
        </div>
      </div>
      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-rose-500 transition">{album.name}</h3>
        {album.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2 flex-1">{album.description}</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
          <span className="text-xs text-gray-400">{dateLabel}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            album.visibility === 'public' ? 'bg-green-100 text-green-600' :
            album.visibility === 'members' ? 'bg-blue-100 text-blue-600' :
            'bg-gray-100 text-gray-500'
          }`}>
            {album.visibility === 'public' ? 'Público' : album.visibility === 'members' ? 'Invitados' : 'Privado'}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Albums list (inner component inside MemoriesProvider) ─────────────────────

function AlbumsDashboard({ onLogout }: { onLogout: () => void }) {
  const { albums, albumsLoading, albumsError, fetchAlbums } = useMemoriesStore();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">📸</span>
            <span className="text-lg font-bold text-rose-500">Memories</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreate(true)}
              className="bg-rose-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-rose-600 transition"
            >
              + Nuevo álbum
            </button>
            <button
              onClick={onLogout}
              className="text-sm text-gray-400 hover:text-gray-700 transition"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">Mis álbumes</h1>
          <p className="text-gray-500 text-sm mt-1">
            {albumsLoading ? 'Cargando…' : `${albums.length} álbum${albums.length !== 1 ? 'es' : ''}`}
          </p>
        </div>

        {/* Error */}
        {albumsError && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 mb-6 text-sm">
            No se pudieron cargar los álbumes. Comprueba tu conexión e inténtalo de nuevo.
          </div>
        )}

        {/* Loading skeleton */}
        {albumsLoading && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-100 rounded-3xl h-56 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!albumsLoading && albums.length === 0 && !albumsError && (
          <div className="text-center py-20">
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

        {/* Grid */}
        {!albumsLoading && albums.length > 0 && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {albums.map((album) => (
              <AlbumCard key={album._id} album={album} />
            ))}
          </div>
        )}
      </main>

      {/* Create album modal */}
      {showCreate && <CreateAlbumModal onClose={() => setShowCreate(false)} />}
    </>
  );
}

// ─── Create album modal ────────────────────────────────────────────────────────

function CreateAlbumModal({ onClose }: { onClose: () => void }) {
  const { createAlbum, albumsLoading } = useMemoriesStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    await createAlbum({ name: name.trim(), description: description.trim() || undefined, visibility: 'members' });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Nuevo álbum</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del álbum *</label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Boda de Ana y Marcos"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bodega El Pinar, 14 de junio de 2026"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 rounded-2xl py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || submitting}
              className="flex-1 bg-rose-500 text-white rounded-2xl py-3 text-sm font-semibold hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? 'Creando…' : 'Crear álbum'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Login form (simple — sin Firebase todavía) ────────────────────────────────

function LoginForm({ onLogin }: { onLogin: (userId: string) => void }) {
  const [email, setEmail] = useState('');
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">📸</div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Memories</h1>
        <p className="text-gray-500 text-sm mb-8">Introduce tu email para acceder a tus álbumes.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) onLogin(email.trim());
          }}
          className="space-y-4"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            autoFocus
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
          />
          <button
            type="submit"
            className="w-full bg-rose-500 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-600 transition"
          >
            Acceder →
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/" className="text-rose-500 hover:underline">Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AppPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // 1. Intentar auth via sessionBodas cross-subdomain cookie (AuthBridge)
    const authState = authBridge.getSharedAuthState();
    if (authState.isAuthenticated && authState.user) {
      const bridgeId = authState.user.email || authState.user.uid;
      setUserId(bridgeId);
      localStorage.setItem(USER_ID_KEY, bridgeId);
      setHydrated(true);
      return;
    }

    // 2. Fallback: userId de localStorage o query param
    const stored = localStorage.getItem(USER_ID_KEY);
    const queryId = typeof router.query.userId === 'string' ? router.query.userId : null;
    const resolved = queryId || stored;
    if (resolved) {
      setUserId(resolved);
      if (!stored) localStorage.setItem(USER_ID_KEY, resolved);
    }
    setHydrated(true);
  }, [router.query.userId]);

  const handleLogin = (id: string) => {
    localStorage.setItem(USER_ID_KEY, id);
    setUserId(id);
  };

  const handleLogout = () => {
    localStorage.removeItem(USER_ID_KEY);
    setUserId(null);
  };

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
