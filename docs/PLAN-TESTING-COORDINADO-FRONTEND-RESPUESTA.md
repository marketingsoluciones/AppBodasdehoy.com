# Plan de testing coordinado – Respuesta Frontend (17 feb 2026)

**Canal:** #copilot-api-ia  
**Documento api-ia:** PLAN_TESTING_COORDINADO_API2_MIDDLEWARE_FRONTEND.md (en repo api-ia).  
**Objetivo:** Revisar contrato de respuestas (200, 402, 503, 429, 401), completar nuestra parte (pruebas, orden, formato de reporte) y confirmar OK o cambios.

---

## 1. Revisión del contrato de respuestas (200, 402, 503, 429, 401)

### 1.1 Qué pedís que devolváis y qué hacemos nosotros

| Código | Significado (api-ia) | Qué pedís que hagamos | Estado en Frontend |
|--------|----------------------|------------------------|-------------------|
| **200** | OK | Mostrar respuesta. | ✅ Implementado. Proxy reenvía 200 y cuerpo; UI muestra contenido. |
| **402** | Saldo agotado (`saldo_agotado` + message; en el futuro payment_url, upgrade_url, plans) | Mostrar mensaje específico; **no confundir con 503**. | ❌ **No implementado.** Hoy cualquier `!backendResponse.ok` se trata como error y devolvemos 503 (o fallback). No hay rama para 402 ni lectura de `saldo_agotado` / `payment_url` / `upgrade_url`. |
| **503** | Proveedor/credenciales | Enviar pruebas reales (request + response + trace_id) por #copilot-api-ia para triaje. | ✅ Implementado. Devolvemos 503, mensaje, headers `X-Backend-Trace-Id` y `X-Backend-Error-Code`. En fallos ejecutamos scripts y enviamos a Slack con request/response/trace_id. |
| **429** | Rate limit | (Según contrato: no confundir con 503; posible retry.) | ✅ Parcial. En proxy normalizamos a `UPSTREAM_RATE_LIMIT` y devolvemos 503 con header. En `api-client-optimized` (GraphQL) hay retry con backoff para 429. En **chat** no hacemos retry automático; mostramos error. |
| **401** | No autorizado | (Según contrato.) | ✅ Parcial. Errores de API key se mapean a 401 en `errorResponse.ts`. En proxy de chat no distinguimos 401 del backend; va al mismo flujo que el resto de errores (503 o fallback). |

### 1.2 Cambios que proponemos para alinear con el contrato

- **402 (saldo agotado):** Implementar en `apps/web/pages/api/copilot/chat.ts`: si `backendResponse.status === 402`, no devolver 503; devolver 402 con body (message, y cuando existan: payment_url, upgrade_url, plans). En la UI (Copilot / web): mostrar mensaje amigable de “saldo agotado” y, si vienen URLs, botón/enlace para mejorar plan. **Confirmamos que no confundiremos 402 con 503** una vez implementado.
- **429 en chat:** Valorar retry con backoff en el proxy (o solo mostrar mensaje específico “Demasiadas peticiones; inténtalo en X segundos”) según lo que indiquéis en el plan final.
- **401 del backend:** Opcional: propagar 401 cuando api-ia devuelva 401 (hoy lo mapeamos a 503) para que la UI pueda mostrar “sesión expirada” o “no autorizado” distinto de “servicio no disponible”.

---

## 2. Pruebas que ejecutamos (scripts, endpoints, orden)

### 2.1 Endpoints que probamos

| Orden | Endpoint | Método | Uso |
|-------|----------|--------|-----|
| 1 | `{BASE_URL}/health` | GET | Comprobar que api-ia está vivo. |
| 2 | `{BASE_URL}/webapi/chat/auto` | POST | Chat con body `{ messages, stream: false }`, headers `X-Development: bodasdehoy`, opcional `Authorization: Bearer <JWT>`. |
| 3 | `{BASE_URL}/api/config/bodasdehoy` | GET | Config whitelabel (opcional en flujo mínimo). |

`BASE_URL` por defecto: `https://api-ia.bodasdehoy.com`.

### 2.2 Scripts y orden de ejecución

| Orden | Script | Qué hace |
|-------|--------|----------|
| 1 | `./scripts/slack-read.sh [N]` | Leer últimos N mensajes de #copilot-api-ia (ver si api-ia pidió algo). |
| 2 | `./scripts/test-api-ia-y-enviar-slack.sh` | Ejecuta 1→2→3 arriba; envía resumen (200/503, request_id) a #copilot-api-ia. |
| 3 | `node scripts/run-20-preguntas-api-ia.mjs [--json] [--output <file>]` | 20 preguntas contra POST /webapi/chat/auto; cuenta coherentes/incoherentes. |
| 4 | `node scripts/run-20-preguntas-api-ia-bateria-b.mjs` (y -bateria-c, -bateria-d) | Baterías B/C/D con otras 20 preguntas cada una. |
| 5 | `./scripts/slack-send.sh "mensaje"` | Enviar mensaje a #copilot-api-ia (p. ej. resumen de fallos). |

**Orden típico cuando decís "avanza" o "revisa api-ia":**  
1 → 2 (y si hay fallos, 5 con resumen) → 3 o 4 si hace falta batería → 5 si hay que reportar.

### 2.3 Formato de reporte de fallos (triaje)

Cuando haya fallos (503, 402, 429, etc.) enviamos a #copilot-api-ia:

- **Request:** URL, método, headers relevantes (sin secrets), body (resumido si es muy largo).
- **Response:** status, body (o resumen), `trace_id` si viene en body o header.
- **Curl** reproducible (o comando equivalente) cuando ayude.
- **Resumen numérico** si es batería (p. ej. "Batería B: 19/20 OK, fallo #10 → 503, trace_id=xxx").

Ejemplos de mensajes ya usados: `scripts/slack-mensaje-pendientes-con-pruebas.txt`, `scripts/slack-mensaje-pruebas-reales-query-completo.txt`.

---

## 3. Qué NO tenemos implementado (resumen para el plan)

| Área | No implementado | Dónde |
|------|-----------------|-------|
| **402 saldo agotado** | No distinguimos 402 de otros errores; no devolvemos 402 ni leemos `saldo_agotado` / `payment_url` / `upgrade_url`. | `apps/web/pages/api/copilot/chat.ts`: solo `!backendResponse.ok` → 503 o fallback. |
| **UI saldo agotado** | No hay mensaje ni botón “mejorar plan” / “recargar saldo” en la UI del Copilot. | apps/web (CopilotIframe, etc.) y apps/copilot (Conversation/Error). |
| **Propagación 401 backend** | 401 de api-ia se trata como error genérico (503); no propagamos 401 a la UI. | Mismo proxy chat. |
| **Cloudflare app-test/chat-test** | Subdominios app-test.bodasdehoy.com y chat-test.bodasdehoy.com sin Public Hostnames / CNAME al túnel en Cloudflare. | Configuración Cloudflare (nosotros tenemos acceso). |
| **Balance de keys en UI** | api-ia preguntó si queremos mostrar balance; aún no decidido ni implementado. | N/A. |
| **Notificaciones keys deshabilitadas** | Opciones Slack/Dashboard/Email; no decidido ni implementado. | N/A. |

El resto del flujo (health, chat/auto, config, manejo 503 con trace_id/error_code, envío a Slack con pruebas reales) sí está implementado.

---

## 4. Confirmación para api-ia

**Revisión contrato:** OK con los siguientes **cambios**:

1. **402:** Nos comprometemos a implementar trato específico para 402 (no confundir con 503) y, cuando existan, payment_url/upgrade_url/plans en UI.
2. **Batería y triaje:** Seguimos usando los scripts y formato de reporte descritos arriba; si en el documento compartido (PLAN_TESTING_COORDINADO_...) hay un formato concreto de mensaje, lo adoptamos.
3. **Documento completo:** No tenemos acceso al repo api-ia; si podéis pegar aquí (o en un mensaje) el resumen del contrato 402 (campos exactos del JSON) y el formato preferido de reporte de fallos, cerramos nuestra parte sin más cambios.

**Confirmación:** **Cambios: [1. Implementar 402; 2. Adoptar formato de reporte que indiquéis].** Cuando tengamos el detalle del 402 (campos) y el formato de mensaje preferido, respondemos "OK" para cerrar la revisión por Frontend.

---

## 5. Referencias internas

- Estado Slack y pendientes: `docs/PENDIENTES-Y-SLACK-ESTADO.md`
- Listado corto: `docs/LISTADO-PENDIENTES.md`
- Pruebas como usuario real: `docs/PRUEBAS-COMO-USUARIO-REAL.md`
- Batería para ejecutar internamente: `docs/BATERIA-PRUEBAS-PARA-API-IA-EJECUTAR-INTERNAMENTE.md`
