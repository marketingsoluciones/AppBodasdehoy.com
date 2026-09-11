# `@bodasdehoy/wedding-creator` — Guía para agentes IA

Renderer del creador de webs de boda. Consumido por `editor-web` (app standalone) y `chat-ia` (preview integrado + API).

## Qué exporta

- `WeddingSiteRenderer` — componente que renderiza una web de boda completa desde JSON de configuración
- Hooks (`src/hooks/`) — para edición en vivo, estado del sitio
- Tipos: `WeddingSiteConfig`, `Theme`, `Section`, `Block` types
- `src/config.ts` — themes default, breakpoints, fonts

## Estructura `src/`

- `wedding-site/` — componentes de sección (hero, story, gallery, RSVP, gift list, etc.)
- `hooks/` — useWeddingSite, useTheme, useSection
- `types.ts` — types públicos
- `config.ts` — themes & defaults
- `global.d.ts` — declaraciones globales

## Cómo añadir una sección nueva

1. Crear componente en `src/wedding-site/sections/<NombreSeccion>.tsx`.
2. Añadir tipo a `src/types.ts` (extiende `Section` union).
3. Registrar en el switch del renderer (`src/wedding-site/Renderer.tsx`).
4. Build: `pnpm --filter @bodasdehoy/wedding-creator build`.
5. Verificar en editor-web `/preview` que renderiza.

## Reglas

- **Stateless renderer**: el componente solo lee config y renderiza. Estado/edición lo maneja el consumer (editor-web).
- **No fetch**: si una sección necesita data (ej. lista invitados), el consumer la pasa como prop.
- **Theme via CSS-in-JS Emotion** (peer dep `@emotion/react`).
- **Antd para forms/UI controls** (peer dep), lucide-react para iconos.
- **No router lock-in**: NO uses Next router/Link aquí. Pasa handlers via props.

## Verificación

```bash
pnpm --filter @bodasdehoy/wedding-creator build  # tsc → dist/
# Validar consumer:
curl -I http://localhost:3230/preview              # editor-web /preview = 200
```
