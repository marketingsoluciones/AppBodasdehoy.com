# Impacto COMPLETO de apiapp — análisis exhaustivo (2026-05-27)

> Sustituir apiapp = core del trabajo. Este doc reemplaza los análisis parciales previos.
> Fuente: cruce real front (Fetching.ts) ↔ api-mcp typeDefs (SSH read-only) ↔ mongo prueba1.

## Escala real (NO es "1 excepción")

| Métrica | Valor |
|---|---|
| Operaciones GraphQL del front a apiapp | **113 únicas** |
| Llamadas `fetchApiEventos` (call-sites) | **331** en **102 archivos** |
| Root fields que api-mcp YA tiene (exact name) | 62 |
| Faltan por exact name | 51 (de las cuales muchas existen RENOMBRADAS) |
| Imágenes/assets vía apiapp (`createURL`→`resolveApiBodasOrigin`) | 1 helper, usado ampliamente |
| Conexión eventos api-mcp (`MONGODB_DBEVENT_URI`) | 🔴 CAÍDA (DATABASE_CONNECTION_ERROR) |

Call-sites por dominio: Servicios 18 · Forms 17 · Mesas 9 · Invitaciones 8 · Invitados 6 · Itinerario 5.

## Dos bloqueos simultáneos

1. **🔴 Conexión** — incluso las 62 operaciones que existen en api-mcp fallan con `DATABASE_CONNECTION_ERROR` (conexión Mongoose a prueba1 caída en runtime prod). Datos intactos (2574 eventos). BACKEND debe reparar bootstrap. Pruebas Slack ts 1779770576.
2. **🟡 Cobertura de schema** — ~13 operaciones NO tienen equivalente en api-mcp (ni exact ni renombrado). BACKEND debe implementarlas.

## Categoría A — Existen por nombre exacto (62) → migrar solo routing + shape

actualizarInvitado, addTaskAttachments, addWeddingPlannerIngreso, auth, borraMenu, borraMesa, creaGrupo, creaMenu, createCheckoutSession, createComment, createElement, createEmailTemplate, createEvento, createGalerySvgs, createNotifications, createPsTemplate, createTask, createUser, createWhatsappInvitationTemplate, deleteComment, deleteElement, deleteEmailTemplate, deleteEvento, deleteGalerySvg, deleteTask, deleteTaskAttachment, deleteWeddingPlannerIngreso, deleteWhatsappInvitationTemplate, editElement, editMesa, editTask, getCheckoutItems, getCurrentUser, getEmailValid, getEventTicket, getMyDevelopment, getPGuestEvent, getUser, getUsers, getVariablesTemplatesInvitaciones, getWhatsappInvitationTemplates, sendComunications, setCheckoutItems, setPlanSpaceSelect, signOut, singleUpload, status*, testInvitacion, updateActivity, updateActivityLink, updateCustomer, updateEvento, updateUser, updateWhatsappInvitationTemplate, uploadBase64MediaToFacebook, uploadMediaToFacebook, whatsappCreateSession, whatsappDisconnectSession, whatsappGetSession, whatsappRegenerateQR, whatsappSendMessage

(*status legacy — ya migrado a getCurrentUser, no usar.)

## Categoría B — Existen RENOMBRADAS en api-mcp (migrar nombre + shape EventosResponse/paginación)

| Front (apiapp legacy) | Canónico api-mcp |
|---|---|
| `queryenEvento(variable:"usuario_id")` | `getEventosByUsuario(usuario_id, pagination)` |
| `queryenEvento(variable:"compartido_array")` | `getEventosCompartidos(pagination)` |
| `queryenEvento_id` (getListaRegalos) | `getEventoById(id)` |
| `createGuests` | `agregarInvitado` |
| `borraInvitados` | `removerInvitado` |
| `createTable` | `creaMesa` |
| `deleteTable` | `borraMesa` |
| `editTable` | `editMesa` |
| `nuevoGasto` | `agregarGastoPresupuesto` |
| `editGasto` | `actualizarGastoPresupuesto` |
| `borraGasto` | `eliminarGastoPresupuesto` |
| `nuevoCategoria` | `crearCategoriaPresupuesto` |
| `editCategoria` | `actualizarCategoriaPresupuesto` |
| `borraCategoria` | `eliminarCategoriaPresupuesto` |
| `createItinerario` | `crearItinerario` |
| `editItinerario` | `actualizarItinerario` |
| `deleteItinerario` | `eliminarItinerario` |
| `addCompartition` | `compartirEvento` / `compartirEventoConGrupo` |

### ✅ Categoría B VERIFICADA EN VIVO (2026-05-27, probe query+mutation a api-mcp prod)
TODAS confirmadas que EXISTEN: getEventosByUsuario, getEventosCompartidos, getEventoById,
agregarInvitado, removerInvitado, creaMesa, borraMesa, editMesa, agregarGastoPresupuesto,
actualizarGastoPresupuesto, eliminarGastoPresupuesto, crearCategoriaPresupuesto,
crearItinerario, actualizarItinerario, eliminarItinerario, compartirEvento.

## Categoría C — TRULY MISSING (BACKEND debe implementar en api-mcp)

### ✅ VERIFICADO EN VIVO (probe real, api-mcp responde "Cannot query field"):
nuevoPago, editPago, borraPago (pagos boda) · getAllBusinesses, getAllProducts (directorio) ·
generatePdf · getGeoInfo · getPlanSpaceSelect · getPsTemplate · getItinerario (¡lectura! el
write crearItinerario/actualizar/eliminar SÍ existe) · updateTasksOrder.

### Resto (inferido por keyword, pendiente verificar 1 a 1):

- **Pagos presupuesto**: `nuevoPago`, `editPago`, `borraPago`, `deletepayment` (wedding) — `[Pago]→NADA`
- **Directorio**: `getAllBusinesses`, `getAllProducts` — `[Business/Negocio]→NADA`
- **Stripe wedding**: `getInvoices`, `getCustomer` — (los Invoice de api-mcp son ERP/CRM, no wedding)
- **PDF**: `generatePdf`
- **Onboarding/geo**: `getPreregister`, `getGeoInfo`
- **Plan space / templates**: `getPlanSpaceSelect`, `getPsTemplate`, `getGalerySvgs`, `getEmailTemplate`, `getPreviewsEmailTemplates`, `getVariableEmailTemplate`
- **Itinerario lectura/dup**: `getItinerario`, `duplicateItinerario`
- **Presupuesto extra**: `editPresupuesto`, `duplicatePresupuesto`, `nuevoItemGasto`, `editItemGasto`, `borraItemsGastos`, `editEvento` (guardarListaRegalos)
- **Otros**: `updateTasksOrder`, `whatsappGetAllSessions`, `editVisibleColumns`, `editTotalStimatedGuests`, `createUserWithPassword`, `createWhatsappTemplate`, `getLinkInvitation`, `enviaInvitacion`, `updateCompartition`, `deleteCompartition`, `getEmailValid`

(⚠️ Algunos de C pueden tener equivalente renombrado no detectado por keyword — verificar 1 a 1 al migrar.)

## Imágenes / assets

`apps/appEventos/utils/UrlImage.ts` → `createURL(slug)` = `resolveApiBodasOrigin()` + slug.
`resolveApiBodasOrigin` = `resolveApiEventosOrigin` = `NEXT_PUBLIC_BASE_URL` (apiapp).
→ TODAS las imágenes de eventos se sirven desde apiapp. Necesita CDN/host destino definido por backend antes de cortar.

## Plan de sustitución (orden real)

1. **BACKEND**: (a) reparar conexión `MONGODB_DBEVENT_URI`; (b) implementar Categoría C; (c) definir host de imágenes.
2. **FRONT** (yo, post-backend): reescribir `queries` de Fetching.ts (A: routing; B: rename+shape; C: cuando existan), cambiar 331 `fetchApiEventos`→`fetchApiBodas`, adaptar `EventosResponse`/paginación, migrar `createURL` al host de imágenes. E2E como red.

## Estado var (front ya estandarizado a 4 vars)

`NEXT_PUBLIC_BASE_URL`→apiapp es la ÚNICA var fuera del estándar, pendiente de (1) arriba. El resto (api-mcp + api-ia) ya consolidado (commits 87766b24, f281d3f1).
