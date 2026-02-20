/**
 * Memories Standalone - Web solo de Momentos.
 * Configuración: NEXT_PUBLIC_MEMORIES_API_URL (opcional), userId por query ?userId= o formulario.
 */
import { MemoriesProvider, useMemoriesStore } from '@bodasdehoy/memories';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const API_BASE =
  process.env.NEXT_PUBLIC_MEMORIES_API_URL || 'https://api-ia.bodasdehoy.com';
const DEVELOPMENT = process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy';

function MemoriesList() {
  const { albums, albumsLoading, fetchAlbums } = useMemoriesStore();
  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  if (albumsLoading) {
    return (
      <div className="py-8 text-gray-500 animate-pulse">Cargando álbumes...</div>
    );
  }

  if (albums.length === 0) {
    return (
      <p className="py-8 text-gray-500">No tienes álbumes todavía.</p>
    );
  }

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {albums.map((album) => (
        <li
          key={album._id}
          className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
        >
          <div className="font-medium text-gray-900 truncate">{album.name}</div>
          {album.description && (
            <div className="text-sm text-gray-500 mt-1 line-clamp-2">
              {album.description}
            </div>
          )}
          <div className="text-xs text-gray-400 mt-2">
            {album.mediaCount} fotos · {album.memberCount} miembros
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function MemoriesStandalonePage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [inputValue, setInputValue] = useState('');

  const queryUserId = typeof router.query.userId === 'string' ? router.query.userId : '';

  useEffect(() => {
    if (queryUserId) {
      setUserId(queryUserId);
    }
  }, [queryUserId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = inputValue.trim();
    if (v) {
      setUserId(v);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `?userId=${encodeURIComponent(v)}`);
      }
    }
  };

  const handleClear = () => {
    setUserId('');
    setInputValue('');
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/');
    }
  };

  if (!userId) {
    return (
      <div style={{ maxWidth: 480, margin: '40px auto', padding: 24, fontFamily: 'system-ui' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Memories</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>
          Web independiente de Momentos. Indica tu user id (email o uid) para cargar tus álbumes.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            placeholder="user@example.com o uid"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8 }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 16px',
              background: '#ec4899',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cargar Momentos
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: 12, color: '#888' }}>
          También puedes usar <code>?userId=tu@email.com</code> en la URL.
        </p>
      </div>
    );
  }

  return (
    <MemoriesProvider
      apiBaseUrl={API_BASE}
      userId={userId}
      development={DEVELOPMENT}
    >
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24, fontFamily: 'system-ui' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Memories</h1>
          <button
            type="button"
            onClick={handleClear}
            style={{
              padding: '6px 12px',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Cambiar usuario
          </button>
        </div>
        <MemoriesList />
      </div>
    </MemoriesProvider>
  );
}
