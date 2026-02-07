# Informe api-ia – Resumen de lo que se necesita

**Destinatario:** Equipo api-ia  
**Objetivo:** Que el front (AppBodasdehoy y Copilot) no llame a API2. Todo lo que hoy piden a API2 debe estar en **api-ia** (api-ia puede hablar con API2 por detrás).

---

## Resumen ejecutivo

| Prioridad | Qué necesita api-ia | Para qué |
|-----------|--------------------|----------|
| **Alta** | 1. Endpoint de **historial de chat** | AppBodasdehoy deja de llamar a API2 `getChatMessages` |
| **Alta** | 2. Endpoint de **whitelabel** (recomendado) | AppBodasdehoy deja de llamar a API2 `getWhiteLabelConfig` |
| **Media** | 3. Aclarar **alcance** para Copilot (auth, billing, wallet) | Saber qué migrar en Copilot/LobeChat |

Cuando api-ia implemente 1 y 2, el front solo tendrá que configurar variables de entorno; no hará falta cambiar código.

---

## 1. Endpoint de historial de chat (prioridad alta)

**Necesidad:** El front llama hoy a API2 `getChatMessages(sessionId, limit)` para mostrar el historial del Copilot. Debe dejar de hacerlo.

**Lo que api-ia debe exponer:**

| Campo | Especificación |
|------|----------------|
| **Método y ruta** | `GET /webapi/chat/history` (o la ruta que prefiráis) |
| **Query params** | `sessionId` (obligatorio), `limit` (opcional, default 50) |
| **Headers** | `Authorization: Bearer <JWT>`, `X-Development` (ej. `bodasdehoy`) |
| **Respuesta 200** | `{ "messages": [ { "id", "role", "content", "createdAt", "metadata?" } ] }` |

El formato de cada mensaje debe ser compatible con el que devuelve hoy API2 `getChatMessages` (para no cambiar el front). Api-ia puede obtener los datos llamando internamente a API2 o desde vuestro almacén.

**Cuando esté listo:** El front configurará `API_IA_CHAT_HISTORY_URL` (ej. `https://api-ia.bodasdehoy.com/webapi/chat/history`) y dejará de llamar a API2 para historial.

---

## 2. Endpoint de whitelabel (prioridad alta – recomendado)

**Necesidad:** Cuando el backend de chat (api-ia) no responde, el front intenta un fallback y hoy pide a API2 `getWhiteLabelConfig(development, supportKey)` para obtener la API key de IA. El front no debe llamar a API2.

**Recomendamos:** Que api-ia exponga un endpoint que devuelva la config whitelabel (api-ia puede llamar a API2 por detrás).

**Lo que api-ia debe exponer (Opción B):**

| Campo | Especificación |
|------|----------------|
| **Método y ruta** | `GET /webapi/config/whitelabel` (o la ruta que prefiráis) |
| **Query params** | `development` (obligatorio), ej. `bodasdehoy`, `eventosorganizador` |
| **Headers** | `Authorization: Bearer <JWT>`, `X-Development` |
| **Respuesta 200** | JSON con al menos la clave de API. El front acepta: |
| | • `apiKey` o `aiApiKey` (obligatorio) |
| | • `model` o `aiModel` (opcional; default en front: `gpt-4o-mini`) |
| | • `provider` o `aiProvider` (opcional; default en front: `openai`) |
| **Ejemplo** | `{ "aiApiKey": "sk-...", "aiModel": "gpt-4o-mini", "aiProvider": "openai" }` |

**Cuando esté listo:** El front configurará `API_IA_WHITELABEL_URL` (ej. `https://api-ia.bodasdehoy.com/webapi/config/whitelabel`) y dejará de llamar a API2 para whitelabel.

*Alternativa (Opción A):* Si no exponéis este endpoint, el front puede configurarse con `SKIP_WHITELABEL_VIA_API2=true` y en ese caso no llamará a API2 pero devolverá “Servicio no disponible” cuando api-ia falle (sin fallback a otro proveedor).

---

## 3. Copilot / LobeChat – alcance (prioridad media)

En **Copilot/LobeChat** el front llama hoy a API2 para: auth (JWT, login), facturación (invoices), wallet, invite tokens, credenciales IA, sesiones/chat, whitelabel. El diseño objetivo es que **esas llamadas no existan** y que lo que corresponda esté en api-ia.

**Petición de aclaración:**

1. ¿api-ia debe ser el **único** backend que el front de Copilot use (auth, billing, wallet, historial, sesiones), o solo lo “de IA” (chat, historial, credenciales)? Si es solo “de IA”, ¿quién expone auth/billing/wallet?
2. ¿Hay o habrá en api-ia un flujo de **login / intercambio de token** (p. ej. Firebase → JWT) para que el front no llame a API2 para auth?
3. **Billing / wallet / invoices:** ¿Los debe exponer api-ia (proxy a API2) o se mantienen en API2 y el front de Copilot sigue llamando a API2 solo para eso?

Con esa confirmación el front podrá planificar la migración (ver listado completo en `docs/LISTADO-LLAMADAS-API2-AUDITORIA.md`).

---

## Checklist para api-ia (Fase 1 – AppBodasdehoy)

- [ ] **1.1** Implementar `GET /webapi/chat/history?sessionId=...&limit=...` con respuesta `{ "messages": [ ... ] }` y headers `Authorization`, `X-Development`.
- [ ] **1.2** Implementar `GET /webapi/config/whitelabel?development=...` con respuesta JSON (`aiApiKey`/`apiKey` y opcionalmente `aiModel`, `aiProvider`) y headers `Authorization`, `X-Development`.
- [ ] Comunicar al front las URLs base (ej. `https://api-ia.bodasdehoy.com`) para que configuren `API_IA_CHAT_HISTORY_URL` y `API_IA_WHITELABEL_URL`.

---

## Referencias en el repo

- **Informe detallado:** `docs/INFORME-BACKEND-API-IA-IMPLEMENTAR.md`
- **Listado de llamadas a API2 (auditoría):** `docs/LISTADO-LLAMADAS-API2-AUDITORIA.md`
- **Despliegue app-test:** `docs/DESPLIEGUE-APP-TEST-COPILOT.md`

Cuando los endpoints estén listos, el front solo tendrá que definir las variables de entorno indicadas; no hará falta cambiar código.
