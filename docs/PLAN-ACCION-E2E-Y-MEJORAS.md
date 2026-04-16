# Plan de acción — E2E, calidad y mejoras del sistema

_Actualizado: 2026-03-08_

## Estado actual

### ✅ Completado en esta sesión

| Área | Qué se hizo |
|---|---|
| `ItineraryPanel.tsx` | Loading state + rollback optimista en `handleUpdate` |
| `ItineraryPanel.tsx` | Notificación push a asignados al editar tarea (5 campos) |
| `ItineraryPanel.tsx` | `REFRESH_EVENTS` postMessage a chat-ia tras editar (gateado a campos relevantes) |
| `ItineraryPanel.tsx` | Bug fix: `fecha` apiValue indefinido cuando no contiene 'T' |
| `InboxSidebar.tsx` | Rediseño: secciones Tareas pendientes + Conversaciones recientes + Mis eventos |
| `TaskDetailWorkspace.tsx` | Workspace de tarea con tarjeta (ring-2 pink), input IA con contexto prefijado |
| `useRecentConversations.ts` | Hook para conversaciones WhatsApp recientes con routing correcto |
| `usePendingTasksSidebar.ts` | Hook para tareas pendientes del evento más próximo |
| `SkeletonPage.tsx` | Skeleton shimmer reutilizable |
| Páginas (8) | Skeleton en lugar de pantalla en blanco: itinerario, servicios, resumen, invitados, mesas, invitaciones, lista-regalos, presupuesto |
| E2E | `bandeja-mensajes.spec.ts` — 7 suites, InboxSidebar, tarea workspace, WhatsApp |
| E2E | `acciones-crud.spec.ts` — 9 suites, CRUD invitados/presupuesto/servicios/mesas |
| E2E | `multi-developer.spec.ts` — whitelabels, SSO, IA reasoning, performance, login flow |

---

## 🔜 Pendiente prioritario

### P1 — Crítico (afecta funcionalidad producción)

#### 1.1 Notificaciones push a móvil (FCM / Web Push)
Las notificaciones actuales son solo en-app (bell icon). Cuando un responsable no está en la web, no se entera.

**Archivos a tocar:**
- `apps/appEventos/hooks/useNotification.ts` — añadir `type: 'push'` con FCM token
- `api-ia` o `api2` — endpoint `/api/push-notification` que use Firebase Admin SDK + FCM

**Criterio de éxito:** Asignado recibe notificación push en móvil cuando la tarea cambia.

#### 1.2 Debounce en `handleUpdate` (rapid-fire edits) ✅ IMPLEMENTADO
- Optimistic local update inmediato + API call debounced 400ms por `taskId:fieldName`
- `apiTimersRef = Map<string, Timer>` — solo envía el último valor de cada campo en una ráfaga
- Cleanup de timers en unmount via `useEffect` con return cleanup
- Archivo: `apps/appEventos/components/Itinerario/MicroComponente/ItineraryPanel.tsx`

#### 1.3 WhatsApp — verificar que `wa-{id}` routing funciona end-to-end ✅ IMPLEMENTADO
- `[channel]/page.tsx` maneja `wa-{id}` como canal externo → muestra `ConversationList`
- `[channel]/[conversation_id]/page.tsx` maneja el detalle de conversación
- Archivos: `apps/chat-ia/src/app/[variants]/(main)/messages/[channel]/`

---

### P2 — Alta prioridad (UX importante)

#### 2.1 SkeletonPage específico por página ✅ IMPLEMENTADO
Todos los skeletons en `components/Utils/SkeletonPage.tsx`:

| Página | Componente |
|---|---|
| `/invitados` | `SkeletonTable` — avatar + 5 columnas, 8 filas |
| `/presupuesto` | `SkeletonBudget` — tarjeta de totales + 5 categorías colapsables |
| `/itinerario` | `SkeletonTimeline` — 3 grupos por fecha + 3 tarjetas cada uno |
| `/servicios` | `SkeletonTimeline` — misma estructura (usa BoddyIter) |
| `/mesas` | `SkeletonMesas` — mix de círculos y rectángulos |
| generic | `SkeletonPage` — sigue disponible para lista-regalos, invitaciones, resumen |

#### 2.2 Error boundary por módulo ✅ IMPLEMENTADO
`ModuleErrorBoundary` en `components/ErrorBoundary.tsx` (inline, sin `height:100vh`, con botón "Reintentar").
Aplicado en:
- `/presupuesto` → `BlockListaCategorias`
- `/resumen-evento` → 8 bloques independientes
- `BoddyIter.tsx` → `ItineraryPanel` (cubre `/itinerario` y `/servicios`)

#### 2.3 Botón "Crear evento" en home si no hay eventos
Cuando el usuario inicia sesión y no tiene eventos, ve pantalla en blanco. Debe ver un CTA claro.

**Archivo:** `apps/appEventos/pages/index.tsx`

---

### P3 — Medio plazo

#### 3.1 E2E — tests de acción real con datos de prueba fijos ✅ INFRAESTRUCTURA LISTA
- `e2e-app/fixtures.ts` — constantes de prueba (`TEST_GUEST`, `TEST_BUDGET_ITEM`, sufijos por fecha)
- `e2e-app/helpers.ts` — `loginAndSelectEvent()` + `gotoModule()` garantizan evento activo antes de navegar
- `acciones-crud.spec.ts` — `loginApp()` refactorizado para llamar `loginAndSelectEvent`
- TODO: crear un evento de prueba fijo conocido en la cuenta y añadir su ID a `KNOWN_EVENT_IDS`

#### 3.2 E2E — filter_view end-to-end ✅ IMPLEMENTADO
`e2e-app/filter-view.spec.ts` — 4 suites:
- Smoke: 6 páginas cargan sin crash (events, guests, budget_items, services, moments, tables)
- postMessage simulado: FILTER_VIEW → banner rosa; CLEAR_FILTER → limpia banner
- UI interaction: click en ✕ del banner activa clearCopilotFilter
- iframe smoke: chat-test accesible + asistente.tsx embeds iframe sin crash
Comando: `pnpm test:e2e:app:filter` | Auto: `E2E_AUTO_MODE=filter node scripts/e2e-auto.mjs`

#### 3.3 Multi-developer — vivetuboda + eventosorganizador en CI
Los tests de `multi-developer.spec.ts` hacen skip si el dominio no es accesible. Para CI completo:
- Añadir VPN step en GitHub Actions
- O usar staging domains accesibles sin VPN

#### 3.4 Performance — Web Vitals ✅ IMPLEMENTADO
`reportWebVitals` exportado desde `pages/_app.tsx`. Next.js lo invoca automáticamente con LCP, FID, INP, CLS, FCP, TTFB. En dev: log con emoji de estado (✅/⚠️/❌) según umbrales Core Web Vitals. Producción: bloque comentado listo para `navigator.sendBeacon`.

#### 3.5 Optimización O(n²) en tasksReduce ✅ IMPLEMENTADO
`Map<number|null, Task[]>` en lugar de `reduce+findIndex`. Línea ~300 de `ItineraryPanel.tsx`.

---

## 📋 Cobertura E2E actual

```
e2e-app/
├── smoke.spec.ts              ✅ Rutas básicas sin crash
├── home.spec.ts               ✅ Home / lista eventos
├── login.spec.ts              ✅ Login flow
├── redirect-login.spec.ts     ✅ Redirects a login
├── rutas.spec.ts              ✅ 16 rutas con contenido
├── guest-y-logueado.spec.ts   ✅ Guest vs. autenticado
├── perfiles-visitante.spec.ts ✅ Visitor mode
├── visitor-limit.spec.ts      ✅ Límite mensajes visitante
├── modulos-organizador.spec.ts ✅ Módulos principales
├── presupuesto.spec.ts        ✅ Presupuesto CRUD
├── billing.spec.ts            ✅ Billing chat-ia
├── copilot-chat.spec.ts       ✅ Copilot iframe + filter_view
├── edge-cases.spec.ts         ✅ Casos límite
├── errores-api.spec.ts        ✅ Errores backend
├── menu-usuario.spec.ts       ✅ Menú usuario
├── portal-invitado.spec.ts    ✅ Portal invitado
├── registro-y-onboarding.spec.ts ✅ Registro
├── bandeja-mensajes.spec.ts   ✅ Bandeja / InboxSidebar
├── acciones-crud.spec.ts      ✅ CRUD acciones reales
├── multi-developer.spec.ts    ✅ Multi-whitelabel + IA reasoning
├── filter-view.spec.ts        ✅ filter_view postMessage + banner rosa
└── usuario-secundario-vivetuboda.spec.ts ✅ SSO usuario secundario
```

### Comandos rápidos

```bash
# Todo (con credenciales)
pnpm test:e2e:app:completo

# Solo bandeja / mensajes
pnpm test:e2e:app:bandeja

# Solo CRUD acciones
pnpm test:e2e:app:crud

# Solo multi-developer + IA reasoning
pnpm test:e2e:app:multi

# Solo IA reasoning
pnpm test:e2e:app:ia

# Smoke rápido
pnpm test:e2e:app:smoke
```

---

## 🏗️ Arquitectura de notificaciones (diseño propuesto)

```
Usuario edita tarea (ItineraryPanel.handleUpdate)
  ↓
[1] useNotification() → fetchApiBodas createNotifications
      → API guarda notificación en DB
      → Retorna total enviadas
      → Toast: "Notificación enviada" (si hay asignados)
  ↓
[2] window.parent.postMessage REFRESH_EVENTS
      → CopilotIframe.tsx recibe
      → refreshEventsGroup() en EventsGroupContext
      → Chat-ia re-fetches event data
  ↓
[PENDIENTE - P1] FCM push a dispositivo del asignado
      → API llama firebase-admin SDK
      → Notificación push en móvil del responsable
```

---

## 🧪 Credenciales de prueba

| Campo | Valor |
|---|---|
| App email | `bodasdehoy.com@gmail.com` |
| App password | `lorca2012M*.` |
| BASE_URL test | `https://app-test.bodasdehoy.com` |
| CHAT_URL test | `https://chat-test.bodasdehoy.com` |

Usar siempre `TEST_USER_EMAIL` + `TEST_USER_PASSWORD` como env vars (no hardcodear en specs).

---

## 🔑 Archivos clave de referencia

| Archivo | Para qué |
|---|---|
| `apps/appEventos/components/Itinerario/MicroComponente/ItineraryPanel.tsx` | CRUD tareas, loading, notificaciones |
| `apps/appEventos/hooks/useNotification.ts` | Hook de notificaciones push |
| `apps/appEventos/components/Utils/SkeletonPage.tsx` | Loading skeleton reutilizable |
| `apps/chat-ia/src/app/[variants]/(main)/messages/components/InboxSidebar.tsx` | Sidebar bandeja |
| `apps/chat-ia/src/app/[variants]/(main)/messages/components/TaskDetailWorkspace.tsx` | Workspace tarea |
| `apps/chat-ia/src/tools/filter-app-view/index.ts` | Tool filter_view (7 entidades) |
| `packages/shared/src/communication/PostMessageBridge.ts` | Bridge de mensajes cross-domain |
| `e2e-app/helpers.ts` | Helpers E2E (clearSession, waitForAppReady) |
