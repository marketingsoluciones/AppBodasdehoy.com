# Coordinacion Frontend → Backend — 30 abril 2026

Canal: #bodasdehoy-backend-coordinacion
Remitente: Frontend Bodasdehoy (appEventos)

---

## 1. createNotifications — Schema OK, resolver no persiste

**Estado actual:** La mutation acepta la firma legacy (ya no 400), pero devuelve `{total: 0, results: []}` sin escribir en MongoDB.

**Causa raiz (verificada por Frontend via SSH solo lectura):**
- HEAD en produccion: `ab84a61` (feat: createBatchCRMContacts)
- Commit `11c0274` (fix notifications): NO existe en el servidor
- `grep inputNotifications src/ dist/` = vacio
- El commit se creo pero nunca se deployo a `/var/www/api-production`

**Impacto:** Peor que el 400 anterior — ahora el fallo es silencioso. El usuario cree que la notificacion se envio (200 OK, sin error), pero el destinatario nunca la recibe.

**Accion requerida:**
1. Deployar commit `11c0274` al servidor de produccion
2. `pm2 restart api-production`
3. Verificar que el resolver persiste en MongoDB
4. Verificar que emite socket `notification` a los UIDs destinatarios
5. Avisarnos para reprobar

**Test de verificacion:**
```bash
curl -X POST 'https://api3-mcp-graphql.eventosorganizador.com/graphql' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token-firebase>' \
  -H 'Development: bodasdehoy' \
  -d '{"query":"mutation ($args:inputNotifications){ createNotifications(args:$args){ total results{ _id } } }","variables":{"args":{"type":"user","message":"smoke test","uids":["OMkxtxExEgZHvVJVW249uZHq5eR2"],"fromUid":"upSETrmXc7ZnsIhrjDjbHd7u2up1","focused":"/test"}}}'
```
Esperado: `total: 1`, `results: [{_id: "..."}]`

---

## 2. Mapeo de mutations legacy → api3-mcp

Hemos identificado que el schema nuevo tiene mutations equivalentes a las legacy. Necesitamos confirmacion antes de migrar nuestro codigo.

### Con equivalente directo (confirmar que son correctas)

| Legacy (appEventos usa hoy) | Nuevo propuesto (api3-mcp) | Confirmar? |
|---|---|---|
| `addCompartitions(args:inputCompartition)` | `compartirEvento(evento_id: ID!, usuario_id: String!, permisos: [String!]!)` | ? |
| `deleteCompartitions(args:inputCompartition)` | `revocarAccesoEvento(evento_id: ID!, usuario_id: String!)` | ? |
| `updateCompartitions(args:inputCompartition)` | `updateCRMEntityPermission(input: CRM_UpdatePermissionInput!)` | ? |
| `updateActivity(args:inputActivity)` | `updateActivity(activityId: ID!, eventId: ID!, input: ActivityUpdateInput!, development: String!)` | ? |

### Sin equivalente encontrado (necesitamos orientacion)

| Legacy | Donde se usa en appEventos | Pregunta |
|---|---|---|
| `updateCustomer(args:inputCustomer)` | `components/Facturacion/InformacionFacturacion.tsx` | Existe mutation equivalente para datos de cliente/facturacion? |
| `updateActivityLink(args:inputActivityLink)` | `hooks/useActivity.ts`, `context/AuthContext.tsx`, `FormRegister.tsx` | Existe o se depreco? Se puede usar `updateCRMActivity` con `entity_id`? |
| `getEventTicket(args:inputEventTicket)` | `context/AuthContext.tsx` | Existe query equivalente para tickets/entradas? |
| `createComment` con `attachments:[inputFileData]` | `components/Servicios/Utils/InputComments.tsx` | createComment acepta attachments en el schema nuevo? O hay que usar `saveFileMetadata` aparte? |
| `addTaskAttachments(attachment:inputFileData)` | `components/Servicios/VistaTabla/NewAttachmentsEditor.tsx` | Usar `saveFileMetadata` de storage.ts? |

### Duda de mapeo de permisos

El sistema legacy usa permisos granulares por modulo:
```json
{"permissions": [
  {"title": "servicios", "value": "edit"},
  {"title": "presupuesto", "value": "view"},
  {"title": "invitados", "value": "none"}
]}
```

El schema nuevo usa nivel unico: `CRM_PermissionLevel: READ | WRITE | ADMIN`

**Pregunta:** Como mapeamos permisos granulares (por modulo) a nivel unico? El frontend tiene UI especifica para dar acceso modulo por modulo.

---

## 3. Queries ya migradas (no requieren accion)

Estas queries legacy estan en `Fetching.ts` pero **nadie las importa** — son codigo muerto:
- `queries.getNotifications` → ya migrado a `getNotifications(filters, pagination)` en `/api/notifications`
- `queries.updateNotifications` → ya migrado a `markNotificationAsRead(notificationId)` en `/api/notifications`

---

## 4. Logout silencioso al comentar — causa probable identificada

**Sintoma:** Al enviar comentario en `/servicios`, la sesion queda "sin datos" (state vacio, sin evento cargado). No redirige a `/login`. Otras sesiones en otros navegadores no se afectan.

**Causa probable (investigada en frontend):**

La cadena post-comentario en `InputComments.tsx` es:
1. `fetchApiEventos(createComment)` → 200 OK → `setEvent(newEvent)` actualiza estado React
2. `notification()` → `fetchApiBodas(createNotifications)` → llega al proxy → backend

En `api.js` linea 200, si `fetchApiBodas` recibe 401/403, dispara `handleSessionExpired()` que borra cookies y redirige a login. El 400 del stub se atrapa en linea 204 (devuelve response sin logout) — **pero si el token Firebase expiro entre el paso 1 y 2, el backend devuelve 401** → logout.

**Secuencia del bug:**
1. createComment OK (token aun valido)
2. setEvent actualiza estado (evento nuevo en memoria)
3. createNotifications falla con 401 (token expiro en ese instante)
4. handleSessionExpired() borra cookies
5. Pagina queda en /servicios pero sin sesion → state vacio

**Esto explica por que:**
- No siempre ocurre (depende del timing de expiracion del token)
- Otras pestanas no se afectan (solo la que hizo la request con token expirado)
- No redirige a /login inmediatamente (handleSessionExpired tiene guardas para SSO)

**Fix propuesto (frontend):** En `useNotification.ts`, atrapar 401/403 de createNotifications sin disparar logout — las notificaciones no son criticas como para cerrar sesion. Alternativa: renovar token antes de la llamada.

**Del backend seguimos necesitando:**
- Confirmar si `createComment` emite socket `app:message{action:"setEvent", value:event._id}` a la sala del evento

---

## 5. email-config 401 — no es nuestro dominio pero anotado

Leimos el reporte de api-ia sobre `/api/internal/whitelabel/bodasdehoy/email-config` devolviendo 401. No nos afecta directamente. Lo anotamos por si necesitan coordinar.

---

## 6. Prioridades desde Frontend

1. **CRITICO:** Deploy de `11c0274` (createNotifications persista)
2. **ALTO:** Confirmacion del mapeo de compartir eventos (punto 2)
3. **MEDIO:** Orientacion sobre las 5 mutations sin equivalente
4. **BAJO:** Investigacion logout silencioso (punto 4)

---

## 7. Lo que Frontend ya tiene listo

- Socket `notification` listener → commit `1984aa1a`
- Campana con 4 vistas + polling fallback 5min
- Proxy `/api/notifications` ya usa firma nueva (filters + pagination)
- `markNotificationAsRead` ya migrado
- Scripts Slack corregidos — toda coordinacion va por #bodasdehoy-backend-coordinacion

**Cuando el backend confirme deploy + mapeo, migramos las mutations de compartir en la misma sesion.**
