import { useEffect, useRef, useState } from 'react';
import { useMemoriesStore } from '@bodasdehoy/memories';
import type { AlbumType } from '@bodasdehoy/memories';
import { ALBUM_TYPE_CONFIG, CATEGORY_META } from '../../constants/albumTypes';
import AlbumPlaceholder from './AlbumPlaceholder';

export default function CreateAlbumModal({ onClose }: { onClose: () => void }) {
  const { createAlbum } = useMemoriesStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [albumType, setAlbumType] = useState<AlbumType>('general');
  const [categoryKey, setCategoryKey] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const activeCat = CATEGORY_META.find((c) => c.key === categoryKey) ?? CATEGORY_META[0];
  const cfg = ALBUM_TYPE_CONFIG[albumType];

  const handleCategoryClick = (cat: typeof CATEGORY_META[0]) => {
    setCategoryKey(cat.key);
    setAlbumType(cat.types[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    await createAlbum({ name: name.trim(), description: description.trim() || undefined, visibility: 'members', albumType });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        data-testid="create-album-modal"
        className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Nuevo álbum</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition text-lg leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-5 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre del álbum <span className="text-rose-500">*</span>
            </label>
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

          <div data-testid="album-type-selector">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de evento</label>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {CATEGORY_META.map((cat) => {
                const active = categoryKey === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl border text-xs font-semibold transition ${
                      active
                        ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl leading-none">{cat.icon}</span>
                    <span className="whitespace-nowrap">{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {activeCat.types.length > 1 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {activeCat.types.map((type) => {
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
                      style={selected ? { background: `linear-gradient(135deg, ${c.from}, ${c.to})` } : {}}
                    >
                      <span>{c.icon}</span>
                      <span>{c.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {cfg && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                <AlbumPlaceholder name={name || 'Álbum'} mediaCount={0} albumType={albumType} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{cfg.icon} {name || cfg.label}</p>
                <p className="text-xs text-gray-400">Vista previa de portada</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bodega El Pinar, 14 de junio de 2026"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition resize-none"
            />
          </div>

          <div className="flex gap-3 pb-1">
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
