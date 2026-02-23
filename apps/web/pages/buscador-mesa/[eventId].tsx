import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useState, useRef } from 'react';
import { fetchApiEventosServer } from '../../utils/Fetching';
import { MdOutlineQrCode2 } from 'react-icons/md';

const SEATING_QUERY = `
  query ($variable: String, $valor: String, $development: String!) {
    queryenEvento(variable: $variable, valor: $valor, development: $development) {
      _id
      nombre
      tipo
      imgEvento { i800 }
      invitados_array {
        _id
        nombre
        nombre_mesa
        puesto
        asistencia
      }
    }
  }
`;

interface SeatGuest {
  _id: string;
  nombre: string;
  nombre_mesa: string;
  puesto: string | null;
}

interface Props {
  eventId: string;
  eventName: string;
  eventType: string;
  eventImg: string | null;
  guests: SeatGuest[];
  error?: string;
}

const BuscadorMesa: NextPage<Props> = ({ eventId, eventName, eventType, eventImg, guests, error }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SeatGuest[] | null>(null);
  const [showQr, setShowQr] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pageUrl = typeof window !== 'undefined'
    ? window.location.href
    : `https://bodasdehoy.com/buscador-mesa/${eventId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pageUrl)}`;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Evento no encontrado.</p>
      </div>
    );
  }

  const handleSearch = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setResults(null);
      return;
    }
    const q = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const found = guests.filter((g) => {
      const name = g.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return name.includes(q);
    });
    setResults(found);
  };

  const hasResults = results !== null;
  const noMatch = hasResults && results.length === 0;

  return (
    <>
      <Head>
        <title>{eventName} — ¿En qué mesa estoy?</title>
        <meta name="description" content={`Busca tu mesa para ${eventName}`} />
        <meta property="og:title" content={`${eventName} — ¿En qué mesa estoy?`} />
        <meta property="og:description" content={`Busca tu nombre y descubre en qué mesa estás en ${eventName}`} />
        {eventImg && <meta property="og:image" content={`https://apiapp.bodasdehoy.com/${eventImg}`} />}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex flex-col items-center px-4 py-12">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          {eventImg && (
            <img
              src={`https://apiapp.bodasdehoy.com/${eventImg}`}
              alt={eventName}
              className="w-20 h-20 rounded-full object-cover object-top border-2 border-rose-200 mb-4 shadow-sm"
            />
          )}
          <p className="text-sm text-rose-400 capitalize font-medium mb-1">{eventType}</p>
          <h1 className="text-2xl font-semibold text-gray-800">{eventName}</h1>
          <p className="text-gray-500 mt-2 text-sm">¿En qué mesa estoy?</p>
        </div>

        {/* Buscador */}
        <div className="w-full max-w-md">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Escribe tu nombre..."
              autoFocus
              className="w-full px-5 py-4 rounded-2xl border border-gray-200 shadow-sm text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 bg-white"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setResults(null); inputRef.current?.focus(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                aria-label="Limpiar"
              >
                ×
              </button>
            )}
          </div>

          {/* Resultados */}
          {hasResults && (
            <div className="mt-4 space-y-3">
              {noMatch ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No se encontró ningún invitado con ese nombre.
                </div>
              ) : (
                results.map((guest) => (
                  <div
                    key={guest._id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-rose-400 font-semibold text-sm">
                        {guest.nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{guest.nombre}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Mesa: <span className="font-semibold text-rose-500">{guest.nombre_mesa}</span>
                        {guest.puesto && (
                          <span className="ml-2 text-gray-400">· Asiento {guest.puesto}</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Info inicial */}
          {!hasResults && guests.length > 0 && (
            <p className="text-center text-xs text-gray-400 mt-4">
              {guests.length} invitados con mesa asignada
            </p>
          )}
          {!hasResults && guests.length === 0 && (
            <p className="text-center text-xs text-gray-400 mt-4">
              Aún no hay mesas asignadas para este evento.
            </p>
          )}
        </div>

        {/* QR del buscador */}
        <div className="mt-10 flex flex-col items-center">
          <button
            onClick={() => setShowQr(!showQr)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition"
          >
            <MdOutlineQrCode2 className="w-5 h-5" />
            <span>{showQr ? 'Ocultar QR' : 'Ver QR para imprimir'}</span>
          </button>
          {showQr && (
            <div className="mt-4 flex flex-col items-center gap-3">
              <img
                src={qrUrl}
                alt="QR buscador de mesa"
                width={200}
                height={200}
                className="rounded-xl border border-gray-100 shadow-sm"
              />
              <p className="text-xs text-gray-400 text-center max-w-[200px]">
                Escanea para buscar tu mesa
              </p>
              <a
                href={qrUrl}
                download={`qr-mesas-${eventId}.png`}
                className="text-xs text-primary hover:underline"
              >
                Descargar QR
              </a>
            </div>
          )}
        </div>

        <p className="mt-8 text-xs text-gray-300">
          Bodas de Hoy
        </p>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const eventId = params?.eventId as string;
  const development = process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy';

  try {
    const data = await fetchApiEventosServer({
      query: SEATING_QUERY,
      variables: {
        variable: '_id',
        valor: eventId,
        development,
      },
    });

    const eventos = data?.queryenEvento;
    const evento = Array.isArray(eventos) ? eventos[0] : eventos;

    if (!evento) {
      return { props: { eventId, eventName: '', eventType: '', eventImg: null, guests: [], error: 'not_found' } };
    }

    const guests: SeatGuest[] = (evento.invitados_array || [])
      .filter((g: any) => g.nombre_mesa && g.asistencia !== 'cancelado')
      .map((g: any) => ({
        _id: g._id,
        nombre: g.nombre || '',
        nombre_mesa: g.nombre_mesa || '',
        puesto: g.puesto || null,
      }));

    return {
      props: {
        eventId,
        eventName: evento.nombre || '',
        eventType: evento.tipo || '',
        eventImg: evento.imgEvento?.i800 || null,
        guests,
      },
    };
  } catch {
    return {
      props: { eventId, eventName: '', eventType: '', eventImg: null, guests: [], error: 'server_error' },
    };
  }
};

export default BuscadorMesa;
