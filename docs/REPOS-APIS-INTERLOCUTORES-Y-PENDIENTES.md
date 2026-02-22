# Repos front, APIs a las que nos conectamos e interlocutores

**Principio:** Nosotros (Front) **no tenemos comunicación con API2**. Para Copilot y todo lo que pase por api-ia, el **interlocutor es api-ia** (#copilot-api-ia). Si hay que reclamar o pedir algo que dependa de API2, **se lo pedimos a api-ia**; api-ia es quien coordina con API2 o con el componente que corresponda. App Bodas (web) además se conecta a **otras APIs** (api.bodasdehoy, apiapp.bodasdehoy, etc.) con **otro proveedor** y **no hay canal de comunicación** con ese proveedor.

---

## 1. Nuestros repos y componentes front

| Repo / app | Qué es | Dónde está |
|------------|--------|------------|
| **apps/copilot** | Copilot (LobeChat): chat IA, sidebar, mensajería, EventSelector, /messages | Monorepo AppBodasdehoy.com |
| **apps/web** | App Bodasdehoy: páginas bodas, invitados, presupuesto, proxy chat Copilot | Mismo monorepo |
| **packages/memories** + **apps/memories-standalone** | Memorias / Momentos | Mismo monorepo |
| **packages/wedding-creator** + **apps/creador-standalone** | Creador de webs de boda | Mismo monorepo |

Cuando hay un error, **afecta a uno o varios de estos**. Al reclamar a api-ia indicamos qué componente se ve afectado (p. ej. "chat en Copilot", "proxy chat en web").

---

## 2. A qué API se conecta cada uno y quién es el interlocutor

### 2.1 apps/copilot (LobeChat)

| API / servicio | URL / uso | ¿Llamada directa desde nuestro código? | Interlocutor (canal) |
|----------------|-----------|----------------------------------------|----------------------|
| **api-ia** | api-ia.bodasdehoy.com: /webapi/chat/auto, /webapi/chat/[provider], /health, storage, save-user-config | **Sí** (backend Copilot hace proxy a api-ia) | **api-ia** (#copilot-api-ia) |
| **API2** | api2.eventosorganizador.com/graphql: auth (login Google/JWT), whitelabel, getUserProfile, getSessions, eventos, getUserByEmail | **Sí** (llamadas directas desde Copilot al GraphQL de API2) | **No tenemos canal con API2.** Cualquier problema o petición lo elevamos a **api-ia**; ellos hablan con API2 si toca. |

**Conclusión Copilot:** Todo lo que reclamamos o pedimos (chat, stream, provider, contexto, 402, etc.) **va a api-ia**. Si el fallo o la respuesta depende de API2 (p. ej. credenciales whitelabel, payment_url en 402), **se lo pedimos igual a api-ia**; ellos son nuestro único interlocutor y coordinan con API2.

### 2.2 apps/web (App Bodasdehoy)

| API / servicio | URL / uso | ¿Llamada directa? | Interlocutor (canal) |
|----------------|-----------|--------------------|----------------------|
| **api-ia** | Solo para chat Copilot: proxy en /api/copilot/chat → api-ia.bodasdehoy.com | **Sí** (el proxy de web llama a api-ia) | **api-ia** (#copilot-api-ia) para todo lo del chat Copilot. |
| **API2** | api2.eventosorganizador.com/graphql (api.js, chat.ts): GraphQL legacy, whitelabel fallback | **Sí** (web puede llamar a API2 en algunos flujos) | **No tenemos canal con API2.** Cualquier petición o fallo → **api-ia**. |
| **api.bodasdehoy.com** | Auth, usuarios, sesiones (NEXT_PUBLIC_BASE_API_BODAS). Proxy en dev: /api/proxy-bodas/graphql | **Sí** | **No hay canal de comunicación** con este proveedor desde este repo. |
| **apiapp.bodasdehoy.com** | Eventos, invitados, presupuestos (NEXT_PUBLIC_BASE_URL). Proxy en dev: /api/proxy/graphql | **Sí** | **No hay canal de comunicación** con este proveedor desde este repo. |
| **api-convert.bodasdehoy.com** | Generación PDF (url-to-pdf) | **Sí** | **No hay canal** desde este repo. |

**Conclusión web:** Para **chat Copilot** (proxy a api-ia) el interlocutor es **api-ia**. Para **API2** (si web lo usa) no tenemos canal → **api-ia**. Para **api.bodasdehoy / apiapp.bodasdehoy / api-convert** estamos conectados pero **no hay canal de comunicación** con ese proveedor; si hay error en esa ruta, no tenemos a quién reclamar por Slack desde este documento.

### 2.3 Llamadas directas a API2 desde nuestro código (resumen)

| Origen | Qué llama a API2 |
|--------|-------------------|
| **apps/copilot** | GraphQL: login (Google/JWT), whitelabel, getUserProfile, getSessions, eventos, getUserByEmail (api2/client, api2/auth, login-with-google, login-with-jwt, externalChat, developmentDetector). |
| **apps/web** | api.js: API2_GRAPHQL_LEGACY (GraphQL). chat.ts: API2_GRAPHQL_URL como fallback whitelabel. |

**Importante:** Que haya **llamadas directas** (HTTP/GraphQL) a API2 desde nuestro código **no** significa que tengamos **canal de comunicación** con el equipo API2. No lo tenemos. Cualquier petición, fallo o reclamación relacionada con API2 **la hacemos a api-ia**; api-ia es quien tiene que responder o coordinar con API2.

---

## 3. Quién tiene que responder según la API con la que falla

| Si el fallo viene de / depende de | Quién nos tiene que responder | Cómo lo hacemos nosotros |
|-----------------------------------|------------------------------|---------------------------|
| **api-ia** (chat, stream, provider, modelos, workers, health) | **api-ia** | Reclamar en #copilot-api-ia. |
| **API2** (402 sin payment_url, credenciales whitelabel, planes, GraphQL auth/eventos) | **api-ia** (como interlocutor; ellos con API2) | Reclamar en #copilot-api-ia y dejar claro que depende de API2; api-ia coordina con API2. |
| **api.bodasdehoy / apiapp.bodasdehoy / api-convert** (App Bodas, otra API ya probada) | **No hay canal** desde este repo | No tenemos interlocutor en #copilot-api-ia para esta ruta; es otro proveedor. |

La respuesta nos viene **en función de la API con la que queremos conectarnos**: nosotros nos conectamos a **api-ia** (y en código también a API2 y a api/apiapp). Solo con **api-ia** tenemos canal (#copilot-api-ia). Por tanto, **todo lo que reclamamos o pedimos** (salvo lo que sea 100% del otro proveedor sin canal) **pasa por api-ia**; si toca que api-ia hable con API2, lo hacen ellos.

---

## 4. Re-análisis de pendientes sabiendo esto

### 4.1 Todo lo que pedimos va a api-ia (no a API2 directo)

- Fix **stream=true** (NO_PROVIDERS_AVAILABLE) → **api-ia** (lógica suya).
- Fix **provider/modelo** (anthropic + deepseek-chat) → **api-ia** (y ellos con API2/whitelabel si las keys vienen de ahí).
- **Contexto de usuario/evento** en chat (JWT, evento activo) → **api-ia** (y ellos con API2 si el contexto viene de API2).
- **payment_url / upgrade_url en 402** → Depende de **API2**; lo pedimos a **api-ia** y que nos avisen cuando API2 lo exponga.
- **GET /webapi/models/anthropic** vacío, **worker improve_text** → **api-ia** (registro modelos, Celery).
- **Cola de campañas** → **api-ia** (y ellos con API2); nos avisan cuando podamos re-probar.
- Catálogo de planes, cambiar plan, wallet, multinivel, etc. → Depende de **API2**; lo pedimos a **api-ia** para que lo trasladen a API2.

Ninguna de estas peticiones la hacemos "a API2" por canal nuestro; **todas** las hacemos **a api-ia**.

### 4.2 Qué componente/repo front afecta cada pendiente

| Pendiente | Repo / componente afectado |
|-----------|----------------------------|
| Chat 503, stream=true, NO_PROVIDERS_AVAILABLE, provider/modelo | **apps/copilot** (chat UI) y **apps/web** (proxy /api/copilot/chat) |
| Contexto usuario/evento en respuestas del chat | **apps/copilot** (el usuario escribe en Copilot) |
| 402 sin payment_url / con payment_url cuando exista | **apps/copilot** (cliente) y **apps/web** (proxy chat) |
| Worker improve_text (/api/ai/improve) | **apps/copilot** (si alguna pantalla usa improve) |
| Cola de campañas | **apps/copilot** (admin campañas, EventSelector) |
| Planes, facturación, wallet, multinivel | **apps/copilot** (Facturación / Copilot) |

Si hay un error en una de estas áreas, al reclamar a api-ia podemos decir: "Afecta a Copilot (chat)" o "Afecta al proxy de web (chat)" o "Afecta a Copilot (Facturación)", etc.

### 4.3 Resumen una línea

- **Repos front:** apps/copilot, apps/web, memories, creador (y standalones).
- **Interlocutor único para reclamar:** **api-ia** (#copilot-api-ia). No tenemos comunicación con API2 ni con el proveedor de api/apiapp.
- **Sí hay llamadas directas en código a API2** (Copilot y web), pero **no hay canal con API2**; todo lo que dependa de API2 **se lo pedimos a api-ia**.
- **App Bodas** se conecta además a **otra API** (api.bodasdehoy, apiapp.bodasdehoy, etc.) con otro proveedor y **no hay canal de comunicación** para esa ruta en este repo.
