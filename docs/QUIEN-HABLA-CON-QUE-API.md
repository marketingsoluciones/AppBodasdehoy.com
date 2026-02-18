# Quién habla con qué API

**Resumen:** Nosotros (frontend / Copilot) **no** hablamos con api2.eventosorganizador.com para el flujo normal. Hablamos con **api-ia** o, si es App Bodas (auth/datos), con **api.bodasdehoy.com**.

---

## 1. Flujo normal (quién llama a qué)

| Quién | Habla con | URL / uso |
|-------|-----------|-----------|
| **Copilot (LobeChat)** | **api-ia** | `https://api-ia.bodasdehoy.com` — chat (/webapi/chat/auto), config, auth identify-user, etc. |
| **App Bodas (web)** | **api-ia** | Mismo: chat va por `/api/copilot/chat` → proxy a `api-ia.bodasdehoy.com`. |
| **App Bodas (web)** | **api.bodasdehoy.com** | Auth, usuarios, sesiones, GraphQL de la app (proxy-bodas/graphql → api.bodasdehoy.com). |
| **Nosotros** | **api2.eventosorganizador.com** | **No** en el flujo principal. Solo en fallback/legacy (ver abajo). |

---

## 2. Conclusión

- **Chat / IA:** siempre **api-ia.bodasdehoy.com** (no API2).
- **App Bodas (auth, eventos):** **api.bodasdehoy.com** (no API2).
- **api2.eventosorganizador.com** no es nuestro backend; es de otro producto (eventosorganizador). En nuestro código solo aparece en:
  - Fallback de whitelabel en `apps/web/pages/api/copilot/chat.ts` (si api-ia falla y se pide getWhiteLabelConfig a API2).
  - Historial en `chat-history.ts` si no está definido `API_IA_CHAT_HISTORY_URL` (entonces se usa API2 como respaldo).
  - Algún proxy/legacy en `api.js` / `pages/api/proxy/graphql.ts` (NEXT_PUBLIC_BASE_URL puede apuntar a API2 en algunos entornos; en App Bodas el objetivo es usar apiapp.bodasdehoy.com / api.bodasdehoy.com).

---

## 3. Referencias en código

- Chat → api-ia: `apps/web/pages/api/copilot/chat.ts` (PYTHON_BACKEND_URL), `apps/copilot/src/app/(backend)/webapi/chat/[provider]/route.ts`.
- App Bodas auth → api.bodasdehoy.com: `apps/web/pages/api/proxy-bodas/graphql.ts`, `api.js` (bodasApiUrl), `NEXT_PUBLIC_BASE_API_BODAS`.
- API2 solo fallback/legacy: `API2_GRAPHQL_URL` en chat.ts (getWhitelabelApiKey), chat-history.ts, api.js.
