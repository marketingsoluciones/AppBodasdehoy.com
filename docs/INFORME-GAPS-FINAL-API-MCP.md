# 🎯 Informe FINAL — Gaps detectados entre cliente AppEventos y api-mcp

> **Fecha**: 2026-05-15
> **Autor**: COORD-AppBodas (Claude) sobre SSH a `api3-mcp-graphql.eventosorganizador.com` (server PROD api-mcp en `178.104.209.139`)
> **Fuente**: análisis propio del equipo api-mcp (29-30 abril 2026) + cruce con `apps/appEventos/utils/Fetching.ts`

---

## 0. Lo que DESCUBRÍ que el equipo ya tenía hecho

En `/var/www/api-production/` del server de api-mcp existen 30+ documentos de análisis hechos por el propio equipo:

- `APIAPP_SCHEMA_MUTATIONS.json` — schema completo de apiapp.bodasdehoy.com via introspection (93 mutations)
- `AUDITORIA_FUNCIONALIDAD_APIAPP_VS_API3.md` (29 abr) — comparación funcional completa
- `ANALISIS_OPERACIONES_FALTANTES.md` (30 abr) — lo que el frontend pide vs lo que existe
- `ANALISIS_INPUT_TYPES_FALTANTES.md`
- `COMPARACION_APIAPP_VS_API3.md`
- `FRONTEND_MUTATIONS_REFERENCE.md`
- `HANDOFF_FRONTEND.md`

**Implicación**: el equipo NO necesita SSH al backend viejo apiapp para investigar. Ya tienen el schema dumpeado y analizado. **El bottleneck es EJECUTAR, no investigar.**

---

## 1. Resumen ejecutivo del cruce

```
Mutations en apiapp.bodasdehoy.com:  93
Ops únicas que envía el cliente:     98
Cliente usa Y existen en apiapp:     61
   YA implementadas en api-mcp:      55
   FALTANTES en api-mcp:             6   ← acción concreta
```

**Coverage actual: 55/61 = 90.2% de lo que el cliente usa contra apiapp YA está en api-mcp.**

---

## 2. Los 6 endpoints faltantes (impacto del cliente AppEventos)

### `mutation createWhatsappInvitationTemplate(evento_id: ID, data: JSON)`

| name | type | required |
|---|---|---|
| `evento_id` | `ID` | no |
| `data` | `JSON` | no |

**Pantalla**: Invitaciones → editor WhatsApp templates (crear).

---

### `mutation updateWhatsappInvitationTemplate(evento_id: ID, template_id: ID, data: JSON)`

| name | type | required |
|---|---|---|
| `evento_id` | `ID` | no |
| `template_id` | `ID` | no |
| `data` | `JSON` | no |

**Pantalla**: Invitaciones → editor WhatsApp templates (editar).

---

### `mutation deleteWhatsappInvitationTemplate(evento_id: ID, template_id: ID)`

| name | type | required |
|---|---|---|
| `evento_id` | `ID` | no |
| `template_id` | `ID` | no |

**Pantalla**: Invitaciones → eliminar template WhatsApp.

---

### `mutation deleteGalerySvg(evento_id: ID, icon_id: ID)`

| name | type | required |
|---|---|---|
| `evento_id` | `ID` | no |
| `icon_id` | `ID` | no |

**Pantalla**: Mesas → galería de SVG (eliminar icono).

---

### `mutation uploadBase64MediaToFacebook(base64Image: String!, fileName: String!, development: String)`

| name | type | required |
|---|---|---|
| `base64Image` | `String!` | **SÍ** |
| `fileName` | `String!` | **SÍ** |
| `development` | `String` | no |

**Pantalla**: Invitaciones WhatsApp Business → upload imagen base64 a Facebook (token Meta).

---

### `mutation uploadMediaToFacebook(fileName: String!, fileBuffer: String!, fileType: String!, development: String)`

| name | type | required |
|---|---|---|
| `fileName` | `String!` | **SÍ** |
| `fileBuffer` | `String!` | **SÍ** |
| `fileType` | `String!` | **SÍ** |
| `development` | `String` | no |

**Pantalla**: Invitaciones WhatsApp Business → upload media buffer a Facebook.

---

## 3. Categorización por dominio funcional

| Dominio | Faltantes | Impacto | Prioridad |
|---|---|---|---|
| **WhatsApp Templates** | 3 (`createWhatsappInvitationTemplate`, `updateWhatsappInvitationTemplate`, `deleteWhatsappInvitationTemplate`) | Sin estos, no se gestionan plantillas WhatsApp del evento | **P1** |
| **Facebook Media Upload** | 2 (`uploadMediaToFacebook`, `uploadBase64MediaToFacebook`) | Sin estos, no se suben imágenes a WhatsApp Business via Meta API | **P1** |
| **Mesas / SVG** | 1 (`deleteGalerySvg`) | Sin esto, no se eliminan iconos personalizados del lienzo | **P2** |

---

## 4. Lo que SÍ está implementado (55 ops)

El cliente actualmente apunta a `apiapp.bodasdehoy.com` o `api.bodasdehoy.com` para llamar todas estas ops. La auditoría de api-mcp del 29 de abril confirma 95% de funcionalidad crítica implementada con aliases. Sample (de la lista completa):

**Eventos** (todos con alias):
- `crearEvento` → `createEvento` ✅
- `editEvento` → `updateEvento` ✅
- `borrarEvento` → `deleteEvento` ✅

**Invitados**:
- `creaInvitado` → `agregarInvitado` ✅
- `editInvitado` → `actualizarInvitado` ✅
- `borraInvitado` → `removerInvitado` ✅
- `borraInvitados` (bulk delete) — verificar si está en última versión

**Mesas** (6/6):
- `createTable`, `editTable`, `deleteTable` → alias de `creaMesa/editMesa/borraMesa` ✅
- `createElement`, `editElement`, `deleteElement` ✅

**Presupuesto/Plan Espacios**:
- `createPsTemplate`, `deletePsTemplate` ✅
- `duplicatePresupuesto`, `editPresupuesto` ✅
- `nuevoGasto/editGasto/borraGasto` ✅
- `nuevoCategoria/editCategoria/borraCategoria` ✅
- `nuevoItemGasto/editItemGasto/borraItemsGastos` ✅
- `nuevoPago/editPago/borraPago` ✅

**Itinerario/Tareas**:
- `createItinerario`, `editItinerario`, `duplicateItinerario`, `deleteItinerario` ✅
- `createTask`, `editTask`, `deleteTask` ✅
- `createComment`, `deleteComment` ✅
- `addTaskAttachments`, `deleteTaskAttachment` ✅

**Compartir evento**:
- `addCompartition`, `updateCompartition`, `deleteCompartition` ✅

**Email Templates**:
- `createEmailTemplate`, `updateEmailTemplate`, `deleteEmailTemplate` ✅

**Otros**:
- `editVisibleColumns`, `editTotalStimatedGuests`, `editCurrency` ✅
- `testInvitacion`, `enviaInvitacion`, `sendComunications` ✅
- `singleUpload`, `singleUploadAnyFile` ✅
- `setPlanSpaceSelect`, `createGalerySvgs` ✅
- `addWeddingPlannerIngreso`, `deleteWeddingPlannerIngreso` ✅

---

## 5. Plan de acción propuesto a api-mcp

### Tiempo estimado total: **~2 horas**

```
PASO 1 (30 min) — Implementar los 3 endpoints de WhatsApp Templates
  - createWhatsappInvitationTemplate
  - updateWhatsappInvitationTemplate
  - deleteWhatsappInvitationTemplate
  → Lógica: CRUD en colección Mongo de templates WhatsApp por evento
  → Schema: argumentos opcionales, data como JSON genérico

PASO 2 (60 min) — Implementar 2 endpoints Facebook Media
  - uploadMediaToFacebook
  - uploadBase64MediaToFacebook
  → Lógica: llamada a Meta Graph API /WHATSAPP_BUSINESS_ACCOUNT/media
  → Requiere: WHATSAPP_BUSINESS_ID + ACCESS_TOKEN por development
  → Schema apiapp incluye lógica de obtención de token desde whitelabel

PASO 3 (15 min) — deleteGalerySvg
  → CRUD simple: remover svg de array galerySvgs del evento

PASO 4 (15 min) — Smoke test desde cliente AppEventos
  → Verificar que las 6 ops responden 200
  → Confirmar shapes esperados
```

---

## 6. Verificación post-implementación

Una vez api-mcp tenga las 6 mutations, el cliente puede:

1. Cambiar `apiapp.bodasdehoy.com/graphql` → `api-mcp.eventosorganizador.com/graphql` en todos los callsites
2. Eliminar el resolver `resolveApiEventosOrigin` de `apps/appEventos/utils/apiEndpoints.ts`
3. Eliminar variables de entorno legacy: `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_BASE_API_BODAS`, etc.
4. Apagar el droplet `APP-GestionBodas` (apiapp.bodasdehoy.com) — coste DigitalOcean ahorrado.

---

## 7. Acceso a info para api-mcp

**Schema apiapp completo** ya disponible en su server:
```bash
cat /var/www/api-production/APIAPP_SCHEMA_MUTATIONS.json | jq .
```

**SSH al backend viejo api.bodasdehoy.com (para ver resolvers)**:
```bash
ssh investigate-bodas
cat /root/api-bodas/db/schemas/whatsapp.js   # resolver original WhatsApp
cat /root/api-bodas/db/schemas/uploap.js     # resolver original uploads
```

(Nota: estos resolvers viven en `api.bodasdehoy.com`, NO en `apiapp.bodasdehoy.com`. apiapp tiene OTROS resolvers para los mismos nombres — verificar al implementar.)

---

## 8. Backends que pueden desaparecer cuando api-mcp tenga los 6

| Backend | Estado actual | Cuándo apagar |
|---|---|---|
| `apiapp.bodasdehoy.com` (droplet APP-GestionBodas) | 61 mutations usadas por cliente | Cuando api-mcp implemente los 6 + cliente migre |
| `api.bodasdehoy.com` (droplet API-DIRECTORIO-BODAS-DE-HOY) | 13+ mutations (auth, Stripe, business, notifications, eventTicket) | Aparte — requiere informe separado de gaps |
| `api-ia.bodasdehoy.com` | Alias deprecated | Reemplazar por `api-ia.eventosorganizador.com` (canónico ya activo) |

---

**Conclusión: api-mcp está al 90% de cubrir lo que el cliente usa. Solo faltan 6 mutations específicas, todas implementables en 2 horas con la info que ya tienen.**
