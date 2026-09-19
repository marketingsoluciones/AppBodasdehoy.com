# Pendientes Backend — Estado 30 abril 2026 (ACTUALIZADO)

**Ultima actualizacion:** 30-abr, tras leer respuestas en #bodasdehoy-backend-coordinacion.

---

## 1. createNotifications — RESUELTO por api3-mcp

- **Commit:** `11c0274` (desplegado 29-abr 18:02 UTC)
- **Firma legacy restaurada:** `inputNotifications {type, message, uids, fromUid, focused}`
- **Response:** `{total, results[{_id}]}`
- **Estado:** Schema OK. Prueba curl devuelve `total:0` — pendiente validar E2E desde la app con usuario real.

---

## 2. 8 input types ausentes — Pendiente de definir scope

Verificado que estos input types/mutations NO existen en el schema actual de api3-mcp:

| Input type | Mutations/Queries afectadas | Funcion de negocio |
|-----------|---------------------------|-------------------|
| inputCompartition | addCompartitions, updateCompartitions, deleteCompartitions | Compartir eventos, permisos |
| inputCustomer | updateCustomer | Datos de cliente |
| inputNotification (singular) | getNotifications, updateNotifications | Vista legacy notificaciones |
| inputActivity | updateActivity | Tracking sesion |
| inputActivityLink | updateActivityLink | Tracking clicks |
| inputEventTicket | getEventTicket | Tickets/entradas |
| inputFileData | createComment con adjuntos, addTaskAttachments | Adjuntos |
| inputCongigTemplate | createEmailTemplate, updateEmailTemplate | Templates email |

**Pendiente:** Saber si estos estan planeados o si el frontend debe adaptarse a firmas nuevas.

**Nota:** `getNotifications` en el schema nuevo usa `filters: NotificationFilters` + `pagination: CRM_PaginationInput` en vez de `args: inputNotification`. Frontend debe migrar a la firma nueva.

---

## 3. VAPID key Firebase — Pendiente de Direccion

---

## 4. Stripe test key — Pendiente de Direccion

---

## 5. 351 notifs con displayName — Pendiente api2

---

## 6. email-config 401 — NUEVO (reportado por api-ia)

- `/api/internal/whitelabel/bodasdehoy/email-config` devuelve 401
- Campanas procesadas pero 0 emails entregados
- No es dominio de frontend, pero anotado

---

## 7. Deploy produccion Socket.IO — Coordinacion pendiente

---

## Resumen ejecutivo

| # | Item | Responsable | Estado |
|---|------|-------------|--------|
| 1 | createNotifications | api3-mcp | RESUELTO |
| 2 | 8 input types | api3-mcp / Frontend | Pendiente definir scope |
| 3 | VAPID key | Direccion | Pendiente |
| 4 | Stripe key | Direccion | Pendiente |
| 5 | 351 notifs displayName | api2 | Pendiente |
| 6 | email-config 401 | TBD | Nuevo |
| 7 | Deploy socket prod | Frontend + api-ia | Coordinacion |
