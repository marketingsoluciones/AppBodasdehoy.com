# [API-MCP] Categoría C — implementar 13+ ops faltantes para apagar apiapp

> **Solicitado por**: COORD-AppEventos · **Fecha**: 2026-06-04
> **Bloquea**: apagar el droplet `apiapp.bodasdehoy.com` (último backend legacy)
> **Impacto esperado**: eliminar `NEXT_PUBLIC_BASE_URL` apiapp del front, una sola
> URL backend canónica, menos coste de infra, menos superficie a mantener.

---

## Contexto

El sprint 1+2+3 (cerrado 2026-05-17) migró 8/8 dominios del front a api-mcp canonical.
Quedan ~13 operaciones que apiapp tenía y api-mcp NO. Mientras no existan en api-mcp,
el front sigue cayendo a apiapp para esos endpoints (vía adapter `MCP_ADAPTERS`
en `Fetching.ts:179` con fallback automático).

Verificado live (probe directo a api-mcp respondió `Cannot query field`):

```
Pagos boda:        nuevoPago · editPago · borraPago · deletepayment
Directorio:        getAllBusinesses · getAllProducts
PDF/utilidades:    generatePdf · getGeoInfo
Plan space:        getPlanSpaceSelect · getPsTemplate
Itinerario:        getItinerario (lectura) · duplicateItinerario
Tareas:            updateTasksOrder
```

---

## Lista detallada por dominio

### 🔴 Pagos boda (4 ops)

Mutations para gestionar pagos individuales DENTRO de una boda (no confundir
con Stripe billing del SaaS).

| Op | Shape esperado (apiapp legacy) |
|---|---|
| `nuevoPago(evento_id, gasto_id, pago)` | `{ success, errors, evento{ _id, presupuesto_objeto } }` |
| `editPago(evento_id, gasto_id, pago_id, datos)` | `EventoResponse` |
| `borraPago(evento_id, gasto_id, pago_id)` | `EventoResponse` |
| `deletepayment(...)` | alias legacy, posiblemente fundible con `borraPago` |

**Cliente:** `apps/appEventos/components/Presupuesto/BlockPagos/TablaDatosPagos.tsx`,
`apps/appEventos/components/Presupuesto/SubComponentePagos.tsx`, `FormAddPago.tsx`,
`FormEditarPago.tsx`.

---

### 🔴 Directorio (2 ops)

Listados públicos del directorio de negocios/productos (bodas → fotógrafos,
catering, etc.).

| Op | Shape esperado |
|---|---|
| `getAllBusinesses(filter, pag, dev)` | `{ total, results: Business[] }` |
| `getAllProducts(grupo?, pag?, dev?)` | `{ total, results: Product[], currency }` |

**Notas:**
- `getAllProducts(grupo:"app")` lo usa `facturacion.tsx` para PLANES SaaS. Esa
  llamada YA SE PUEDE eliminar — la página ahora usa `getSubscriptionPlans`
  canonical via `usePlanLimits`. La llamada residual es dead code.
- `getAllProducts` SIN grupo se usa para tickets/productos de boda
  (`VentasEntradas.tsx`, `EntradasGratis.tsx`). Esa SÍ se necesita.
- `getAllBusinesses` lo usa `BlockLugarEvento.tsx`.

---

### 🔴 PDF / utilidades (2 ops)

| Op | Uso | Shape esperado |
|---|---|---|
| `generatePdf(template, data)` | exportar invitaciones/itinerario a PDF | `{ url: string }` o stream binario |
| `getGeoInfo()` | detectar país del visitante (Currencies, idioma default) | `{ ip, ipcountry, city?, region? }` |

**Cliente:** Invitaciones export, AuthContext (geo detection en login).

---

### 🔴 Plan space / templates (2 ops)

| Op | Uso |
|---|---|
| `getPlanSpaceSelect()` | dropdown selección de plan space al crear evento |
| `getPsTemplate(id)` | template de plan space (estructura de mesas predefinida) |

**Cliente:** componente creación rápida evento (mesas template).

---

### 🔴 Itinerario lectura (2 ops)

| Op | Uso |
|---|---|
| `getItinerario(eventId)` | **lectura** de itinerario (el write `crearItinerario/actualizar/eliminar` SÍ existe en api-mcp) |
| `duplicateItinerario(eventoId, itinerarioId, datos)` | duplicar itinerario a otra fecha/evento |

**Cliente:** `pages/itinerarios.tsx`, `components/Itinerario/`.

---

### 🔴 Tareas (1 op)

| Op | Uso |
|---|---|
| `updateTasksOrder(eventId, itinerarioId, taskIds[])` | reordenar tareas drag & drop |

**Cliente:** `components/Servicios/VistaKanban/` y itinerario.

---

## 🟡 PENDIENTE VERIFICAR 1 a 1

Inferidas por keyword, no probadas live. Pueden ya existir con otro nombre.

### Stripe wedding (2)

| Op | Pregunta para backend |
|---|---|
| `getInvoices()` | api-mcp tiene `getInvoice(invoiceId)` en `billing.ts` para Stripe ERP/CRM. ¿Es intercambiable para el historial de boda o son dominios separados? |
| `getCustomer()` | api-mcp tiene `getMySubscription`. ¿Cubre los campos `name, line1, postalCode, city, country` que pide `InformacionFacturacion.tsx`? |

### Emails / templates (4)

| Op | Uso |
|---|---|
| `getEmailTemplate(id)` | template individual de email para invitaciones |
| `getPreviewsEmailTemplates()` | listado de previews disponibles |
| `getVariableEmailTemplate()` | variables disponibles para mail merge |
| `getGalerySvgs()` | galería de SVGs decorativos para invitaciones |

### WhatsApp (2)

| Op | Uso |
|---|---|
| `whatsappGetAllSessions()` | listado sesiones WhatsApp activas por tenant |
| `createWhatsappTemplate(...)` | crear template aprobado por Meta |

⚠️ Nota: `/api/whatsapp/messages/template` ya existe en api-mcp y usa
`?development=` query param (NO header). Ver memoria proyecto.

### Compartir evento (4)

| Op | Uso |
|---|---|
| `updateCompartition(eventId, userId, permisos)` | actualizar permisos compartidos |
| `deleteCompartition(eventId, userId)` | revocar acceso |
| `getLinkInvitation(eventId)` | generar enlace de invitación |
| `enviaInvitacion(eventId, emails[])` | enviar invitaciones por email |

api-mcp ya tiene `addCompartition` (verificado vía smoke). Las 4 anteriores faltan.

### Otros (8)

| Op | Uso |
|---|---|
| `getEmailValid(email)` | validar formato + existencia de email pre-registro |
| `getPreregister(uid)` | datos de pre-registro guardados antes de login |
| `editPresupuesto(...)`, `duplicatePresupuesto(...)`, `nuevoItemGasto(...)`, `editItemGasto(...)`, `borraItemsGastos(...)` | mutations presupuesto extra (verificar cuáles ya existen renombradas) |
| `editEvento(guardarListaRegalos)` | sub-mutation de evento para wishlist |
| `createUserWithPassword(...)` | signup legacy con email/password (¿migrar a Firebase Auth puro o seguir?) |

---

## Categoría C asume P0 conexión eventos resuelto

Para que las mutations `nuevoPago`/`editPago`/etc funcionen confiables,
necesitamos primero cerrar el **P0 conexión eventos intermitente**
(documento `03-API-MCP-P0-conexion-eventos.md`). Sin esa conexión estable,
cualquier op nueva que dependa de la colección `eventos` heredará el flapping.

---

## Plan de integración

Por cada operación lista en api-mcp:

1. api-mcp confirma op disponible + shape exacto.
2. COORD-FRONT añade query a `apps/appEventos/utils/Fetching.ts` (sección `queries`).
3. Si era apiapp legacy: añade entrada al `MCP_ADAPTERS` en `Fetching.ts:179`
   para que `fetchApiEventos` enrute al canonical automáticamente. Mantiene
   compat con call-sites existentes.
4. Smoke local + commit + push.
5. Cuando TODAS las Cat C estén migradas: eliminar `NEXT_PUBLIC_BASE_URL` apiapp
   del `.env*` y los call-sites del fallback apiapp. Apagar droplet.

**Iteración bloque a bloque.**

---

## Pregunta a api-mcp

- ¿Plan + fecha para los **6 Cat C verificados ALTA** (pagos boda + directorio +
  generatePdf + getGeoInfo + getPlanSpaceSelect + getPsTemplate)?
- ¿Lista renombramientos? Necesitamos saber qué ops ya existen con otro nombre
  para no duplicar implementación.
- ¿Stripe wedding vs ERP/CRM: dominios separados o consolidables?
- ¿Algún Cat C ya está en plan/sprint y no lo sabemos?

DRI: api-mcp → confirmar plan en hilo Slack `1779046688.849779`.
