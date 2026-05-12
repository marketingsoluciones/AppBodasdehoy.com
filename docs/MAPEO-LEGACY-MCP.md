# Mapeo GraphQL Legacy → api3-mcp (VERIFICADO 30-abr)

Todas las firmas verificadas con pruebas reales contra api3-mcp-graphql.eventosorganizador.com.

## FUNCIONA SIN CAMBIOS

| Operacion | Firma | Estado |
|-----------|-------|--------|
| `createNotifications(args:inputNotifications)` | Legacy OK | total:1, persiste |
| `queryenEvento(variable, valor, development:String!)` | Legacy OK (development debe ser String!) | Funciona |
| `markNotificationAsRead(notificationId:ID!)` | Legacy OK | Funciona |
| `getUnreadNotificationsCount` | Legacy OK | Funciona |
| `getEventos(pagination:CRM_PaginationInput)` | Firma nueva, ya adoptada | Funciona |

## FIRMA CAMBIADA — Frontend debe migrar

### createComment
```
LEGACY (no funciona):
  createComment(eventID:String, itinerarioID:String, taskID:String, comment:String, attachments:[inputFileData])
  → ERR: Unknown argument "eventID"

NUEVO:
  createComment(task_id:ID!, development:String!, comment:TaskCommentInput!): TaskCommentResponse!

Campos TaskCommentInput: pendiente descubrir (probar con campo inventado)
Response: TaskCommentResponse (tiene success, no _id)
```
**Archivos a migrar:** InputComments.tsx, InputCommentsOld.tsx, Fetching.ts

### addCompartition
```
LEGACY (no funciona):
  addCompartition(args:{eventID, destination_email, permissions:[{title,value}]})
  → ERR: eventID/destination_email/permissions not defined

NUEVO:
  addCompartition(args:{evento_id:ID!, usuario_id:String!, permisos:[String!]!}): EventoResponse!
```
**Archivos a migrar:** AddUserToEvent.tsx, Fetching.ts

### updateCompartition
```
LEGACY (no funciona):
  updateCompartition(args:{eventID, destination_email, permissions})

NUEVO:
  updateCompartition(args:{evento_id:ID!, usuario_id:String!, permisos:[String!]!}): EventoResponse!
```
**Archivos a migrar:** ModalPermissionList.tsx, Fetching.ts

### deleteCompartition
```
LEGACY: funciona con firma nueva
NUEVO:
  deleteCompartition(args:{evento_id:ID!, usuario_id:String!}): EventoResponse!
```
**Archivos a migrar:** ListUserToEvent.js, Fetching.ts

### addTaskAttachments
```
LEGACY (no funciona):
  addTaskAttachments(eventID, itinerarioID, taskID, attachment:inputFileData)
  → ERR: Unknown argument "eventID"

NUEVO:
  addTaskAttachments(task_id:ID!, development:String!, adjuntos:[TaskAttachmentInput!]!): TaskResponse!
```
**Archivos a migrar:** NewAttachmentsEditor.tsx, Fetching.ts

### updateActivityLink
```
LEGACY (no funciona):
  updateActivityLink(args:inputActivityLink) → retorna EventoResponse! (necesita subfields)

NUEVO:
  updateActivityLink(args:{evento_id:ID!, link:String, ...}): EventoResponse!
  Acepta evento_id + link (verificado: campo_inventado rechazado)
```
**Archivos a migrar:** useActivity.ts, AuthContext.tsx, FormRegister.tsx, Fetching.ts

### createEmailTemplate
```
LEGACY (no funciona):
  createEmailTemplate(evento_id:String, design:JSON, configTemplate:inputCongigTemplate, html:String)
  → ERR: Unknown argument "evento_id"

NUEVO:
  createEmailTemplate(configTemplate:inputCongigTemplate!, development:String!): JSON
  (ya no acepta evento_id, design, html como args directos)
```
**Archivos a migrar:** Fetching.ts, componentes de email template

## NO EXISTE EN SCHEMA

| Operacion | Usado en | Alternativa |
|-----------|----------|-------------|
| `updateCustomer(args:inputCustomer)` | InformacionFacturacion.tsx | No encontrada |
| `updateActivity(args:inputActivity)` | useActivity.ts | No encontrada |
| `getEventTicket(args:inputEventTicket)` | AuthContext.tsx | No encontrada |

## CODIGO MUERTO (nadie importa, ya migrado)

| Query legacy | En Fetching.ts | Migrado a |
|---|---|---|
| `getNotifications(args, skip, limit)` | Eliminada | /api/notifications (filters + pagination) |
| `updateNotifications(args)` | Eliminada | markNotificationAsRead |
