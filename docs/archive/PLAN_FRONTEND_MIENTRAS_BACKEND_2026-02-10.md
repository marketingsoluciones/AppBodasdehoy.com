# 🚀 PLAN DE ACCIÓN FRONTEND - Optimizaciones Inmediatas

**Objetivo**: Mejorar la experiencia de usuario AHORA mientras api-ia implementa las mejoras del backend

**Fecha**: 2026-02-10
**Equipo**: Frontend (PLANNER AI)
**Timeline**: 1-2 días (implementación inmediata)

---

## 📋 ÍNDICE

1. [Situación Actual](#situación-actual)
2. [Optimizaciones Inmediatas (HOY)](#optimizaciones-inmediatas-hoy)
3. [Mejoras de UX (1-2 días)](#mejoras-de-ux-1-2-días)
4. [Preparativos para Backend Mejorado](#preparativos-para-backend-mejorado)
5. [Monitoreo y Métricas](#monitoreo-y-métricas)
6. [Plan de Transición](#plan-de-transición)

---

## 📊 SITUACIÓN ACTUAL

### Estado del Backend
- ⏳ **En espera**: api-ia.bodasdehoy.com trabajando en optimizaciones
- ⏱️ **Tiempo actual**: 30+ segundos (BLOQUEANTE)
- 🎯 **Tiempo objetivo**: < 500ms
- 📅 **Estimado backend**: 6-8 días laborables

### Mientras Tanto...

**Podemos mejorar la experiencia del usuario en el frontend** con:
- ✅ Caché local más agresivo
- ✅ Loading states mejorados
- ✅ Optimistic updates
- ✅ Progressive loading
- ✅ Error handling robusto
- ✅ Reducir bundle size

---

## 🔥 OPTIMIZACIONES INMEDIATAS (HOY)

### 1. Implementar Caché Local Agresivo (1 hora)

**Ubicación**: [apps/copilot/src/store/memories/action.ts](apps/copilot/src/store/memories/action.ts)

#### Problema Actual
```typescript
// ❌ Cada vez que abres /memories, llama al backend (30s)
fetchAlbums: async (userId, development = 'bodasdehoy') => {
  const response = await fetch(
    `${BACKEND_URL}/api/memories/albums?user_id=${userId}&development=${development}`
  );
  // ...
}
```

#### Solución: Caché en LocalStorage + Zustand

```typescript
// apps/copilot/src/store/memories/action.ts

// ✅ Configuración de caché
const CACHE_KEY_PREFIX = 'memories_cache_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

// Helper para leer caché
function getCachedData<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${key}`);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    const age = Date.now() - entry.timestamp;

    // Si el caché es muy viejo, ignorarlo
    if (age > CACHE_DURATION) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${key}`);
      return null;
    }

    console.log(`✅ Cache HIT: ${key} (age: ${Math.round(age / 1000)}s)`);
    return entry.data;
  } catch (error) {
    console.warn('⚠️ Error leyendo caché:', error);
    return null;
  }
}

// Helper para guardar en caché
function setCachedData<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: '1.0'
    };
    localStorage.setItem(`${CACHE_KEY_PREFIX}${key}`, JSON.stringify(entry));
    console.log(`💾 Cache SET: ${key}`);
  } catch (error) {
    console.warn('⚠️ Error guardando caché:', error);
  }
}

// Helper para invalidar caché
function invalidateCache(pattern: string): void {
  const keys = Object.keys(localStorage);
  const toRemove = keys.filter(k => k.startsWith(`${CACHE_KEY_PREFIX}${pattern}`));
  toRemove.forEach(k => localStorage.removeItem(k));
  if (toRemove.length > 0) {
    console.log(`🗑️  Cache invalidado: ${toRemove.length} entries`);
  }
}

// ✅ Implementar en fetchAlbums
fetchAlbums: async (userId, development = 'bodasdehoy') => {
  const cacheKey = `albums_${userId}_${development}`;

  // 1. Intentar leer de caché primero
  const cached = getCachedData<Album[]>(cacheKey);
  if (cached) {
    set({
      albums: cached,
      albumsLoading: false,
      albumsLoadedFromCache: true
    });
    return; // ✅ Retornar inmediatamente con datos cacheados
  }

  // 2. Si no hay caché, hacer fetch (30s...)
  try {
    set({ albumsLoading: true, albumsLoadedFromCache: false });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    const response = await fetch(
      `${BACKEND_URL}/api/memories/albums?user_id=${userId}&development=${development}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    if (data.success) {
      // 3. Guardar en caché
      setCachedData(cacheKey, data.albums);

      set({
        albums: data.albums,
        albumsLoading: false,
        albumsLoadedFromCache: false
      });
    }
  } catch (error) {
    console.error('Error fetching albums:', error);
    set({
      albumsError: error instanceof Error ? error.message : 'Error desconocido',
      albumsLoading: false
    });
  }
},

// ✅ Invalidar caché al crear/actualizar/eliminar
createAlbum: async (data, userId, development = 'bodasdehoy') => {
  try {
    const response = await fetch(/* ... */);
    const result = await response.json();

    if (result.success && result.album) {
      // Invalidar caché
      invalidateCache(`albums_${userId}`);

      set((state) => ({
        albums: [...state.albums, result.album],
        isCreateAlbumModalOpen: false,
      }));
      return result.album;
    }
  } catch (error) {
    throw error;
  }
},

deleteAlbum: async (albumId, userId, development = 'bodasdehoy') => {
  try {
    const response = await fetch(/* ... */);
    const result = await response.json();

    if (result.success) {
      // Invalidar caché
      invalidateCache(`albums_${userId}`);

      set((state) => ({
        albums: state.albums.filter((a) => a._id !== albumId),
      }));
    }
  } catch (error) {
    console.error('Error deleting album:', error);
  }
},
```

**Beneficio**:
- Primera carga: 30s ⏳
- Cargas subsecuentes: **0ms** ⚡ (instantáneo desde caché)
- Caché válido por 5 minutos

---

### 2. Mostrar Datos Cacheados Mientras Recarga (30 min)

```typescript
// apps/copilot/src/app/[variants]/(main)/memories/page.tsx

export default function MemoriesPage() {
  const {
    albums,
    albumsLoading,
    albumsLoadedFromCache, // ✅ Nuevo flag
    fetchAlbums
  } = useMemoriesStore();

  const { devUserId } = useDevUserAuth();
  const development = useDevelopment();

  useEffect(() => {
    if (devUserId) {
      fetchAlbums(devUserId, development);
    }
  }, [devUserId, development]);

  // ✅ Mostrar albums cacheados inmediatamente
  if (albums.length > 0 && albumsLoadedFromCache) {
    return (
      <>
        {/* Banner indicando que está recargando en background */}
        <Alert
          message="Mostrando datos guardados"
          description="Actualizando en segundo plano..."
          type="info"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />

        {/* Mostrar albums cacheados */}
        <AlbumGrid albums={albums} />
      </>
    );
  }

  // ✅ Si está cargando por primera vez (sin caché)
  if (albumsLoading && albums.length === 0) {
    return <LoadingState />;
  }

  // ✅ Si hay albums (después de cargar)
  if (albums.length > 0) {
    return <AlbumGrid albums={albums} />;
  }

  // ✅ Estado vacío
  return <EmptyState />;
}
```

---

### 3. Optimistic Updates para Creación (45 min)

**Problema**: Al crear album, espera 30s para ver el resultado

**Solución**: Mostrar el album inmediatamente (optimistic)

```typescript
// apps/copilot/src/store/memories/action.ts

createAlbum: async (data, userId, development = 'bodasdehoy') => {
  // ✅ 1. Crear album temporal (optimistic)
  const tempAlbum: Album = {
    _id: `temp_${Date.now()}`, // ID temporal
    name: data.name,
    description: data.description,
    visibility: data.visibility,
    user_id: userId,
    development: development,
    photo_count: 0,
    member_count: 1,
    cover_image_url: data.cover_image_url,
    created_at: new Date().toISOString(),
    isOptimistic: true, // ✅ Flag para saber que es temporal
  };

  // ✅ 2. Agregar inmediatamente al estado (usuario ve el album YA)
  set((state) => ({
    albums: [tempAlbum, ...state.albums],
    isCreateAlbumModalOpen: false,
  }));

  try {
    // ✅ 3. Hacer request real en background
    const response = await fetch(
      `${BACKEND_URL}/api/memories/albums?user_id=${userId}&development=${development}`,
      {
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      },
    );
    const result = await response.json();

    if (result.success && result.album) {
      // ✅ 4. Reemplazar album temporal con el real
      set((state) => ({
        albums: state.albums.map(a =>
          a._id === tempAlbum._id ? result.album : a
        ),
      }));

      // Invalidar caché
      invalidateCache(`albums_${userId}`);

      return result.album;
    } else {
      throw new Error(result.detail || 'Error al crear album');
    }
  } catch (error) {
    // ✅ 5. Si falla, remover el album temporal y mostrar error
    set((state) => ({
      albums: state.albums.filter(a => a._id !== tempAlbum._id),
    }));

    console.error('Error creating album:', error);
    message.error('Error al crear el álbum. Por favor intenta de nuevo.');
    throw error;
  }
},
```

**Beneficio**:
- Usuario ve su album **inmediatamente** (0ms)
- Backend se actualiza en background
- Si falla, se revierte automáticamente

---

### 4. Skeleton Loading Mejorado (30 min)

**Problema**: Loading spinner genérico por 30 segundos

**Solución**: Skeleton screens con progress estimado

```typescript
// apps/copilot/src/app/[variants]/(main)/memories/components/LoadingState.tsx

import { Skeleton, Progress } from 'antd';
import { useEffect, useState } from 'react';

export function LoadingState() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simular progreso (30s total)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev; // Nunca llegar a 100 hasta que cargue real
        return prev + 3; // Incrementar 3% cada 1s
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: 24 }}>
      {/* Progress bar con mensaje */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <Progress
          percent={progress}
          status={progress < 90 ? 'active' : 'normal'}
          format={(percent) => `${percent}% - Cargando albums...`}
        />
        <p style={{ marginTop: 8, color: '#666' }}>
          Esto puede tomar hasta 30 segundos. Estamos trabajando en mejorarlo.
        </p>
      </div>

      {/* Grid de skeletons que simula los albums */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 24
      }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            overflow: 'hidden'
          }}>
            {/* Skeleton cover image */}
            <Skeleton.Image
              active
              style={{ width: '100%', height: 160 }}
            />

            {/* Skeleton info */}
            <div style={{ padding: 16 }}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Beneficio**:
- Usuario sabe que está cargando (no piensa que está roto)
- Progress bar da sensación de progreso
- Skeletons muestran cómo se verá la UI
- Mensaje transparente sobre el tiempo de espera

---

### 5. Lazy Load de Memories Route (15 min)

**Problema**: Carga todo el código de Memories aunque no se use

**Solución**: Dynamic import con React.lazy

```typescript
// apps/copilot/src/app/[variants]/(main)/layout.tsx

import dynamic from 'next/dynamic';
import { Skeleton } from 'antd';

// ✅ Lazy load de la página de Memories
const MemoriesPage = dynamic(
  () => import('./memories/page'),
  {
    loading: () => (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    ),
    ssr: false // No renderizar en server
  }
);

// Solo se carga cuando el usuario navega a /memories
```

**Beneficio**:
- Reduce bundle inicial en ~500KB-1MB
- Carga más rápida de la app
- Solo descarga cuando el usuario va a Memories

---

## 🎨 MEJORAS DE UX (1-2 DÍAS)

### 6. Implementar Infinite Scroll (2-3 horas)

**Cuando el backend implemente paginación**, estar listos:

```typescript
// apps/copilot/src/app/[variants]/(main)/memories/page.tsx

import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

export default function MemoriesPage() {
  const {
    albums,
    fetchAlbumsPage, // ✅ Nueva función para cargar página
    hasNextPage,
    isLoadingMore
  } = useMemoriesStore();

  // ✅ Hook de infinite scroll
  const { ref: loadMoreRef } = useInfiniteScroll({
    onLoadMore: () => {
      if (hasNextPage && !isLoadingMore) {
        fetchAlbumsPage(); // Cargar siguiente página
      }
    },
    enabled: hasNextPage
  });

  return (
    <div>
      <AlbumGrid albums={albums} />

      {/* Sentinel element para infinite scroll */}
      {hasNextPage && (
        <div ref={loadMoreRef} style={{ padding: 24, textAlign: 'center' }}>
          {isLoadingMore ? (
            <Skeleton active paragraph={{ rows: 2 }} />
          ) : (
            <Button onClick={() => fetchAlbumsPage()}>
              Cargar más albums
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
```

```typescript
// apps/copilot/src/hooks/useInfiniteScroll.ts

import { useEffect, useRef } from 'react';

interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  enabled?: boolean;
  threshold?: number;
}

export function useInfiniteScroll({
  onLoadMore,
  enabled = true,
  threshold = 0.8
}: UseInfiniteScrollOptions) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold }
    );

    const element = ref.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [enabled, onLoadMore, threshold]);

  return { ref };
}
```

---

### 7. Búsqueda y Filtros del Lado del Cliente (2 horas)

**Mientras el backend mejora**, implementar búsqueda local:

```typescript
// apps/copilot/src/app/[variants]/(main)/memories/page.tsx

import { useMemo, useState } from 'react';
import { Input, Select, Tag } from 'antd';
import { Search, Filter } from 'lucide-react';

export default function MemoriesPage() {
  const { albums } = useMemoriesStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVisibility, setFilterVisibility] = useState<string>('all');

  // ✅ Filtrar albums del lado del cliente
  const filteredAlbums = useMemo(() => {
    return albums.filter(album => {
      // Filtro de búsqueda
      const matchesSearch = searchTerm === '' ||
        album.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        album.description?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de visibilidad
      const matchesVisibility = filterVisibility === 'all' ||
        album.visibility === filterVisibility;

      return matchesSearch && matchesVisibility;
    });
  }, [albums, searchTerm, filterVisibility]);

  return (
    <div>
      {/* Barra de búsqueda y filtros */}
      <div style={{
        display: 'flex',
        gap: 16,
        marginBottom: 24,
        flexWrap: 'wrap'
      }}>
        <Input
          placeholder="Buscar albums..."
          prefix={<Search size={16} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
          allowClear
        />

        <Select
          value={filterVisibility}
          onChange={setFilterVisibility}
          style={{ width: 150 }}
          suffixIcon={<Filter size={16} />}
        >
          <Select.Option value="all">Todos</Select.Option>
          <Select.Option value="private">
            <Tag color="red">Privados</Tag>
          </Select.Option>
          <Select.Option value="members">
            <Tag color="blue">Miembros</Tag>
          </Select.Option>
          <Select.Option value="public">
            <Tag color="green">Públicos</Tag>
          </Select.Option>
        </Select>

        {/* Mostrar contador */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          color: '#666'
        }}>
          {filteredAlbums.length} de {albums.length} albums
        </div>
      </div>

      {/* Grid de albums filtrados */}
      <AlbumGrid albums={filteredAlbums} />

      {filteredAlbums.length === 0 && albums.length > 0 && (
        <Empty description="No se encontraron albums con ese criterio" />
      )}
    </div>
  );
}
```

**Beneficio**:
- Búsqueda instantánea (sin llamar al backend)
- Funciona incluso con backend lento
- Se puede mejorar después con búsqueda server-side

---

### 8. Background Refresh con Notificación (1 hora)

```typescript
// apps/copilot/src/app/[variants]/(main)/memories/page.tsx

import { useEffect, useState } from 'react';
import { Button, notification } from 'antd';

export default function MemoriesPage() {
  const { albums, fetchAlbums, albumsLoadedFromCache } = useMemoriesStore();
  const { devUserId } = useDevUserAuth();
  const development = useDevelopment();

  // ✅ Auto-refresh cada 5 minutos en background
  useEffect(() => {
    if (!devUserId) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing albums...');
      fetchAlbums(devUserId, development);
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [devUserId, development]);

  // ✅ Botón manual de refresh
  const handleRefresh = async () => {
    const key = 'refresh';
    notification.open({
      key,
      message: 'Actualizando albums...',
      description: 'Esto puede tomar hasta 30 segundos',
      icon: <LoadingOutlined />,
      duration: 0, // No auto-close
    });

    try {
      await fetchAlbums(devUserId, development);
      notification.success({
        key,
        message: 'Albums actualizados',
        description: `${albums.length} albums cargados`,
        duration: 3,
      });
    } catch (error) {
      notification.error({
        key,
        message: 'Error al actualizar',
        description: 'Por favor intenta de nuevo',
        duration: 5,
      });
    }
  };

  return (
    <div>
      {/* Header con botón de refresh */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 16
      }}>
        <h1>Mis Albums</h1>

        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
        >
          Actualizar
        </Button>
      </div>

      {/* Indicador si son datos cacheados */}
      {albumsLoadedFromCache && (
        <Alert
          message="Mostrando datos guardados"
          description={
            <>
              Última actualización hace {getTimeSinceCache()}.
              <Button type="link" onClick={handleRefresh}>
                Actualizar ahora
              </Button>
            </>
          }
          type="info"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <AlbumGrid albums={albums} />
    </div>
  );
}
```

---

## 🎯 PREPARATIVOS PARA BACKEND MEJORADO

### 9. Preparar Store para Paginación (1-2 horas)

```typescript
// apps/copilot/src/store/memories/store.ts

export interface MemoriesStore {
  // ✅ Datos
  albums: Album[];
  albumsPagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;

  // ✅ Estados
  albumsLoading: boolean;
  albumsLoadingMore: boolean; // Para infinite scroll
  albumsLoadedFromCache: boolean;
  albumsError: string | null;

  // ✅ Acciones
  fetchAlbums: (userId: string, development?: string) => Promise<void>;
  fetchAlbumsPage: (page?: number) => Promise<void>; // ✅ Nueva
  resetAlbums: () => void; // ✅ Nueva
}

export const initialMemoriesState: Partial<MemoriesStore> = {
  albums: [],
  albumsPagination: null,
  albumsLoading: false,
  albumsLoadingMore: false,
  albumsLoadedFromCache: false,
  albumsError: null,
};
```

```typescript
// apps/copilot/src/store/memories/action.ts

export const memoriesActionSlice: StateCreator<
  MemoriesStore,
  [['zustand/devtools', never]],
  [],
  MemoriesAction
> = (set, get) => ({

  // ✅ Nueva función para cargar páginas adicionales
  fetchAlbumsPage: async (page?: number) => {
    const state = get();
    const nextPage = page ?? (state.albumsPagination?.page ?? 0) + 1;

    set({ albumsLoadingMore: true });

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/memories/albums?` +
        `user_id=${state.currentUserId}&` +
        `development=${state.currentDevelopment}&` +
        `page=${nextPage}&` +
        `limit=20`
      );

      const data = await response.json();

      if (data.success) {
        set((state) => ({
          // ✅ Append albums (no replace)
          albums: [...state.albums, ...data.albums],
          albumsPagination: data.pagination,
          albumsLoadingMore: false,
        }));
      }
    } catch (error) {
      console.error('Error loading more albums:', error);
      set({
        albumsLoadingMore: false,
        albumsError: 'Error cargando más albums'
      });
    }
  },

  // ✅ Reset para reload completo
  resetAlbums: () => {
    set({
      albums: [],
      albumsPagination: null,
      albumsLoadedFromCache: false,
    });
  },
});
```

---

### 10. TypeScript Types para Nueva API (30 min)

```typescript
// apps/copilot/src/types/memories.ts

// ✅ Response types para nueva API
export interface AlbumsListResponse {
  success: boolean;
  albums: Album[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface AlbumDetailResponse {
  success: boolean;
  album: Album;
}

export interface AlbumMediaResponse {
  success: boolean;
  media: AlbumMedia[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface ShareLinkResponse {
  success: boolean;
  share_token: string;
  share_url: string;
  expires_at: string;
}
```

---

## 📊 MONITOREO Y MÉTRICAS

### 11. Implementar Performance Monitoring (1 hora)

```typescript
// apps/copilot/src/utils/performanceMonitor.ts

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];

  start(name: string): () => void {
    const startTime = performance.now();
    const startTimestamp = Date.now();

    return (metadata?: Record<string, any>) => {
      const duration = performance.now() - startTime;

      const metric: PerformanceMetric = {
        name,
        duration,
        timestamp: startTimestamp,
        metadata,
      };

      this.metrics.push(metric);

      // Log si es muy lento
      if (duration > 5000) {
        console.warn(`⚠️ Slow operation: ${name} took ${Math.round(duration)}ms`, metadata);
      } else {
        console.log(`✅ ${name}: ${Math.round(duration)}ms`, metadata);
      }

      // Enviar a analytics (opcional)
      this.sendToAnalytics(metric);
    };
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    // Enviar a Google Analytics, Sentry, etc.
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: metric.name,
        value: Math.round(metric.duration),
        event_category: 'Performance',
      });
    }
  }

  getMetrics(): PerformanceMetric[] {
    return this.metrics;
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

**Uso en el store**:
```typescript
// apps/copilot/src/store/memories/action.ts

import { performanceMonitor } from '@/utils/performanceMonitor';

fetchAlbums: async (userId, development = 'bodasdehoy') => {
  const endMeasure = performanceMonitor.start('fetch_albums');

  try {
    // ... código de fetch

    endMeasure({
      userId,
      development,
      albumCount: albums.length,
      fromCache: !!cached
    });
  } catch (error) {
    endMeasure({ error: error.message });
    throw error;
  }
},
```

---

### 12. Dashboard de Métricas de Usuario (1 hora)

```typescript
// apps/copilot/src/app/[variants]/(main)/settings/developer/page.tsx

import { performanceMonitor } from '@/utils/performanceMonitor';

export default function DeveloperSettings() {
  const metrics = performanceMonitor.getMetrics();

  // Agrupar por operación
  const grouped = metrics.reduce((acc, metric) => {
    if (!acc[metric.name]) {
      acc[metric.name] = [];
    }
    acc[metric.name].push(metric);
    return acc;
  }, {} as Record<string, PerformanceMetric[]>);

  return (
    <div>
      <h2>Performance Metrics</h2>

      {Object.entries(grouped).map(([name, metrics]) => {
        const avg = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
        const min = Math.min(...metrics.map(m => m.duration));
        const max = Math.max(...metrics.map(m => m.duration));

        return (
          <Card key={name} style={{ marginBottom: 16 }}>
            <h3>{name}</h3>
            <div>
              <strong>Count:</strong> {metrics.length}<br />
              <strong>Avg:</strong> {Math.round(avg)}ms<br />
              <strong>Min:</strong> {Math.round(min)}ms<br />
              <strong>Max:</strong> {Math.round(max)}ms<br />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
```

---

## 🔄 PLAN DE TRANSICIÓN

### Cuando Backend Esté Listo

#### Checklist de Transición

**Fase 1: Testing (Día 1)**
- [ ] Backend confirma que endpoints están listos
- [ ] Obtener URL de staging del backend
- [ ] Actualizar `.env.local` con URL de staging
- [ ] Testing manual de todos los endpoints
- [ ] Validar paginación funciona
- [ ] Validar tiempos < 500ms
- [ ] Validar caché backend funciona

**Fase 2: Integración (Día 2)**
- [ ] Actualizar tipos TypeScript
- [ ] Implementar fetchAlbumsPage con nueva API
- [ ] Habilitar infinite scroll
- [ ] Remover timeout de 30s del frontend
- [ ] Testing de infinite scroll
- [ ] Testing de búsqueda server-side (si aplica)

**Fase 3: Deployment (Día 3)**
- [ ] Deploy a staging (chat-test.bodasdehoy.com)
- [ ] Smoke testing en staging
- [ ] Load testing básico
- [ ] Validar performance end-to-end
- [ ] Deploy a producción
- [ ] Monitorear métricas por 24 horas

**Fase 4: Optimización Post-Deploy (Día 4-5)**
- [ ] Ajustar TTL de caché local según performance
- [ ] Implementar prefetching de albums
- [ ] Optimizar infinite scroll
- [ ] Agregar más métricas
- [ ] Documentar cambios

---

## 📈 MÉTRICAS DE ÉXITO

### Antes (Actual)
```
Primera carga:        30.6s ❌
Cargas subsecuentes:  30.6s ❌ (sin caché)
Bundle de Memories:   ~1.5MB ❌
User bounce rate:     ~80% (estimado) ❌
```

### Después (Con optimizaciones frontend)
```
Primera carga:        30.6s ⏳ (sin cambios backend)
Cargas subsecuentes:  ~50ms ✅ (caché local)
Bundle de Memories:   ~800KB ✅ (lazy load)
User bounce rate:     ~40% ✅ (mejor UX)
Optimistic updates:   0ms ✅ (instantáneo)
```

### Después (Con backend optimizado)
```
Primera carga:        200-500ms ✅
Cargas subsecuentes:  50ms ✅ (caché local)
Paginación:           200-300ms ✅
Infinite scroll:      Smooth ✅
Bundle de Memories:   ~800KB ✅
User bounce rate:     <10% 🏆
```

---

## 🚀 QUICK WINS (Implementar HOY)

### Top 5 Optimizaciones - 3 horas total

1. **✅ Caché Local (1h)** → Carga instantánea en revisitas
2. **✅ Optimistic Updates (45min)** → Crear albums instantáneamente
3. **✅ Loading Mejorado (30min)** → Progress bar + skeletons
4. **✅ Lazy Load Route (15min)** → Reduce bundle 800KB
5. **✅ Background Refresh (30min)** → Auto-actualiza cada 5 min

**Total**: 3 horas de trabajo, mejora masiva de UX

---

## 📝 COMANDOS ÚTILES

### Medir Performance

```bash
# Lighthouse en development
npx lighthouse http://localhost:3210/memories --view

# Bundle analyzer
npm run build:analyze
open .next/analyze/client.html

# Performance profile en Chrome DevTools
# 1. Abrir DevTools
# 2. Performance tab
# 3. Record
# 4. Navegar a /memories
# 5. Stop recording
```

### Testing

```bash
# Tests unitarios
npm test -- memories

# Tests de performance
npm run test:performance

# Visual regression tests
npm run test:visual
```

---

## 🎯 CONCLUSIÓN

### Mientras api-ia trabaja en el backend (6-8 días)...

**Podemos mejorar la UX dramáticamente** con:
- ✅ Caché local agresivo
- ✅ Optimistic updates
- ✅ Loading states mejorados
- ✅ Lazy loading
- ✅ Background refresh

### Resultado

**Sin esperar al backend**, podemos lograr:
- Primera carga: Sigue siendo lenta (30s) ⏳
- **Cargas subsecuentes: 50ms** ⚡ (60x más rápido)
- **Crear albums: Instantáneo** ⚡
- Bundle más pequeño: -800KB
- Mejor perceived performance

### Cuando el backend esté listo

**Combinado con backend optimizado**:
- Primera carga: 200-500ms ✅
- Cargas subsecuentes: 50ms ✅
- Infinite scroll: Smooth ✅
- **Experiencia excelente** 🏆

---

## 📧 PRÓXIMOS PASOS

### HOY (2-3 horas)

1. ✅ Implementar caché local (1h)
2. ✅ Optimistic updates (45min)
3. ✅ Loading mejorado (30min)
4. ✅ Lazy load (15min)
5. ✅ Background refresh (30min)

### MAÑANA (2-3 horas)

1. ✅ Implementar búsqueda local (2h)
2. ✅ Performance monitoring (1h)

### CUANDO BACKEND ESTÉ LISTO (3 días)

1. Testing de integración
2. Implementar paginación
3. Deploy y monitoreo

---

**Documento preparado por**: Equipo Frontend (PLANNER AI)
**Fecha**: 2026-02-10
**Estado**: ✅ LISTO PARA IMPLEMENTACIÓN INMEDIATA

---

**FIN DEL DOCUMENTO**
