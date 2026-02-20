# @bodasdehoy/memories

Paquete compartido: **Memories** (álbumes y fotos por evento). Uso en Copilot, App Bodas, CRM/ERP o web standalone.

## Contenido

- **Tipos:** `Album`, `AlbumMedia`, `AlbumMember`, `EventAlbumStructure`, `MemoriesConfig`, etc.
- **Store (Zustand):** `useMemoriesStore` — estado y acciones (fetchAlbums, createAlbum, fetchAlbum, etc.). Config inyectable vía `setConfig()` o `<MemoriesProvider>`.
- **Contexto:** `MemoriesProvider`, `useMemoriesConfig` — inyección de `apiBaseUrl`, `userId`, `development`.

## Instalación (monorepo)

En `package.json` de la app:

```json
"@bodasdehoy/memories": "workspace:*"
```

En Next.js, añade el paquete a `transpilePackages` en `next.config.js`/`next.config.ts`:

```js
transpilePackages: ['@bodasdehoy/memories'],
```

## Uso

### Envolver la app con el provider

```tsx
import { MemoriesProvider, useMemoriesStore } from '@bodasdehoy/memories';

function App() {
  return (
    <MemoriesProvider
      apiBaseUrl={process.env.NEXT_PUBLIC_MEMORIES_API_URL || ''}
      userId={user?.uid ?? ''}
      development="bodasdehoy"
    >
      <MemoriesRoutes />
    </MemoriesProvider>
  );
}
```

Si no usas el provider, puedes llamar a `setConfig(apiBaseUrl, userId, development)` desde el store antes de usar las acciones.

### Consumir el store

```tsx
function MemoriesRoutes() {
  const { albums, albumsLoading, fetchAlbums, createAlbum } = useMemoriesStore();

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  // createAlbum(data), fetchAlbum(id), fetchAlbumMedia(id), etc.
}
```

### API del store

- **Config:** `setConfig(apiBaseUrl, userId, development)` o `<MemoriesProvider>`.
- **Carga:** `fetchAlbums()`, `fetchAlbum(id)`, `fetchAlbumMedia(id)`, `fetchAlbumMembers(id)`, `fetchAlbumsByEvent(eventId)`, etc.
- **Escritura:** `createAlbum(data)`, `updateAlbum(id, data)`, `deleteAlbum(id)`, `uploadMedia(albumId, file)`, `deleteMedia(albumId, mediaId)`, etc.
- **Compartir / invitaciones:** `generateShareLink(albumId)`, `inviteMember(albumId, email, role)`, `removeMember(albumId, userId)`, etc.
- **UI:** `toggleCreateAlbumModal`, `toggleInviteModal`, `toggleShareModal`, `toggleUploadModal`, `setSearchTerm`, `setSelectedMediaIds`, `clearCurrentAlbum()`.

Las peticiones HTTP usan `apiBaseUrl` del estado. En App Bodas se suele dejar `apiBaseUrl=''` y usar un proxy (ej. `/api/memories/...`) que reenvía al backend.

## Variables de entorno (recomendadas)

- **apiBaseUrl en el host:** puede venir de `NEXT_PUBLIC_MEMORIES_API_URL` o `MEMORIES_API_URL` (server). Por defecto el backend suele ser `https://api-ia.bodasdehoy.com`.
- **apps/memories-standalone:** `NEXT_PUBLIC_MEMORIES_API_URL`, `NEXT_PUBLIC_DEVELOPMENT`. Ver `apps/memories-standalone/README.md`.

## Estructura del paquete

- `src/initialState.ts` — tipos y estado inicial.
- `src/action.ts` — acciones del store.
- `src/store.ts` — store Zustand.
- `src/context.tsx` — MemoriesProvider y useMemoriesConfig.
- `src/index.ts` — re-export de todo lo público.

## Ver también

- **Plan general:** `docs/PLAN-PAQUETES-MEMORIES-CREADOR.md`
- **App standalone:** `apps/memories-standalone`
