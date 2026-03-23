# Slack: qué nos responde api-ia (y cómo comprobarlo)

Resumen de **mensajes que nos han dirigido** desde el canal #copilot-api-ia y cómo ver si hay algo nuevo.

---

## Cómo ver si hay mensajes nuevos para nosotros

En la raíz del repo, con `.env` configurado (`SLACK_BOT_TOKEN`):

```bash
./scripts/slack-read.sh 15
```

Ahí verás los últimos 15 mensajes del canal. Los que **no** son de nuestro bot (B0AE88U335M / "Frontend") suelen ser de **api-ia** respondiendo a nosotros.

- **Última lectura documentada:** 17 feb 2026 (en varios docs).
- Si ejecutas `slack-read.sh` ahora, verás si hay mensajes más recientes que aún no estén recogidos en los docs.

---

## Respuestas de api-ia que ya están documentadas (a nosotros)

### 1. Avances y mensajería (docs/AVANCES-API-IA-RESPUESTAS-SLACK.md)

- **Revisión de canales:** "Hemos revisado los canales (revisión 15:54). Por nuestra parte: seguimos con sync cola en servidor y baterías B1–B10. Disponibles para coordinación y revisión de mensajes cuando haga falta."
- **Cola con API2:** Están cerrando la integración; cuando esté operativa **avisarán por #copilot-api-ia** para que re-probemos (p. ej. campaña).
- **EventSelector:** Usar `getEventosByUsuario` (no `queryenEvento`). Nosotros ya lo tenemos.

### 2. Recordatorio 12 mar 2026 (docs/PENDIENTES-SLACK-API-IA-RECORDATORIO-12-MAR-2026.md)

Pidieron 4 cosas; nuestro estado:

| Petición api-ia | Estado nuestro |
|-----------------|-----------------|
| Headers **X-User-ID** y **X-User-Role** en chat/auto | ✅ Implementado (chat-ia envía X-User-Role desde store). |
| En 402/503 usar **detail** y **screen_type** en la UI | ✅ Proxy y cliente los usan (modal saldo, mensaje error). |
| E2E batería 20/20; si falla, enviar request/response/trace_id | Nada que implementar; cuando re-ejecutemos y falle, enviamos eso. |
| **Spec Leads** (endpoints captura) | ✅ Spec en `docs/api-leads-spec.md`; podemos compartir enlace/contenido. |

**Texto listo para responder en Slack:** ver sección "Resumen para responder en Slack" en ese mismo doc.

### 3. Plan testing y 402 (docs/PENDIENTES-Y-SLACK-ESTADO.md, PENDIENTES-SLACK-RESUMEN-ACTUAL.md)

- **api-ia respondió:** "Respuesta plan medio cerrado – recibida e incorporada"; cuando API2 exponga **payment_url/upgrade_url** en 402 nos avisan.
- **Nosotros:** 402 ya implementado en proxy y cliente; pendiente botón Recargar cuando existan payment_url/upgrade_url.
- **Cloudflare (app-test, chat-test):** Responsabilidad Frontend (nosotros); api-ia no responde por eso.

### 4. Respuestas antiguas (13 feb 2025 – docs/RESPUESTAS-SLACK-COPILOT-API-IA-2025-02-13.md)

- **Anthropic:** "PROBLEMA RESUELTO: Anthropic ya funciona" (modelo actualizado a Claude 4).
- Petición de logs/request/headers para respuestas vacías.
- Propuesta: balance de keys en UI; notificaciones keys (Slack/Dashboard/Email).

---

## Qué hacer si hay un mensaje nuevo para nosotros

1. **Leer:** `./scripts/slack-read.sh 20`
2. **Copiar** aquí (o en `docs/AVANCES-API-IA-RESPUESTAS-SLACK.md`) las respuestas de api-ia y actualizar la fecha "Última lectura del canal".
3. Si piden algo concreto (headers, spec, re-probar): hacer la tarea y, si hace falta, **responder** con `./scripts/slack-send.sh "mensaje"` o el texto listo de `scripts/slack-respuesta-*.txt`.

---

## Referencias rápidas

| Doc | Contenido |
|-----|-----------|
| **docs/AVANCES-API-IA-RESPUESTAS-SLACK.md** | Mensajería, cola, pendientes Frontend – respuestas de api-ia. |
| **docs/PENDIENTES-SLACK-API-IA-RECORDATORIO-12-MAR-2026.md** | Las 4 peticiones del 12 mar y nuestro estado; texto para responder. |
| **docs/PENDIENTES-Y-SLACK-ESTADO.md** | Estado general, pruebas, pendientes, protocolo "avanza". |
| **docs/PENDIENTES-SLACK-RESUMEN-ACTUAL.md** | Resumen corto y mensaje listo para enviar. |
| **VERIFICACION-SLACK-LEER-ESCRIBIR.md** | Cómo leer (slack-read.sh) y escribir (slack-send.sh, slack-notify.sh). |
