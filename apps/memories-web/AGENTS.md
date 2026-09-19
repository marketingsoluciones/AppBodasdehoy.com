# `@bodasdehoy/memories-web` — Guía para agentes IA

App standalone para álbumes de fotos. Next.js 15 Pages Router. Puerto dev `:3240`.

## Función

Web pública/privada de álbumes por evento (boda, cumpleaños, etc.). Consumida por:
- Invitados que reciben link al álbum del evento
- Mismo store `@bodasdehoy/memories` que usan appEventos (momentos page) y chat-ia (memories page)

## Stack

- Next.js 15 Pages Router
- React 18.2 (pnpm.overrides global ya pina a 19.2.4 efectivo)
- Tailwind 3
- `@bodasdehoy/memories` como store principal
- `@bodasdehoy/shared` para utils + types

## Comandos

```bash
pnpm dev:memories                                 # solo memories-web
pnpm build:memories
pnpm test:memories
```

## Reglas

- **memories-web == frontend ligero** del package memories. NO duplicar lógica de store aquí.
- **Renderiza desde useMemoriesStore** del package. Si necesitas state nuevo, añádelo al package, NO aquí.
- **`pnpm.overrides` raíz** pina react/react-dom a 19.2.4 — `package.json` local dice ^18 pero pnpm hoist a 19.

## Verificación

```bash
curl -I http://localhost:3240/                    # / = 200 (o redirect login)
pnpm --filter @bodasdehoy/memories-web type-check
```
