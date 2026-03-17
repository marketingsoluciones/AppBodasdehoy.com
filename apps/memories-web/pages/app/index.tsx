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
import type { Album, AlbumType } from '@bodasdehoy/memories';
import { authBridge } from '@bodasdehoy/shared';

const API_BASE = process.env.NEXT_PUBLIC_MEMORIES_API_URL || 'https://api-ia.bodasdehoy.com';
const DEVELOPMENT = process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy';
const USER_ID_KEY = 'memories_user_id';

// ─── Album type config ─────────────────────────────────────────────────────────

type AlbumTypeConfig = { label: string; icon: string; from: string; to: string };

const ALBUM_TYPE_CONFIG: Record<string, AlbumTypeConfig> = {
  // Genéricos
  general:              { label: 'General',             icon: '📁', from: '#6366f1', to: '#4f46e5' },
  guestbook:            { label: 'Libro de visitas',    icon: '📖', from: '#f43f5e', to: '#e11d48' },
  photographer:         { label: 'Fotógrafo oficial',   icon: '📷', from: '#1e293b', to: '#0f172a' },
  // Boda
  wedding_childhood:    { label: 'Infancia',            icon: '👶', from: '#f59e0b', to: '#d97706' },
  wedding_engagement:   { label: 'Pedida de mano',      icon: '💍', from: '#ec4899', to: '#db2777' },
  wedding_bachelor:     { label: 'Despedida',           icon: '🎉', from: '#a855f7', to: '#7c3aed' },
  wedding_ceremony:     { label: 'Ceremonia',           icon: '💒', from: '#f43f5e', to: '#e11d48' },
  wedding_reception:    { label: 'Recepción/Banquete',  icon: '🥂', from: '#10b981', to: '#0d9488' },
  wedding_honeymoon:    { label: 'Luna de miel',        icon: '✈️',  from: '#3b82f6', to: '#2563eb' },
  // Cumpleaños
  birthday_party:       { label: 'La fiesta',           icon: '🎂', from: '#f97316', to: '#ea580c' },
  birthday_history:     { label: 'Historia de vida',    icon: '🎞️',  from: '#8b5cf6', to: '#7c3aed' },
  birthday_surprise:    { label: 'Sorpresa',            icon: '🎁', from: '#06b6d4', to: '#0891b2' },
  // Quinceañera / Sweet 16
  xv_childhood:         { label: 'Infancia',            icon: '🌸', from: '#f9a8d4', to: '#ec4899' },
  xv_preparation:       { label: 'Preparación',         icon: '💄', from: '#e879f9', to: '#c026d3' },
  xv_ceremony:          { label: 'Ceremonia',           icon: '👑', from: '#fbbf24', to: '#d97706' },
  xv_party:             { label: 'La fiesta',           icon: '🪩', from: '#a855f7', to: '#7c3aed' },
  // Graduación
  graduation_ceremony:  { label: 'Graduación',          icon: '🎓', from: '#1e40af', to: '#1d4ed8' },
  graduation_memories:  { label: 'Recuerdos',           icon: '🏫', from: '#059669', to: '#047857' },
  graduation_trip:      { label: 'Viaje de fin de curso', icon: '🗺️', from: '#0891b2', to: '#0e7490' },
  // Viaje
  trip_day:             { label: 'Día del viaje',       icon: '📍', from: '#16a34a', to: '#15803d' },
  trip_destination:     { label: 'Destino',             icon: '🌍', from: '#2563eb', to: '#1d4ed8' },
  // Corporativo
  corporate_event:      { label: 'Evento',              icon: '🏢', from: '#475569', to: '#334155' },
  corporate_team:       { label: 'Equipo',              icon: '🤝', from: '#0369a1', to: '#075985' },
  // Celebraciones religiosas
  communion:            { label: 'Primera comunión',    icon: '✝️',  from: '#d4b483', to: '#b8972a' },
  bar_mitzvah:          { label: 'Bar/Bat Mitzvah',     icon: '✡️',  from: '#3b82f6', to: '#1d4ed8' },
  baptism:              { label: 'Bautizo',             icon: '🕊️',  from: '#7dd3fc', to: '#38bdf8' },
};

const FALLBACK_GRADIENTS: [string, string][] = [
  ['#f43f5e', '#e11d48'],
  ['#a855f7', '#7c3aed'],
  ['#f59e0b', '#d97706'],
  ['#10b981', '#0d9488'],
  ['#3b82f6', '#2563eb'],
  ['#ec4899', '#db2777'],
  ['#f97316', '#ea580c'],
  ['#06b6d4', '#0891b2'],
];

// Grupos para el selector de tipo al crear álbum
export const ALBUM_TYPE_GROUPS: { label: string; types: AlbumType[] }[] = [
  { label: 'General', types: ['general', 'guestbook', 'photographer'] },
  { label: 'Boda', types: ['wedding_childhood', 'wedding_engagement', 'wedding_bachelor', 'wedding_ceremony', 'wedding_reception', 'wedding_honeymoon'] },
  { label: 'Cumpleaños', types: ['birthday_party', 'birthday_history', 'birthday_surprise'] },
  { label: 'Quinceañera / Sweet 16', types: ['xv_childhood', 'xv_preparation', 'xv_ceremony', 'xv_party'] },
  { label: 'Graduación', types: ['graduation_ceremony', 'graduation_memories', 'graduation_trip'] },
  { label: 'Viaje', types: ['trip_day', 'trip_destination'] },
  { label: 'Corporativo', types: ['corporate_event', 'corporate_team'] },
  { label: 'Celebraciones religiosas', types: ['communion', 'bar_mitzvah', 'baptism'] },
];

function AlbumPlaceholder({ name, mediaCount, albumType }: { name: string; mediaCount: number; albumType?: string }) {
  const cfg = albumType ? ALBUM_TYPE_CONFIG[albumType] : undefined;
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  const [from, to] = cfg
    ? [cfg.from, cfg.to]
    : FALLBACK_GRADIENTS[(name.charCodeAt(0) || 0) % FALLBACK_GRADIENTS.length];

  return (
    <div
      data-testid="album-placeholder"
      className="w-full h-full flex flex-col items-center justify-center gap-1.5"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {cfg ? (
        <span className="drop-shadow-md select-none" style={{ fontSize: '2.5rem' }}>{cfg.icon}</span>
      ) : (
        <span className="text-white font-extrabold drop-shadow-md select-none" style={{ fontSize: '2.75rem', letterSpacing: '0.04em' }}>
          {initials || '♥'}
        </span>
      )}
      {cfg && (
        <span className="text-white/80 text-xs font-semibold tracking-wide uppercase">{cfg.label}</span>
      )}
      {mediaCount === 0 && !cfg && (
        <span className="text-white/60 text-xs font-medium">Sin fotos aún</span>
      )}
    </div>
  );
}

// ─── Album card ────────────────────────────────────────────────────────────────

function AlbumCard({ album, compact = false }: { album: Album; compact?: boolean }) {
  const dateLabel = album.createdAt
    ? new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(album.createdAt))
    : '';
  const typeCfg = album.albumType ? ALBUM_TYPE_CONFIG[album.albumType] : undefined;

  if (compact) {
    // Versión compacta para vista por evento (sub-álbum)
    return (
      <Link
        href={`/app/album/${album._id}`}
        className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-rose-200 transition overflow-hidden flex flex-col"
      >
        <div className="aspect-video flex items-center justify-center overflow-hidden relative">
          {album.coverImageUrl ? (
            <img src={album.coverImageUrl} alt={album.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
          ) : (
            <AlbumPlaceholder name={album.name} mediaCount={album.mediaCount} albumType={album.albumType} />
          )}
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
            {album.mediaCount}
          </div>
        </div>
        <div className="px-3 py-2">
          <p className="text-xs font-semibold text-gray-800 line-clamp-1 group-hover:text-rose-500 transition">{album.name}</p>
          {typeCfg && <p className="text-xs text-gray-400 mt-0.5">{typeCfg.icon} {typeCfg.label}</p>}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/app/album/${album._id}`}
      data-testid="album-card"
      className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-rose-200 transition overflow-hidden flex flex-col"
    >
      {/* Cover */}
      <div className="aspect-video flex items-center justify-center overflow-hidden relative">
        {album.coverImageUrl ? (
          <img data-testid="album-cover-img" src={album.coverImageUrl} alt={album.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
        ) : (
          <AlbumPlaceholder name={album.name} mediaCount={album.mediaCount} albumType={album.albumType} />
        )}
        {/* Type badge top-left */}
        {typeCfg && (
          <div className="absolute top-3 left-3 bg-black/50 text-white text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
            <span>{typeCfg.icon}</span>
            <span>{typeCfg.label}</span>
          </div>
        )}
        {/* Photo count badge */}
        <div data-testid="album-media-count" className="absolute bottom-3 right-3 bg-black/50 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
          {album.mediaCount} {album.mediaCount === 1 ? 'foto' : 'fotos'}
        </div>
      </div>
      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 data-testid="album-name" className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-rose-500 transition">{album.name}</h3>
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

// ─── Event group (álbumes con el mismo eventId) ────────────────────────────────

function EventGroup({ eventId, albums }: { eventId: string; albums: Album[] }) {
  const main = albums.find((a) => a.albumType === 'main') ?? albums[0];
  const rest = albums.filter((a) => a._id !== main._id);
  const totalPhotos = albums.reduce((s, a) => s + a.mediaCount, 0);
  const dateLabel = main.createdAt
    ? new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(main.createdAt))
    : '';

  return (
    <div data-testid="event-group" className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Event header */}
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900 text-base">{main.name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {dateLabel} · {albums.length} álbum{albums.length !== 1 ? 'es' : ''} · {totalPhotos} fotos en total
          </p>
        </div>
        <Link
          href={`/app/album/${main._id}`}
          className="text-xs text-rose-500 font-semibold hover:underline"
        >
          Ver evento →
        </Link>
      </div>

      {/* Main album hero */}
      <Link href={`/app/album/${main._id}`} className="group block relative overflow-hidden" style={{ height: 200 }}>
        {main.coverImageUrl ? (
          <img src={main.coverImageUrl} alt={main.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        ) : (
          <AlbumPlaceholder name={main.name} mediaCount={main.mediaCount} albumType={main.albumType} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-5 text-white">
          <p className="font-bold text-lg drop-shadow">{main.name}</p>
          <p className="text-xs text-white/70">{main.mediaCount} fotos</p>
        </div>
        <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
          Álbum principal
        </div>
      </Link>

      {/* Sub-albums row */}
      {rest.length > 0 && (
        <div className="p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Álbumes del evento</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {rest.map((a) => (
              <AlbumCard key={a._id} album={a} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Albums list (inner component inside MemoriesProvider) ─────────────────────

type ViewMode = 'grid' | 'event';

function AlbumsDashboard({ onLogout }: { onLogout: () => void }) {
  const { albums, albumsLoading, albumsError, fetchAlbums } = useMemoriesStore();
  const [showCreate, setShowCreate] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => { fetchAlbums(); }, [fetchAlbums]);

  // Agrupar por eventId
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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">📸</span>
            <span className="text-lg font-bold text-rose-500">Memories</span>
          </Link>
          <div className="flex items-center gap-3">
            {/* View toggle (solo si hay eventos) */}
            {hasEvents && (
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
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
              onClick={() => setShowCreate(true)}
              className="bg-rose-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-rose-600 transition"
            >
              + Nuevo álbum
            </button>
            <button onClick={onLogout} className="text-sm text-gray-400 hover:text-gray-700 transition">
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

        {albumsError && albums.length === 0 && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 mb-6 text-sm">
            No se pudieron cargar los álbumes. Comprueba tu conexión e inténtalo de nuevo.
          </div>
        )}

        {albumsLoading && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
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

        {/* Vista por evento */}
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
                <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                  {standalone.map((album) => <AlbumCard key={album._id} album={album} />)}
                </div>
              </>
            )}
          </div>
        )}

        {/* Vista grid (por defecto) */}
        {!albumsLoading && albums.length > 0 && viewMode === 'grid' && (
          <div data-testid="albums-grid" className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {albums.map((album) => <AlbumCard key={album._id} album={album} />)}
          </div>
        )}
      </main>

      {showCreate && <CreateAlbumModal onClose={() => setShowCreate(false)} />}
    </>
  );
}

// ─── Create album modal ────────────────────────────────────────────────────────

function CreateAlbumModal({ onClose }: { onClose: () => void }) {
  const { createAlbum } = useMemoriesStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [albumType, setAlbumType] = useState<AlbumType>('general');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    await createAlbum({ name: name.trim(), description: description.trim() || undefined, visibility: 'members', albumType });
    setSubmitting(false);
    onClose();
  };

  const cfg = ALBUM_TYPE_CONFIG[albumType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div data-testid="create-album-modal" className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Nuevo álbum</h2>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Tipo de álbum */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de álbum</label>
            <div data-testid="album-type-selector" className="space-y-3">
              {ALBUM_TYPE_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.types.map((type) => {
                      const c = ALBUM_TYPE_CONFIG[type];
                      const selected = albumType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setAlbumType(type)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                            selected
                              ? 'text-white border-transparent shadow-sm'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                          style={selected ? { background: `linear-gradient(135deg, ${c.from}, ${c.to})`, borderColor: 'transparent' } : {}}
                        >
                          <span>{c.icon}</span>
                          <span>{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview del placeholder */}
          {cfg && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                <AlbumPlaceholder name={name || 'Álbum'} mediaCount={0} albumType={albumType} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{cfg.icon} {cfg.label}</p>
                <p className="text-xs text-gray-400">Así se verá la portada si no añades imagen</p>
              </div>
            </div>
          )}

          {/* Nombre */}
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

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bodega El Pinar, 14 de junio de 2026"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-2xl py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
              Cancelar
            </button>
            <button type="submit" disabled={!name.trim() || submitting} className="flex-1 bg-rose-500 text-white rounded-2xl py-3 text-sm font-semibold hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition">
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
