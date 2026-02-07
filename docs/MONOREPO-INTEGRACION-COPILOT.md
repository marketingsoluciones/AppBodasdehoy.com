# Monorepo e integración del Copilot (AppBodasdehoy + LobeChat)

## Estado

| Funcionalidad | Estado |
|---------------|--------|
| Chat como componentes (CopilotEmbed) | ✅ |
| SessionId + historial (onLoadHistory → API2 getChatMessages + fallback /api/chat/messages) | ✅ |
| Eventos enriquecidos (progress, tool_result, event_card con botones, usage) | ✅ |
| Botón Cancelar durante streaming | ✅ |
| Tests (copilotChat, API chat/chat-history, handler /api/copilot/chat, copilotMetrics; fixtures datos reales) | ✅ `pnpm test:web` |
| Historial: api-ia (si `API_IA_CHAT_HISTORY_URL`) o API2 vía /api/copilot/chat-history; fallback store en memoria | ✅ |
| Whitelabel: api-ia Opción B (si `API_IA_WHITELABEL_URL`) o API2; opción A con `SKIP_WHITELABEL_VIA_API2` | ✅ |
| SessionId estable (user_uid / guest) | ✅ |
| Métricas: enganche en utils/copilotMetrics (setCopilotMetricsReporter para analítica) | ✅ |
| Checklist despliegue app-test | ✅ docs/DESPLIEGUE-APP-TEST-COPILOT.md |

---

## Resumen

- **Todo está en un solo monorepo**: **AppBodasdehoy** (app web) y **LobeChat** (copilot).
- Son **dos aplicaciones** en el mismo repo: `apps/web` y `apps/copilot`.
- La **integración por defecto** es **con componentes, sin iframe**: la app web muestra el Copilot en un **panel lateral** (ChatSidebar) usando **CopilotEmbed** (`@bodasdehoy/copilot-ui`). El chat se renderiza como componentes React en la misma ventana y llama a la API de la web (`/api/copilot/chat`), que hace proxy al backend de IA. **Una sola ventana, mismo repo, sin iframe.**
- Opcionalmente se puede usar **CopilotDirect** (iframe que carga la app del copilot en chat-test o localhost:3210) si se requiere la UI completa de LobeChat en iframe.

---

## Estructura del monorepo

```
AppBodasdehoy.com (raíz)
├── apps/
│   ├── web/          ← AppBodasdehoy (organizador: eventos, itinerario, invitados, etc.)
│   └── copilot/      ← LobeChat (IA / Copilot)
├── packages/
│   ├── copilot-ui/   ← Componentes compartidos para mostrar el Copilot en la web (ej. CopilotDirect)
│   └── shared/       ← Otros shared
└── pnpm-workspace.yaml
```

- **apps/web**: Next.js, es la app principal del organizador (bodas, eventos).
- **apps/copilot**: Next.js, es LobeChat (el chat con IA).
- **packages/copilot-ui**: componentes que la web usa para mostrar el Copilot: **CopilotEmbed** (chat como componentes, sin iframe, por defecto) y **CopilotDirect** (carga la app del copilot en iframe, opcional).

---

## Cómo está integrado hoy (componentes, sin iframe)

1. El usuario entra en **app-test** (o en local `http://127.0.0.1:8080`).
2. La app web renderiza el **ChatSidebar** con **CopilotEmbed** (`@bodasdehoy/copilot-ui`).
3. **CopilotEmbed** renderiza el chat como componentes React (lista de mensajes + input) y envía los mensajes con **sendMessage**, que la web inyecta y que llama a `sendChatMessage` del servicio `copilotChat`. Ese servicio usa la API local `/api/copilot/chat` (proxy al backend de IA).
4. El usuario ve **una sola ventana**: contenido de la app (eventos, etc.) + panel del Copilot como parte del mismo DOM, sin iframe.

Integración = monorepo + componentes compartidos + misma API; el canal técnico es la función **sendMessage** y la API `/api/copilot/chat`.

---

## app-test y chat-test

- **app-test** = despliegue de `apps/web`. Con **CopilotEmbed** (por defecto) el Copilot va por `/api/copilot/chat` (proxy a api-ia); **no se usa iframe**.
- **chat-test** = despliegue de `apps/copilot`. Solo necesario si se usa **CopilotDirect** (iframe). Con embed, app-test no depende de chat-test.
- Detalles de despliegue: **docs/DESPLIEGUE-APP-TEST-COPILOT.md**. Si usas iframe: **MONOREPO-APP-TEST-CHAT-TEST.md**.

---

## Integración con componentes (sin iframe)

- **Por defecto**: integración = monorepo + **CopilotEmbed** (chat como componentes React en la app web). Sin iframe; la web inyecta **sendMessage** que llama a `/api/copilot/chat`.
- **Opcional**: **CopilotDirect** sigue disponible si se quiere cargar la app completa del copilot (LobeChat) en iframe (chat-test o localhost:3210). En `ChatSidebarDirect` se puede cambiar el import a `CopilotDirect` y sustituir el bloque de `CopilotEmbed` por el de `CopilotDirect` con las props que ya tenía (sin `sendMessage`/`onLoadHistory`); ver `packages/copilot-ui/README.md`.
- El monorepo es la base: AppBodasdehoy y LobeChat en un solo repo; la experiencia principal del Copilot en la web es ya integrada con componentes.

---

## Siguientes pasos

**Lista detallada (inmediatos, corto y medio plazo):** ver **docs/PLAN-COPILOT-MONOREPO.md** → sección **12. Siguientes pasos**.

### Resumen rápido

- **Inmediatos**: instalar (`pnpm install`; sin deps los tests fallan con "jest not found"), ejecutar tests (`pnpm test:web`), probar en local (`pnpm dev:web:local`), comprobar historial y confirmar con backend que api-ia y API2 están accesibles. **Si aún no podéis probar en el navegador:** ver **docs/PROBAR-SIN-NAVEGADOR.md** (tests como verificación principal; opcionalmente curl cuando tengáis servidor).
- **Corto plazo**: desplegar app-test con variables correctas; recomendar al backend **Opción B** (whitelabel vía api-ia con `API_IA_WHITELABEL_URL`); opcionalmente mejorar UI de `event_card` y fallback de historial si API2 falla.
- **Medio plazo**: métricas en front (si se requiere); ajuste si API2 cambia la query de historial.

### Ya implementado

- **Historial:** Si está definida `API_IA_CHAT_HISTORY_URL`, el front llama a api-ia (GET) y no a API2. Si no, fallback a API2 `getChatMessages`. `GET /api/copilot/chat-history` → api-ia o API2. El backend guarda en API2 al finalizar el stream; el front no persiste en Next.
- **Whitelabel:** Si está definida `API_IA_WHITELABEL_URL` (Opción B), el front solo llama a api-ia para credenciales y no a API2. Si no, usa API2 o `SKIP_WHITELABEL_VIA_API2=true` para no llamar a API2 (503 si api-ia falla).
- SessionId estable: `user_<uid>` o `guest_*`.
- Eventos enriquecidos en el embed: progress, tool_result, event_card, usage, etc.
- Registro por mensaje: `console.debug` (sustituible por analítica cuando se requiera).

### No aplica

- **Feature flag iframe vs embed**: la integración recomendada es **embed en monorepo**. Si se necesitara iframe (CopilotDirect), se cambia en `ChatSidebarDirect` según `packages/copilot-ui/README.md`.

### Preguntas al backend / Informes api-ia

- **Preguntas**: **docs/PREGUNTAS-BACKEND-COPILOT.md**
- **Resumen de necesidades api-ia** (para compartir): **docs/INFORME-API-IA-RESUMEN-NECESIDADES.md**
- **Informe detallado backend**: **docs/INFORME-BACKEND-API-IA-IMPLEMENTAR.md**
- **Análisis de la respuesta** (api-ia): **docs/ANALISIS-RESPUESTA-BACKEND-COPILOT.md**

---

## Verificación rápida (solo web + embed)

Para probar la integración sin levantar el copilot (LobeChat):

```bash
# Desde la raíz del monorepo
pnpm dev:web:local
# Abre http://127.0.0.1:8080 (o app-test si tienes hosts), inicia sesión, abre el panel del Copilot.
# El chat usa componentes (CopilotEmbed) y llama a /api/copilot/chat. Si el backend IA no está, verás mensaje de error al enviar; la UI del embed funciona igual.
```

Comprobar que la API de historial responde:

```bash
curl -s "http://127.0.0.1:8080/api/chat/messages?sessionId=test123"
# Esperado: {"messages":[]}
```
