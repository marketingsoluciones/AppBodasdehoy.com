# `@bodasdehoy/editor-web` — Guía para agentes IA

App standalone para crear webs de boda/evento. Next.js 15 Pages Router. Puerto dev `:3230`.

## Función

Editor visual de webs para bodas/eventos. Cliente edita layout, secciones, theme y obtiene URL pública. Consume `@bodasdehoy/wedding-creator` para renderizar el preview.

## Stack

- Next.js 15 Pages Router
- React 18.2 (override hoist a 19.2.4)
- `@bodasdehoy/wedding-creator` para `WeddingSiteRenderer` (preview)
- Antd para UI controls del editor
- Emotion para CSS-in-JS

## Comandos

```bash
pnpm dev:creador                                  # solo editor-web
pnpm build:creador
pnpm test:creador
```

## Reglas

- **El renderer vive en `wedding-creator` package**, no aquí. editor-web es el editor (UI + persistencia).
- **`/preview` page** usa `WeddingSiteRenderer` del package — NO duplicar lógica de rendering.
- **Persistencia**: configuración del sitio se guarda en MongoDB via API MCP GraphQL.
- **Themes**: vienen del package, NO definir nuevos aquí (extensible via tokens).

## Verificación

```bash
curl -I http://localhost:3230/                    # / = 200
curl -I http://localhost:3230/preview             # /preview = 200 (WeddingSiteRenderer monta)
pnpm --filter @bodasdehoy/editor-web type-check
```
