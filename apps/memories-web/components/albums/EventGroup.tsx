import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Album } from '@bodasdehoy/memories';
import AlbumPlaceholder from './AlbumPlaceholder';
import { AlbumCard } from './AlbumCard';

export const EventGroup = React.memo(function EventGroup({ eventId, albums }: { eventId: string; albums: Album[] }) {
  const main = albums.find((a) => a.albumType === 'main') ?? albums[0];
  const rest = albums.filter((a) => a._id !== main._id);
  const totalPhotos = albums.reduce((s, a) => s + a.mediaCount, 0);
  const dateLabel = main.createdAt
    ? new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(main.createdAt))
    : '';

  return (
    <div data-testid="event-group" className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
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

      <Link href={`/app/album/${main._id}`} className="group block relative overflow-hidden" style={{ height: 200 }}>
        {main.coverImageUrl ? (
          <Image src={main.coverImageUrl} alt={main.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition duration-500" />
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
});
