# Pendientes Slack – Resumen actual (17 feb 2026)

**Canal:** #copilot-api-ia  
**Última lectura Slack:** 17 feb 2026 (`./scripts/slack-read.sh 15`)  
**Última prueba api-ia:** 17 feb 2026 (`./scripts/test-api-ia-y-enviar-slack.sh` → health 200, chat 503, config 200; resumen enviado a Slack)  
**Última respuesta:** Enviada a "Consulta avances y qué depende de nosotros" (Frontend + CRM-Front). Texto: `scripts/slack-respuesta-consulta-avances.txt`

---

## 1. Recordatorio de api-ia (lo que pedían de nosotros)

| # | Petición api-ia | Estado nuestro |
|---|-----------------|----------------|
| 1 | **UI saldo agotado (402)** | ✅ Hecho. Proxy devuelve 402; cliente muestra mensaje + enlace "[Recargar saldo]" (billing_url o /settings/billing). |
| 2 | **401 opcional (sesión expirada)** | ✅ Hecho. Proxy propaga 401; cliente muestra "No autorizado. Inicia sesión de nuevo". |
| 3 | **(Opcional) Ejemplos 503 con trace_id** | Enviaremos 1–2 ejemplos con trace_id si vuelve a haber 503 en baterías. |
| 4 | **Re-probar cuando aviséis** | Cuando api-ia avise por #copilot-api-ia, re-probamos chat/auto y confirmamos en el canal. |
| 5 | **Cloudflare (app-test, chat-test)** | Responsabilidad Frontend. Configuración según asignación interna (Public Hostnames / CNAME). |

**payment_url/upgrade_url en 402:** Cuando API2 lo exponga, api-ia nos avisará; proxy y UI ya preparados para mostrarlos.

---

## 2. Recordatorio api-ia para CRM-Front (EventSelector + cola)

| # | Petición | Estado |
|---|----------|--------|
| 1 | **EventSelector: query correcta** | ✅ En Copilot el EventSelector ya usa `getEventosByUsuario` (no `queryenEvento`), según indicación de API2. |
| 2 | **Cola de campañas** | En espera. api-ia cerrará integración con API2 y avisará por #copilot-api-ia para re-probar el flujo. |

---

## 3. Acciones realizadas hoy

- Lectura de los últimos 12 mensajes del canal (#copilot-api-ia).
- Ejecución de `test-api-ia-y-enviar-slack.sh`: resultado enviado a Slack (health 200, chat 503, config 200).
- Actualización de este resumen y del mensaje listo para enviar a api-ia (ver más abajo).

---

## 4. Mensaje listo para enviar a api-ia (confirmación)

Para cerrar el loop del recordatorio "lo que queda pendiente de vuestra parte", se puede enviar:

```bash
./scripts/slack-send.sh "$(cat scripts/slack-respuesta-recordatorio-api-ia.txt)"
```

Contenido del mensaje: ver `scripts/slack-respuesta-recordatorio-api-ia.txt`.

---

## 5. Referencias

- Estado detallado: `docs/PENDIENTES-Y-SLACK-ESTADO.md`
- Tareas pendientes: `TAREAS-PENDIENTES-SLACK.md`
- Listado: `docs/LISTADO-PENDIENTES.md`
- Cómo conectar Slack: `docs/COMO-CONECTAR-SLACK-COPILOT.md`
- Si falla lectura (missing_scope): `COMO-SOLUCIONAR-LECTURA-SLACK.md`
