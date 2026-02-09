# Wedding Site Components

Sistema de renderizado de webs de boda con soporte para preview en tiempo real y produccion.

## Arquitectura

```
wedding-site/
├── WeddingSiteRenderer.tsx    # Componente principal
├── ThemeProvider.tsx          # Proveedor de tema/paleta
├── types.ts                   # Definiciones TypeScript
├── index.ts                   # Exports
│
├── sections/                  # Secciones de la web
│   ├── HeroSection.tsx        # Hero con imagen y countdown
│   ├── ScheduleSection.tsx    # Programa del dia
│   ├── LocationSection.tsx    # Ubicacion con mapa
│   ├── GallerySection.tsx     # Galeria de fotos
│   ├── InfoSection.tsx        # Info (dress code, FAQs)
│   ├── RSVPSection.tsx        # Formulario RSVP
│   └── RegistrySection.tsx    # Mesa de regalos
│
├── shared/                    # Componentes compartidos
│   ├── SectionWrapper.tsx     # Wrapper con estilos
│   ├── SectionTitle.tsx       # Titulo de seccion
│   └── Button.tsx             # Boton reutilizable
│
├── styles/                    # Estilos y paletas
│   ├── palettes.ts            # 6 paletas de colores
│   └── fonts.ts               # Configuracion de fuentes
│
├── utils/                     # Utilidades
│   ├── formatDate.ts          # Formateo de fechas
│   └── icons.tsx              # Iconos SVG
│
├── PublishModal.tsx           # Modal de publicacion
├── MobileTabs.tsx             # Tabs para mobile
├── ErrorBoundary.tsx          # Manejo de errores
└── LoadingSkeletons.tsx       # Estados de carga
```

## Uso Basico

### Renderizar una Web de Boda

```tsx
import { WeddingSiteRenderer } from '@/components/wedding-site';
import type { WeddingWebData } from '@/components/wedding-site/types';

const wedding: WeddingWebData = {
  id: 'wedding-1',
  slug: 'maria-juan',
  couple: {
    partner1: { name: 'Maria' },
    partner2: { name: 'Juan' },
  },
  date: { date: '2025-06-15T17:00:00Z' },
  style: { palette: 'romantic' },
  hero: {
    image: 'https://example.com/hero.jpg',
    showCountdown: true,
  },
  sections: [
    // ... secciones
  ],
  // ...
};

// Modo preview (editor)
<WeddingSiteRenderer
  mode="preview"
  wedding={wedding}
  onSectionClick={(section) => console.log('Clicked:', section)}
/>

// Modo produccion (publico)
<WeddingSiteRenderer
  mode="production"
  wedding={wedding}
  onRSVPSubmit={(data) => handleRSVP(data)}
/>
```

### Usar el Hook useWeddingWeb

```tsx
import { useWeddingWeb } from '@/hooks/useWeddingWeb';

function WeddingEditor() {
  const {
    wedding,
    isLoading,
    isDirty,
    isSaving,
    updateCouple,
    updateDate,
    updatePalette,
    toggleSection,
  } = useWeddingWeb({ autoSave: true });

  // Actualizar nombres
  updateCouple('partner1', 'Maria');
  updateCouple('partner2', 'Juan');

  // Cambiar paleta
  updatePalette('elegant');

  // Activar/desactivar seccion
  toggleSection('gallery', true);
}
```

## Paletas Disponibles

| ID | Nombre | Descripcion |
|----|--------|-------------|
| `romantic` | Romantico | Rosas suaves, elegancia femenina |
| `elegant` | Elegante | Negro, dorado, sofisticado |
| `modern` | Moderno | Minimalista, colores neutros |
| `rustic` | Rustico | Tonos tierra, estilo campo |
| `beach` | Playa | Azules y turquesas, maritimo |
| `classic` | Clasico | Tradicional, colores sobrios |

### Colores de cada Paleta

```typescript
// Ejemplo: Paleta Romantica
{
  primary: '#d4a5a5',      // Rosa suave
  secondary: '#f0e6e6',    // Rosa muy claro
  accent: '#c9a9a9',       // Rosa medio
  background: '#fff9f9',   // Fondo rosado
  surface: '#ffffff',      // Superficies
  text: '#4a3f3f',         // Texto principal
  textLight: '#7a6f6f',    // Texto secundario
  border: '#e8d8d8',       // Bordes
}
```

## Secciones

### HeroSection
Imagen principal con nombres de la pareja, fecha y countdown opcional.

```tsx
hero: {
  image: 'url',
  showCountdown: true,
  subtitle: 'Nos casamos',
}
```

### ScheduleSection
Timeline del dia de la boda.

```tsx
{
  type: 'schedule',
  enabled: true,
  data: {
    title: 'Programa del Dia',
    events: [
      { id: '1', type: 'ceremony', title: 'Ceremonia', time: '17:00', location: 'Iglesia' },
      { id: '2', type: 'cocktail', title: 'Coctel', time: '18:30', location: 'Jardin' },
    ],
  },
}
```

### LocationSection
Ubicacion con mapa interactivo.

```tsx
{
  type: 'location',
  enabled: true,
  data: {
    title: 'Ubicacion',
    showMap: true,
    venues: [
      {
        id: '1',
        name: 'Hacienda Los Olivos',
        type: 'both', // 'ceremony' | 'reception' | 'both'
        address: 'Calle Principal 123',
        city: 'Ciudad',
        coordinates: { lat: 20.67, lng: -103.34 },
      },
    ],
  },
}
```

### GallerySection
Galeria de fotos con diferentes layouts.

```tsx
{
  type: 'gallery',
  enabled: true,
  data: {
    title: 'Nuestra Historia',
    layout: 'masonry', // 'grid' | 'masonry' | 'carousel'
    photos: [
      { id: '1', url: 'photo1.jpg', caption: 'Donde nos conocimos' },
    ],
  },
}
```

### InfoSection
Informacion adicional: dress code, hospedaje, FAQs.

```tsx
{
  type: 'info',
  enabled: true,
  data: {
    dressCode: {
      type: 'formal', // 'casual' | 'formal' | 'black_tie' | 'cocktail' | 'beach'
      description: 'Vestimenta formal',
      avoid: ['Blanco'],
    },
    accommodations: [...],
    faqs: [
      { id: '1', question: 'Hay estacionamiento?', answer: 'Si, amplio.' },
    ],
  },
}
```

### RSVPSection
Formulario de confirmacion de asistencia.

```tsx
{
  type: 'rsvp',
  enabled: true,
  data: {
    title: 'Confirma tu Asistencia',
    config: {
      deadline: '2025-05-15',
      allowPlusOne: true,
      askDietaryRestrictions: true,
      askSongRequest: true,
      maxGuests: 4,
    },
  },
}
```

### RegistrySection
Mesa de regalos y opcion de efectivo.

```tsx
{
  type: 'registry',
  enabled: true,
  data: {
    title: 'Mesa de Regalos',
    message: 'Tu presencia es nuestro mejor regalo',
    links: [
      { id: '1', name: 'Liverpool', url: 'https://...' },
    ],
    cashOption: {
      enabled: true,
      bankDetails: {
        bankName: 'BBVA',
        accountHolder: 'Maria Garcia',
        accountNumber: '0123456789',
      },
    },
  },
}
```

## Componentes UI

### PublishModal

Modal para publicar la web con subdomain personalizado.

```tsx
import { PublishModal } from '@/components/wedding-site';

<PublishModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  currentSubdomain={subdomain}
  coupleName="Maria & Juan"
  onPublish={async (subdomain) => {
    // Llamar API de publicacion
  }}
  onUnpublish={async () => {
    // Llamar API de despublicacion
  }}
/>
```

### MobileTabs

Tabs para navegacion en dispositivos moviles.

```tsx
import { MobileTabs } from '@/components/wedding-site';

<MobileTabs
  activeTab={mobileTab}
  onTabChange={setMobileTab}
  chatBadge={unreadCount}
  previewBadge={hasUnsavedChanges}
/>
```

### ErrorBoundary

Manejo de errores con fallback UI.

```tsx
import { WeddingCreatorErrorBoundary, SectionErrorBoundary } from '@/components/wedding-site';

// Para toda la pagina
<WeddingCreatorErrorBoundary>
  <WeddingCreatorContent />
</WeddingCreatorErrorBoundary>

// Para una seccion especifica
<SectionErrorBoundary sectionName="Gallery">
  <GallerySection {...props} />
</SectionErrorBoundary>
```

### LoadingSkeletons

Estados de carga.

```tsx
import {
  WeddingCreatorSkeleton,
  ChatSkeleton,
  PreviewSkeleton,
  SectionSkeleton,
} from '@/components/wedding-site';

// Durante carga inicial
if (isLoading) return <WeddingCreatorSkeleton />;

// Para secciones individuales
<SectionSkeleton height="300px" />
```

## API Routes

### POST /api/wedding/publish

Publicar o despublicar una web.

```typescript
// Request
{
  eventId: string;
  subdomain: string;
  action: 'publish' | 'unpublish';
}

// Response (publish)
{
  success: true;
  url: 'https://bodasdehoy.com/wedding/maria-juan';
  subdomain: 'maria-juan';
  publishedAt: '2025-01-27T12:00:00Z';
}
```

### POST /api/wedding/revalidate

Trigger ISR revalidation para una pagina publicada.

```typescript
// Request
{
  subdomain: string;
  secret: string; // REVALIDATE_SECRET
}

// Response
{
  revalidated: true;
  subdomain: 'maria-juan';
  timestamp: '2025-01-27T12:00:00Z';
}
```

## Desarrollo

### Agregar Nueva Paleta

1. Editar `styles/palettes.ts`:

```typescript
export const PALETTES: Record<PaletteType, Palette> = {
  // ... existentes
  newPalette: {
    id: 'newPalette',
    name: 'Nueva Paleta',
    colors: {
      primary: '#...',
      // ... todos los colores
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Lato',
    },
  },
};
```

2. Agregar al type en `types.ts`:

```typescript
export type PaletteType = 'romantic' | 'elegant' | ... | 'newPalette';
```

### Agregar Nueva Seccion

1. Crear componente en `sections/NewSection.tsx`
2. Agregar tipo en `types.ts`
3. Agregar case en `WeddingSiteRenderer.tsx`
4. Exportar en `index.ts`

## Testing

```bash
# Ejecutar tests
npm test -- --testPathPattern=wedding-site

# Con coverage
npm test -- --coverage --testPathPattern=wedding-site
```

## Notas

- El sistema usa CSS Variables para theming dinamico
- Las fuentes se cargan desde Google Fonts via ThemeProvider
- El modo preview permite click en secciones para edicion
- El modo produccion incluye formulario RSVP funcional
