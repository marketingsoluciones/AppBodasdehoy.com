# Análisis detallado: qué NO está implementado (17 feb 2026)

Análisis de código y configuración para identificar gaps frente al contrato api-ia (200, 402, 503, 429, 401) y al plan de testing coordinado.

---

## 1. Contrato de respuestas api-ia

### 1.1 402 (saldo agotado)

**Contrato:** api-ia devuelve 402 con cuerpo tipo `{ "error": "saldo_agotado", "message": "...", "payment_url"?, "upgrade_url"?, "plans"? }`. No debe confundirse con 503.

**En el código:**

- **apps/web/pages/api/copilot/chat.ts**  
  - Líneas 581–625: `if (!backendResponse.ok)` trata **cualquier** status distinto de 2xx igual: se extrae mensaje/trace_id/error_code y se llama a `respondBackendUnavailable(res, ..., 503)` o se retorna `false` (fallback).  
  - **No existe** `if (backendResponse.status === 402)`.  
  - **No se lee** `saldo_agotado`, `payment_url`, `upgrade_url` ni `plans` del body.

**Conclusión:** 402 **no está implementado**. Cualquier 402 de api-ia se convierte en 503 o en fallback a proveedor directo.

---

### 1.2 503 (proveedor/credenciales)

**Contrato:** Triaje con request + response + trace_id por #copilot-api-ia.

**En el código:**

- **chat.ts:** Errores del backend (incluido 503) se normalizan con `normalizeBackendErrorCode` (429 → UPSTREAM_RATE_LIMIT, provider mismatch, etc.). Se devuelve 503 con headers `X-Backend-Trace-Id` y `X-Backend-Error-Code`. ✅
- **scripts:** `test-api-ia-y-enviar-slack.sh` y `run-20-preguntas-api-ia*.mjs` envían o generan resúmenes; `slack-send.sh` envía a #copilot-api-ia. ✅
- **Formato:** Mensajes con request_id, status, cuerpo resumido; templates en `scripts/slack-mensaje-*.txt`. ✅

**Conclusión:** 503 y triaje **sí están implementados** (proxy + scripts + Slack).

---

### 1.3 429 (rate limit)

**Contrato:** Diferenciar de 503; posible retry.

**En el código:**

- **chat.ts:** `normalizeBackendErrorCode` mapea 429 (y texto "rate limit"/"429") a `UPSTREAM_RATE_LIMIT`; el status que devolvemos al cliente sigue siendo **503** (no 429). No hay retry en el proxy de chat.
- **apps/copilot/src/utils/api-client-optimized.ts:** Retry con backoff solo para **GraphQL** (otro flujo), no para el chat.

**Conclusión:** 429 se **reconoce** pero se devuelve como 503; **no** hay retry automático en el flujo de chat.

---

### 1.4 401 (no autorizado)

**Contrato:** Manejo según acuerdo (p. ej. mensaje “sesión expirada” o “no autorizado”).

**En el código:**

- **chat.ts:** No hay rama `backendResponse.status === 401`. Cae en `!backendResponse.ok` y se trata igual que 503 (o fallback).
- **apps/copilot** (errorResponse.ts, types): 401 se usa para API key inválida (InvalidProviderAPIKey, etc.), pero eso es para **nuestro** lado, no para 401 devuelto por api-ia.

**Conclusión:** 401 **del backend api-ia** no se propaga; se mezcla con 503.

---

## 2. UI y experiencia de usuario

### 2.1 Mensaje “saldo agotado” (402)

- **apps/web:** No hay componente ni texto específico para “saldo agotado” ni para `payment_url`/`upgrade_url`.
- **apps/copilot:** En `Conversation/Error` se manejan tipos de error (Ollama, InvalidAPIKey, etc.); no hay caso para “saldo agotado” ni para enlace de pago/upgrade.

**Conclusión:** UI para 402 **no implementada**.

### 2.2 Mensaje 503 / servicio no disponible

- **apps/web/pages/api/copilot/chat.ts:** `respondBackendUnavailable` escribe mensaje genérico (“Servicio IA no disponible…”) y opcionalmente trace_id y error_code.
- **apps/web/services/copilotChat.ts:** En no-streaming, si `!response.ok` se usa `data.message` o `data.error` y se muestra en contenido del mensaje. No hay diferenciación por 402 vs 503 en la UI.
- **apps/web/components/Copilot/CopilotIframe.tsx:** Muestra `error` genérico y “Reintentar”; no distingue 402/503.

**Conclusión:** 503 se muestra como error genérico; **no** se distingue 402 en la UI.

### 2.3 Balance de keys en UI

- api-ia preguntó si queremos mostrar balance en UI. No hay decisión ni código para ello.

---

## 3. Infra y configuración

### 3.1 Cloudflare (app-test / chat-test)

- **Estado:** Túnel (cloudflared) y ingress locales documentados (app-test→8080, chat-test→3210). chat-test.eventosorganizador.com responde.
- **Falta:** Public Hostnames (o CNAME) en Cloudflare para **app-test.bodasdehoy.com** y **chat-test.bodasdehoy.com** apuntando al túnel. Quien puede hacerlo: Frontend (nosotros). Documentación: `docs/QUE-FALTA-VPN-Y-SUBDOMINIOS.md`, `docs/ESTADO-TUNELES-ESTE-EQUIPO.md`.

**Conclusión:** Subdominios bodasdehoy para app-test/chat-test **no están configurados** en Cloudflare.

### 3.2 Pruebas con usuario real (JWT)

- Scripts aceptan `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` o `FIREBASE_JWT`; `get-firebase-token.sh` y `get-firebase-token-and-run-20.mjs` existen.
- **Falta:** Credenciales de prueba (usuario Firebase bodasdehoy) no están definidas en el repo; son opcionales para el equipo.

---

## 4. Resumen por prioridad

| Prioridad | No implementado | Archivo / ámbito |
|-----------|-----------------|-------------------|
| Alta (contrato) | Trato específico 402 en proxy y body (saldo_agotado, payment_url, upgrade_url) | chat.ts |
| Alta (contrato) | UI para 402 (mensaje + enlace upgrade/pago) | apps/web, apps/copilot Conversation/Error |
| Media | Propagación 401 del backend (no mapear a 503) | chat.ts |
| Media | Retry 429 en chat (o mensaje específico “rate limit”) | chat.ts / UI |
| Media | Cloudflare app-test/chat-test.bodasdehoy.com | Config Cloudflare |
| Baja | Balance de keys en UI | Por decidir |
| Baja | Notificaciones keys (Slack/Dashboard/Email) | Por decidir |
| Baja | Credenciales usuario de prueba (opcional) | .env / equipo |

---

## 5. Referencias de código

- Proxy chat: `apps/web/pages/api/copilot/chat.ts` (proxyToPythonBackend, respondBackendUnavailable, normalizeBackendErrorCode).
- UI Copilot web: `apps/web/components/Copilot/CopilotIframe.tsx`, `apps/web/services/copilotChat.ts`.
- Errores Copilot: `apps/copilot/src/features/Conversation/Error/index.tsx`.
- Rate limit retry (GraphQL): `apps/copilot/src/utils/api-client-optimized.ts`.

## 6. Análisis ampliado: saldo, planes, facturas, multinivel

Para un desglose de **qué está implementado y qué no** en: recargar saldo, ver crédito, planes contratados, histórico de pagos, facturas, ver/cambiar planes, multinivel, dar crédito, saldo revendedor y 402 (saldo agotado), ver **docs/SALDO-PLANES-FACTURAS-IMPLEMENTADO-Y-PENDIENTE.md**.
