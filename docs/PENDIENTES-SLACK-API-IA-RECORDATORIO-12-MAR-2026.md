# Pendientes Slack [api-ia] – Recordatorio 12 mar 2026

Resumen de las **4 peticiones** del recordatorio de api-ia y estado en nuestro lado.

---

## 1) Headers X-User-ID y X-User-Role en chat/auto

**Petición:** Cuando el usuario esté identificado, enviar en cada petición los headers **X-User-ID** y **X-User-Role** (rol: `super_admin`, `admin`, `organizer`, `collaborator`, `invited`, `guest`).

**Estado nuestro:**
- **X-User-ID:** ✅ Ya se enviaba en las peticiones de chat (servicio de chat + proxy).
- **X-User-Role:** ✅ **Implementado.** En `apps/chat-ia/src/services/chat/index.ts` se lee `userRole` del store y se envía como header **X-User-Role** en cada request a `/webapi/chat/{provider}`. El proxy reenvía los headers a api-ia.

**Nota:** El rol debe estar poblado en el store (`userRole`) desde login/EventosAutoAuth; valores esperados por api-ia: `super_admin`, `admin`, `organizer`, `collaborator`, `invited`, `guest`.

---

## 2) Respuestas 402/503: usar en la UI `detail` y `screen_type`

**Petición:** En respuestas 402/503 de api-ia, usar en la UI el campo **detail** (y **screen_type** si aplica) que devuelven.

**Estado nuestro:**
- **402:** ✅ El proxy ya parseaba `detail` del body de api-ia y lo usaba como mensaje. **Ampliado:** se reenvía también `screen_type` en el body de la respuesta al cliente. El cliente (`parseError`) usa `data.body?.message` como mensaje cuando viene informado. El modal de saldo insuficiente (`InsufficientBalanceModal`) muestra el mensaje de api-ia (`apiErrorDetail`) cuando existe.
- **503:** ✅ Añadido manejo explícito en el proxy: se parsea `detail` y `screen_type` del body de api-ia y se devuelve al cliente en el mismo formato (`errorType: 'ServiceUnavailable'`, `body: { message, type, screen_type }`). El store guarda `apiErrorDetail` y `apiErrorScreenType` para uso en UI (p. ej. mensaje de error en conversación).
- **Store:** Nuevos campos opcionales `apiErrorDetail` y `apiErrorScreenType` en el slice aiChat; se rellenan al recibir 402/503 y se limpian al cerrar el modal.

---

## 3) E2E – Batería 20/20

**Petición:** Batería suya 20/20 OK. Re-ejecutar cuando queramos; si falla, enviarles **request, response y trace_id**.

**Estado nuestro:** Nada que implementar. Cuando re-ejecutemos (p. ej. `node scripts/run-20-preguntas-api-ia.mjs --json`) y haya fallo, enviar a api-ia:
- Request (y body si aplica)
- Response (status + body)
- `trace_id` si lo devuelve api-ia

---

## 4) Endpoints captura de Leads (11 mar)

**Petición:** Para poder dar propuesta o implementar, necesitan la **spec** o enlace al doc (método, path, body, qué enviamos y qué esperamos de api-ia).

**Estado nuestro:** La spec está en el repo:

- **Ruta:** `docs/api-leads-spec.md`
- **Contenido:** Modelo de datos (MongoDB `leads`), endpoints:
  - `POST /api/leads/save` — upsert por `session_id` + `development`
  - `GET /api/leads/list` — lista paginada con filtros
  - `GET /api/leads/{lead_id}` — detalle
  - `PUT /api/leads/{lead_id}/notes` — agregar nota
  - `PUT /api/leads/{lead_id}/status` — cambiar status
  - `DELETE /api/leads/{lead_id}` — eliminar

**Respuesta sugerida para Slack:**  
«Para Leads, la spec está en nuestro repo en `docs/api-leads-spec.md`. Incluye método, path, body y comportamiento esperado de cada endpoint. Podemos compartir el contenido o el enlace al doc (p. ej. desde GitHub) cuando lo tengan disponible.»

---

## Resumen para responder en Slack

1. **Headers:** X-User-ID y X-User-Role enviados en chat/auto cuando el usuario está identificado (rol desde nuestro store).
2. **402/503:** Usamos en la UI el `detail` (y `screen_type` si aplica) que devolvéis; modal 402 y mensaje de error muestran ese texto.
3. **E2E:** Re-ejecutaremos cuando toque; en caso de fallo enviaremos request, response y trace_id.
4. **Leads:** Spec en `docs/api-leads-spec.md`; podemos compartir contenido o enlace cuando lo necesiten.
