# Migracion apiapp → api3-mcp — Mapeo completo verificado

**Fecha:** 30-abr-2026
**Estado:** Proxy unificado (todo va a api3-mcp). apiapp eliminado.

## Patron del renaming

```
Legacy                    → api3-mcp
eventID: String           → evento_id: ID!
itinerarioID: String      → itinerario_id: ID!
taskID: String            → tarea_id: ID!
commentID: String         → comment_id: ID! (probable)
String (nullable)         → ID! (required)
```

## Mapeo verificado de firmas

### Itinerario

| Legacy | api3-mcp | Firma nueva |
|--------|----------|-------------|
| createItinerario(eventID, title, dateTime, tipo) | crearItinerario | (evento_id:ID!, itinerario:ItinerarioInput!) |
| editItinerario(eventID, itinerarioID, ...) | actualizarItinerario | (evento_id:ID!, itinerario_id:ID!, updates:ItinerarioUpdateInput!) |
| deleteItinerario(eventID, itinerarioID) | eliminarItinerario | (evento_id:ID!, itinerario_id:ID!) |

### Tareas

| Legacy | api3-mcp | Firma nueva |
|--------|----------|-------------|
| createTask(eventID, itinerarioID, ...) | crearTarea | (evento_id:ID!, itinerario_id:ID!, tarea:TareaInput!) |
| editTask(eventID, itinerarioID, taskID, ...) | actualizarTarea | (evento_id:ID!, itinerario_id:ID!, tarea_id:ID!, updates:...) |
| deleteTask(eventID, itinerarioID, taskID) | eliminarTarea | (evento_id:ID!, itinerario_id:ID!, tarea_id:ID!) |
| completeTask(...) | completarTarea | (evento_id:ID!, itinerario_id:ID!, tarea_id:ID!) |

### Invitados

| Legacy | api3-mcp | Firma nueva |
|--------|----------|-------------|
| createGuests(eventID, invitados) | agregarInvitado | (evento_id:ID!, invitado:JSON!) |
| editGuests(eventID, invitadoID, ...) | actualizarInvitado | (evento_id:ID!, invitado_id:String!, datos:JSON!) |
| removeGuests(eventID, invitadoID) | removerInvitado | (evento_id:ID!, invitado_id:String!) |

### Eventos

| Legacy | api3-mcp | Firma nueva |
|--------|----------|-------------|
| eventCreate(...) | createEvento | (input:EventoInput!) |
| eventUpdate(eventID, ...) | updateEvento | (id:ID!, input:EventoUpdateInput!) |
| eventDelete(eventID) | deleteEvento | (id:ID!) |

### Presupuesto

| Legacy | api3-mcp | Firma nueva |
|--------|----------|-------------|
| nuevoCategoria(eventID, ...) | crearCategoriaPresupuesto | (evento_id:ID!, categoria:CategoriaPresupuestoInput!) |
| editCategoria(eventID, catID, ...) | actualizarCategoriaPresupuesto | (evento_id:ID!, categoria_id:ID!, updates:CategoriaPresupuestoUpdateInput!) |
| borraCategoria(eventID, catID) | eliminarCategoriaPresupuesto | (evento_id:ID!, categoria_id:ID!) |
| nuevoGasto(eventID, catID, ...) | agregarGastoPresupuesto | (evento_id:ID!, categoria_id:ID!, gasto:GastoPresupuestoInput!) |
| editGasto(eventID, catID, gastoID, ...) | actualizarGastoPresupuesto | (evento_id:ID!, categoria_id:ID!, gasto_id:ID!, updates:...) |
| borrarGasto(eventID, catID, gastoID) | eliminarGastoPresupuesto | (evento_id:ID!, categoria_id:ID!, gasto_id:ID!) |

### Comentarios y adjuntos

| Legacy | api3-mcp | Firma nueva |
|--------|----------|-------------|
| createComment(eventID, itinerarioID, taskID, comment, attachments) | createComment | (task_id:ID!, development:String!, comment:TaskCommentInput!) |
| addTaskAttachments(eventID, ..., attachment:inputFileData) | addTaskAttachments | (task_id:ID!, development:String!, adjuntos:[TaskAttachmentInput!]!) |

Input types nuevos:
- TaskCommentInput = { mensaje: String! }
- TaskAttachmentInput = { nombre: String!, url: String! }

### Compartir

| Legacy | api3-mcp | Firma nueva |
|--------|----------|-------------|
| addCompartition(args:{eventID,destination_email,permissions}) | addCompartition | (args:{evento_id:ID!, usuario_id:String!, permisos:[String!]!}) |
| updateCompartition(args:{eventID,...}) | updateCompartition | (args:{evento_id:ID!, usuario_id:String!, permisos:[String!]!}) |
| deleteCompartition(args:{eventID,...}) | deleteCompartition | (args:{evento_id:ID!, usuario_id:String!}) |

### Pendientes de descubrir firma

- editPresupuesto → recalcularPresupuesto?
- createElement, editElement, deleteElement → ???
- createTable, editTable, deleteTable → ???
- createGroup → ???
- createMenu, deleteMenu → ???
- createPsTemplate → ???
- createGalerySvgs → ???
- sendComunications → ???
- setPlanSpaceSelect → ???
- editTotalStimatedGuests → ???
- editVisibleColumns → ???
- createWhatsappInvitationTemplate → ???
- guardarListaRegalos → editEvento (ya existente)
- duplicateItinerario, duplicatePresupuesto → ???
- nuevoItemGasto, editItemGasto, borrarItemsGastos → ???
- nuevoPago, editPago → ???

## Accion requerida del backend

Opcion A (rapida): Implementar aliases con nombres legacy que redirijan internamente.
Opcion B: Confirmar mapeo + documentar campos de los Input types nuevos.

## Proxy unificado

`/api/proxy/graphql` ahora usa `resolveApiBodasGraphqlUrl()` → api3-mcp.
apiapp.bodasdehoy.com eliminado de todo el codigo.
