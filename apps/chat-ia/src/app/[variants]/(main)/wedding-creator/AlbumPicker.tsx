'use client';

/**
 * AlbumPicker — selector de fotos DESDE los álbumes/Momentos del evento.
 * ====================================================================
 * La fuente VERDADERA de las fotos del evento son los álbumes (paquete @bodasdehoy/memories),
 * no una subida suelta. Este picker lista los álbumes del evento y sus fotos para elegir
 * cuáles salen en la web → una sola fuente de fotos. Se carga de forma DINÁMICA desde el
 * editor (memories pesa ~276K) y solo cuando el usuario pulsa "Traer del álbum".
 */
import { useMemoriesStore } from '@bodasdehoy/memories';
import { useEffect, useState } from 'react';

import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';
import { useDevelopment } from '@/utils/developmentDetector';

export interface PickedPhoto {
  caption?: string;
  id: string;
  thumbnail?: string;
  url: string;
}

interface Props {
  eventId: string;
  onClose: () => void;
  onSelect: (photos: PickedPhoto[]) => void;
}

export default function AlbumPicker({ eventId, onClose, onSelect }: Props) {
  const userId = useUserStore((s) => userProfileSelectors.userId(s)) ?? '';
  const { development } = useDevelopment();
  const {
    setConfig,
    fetchAlbumsByEvent,
    albums,
    albumsLoading,
    fetchAlbumMedia,
    currentAlbumMedia,
    mediaLoading,
  } = useMemoriesStore();

  const [albumId, setAlbumId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (userId) setConfig('', userId, development);
  }, [userId, development, setConfig]);

  useEffect(() => {
    if (eventId) fetchAlbumsByEvent(eventId);
  }, [eventId, fetchAlbumsByEvent]);

  useEffect(() => {
    if (albumId) fetchAlbumMedia(albumId);
  }, [albumId, fetchAlbumMedia]);

  const photos = (currentAlbumMedia || []).filter((m) => m.mediaType === 'photo');
  const nSelected = Object.values(selected).filter(Boolean).length;

  const confirm = () => {
    const chosen: PickedPhoto[] = photos
      .filter((p) => selected[p._id])
      .map((p) => ({
        caption: p.caption,
        id: `alb-${p._id}`,
        thumbnail: p.thumbnailUrl,
        url: p.originalUrl,
      }));
    if (chosen.length) onSelect(chosen);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            {albumId && (
              <button
                className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                onClick={() => setAlbumId(null)}
                type="button"
              >
                ← Álbumes
              </button>
            )}
            <span className="text-sm font-semibold text-gray-800">
              {albumId ? 'Elige fotos del álbum' : 'Álbumes del evento'}
            </span>
          </div>
          <button
            aria-label="Cerrar"
            className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {/* Lista de álbumes */}
          {!albumId && (
            <>
              {albumsLoading && <p className="text-sm text-gray-400">Cargando álbumes…</p>}
              {!albumsLoading && albums.length === 0 && (
                <p className="text-sm text-gray-400">
                  Este evento aún no tiene álbumes de fotos. Crea uno en Momentos o sube fotos directamente.
                </p>
              )}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {albums.map((a) => (
                  <button
                    className="flex flex-col overflow-hidden rounded-lg border border-gray-200 text-left hover:border-blue-500"
                    key={a._id}
                    onClick={() => setAlbumId(a._id)}
                    type="button"
                  >
                    <div className="h-24 w-full bg-gray-100">
                      {a.coverImageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt={a.name} className="h-full w-full object-cover" src={a.coverImageUrl} />
                      )}
                    </div>
                    <div className="px-2 py-1.5">
                      <div className="truncate text-xs font-medium text-gray-800">{a.name}</div>
                      <div className="text-[11px] text-gray-400">{a.mediaCount} fotos</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Fotos del álbum elegido */}
          {albumId && (
            <>
              {mediaLoading && <p className="text-sm text-gray-400">Cargando fotos…</p>}
              {!mediaLoading && photos.length === 0 && (
                <p className="text-sm text-gray-400">Este álbum no tiene fotos.</p>
              )}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((p) => {
                  const on = !!selected[p._id];
                  return (
                    <button
                      className={`relative overflow-hidden rounded border-2 ${
                        on ? 'border-blue-600' : 'border-transparent'
                      }`}
                      key={p._id}
                      onClick={() => setSelected((s) => ({ ...s, [p._id]: !s[p._id] }))}
                      type="button"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={p.caption || ''}
                        className="h-20 w-full object-cover"
                        src={p.thumbnailUrl || p.originalUrl}
                      />
                      {on && (
                        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <span className="text-xs text-gray-500">
            {nSelected > 0 ? `${nSelected} seleccionada(s)` : 'Selecciona fotos'}
          </span>
          <div className="flex gap-2">
            <button
              className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className={`rounded px-3 py-1.5 text-sm font-medium text-white ${
                nSelected > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'cursor-not-allowed bg-gray-300'
              }`}
              disabled={nSelected === 0}
              onClick={confirm}
              type="button"
            >
              Añadir seleccionadas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
