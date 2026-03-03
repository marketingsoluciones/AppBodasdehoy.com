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

interface GuestPersonalData {
  _id: string;
  nombre: string;
  nombre_mesa?: string;
  puesto?: string;
  nombre_menu?: string;
  asistencia?: string;
  father?: string | null;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

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

function eventTypeIcon(tipo: string): string {
  const icons: Record<string, string> = {
    boda: '💍', cumpleaños: '🎂', bautizo: '👶',
    comunion: '⛪', aniversario: '💝', fiesta: '🎉',
  };
  return icons[tipo?.toLowerCase()] ?? '🎉';
}

function getCurrentTask(tasks: PublicTask[]): PublicTask | null {
  if (!tasks.length) return null;
  const now = Date.now();
  const sorted = [...tasks].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );
  const active = sorted.find((t) => {
    const start = new Date(t.fecha).getTime();
    const end = start + (t.duracion ?? 60) * 60_000;
    return now >= start && now <= end;
  });
  if (active) return active;
  return sorted.find((t) => new Date(t.fecha).getTime() > now) ?? sorted[sorted.length - 1];
}

function formatTaskTime(task: PublicTask): string {
  if (task.hora && task.horaActiva) return task.hora;
  const d = new Date(task.fecha);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatEventDate(dateStr?: string): string {
  if (!dateStr) return '';
  const ts = Number(dateStr);
  const d = isNaN(ts) || String(ts) !== dateStr ? new Date(dateStr) : new Date(ts);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function getEventTimestamp(dateStr?: string): number | null {
  if (!dateStr) return null;
  const ts = Number(dateStr);
  const d = isNaN(ts) || String(ts) !== dateStr ? new Date(dateStr) : new Date(ts);
  return isNaN(d.getTime()) ? null : d.getTime();
}

function mapsUrl(event: PublicEvent): string | null {
  const query = event.lugar?.title || (event.poblacion ? `${event.poblacion}${event.pais ? ', ' + event.pais : ''}` : null);
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

// ──────────────────────────────────────────────
// CountdownTimer
// ──────────────────────────────────────────────

function CountdownTimer({ dateStr }: { dateStr: string }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const target = getEventTimestamp(dateStr);
    if (!target) return;

    const calc = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setTimeLeft(null); return; }
      setTimeLeft({
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1_000),
      });
    };
    calc();
    const id = setInterval(calc, 1_000);
    return () => clearInterval(id);
  }, [dateStr]);

  // Solo mostrar si faltan entre 1 y 365 días
  if (!timeLeft || timeLeft.days > 365 || timeLeft.days < 0) return null;

  const units = [
    { v: timeLeft.days, l: 'días' },
    { v: timeLeft.hours, l: 'h' },
    { v: timeLeft.minutes, l: 'min' },
    { v: timeLeft.seconds, l: 'seg' },
  ];

  return (
    <div className="bg-rose-500 text-white rounded-2xl px-5 py-4 mb-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest opacity-75 text-center mb-3">
        El gran día llega en
      </p>
      <div className="flex justify-center gap-4">
        {units.map(({ v, l }) => (
          <div key={l} className="flex flex-col items-center min-w-[42px]">
            <span className="text-2xl font-bold tabular-nums leading-none">
              {String(v).padStart(2, '0')}
            </span>
            <span className="text-xs opacity-70 mt-1">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// GuestInfoCard — tarjeta personalizada nivel 2
// ──────────────────────────────────────────────

function GuestInfoCard({
  token,
  guestId,
  onRsvp,
}: {
  token: string;
  guestId: string;
  onRsvp: () => void;
}) {
  const [data, setData] = useState<GuestPersonalData | null>(null);

  useEffect(() => {
    fetch(`/api/public/rsvp-guest?p=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((result) => {
        if (result?.error) return;
        const guests: GuestPersonalData[] = result.invitados_array ?? [];
        const guest = guests.find((g) => g._id === guestId) ?? guests.find((g) => g.father === null) ?? guests[0];
        if (guest) setData(guest);
      })
      .catch(() => {});
  }, [token, guestId]);

  if (!data) return null;

  const confirmed = data.asistencia === 'confirmado';
  const hasMesa = data.nombre_mesa && data.nombre_mesa !== 'no asignado';
  const hasMenu = data.nombre_menu && data.nombre_menu !== 'no asignado';

  return (
    <div className="bg-white border border-rose-100 rounded-2xl px-5 py-4 mb-5 shadow-sm">
      <p className="text-xs font-semibold text-rose-400 uppercase tracking-widest mb-3">Tu invitación</p>
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-base">{confirmed ? '✅' : '⏳'}</span>
          <span className="text-gray-500">Asistencia:</span>
          <span className={`font-semibold ${confirmed ? 'text-green-600' : 'text-amber-600'}`}>
            {confirmed ? 'Confirmada' : 'Pendiente de confirmar'}
          </span>
        </div>
        {hasMesa && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-base">🪑</span>
            <span className="text-gray-500">Tu mesa:</span>
            <span className="font-semibold text-gray-900">{data.nombre_mesa}</span>
            {data.puesto && <span className="text-gray-400 text-xs">· Asiento {data.puesto}</span>}
          </div>
        )}
        {hasMenu && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-base">🍽️</span>
            <span className="text-gray-500">Menú:</span>
            <span className="font-semibold text-gray-900 capitalize">{data.nombre_menu}</span>
          </div>
        )}
      </div>
      {!confirmed && (
        <button
          onClick={onRsvp}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 rounded-xl text-sm transition active:scale-95"
        >
          ✉️ Confirmar mi asistencia
        </button>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// CurrentMomentBanner
// ──────────────────────────────────────────────

function CurrentMomentBanner({ task, eventId }: { task: PublicTask; eventId: string }) {
  return (
    <div className="bg-rose-500 text-white rounded-2xl px-5 py-4 mb-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest opacity-75 mb-2">Ahora mismo</p>
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

// ──────────────────────────────────────────────
// MomentCard
// ──────────────────────────────────────────────

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

// ──────────────────────────────────────────────
// SeatFinder
// ──────────────────────────────────────────────

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

  if (guests.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 px-5 py-4 text-center">
        <p className="text-sm font-semibold text-gray-700 mb-1">🪑 ¿En qué mesa estoy?</p>
        <p className="text-xs text-gray-400">Las mesas aún no están asignadas</p>
      </div>
    );
  }

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
// IosInstallModal
// ──────────────────────────────────────────────

function IosInstallModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-end justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-4">
          <span className="text-4xl">📲</span>
          <h2 className="text-base font-bold text-gray-900 mt-2">Añadir a pantalla de inicio</h2>
        </div>
        <ol className="space-y-3 text-sm text-gray-600 mb-5">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-500 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
            <span>Pulsa el botón <strong>Compartir</strong> <span className="text-base">⬆️</span> en Safari</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-500 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
            <span>Toca <strong>"Añadir a pantalla de inicio"</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-500 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
            <span>Pulsa <strong>Añadir</strong> — ¡ya lo tienes!</span>
          </li>
        </ol>
        <button onClick={onClose} className="w-full bg-rose-500 text-white font-semibold py-3 rounded-xl">
          Entendido
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// PortalNameModal
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
        <form
          onSubmit={(e) => { e.preventDefault(); const t = name.trim(); if (t.length >= 2) onConfirm(t); }}
          className="space-y-3"
        >
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
        <button onClick={onClose} className="w-full text-center text-sm text-gray-400 mt-3 py-1">
          Solo quiero ver las fotos
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Página principal
// ──────────────────────────────────────────────

const GuestPortal: NextPage<Props> = ({ event, error }) => {
  const { session, loading: sessionLoading, setAnonName } = useGuestSession(event?._id ?? '');
  const [showNameModal, setShowNameModal] = useState(false);
  const [seatGuests, setSeatGuests] = useState<{ _id: string; nombre: string; nombre_mesa: string; puesto: string | null }[]>([]);

  // PWA install
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    const standalone =
      ('standalone' in navigator && (navigator as any).standalone) ||
      window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);
    if (standalone) return;
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosModal(true);
    }
  };

  const showInstallButton = !isStandalone && (!!deferredPrompt || isIos);

  const allTasksForCheck = event?.itinerarios_array?.flatMap((it) => it.tasks) ?? [];
  const hasMoments = allTasksForCheck.length > 0;

  useEffect(() => {
    if (!event?._id) return;
    fetch(`/api/public/seating/${event._id}`)
      .then((r) => r.json())
      .then((data) => setSeatGuests(data.guests ?? []))
      .catch(() => {});
  }, [event?._id]);

  // Abrir modal automáticamente solo si hay momentos y el invitado no está identificado
  useEffect(() => {
    if (!sessionLoading && !session && hasMoments) {
      const timer = setTimeout(() => setShowNameModal(true), 800);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading]);

  const handleRsvp = () => {
    if (!session?.pGuestToken) return;
    window.location.href = `/confirmar-asistencia?pGuestEvent=${encodeURIComponent(session.pGuestToken)}`;
  };

  // ── Error / no encontrado ──
  if (error || !event) {
    return (
      <div className="absolute z-[50] w-full h-[100vh] top-0 bg-white flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-2xl">😕</p>
        <p className="text-gray-700 font-medium text-center">
          {error === 'not_found' ? 'Evento no encontrado' : 'No se pudo cargar el evento'}
        </p>
        <p className="text-gray-400 text-sm text-center">
          Comprueba el enlace o pide el correcto a los organizadores.
        </p>
      </div>
    );
  }

  const imgUrl = eventImageUrl(event);
  const primaryColor = event.color?.[0] ?? '#f43f5e';
  const allTasks = event.itinerarios_array?.flatMap((it) => it.tasks) ?? [];
  const currentTask = getCurrentTask(allTasks);
  const mapLink = mapsUrl(event);
  const eventTs = getEventTimestamp(event.fecha);
  const isFuture = eventTs ? eventTs > Date.now() : false;

  return (
    <>
      <Head>
        <title>{event.nombre}</title>
        <meta name="description" content={`Portal de invitados de ${event.nombre}`} />
        {imgUrl && <meta property="og:image" content={imgUrl} />}
        <meta property="og:title" content={event.nombre} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content={primaryColor} />
        <link rel="manifest" href={`/api/manifest/${event._id}`} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={event.nombre} />
      </Head>

      <main className="absolute z-[50] w-full min-h-[100vh] top-0 bg-gradient-to-b from-rose-50 to-white overflow-y-auto pb-24">

        {/* ── Hero ── */}
        {imgUrl ? (
          /* Con foto: hero a ancho completo con overlay */
          <div className="relative w-full h-56 sm:h-72 overflow-hidden">
            <img src={imgUrl} alt={event.nombre} className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">{event.tipo}</p>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{event.nombre}</h1>
              {event.fecha && (
                <p className="text-sm opacity-80 mt-1 capitalize">{formatEventDate(event.fecha)}</p>
              )}
              {event.lugar?.title && (
                <p className="text-xs opacity-60 mt-0.5">{event.lugar.title}</p>
              )}
            </div>
            {/* Botón instalar sobre la imagen */}
            {showInstallButton && (
              <button
                onClick={handleInstall}
                className="absolute top-4 right-4 inline-flex items-center gap-1.5 bg-white/90 backdrop-blur text-rose-500 text-xs font-semibold px-3 py-1.5 rounded-full shadow hover:bg-white transition active:scale-95"
              >
                <span>📲</span>
                <span>Guardar</span>
              </button>
            )}
          </div>
        ) : (
          /* Sin foto: header centrado */
          <div className="flex flex-col items-center text-center px-4 pt-10 pb-2">
            <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center mb-3 shadow-md">
              <span className="text-3xl">{eventTypeIcon(event.tipo)}</span>
            </div>
            <p className="text-xs font-semibold text-rose-400 uppercase tracking-widest mb-1">{event.tipo}</p>
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
            {showInstallButton && (
              <button
                onClick={handleInstall}
                className="mt-3 inline-flex items-center gap-1.5 bg-white border border-rose-200 text-rose-500 text-xs font-semibold px-4 py-2 rounded-full shadow-sm hover:border-rose-400 hover:bg-rose-50 active:scale-95 transition"
              >
                <span>📲</span>
                <span>Guardar en mi móvil</span>
              </button>
            )}
          </div>
        )}

        {/* ── Contenido principal ── */}
        <div className="max-w-lg mx-auto px-4 pt-5">

          {/* ── Info adicional del evento (debajo del hero) ── */}
          {imgUrl && (event.poblacion || mapLink) && (
            <div className="flex items-center justify-between mb-4 text-xs text-gray-400">
              {event.poblacion && (
                <span>📍 {event.poblacion}{event.pais ? `, ${event.pais}` : ''}</span>
              )}
              {mapLink && (
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-400 font-medium hover:underline"
                >
                  Ver en el mapa →
                </a>
              )}
            </div>
          )}
          {/* Mapa para el caso sin hero */}
          {!imgUrl && mapLink && (
            <div className="flex justify-center mb-4">
              <a
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-rose-400 font-medium hover:underline"
              >
                📍 Ver ubicación en Google Maps →
              </a>
            </div>
          )}

          {/* ── Countdown (solo eventos futuros ≤ 365 días) ── */}
          {isFuture && event.fecha && <CountdownTimer dateStr={event.fecha} />}

          {/* ── Tarjeta "Mi invitación" — solo nivel 2 ── */}
          {!sessionLoading && session?.level === 2 && session.pGuestToken && (
            <GuestInfoCard
              token={session.pGuestToken}
              guestId={session.guestId}
              onRsvp={handleRsvp}
            />
          )}

          {/* ── Banner identidad (nivel 0 y 1) ── */}
          {!sessionLoading && (
            session ? (
              session.level < 2 && (
                <div className="bg-white border border-rose-100 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3 shadow-sm">
                  <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-rose-500 font-bold text-sm">{session.guestName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">Hola, {session.guestName} 👋</p>
                    <p className="text-xs text-gray-500">
                      {hasMoments ? 'Pulsa un momento para ver y subir fotos' : 'Bienvenido al evento'}
                    </p>
                  </div>
                  {hasMoments && (
                    <span className="text-xs text-rose-400 font-medium flex-shrink-0">📸 {allTasksForCheck.length}</span>
                  )}
                </div>
              )
            ) : (
              /* Sin sesión — invitar a identificarse */
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

          {/* ── Nivel 2: nombre del invitado verificado ── */}
          {!sessionLoading && session?.level === 2 && (
            <div className="flex items-center gap-2 mb-5 px-1">
              <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <span className="text-rose-500 font-bold text-xs">{session.guestName.charAt(0).toUpperCase()}</span>
              </div>
              <p className="text-sm text-gray-600">
                Bienvenido, <span className="font-semibold text-gray-900">{session.guestName}</span>
                <span className="ml-1.5 text-xs bg-rose-100 text-rose-500 px-1.5 py-0.5 rounded-full font-medium">✓ Verificado</span>
              </p>
            </div>
          )}

          {/* ── Momento actual ── */}
          {currentTask && <CurrentMomentBanner task={currentTask} eventId={event._id} />}

          {/* ── Lista de momentos ── */}
          <section className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Momentos del día</p>
            {allTasks.length > 0 ? (
              <div className="space-y-2">
                {[...allTasks]
                  .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                  .map((task) => (
                    <MomentCard key={task._id} task={task} eventId={event._id} />
                  ))}
              </div>
            ) : (
              <div className="bg-white border border-dashed border-gray-200 rounded-2xl px-5 py-6 text-center">
                <p className="text-2xl mb-2">📸</p>
                <p className="text-sm text-gray-500">Aún no hay momentos publicados</p>
                <p className="text-xs text-gray-400 mt-1">Los organizadores irán añadiendo álbumes del evento</p>
              </div>
            )}
          </section>

          {/* ── Buscador de mesa (no mostrar para nivel 2 ya que ve su mesa en GuestInfoCard) ── */}
          {session?.level !== 2 && (
            <section className="mb-6">
              <SeatFinder guests={seatGuests} />
            </section>
          )}

          {/* ── Footer ── */}
          <p className="text-center text-xs text-gray-300 mt-4 mb-6">Bodas de Hoy</p>
        </div>
      </main>

      {/* Modal nombre */}
      {showNameModal && (
        <PortalNameModal
          onConfirm={(name) => { setAnonName(name); setShowNameModal(false); }}
          onClose={() => setShowNameModal(false)}
        />
      )}

      {/* Modal instrucciones iOS */}
      {showIosModal && <IosInstallModal onClose={() => setShowIosModal(false)} />}
    </>
  );
};

export default GuestPortal;

// ──────────────────────────────────────────────
// SSR
// ──────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const eventId = params?.eventId as string;

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
