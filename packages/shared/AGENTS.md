# `@bodasdehoy/shared` — Guía para agentes IA

Capa base del monorepo. Auth, comunicación cross-app, utils, types, branding, plans, upload.

## Sub-exports (9 entrypoints — uno por dominio)

| Entrypoint | Qué expone | Consumers principales |
|---|---|---|
| `.` (root) | re-export agregado | rara vez, usar sub-paths |
| `./auth` | `AuthBridge`, `SessionBridge`, `parseJwt`, `setCrossAppIdToken` | appEventos, chat-ia |
| `./communication` | `PostMessageBridge`, `MessageType` enum | chat-ia ↔ appEventos via iframe |
| `./types` | `DevelopmentName`, `getDevelopmentNameFromHostname`, tenant types | todos |
| `./components` | `TaskCard` (light/dark variant compartida) | appEventos kanban, chat-ia tasks |
| `./utils` | `resolveApiAppBaseUrl`, utilidades cross-app | todos |
| `./upload` | helpers upload (heic2any conversion, FormData wrappers) | appEventos, chat-ia |
| `./plans` | `Plan` enum (FREE/BASIC/PRO/MAX/ENTERPRISE), pricing matrix | appEventos billing, chat-ia |
| `./branding` | tenant whitelabel (11 brands), `whitelabel(domain)` | todos |

## Cómo añadir un sub-domain

1. Crear `src/<dominio>/index.ts` que re-exporta lo público.
2. Añadir entry a `package.json#exports`:
   ```json
   "./<dominio>": {
     "types": "./dist/<dominio>/index.d.ts",
     "default": "./dist/<dominio>/index.js"
   }
   ```
3. Build: `pnpm --filter @bodasdehoy/shared build`.
4. Import en consumer: `import { x } from '@bodasdehoy/shared/<dominio>'`.

## Reglas críticas

- **NO importar React aquí salvo en `./components`**. shared debe poder usarse server-side (Node-only).
- **Firebase auth real vive en chat-ia**, NO aquí. `AuthBridge` solo sincroniza estado.
- **`PostMessageBridge` versionado**: si añades nuevo `MessageType`, asegura backward compat (consumers viejos ignoran tipos desconocidos).
- **No commits a `./plans` sin coordinar con Stripe whitelabel MongoDB** (precios fuera de código).

## Verificación post-cambio

```bash
pnpm --filter @bodasdehoy/shared build               # debe emitir dist/{8 dirs}/index.js
pnpm --filter @bodasdehoy/shared type-check          # tsc sin emit, lints types
```

Consumers deben recompilar tras cambios en exports (Next hot-reload usualmente lo detecta via package.json watch).
