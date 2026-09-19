# Guía para asistentes (agentes) — monorepo

Este fichero resume políticas y rutas **dentro del repo**. Las reglas detalladas viven en **`.cursor/rules/`** (muchas con `alwaysApply: true`).

## Reglas transversales (léelas en este orden si entras en el proyecto)

| Fichero | Qué cubre |
|---------|-----------|
| [`.cursor/rules/mcp-slack-plan-invites.mdc`](.cursor/rules/mcp-slack-plan-invites.mdc) | MCP, planes, invitados, Slack, límites de invitados |
| [`.cursor/rules/app-test-chat-test.mdc`](.cursor/rules/app-test-chat-test.mdc) | Entornos `*-dev` / `*-test`, E2E con **WebKit**, carga de env E2E |
| [`.cursor/rules/e2e-user-jcc-multi-brand.mdc`](.cursor/rules/e2e-user-jcc-multi-brand.mdc) | Cuenta operador **JCC** en varias marcas (`@bodasdehoy.com`, `@eventosorganizador.com`, `@marketingsoluciones.com`), JWT coherente |
| [`.cursor/rules/dev-subdomains-webkit-only.mdc`](.cursor/rules/dev-subdomains-webkit-only.mdc) | Memoria operativa `-dev` y solo WebKit |
| [`.cursor/rules/respuesta-concisa.mdc`](.cursor/rules/respuesta-concisa.mdc) | Estilo de respuesta |

## Credenciales E2E (no versionar secretos)

1. Plantilla: **`.env.e2e.credentials.example`**
2. Copiar a **`.env.e2e.test.local`** / **`.env.e2e.dev.local`** en la **raíz** del monorepo y rellenar solo en local.
3. Scripts `pnpm test:e2e:*` que usan credenciales suelen ir prefijados con **`bash scripts/with-root-e2e-env.sh test|dev|prod`** (ver `package.json`).

## Reglas globales de Cursor (otros repos / sin abrir este workspace)

Texto listo para **Cursor → Settings → Rules** (usuario): **`scripts/cursor-global-rule-mcp-slack.txt`** (incluye MCP, Slack, E2E/JCC y puntero a este repo).

## Apps con reglas propias

- **`apps/chat-ia/.cursor/rules/`** — convenciones Next.js, Zustand, tests de chat-ia, etc.

## API (DEV/TEST)

Referencia rápida de endpoints, variables de entorno y SSH: **[`docs/API-ENDPOINTS-SSH.md`](docs/API-ENDPOINTS-SSH.md)**.

## Pipeline (este equipo: solo DEV)

1. `pnpm release:gate:unit` — comprobaciones rápidas en local.
2. E2E contra **localhost** o **`*-dev`**: p. ej. `pnpm test:e2e:app:ver:local`, `test:e2e:mesas:dev`; credenciales **`.env.e2e.dev.local`** cuando el script use `with-root-e2e-env.sh dev`.

**Test / producción** solo si el usuario lo pide explícitamente (otro equipo o CI): entonces `release:gate:e2e:smoke:test`, `verify:e2e` contra app-test, o `vercel:deploy:*`.

Detalle: `.cursor/rules/app-test-chat-test.mdc` (alcance *solo DEV* y sección *Pipeline*).
