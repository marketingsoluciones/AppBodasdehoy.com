# Plan paquetes Memories y Creador (Opción A)

**Índice de paquetes del monorepo:** [PAQUETES-COMPARTIDOS.md](PAQUETES-COMPARTIDOS.md).

## Para que funcione (resumen)

1. **En local:** Desde la raíz: `pnpm install` (o `pnpm install --no-frozen-lockfile`) y luego `pnpm run verify:packages` (typecheck + test web + build standalones). Ver [PAQUETES-COMPARTIDOS.md - Probar en local](PAQUETES-COMPARTIDOS.md#probar-en-local).
2. **CI:** El workflow [.github/workflows/ci-packages.yml](../.github/workflows/ci-packages.yml) se ejecuta en push/PR a `main`, `master`, `feature/nextjs-15-migration`; no requiere configuración adicional.
3. **Pre-producción:** Revisar variables de entorno, builds y despliegue según el [checklist](#checklist-pre-producción-puesta-en-marcha) más abajo.

## Hecho en este avance

### 1. Paquete `@bodasdehoy/memories` (`packages/memories`)

- **Estado:** Estructura lista y usable.
- **Contenido:**
  - Tipos: `Album`, `AlbumMedia`, `AlbumMember`, `EventAlbumStructure`, `MemoriesConfig`, etc.
  - Store Zustand con configuración inyectable: `apiBaseUrl`, `userId`, `development` vía `setConfig()` o `<MemoriesProvider>`.
  - Acciones: `fetchAlbums`, `fetchAlbum`, `fetchAlbumMedia`, `fetchAlbumMembers`, `createAlbum`, `clearCurrentAlbum`, toggles de modales, `setSearchTerm`, `setSelectedMediaIds`.
  - Cache en `localStorage` (5 min) para álbumes y media.
  - Export: `useMemoriesStore`, `MemoriesProvider`, `useMemoriesConfig`, tipos e `initialMemoriesState`.
- **Consumo:** La app host envuelve con `<MemoriesProvider apiBaseUrl={...} userId={...} development={...}>` y usa `useMemoriesStore()`. Ver `packages/memories/README.md` (instalación, transpilePackages, variables de entorno, API del store).
- **Pendiente:** Añadir el resto de acciones del copilot si se quieren en el paquete; hoy están las esenciales y muchas avanzadas (deleteAlbum, uploadMedia, inviteMember, generateShareLink, etc.).

### 2. Paquete `@bodasdehoy/wedding-creator` (`packages/wedding-creator`)

- **Estado:** Fase 2 hecha. Componentes wedding-site en el paquete; Copilot consume desde `@bodasdehoy/wedding-creator`.
- **Contenido:**
  - `WeddingCreatorConfig` y tipos (WeddingWebData, secciones, paletas, etc.).
  - **Componentes:** WeddingSiteRenderer, ThemeProvider, secciones (Hero, Schedule, Location, Gallery, Info, RSVP, Registry), shared (Button, SectionTitle, SectionWrapper), PublishModal, MobileTabs, ImageUploader, ErrorBoundary, LoadingSkeletons.
  - **Estilos:** palettes, fonts (Google Fonts).
  - **Utils:** formatDate, icons.
  - **Hook:** `useWeddingWeb` (estado + acciones; persistencia opcional vía API inyectable o por defecto fetch a `/api/wedding`). Tipos: `UseWeddingWebOptions`, `UseWeddingWebReturn`, `WeddingWebAPI`.
- **Documentación:** `packages/wedding-creator/README.md` con instalación, uso del renderer, del hook y API inyectable.
- **Pendiente (opcional):** Mover `useWeddingWebGraphQL` y servicio de chat al paquete si se quiere todo el flujo GraphQL en el paquete.

## Workspace

- `pnpm-workspace.yaml` ya incluye `packages/*`, por lo que ambos paquetes forman parte del monorepo.
- Tras `pnpm install` (o `pnpm install --no-frozen-lockfile` si el lockfile no incluye los nuevos paquetes), cualquier app puede añadir:
  - `"@bodasdehoy/memories": "workspace:*"`
  - `"@bodasdehoy/wedding-creator": "workspace:*"`

## Avance realizado (automático) — última actualización

- **Copilot store/memories:** Eliminada la lógica duplicada; `store/memories/index.ts` solo re-exporta desde `@bodasdehoy/memories`. Eliminados `initialState.ts`, `action.ts`, `store.ts`.
- **Apps/web:** Dependencia `@bodasdehoy/memories`, página `/momentos` con `MemoriesProvider` y lista de álbumes. **Proxy** `pages/api/memories/[...path].ts` que reenvía a la API de Memories (por defecto `https://api-ia.bodasdehoy.com`; configurable con `NEXT_PUBLIC_MEMORIES_API_URL` o `MEMORIES_API_URL`). Enlace "Momentos" y "Mi web creador" en la navegación. `next.config.js`: transpilePackages incluye `@bodasdehoy/memories`.
- **Apps/memories-web:** App Next.js mínima (puerto 3080) que solo monta Memories: depende de `@bodasdehoy/memories`, página principal con formulario de userId (o `?userId=`) y lista de álbumes. Sin login propio; en producción se integra el login que se desee. README y variables `NEXT_PUBLIC_MEMORIES_API_URL`, `NEXT_PUBLIC_DEVELOPMENT`.
- **Apps/creador-standalone:** App Next.js mínima (puerto 3081) solo del Creador de webs: dependencia `@bodasdehoy/wedding-creator`. **/** landing con enlace a Copilot y a "Ver vista previa de ejemplo". **/preview** vista previa con `WeddingSiteRenderer` y datos mock (sin backend). Variable `NEXT_PUBLIC_CHAT` para la URL base de Copilot. Scripts raíz: `pnpm dev:creador`, `pnpm build:creador`.
- **Wedding-creator fase 2:** Componentes `wedding-site` movidos a `packages/wedding-creator/src/wedding-site/`. Copilot tiene dependencia `@bodasdehoy/wedding-creator`, `transpilePackages` incluye el paquete, y todas las importaciones pasan a `@bodasdehoy/wedding-creator` (página wedding-creator, wedding/[slug], services, API routes). **Hook useWeddingWeb:** En el paquete (`packages/wedding-creator/src/hooks/useWeddingWeb.ts`) con API inyectable opcional; Copilot re-exporta desde `@/hooks/useWeddingWeb` para no cambiar imports. `useWeddingWebGraphQL` y weddingChatService siguen en Copilot. **Limpieza:** Eliminada la carpeta duplicada `apps/copilot/src/components/wedding-site`; el test está en `app/[variants]/(main)/wedding-creator/__tests__/WeddingSiteRenderer.test.tsx`.

## Avance realizado (automático) — anterior

1. **Paquete memories:** Acciones completas (deleteAlbum, deleteMedia, updateAlbum, uploadMedia, fetchAlbumsByEvent, fetchSubAlbums, createEventAlbumStructure, generateShareLink, getAlbumByItinerary, getAlbumsByEvent, getEventGuests, getPublicAlbum, inviteMember, removeMember, updateMemberRole, sendQrToGuests). Config inyectable vía `setConfig` o `MemoriesProvider`.
2. **Copilot:** Dependencia `@bodasdehoy/memories` añadida. Layout de Memories envuelve con `MemoriesProviderWrapper` (inyecta apiBaseUrl, userId, development). Páginas `memories/page.tsx` y `memories/[albumId]/page.tsx` usan `useMemoriesStore` del paquete y llamadas sin params (fetchAlbums(), createAlbum(data), etc.). Tests actualizados a mock de `@bodasdehoy/memories`.
3. **Wedding-creator:** Tipos completos añadidos al paquete (WeddingWebData, secciones, palettes, etc.). Config ya existía. Los componentes React (WeddingSiteRenderer, secciones) siguen en `apps/copilot`; moverlos al package es un siguiente paso opcional.

## Variables de entorno (Memories)

- **apps/web** (proxy `/api/memories/[...path]`): `NEXT_PUBLIC_MEMORIES_API_URL` o `MEMORIES_API_URL` → URL base del backend (por defecto `https://api-ia.bodasdehoy.com`).
- **apps/memories-web**: `NEXT_PUBLIC_MEMORIES_API_URL`, `NEXT_PUBLIC_DEVELOPMENT` (opcionales). Ver `apps/memories-web/README.md`.
- **apps/creador-standalone**: `NEXT_PUBLIC_CHAT` (URL base de Copilot; por defecto `https://chat.bodasdehoy.com`). Ver `apps/creador-standalone/README.md`.

## Testing por workspace (comandos desde la raíz)

| Workspace | Comando | Notas |
|-----------|---------|--------|
| packages/memories | `pnpm --filter @bodasdehoy/memories run typecheck` | Solo typecheck. |
| packages/wedding-creator | Se comprueba al ejecutar Copilot (`test-app` o `build`). | Typecheck en contexto de consumo (React, antd). |
| apps/copilot | `pnpm --filter @bodasdehoy/copilot run test-app` | Incluye tests Memories y Wedding-creator. |
| apps/web | `pnpm --filter @bodasdehoy/web test:run` | Incluye test de humo Memories (`utils/__tests__/memoriesIntegration.test.ts`). |
| apps/memories-web | `pnpm test:memories` o `pnpm --filter @bodasdehoy/memories-web test` | `test` = `next build` (smoke). |
| apps/creador-standalone | `pnpm test:creador` o `pnpm --filter @bodasdehoy/creador-standalone test` | `test` = `next build` (smoke). TypeScript: `ignoreBuildErrors: true` en next.config; el paquete wedding-creator se type-checka en Copilot. |
| packages/memories (desde raíz) | `pnpm typecheck:packages` | Solo typecheck del paquete memories. |

## CI (puesta en marcha)

- Workflow en la **raíz** del repo: [.github/workflows/ci-packages.yml](../.github/workflows/ci-packages.yml).
- Jobs: **typecheck-packages**, **test-copilot** (test-app), **test-web**, **build-standalones** (build:memories, build:creador).
- Se ejecuta en push/PR a `main`, `master`, `feature/nextjs-15-migration`. Requiere `pnpm install --no-frozen-lockfile` y Node 22.

## Checklist pre-producción (puesta en marcha)

1. **Variables de entorno:** Revisar [.env.example](../.env.example) (Memories y Creador) y READMEs de cada app; en producción configurar `NEXT_PUBLIC_MEMORIES_API_URL` / `MEMORIES_API_URL` y `NEXT_PUBLIC_CHAT` donde aplique.
2. **Build de producción:** Ejecutar `pnpm run build:production` (o por separado: `pnpm build:memories`, `pnpm build:creador`, `pnpm build:web`, `pnpm build:copilot`) y comprobar que no hay errores.
3. **Despliegue y dominios:** Configurar despliegue (Vercel u otro) y DNS para standalones; tabla y detalles en [PAQUETES-COMPARTIDOS.md - Despliegue y dominios](PAQUETES-COMPARTIDOS.md#despliegue-y-dominios-standalones).
4. **Autenticación en standalones:** memories-web: ver [apps/memories-web/README.md](../apps/memories-web/README.md#autenticación); en producción integrar login (Firebase, JWT, etc.) y documentar cómo se obtiene el usuario.

## Próximos pasos recomendados

1. ~~**App standalone Creador (opcional):** Crear `apps/creador-standalone`~~ Hecho: landing con enlace a Copilot; cuando el paquete exporte el editor se puede montar aquí.
2. ~~**Wedding-creator fase 2 (opcional):** Mover `wedding-site` y lógica del creador desde Copilot a `packages/wedding-creator` y exportar el componente principal.~~ Hecho: componentes, estilos, utils y hook `useWeddingWeb` en el paquete; Copilot re-exporta el hook y usa el paquete. Opcional: mover `useWeddingWebGraphQL` y weddingChatService al paquete.
