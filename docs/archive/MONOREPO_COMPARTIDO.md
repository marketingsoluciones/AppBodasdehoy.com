# Monorepo Compartido - Integración Directa del Copilot

## 🎯 Objetivo

Eliminar el iframe y usar componentes del copilot directamente en la app principal para:
- ✅ Mejor rendimiento (sin overhead de iframe)
- ✅ Estado compartido directo (sin postMessage)
- ✅ Autenticación unificada
- ✅ Build optimizado (solo cambia lo necesario)
- ✅ Mejor experiencia de desarrollo

## 📦 Estructura Implementada

```
AppBodasdehoy.com/
├── apps/
│   ├── web/                    # App principal Next.js
│   └── copilot/                # LobeChat (copilot IA)
│
├── packages/
│   ├── shared/                 # Tipos, auth, communication
│   └── copilot-ui/            # ✨ NUEVO: Componentes UI del copilot
│       ├── src/
│       │   ├── CopilotChat.tsx     # Componente principal sin iframe
│       │   ├── types.ts            # Tipos compartidos
│       │   └── index.tsx           # Exports
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
```

## 🚀 Uso del Nuevo Componente

### Instalación

```bash
# Instalar dependencias del monorepo
pnpm install
```

### Uso en apps/web

```tsx
// Antes (con iframe)
import CopilotIframe from '../Copilot/CopilotIframe';

<CopilotIframe
  userId={userId}
  eventId={eventId}
  userData={userData}
  event={event}
/>

// Después (sin iframe) ✨
import { CopilotChat } from '@bodasdehoy/copilot-ui';

<CopilotChat
  userId={userId}
  eventId={eventId}
  userData={userData}
  event={event}
  onNavigate={(path) => router.push(path)}
  onAction={(action, payload) => handleAction(action, payload)}
/>
```

### Hook para acceder al contexto

```tsx
import { useCopilot } from '@bodasdehoy/copilot-ui';

function MiComponente() {
  const { event, userData, onNavigate } = useCopilot();

  return (
    <div>
      <h1>{event?.nombre}</h1>
      <button onClick={() => onNavigate('/invitados')}>
        Ver invitados
      </button>
    </div>
  );
}
```

## 🔧 Configuración Técnica

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'apps/copilot/packages/*'
  - 'packages/*'
```

### apps/web/package.json

```json
{
  "dependencies": {
    "@bodasdehoy/shared": "workspace:*",
    "@bodasdehoy/copilot-ui": "workspace:*"
  }
}
```

### packages/copilot-ui/package.json

```json
{
  "name": "@bodasdehoy/copilot-ui",
  "main": "./src/index.tsx",
  "exports": {
    ".": "./src/index.tsx",
    "./CopilotChat": "./src/CopilotChat.tsx"
  },
  "dependencies": {
    "@bodasdehoy/shared": "workspace:*",
    "react": "^19.2.3",
    "zustand": "5.0.4"
  }
}
```

## 📋 Próximos Pasos

### Fase 1: Preparación (✅ COMPLETADO)
- [x] Crear estructura de `@bodasdehoy/copilot-ui`
- [x] Definir tipos compartidos
- [x] Crear componente `CopilotChat` base
- [x] Configurar TypeScript y build
- [x] Actualizar `apps/web` para usar el nuevo paquete

### Fase 2: Migración Gradual (🚧 SIGUIENTE)
- [ ] Identificar componentes clave del copilot a extraer
- [ ] Migrar componente `ChatInput` sin iframe
- [ ] Migrar componente `MessageList` sin iframe
- [ ] Compartir store de Zustand entre apps
- [ ] Eliminar postMessage, usar hooks directos

### Fase 3: Optimización
- [ ] Configurar build optimizado (solo cambia lo necesario)
- [ ] Implementar code splitting
- [ ] Optimizar bundle size
- [ ] Configurar pre-rendering/SSG para componentes

### Fase 4: Cleanup
- [ ] Eliminar `CopilotIframe.tsx` completamente
- [ ] Eliminar lógica de postMessage
- [ ] Limpiar dependencias no usadas
- [ ] Actualizar tests

## 🎨 Ventajas de esta Arquitectura

### 1. Rendimiento
- **Sin overhead de iframe**: Comunicación directa, sin serialización
- **Build optimizado**: Turbo solo recompila lo que cambia
- **Code splitting**: Carga solo lo necesario
- **SSR/SSG**: Pre-renderizado para mejor rendimiento inicial

### 2. Desarrollo
- **Hot reload**: Cambios instantáneos sin recargar iframe
- **Debugging**: Stack traces completos, sin aislamiento
- **TypeScript**: Tipos compartidos, autocompletado full
- **Shared state**: Zustand compartido entre apps

### 3. Mantenibilidad
- **DRY**: No duplicar lógica entre apps
- **Versionado**: Paquetes internos con versiones claras
- **Testing**: Tests unitarios/integración más fáciles
- **Migración gradual**: Cambiar sin romper lo existente

## 📚 Recursos

### Documentación
- [packages/copilot-ui/README.md](./packages/copilot-ui/README.md) - Uso del paquete
- [packages/shared/README.md](./packages/shared/README.md) - Tipos y utils compartidos

### Ejemplos
- [apps/web/components/ChatSidebar/ChatSidebar.tsx](./apps/web/components/ChatSidebar/ChatSidebar.tsx) - Uso actual con iframe
- [apps/web/pages/copilot.tsx](./apps/web/pages/copilot.tsx) - Página del copilot

## 🔄 Migración Paso a Paso

### Paso 1: Instalar dependencias

```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com
pnpm install
```

### Paso 2: Verificar que el paquete se reconoce

```bash
pnpm --filter @bodasdehoy/web list --depth 0 | grep copilot-ui
```

### Paso 3: Importar en tu componente

```tsx
// apps/web/components/ChatSidebar/ChatSidebar.tsx
import { CopilotChat } from '@bodasdehoy/copilot-ui';
```

### Paso 4: Reemplazar CopilotIframe

```tsx
// Comentar el iframe anterior
// <CopilotIframe ... />

// Usar el nuevo componente
<CopilotChat
  userId={userId}
  development={development}
  eventId={eventId}
  eventName={event?.nombre}
  userData={user}
  event={event}
  eventsList={eventsGroup}
  onNavigate={(path) => router.push(path)}
/>
```

### Paso 5: Probar

```bash
pnpm dev
```

## ⚠️ Notas Importantes

1. **Estado actual**: El componente `CopilotChat` está preparado para integración directa pero aún muestra un placeholder. El siguiente paso es migrar los componentes reales del copilot.

2. **Compatibilidad**: El componente antiguo `CopilotIframe` sigue funcionando. Puedes migrar gradualmente.

3. **TypeScript**: Todos los tipos están definidos en `packages/copilot-ui/src/types.ts`

4. **Build**: pnpm automáticamente compila los paquetes del workspace cuando haces build

## 🤝 Contribuir

Para agregar más componentes al paquete:

1. Crea tu componente en `packages/copilot-ui/src/`
2. Exporta en `packages/copilot-ui/src/index.tsx`
3. Actualiza los tipos en `types.ts`
4. Usa en `apps/web`

## 📝 Licencia

ISC - Uso interno de Bodas de Hoy
