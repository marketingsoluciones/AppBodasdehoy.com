# Opción A — Chat propio ligero y modular (sin perder funcionalidad)

> Requisitos del usuario (2026-06-03): (1) NO perder NADA de funcionalidad actual.
> (2) Máxima modularidad — componentes integrables/reutilizables en otras apps.
> Reemplazar el fork LobeChat (357 deps, 40k módulos, no compila) por arquitectura propia ligera.

## 1. Inventario de funcionalidad ACTUAL (lo que NO se puede perder)

### Rutas en uso (sidebar real)
| Ruta | ¿Propia/usada? | Destino en arquitectura modular |
|---|---|---|
| `/chat` | ✅ CORE | App chat ligera (la nueva) |
| `/messages` (inbox unificado) | ✅ usada (rama inbox-fase1) | Módulo `messaging` |
| `/memories` | ✅ ya es package | `@bodasdehoy/memories` (ya existe) |
| `/wedding-creator` | ✅ ya es package | `@bodasdehoy/wedding-creator` (ya existe) |
| `/admin` | ✅ usada | Módulo `admin` |
| `/files` | ✅ usada (gestor archivos) | Módulo `files` (acoplado a knowledge, desacoplar) |
| `/image` standalone | ⚠️ extraer a módulo visor genérico | Módulo `image-viewer` |
| `/discover` | ❌ genérico LobeChat, no usado | Eliminar (marketplace propio a futuro) |
| `/knowledge` | ❌ redundante (api-mcp ya lo tiene) | Eliminar (cliente de /mcp/kb) |

### Chat core (slices store que SÍ se usan)
- `aiChat` (streaming IA), `externalChat` (vuestro sistema), `message`, `topic`, `thread`,
  `builtinTool`, `translate`, `tts`. → TODO esto se preserva en la app ligera.

### Builtin tools PROPIAS (críticas, NO perder)
- **Propias:** `filter-app-view`, `venue-visualizer`, `floor-plan-editor` (dominio bodas)
- **LobeChat útiles:** `dalle` (img en chat), `code-interpreter`, `web-browsing`, `artifacts`
- → El sistema de builtin tools se preserva (es el valor del chat con contexto de app).

## 1.b HALLAZGO de la revisión de diseño (2026-06-03) — afina el diagnóstico

Verificado contra el código real (no supuestos):
- copilot-shared NO es 100% independiente: usa `@lobehub/ui` (10) + `@lobehub/editor` (13).
- **PERO** appEventos YA usa `@lobehub/ui` + `@lobehub/editor` + copilot-shared **y COMPILA BIEN**
  (1.032 archivos, 118 deps, arranca :3220). → **@lobehub/ui NO es el problema.**
- **El peso real exclusivo de chat-ia** = infraestructura LobeChat que NO usáis (tenéis api-ia/api-mcp):
  `@electric-sql/pglite` (BD local navegador), `drizzle-orm/kit/zod/dbml` (ORM, 4 pkgs),
  `@trpc/client/server/react-query` (3 pkgs), `@lobechat/database`, `@lobechat/context-engine`,
  `@lobechat/model-runtime`, `@lobechat/electron-client-ipc`, `@modelcontextprotocol/sdk`,
  `ollama`, `@react-pdf/renderer`, ...

**CONCLUSIÓN REFINADA:** el problema NO es la UI del chat (ya modular, funciona en appEventos).
Es la **capa de infraestructura LobeChat** (BD local pglite+drizzle, tRPC, context-engine,
model-runtime local) que la app standalone arrastra y que es REDUNDANTE con vuestro backend.
→ La Opción A no es "reescribir el chat", es "quitar la infra LobeChat que no se usa y dejar
el chat como cliente puro de api-ia/api-mcp (que ya es como funciona el chat embebido)".
La UI ya está probada en appEventos (eso reduce riesgo del lado UI).

### ⚠️ PERO — corrección de honestidad (verificado): el desacople NO es trivial
- **126 archivos** de chat-ia aún usan la BD local (drizzle/pglite/`@/database`).
- `store/chat` está MIXTO: parte tRPC (5), parte api propia (6). La migración a "thin proxy
  de api-ia" que la memoria menciona quedó **A MEDIAS**.
- → Quitar la infra LobeChat = desacoplar 126 archivos de drizzle/pglite + completar la
  migración del store a api-ia. Es trabajo SUSTANCIAL (no "menos del estimado"). Sigue siendo
  la dirección correcta, pero confirma: SEMANAS, no días. La parte UI es segura; la parte
  data-layer (126 archivos) es la pesada y delicada.

## 2. Lo que YA está modularizado (reutilizar, no reescribir)

`packages/copilot-shared` (111 archivos) YA exporta, SIN deps de LobeChat:
- UI: `ChatItem`, `MessageList`, `InputEditor`, `CopilotChatInput`
- Estado: `ChatInputProvider`, `useChatInputStore`, hooks
- `copilotTheme`, i18n
→ appEventos YA lo usa (CopilotEmbed). **Es la base de la app ligera.** Funciona, compila.

`packages/memories`, `packages/wedding-creator`, `packages/shared` → ya autónomos.

## 3. Arquitectura objetivo (modular)

```
packages/
  copilot-shared/      ← UI chat (YA existe) — ChatItem, MessageList, InputEditor
  copilot-core/        ← NUEVO: lógica chat (slices aiChat/message/topic/thread sin LobeChat)
  copilot-tools/       ← NUEVO: builtin tools (filter-app-view, venue-visualizer, etc.)
  image-viewer/        ← NUEVO: visor de imágenes genérico (cualquier agente IA)
  messaging/           ← NUEVO (o existente inbox): mensajería unificada
  memories/            ← ya existe
  wedding-creator/     ← ya existe
apps/
  chat-ia-lite/        ← NUEVO: app chat standalone MÍNIMA (compone los packages)
                          mantiene la experiencia ChatGPT/Claude (usabilidad pedida)
  appEventos/          ← embebe copilot-shared + copilot-core (ya lo hace parcial)
```

**Principio:** cada capacidad es un package reutilizable. La app `chat-ia-lite` solo COMPONE
packages, no contiene lógica pesada. Otras apps importan los packages que necesiten.

## 4. Estrategia de migración (sin perder nada, incremental)

NO es "tirar chat-ia y empezar de cero" (eso perdería funcionalidad). Es EXTRAER incrementalmente:

1. **Fase 0 — Congelar el fork** (parar de optimizar, es lo que lo rompió). Dejarlo como
   referencia funcional para no perder nada al migrar.
2. **Fase 1 — Extraer lógica del chat** a `copilot-core` (slices aiChat/message/topic),
   verificando contra el fork que el comportamiento es idéntico.
3. **Fase 2 — Extraer builtin tools** a `copilot-tools`.
4. **Fase 3 — Crear `chat-ia-lite`** que compone copilot-shared + copilot-core + copilot-tools.
   Validar que tiene TODA la funcionalidad del chat actual (paridad).
5. **Fase 4 — Migrar rutas usadas** (messages, admin, files) como módulos.
6. **Fase 5 — Cuando chat-ia-lite tenga paridad total**, jubilar el fork pesado.

Cada fase: el fork sigue funcionando como respaldo hasta que lite tenga paridad. CERO pérdida.

## 5. Beneficio esperado
- Compila en segundos (no 40k módulos / no tumba máquinas).
- Cada componente reutilizable en cualquier app del monorepo.
- Mantenible (deps propias, no 357 de LobeChat).
- Sin perder funcionalidad (migración por paridad, no borrado).

## 6. Coste y riesgo (honesto)
- **Coste:** semanas (varias sesiones por fase). NO es un fin de semana.
- **Riesgo:** medio — mitigado por mantener el fork como respaldo hasta paridad.
- **Lo que NO hacer:** reescribir de golpe, perder el fork antes de tener paridad.

## 7. Decisión pendiente del usuario
- ¿Empezar por Fase 1 (extraer copilot-core) ya, o validar primero este diseño?
- ¿La app ligera se llama chat-ia-lite o reemplaza in-place a chat-ia cuando tenga paridad?
