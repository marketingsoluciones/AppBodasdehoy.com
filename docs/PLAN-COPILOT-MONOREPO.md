# Plan detallado: Monorepo e integración Copilot

Plan paso a paso del monorepo (AppBodasdehoy + LobeChat), integración del Copilot sin iframe y alineación con el backend (api-ia / API2).

**Resumen ejecutivo**  
✅ Hecho: CopilotEmbed, historial (api-ia si `API_IA_CHAT_HISTORY_URL`; si no, API2) + fallback en memoria, whitelabel Opción B (api-ia si `API_IA_WHITELABEL_URL`; si no, API2 o `SKIP_WHITELABEL_VIA_API2`), event_card con botones, eventos SSE, métricas (enganche), tests (chat-history con api-ia y API2, chat, copilotChat, copilotMetrics), docs (informes api-ia, probar sin navegador).  
⏳ Pendiente: en tu entorno `pnpm install` + `pnpm test:web` (ver docs/PROBAR-SIN-NAVEGADOR.md si no hay navegador), desplegar app-test cuando corresponda; api-ia implemente historial y whitelabel (docs/INFORME-API-IA-RESUMEN-NECESIDADES.md).

---

## Índice

1. [Prerrequisitos y entorno](#1-prerrequisitos-y-entorno)
2. [Estructura del monorepo](#2-estructura-del-monorepo)
3. [Flujo de datos del Copilot (embed)](#3-flujo-de-datos-del-copilot-embed)
4. [Backend: api-ia y API2](#4-backend-api-ia-y-api2)
5. [Pasos de desarrollo (local)](#5-pasos-de-desarrollo-local)
6. [Pasos de verificación y tests](#6-pasos-de-verificación-y-tests)
7. [Historial de chat (API2)](#7-historial-de-chat-api2)
8. [Eventos SSE y UI enriquecida](#8-eventos-sse-y-ui-enriquecida)
9. [Despliegue (app-test / chat-test)](#9-despliegue-app-test--chat-test)
10. [Resolución de problemas](#10-resolución-de-problemas)
11. [Referencia de documentos](#11-referencia-de-documentos)
12. [Siguientes pasos](#12-siguientes-pasos)

---

## 1. Prerrequisitos y entorno

| Paso | Acción | Detalle |
|------|--------|---------|
| 1.1 | Node.js | >= 20.0.0 (ver `package.json` engines). |
| 1.2 | pnpm | 8.15.9 (ver `packageManager` en raíz). |
| 1.3 | Clonar / abrir repo | Raíz = `AppBodasdehoy.com` (monorepo). |
| 1.4 | Variables de entorno (opcional) | Web: `PYTHON_BACKEND_URL`, `API_IA_CHAT_HISTORY_URL`, `API_IA_WHITELABEL_URL` (para no usar API2); `API2_GRAPHQL_URL` solo si API2 tiene otra URL. Ver docs/DESPLIEGUE-APP-TEST-COPILOT.md. |

---

## 2. Estructura del monorepo

| Paso | Elemento | Descripción |
|------|----------|-------------|
| 2.1 | Raíz | `pnpm-workspace.yaml`; scripts en `package.json`: `dev`, `dev:local`, `dev:web`, `dev:web:local`, `dev:copilot`, `test:web`, `build`, etc. |
| 2.2 | `apps/web` | Next.js (organizador: eventos, invitados, itinerario, etc.). Puerto por defecto 8080. **Aquí vive el panel del Copilot (ChatSidebar + CopilotEmbed).** |
| 2.3 | `apps/copilot` | Next.js (LobeChat). Puerto 3210 en `dev:local`. Se usa solo si se opta por **CopilotDirect (iframe)**. |
| 2.4 | `packages/copilot-ui` | Componentes compartidos: **CopilotEmbed** (chat como componentes, sin iframe, recomendado) y **CopilotDirect** (iframe). La web depende de este paquete. |
| 2.5 | `packages/shared` | Otros shared del monorepo. |

**Comandos desde la raíz:**

- `pnpm install` — instalar dependencias de todo el monorepo.
- `pnpm dev:web:local` — solo la web (Copilot embed usa `/api/copilot/chat` → api-ia).
- `pnpm dev:local` — web + copilot en paralelo (útil si se prueba iframe).
- `pnpm test:web` — tests Jest de `apps/web` (copilotChat + API messages/history).

---

## 3. Flujo de datos del Copilot (embed)

| Paso | Quién | Qué hace |
|------|--------|----------|
| 3.1 | Usuario | Abre el panel del Copilot en la web (botón/sidebar). |
| 3.2 | Layout / contexto | Renderiza `ChatSidebarDirect`, que usa `sessionId` estable (`user_<uid>` o `guest_*`). |
| 3.3 | ChatSidebarDirect | Renderiza **CopilotEmbed** con props: `sessionId`, `sendMessage`, `onLoadHistory`, `eventsList`, `userData`, `event`, etc. |
| 3.4 | onLoadHistory | Al montar, si hay `sessionId` y `onLoadHistory`, se llama a `getChatHistory(sessionId)` → `GET /api/copilot/chat-history?sessionId=...` → API2 `getChatMessages` → se rellenan los mensajes en el embed. |
| 3.5 | Usuario escribe y envía | CopilotEmbed llama a `sendMessage(params, onChunk, signal, onEnrichedEvent)`. |
| 3.6 | sendMessage (inyectado) | Sidebar llama a `sendChatMessage(...)` del servicio `copilotChat`, que hace `POST /api/copilot/chat` con body: `messages`, `stream: true`, `metadata` (sessionId, userId, eventId, pageContext, etc.). |
| 3.7 | Next.js `/api/copilot/chat` | Hace proxy al backend **api-ia** (Python), que devuelve stream SSE. |
| 3.8 | api-ia | Procesa el mensaje, llama herramientas si aplica, emite eventos SSE (`event: text`, `event: tool_result`, `event: event_card`, `event: done`, etc.) y al finalizar guarda user + assistant en **API2** (GraphQL mutation interna). |
| 3.9 | Cliente (copilotChat) | Parsea el stream SSE, llama `onChunk` con cada fragmento de texto y `onEnrichedEvent` con cada evento enriquecido. |
| 3.10 | CopilotEmbed | Actualiza mensajes en tiempo real y muestra eventos enriquecidos (progress, tool_result, event_card, usage, etc.) bajo la burbuja del asistente. |

**Resumen:** Usuario → CopilotEmbed → sendMessage → sendChatMessage → `/api/copilot/chat` → api-ia → SSE → cliente parsea → UI. Historial: API2 (getChatMessages) vía `/api/copilot/chat-history`.

---

## 4. Backend: api-ia y API2

**Dos servicios distintos.** API2 **no** es api-ia ni apunta a api-ia: es otro backend (GraphQL de negocio) donde api-ia **escribe** los mensajes y el front actualmente **lee** el historial.

| Paso | Sistema | Rol |
|------|---------|-----|
| 4.1 | **api-ia** (Python) | Backend de IA. Recibe chat vía proxy Next.js; hace el modelo, herramientas, streaming SSE; **guarda** los mensajes llamando a **API2** (mutation) al recibir `event: done`. URL: `PYTHON_BACKEND_URL`. |
| 4.2 | **API2** (GraphQL) | Servicio **separado** (api2.eventosorganizador.com). api-ia **escribe** ahí; el front **lee** historial con `getChatMessages(sessionId, limit)`. URL: `API2_GRAPHQL_URL` o la por defecto. |
| 4.3 | ¿Todo por api-ia? | Si api-ia expusiera un endpoint “dame historial” que internamente llame a API2, el front **solo** necesitaría `PYTHON_BACKEND_URL` y no hablaría con API2. Hoy no existe ese endpoint; por eso el front llama a API2 para historial. Ver **docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md** (pregunta opcional a api-ia). |
| 4.4 | Headers | Para api-ia y para API2: `Authorization: Bearer <JWT>`, `X-Development`, `Content-Type: application/json`. |
| 4.5 | SessionId | Enviado en `metadata.sessionId`. Formato: cualquier UUID único; nosotros usamos `user_<uid>` o `guest_<id>`. |

---

## 5. Pasos de desarrollo (local)

| # | Paso | Comando / acción |
|---|------|-------------------|
| 5.1 | Instalar dependencias | Desde la raíz: `pnpm install`. |
| 5.2 | Levantar solo la web (recomendado para Copilot embed) | `pnpm dev:web:local`. Abre `http://127.0.0.1:8080`. |
| 5.3 | (Opcional) Levantar web + copilot | `pnpm dev:local`. Web en 8080, copilot en 3210. |
| 5.4 | Iniciar sesión en la web | Con usuario de prueba o Firebase. |
| 5.5 | Abrir el panel del Copilot | Botón/sidebar del Copilot en la app. |
| 5.6 | Enviar un mensaje | Comprobar que el input, el streaming y (si api-ia está bien configurado) la respuesta funcionan. Si api-ia no está, se verá mensaje de error pero la UI debe responder (Cancelar, etc.). |
| 5.7 | Comprobar historial | Cerrar y reabrir el panel; si API2 y api-ia guardaron, `onLoadHistory` debería cargar mensajes vía `GET /api/copilot/chat-history`. |

---

## 6. Pasos de verificación y tests

| # | Paso | Comando / acción |
|---|------|-------------------|
| 6.1 | Ejecutar tests de la web | Desde la raíz: `pnpm test:web`. Tests usan **datos reales** (fixtures en `apps/web/__fixtures__/copilot.ts`). Incluye: servicio `copilotChat`, handlers chat/chat-history/messages, **utils/copilotMetrics** (reportCopilotMessageSent, setCopilotMetricsReporter). |
| 6.2 | Script de verificación | `./scripts/verificar-copilot-embed.sh` (ejecuta tests y muestra cómo comprobar APIs en local). |
| 6.3 | Health de la web | `curl -s http://127.0.0.1:8080/api/health` → esperado `{"ok":true,...}`. |
| 6.4 | Historial (store en memoria) | `curl -s 'http://127.0.0.1:8080/api/chat/messages?sessionId=test123'` → `{"messages":[]}` o mensajes si hubo POST. |
| 6.5 | Historial (API2 vía proxy) | Con servidor levantado y token: `curl -s -H "Authorization: Bearer <JWT>" -H "X-Development: bodasdehoy" 'http://127.0.0.1:8080/api/copilot/chat-history?sessionId=user_xxx&limit=50'` → `{"messages":[...]}`. |

---

## 7. Historial de chat (API2)

| # | Paso | Detalle |
|------|------|---------|
| 7.1 | Quién guarda | **api-ia** guarda en API2 al finalizar el stream (`event: done`). El front **no** debe llamar a `persistChatMessage` ni a `POST /api/chat/messages` para no duplicar. |
| 7.2 | Quién lee | El front llama a `getChatHistory(sessionId)` → `GET /api/copilot/chat-history?sessionId=...` → API route hace proxy a API2 GraphQL `getChatMessages(sessionId, limit)` → devuelve `{ messages: [...] }`. |
| 7.3 | Cuándo se carga | Al abrir el panel, CopilotEmbed usa `onLoadHistory(sessionId)` inyectada por el sidebar, que llama a `getChatHistory(sessionId, development)`. |
| 7.4 | SessionId estable | Usuario logueado: `user_<uid>`. Invitado: `guest_<id>` en sessionStorage. Así el historial es estable por sesión/usuario. |
| 7.5 | Fallback | Si API2 falla o no devuelve datos, `/api/copilot/chat-history` devuelve `{ messages: [] }`. Opcionalmente se puede usar `GET /api/chat/messages` (store en memoria en Next) como fallback leyendo desde esa ruta en lugar de chat-history. |

---

## 8. Eventos SSE y UI enriquecida

| # | Paso | Detalle |
|------|------|---------|
| 8.1 | Tipos que reenvía el proxy | En `pages/api/copilot/chat.ts`: `ENRICHED_EVENT_TYPES` incluye tool_result, ui_action, confirm_required, progress, code_output, tool_start, **event_card**, **usage**, **reasoning**. Cualquier línea `event: <tipo>` con tipo en ese set se reenvía al cliente como `event: <tipo>\ndata: <JSON>\n\n`. |
| 8.2 | Tipos que parsea el cliente | En `services/copilotChat.ts`: mismo set de tipos; al parsear el stream se llama `onEnrichedEvent({ type, data })` para cada uno. |
| 8.3 | UI en el embed | CopilotEmbed muestra eventos en `currentEnrichedEvents` bajo la última respuesta: progress (Paso X/Y), tool_result (mensaje + enlace "Ver" si hay url), tool_start, **event_card** (mensaje o nombre de evento), **usage** (tokens/coste). |
| 8.4 | event_card (api-ia) | Incluye `event`, `actions`, `message`. ✅ Implementado: CopilotEmbed muestra botones cuando `actions[]` tiene `url` y `label` (p. ej. "Ver invitados"). |
| 8.5 | event: done | El proxy lo traduce a `data: [DONE]\n\n` y cierra el stream. El backend solo guarda user + assistant cuando llega este evento. |

---

## 9. Despliegue (app-test / chat-test)

| # | Paso | Detalle |
|------|------|---------|
| 9.1 | app-test | Despliegue de `apps/web`. Dominio típico: app-test.bodasdehoy.com. Usuarios usan aquí el Copilot en embed. |
| 9.2 | chat-test | Despliegue de `apps/copilot`. Dominio típico: chat-test.bodasdehoy.com. Solo necesario si se usa **CopilotDirect (iframe)** o el botón "Abrir en nueva pestaña". |
| 9.3 | api-ia | Backend de IA en producción (p. ej. api-ia.bodasdehoy.com). La web debe tener `PYTHON_BACKEND_URL` apuntando a esta URL. |
| 9.4 | API2 | GraphQL en producción (api2.eventosorganizador.com). La ruta `/api/copilot/chat-history` debe poder llamar a API2 (con `API2_GRAPHQL_URL` si aplica). |
| 9.5 | Variables en producción | En el entorno de la web: `PYTHON_BACKEND_URL`, opcionalmente `API2_GRAPHQL_URL`. JWT y headers los aporta el cliente. |

---

## 10. Resolución de problemas

| Síntoma | Comprobar |
|--------|-----------|
| Panel del Copilot en blanco | AuthContext: si `verificationDone` no se pone a true, puede mostrarse carga o blanco. Timeout de seguridad 2s. Revisar que el layout renderice ChatSidebar cuando corresponda. |
| "Servicio IA no disponible" al enviar mensaje | `PYTHON_BACKEND_URL` y que api-ia responda (health, CORS, auth). Ver docs del backend. |
| Historial siempre vacío | 1) SessionId estable (user_ o guest_). 2) Que api-ia esté enviando `event: done` para que guarde en API2. 3) Que `/api/copilot/chat-history` llegue a API2 con JWT y X-Development correctos. 4) Que la query `getChatMessages` exista en API2 y devuelva datos. |
| Tests fallan (jest not found) | 1) Desde la raíz: `pnpm install` (si el lockfile pide actualización: `pnpm install --no-frozen-lockfile`). 2) Luego `pnpm test:web`. En `apps/web` el script usa `pnpm exec jest` para que Jest se resuelva desde las dependencias del workspace. |
| Eventos enriquecidos no se ven | Que el proxy reenvíe los tipos (event_card, usage, etc.) y que el cliente los tenga en ENRICHED_EVENT_TYPES. Revisar que api-ia envíe `event: <tipo>\ndata: ...`. |

---

## 11. Referencia de documentos

| Documento | Contenido |
|-----------|-----------|
| **docs/MONOREPO-INTEGRACION-COPILOT.md** | Estado, resumen, estructura, siguientes pasos, verificación rápida. |
| **docs/ANALISIS-RESPUESTA-BACKEND-COPILOT.md** | Análisis de la respuesta de api-ia: historial, sessionId, API2, SSE, métricas, auth; acciones en el front. |
| **docs/PREGUNTAS-BACKEND-COPILOT.md** | Preguntas enviadas al backend (historial, sessionId, API2, SSE, métricas, auth). |
| **packages/copilot-ui/README.md** | Uso de CopilotEmbed y CopilotDirect, props, ejemplo de código. |
| **scripts/verificar-copilot-embed.sh** | Ejecuta tests y muestra comandos para comprobar APIs en local. |
| **docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md** | Peticiones a api-ia para trabajar solo con datos reales y tests (contratos, ejemplos SSE, entorno de prueba). |
| **docs/DESPLIEGUE-APP-TEST-COPILOT.md** | Checklist de despliegue de app-test con Copilot (variables, build, comprobación). |
| **docs/PROBAR-SIN-NAVEGADOR.md** | Cómo validar (tests + opcional curl) cuando aún no se puede probar en el navegador. |
| **docs/ESTADO-COPILOT-RESUMEN.md** | Resumen rápido: qué está hecho (historial/whitelabel api-ia, tests, docs) y qué falta. |
| **docs/ANALISIS-USO-API2-Y-APIS.md** | Cuándo y por qué se usa API2 vs api-ia vs api.bodasdehoy.com en AppBodasdehoy y en LobeChat. |
| **docs/LISTADO-LLAMADAS-API2-AUDITORIA.md** | **Listado (auditoría)** de todas las llamadas a API2. Diseño objetivo: AppBodasdehoy no usa API2; Copilot/LobeChat no deberían llamar a API2; todo debe ir por api-ia. |
| **docs/INFORME-BACKEND-API-IA-IMPLEMENTAR.md** | **Informe detallado para backend:** qué debe implementar api-ia (historial, whitelabel/fallback, alcance Copilot) para que el front deje de llamar a API2. |
| **docs/INFORME-API-IA-RESUMEN-NECESIDADES.md** | **Resumen para api-ia** (compartir): checklist y contratos de historial + whitelabel Opción B. |

---

## 12. Siguientes pasos

**Estado actual:** Pasos 6, 7 y 8 (UI event_card, fallback historial, métricas) están implementados. Quedan por hacer en tu entorno: ejecutar tests (paso 1), probar en local (2–3), confirmar con backend (4) y desplegar app-test (5) cuando corresponda.

### Inmediatos (esta semana)

| # | Paso | Acción |
|---|------|--------|
| 1 | Verificar tests en local | `pnpm install` (o `pnpm install --no-frozen-lockfile` si el lockfile lo pide) y luego `pnpm test:web`. O ejecutar `./scripts/verificar-copilot-embed.sh`. **Sin navegador:** ver **docs/PROBAR-SIN-NAVEGADOR.md**. |
| 2 | Probar flujo en local | `pnpm dev:web:local` → abrir `http://127.0.0.1:8080` → iniciar sesión → abrir panel Copilot → enviar mensaje. Comprobar que la UI responde y que, si api-ia está disponible, llega la respuesta. |
| 3 | Comprobar historial | Cerrar y reabrir el panel del Copilot; si API2 tiene datos para tu `sessionId`, deberían cargarse vía `GET /api/copilot/chat-history`. |
| 4 | Confirmar con backend | Que api-ia y API2 estén accesibles desde tu entorno (app-test o local con variables correctas: `PYTHON_BACKEND_URL`, `API2_GRAPHQL_URL` si aplica). |

### Corto plazo (próximas semanas)

| # | Paso | Acción |
|---|------|--------|
| 5 | Desplegar app-test | Subir `apps/web` con variables de producción (`PYTHON_BACKEND_URL`, opcionalmente `API_IA_CHAT_HISTORY_URL`, `API_IA_WHITELABEL_URL` para no usar API2). Checklist: **docs/DESPLIEGUE-APP-TEST-COPILOT.md**. Ver sección 9. |
| 6 | ~~(Opcional) UI de event_card~~ | ✅ Implementado: CopilotEmbed muestra botones cuando `event_card` trae `actions[]` con `url` y `label` (p. ej. "Ver invitados", "Añadir otro"). |
| 7 | ~~(Opcional) Fallback de historial~~ | ✅ Implementado: `getChatHistory()` intenta primero `/api/copilot/chat-history`; si falla o no responde ok, usa `GET /api/chat/messages` (store en memoria). |

### Medio plazo (cuando aplique)

| # | Paso | Acción |
|---|------|--------|
| 8 | Métricas en front | ✅ Punto de enganche listo: `utils/copilotMetrics.ts` (`reportCopilotMessageSent`, `setCopilotMetricsReporter`). Por defecto hace console.debug; cuando el producto lo requiera, llamar `setCopilotMetricsReporter(fn)` al arranque para enviar a analítica o backend. |
| 9 | Ajuste si API2 cambia | Si API2 cambia el nombre de la query (p. ej. ya no es `getChatMessages`), actualizar `pages/api/copilot/chat-history.ts` y, si hace falta, el cliente. |

---

## Checklist rápido (orden sugerido)

- [ ] 1. `pnpm install` en la raíz (si hay error de lockfile: `pnpm install --no-frozen-lockfile`).
- [ ] 2. `pnpm test:web` pasa (si falla "jest: command not found", asegurar que el paso 1 terminó bien).
- [ ] 3. `pnpm dev:web:local`; abrir `http://127.0.0.1:8080`.
- [ ] 4. Iniciar sesión, abrir panel Copilot, enviar un mensaje.
- [ ] 5. Comprobar que la respuesta llega (o mensaje de error si api-ia no está).
- [ ] 6. Comprobar que al reabrir el panel se carga historial si API2 tiene datos.
- [ ] 7. (Opcional) Probar evento enriquecido (p. ej. tool_result con url) y que se muestre en el embed.
- [ ] 8. Variables de producción configuradas (`PYTHON_BACKEND_URL`, `API2_GRAPHQL_URL` si aplica).
