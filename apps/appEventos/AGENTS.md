# `@bodasdehoy/appEventos` — Guía para agentes IA

App principal organizador de eventos. Next.js 15 **Pages Router**. Puerto dev `:3220`.

## Dominios funcionales

| Dominio | Carpetas clave | Función |
|---|---|---|
| Presupuesto | `components/PresupuestoV2/`, `components/TableroPresupuesto/` | TableBudgetV2, FinancialSummary, PaymentsList, SummaryCards |
| Invitados | `components/Invitados/` | BlockTableroInvitados, GrupoTablas, DataTable, PDF export |
| Mesas | `components/Mesas/` (35 files) | LienzoDragable, MesaRedonda/Cuadrada/Imperial, Chair, SentadoItem |
| Servicios | `components/Servicios/`, `VistaKanban/`, `VistaTabla/`, `VistaTeajeta/` | Kanban tareas, listas, tarjetas |
| Invitaciones | `components/Invitaciones/` (40 dirs) | Envío email/WhatsApp, templates |
| Itinerario | `components/Itinerario/` | Timeline evento |
| Mocomentos (álbumes) | `pages/momentos.tsx` + `@bodasdehoy/memories` | Álbumes integrados |

## Stack

- Next.js 15 Pages Router (NO App Router como chat-ia)
- React 19.2
- Tailwind 3, Apollo Client (GraphQL), Firebase auth
- @bodasdehoy/{shared, auth-ui, memories, copilot-shared} via dist (FASE 3+4)
- E2E: Playwright + webkit

## Comandos

```bash
pnpm dev:web                                     # solo appEventos (turbo lo orquesta)
pnpm dev:local                                   # appEventos + chat-ia paralelo
pnpm build:web                                   # build prod (Vercel target)
pnpm test:e2e:app:smoke                          # smoke E2E
```

## Reglas

- **Pages Router NO App Router**: rutas en `pages/`, `getServerSideProps` para SSR.
- **GraphQL via Apollo** apuntando a `https://api-mcp.eventosorganizador.com/graphql`.
- **Auth Firebase + JWT cookie** `idTokenV0.1.0` Domain=`.bodasdehoy.com` (compartido con chat-ia via SSO).
- **Permisos Servicios/Itinerario**: 4 niveles (evento > módulo > area > task). NO simplificar — leer `memory/critical_servicios_permissions.md`.
- **Notificaciones**: `components/Notifications.tsx` + `pages/api/notifications.ts` proxy a API MCP + polling 60s + Socket.IO.
- **`transpilePackages` reducido** (FASE 4 PR-4.2): solo `@lobehub/ui`, `@lobehub/editor`, `react-layout-kit`, `zustand-utils`. Packages compartidos vienen pre-compilados desde dist/.

## Integraciones cross-package

- `@bodasdehoy/auth-ui#SplitLoginPage` en `pages/login.js`
- `@bodasdehoy/memories#useMemoriesStore` en `pages/momentos.tsx`
- `@bodasdehoy/copilot-shared#{MessageList, InputEditor, ChatItem}` en `CopilotEmbed.tsx`
- `@bodasdehoy/shared` (auth, communication, types, utils, branding, plans) — múltiples puntos

## Verificación post-cambio

```bash
curl -I http://localhost:3220/                    # / = 200
curl -I http://localhost:3220/login               # /login = 200 (auth-ui dist)
curl -I http://localhost:3220/momentos            # álbumes integrados
pnpm --filter @bodasdehoy/appEventos type-check
```
