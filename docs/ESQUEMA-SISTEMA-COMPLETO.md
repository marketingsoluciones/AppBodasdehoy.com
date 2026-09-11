# ESQUEMA COMPLETO DEL SISTEMA — Bodas de Hoy

**Generado**: 2026-04-16 (v3 — corregido y completado)
**Propósito**: Referencia técnica para QA, desarrollo y auditoría

---

## 1. ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────────────────────────────┐
│                       FRONTEND (Vercel + Dev local)                  │
│                                                                     │
│  apps/appEventos (:3220)        apps/chat-ia (:3210)               │
│  Next.js 15 Pages Router        Next.js 15 App Router (Turbopack)  │
│  App organizador de eventos     LobeChat fork — chat IA principal  │
│  Panel Copilot integrado        Sirve bodasdehoy + OBCRM + todos   │
│  (vía copilot-shared, nativo)   los developers whitelabel          │
│                                                                     │
│  apps/memories-web (:3240)      apps/editor-web (:3230)            │
│  Álbumes de fotos por evento    Creador de webs de boda/evento     │
│                                                                     │
│  packages/ (5 compartidos)                                          │
│  ├── shared        → Auth, PostMessageBridge, utils                │
│  ├── auth-ui       → SplitLoginPage                                │
│  ├── copilot-shared → MessageList, InputEditor, i18n               │
│  ├── memories      → Store Zustand álbumes/fotos                   │
│  └── wedding-creator → WeddingSiteRenderer                         │
└──────────────┬──────────────────────┬───────────────────────────────┘
               │                      │
               ▼                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│ api2.eventosorganizador.com (143.198.62.113)                         │
│ Node.js + GraphQL + MongoDB                                          │
│ Backend PRINCIPAL: CRUD eventos, invitados, presupuesto, permisos,   │
│ Firebase Auth, billing/Stripe, invitaciones email (Brevo/SES),       │
│ WhatsApp Baileys QR, push notifications (FCM), cron digests/reminders│
│ Compilado → siempre necesita `npm run build` + `pm2 restart`         │
└──────────────────────────────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────────────────┐
│ api-ia.bodasdehoy.com (164.92.81.153)                                │
│ Python/FastAPI                                                        │
│ Orquestador IA (function-calling con ~15+ tools), mensajería          │
│ multicanal (email/WA/IG/FB/TG), memories API, observabilidad OTel,   │
│ wallet/balance, TOOL_PERMISSIONS por rol                              │
│ SSH: ~/.ssh/shared_key → SOLO LECTURA                                │
└──────────────────────────────────────────────────────────────────────┘
```

### Multideveloper (Whitelabel)

11 developers configurados en `packages/shared/src/types/developments.ts`:

| Developer | Dominio app | País | Zona horaria |
|-----------|------------|------|-------------|
| bodasdehoy | app.bodasdehoy.com | España | Europe/Madrid |
| vivetuboda | eventos.vivetuboda.com | México | America/Mexico_City |
| eventosorganizador | app.eventosorganizador.com | España | Europe/Madrid |
| champagne-events | app.champagne-events.com.mx | México | America/Mexico_City |
| annloevents | app.annloevents.com | México | America/Mexico_City |
| miamorcitocorazon | app.miamorcitocorazon.mx | México | America/Mexico_City |
| eventosintegrados | app.eventosintegrados.com | España | Europe/Madrid |
| ohmaratilano | app.ohmaratilano.com | México | America/Mexico_City |
| corporativozr | app.corporativozr.com | México | America/Mexico_City |
| theweddingplanner | app.theweddingplanner.mx | México | America/Mexico_City |
| eventosplanificador | www.eventosplanificador.com | España | Europe/Madrid |

Detección automática por hostname. Un solo deploy Vercel sirve todos los developers.

---

## 2. PROYECTOS VERCEL

| Proyecto Vercel | App | Dominios custom | Build |
|----------------|-----|-----------------|-------|
| **app-bodasdehoy-com** | appEventos | 19 dominios (todos los developers) | ✅ OK |
| **chat-ia-bodasdehoy** | chat-ia | chat.bodasdehoy.com, chat-test.bodasdehoy.com, chat.eventosorganizador.com + 5 más | ✅ OK (12GB heap) |
| **app-momentos** | memories-web | memories-test.eventosorganizador.com + vercel defaults | ✅ OK |
| ~~lobe-chat-eventos~~ | ~~Legacy~~ | ~~iachat.bodasdehoy.com~~ (migrado) | ❌ ELIMINAR |

---

## 3. ENTORNOS

| Entorno | appEventos | chat-ia | memories-web |
|---------|-----------|---------|-------------|
| **Local** | localhost:3220 | localhost:3210 | localhost:3240 |
| **Dev** | app-dev.bodasdehoy.com (CF tunnel → local) | chat-dev.bodasdehoy.com (CF tunnel → local) | memories-dev.bodasdehoy.com |
| **Test** | app-test.bodasdehoy.com (Vercel, rama `test`) | chat-test.bodasdehoy.com (Vercel, rama `test`) | memories-test.bodasdehoy.com |
| **Producción** | organizador.bodasdehoy.com / app.bodasdehoy.com (Vercel, rama `master`) | chat.bodasdehoy.com | memories.bodasdehoy.com |

### Ramas Git
- `dev` → desarrollo activo (NUNCA push sin autorización)
- `test` → entorno test (Vercel auto-deploy)
- `master` → producción
- `masterv1` → legacy (histórica)

---

## 4. MIGRACIÓN API PENDIENTE

**api.bodasdehoy.com → api2.eventosorganizador.com**

7 referencias activas que aún apuntan a la API antigua:

| Archivo | Contexto |
|---------|----------|
| `context/AuthContext.tsx` (679, 796) | SSO cross-domain |
| `api.js` (144) | URL base fallback producción |
| `pages/api/proxy-bodas/graphql.ts` (26) | Proxy servidor |
| `pages/api/proxy-bodas/[...path].ts` (13) | Proxy genérico |
| `pages/api/dev/refresh-session.ts` | Variable entorno fallback |
| `pages/api-debug.tsx` | Solo debug |
| `utils/verifyUrls.ts` | Verificación salud |

---

## 5. SERVICIOS, TAREAS E ITINERARIOS

### Modelo de datos unificado

```
Event
└── itinerarios_array: Itinerary[]
    └── Itinerary {
            _id, title, tipo, tasks[], columnsOrder[],
            viewers[], estatus, fecha_creacion
        }
        └── Task {
                _id, fecha, hora, duracion, descripcion,
                responsable[], tags[], estado, prioridad,
                estatus, spectatorView, comments[], attachments[]
            }
```

### El campo `tipo` determina todo

| tipo | Ruta URL | Fecha/hora | Duración | Vista por defecto | Drag&Drop |
|------|----------|-----------|----------|-------------------|-----------|
| `"itinerario"` | /itinerario | Obligatorio | Obligatorio | Timeline cronológica (cards agrupadas por fecha) | SÍ (reordenar tareas) |
| `"servicio"` | /servicios | Opcional | Opcional | Kanban (columnas por estado) | SÍ (entre columnas) |

### Vistas disponibles (ambos tipos)
- `boardView` → Kanban (dnd-kit, drag&drop columnas)
- `newTable` → Tabla con filas y columnas
- `extraTable` → Tabla simple
- `cards` → Tarjetas agrupadas por fecha (default itinerario)
- `schema` → Timeline cronológica

### CRUD unificado
Mismas mutations GraphQL para ambos tipos:
- `createTask`, `editTask`, `deleteTask`
- `createItinerario`, `deleteItinerario`
- `createComment`, `deleteComment` (en tasks)

### spectatorView
Controla visibilidad en **dos contextos**:
1. **Portal público del invitado** (`/e/[eventId]`, `/public-itinerary/[slug]`) — solo items con `spectatorView: true`
2. **Colaboradores** del evento — filtrado adicional por `viewers[]` array

### Filtrado client-side
`event.itinerarios_array.filter(elem => elem.tipo === pathname.slice(1))`

---

## 6. SISTEMA DE COMENTARIOS EN TAREAS

Cada task tiene comentarios integrados como mini-chat:

```typescript
interface Comment {
    _id: string
    comment: string          // HTML (Quill rich-text)
    uid: string              // UID del autor
    nicknameUnregistered: string  // Para usuarios sin cuenta
    attachments: FileData[]
    createdAt: Date
}
```

- **Operaciones**: createComment, deleteComment (NO hay edición)
- **UI**: `NewCommentsModal.tsx` (modal), `ListComments.tsx` (lectura), `InputComments.tsx` (Quill editor)
- **Permisos**: Owner siempre puede, Collaborator(edit) puede, Collaborator(view) NO puede, Guest anónimo puede con nickname
- **Notificaciones**: FCM push al comentar (NO email, NO cron)
- **commentsViewers**: Array de UIDs que vieron los comentarios — existe en schema pero sin uso activo

---

## 7. SISTEMA DE PERMISOS Y COLABORACIÓN

### Modelo de datos

```typescript
Event {
  usuario_id: string                    // UID del propietario (acceso total)
  compartido_array: string[]            // UIDs de colaboradores
  detalles_compartidos_array: [{
    uid, email, displayName, photoURL,
    onLine: { status, dateConection },
    permissions: [{ title: string, value: "none"|"view"|"edit" }],
    owner?: boolean
  }]
}
```

### Módulos con permisos (9)
`resumen`, `invitados`, `mesas`, `regalos`, `presupuesto`, `invitaciones`, `itinerario`, `servicios`, `memories`

### Niveles de permiso

| Nivel | Navegación | Lectura | Escritura |
|-------|:----------:|:-------:|:---------:|
| `none` | ❌ Bloqueada | ❌ | ❌ |
| `view` | ✅ | ✅ | ❌ |
| `edit` | ✅ | ✅ | ✅ |
| Owner | ✅ Siempre | ✅ Siempre | ✅ Siempre |

### Default para nuevo colaborador
Todos los módulos `none`, excepto `resumen` que es `view`.

### Enforcement
- **Frontend**: hooks `useAllowed()` (edit), `useAllowedRouter()` (nav), `useAllowedViewer()` (comments)
- **Backend**: api-ia tiene `TOOL_PERMISSIONS` con `min_role` por herramienta
- **GuestUpsellPage**: Interstitial para visitantes en rutas protegidas
- **LoginRequiredModal**: En chat-ia cuando visitor alcanza límite

### Flujo de compartir evento
1. Owner abre modal compartir → ingresa email
2. `addCompartitions` mutation → añade a `compartido_array` + `detalles_compartidos_array`
3. Owner configura permisos por módulo (9 módulos × 3 niveles)
4. `updateCompartitions` mutation → envía notificación al colaborador
5. Colaborador ve evento en su lista con permisos aplicados

---

## 8. HERRAMIENTAS DEL AGENTE IA (~15+ tools)

### Tools registrados en BUILTIN_TOOL_MAP (route.ts)

| Tool | Tipo | Función |
|------|------|---------|
| `get_event_details` | Lectura | Detalles del evento |
| `get_event_guests` | Lectura | Lista de invitados |
| `create_event` | Escritura | Crear evento nuevo |
| `update_event` | Escritura | Actualizar evento (fecha, nombre, etc.) |
| `add_guest` | Escritura | Añadir invitado |
| `confirm_guest` | Escritura | Confirmar asistencia |
| `update_guest` | Escritura | Actualizar datos de invitado |
| `create_task` | Escritura | Crear tarea/servicio |
| `update_task` | Escritura | Actualizar tarea |
| `complete_task` | Escritura | Marcar tarea completada |
| `get_tasks` | Lectura | Listar tareas |
| `filter_view` | UI | Filtrar vista en appEventos (banner rosa) |

### Tools CRM/OBCRM (solo para developers no-bodas)
`create_lead`, `list_leads`, `get_lead`, `search_crm`, `list_contacts`, `list_opportunities`, `get_pipeline_summary`, `get_revenue_report`, `send_message`, `update_lead_status`, `update_opportunity_stage`, `list_campaigns`, `get_campaign_performance`, `get_kpis`, `get_lead_funnel`, `add_note`, `get_contact`, `get_opportunity`

### Tools ERP (desplegados por api-ia 2026-04-16)
`erp_list_invoices`, `erp_get_invoice`, `erp_get_financial_kpis`, `erp_list_quotes`

### TOOL_PERMISSIONS (api-ia, por rol)
- `get_user_events` → INVITED_GUEST (permitido)
- `get_event_details` → INVITED_GUEST (datos filtrados)
- `get_event_guests` → CREATOR (bloqueado para invitados)
- `add_guest` → CREATOR
- `update_event`, `delete_event`, `delete_guest` → CREATOR
- `confirm_guest` → INVITED_GUEST (own_only: true)
- `update_guest` → CREATOR

### Whitelabel filtering para bodas
- **Agentes seed**: Solo 2 para bodas (Presupuesto, Asientos) vs 8 para CRM
- **Preguntas sugeridas**: 4 de bodas (invitados, presupuesto, tareas, mesas) vs 4 de CRM
- **System prompt**: "Copilot de Bodas de Hoy" vs "asistente de gestión empresarial"
- Filtrado por `BODAS_DEVELOPERS = ['bodasdehoy', 'vivetuboda', 'organizador']`

---

## 9. AUTENTICACIÓN Y SSO

### Flujo SSO cross-app
1. Usuario llega a appEventos → detecta tenant → redirige a `chat-ia/login?redirect=...`
2. chat-ia autentica (Firebase + OAuth Google/Facebook)
3. Establece cookie `idTokenV0.1.0` en `.bodasdehoy.com`
4. Redirige de vuelta a la app original
5. appEventos lee cookie → crea `sessionBodas` → usuario autenticado

### Componentes auth
- `AuthBridge.ts` (packages/shared) → Sincroniza Firebase auth ↔ localStorage ↔ cookies
- `SessionBridge.ts` → Persistencia de sesión SSO
- `PostMessageBridge.ts` → Comunicación iframe ↔ parent (PAGE_CONTEXT, COPILOT_NAVIGATE, FILTER_VIEW, REFRESH_EVENTS)
- `EventosAutoAuth/index.tsx` (chat-ia) → Auto-auth cuando embebido en appEventos

### Cookies
- `idTokenV0.1.0` → JWT Firebase (domain: `.bodasdehoy.com`)
- `sessionBodas` → Sesión appEventos (por developer)

---

## 10. INVITACIONES

### Email (via api2 → Brevo/SES)
- Owner selecciona invitados en `/invitaciones` → click "Enviar"
- Mutation `sendComunications` → api2 envía via Brevo/SES
- Templates personalizables (HTML) con variables: `{{nombre}}`, `{{fecha}}`, `{{hora}}`
- Tracking: enviada, entregada, abierta, rebotada

### WhatsApp (via api2 → Baileys)
- Requiere QR scan para conectar sesión
- Templates WhatsApp con preview
- Timeout QR 25s sin auto-reconexión (bug conocido)

### Portal público RSVP
- `/confirmar-asistencia?p=TOKEN` → Formulario de confirmación sin auth
- `/e/[eventId]` → Portal del invitado (countdown, itinerario público, RSVP)
- `/buscador-mesa/[eventId]` → Buscador de mesa asignada

---

## 11. SISTEMA DE NOTIFICACIONES Y COMUNICACIÓN

### Push Notifications (FCM)
- `useFCMToken.ts` → Registra token FCM al login
- `POST /api/push-subscribe` → Guarda token en api2
- `firebase-messaging-sw.js` → Service Worker para notificaciones background
- Tipos: task_reminder, whatsapp_message, access_revoked, permission_updated, resource_shared

### Cron jobs (api2)
- **Digest diario** → Email con notificaciones sin leer (hora configurable por developer, default 10:00)
- **Task reminder diario** → Email a organizadores con tareas pendientes (hora configurable, default 09:00)
- **Admin weekly report** → Lunes 08:00, usuarios con notificaciones >7 días sin leer

### Polling (frontend)
- `NotificationBell.tsx` → Poll cada 60s para unread count
- `/notifications` → Tabs (Todas/Sin leer), agrupación por fecha, snooze (localStorage), mark as read
- Snooze: 30 min, 1 hora, 4 horas, 1 día (solo localStorage, no server-side)

### Bug conocido: Emails solo al owner
El cron de api2 solo envía digests/reminders al `event.usuario_id`. Los colaboradores en `compartido_array` **nunca reciben emails automatizados**. Verificado via Gmail MCP (2026-04-16).

---

## 12. BILLING Y PLANES

| Plan | Precio/mes | Developer |
|------|-----------|-----------|
| FREE | €0 | bodasdehoy |
| BASIC | €9.99 | bodasdehoy |
| PRO | €29.99 | bodasdehoy |
| MAX | €79.99 | bodasdehoy |
| ENTERPRISE | €149 | bodasdehoy |

- Solo `bodasdehoy` tiene planes activos
- `plan_type` en DB lowercase → field resolver → uppercase GraphQL
- Balance enforcement: api-ia pre-check con `wallet_checkBalance`
- Saldo negativo permitido (€-0.27 observado en testing) — posible gap de policy
- `InsufficientBalanceModal` en chat-ia desktop layout
- Crédito límite: €50.00 configurable

---

## 13. COPILOT EMBEBIDO EN appEventos

**NO es un iframe simple** — usa el package `@bodasdehoy/copilot-shared`:

- `CopilotEmbed.tsx` → Componente nativo que integra `MessageList` + `InputEditor` de copilot-shared
- `ChatSidebarDirect.tsx` → Panel lateral desktop con grid responsive
- Comunicación via `PostMessageBridge`:
  - `PAGE_CONTEXT` → appEventos envía contexto de página actual
  - `COPILOT_NAVIGATE` → chat-ia pide navegar a módulo
  - `FILTER_VIEW` → IA filtra vista con banner rosa
  - `REFRESH_EVENTS` → Tras CRUD mutante, refresca datos en appEventos
- `useCopilotBridge.ts` → delay 2500ms + RETRY_DELAYS_MS=[1500,3000,5000]

---

## 14. BUILTIN TOOLS DE CHAT-IA (UI)

Tools que renderizan componentes ricos inline en el chat:

| Tool | Identifier | Render |
|------|-----------|--------|
| Venue Visualizer | `lobe-venue-visualizer` | Grilla renders IA de venues |
| Floor Plan Editor | `lobe-floor-plan-editor` | Editor planos mesas |
| Filter App View | `lobe-filter-app-view` | Filtrar entidades appEventos |
| Web Browsing | `lobe-web-browsing` | Búsqueda web + crawling |
| DALL-E 3 | `lobe-image-designer` | Galería imágenes IA |
| Code Interpreter | `lobe-code-interpreter` | Output Python |
| Local System | `lobe-local-system` | Operaciones archivos |
| Artifacts | `lobe-artifacts` | Renderizado artefactos |

---

## 15. ACCESO A BACKENDS

| Servicio | IP | Acceso | Restricciones |
|----------|-----|--------|---------------|
| api2 | 143.198.62.113 | SSH (`~/.ssh/shared_key`) | **SOLO LECTURA** — logs, grep, cat. Cambios via Slack o GraphQL mutation |
| api-ia | 164.92.81.153 | SSH (`~/.ssh/shared_key`) | **SOLO LECTURA** — cambios pedir por Slack |
| Firebase | Console web | Auth + Storage | Necesita acceso a consola |
| MongoDB | Via api2 SSH | Queries solo lectura | NUNCA inserts/updates/deletes directos |

---

## 16. USUARIOS DE PRUEBA

| Rol | Email | Evento |
|-----|-------|--------|
| Owner | jcc@bodasdehoy.com | Boda Isabel & Raúl (+ 44 más) |
| Colaborador 1 | jcc@bodasdehoy.com | Compartido por owner |
| Colaborador 2 / Invitado | jcc@marketingsoluciones.com | Email pruebas (INVITED_GUEST) |
| Extra | jcc@recargaexpress.com | — |
| Password compartida | `lorca2012M*+` | Todas las cuentas |

Nota: Todos los `jcc@*` son aliases de `carlos.carrillo@recargaexpress.com` (misma cuenta Google).

---

## 17. TESTS E2E

69 specs en `e2e-app/` usando Playwright (webkit). Áreas cubiertas:

| Área | Tests | Cobertura |
|------|-------|-----------|
| Permisos/Roles | role-access-control, crud-permission, permisos-modulos | ✅ Buena (102+ cases) |
| Mensajería 2 usuarios | chat-mensajes-2usuarios | ⚠️ UI only (no delivery verification) |
| Tareas Kanban | kanban-tareas | ✅ CRUD + drag&drop |
| Comentarios | comentarios-tareas | ✅ Por rol |
| Bandeja mensajes | bandeja-mensajes | ✅ Estructura |
| Canales | canales-setup, canales-conectividad | ⚠️ Setup only (no message flow) |
| Invitaciones | invitaciones, portal-invitado | ⚠️ UI send (no email delivery) |
| Seguridad invitados | invited-guest-security | ✅ Data isolation |
| Auth | auth, auth-flow | ✅ SSO + redirects |
| Comunicación entre usuarios | comunicacion-entre-usuarios | 🆕 13 tests (COM + PERM-CROSS + EMAIL) |

### Gaps conocidos de testing
- Email delivery end-to-end (no verificamos que el email llega al inbox)
- Push notification delivery (no FCM test real)
- Cross-user real-time sync (no verificamos que U2 ve cambios de U1 sin refresh)
- RSVP submission → DB persistence → UI update del organizador
