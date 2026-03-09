# Nuestra parte (Frontend): pendiente, implementado, faltante y mejoras a pedir

Resumen actualizado de lo que **está pendiente** en nuestro lado, lo que **ya hemos implementado**, las **pantallas o funcionalidades que no tenemos** y las **mejoras que querríamos pedir** (api-ia / API2 / plan).

---

## 1. Pendiente de nuestra parte (por hacer)

| # | Pendiente | Dónde | Notas |
|---|-----------|--------|--------|
| 1 | ~~**Propagación 401**~~ | ✅ **Implementado.** Proxy devuelve 401 con UNAUTHORIZED; cliente muestra "No autorizado. Inicia sesión de nuevo...". | — |
| 2 | ~~**Enlace "Recargar" cuando 402 sin payment_url**~~ | ✅ **Implementado.** Proxy añade `payment_url` con fallback a Copilot `/settings/billing`; cliente muestra mensaje + `[Recargar saldo](url)` en el contenido. | — |
| 3 | **Cloudflare app-test / chat-test** | Configuración | Public Hostnames (o CNAME) para app-test.bodasdehoy.com y chat-test.bodasdehoy.com al túnel. Nosotros tenemos acceso. (No es código.) |

---

## 2. Ya implementado (nuestra parte)

| # | Implementado | Dónde |
|---|--------------|--------|
| 1 | **401 en proxy y cliente** | Proxy: si api-ia devuelve 401, respondemos 401 con UNAUTHORIZED. Cliente: muestra "No autorizado. Inicia sesión de nuevo...". |
| 2 | **402 en proxy** | `chat.ts`: detecta 402, devuelve 402 con body (SALDO_AGOTADO, message, payment_url siempre: el de api-ia o fallback a Copilot /settings/billing). No hace fallback. |
| 3 | **402 en cliente** | `copilotChat.ts`: comprueba 402; muestra mensaje + enlace "[Recargar saldo](url)" en el contenido; `navigationUrl` para la UI. |
| 4 | **X-Development** | En todas las peticiones a api-ia (header o metadata; default bodasdehoy). |
| 5 | **Reporte de fallos** | Cuando hay fallos enviamos request + response + trace_id por #copilot-api-ia. |
| 6 | **Saldo, recarga, facturas, planes (Copilot)** | Ver docs/SALDO-PLANES-FACTURAS-IMPLEMENTADO-Y-PENDIENTE.md: wallet, recarga, "Mi Plan", historial pagos, facturas (listado + PDF), transacciones, paquetes, uso del mes. |

---

## 3. Pantallas o funcionalidad que NO tenemos implementadas (front)

| # | Faltante | Tipo | Notas |
|---|----------|------|--------|
| 1 | **Catálogo de planes** | Pantalla / flujo | No hay pantalla "Planes" ni listado de planes disponibles con precios (getAvailablePlans o similar). Solo mostramos el plan actual en Facturación. |
| 2 | **Cambiar de plan** | Flujo | No hay "Cambiar plan" (upgrade/downgrade suscripción) ni integración en UI con Stripe/API2 para cambiar suscripción. |
| 3 | **Recargar un servicio específico** | UI | Recarga es de saldo global; no hay "recargar solo IA" o "solo SMS" en la UI (API2 podría tener SKUs por servicio). |
| 4 | **Multinivel: ver saldo niveles inferiores** | Pantalla / datos | No hay jerarquía padre/hijos ni pantalla que muestre saldo de subcuentas o niveles inferiores. |
| 5 | **Saldo revendedor** | Pantalla / datos | No hay concepto revendedor ni vista de saldo revendedor o asignado a cuentas hijas. |
| 6 | **Dar crédito (admin)** | Pantalla | No hay pantalla de admin "Dar crédito a usuario" ni UI que llame a wallet_credit/wallet_adjust (si API2 lo expone). |
| 7 | **Balance de keys (api-ia) en UI** | Pantalla / datos | No hay pantalla "saldo de keys" de IA; depende de que api-ia/API2 expongan endpoint (p. ej. /monitor/stats). Decisión a favor en RESPUESTA-SLACK-SISTEMA-KEYS.md. |
| 8 | **Notificaciones keys deshabilitadas** | UI / decisión | Sin decisión ni UI (Slack/Email/Dashboard). api-ia ofreció opciones. |
| 9 | ~~**Enlace 402 → Facturación cuando no hay payment_url**~~ | ✅ Implementado | Proxy usa fallback a Copilot /settings/billing; cliente muestra "[Recargar saldo](url)". |

---

## 4. Mejoras que querríamos pedir (a api-ia / API2 / plan)

| # | Mejora | A quién | Qué pedir |
|---|--------|---------|-----------|
| 1 | **Esquema JSON 402** | api-ia | Que compartan el esquema exacto del cuerpo 402 (campos obligatorios y opcionales) para alinear proxy y UI sin suposiciones. |
| 2 | **payment_url / upgrade_url en 402** | api-ia / API2 | Cuando lo expongan en el 402, avisarnos por #copilot-api-ia para poder mostrar botón "Recargar" / "Mejorar plan" en la UI (ya estamos preparados para recibirlos en el proxy). |
| 3 | **Formato de mensaje Slack para fallos** | api-ia | Template o ejemplo concreto de mensaje (request + response + trace_id) reutilizable en nuestros scripts. |
| 4 | **E2E con usuario real en el plan** | api-ia / plan | Incluir caso E2E "usuario logueado → chat → 200/402" con token real (JWT) para validar flujo completo. |
| 5 | **429 en chat** | api-ia / plan | Definir si en el front debemos hacer retry con backoff o solo mostrar mensaje específico ("Demasiadas peticiones..."); hoy normalizamos a 503. |
| 6 | **Endpoint balance de keys** | api-ia / API2 | Cuando exista (p. ej. /monitor/stats), poder mostrar balance de keys en la UI del Copilot. |

---

## 5. Paneles / pantallas pendientes de implementar (nosotros)

| # | Panel / pantalla | App | Depende de |
|---|------------------|-----|-------------|
| 1 | **Catálogo de planes** | Copilot | API2: getAvailablePlans o similar (listado planes + precios). |
| 2 | **Cambiar de plan** (upgrade/downgrade) | Copilot | API2 + Stripe: flujo cambio suscripción en UI. |
| 3 | **Recargar un servicio específico** (solo IA, solo SMS…) | Copilot | Opcional; API2 con SKUs por servicio si aplica. |
| 4 | **Multinivel: saldo niveles inferiores** | Copilot | API2: jerarquía padre/hijos, consulta saldo subcuentas. |
| 5 | **Saldo revendedor** | Copilot | API2: concepto revendedor y datos. |
| 6 | **Dar crédito (admin)** | Copilot | API2: wallet_credit / wallet_adjust expuesto; pantalla admin. |
| 7 | **Balance de keys (api-ia) en UI** | Copilot | api-ia/API2: endpoint tipo /monitor/stats o similar. |
| 8 | **Notificaciones keys deshabilitadas** | Copilot / web | Decisión producto + api-ia (Slack/Email/Dashboard). |

**No es código:** Cloudflare (app-test / chat-test) — configuración de hostnames.

**Pedir ayuda a API2 / api-ia:** Ver **`docs/PANELES-PENDIENTES-PETICIONES-API2-API-IA.md`**. Ahí está el análisis por panel, qué necesitamos que expongan (queries, mutations, endpoints) y **texto listo para copiar** en Slack o enviar a los equipos. Usar ese doc para coordinar y priorizar con API2/api-ia.

---

## 6. Resumen rápido

- **Pendiente nuestro (código):** solo los paneles de la tabla anterior (catálogo planes, cambiar plan, multinivel, revendedor, dar crédito admin, balance keys, notificaciones keys).
- **Pendiente nuestro (config):** Cloudflare app-test/chat-test.
- **Implementado:** 401 y 402 en proxy y cliente, X-Development, reporte fallos, Facturación Copilot (saldo, recarga, plan actual, facturas, pagos, uso, enlace Recargar en 402).
- **A pedir (api-ia/API2):** esquema 402, payment_url/upgrade_url en 402, formato reporte Slack, E2E usuario real, criterio 429, endpoint balance keys.

---

## 7. Referencias

- Coordinación Slack: `docs/PLAN-TESTING-COORDINACION-SLACK.md`
- Saldo, planes, facturas (detalle): `docs/SALDO-PLANES-FACTURAS-IMPLEMENTADO-Y-PENDIENTE.md`
- Lo que falta y mejoras al plan: `docs/LO-QUE-FALTA-Y-MEJORAS-AL-PLAN.md`
- Estado Slack: `docs/PENDIENTES-Y-SLACK-ESTADO.md`
- **Mensaje Slack paneles pendientes:** `docs/SLACK-MENSAJE-PANELES-PENDIENTES.md` (copiar/pegar en #copilot-api-ia)
