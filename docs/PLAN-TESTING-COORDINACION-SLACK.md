# Plan de testing coordinado – Cómo va la coordinación en Slack

Resumen del estado de la coordinación del plan de testing (api-ia, API2, Frontend) en #copilot-api-ia.

---

## 1. Qué es el plan

- **Documento:** PLAN_TESTING_COORDINADO_API2_MIDDLEWARE_FRONTEND.md (en repo api-ia). Resumen: RESUMEN_PLAN_PARA_FRONTEND.md (nos lo pueden pegar en Slack).
- **Participantes:** api-ia (middleware), API2 (backend), Frontend (nosotros – Copilot LobeChat).
- **Contrato que nos afecta:** 200 (OK), 402 (saldo agotado: error + message; futuro payment_url/upgrade_url/plans), 503 (proveedor; enviar pruebas reales para triaje), 429, 401.
- **Batería:** Nosotros ejecutamos pruebas contra api-ia; si hay fallos, enviamos request + response + trace_id por #copilot-api-ia.
- **E2E:** Casos usuario → front → api-ia → API2 (chat 200, 402 cuando exista).

---

## 2. Cómo llevamos la coordinación (cronología)

| Fase | Quién | Qué pasó |
|------|--------|----------|
| **Inicio** | api-ia | Envían plan unificado (tests API2 + middleware + coordinación con Frontend). Piden revisar contrato, completar nuestras pruebas/orden/formato, confirmar "OK" o "Cambios". |
| **Respuesta 1** | Frontend | Revisamos contrato; confirmamos "Cambios: [1. Implementar 402; 2. Adoptar formato de reporte que indiquéis]". Documentamos scripts, orden, qué no teníamos implementado. |
| **Plan medio cerrado** | api-ia | Piden explícitamente "Falta implementar: [lista]" y "Sugerencias: [lista]" para cerrar versión del plan. |
| **Respuesta 2** | Frontend | Enviamos: Falta implementar = 402 en proxy, UI saldo agotado, 401 opcional; ya tenemos X-Development y reporte con request+response+trace_id. Sugerencias = ninguna; pedimos RESUMEN_PLAN o JSON 402. |
| **Seguimiento** | Frontend | Enviamos mejoras deseadas: esquema JSON 402, formato reporte Slack, E2E usuario real, enlace 402→Facturación, balance keys cuando exista. |
| **Confirmación api-ia** | api-ia | "Respuesta plan medio cerrado – recibida e incorporada." Incorporan nuestra lista y el seguimiento. Cuando API2 exponga payment_url/upgrade_url en el 402 nos avisan; hoy el 402 solo lleva error + message. |
| **Update implementación** | Frontend | Comunicamos en Slack que **402 ya está implementado** en proxy y cliente (detección 402, body SALDO_AGOTADO, streaming, mensaje en UI, header X-Backend-Error-Code). Pendiente: botón Recargar cuando api-ia exponga payment_url/upgrade_url. Preguntamos si hay formato concreto de cuerpo 402 que prefieran. |

---

## 3. Estado actual (resumen)

| Aspecto | Estado |
|---------|--------|
| **Revisión Frontend del plan** | Cerrada: hemos enviado "Falta implementar" y "Sugerencias/mejoras"; api-ia lo ha incorporado. |
| **402 en proxy** | Implementado: `apps/web/pages/api/copilot/chat.ts` detecta 402, devuelve 402 con body (error: SALDO_AGOTADO, message, payment_url?, plans?, trace_id, requestId), sin fallback. |
| **402 en cliente/UI** | Implementado: `apps/web/services/copilotChat.ts` comprueba status 402 antes del stream; muestra mensaje "Saldo de IA agotado. Recarga tu cuenta...". |
| **payment_url / upgrade_url** | Pendiente de api-ia/API2: cuando lo expongan en el 402, nos avisan por #copilot-api-ia; entonces podemos mostrar botón "Recargar" en UI. |
| **Formato cuerpo 402** | Preguntado en Slack si tienen preferencia; hoy usamos error + message + opcionales. |
| **401 opcional** | Pendiente implementar (propagar 401 en lugar de 503 si api-ia devuelve 401). |
| **Pruebas y reporte** | En marcha: test-api-ia-y-enviar-slack.sh, run-20-preguntas; reporte con request+response+trace_id cuando hay fallos. |

---

## 4. Qué hacer desde nuestro lado

- **Seguir enviando** resultados de test básico (test-api-ia-y-enviar-slack.sh) cuando hagamos ciclos "avanza".
- **Si api-ia responde** con formato concreto del 402 o con aviso de payment_url/upgrade_url: actualizar proxy/UI según lo acordado.
- **Si hay fallos 503 (u otros):** enviar a #copilot-api-ia request + response + trace_id en el mismo hilo.
- **Añadir algo a "falta implementar" o "mejoras":** responder en el mismo hilo en #copilot-api-ia; api-ia lo suma al plan.

---

## 5. Referencias

- Estado general Slack y pendientes: **docs/PENDIENTES-Y-SLACK-ESTADO.md**
- Respuesta formal al plan: **docs/PLAN-TESTING-COORDINADO-FRONTEND-RESPUESTA.md**
- Lo que falta y mejoras: **docs/LO-QUE-FALTA-Y-MEJORAS-AL-PLAN.md**
- Scripts: `./scripts/slack-read.sh`, `./scripts/slack-send.sh`, `./scripts/test-api-ia-y-enviar-slack.sh`
