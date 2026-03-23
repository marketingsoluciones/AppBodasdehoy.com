import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Album } from '@bodasdehoy/memories';
import { ALBUM_TYPE_CONFIG } from '../../constants/albumTypes';
import AlbumPlaceholder from './AlbumPlaceholder';

export const AlbumCard = React.memo(function AlbumCard({ album, compact = false }: { album: Album; compact?: boolean }) {
  const dateLabel = album.createdAt
    ? new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(album.createdAt))
    : '';
  const typeCfg = album.albumType ? ALBUM_TYPE_CONFIG[album.albumType] : undefined;

  if (compact) {
    return (
      <Link
        href={`/app/album/${album._id}`}
        className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-rose-200 transition overflow-hidden flex flex-col"
      >
        <div className="aspect-video flex items-center justify-center overflow-hidden relative">
          {album.coverImageUrl ? (
            <Image src={album.coverImageUrl} alt={album.name} fill sizes="(max-width: 640px) 33vw, 20vw" className="object-cover group-hover:scale-105 transition duration-300" />
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
      <div className="aspect-video flex items-center justify-center overflow-hidden relative">
        {album.coverImageUrl ? (
          <Image data-testid="album-cover-img" src={album.coverImageUrl} alt={album.name} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition duration-300" />
        ) : (
          <AlbumPlaceholder name={album.name} mediaCount={album.mediaCount} albumType={album.albumType} />
        )}
        {typeCfg && (
          <div className="absolute top-3 left-3 bg-black/50 text-white text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
            <span>{typeCfg.icon}</span>
            <span>{typeCfg.label}</span>
          </div>
        )}
        <div data-testid="album-media-count" className="absolute bottom-3 right-3 bg-black/50 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
          {album.mediaCount} {album.mediaCount === 1 ? 'foto' : 'fotos'}
        </div>
      </div>
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
});
