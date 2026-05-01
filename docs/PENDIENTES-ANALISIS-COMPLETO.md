# Análisis completo de pendientes (Frontend · Copilot · api-ia · API2)

**Última revisión:** Feb 2026 (tras informes 21 Feb y recordatorio Slack).

---

## Resumen ejecutivo

| Área | Pendientes nuestros | En espera de api-ia/API2 | Bloqueos críticos |
|------|---------------------|---------------------------|--------------------|
| **Chat / api-ia** | Re-probar cuando avisen | Fix provider/modelo (anthropic+deepseek-chat), stream=true, contexto JWT, worker improve_text | Chat 503 y NO_PROVIDERS_AVAILABLE en UI |
| **Facturación / planes** | Paneles 1–8 (catálogo, cambiar plan, multinivel, etc.) | getAvailablePlans, payment_url en 402, wallet_credit, etc. | Dependen de API2 |
| **Slack / coordinación** | Respuesta balance keys, notificaciones keys | Respuesta a 5 bugs + 4 preguntas del 21 Feb | — |
| **Infra** | Cloudflare app-test/chat-test (si asignado) | — | Opcional |

---

## 1. En espera de api-ia (nos bloquean)

### 1.1 Crítico — Informes del 21 Feb 2026 (sin respuesta sustantiva aún)

| # | Tema | Detalle | Qué necesitamos |
|---|------|---------|-----------------|
| 1 | **stream=true → NO_PROVIDERS_AVAILABLE** | Usuario ve "error de comunicación". Con stream=false sí intenta anthropic/deepseek-chat. | Explicación y/o fix: por qué con stream=true no hay proveedor. |
| 2 | **AUTH_ERROR + PROVIDER_ERROR** | provider=anthropic + model=deepseek-chat (combinación inválida). 58/80 preguntas → 503. | Corregir provider/modelo o keys en API2/whitelabel. |
| 3 | **Respuestas sin contexto** | 22/80 responden 200 pero piden "nombre del evento" (sin datos reales del usuario). | ¿api-ia necesita JWT Firebase para inyectar contexto? ¿O API2 envía contexto? |
| 4 | **GET /webapi/models/anthropic → []** | Array vacío. | Confirmar si es esperado o fallo de registro. |
| 5 | **POST /api/ai/improve → 500** | "Tarea no encontrada: backend.workers.granular_ai.improve_text". | ¿Worker Celery desplegado? |

**Acción:** Cuando api-ia corrija provider/modelo y/o stream → re-probar chat/auto y confirmar en #copilot-api-ia.

### 1.2 Ya acordado (solo aviso)

| # | Tema | Estado |
|---|------|--------|
| 1 | **payment_url / upgrade_url en 402** | API2 aún no lo expone. Cuando lo expongan, api-ia nos avisará; proxy y UI preparados. |
| 2 | **Cola de campañas** | api-ia cierra integración con API2. Cuando esté operativa, avisarán para re-probar. |

### 1.3 Decisiones / info que nos pidieron

| # | Petición api-ia | Nuestra acción |
|---|-----------------|----------------|
| 1 | **Balance de keys en UI** | Decisión: sí queremos; pendiente endpoint estable (ej. /monitor/stats). Doc: RESPUESTA-SLACK-SISTEMA-KEYS.md. |
| 2 | **Notificaciones keys deshabilitadas** | Opciones: Slack, Email, Dashboard. Pendiente decidir y responder en #copilot-api-ia. |

---

## 2. Pendientes nuestros (Frontend)

### 2.1 Hecho (no pendiente)

- UI saldo agotado (402): mensaje + enlace Recargar (fallback a /settings/billing).
- 401 sesión expirada en proxy y cliente.
- Ejemplos 503 con trace_id: enviados en informes 21 Feb.
- Re-probar cuando avisen: listos.
- EventSelector: usa getEventosByUsuario.
- Slack: leer y escribir en #copilot-api-ia (chat.postMessage + bot token).

### 2.2 Configuración / no código

| # | Pendiente | Responsable | Notas |
|---|-----------|-------------|--------|
| 1 | **Cloudflare app-test / chat-test** | Frontend (nosotros) si tenemos acceso | Public Hostnames (o CNAME) para app-test.bodasdehoy.com y chat-test.bodasdehoy.com. Según asignación interna. |

### 2.3 Paneles / pantallas por implementar (dependen de API2/api-ia)

| # | Panel | Depende de |
|---|--------|------------|
| 1 | **Catálogo de planes** | API2: getAvailablePlans (o equivalente). |
| 2 | **Cambiar de plan** (upgrade/downgrade) | MCP + Stripe: flujo y URL/session checkout. |
| 3 | **Recargar servicio específico** (solo IA, solo SMS) | MCP: SKUs por servicio si aplica. |
| 4 | **Multinivel: saldo niveles inferiores** | MCP: jerarquía padre/hijos, saldo subcuentas. |
| 5 | **Saldo revendedor** | MCP: modelo y endpoints. |
| 6 | **Dar crédito (admin)** | MCP: wallet_credit / wallet_adjust. |
| 7 | **Balance de keys en UI** | IA/MCP: endpoint tipo /monitor/stats. |
| 8 | **Notificaciones keys deshabilitadas** | Decisión producto + api-ia (Slack/Email/Dashboard). |

Textos listos para pedir a MCP/IA: **docs/PANELES-PENDIENTES-PETICIONES-MCP-IA.md** y **docs/SLACK-MENSAJE-PANELES-PENDIENTES.md**.

---

## 3. Tareas del 21 Feb (detalle)

### 3.1 Bugs reportados

1. **BUG 1 (crítico):** stream=true → NO_PROVIDERS_AVAILABLE → usuario ve "error de comunicación". Body: `error_code: NO_PROVIDERS_AVAILABLE`, trace_id 0088d0be.
2. **BUG 2:** AUTH_ERROR, ~750ms, 30/80 preguntas. provider=anthropic, model=deepseek-chat, upstream 401.
3. **BUG 3:** PROVIDER_ERROR 400, ~6–8s, 27/80. Misma configuración inválida.
4. **BUG 4:** 22 respuestas HTTP 200 sin contexto (modelo pide "nombre del evento" en vez de usar datos del usuario).
5. **BUG 5:** POST /api/ai/improve → 500, worker granular_ai.improve_text no encontrado.

### 3.2 Preguntas concretas enviadas

1. ¿Por qué con stream=true no hay proveedor y con stream=false sí?
2. ¿IA necesita JWT Firebase para inyectar contexto del evento? ¿O MCP envía ese contexto?
3. GET /webapi/models/anthropic devuelve []. ¿Es esperado?
4. POST /api/ai/improve 500. ¿Está desplegado el worker de Celery?

### 3.3 Resultados 21 Feb (80 preguntas, baterías A+B+C+D)

- 58/80 → 503 (AUTH_ERROR o PROVIDER_ERROR).
- 22/80 → HTTP 200 pero respuestas ilógicas (sin datos usuario).
- 0/80 → Respuesta correcta con datos reales del usuario.
- MCP (batería GraphQL): todo OK.

---

## 4. Referencias rápidas

| Documento | Contenido |
|-----------|-----------|
| **docs/PENDIENTES-SLACK-RESUMEN-ACTUAL.md** | Resumen corto Slack + estado peticiones api-ia. |
| **docs/PENDIENTES-Y-SLACK-ESTADO.md** | Estado pruebas, protocolo autónomo, bloqueos. |
| **docs/NUESTRA-PARTE-PENDIENTE-E-IMPLEMENTADO.md** | Paneles faltantes, implementado, mejoras a pedir. |
| **docs/PANELES-PENDIENTES-PETICIONES-MCP-IA.md** | Qué pedir a MCP/IA por panel; texto para Slack. |
| **docs/LISTADO-PENDIENTES.md** | Listado histórico con tachados de lo hecho. |
| **TAREAS-PENDIENTES-SLACK.md** | Decisiones Sistema Keys, preguntas api-ia. |
| **scripts/slack-recordatorio-pendientes-completo.txt** | Mensaje enviado a #copilot-api-ia con recordatorio completo. |

---

## 5. Próximos pasos sugeridos

1. **Cuando api-ia responda** a los 5 bugs y 4 preguntas del 21 Feb → re-probar chat/auto (stream true/false, 20 preguntas) y confirmar en Slack.
2. **Cuando MCP exponga** payment_url/upgrade_url en 402 → enlazar en UI (ya preparado en proxy).
3. **Cuando api-ia avise** cola de campañas operativa → re-probar flujo campañas.
4. **Nosotros:** Responder en #copilot-api-ia sobre notificaciones keys (Slack/Email/Dashboard) cuando se decida.
5. **Paneles:** Priorizar con producto; pedir a MCP/IA según **PANELES-PENDIENTES-PETICIONES-MCP-IA.md** cuando toque.
