# Lo que falta por implementar y mejoras al plan (Frontend)

Resumen para avanzar: **qué nos falta implementar** y **qué nos gustaría implementar o mejorar** en el plan de testing coordinado (api-ia, API2, Frontend).

---

## 1. Lo que falta por implementar (obligatorio para el plan)

| # | Pendiente | Dónde | Prioridad |
|---|-----------|--------|-----------|
| 1 | ~~**402 en proxy**~~ | ✅ **Implementado.** chat.ts detecta 402, devuelve 402 con body (SALDO_AGOTADO, message, payment_url?, plans?). | — |
| 2 | ~~**UI saldo agotado**~~ | ✅ **Implementado.** copilotChat.ts muestra mensaje "Saldo de IA agotado..."; si viene payment_url se devuelve como navigationUrl. Pendiente: botón/enlace a Facturación cuando *no* venga payment_url. | Baja |
| 3 | **Propagación 401** (opcional) | Si api-ia devuelve 401, propagar 401 a la UI en lugar de 503 para mostrar "No autorizado" distinto de "Servicio no disponible". | Media |

**Ya tenemos:** X-Development en todas las peticiones; reporte de fallos con request + response + trace_id por #copilot-api-ia. Resumen actual: **docs/NUESTRA-PARTE-PENDIENTE-E-IMPLEMENTADO.md**.

---

## 2. Lo que nos gustaría implementar o mejorar (sugerencias al plan)

### 2.1 Contrato y respuestas

- **JSON 402 definido:** Que api-ia comparta el esquema exacto del 402 (campos obligatorios y opcionales: `error`, `message`, `payment_url`, `upgrade_url`, `plans`) para implementar sin suposiciones.
- **429 en chat:** Definir si queremos retry con backoff en el proxy o solo mensaje específico ("Demasiadas peticiones; inténtalo en X segundos"); hoy normalizamos a 503.

### 2.2 Batería y reporte

- **Formato de mensaje en Slack:** Un template o ejemplo concreto de mensaje para reportar fallos (request + response + trace_id) que podamos reutilizar en los scripts.
- **E2E con usuario real:** Incluir en el plan un caso E2E "usuario logueado → chat → 200/402" con token real (TEST_USER_EMAIL/PASSWORD o JWT) para validar flujo completo.

### 2.3 UX y producto

- **Enlace 402 → Facturación:** Cuando mostremos "saldo agotado", enlazar directamente a la pantalla de Facturación/Recarga del Copilot (ya existe) si no viene `payment_url` de api-ia.
- **Balance de keys en UI:** Cuando api-ia/API2 expongan un endpoint tipo `/monitor/stats` o similar, mostrar balance de keys en la UI (ya lo tenemos como decisión a favor en RESPUESTA-SLACK-SISTEMA-KEYS.md).

### 2.4 Plan a largo plazo (fuera del alcance actual)

- **Catálogo de planes y cambiar de plan:** Ver listado de planes disponibles y flujo "Cambiar plan" (hoy solo mostramos el plan actual).
- **Multinivel / revendedor:** Si en el futuro hay saldo por niveles inferiores o revendedor, definir contrato y endpoints para poder mostrarlos en la UI.

---

## 3. Resumen para Slack

**Falta implementar:** (1) 402 en proxy, (2) UI saldo agotado/upgrade, (3) propagación 401 opcional.

**Mejoraríamos / nos gustaría:** (1) Esquema JSON 402 compartido, (2) formato de mensaje de reporte en Slack, (3) caso E2E con usuario real en el plan, (4) enlace 402 → Facturación Copilot cuando no haya payment_url, (5) balance de keys en UI cuando exista endpoint.

---

## 4. Referencias

- Plan y respuesta Frontend: `docs/PLAN-TESTING-COORDINADO-FRONTEND-RESPUESTA.md`
- Análisis qué no está implementado: `docs/ANALISIS-QUE-NO-ESTA-IMPLEMENTADO.md`
- Saldo, planes, facturas: `docs/SALDO-PLANES-FACTURAS-IMPLEMENTADO-Y-PENDIENTE.md`
- Estado Slack: `docs/PENDIENTES-Y-SLACK-ESTADO.md`
