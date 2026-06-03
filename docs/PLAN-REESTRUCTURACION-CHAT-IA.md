# Plan de reestructuración chat-ia — hacia arquitectura modular ligera

> Borrador para revisión. Objetivo: que chat-ia deje de ser un monolito LobeChat de
> ~40k módulos (imposible de compilar/buildear en hardware normal) y pase a una
> arquitectura modular donde el chat es un **componente embebible** y cada capacidad
> (image, marketplace, knowledge) es un **módulo independiente** que se integra cuando
> se necesita. NO es reescribir desde cero — es continuar lo ya empezado.

## 1. El problema (medido)

- `/chat` compila **~40.418 módulos**. Causa de: build de prod = OOM (heap), dev = ~10min/ruta.
- Verificado que NO se arregla por config (turbopack rompe, optimizePackageImports/modularizeImports = 0% mejora, quitar mermaid de transpile = 10% tiempo solo).
- La causa es **estructural**: chat-ia es un fork de LobeChat con TODAS sus features dentro,
  muchas no usadas, arrastrando dependencias gigantes (mermaid 65MB, shiki, katex, cytoscape,
  langchain loaders, marketplace, etc.).

## 2. La visión (del usuario, 2026-06-03)

El valor real del chat-IA = **"chat con contexto de la app que interactúa con ella"**
(el patrón CopilotEmbed), llevable a las demás apps como **componente reutilizable**.
NO un monolito que lo contiene todo.

| Capacidad | Decisión arquitectónica |
|---|---|
| **Chat IA core** | Componente embebible compartido. Es el centro. |
| **Memories** | Proyecto AUTÓNOMO (ya en `packages/memories` + `apps/memories-web`). No debe pesar sobre chat-ia. |
| **Wedding-creator** | Independiente (ya en `packages/wedding-creator` + `apps/editor-web`). |
| **Messages/Inbox** | Mensajería unificada; las conversaciones del chat encajan aquí. Activo (rama inbox-fase1). |
| **Discover/Marketplace** | NO el de LobeChat. A futuro: marketplace PROPIO orientado a productos del cliente. → ELIMINAR el de LobeChat. |
| **Image/DALL-E** | Se usará, pero como COMPONENTE / mini-repo aparte, no dentro del monolito. |
| **Knowledge/RAG** | DUDA: ¿solapa con api-mcp? Verificar antes de decidir. |
| **Plugins/Tools store** | Genérico LobeChat. → ELIMINAR (las tools que usáis son builtin propias). |

## 3. Lo que YA está hecho (no partimos de cero)

- ✅ `packages/copilot-shared` existe — chat core en extracción.
- ✅ `appEventos` YA embebe el chat: `CopilotEmbed.tsx`, `ChatSidebarDirect.tsx`.
- ✅ Patrón de componentes compartidos establecido (memories, wedding-creator, shared, auth-ui).
- → La arquitectura modular está EMPEZADA. Esto es continuarla.

## 4. Plan por fases (mejor práctica: medir → eliminar → aislar → modularizar)

### Fase 0 — Auditar (medir antes de cortar) · BAJO riesgo
- `ANALYZE=true next build` (o análisis estático del grafo) → mapa exacto de qué módulos/deps
  aportan los 40k. Sin esto, eliminar = adivinar.
- Confirmar dependencias cruzadas: qué importa cada feature, qué comparten.
- **Entregable:** lista priorizada de qué eliminar/aislar con impacto medido en módulos.

### Fase 1 — Eliminar features no usadas · MAYOR impacto
Candidatas confirmadas a eliminar (no usadas / genéricas LobeChat):
- **Discover/Marketplace** LobeChat (~175 archivos) — el propio se hará a futuro, distinto.
- **Plugins/Tools store** genérico — las tools reales son builtin propias.
- **Langchain loaders** (csv/epub/latex/md/txt/code) — ya parcialmente eliminados (SPRINT-K/M).
- A verificar antes de tocar: **Knowledge/RAG** (¿solapa api-mcp?), **Image** (extraer a módulo, no borrar).
- Cada eliminación = 1 commit verificable y reversible. NO big-bang.

### Fase 2 — Aislar lo pesado del chat core · pulido
- mermaid / shiki / katex / cytoscape → lazy estricto (solo cargan si el mensaje los usa).
- Confirmar que el renderer de markdown no los trae eager.

### Fase 3 — Consolidar el chat como componente · la visión
- Madurar `copilot-shared` para que el chat embebible sea autosuficiente.
- Evaluar si chat-ia (app standalone) sigue siendo necesaria o si el chat vive solo embebido.
- Image/marketplace como módulos/mini-apps que se integran vía componente.

## 5. Riesgos y principios

- **NO romper lo que funciona**: cada cambio verificado (tests + carga real) antes del siguiente.
- **Incremental y reversible**: feature por feature, commit por commit.
- **Medir el impacto** de cada eliminación (módulos antes/después).
- Empezar por Fase 0 (auditar) — hace seguro todo lo demás.

## 6. Decisiones RESUELTAS (usuario, 2026-06-03)

### ✅ Knowledge/RAG → ELIMINAR el de chat-ia (auditado por SSH a api-mcp)
- **api-mcp YA tiene KB completo y funcionando**: `src/mcp/kb-mcp-server.ts` con **MongoDB Atlas
  Vector Search** (gratis), endpoint vivo `https://api2.eventosorganizador.com/mcp/kb`, control
  de acceso por rol (invited/collaborator/organizer). Estado: ✅ Funcionando.
- chat-ia tiene RAG DUPLICADO y distinto: `lobechatKBMiddleware` (Ollama+ChromaDB → api-ia:8030)
  + knowledge nativo LobeChat (pgvector). **Ambos redundantes con api-mcp.**
- **Acción:** eliminar `app/[variants]/(main)/knowledge` + RAG nativo (pgvector, document/chunk
  routers, ragEval). El chat consume `/mcp/kb` de api-mcp como cliente. Quita módulos + deps pesadas.

### ✅ Image/DALL-E → EXTRAER a módulo, como visor de imágenes GENÉRICO
- No solo DALL-E: el visor debe servir a **cualquier agente IA que maneje imágenes**.
- Extraer a componente/mini-repo reutilizable (como memories/wedding-creator).

### ✅ chat-ia standalone → SE MANTIENE como app
- Usabilidad: el usuario quiere **espacio amplio para ver conversaciones anteriores**,
  experiencia tipo ChatGPT/Claude (chat completo), no solo el embed pequeño.
- → chat-ia sigue como app standalone Y se sigue embebiendo via copilot-shared. Ambos.

## 7. Orden de ejecución acordado

1. **Knowledge/RAG fuera** (confirmado por auditoría) — primer gran recorte de módulos.
2. **Plugins/Tools store + Discover/Marketplace LobeChat fuera** (genéricos no usados).
3. **Image → módulo** (visor genérico para cualquier agente con imágenes).
4. **Aislar mermaid/shiki/katex** (lazy).
5. Medir módulos de /chat tras cada fase (baseline 40.418).
