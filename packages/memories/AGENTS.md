# `@bodasdehoy/memories` — Guía para agentes IA

Store Zustand + Provider para álbumes y fotos por evento. Compartido entre `memories-web` (standalone), `appEventos` (página momentos) y `chat-ia` (venue-visualizer + memories page).

## Qué exporta

- `useMemoriesStore()` — hook Zustand con álbumes, fotos, miembros, UI state
- `MemoriesProvider`, `useMemoriesConfig` — config provider (API URL, eventId, etc.)
- `initialMemoriesState` — estado inicial
- Selectors: `selectAlbums`, `selectCurrentAlbum`, `selectCurrentMedia`, `selectUploadProgress`, ...
- `getCached`, `setCache`, `invalidateCache`, `clearAllCache` — cache layer

## Slices (`src/slices/`)

| Slice | Estado | Acciones |
|---|---|---|
| `albumsSlice` | álbumes del evento | CRUD álbumes |
| `mediaSlice` | fotos/videos del álbum actual | upload, delete, reorder |
| `membersSlice` | miembros del álbum | invitar, remover |
| `uiSlice` | search term, selección múltiple, modal state | toggle modal, set search |

## Cómo añadir una feature

1. Identifica slice relevante (o crea `src/slices/<nuevo>Slice.ts`).
2. Define estado + acciones siguiendo patrón existente (`StateCreator`).
3. Compón en `src/store.ts` con `...createXSlice(set, get)`.
4. Añade selectors en `src/selectors.ts`.
5. Exporta lo público en `src/index.ts`.
6. Build: `pnpm --filter @bodasdehoy/memories build`.

## Reglas

- **Single source of truth**: el store es el mismo en las 3 apps (memories-web, appEventos, chat-ia).
- **No fetch directamente desde el slice**: las acciones llaman API via `useMemoriesConfig().apiUrl` que el consumer inyecta.
- **Cache (`src/cache.ts`)**: usa LRU simple, expiración por TTL. NO cachees datos sensibles aquí.
- **Workspace dep `@bodasdehoy/shared`**: usa `resolveApiAppBaseUrl` para URLs.

## Verificación

```bash
pnpm --filter @bodasdehoy/memories build         # tsc → dist/
pnpm --filter @bodasdehoy/memories type-check
# Si tocaste integración en consumer:
curl -I http://localhost:3220/momentos            # appEventos página álbumes
```
