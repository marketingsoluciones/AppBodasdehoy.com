# QA — Notificaciones y permisos (2 usuarios)

## Estado actual de entornos

- `app-dev` y `chat-dev` están devolviendo `502` (Cloudflare).
- `api2.eventosorganizador.com/graphql` responde `200`.
- `api-ia.bodasdehoy.com/health` responde `200`.

Recomendación: para validar funcionalidad ahora mismo, ejecutar pruebas en `app-test`/`chat-test` hasta que vuelva DEV.

## Objetivo de prueba

Verificar que, cuando un usuario A crea/edita una tarea y/o comenta, el usuario B recibe una notificación (in-app y/o push) y que los permisos limitan correctamente lo que B puede ver/editar.

## Notificaciones: de dónde salen

### Comentarios en tareas (Actividad)

- En `appEventos`, al publicar comentario en una tarea se dispara:
  - `createComment` (persistencia del comentario)
  - `createNotifications` (notificación a destinatarios)

Destinatarios (regla actual): owners + usuarios compartidos con permisos `servicios:view|edit` (excluyendo al autor).

### Asignación / cambios relevantes de tarea

- En `appEventos`, cuando se edita una tarea y cambia un campo notifiable (incl. `responsable`), se dispara `createNotifications` a los responsables (excluyendo al autor).

### Dónde se visualizan

- `appEventos` (campana): panel “Mis notificaciones” con tabs “Actual / Pendientes / Historial”.
- Push: requiere permiso del navegador + registro de token FCM.
- `chat-ia` (`/notifications`) consume el stream “CRM” de API2; puede no reflejar todas las notificaciones “legacy” según configuración de API2.

## Permisos: cómo funcionan ahora

### Fuente de verdad

- `appEventos` calcula `event.permissions` cuando el usuario actual está en `compartido_array`.
- Los permisos se consultan con `useAllowed` / `useAllowedRouter`:
  - `none`: no puede entrar al módulo
  - `view`: puede entrar, pero UI se deshabilita/oculta para edición
  - `edit`: puede editar

### Aplicación práctica

- Navegación puede bloquear módulos si el permiso es `none`.
- En tareas, wrappers deshabilitan inputs/acciones cuando `view`.

## Checklist de preparación (lo que necesitas tener listo)

### Usuarios

- Usuario A (owner/organizador): cuenta con acceso de edición.
- Usuario B (colaborador): debe estar compartido en el evento con `servicios:edit` para probar escritura y con `servicios:view` para probar restricción.

### Entorno

- Preferente: `app-test` + `chat-test`.
- Si se prueba en DEV, primero confirmar que `app-dev` y `chat-dev` no devuelven `502`.

### Push (opcional)

- En el navegador del usuario B, aceptar permisos de notificación.
- Mantener una pestaña abierta con `appEventos` para asegurar registro de token.

## Pruebas manuales (rápidas)

### 1) Notificación por comentario

1. Abrir dos sesiones separadas:
   - Sesión 1: Usuario A
   - Sesión 2: Usuario B (incógnito u otro navegador)
2. Usuario B: abrir campana y dejar el panel abierto (tab “Actual”).
3. Usuario A: ir a `Servicios` del evento, abrir una tarea y publicar un comentario en “Actividad”.
4. Usuario B:
   - Debe aparecer nueva notificación (o badge de no leído).
   - Si push está habilitado, debe llegar push.

### 2) Notificación por asignación

1. Usuario A: asignar la tarea a Usuario B (campo `responsable`).
2. Usuario B: verificar campana (y push si aplica).

### 3) Permisos

1. Cambiar permisos de Usuario B a `servicios:view`.
2. Usuario B:
   - Debe poder abrir la tarea.
   - No debe poder editar campos ni publicar comentario (o la UI debe impedirlo).

## Pruebas automáticas (Playwright)

- Login smoke (5 casos): `e2e-app/login-random-5.spec.ts`.
- Mensajería y 2 usuarios (chat-ia): `e2e-app/chat-mensajes-2usuarios.spec.ts`.

Notas:
- Si los tests contra DEV fallan con `Bad gateway 502`, no es un fallo funcional del producto: es indisponibilidad del entorno.

