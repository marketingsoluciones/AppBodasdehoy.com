# Inventario E2E suite `e2e-app/` — 103 specs, 2,167 tests

_Generado 2026-05-23. Catalogación post-pivot lote 12._

## Resumen

- **103 spec files**, **2167 tests** totales (workers=1 serial = mucho tiempo)
- **59 specs con backend dep** (afectadas por bug api-mcp `status` mutation, ver Slack ts 1779526417.816909)
- **44 specs sin backend dep** (potencialmente ejecutables localmente sin esperar fix)
- **6 multi-user explicit**, **5 realtime explicit**

**Por prioridad:** P0=22 · P1=20 · P2=61

## Comando ejecución

```bash
E2E_ENV=local PLAYWRIGHT_BROWSER=webkit npx playwright test --config=playwright.config.ts e2e-app/<spec>.ts
# Opciones útiles:
#  -g "BATCH X" — filtrar por describe block
#  --grep "@tag" — filtrar por tag
#  --list — solo listar sin ejecutar
#  --headed — ver navegador (debug)
```

## Tabla por dominio

### 01 Auth & Login

| Spec | Tests | Prio | BE | M-U | RT | Tags | Descripción |
|---|---|---|---|---|---|---|---|
| `auth-flow.spec.ts` | 10 | P0 | 🟢 |  |  | @email @gmail @playwright | Valida el flujo completo de autenticación en chat-ia: |
| `login.spec.ts` | 6 | P0 | 🟢 |  |  | @playwright | (sin descripción) |
| `auth-diagnostic.spec.ts` | 41 | P2 | 🟢 |  |  | @gmail @playwright | Plan de diagnóstico y detección de fallos en login/logout |
| `auth-flow-multiapp.spec.ts` | 29 | P2 | 🔴 |  |  | @email @fake @gmail | Valida el flujo de autenticación SSO compartido entre las apps: |
| `auth.spec.ts` | 24 | P2 | 🔴 |  |  | @gmail @marketingsoluciones @playwright | Pruebas de autenticación y sesión para app-dev y chat-dev: |
| `diag-login.spec.ts` | 3 | P2 | 🔴 |  |  | @gmail @playwright | SPEC DIAGNÓSTICO — no corre por defecto en CI. |
| `eventos-auth-bug.spec.ts` | 18 | P2 | 🔴 |  |  | @playwright | Bug: api-ia responde "sesión expirada" al preguntar por eventos estando logueado |
| `login-logout-cycle.spec.ts` | 7 | P2 | 🔴 |  |  | @param @playwright | login-logout-cycle.spec.ts — LLC: Login / Logout lifecycle tests |
| `login-random-5.spec.ts` | 8 | P2 | 🟢 |  |  | @playwright | (sin descripción) |
| `probe-login.spec.ts` | 1 | P2 | 🟢 |  |  | @playwright | (sin descripción) |
| `redirect-login.spec.ts` | 9 | P2 | 🟢 |  |  | @playwright | Redirect login: app-test /login debe redirigir a chat-test con redirect= de vuel |
| `sso-double-login.spec.ts` | 14 | P2 | 🔴 |  |  | @gmail @playwright | SSO Double Login Diagnostic — app-test / chat-test |

### 02 Chat IA / Copilot

| Spec | Tests | Prio | BE | M-U | RT | Tags | Descripción |
|---|---|---|---|---|---|---|---|
| `copilot-chat.spec.ts` | 32 | P1 | 🟢 |  |  | @playwright | Tests del copilot embebido (iframe) en appEventos y del chat-ia standalone: |
| `copilot-invitados-evento.spec.ts` | 7 | P1 | 🔴 |  |  | @playwright | E2E: Consulta de invitados desde Copilot embebido con evento seleccionado. |
| `crud-ia-verificado.spec.ts` | 8 | P1 | 🔴 |  |  | @playwright @test | Tests CRUD mediante IA con verificación cruzada en UI de appEventos. |
| `flujo-copilot-confirmacion-visual.spec.ts` | 10 | P1 | 🔴 |  |  | @playwright | Subdominios app-test / chat-test. Login, túneles y BPM se dan por hechos. |
| `batch-comparativa.spec.ts` | 12 | P2 | 🟢 |  |  | @gmail @playwright | Lanza 3 × misma pregunta a chat-ia: |
| `chat-battery-roles.spec.ts` | 33 | P2 | 🔴 |  |  | @email @gmail @playwright | Batería de preguntas al chat IA por rol de usuario: |
| `chat-ia-flows.spec.ts` | 80 | P2 | 🔴 |  |  | @fincaromeral @playwright @ruizfoto | Tests E2E reales para chat-test.bodasdehoy.com |
| `chat-ia-internal-channels.spec.ts` | 14 | P2 | 🟢 |  |  | @gmail @playwright | Tests de bandeja /messages chat-ia (commit 43f0c5bf): |
| `chat-ia-messages-session.spec.ts` | 3 | P2 | 🟢 |  |  | @playwright | (sin descripción) |
| `copilot-contextual.spec.ts` | 23 | P2 | 🔴 |  |  | @gmail @playwright | Tests de Copilot Contextual (commit 7ef75832): |
| `copilot-feature-detect.spec.ts` | 12 | P2 | 🔴 |  |  | @playwright | Detecta el estado del Copilot IA en appEventos: |
| `preguntas-filtros-usuario.spec.ts` | 26 | P2 | 🔴 |  |  | @playwright | Tests E2E en navegador: preguntas como usuario y comprobación de filtros. |
| `proveedores-ia.spec.ts` | 20 | P2 | 🟢 |  |  | @playwright | Tests E2E para la configuración de proveedores IA y verificación de claves priva |
| `widget-chat.spec.ts` | 23 | P2 | 🟢 |  |  | @playwright | Tests del Widget de Chat embebido — /widget/[development] |

### 03 Invitados / Invitaciones

| Spec | Tests | Prio | BE | M-U | RT | Tags | Descripción |
|---|---|---|---|---|---|---|---|
| `guest-y-logueado.spec.ts` | 14 | P1 | 🟢 |  |  | @playwright | Pruebas para usuario guest (sin sesión) y usuario logueado. |
| `invitaciones.spec.ts` | 41 | P1 | 🔴 |  |  | @gmail @playwright @recargaexpress | Tests de envío de invitaciones en appEventos (/invitaciones): |
| `invitado-y-link.spec.ts` | 9 | P1 | 🔴 |  |  | @gmail @playwright | E2E: Crear invitado en "Boda Isabel & Raúl" y verificar link de invitación. |
| `invitados-menus-crud.spec.ts` | 5 | P1 | 🔴 |  |  | @bodasdehoy-test @playwright | (sin descripción) |
| `invited-guest-security.spec.ts` | 34 | P1 | 🔴 |  |  | @bodasdehoy @email @gmail | Plan de pruebas de seguridad y permisos para rol INVITED_GUEST. |
| `whatsapp-invitaciones.spec.ts` | 28 | P1 | 🔴 |  |  | @gmail @playwright | Tests de invitaciones vía WhatsApp en appEventos (feature producto-core): |
| `portal-invitado.spec.ts` | 18 | P2 | 🟢 |  |  | @playwright | Tests del portal público del invitado en appEventos: |
| `ui-invitados.spec.ts` | 31 | P2 | 🔴 |  |  | @playwright | ui-invitados.spec.ts — Tests UI directos: módulo Invitados |
| `ui-portal-invitado.spec.ts` | 9 | P2 | 🔴 |  |  | @playwright | ui-portal-invitado.spec.ts — Tests UI directos: rutas públicas del portal del in |

### 04 Mesas / Floor Plan

| Spec | Tests | Prio | BE | M-U | RT | Tags | Descripción |
|---|---|---|---|---|---|---|---|
| `mesas.spec.ts` | 37 | P1 | 🔴 |  |  | @gmail @playwright | Tests del módulo de mesas (editor visual de distribución) en appEventos: |
| `p0-mesas-create-edit.spec.ts` | 6 | P1 | 🔴 |  |  | @playwright | (sin descripción) |
| `floor-plan-tool.spec.ts` | 19 | P2 | 🟢 |  |  | @playwright | E2E tests para el builtin tool "lobe-floor-plan-editor" en chat-ia. |

### 05 Presupuesto / Billing

| Spec | Tests | Prio | BE | M-U | RT | Tags | Descripción |
|---|---|---|---|---|---|---|---|
| `presupuesto.spec.ts` | 5 | P1 | 🟢 |  |  | @playwright | (sin descripción) |
| `ui-presupuesto.spec.ts` | 12 | P1 | 🔴 |  |  | @playwright | ui-presupuesto.spec.ts — Tests UI directos: módulo Presupuesto |
| `billing-saldo.spec.ts` | 20 | P2 | 🟢 |  |  | @playwright | Tests de facturación y saldo para dos developers: |
| `billing.spec.ts` | 29 | P2 | 🟢 |  |  | @playwright | Tests de facturación y planes en chat-ia (chat-test): |
| `facturacion-billing.spec.ts` | 52 | P2 | 🔴 |  |  | @playwright | Tests E2E del sistema de facturación y deducción de tokens. |
| `presupuesto-pagos.spec.ts` | 28 | P2 | 🔴 |  |  | @gmail @playwright | Tests del módulo de presupuesto y pagos en appEventos: |
| `wallet-balance.spec.ts` | 15 | P2 | 🔴 |  |  | @gmail @playwright | Tests del sistema de wallet/saldo en chat-ia (feature money-critical): |

### 07 Servicios / Tareas / Comentarios

| Spec | Tests | Prio | BE | M-U | RT | Tags | Descripción |
|---|---|---|---|---|---|---|---|
| `comentarios-tareas.spec.ts` | 25 | P0 | 🔴 |  |  | @gmail @marketingsoluciones @playwright | comentarios-tareas.spec.ts — Comentarios en Tareas (Servicios) × Roles |
| `smoke-tarea-notificacion.spec.ts` | 3 | P0 | 🟢 |  | ⚡ | @bodasdehoy @marketingsoluciones @playwright | Test ligero: U1 loguea → selecciona evento → crea tarea vía IA → |
| `socket-notificacion-comentario-2usuarios.spec.ts` | 3 | P0 | 🔴 | 👥 | ⚡ | @playwright | (sin descripción) |
| `kanban-tareas.spec.ts` | 43 | P1 | 🔴 |  |  | @gmail @playwright | Tests del kanban de tareas en appEventos (/servicios): |
| `ui-kanban-servicios.spec.ts` | 11 | P2 | 🔴 |  |  | @playwright | ui-kanban-servicios.spec.ts — Tests UI directos: módulo Servicios / Kanban |

### 08 Realtime / Notificaciones / Inbox

| Spec | Tests | Prio | BE | M-U | RT | Tags | Descripción |
|---|---|---|---|---|---|---|---|
| `notificaciones.spec.ts` | 27 | P0 | 🟢 |  | ⚡ | @playwright | Tests de la página de notificaciones en chat-ia (/notifications): |
| `notifications-improvements.spec.ts` | 25 | P0 | 🔴 |  | ⚡ | @gmail @playwright | Tests de mejoras notificaciones (commits 8e62e7a9 + e5b0b958): |
| `socket-resilience.spec.ts` | 17 | P0 | 🔴 |  | ⚡ | @gmail @playwright | Tests de resilience de sockets (notificaciones realtime) en appEventos: |
| `bandeja-mensajes.spec.ts` | 49 | P1 | 🟢 |  |  | @playwright | Tests E2E de la Bandeja / tab Messages en chat-ia (chat-test): |
| `messages-inbox-track-a.spec.ts` | 27 | P1 | 🟢 |  |  | @gmail @playwright | Tests Track A FRONT — Sprint Fase 1 bandeja /messages: |
| `messages-inbox-track-b-schema.spec.ts` | 24 | P1 | 🔴 |  |  | @playwright | Tests Track B api-mcp — Sprint Fase 1 schema GraphQL: |

### 09 Multi-User / Permisos / Roles

| Spec | Tests | Prio | BE | M-U | RT | Tags | Descripción |
|---|---|---|---|---|---|---|---|
| `chat-mensajes-2usuarios.spec.ts` | 44 | P0 | 🟢 | 👥 |  | @bodasdehoy @gmail @lobehub | Tests E2E de mensajería entre dos usuarios reales simultáneos. |
| `comunicacion-entre-usuarios.spec.ts` | 19 | P0 | 🔴 | 👥 |  | @bodasdehoy @marketingsoluciones @playwright | Tests E2E de comunicación real entre usuarios: |
| `concurrent-editing.spec.ts` | 18 | P0 | 🔴 | 👥 |  | @gmail @playwright | Tests de edición simultánea (race conditions, conflict resolution) en appEventos |
| `multi-tenant-smoke.spec.ts` | 9 | P0 | 🟢 |  |  | @playwright | Smoke por cada tenant CONFIRMADO de AppBodas (4 hoy): |
| `permisos-modulos.spec.ts` | 151 | P0 | 🔴 |  |  | @e2e @email @gmail | Matriz completa de permisos por módulo y rol. |
| `role-access-control.spec.ts` | 25 | P0 | 🔴 |  |  | @bodasdehoy @email @gmail | Batería de tests de control de acceso por rol contra eventos REALES de la DB. |
| `role-setup-verification.spec.ts` | 12 | P0 | 🟢 |  |  | @bodasdehoy @email @gmail | role-setup-verification.spec.ts — RSV: Verificación de Setup por Rol |
| `share-event-permissions.spec.ts` | 14 | P0 | 🔴 | 👥 |  | @marketingsoluciones @playwright | Seguridad CRÍTICA — flow compartir evento + permisos colaborador. |
| `multi-developer.spec.ts` | 38 | P2 | 🟢 |  |  | @gmail @playwright | Tests E2E contra múltiples whitelabels / developers: |

### 10 Memorias / Album

| Spec | Tests | Prio | BE | M-U | RT | Tags | Descripción |
|---|---|---|---|---|---|---|---|
| `memories-album.spec.ts` | 18 | P2 | 🔴 |  |  | @gmail @playwright @recargaexpress | e2e-app/memories-album.spec.ts |
| `memories-deep.spec.ts` | 18 | P2 | 🟢 |  |  | @playwright | Tests de cobertura adicional para memories-web (álbumes de fotos): |
| `memories-web-standalone.spec.ts` | 16 | P2 | 🔴 |  |  | @email @gmail @playwright | e2e-app/memories-web-standalone.spec.ts |

### 11 Editor Web

| Spec | Tests | Prio | BE | M-U | RT | Tags | Descripción |
|---|---|---|---|---|---|---|---|
| `editor-web-deep.spec.ts` | 13 | P2 | 🟢 |  |  | @playwright | Tests de cobertura adicional para editor-web (creador de webs de boda): |
| `editor-web.spec.ts` | 15 | P2 | 🟢 |  |  | @playwright | E2E tests para editor-web (`:3230` local / editor-test.bodasdehoy.com). |

### 12 Admin / Audit

| Spec | Tests | Prio | BE | M-U | RT | Tags | Descripción |
|---|---|---|---|---|---|---|---|
| `admin-panel.spec.ts` | 38 | P2 | 🟢 |  |  | @playwright | Tests del panel de administración en chat-ia (/admin/*): |
| `audit-trail.spec.ts` | 16 | P2 | 🔴 |  |  | @gmail @playwright | Tests de historial de cambios (audit trail) en appEventos: |
| `security-deep.spec.ts` | 19 | P2 | 🔴 |  |  | @gmail @playwright | Tests de seguridad profunda en appEventos: |

### 13 Canales (WhatsApp / Email)

| Spec | Tests | Prio | BE | M-U | RT | Tags | Descripción |
|---|---|---|---|---|---|---|---|
| `canales-conectividad.spec.ts` | 23 | P2 | 🔴 |  |  | @e2e @playwright | Tests E2E de conectividad para los 6 canales del sistema de mensajería: |
| `canales-setup.spec.ts` | 34 | P2 | 🟢 |  |  | @account @bodasdehoy @playwright | Tests de setup de canales de mensajería en /messages (chat-ia): |

### 14 Performance / Edge / Diag

| Spec | Tests | Prio | BE | M-U | RT | Tags | Descripción |
|---|---|---|---|---|---|---|---|
| `persistencia-crud.spec.ts` | 11 | P1 | 🔴 |  |  | @playwright | Layer C — Persistencia de mutaciones (Round-trip DB) |
| `visitor-limit.spec.ts` | 40 | P1 | 🔴 |  |  | @playwright | Pruebas E2E — Límite de mensajes y sesión de visitante. |
| `consistencia-db-ui.spec.ts` | 11 | P2 | 🔴 |  |  | @playwright | Layer B — Consistencia DB ↔ UI |
| `data-integrity.spec.ts` | 28 | P2 | 🔴 |  |  | @gmail @playwright | Tests de integridad de datos tras operaciones complejas en appEventos: |
| `diag-status-exhaustivo.spec.ts` | 2 | P2 | 🔴 |  |  | @gmail @playwright | (sin descripción) |
| `edge-cases.spec.ts` | 19 | P2 | 🟢 |  |  | @playwright | Tests de casos límite y robustez: |
| `errores-api.spec.ts` | 3 | P2 | 🟢 |  |  | @playwright | (sin descripción) |
| `i18n-coverage.spec.ts` | 18 | P2 | 🔴 |  |  | @gmail @playwright | Tests de internacionalización (i18n) en appEventos: |
| `offline-behavior.spec.ts` | 11 | P2 | 🔴 |  |  | @gmail @playwright | Tests de comportamiento offline en appEventos: |
| `pagecontext-analytics.spec.ts` | 19 | P2 | 🔴 |  |  | @gmail @playwright | Tests de pageContextExtractor analytics (commit db86bf3a): |
| `perf-chat-shell.spec.ts` | 2 | P2 | 🟢 |  |  | @playwright | (sin descripción) |
| `perf-under-load.spec.ts` | 21 | P2 | 🔴 |  |  | @gmail @playwright | Tests de performance bajo carga real en appEventos: |
| `perfiles-visitante.spec.ts` | 24 | P2 | 🟢 |  |  | @playwright | Batería de pruebas por perfil de usuario — Visitante (sin registro). |
| `storage-r2.spec.ts` | 19 | P2 | 🔴 |  |  | @gmail @playwright | Tests de subida de fotos a Cloudflare R2 vía api-ia. |

### 15 Otros

| Spec | Tests | Prio | BE | M-U | RT | Tags | Descripción |
|---|---|---|---|---|---|---|---|
| `crud-permission.spec.ts` | 19 | P0 | 🔴 | 👥 |  | @bodasdehoy @email @playwright | Tests DETERMINÍSTICOS — respuestas validadas contra valores reales de la DB. |
| `home.spec.ts` | 5 | P0 | 🟢 |  |  | @playwright | (sin descripción) |
| `rutas.spec.ts` | 3 | P0 | 🟢 |  |  | @playwright | (sin descripción) |
| `smoke-jcc.spec.ts` | 2 | P0 | 🟢 |  |  | @bodasdehoy @playwright | (sin descripción) |
| `smoke.spec.ts` | 6 | P0 | 🟢 |  |  | @playwright | (sin descripción) |
| `ui-smoke-dev.spec.ts` | 8 | P0 | 🔴 |  |  | @bodasdehoy @playwright | (sin descripción) |
| `acciones-crud.spec.ts` | 51 | P2 | 🔴 |  |  | @gmail @playwright | Tests E2E de CRUD real con usuario autenticado: |
| `auditoria-visual-movil.spec.ts` | 29 | P2 | 🟢 |  |  | @gmail @playwright | Auditoría visual de todas las apps en distintos formatos de móvil. |
| `filter-view.spec.ts` | 18 | P2 | 🔴 |  |  | @playwright | filter-view.spec.ts — E2E para la herramienta lobe-filter-app-view |
| `menu-usuario.spec.ts` | 6 | P2 | 🟢 |  |  | @playwright | (sin descripción) |
| `modulos-organizador.spec.ts` | 48 | P2 | 🟢 |  |  | @playwright | Tests funcionales de los módulos del organizador en appEventos: |
| `registro-y-onboarding.spec.ts` | 40 | P2 | 🔴 |  |  | @playwright @test @test-e2e-invalido | Cubre los flujos de autenticación y onboarding: |
| `smoke-coord.spec.ts` | 3 | P2 | 🟢 |  |  | @gmail @playwright | (sin descripción) |
| `usuario-secundario-vivetuboda.spec.ts` | 22 | P2 | 🟢 |  |  | @bodasdehoy @gmail @playwright | Tests E2E con un segundo usuario de prueba (test-usuario2@bodasdehoy.com) |

## Leyenda

- **Prio P0** = bloqueante / core (multi-user + realtime + auth + smoke)
- **Prio P1** = domain core (CRUD modules + notif)
- **Prio P2** = nice-to-have (perf, edge, diag)
- **BE 🔴** = depende backend api-mcp (afectado por bug `status` mutation)
- **BE 🟢** = NO depende backend (puede correr local sin fix)
- **👥** = multi-user explícito (2+ contexts)
- **⚡** = realtime explícito (sockets/notif sin reload)
