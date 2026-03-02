import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { fetchApiEventosServer } from '../../../utils/Fetching';
import { useGuestSession } from '../../../hooks/useGuestSession';

// ──────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────

interface PublicTask {
  _id: string;
  fecha: string;
  hora?: string;
  horaActiva?: boolean;
  icon?: string;
  descripcion: string;
  duracion?: number;
  spectatorView: boolean;
  estatus?: string;
}

interface PublicItinerary {
  _id: string;
  title: string;
  tipo?: string;
  tasks: PublicTask[];
}

interface PublicEvent {
  _id: string;
  nombre: string;
  tipo: string;
  fecha?: string;
  timeZone?: string;
  poblacion?: string;
  pais?: string;
  color?: string[];
  imgEvento?: { i800: string };
  lugar?: { _id: string; title: string; slug: string };
  itinerarios_array?: PublicItinerary[];
}

interface Props {
  event: PublicEvent | null;
  error?: string;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

// queryenEvento_id no requiere autenticación — ideal para el portal público de invitados
const EVENT_QUERY = `
  query ($var_1: String) {
    queryenEvento_id(var_1: $var_1) {
      _id
      nombre
      tipo
      fecha
      timeZone
      poblacion
      pais
      color
      imgEvento { i800 }
      lugar { _id title slug }
      itinerarios_array {
        _id
        title
        tipo
        tasks {
          _id
          fecha
          hora
          horaActiva
          icon
          descripcion
          duracion
          spectatorView
          estatus
        }
      }
    }
  }
`;

const IMG_BASE = 'https://apiapp.bodasdehoy.com/';

function eventImageUrl(event: PublicEvent): string | null {
  return event.imgEvento?.i800 ? `${IMG_BASE}${event.imgEvento.i800}` : null;
}

/**
 * Devuelve la tarea cuya hora es la más cercana al momento actual (o la próxima).
 */
function getCurrentTask(tasks: PublicTask[]): PublicTask | null {
  if (!tasks.length) return null;
  const now = Date.now();
  const sorted = [...tasks].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );
  // Tarea activa: ha empezado pero no ha terminado aún (duracion en minutos)
  const active = sorted.find((t) => {
    const start = new Date(t.fecha).getTime();
    const end = start + (t.duracion ?? 60) * 60_000;
    return now >= start && now <= end;
  });
  if (active) return active;
  // Si no hay activa, la siguiente
  return sorted.find((t) => new Date(t.fecha).getTime() > now) ?? sorted[sorted.length - 1];
}

function formatTaskTime(task: PublicTask): string {
  if (task.hora && task.horaActiva) return task.hora;
  const d = new Date(task.fecha);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatEventDate(dateStr?: string): string {
  if (!dateStr) return '';
  // La API puede devolver timestamp en ms como string (e.g. "1789430400000") o ISO date
  const ts = Number(dateStr);
  const d = isNaN(ts) || String(ts) !== dateStr ? new Date(dateStr) : new Date(ts);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ──────────────────────────────────────────────
// Sub-componentes
// ──────────────────────────────────────────────

function CurrentMomentBanner({ task, eventId }: { task: PublicTask; eventId: string }) {
  return (
    <div className="bg-rose-500 text-white rounded-2xl px-5 py-4 mb-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide opacity-75 mb-1">Ahora mismo</p>
      <div className="flex items-center gap-3">
        {task.icon && <span className="text-2xl">{task.icon}</span>}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base leading-snug line-clamp-2">{task.descripcion}</p>
          <p className="text-xs opacity-80 mt-0.5">{formatTaskTime(task)}</p>
        </div>
        <Link
          href={`/e/${eventId}/m/${task._id}`}
          className="flex-shrink-0 bg-white/20 hover:bg-white/30 transition rounded-xl px-3 py-1.5 text-xs font-semibold"
        >
          Ver fotos →
        </Link>
      </div>
    </div>
  );
}

function MomentCard({ task, eventId }: { task: PublicTask; eventId: string }) {
  return (
    <Link
      href={`/e/${eventId}/m/${task._id}`}
      className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 hover:shadow-md hover:border-rose-200 transition"
    >
      <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0 text-xl">
        {task.icon || '📸'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm leading-snug line-clamp-2">{task.descripcion}</p>
        <p className="text-xs text-gray-400 mt-0.5">{formatTaskTime(task)}</p>
      </div>
      <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

function SeatFinder({ guests }: { guests: { _id: string; nombre: string; nombre_mesa: string; puesto: string | null }[] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<typeof guests | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (!value.trim()) { setResults(null); return; }
    const q = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    setResults(
      guests.filter((g) =>
        g.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)
      )
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
      <p className="text-sm font-semibold text-gray-700 mb-3">🪑 ¿En qué mesa estoy?</p>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Escribe tu nombre…"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 bg-gray-50"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults(null); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
          >
            ×
          </button>
        )}
      </div>
      {results !== null && (
        <div className="mt-3 space-y-2">
          {results.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">No se encontró ningún invitado con ese nombre.</p>
          ) : (
            results.map((g) => (
              <div key={g._id} className="flex items-center gap-3 bg-rose-50 rounded-xl px-4 py-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-rose-600 font-semibold text-xs">{g.nombre.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{g.nombre}</p>
                  <p className="text-xs text-gray-500">
                    Mesa: <span className="font-semibold text-rose-500">{g.nombre_mesa}</span>
                    {g.puesto && <span className="ml-1.5 text-gray-400">· Asiento {g.puesto}</span>}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Componente PWA install prompt
// ──────────────────────────────────────────────

function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIosTip, setShowIosTip] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Android/Chrome: captura el evento beforeinstallprompt
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS: detectar Safari en iOS
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandaloneMode = ('standalone' in navigator) && (navigator as any).standalone;
    if (isIos && !isInStandaloneMode) {
      const alreadyShown = sessionStorage.getItem('ios_install_tip');
      if (!alreadyShown) setShowIosTip(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (dismissed) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setDismissed(true);
  };

  const handleDismissIos = () => {
    sessionStorage.setItem('ios_install_tip', '1');
    setShowIosTip(false);
    setDismissed(true);
  };

  if (deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 bg-white border border-rose-200 shadow-lg rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="text-xl">📲</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">Añadir a inicio</p>
          <p className="text-xs text-gray-500">Accede más fácil desde tu móvil</p>
        </div>
        <button onClick={handleInstall} className="bg-rose-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl">
          Instalar
        </button>
        <button onClick={() => setDismissed(true)} className="text-gray-400 text-sm">✕</button>
      </div>
    );
  }

  if (showIosTip) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 bg-white border border-rose-200 shadow-lg rounded-2xl px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">📲</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800 mb-1">Añadir a inicio</p>
            <p className="text-xs text-gray-500">
              Pulsa <strong>Compartir</strong> <span className="inline-block">⬆️</span> en Safari
              y luego <strong>"Añadir a pantalla de inicio"</strong>
            </p>
          </div>
          <button onClick={handleDismissIos} className="text-gray-400 text-sm flex-shrink-0 mt-0.5">✕</button>
        </div>
      </div>
    );
  }

  return null;
}

// ──────────────────────────────────────────────
// Página principal
// ──────────────────────────────────────────────

// ──────────────────────────────────────────────
// Modal "¿Cómo te llamas?" (portal principal)
// ──────────────────────────────────────────────

function PortalNameModal({ onConfirm, onClose }: { onConfirm: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <div className="text-center mb-5">
          <span className="text-4xl">👋</span>
          <h2 className="text-lg font-bold text-gray-900 mt-2">¡Bienvenido!</h2>
          <p className="text-sm text-gray-500 mt-1">¿Cómo te llamas? Así sabrán quién comparte las fotos</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); const t = name.trim(); if (t.length >= 2) onConfirm(t); }} className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            maxLength={50}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-rose-300 bg-gray-50"
          />
          <button
            type="submit"
            disabled={name.trim().length < 2}
            className="w-full bg-rose-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition active:scale-95"
          >
            Entrar →
          </button>
        </form>
        <button onClick={onClose} className="w-full text-center text-sm text-gray-400 mt-3 py-1">Solo quiero ver las fotos</button>
      </div>
    </div>
  );
}

const GuestPortal: NextPage<Props> = ({ event, error }) => {
  const { session, loading: sessionLoading, setAnonName } = useGuestSession(event?._id ?? '');
  const [showNameModal, setShowNameModal] = useState(false);
  // Datos de invitados para el buscador de mesa — cargados client-side para no exponerlos en SSR
  const [seatGuests, setSeatGuests] = useState<{ _id: string; nombre: string; nombre_mesa: string; puesto: string | null }[]>([]);

  useEffect(() => {
    if (!event?._id) return;
    fetch(`/api/public/seating/${event._id}`)
      .then((r) => r.json())
      .then((data) => setSeatGuests(data.guests ?? []))
      .catch(() => {});
  }, [event?._id]);

  if (error || !event) {
    return (
      <div className="absolute z-[50] w-full h-[100vh] top-0 bg-white flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-2xl">😕</p>
        <p className="text-gray-700 font-medium text-center">
          {error === 'not_found' ? 'Evento no encontrado' : 'No se pudo cargar el evento'}
        </p>
        <p className="text-gray-400 text-sm text-center">Comprueba el enlace o pide el correcto a los organizadores.</p>
      </div>
    );
  }

  const imgUrl = eventImageUrl(event);
  const primaryColor = event.color?.[0] ?? '#f43f5e';
  const allTasks = event.itinerarios_array?.flatMap((it) => it.tasks) ?? [];
  const currentTask = getCurrentTask(allTasks);

  return (
    <>
      <Head>
        <title>{event.nombre}</title>
        <meta name="description" content={`Portal de invitados de ${event.nombre}`} />
        {imgUrl && <meta property="og:image" content={imgUrl} />}
        <meta property="og:title" content={event.nombre} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content={primaryColor} />
      </Head>

      <main className="absolute z-[50] w-full min-h-[100vh] top-0 bg-gradient-to-b from-rose-50 to-white overflow-y-auto pb-24">
        <div className="max-w-lg mx-auto px-4 pt-8">

          {/* ── Header del evento ── */}
          <div className="flex flex-col items-center text-center mb-6">
            {imgUrl ? (
              <img
                src={imgUrl}
                alt={event.nombre}
                className="w-20 h-20 rounded-full object-cover object-top border-2 border-white shadow-md mb-3"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center mb-3 shadow-md">
                <span className="text-3xl">💍</span>
              </div>
            )}
            <p className="text-xs font-semibold text-rose-400 uppercase tracking-wide capitalize mb-1">{event.tipo}</p>
            <h1 className="text-2xl font-bold text-gray-800">{event.nombre}</h1>
            {event.fecha && (
              <p className="text-sm text-gray-500 mt-1 capitalize">{formatEventDate(event.fecha)}</p>
            )}
            {event.lugar?.title && (
              <p className="text-xs text-gray-400 mt-0.5">{event.lugar.title}</p>
            )}
            {event.poblacion && (
              <p className="text-xs text-gray-400">{event.poblacion}{event.pais ? `, ${event.pais}` : ''}</p>
            )}
          </div>

          {/* ── Banner identidad ── */}
          {!sessionLoading && (
            session ? (
              <div className="bg-white border border-rose-100 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-rose-500 font-bold text-sm">{session.guestName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">Hola, {session.guestName} 👋</p>
                  <p className="text-xs text-gray-500">
                    {session.level === 2 ? 'Invitado verificado' : 'Bienvenido al evento'}
                  </p>
                </div>
              </div>
            ) : (
              /* Invitado anónimo: invitarle a identificarse */
              <button
                onClick={() => setShowNameModal(true)}
                className="w-full bg-white border border-dashed border-rose-200 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3 hover:border-rose-400 transition text-left"
              >
                <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-rose-300 text-xl">👤</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">¿Cómo te llamas?</p>
                  <p className="text-xs text-gray-400">Para poder subir tus fotos del evento</p>
                </div>
              </button>
            )
          )}

          {/* ── Momento actual ── */}
          {currentTask && (
            <CurrentMomentBanner task={currentTask} eventId={event._id} />
          )}

          {/* ── Lista de momentos ── */}
          {allTasks.length > 0 && (
            <section className="mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Momentos del día</p>
              <div className="space-y-2">
                {[...allTasks]
                  .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                  .map((task) => (
                    <MomentCard key={task._id} task={task} eventId={event._id} />
                  ))}
              </div>
            </section>
          )}

          {/* ── Buscador de mesa ── */}
          {seatGuests.length > 0 && (
            <section className="mb-6">
              <SeatFinder guests={seatGuests} />
            </section>
          )}

          {/* ── Footer ── */}
          <p className="text-center text-xs text-gray-300 mt-4 mb-6">Bodas de Hoy</p>
        </div>

        <InstallBanner />
      </main>

      {/* Modal nombre */}
      {showNameModal && (
        <PortalNameModal
          onConfirm={(name) => { setAnonName(name); setShowNameModal(false); }}
          onClose={() => setShowNameModal(false)}
        />
      )}
    </>
  );
};

export default GuestPortal;

// ──────────────────────────────────────────────
// SSR
// ──────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const eventId = params?.eventId as string;
  const development = process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy';

  try {
    const data = await fetchApiEventosServer({
      query: EVENT_QUERY,
      variables: { var_1: eventId },
    });

    const eventos = data?.queryenEvento_id;
    const evento = Array.isArray(eventos) ? eventos[0] : eventos;

    if (!evento) {
      return { props: { event: null, error: 'not_found' } };
    }

    // Filtrar tareas a solo las que son públicas
    const filtered: PublicEvent = {
      ...evento,
      itinerarios_array: (evento.itinerarios_array ?? []).map((it: any) => ({
        ...it,
        tasks: (it.tasks ?? []).filter((t: any) => t.spectatorView === true),
      })),
    };

    return { props: { event: filtered } };
  } catch {
    return { props: { event: null, error: 'server_error' } };
  }
};
