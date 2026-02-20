# @bodasdehoy/wedding-creator

Paquete compartido: **Creador de webs** para bodas y eventos. Uso en Copilot, App Bodas, CRM/ERP o web standalone.

## Contenido

- **Tipos:** `WeddingWebData`, `WeddingSiteRendererProps`, secciones (Schedule, Location, RSVP, etc.), paletas, `WeddingCreatorConfig`.
- **Componentes:** `WeddingSiteRenderer`, `ThemeProvider`, secciones (Hero, Schedule, Location, Gallery, Info, RSVP, Registry), `PublishModal`, `MobileTabs`, `ImageUploader`, `ErrorBoundary`, skeletons, estilos (palettes, fonts), utils (formatDate, icons).
- **Hook:** `useWeddingWeb` — estado y acciones para editar la web; persistencia opcional vía API inyectable o por defecto `fetch` a `/api/wedding`.

## Instalación (monorepo)

En `package.json` de la app:

```json
"@bodasdehoy/wedding-creator": "workspace:*"
```

En Next.js, añade el paquete a `transpilePackages` en `next.config.js`/`next.config.ts`:

```js
transpilePackages: ['@bodasdehoy/wedding-creator'],
```

## Uso básico

### Renderizar una web de boda (solo lectura o con callbacks)

```tsx
import { WeddingSiteRenderer } from '@bodasdehoy/wedding-creator';
import type { WeddingWebData } from '@bodasdehoy/wedding-creator';

<WeddingSiteRenderer
  mode="production"
  wedding={weddingData}
  onRSVPSubmit={async (submission) => { /* enviar a tu API */ }}
/>
```

### Estado editable con el hook

```tsx
import { useWeddingWeb, WeddingSiteRenderer } from '@bodasdehoy/wedding-creator';

function Editor() {
  const { wedding, updateCouple, updatePalette, saveWedding, isDirty } = useWeddingWeb({
    weddingId: 'id-opcional',
    persistToAPI: true,
    autoSave: true,
    autoSaveDelay: 2000,
  });

  return (
    <WeddingSiteRenderer
      mode="preview"
      wedding={wedding}
      onSectionClick={(section) => {}}
    />
  );
}
```

### Persistencia con API propia

Si no usas la ruta `/api/wedding` de Next.js, inyecta tu API:

```tsx
import { useWeddingWeb } from '@bodasdehoy/wedding-creator';

const api = {
  load: async (id: string) => {
    const res = await fetch(`https://tu-api.com/wedding/${id}`);
    const data = await res.json();
    return data;
  },
  save: async (wedding: WeddingWebData) => {
    const res = await fetch(`https://tu-api.com/wedding/${wedding.id}`, {
      method: 'PUT',
      body: JSON.stringify({ wedding }),
    });
    return res.ok;
  },
};

const { wedding, saveWedding } = useWeddingWeb({
  weddingId: 'abc',
  persistToAPI: true,
  api,
});
```

## Dependencias

- `react` y `react-dom` (peer). El host debe tener **styled-jsx** si usas Next.js (incluido por defecto); en otro bundler puede hacer falta configurarlo para los estilos del renderer.

## Estructura del paquete

- `src/types.ts` — tipos del modelo de datos.
- `src/config.ts` — `WeddingCreatorConfig`.
- `src/wedding-site/` — componentes, secciones, estilos, utils.
- `src/hooks/useWeddingWeb.ts` — hook de estado y persistencia.
- `src/index.ts` — re-export de todo lo público.

## Ver también

- **Plan general:** `docs/PLAN-PAQUETES-MEMORIES-CREADOR.md`
- **App standalone:** `apps/creador-standalone` (landing que enlaza al editor en Copilot).
