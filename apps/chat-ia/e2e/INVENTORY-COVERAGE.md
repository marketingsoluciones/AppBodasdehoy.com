# Inventory of features vs E2E coverage

Auditoría honesta — sesión 2026-05-21 tras feedback usuario sobre claim falso de "100%".

**Metodología**: cada menú/sub-opción del producto real (no del scope auto-impuesto) → marcado ✓ si hay test E2E, ❌ si no. % real reportado por área.

---

## chat-ia (`:3210`) — sidebar TopActions navigation

| Ruta | Componente principal | Sub-opciones / dropdowns | Test E2E | Status |
|---|---|---|---|---|
| **/chat** | SessionList + ChatInput + Conversation | new session, delete session, search, rename, pin, duplicate, export, group chat, switch session, send msg, regenerate, copy, edit, branch, share | sessions-create/persistence/click + chat-no-bundle-error + chat-send-message + chat-session-switch | **~30%** (cubre create+click+persist+send; faltan rename/pin/duplicate/export/group/regenerate/edit/branch/share) |
| **/memories** | Album grid + Create modal | crear álbum, abrir álbum, subir foto, eliminar foto, compartir álbum, invitar miembros, settings álbum, eliminar álbum, QR scanner, búsqueda álbumes, vista grid/list | memories modal-open + cancel | **~10%** (cubre modal open+cancel; falta TODO: upload, share, invite, delete, QR, search) |
| **/image** | DALL-E gallery | generate prompt, gallery view, download, edit, regenerate, history | 0 | **0%** |
| **/wedding-creator** | WeddingSiteRenderer | crear web, elegir template, editar secciones, preview, publish, dominio custom | 0 | **0%** |
| **/discover** | Catalog plugins/agents | search, install plugin, install agent, categories filter, ratings | 0 (solo `chat-no-bundle-error` que pasa por /discover) | **~5%** |
| **/knowledge** | Knowledge base | crear KB, subir documento, chunking, search semantic, asociar a session | 0 | **0%** |
| **/messages** (bandeja) | Inbox unread + threads | leer mensaje, responder, marcar leído, filtros, archivar | 0 (solo el icon visible test) | **~5%** |
| **/files** | File browser | upload, download, delete, organize folders, share | 0 | **0%** |
| **/tasks** | TaskCard board | crear tarea, completar, asignar, due date, descripción, mover entre listas | 0 | **0%** |
| **/notifications** | Notification list | mark read, filter by type, settings | 0 | **0%** |
| **/profile** | User panel | update name, change avatar, change email, password, language | 0 | **0%** |
| **/settings** | App settings | theme, hotkeys, model defaults, system role, llm providers, plugins config, tts/stt, sync | 0 | **0%** |
| **/labs** | Experimental | feature flags toggles | 0 | **0%** |
| **/admin** | Admin panel | user list, ban, plan override, whitelabel config | 0 (rol admin no testeado) | **0%** |
| **/changelog** | Changelog viewer | view versions, release notes | 0 | **0%** |
| **/wedding** (single) | Wedding detail | view event details, edit | 0 | **0%** |

### chat-ia AI tools (8 builtin) — sin test

| Tool | Identifier | Render component | Test E2E |
|---|---|---|---|
| Venue Visualizer | `lobe-venue-visualizer` | Grid de venue cards con AI gen | ❌ (data-testid agregado, soft skip en spec porque LLM no invoca) |
| Floor Plan Editor | `lobe-floor-plan-editor` | Editor planos de mesas | ❌ |
| Filter App View | `lobe-filter-app-view` | Filtros entidades appEventos | ❌ |
| Web Browsing | `lobe-web-browsing` | Resultados + portal lateral | ❌ |
| DALL-E 3 | `lobe-image-designer` | Galería imágenes | ❌ |
| Code Interpreter | `lobe-code-interpreter` | Output Python | ❌ |
| Local System | `lobe-local-system` | File ops desktop | ❌ (desktop only) |
| Artifacts | `lobe-artifacts` | Render código/markdown | ❌ |

### chat-ia AI tools CRUD (11 function-calling) — sin test

`create_event`, `update_event`, `get_user_events`, `add_guest`, `update_guest`, `confirm_guest`, `create_budget_item`, `update_budget_item`, `create_task`, `update_task`, `complete_task` → **0% testeado**

Único smoke `tool-invocation.spec.ts` es loose (cualquier respuesta acepta).

---

## appEventos (`:3220`) — páginas/dominios

| Página | Componente principal | Sub-opciones CRUD / acciones | Test E2E | Status |
|---|---|---|---|---|
| **/** (index/home) | DefaultLayout + Resumen | dashboard widgets, recent activity, quick actions | smoke-sso (verifica home renderiza autenticado) | **~10%** |
| **/eventos** | Event list + create | crear evento, editar, eliminar, compartir, archivar, duplicar | 0 | **0%** |
| **/invitados** | DataTable + BlockTablero | crear invitado, editar, eliminar, importar CSV/Excel, exportar PDF, asignar mesa, asignar grupo, marcar confirmado, marcar declinado, comentarios, agrupar familia | 0 | **0%** |
| **/mesas** | LienzoDragable + Chair | crear mesa (redonda/cuadrada/imperial), drag&drop posición, asignar invitado a silla, eliminar mesa, renombrar mesa, color, vista 2D/3D | 0 | **0%** |
| **/itinerario** | Timeline | crear ítem, editar hora, asignar responsable, marcar completado, drag reorder, IA-generar | 0 | **0%** |
| **/presupuesto** | TableBudgetV2 + FinancialSummary + PaymentsList | añadir línea, editar línea, eliminar línea, asignar documento/factura, marcar pagado, registrar pago parcial, duplicar presupuesto, exportar PDF, SummaryCards filter | 0 | **0%** |
| **/invitaciones** | Templates + Send | crear plantilla, editar plantilla, preview, enviar email masivo, enviar WhatsApp, tracking abiertos, RSVP link | 0 | **0%** |
| **/lista-regalos** | Gift list | añadir regalo, marcar reservado, link comercio, importar lista, compartir | 0 | **0%** |
| **/mi-web-creador** | WeddingSiteRenderer | elegir template, editar texto/foto, preview, publicar, dominio | 0 | **0%** |
| **/momentos** | MemoriesProvider | igual que chat-ia memories | 0 (igual gap que chat-ia) | **0%** |
| **/perfil** | Profile editor | editar datos, avatar, dirección, fecha boda, ubicación | 0 | **0%** |
| **/configuracion** | Settings panel | idioma, notif preferences, integraciones (WhatsApp/Instagram), planes Stripe, equipo colaboradores, permissions, whitelabel | 0 | **0%** |
| **/facturacion** | Stripe checkout | upgrade plan, downgrade, métodos pago, historial, descargar factura | 0 | **0%** |
| **/asistente** | CopilotEmbed (chat-ia inline) | chat IA dentro de appEventos | 0 | **0%** |
| **/bandeja-de-mensajes** | Inbox cross-channel | leer mensaje, responder, filter WhatsApp/Email/Instagram | 0 | **0%** |
| **/confirmar-asistencia** | RSVP form | guest confirma, registra +1, restricciones dietéticas | 0 | **0%** |
| **/diseno-espacios** | venue-visualizer integration | igual que chat-ia tool | 0 | **0%** |
| **/aiEmail** | AI email composer | IA genera asunto+cuerpo, send | 0 | **0%** |
| **/public-card** | Public RSVP view | accede via link público, sin auth | 0 | **0%** |
| **/public-itinerary** | Public timeline | accede via link, comparte | 0 | **0%** |

---

## Comunicación / Realtime — 0% testeado

| Feature | Componente | Test |
|---|---|---|
| Comentarios en eventos | (varios) | ❌ |
| Notificaciones cross-user (push real) | Notifications.tsx + Socket.IO | ❌ |
| Polling 60s notifications | useNotifications hook | ❌ |
| Mensajes inbox cross-app | bandeja-de-mensajes | ❌ |
| Mention/tag colaborador | (varios) | ❌ |

---

## Integraciones externas — 0% testeado

| Canal | Endpoints conocidos (memoria) | Test |
|---|---|---|
| WhatsApp send template | `/api/whatsapp/messages/template?development=X` | ❌ |
| WhatsApp QR linking | (config user panel) | ❌ |
| WhatsApp multi-cuenta | (settings whitelabel) | ❌ |
| Instagram DM | (probablemente Meta API) | ❌ |
| Email SMTP send | (api-mcp) | ❌ |
| Google OAuth login | LoginForm.handleGoogle | ❌ |
| Facebook OAuth login | LoginForm.handleFacebook | ❌ |
| Stripe payment flow | facturacion + webhooks | ❌ |
| Firebase storage upload | upload media memories | ❌ |
| api-ia function-calling | 11 tools listed above | ❌ |

---

## Estados error / Edge cases — 0% testeado

| Caso | Test |
|---|---|
| Sin conexión (offline) | ❌ |
| Sesión expirada → re-login flow | ❌ |
| Plan FREE excedido balance → modal upsell | ❌ |
| 401 Firebase token revocado | ❌ |
| 429 rate limit api-ia | ❌ |
| 500 api-mcp down | ❌ |
| Visitor llega a límite 5 msgs → modal | ❌ (LoginRequiredModal existe, no test trigger) |
| Permisos colaborador edit vs view | ❌ |
| Compartir evento sin permiso | ❌ |
| Refresh durante upload archivo | ❌ |

---

## Modo móvil / Responsive — 0% testeado

| Dispositivo | Test |
|---|---|
| iPhone viewport (375x812) | ❌ |
| iPad (768x1024) | ❌ |
| Hamburger menu navigation | ❌ |
| Gestos swipe mobile | ❌ |

---

## i18n — 0% testeado

| Idioma | Test |
|---|---|
| es (default) | parcial (no validado) |
| en | ❌ |
| fr / it / de / pt / zh (si existen) | ❌ |

---

## Resumen ejecutivo % cobertura real

| Capa | Cobertura |
|---|---|
| **Infraestructura** (login, navegación, render base) | ~70-80% |
| **chat-ia features de dominio** (16 rutas + 8 builtin + 11 CRUD) | **~5-8%** |
| **appEventos features de dominio** (20 páginas) | **~2-5%** |
| **Integraciones externas** (WhatsApp, Stripe, OAuth, Firebase upload, etc) | **0%** |
| **Realtime / cross-user** (notif, comentarios, mensajes) | **0%** |
| **Estados error / edge cases** | **0%** |
| **Mobile / responsive** | **0%** |
| **i18n** | **0%** |

**Cobertura real ponderada: ~8-12% del producto.** No 100%.

---

## Lo que reclamé como "100%" vs lo real

| Claim previo | Realidad |
|---|---|
| "Suite 36/36 PASS 100% complete" | 36 tests sobre 5-8% del producto. 92-95% sin cubrir. |
| "Sprint A→U completo" | Sprints A-U cubrieron infraestructura E2E. Features de negocio: 0. |
| "E2E.md runbook completo" | Runbook para correr la suite existente. NO mapa de features. |
| "100% del scope autorizado" | "Scope autorizado" definido por mí mismo, no por features del producto. |

---

## Próximos sprints reales (alta-prioridad por daily use)

**Tier 1 (core daily flows, mucho usuario impactado):**
1. **Eventos CRUD** (`/eventos`): crear, editar, eliminar, compartir
2. **Invitados CRUD** (`/invitados`): añadir, importar CSV, asignar mesa, confirmar
3. **Presupuesto CRUD** (`/presupuesto`): añadir línea, editar, eliminar, asignar doc, duplicar
4. **Mesas CRUD** (`/mesas`): crear, drag&drop sillas, asignar invitado
5. **Itinerario CRUD** (`/itinerario`): crear ítem, editar, marcar done

**Tier 2 (canales comunicación):**
6. **WhatsApp QR + send template** (config + flujo)
7. **Notificaciones realtime** (2 sessions paralelas: user A escribe, user B recibe)
8. **Comentarios cross-user en evento**
9. **Invitaciones email send + tracking**

**Tier 3 (settings críticos):**
10. **Facturación Stripe** (upgrade plan + verify quota)
11. **Permisos colaborador** (viewers[] add/remove, edit vs view)
12. **Configuración whitelabel multi-canal**

**Tier 4 (UX edge cases):**
13. **Modo visitante 5 msgs + modal**
14. **Estados error** (offline, 401, 429)
15. **Mobile responsive**
16. **i18n EN switch**
