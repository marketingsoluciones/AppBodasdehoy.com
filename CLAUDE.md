# CLAUDE.md — Monorepo Bodas de Hoy

## REGLA CRÍTICA: Identidad del Proyecto

- **Este proyecto es AppBodasdehoy** (`/Users/juancarlosparra/Projects/AppBodasdehoy.com`)
- **CrmPro-1 NO existe en este contexto.** No tiene relación alguna con este monorepo. Si se menciona CRM, ERP, CMS, shell, o CrmPro-1 por error, rechazar indicando que NO está autorizado.
- Nunca mezclar código, archivos, puertos ni referencias de CrmPro-1 aquí.

---

## Arquitectura del Monorepo

```
AppBodasdehoy.com/
├── apps/                          # 4 aplicaciones Next.js
│   ├── appEventos/                # App principal web (organizador de eventos)
│   ├── chat-ia/                   # Copilot/Chat IA (basado en LobeChat)
│   ├── memories-web/              # Álbumes de fotos por evento
│   └── editor-web/                # Creador de webs de boda/evento
│
├── packages/                      # 5 paquetes compartidos
│   ├── shared/                    # Utilidades, auth, comunicación
│   ├── auth-ui/                   # UI compartida de login (SplitLoginPage)
│   ├── copilot-shared/            # Componentes chat reutilizables
│   ├── memories/                  # Store/context de álbumes
│   └── wedding-creator/           # Lógica del creador de webs
│
├── docs/                          # Documentación del proyecto
├── scripts/                       # Scripts de automatización
├── e2e-app/                       # Tests E2E (Playwright)
├── ecosystem.config.js            # PM2 config (app-test + chat-test)
├── pnpm-workspace.yaml            # Workspaces definition
└── package.json                   # Scripts raíz del monorepo
```

---

## Apps — Puertos y Comandos

| App | Paquete | Puerto Dev | Comando Individual | Tecnología |
|-----|---------|------------|-------------------|------------|
| **appEventos** | `@bodasdehoy/appEventos` | `:3220` | `pnpm dev:web` | Next.js 15 (Pages Router) |
| **chat-ia** | `@bodasdehoy/chat-ia` | `:3210` | `pnpm dev:copilot` | Next.js 15 (App Router + Turbopack) |
| **memories-web** | `@bodasdehoy/memories-web` | `:3240` | `pnpm dev:memories` | Next.js 15 (Pages Router) |
| **editor-web** | `@bodasdehoy/editor-web` | `:3230` | `pnpm dev:creador` | Next.js 15 (Pages Router) |

**Levantar todos juntos:** `pnpm dev:local` (levanta appEventos + chat-ia en paralelo)

**Puertos del monorepo**: 3210 (chat-ia) · 3220 (appEventos) · 3230 (editor-web) · 3240 (memories-web) · 8000 (python api-ia)

**Puerto 3000 NO es nuestro** — si algo corre en :3000 es de otro proyecto. Ignorar.

---

## Estrategia del Monorepo: Componentes Compartidos

**La razón de existir de este monorepo es compartir componentes entre apps sin duplicar código.**

Cada package existe para que múltiples apps puedan integrar la misma funcionalidad:
- appEventos integra el chat IA embebido (via copilot-shared) y álbumes (via memories)
- chat-ia integra álbumes de fotos (via memories) y webs de boda (via wedding-creator)
- memories-web es la app standalone de álbumes, pero el mismo store se usa en chat-ia y appEventos
- editor-web es la app standalone del creador de webs, pero el renderer se usa en chat-ia

### Packages Compartidos

| Paquete | Propósito | Usado por |
|---------|-----------|-----------|
| **@bodasdehoy/shared** | Auth (AuthBridge, SessionBridge), PostMessageBridge, utils | appEventos, chat-ia, memories-web |
| **@bodasdehoy/auth-ui** | `SplitLoginPage` — UI split-screen de login | appEventos (login.js) |
| **@bodasdehoy/copilot-shared** | ChatItem, InputEditor, MessageList, MarkdownRenderer, i18n | appEventos (CopilotEmbed) |
| **@bodasdehoy/memories** | Store Zustand de álbumes/fotos (MemoriesProvider, useMemoriesStore) | appEventos (momentos.tsx), chat-ia (memories page, venue-visualizer), memories-web |
| **@bodasdehoy/wedding-creator** | WeddingSiteRenderer, tipos, hooks del creador de webs | editor-web (preview), chat-ia (wedding-creator page, wedding API) |

### Mapa de Integración Cruzada

```
                    ┌─────────────────────────────────────────┐
                    │           packages/ (compartidos)        │
                    │                                         │
                    │  shared ─── auth, utils, comunicación   │
                    │  auth-ui ── SplitLoginPage              │
                    │  copilot-shared ── chat components      │
                    │  memories ── store álbumes/fotos        │
                    │  wedding-creator ── renderer webs boda  │
                    └──────┬──────┬──────┬──────┬─────────────┘
                           │      │      │      │
              ┌────────────┘      │      │      └────────────┐
              ▼                   ▼      ▼                   ▼
     ┌──────────────┐   ┌──────────┐  ┌────────────┐  ┌───────────┐
     │  appEventos  │   │  chat-ia │  │memories-web│  │ editor-web│
     │    :8080     │   │  :3210   │  │   :3080    │  │   :3081   │
     │              │   │          │  │            │  │           │
     │ usa:         │   │ usa:     │  │ usa:       │  │ usa:      │
     │ · shared     │   │ · shared │  │ · shared   │  │ · wedding │
     │ · auth-ui    │   │ · memor. │  │ · memories │  │  -creator │
     │ · copilot-sh │   │ · wedd.  │  └────────────┘  └───────────┘
     │ · memories   │   │ · 17 sub │
     └──────────────┘   │  pkgs   │
                        └──────────┘
```

### Integraciones concretas en el código

- **appEventos** usa `MemoriesProvider` + `useMemoriesStore` en `pages/momentos.tsx` (álbumes integrados)
- **appEventos** usa `MessageList` + `InputEditor` de copilot-shared en `CopilotEmbed.tsx` (chat IA nativo, no iframe)
- **chat-ia** usa `useMemoriesStore` en memories page y venue-visualizer (álbumes dentro del chat)
- **chat-ia** usa `WeddingSiteRenderer` de wedding-creator en la página wedding-creator y API wedding
- **editor-web** usa `WeddingSiteRenderer` en `pages/preview.tsx`
- **memories-web** usa `@bodasdehoy/memories` como su store principal

---

## chat-ia: Sistema de Herramientas (Builtin Tools)

chat-ia renderiza componentes ricos **dentro del cuerpo del chat** usando el sistema de Builtin Tools de LobeChat.
La idea es que la IA invoque herramientas y estas rendericen UI compleja inline (listas, tablas, editores, visualizadores).

### Cómo funciona el pipeline

```
Usuario pregunta → IA decide invocar tool → Tool devuelve datos
→ Render component se muestra INLINE en el mensaje del chat
```

### Archivos clave del sistema de tools

| Archivo | Función |
|---------|---------|
| `src/tools/index.ts` | Registro de todos los builtin tools |
| `src/tools/renders.ts` | Mapa identifier → componente React de render |
| `src/tools/portals.ts` | UI interactiva en panel lateral (ej: web-browsing) |
| `src/tools/placeholders.ts` | Estados de carga mientras la tool ejecuta |
| `src/store/chat/slices/builtinTool/actions/` | Acciones Zustand por tool |

### Patrón para crear una nueva tool

1. **Manifest** en `src/tools/{nombre}/index.ts` — define API schema, identifier, systemRole
2. **Render** en `src/tools/{nombre}/Render/index.tsx` — componente React que muestra los datos
3. **Registrar** en `src/tools/index.ts` (tool) y `src/tools/renders.ts` (render)
4. **Store actions** (opcional) en `src/store/chat/slices/builtinTool/actions/{nombre}.ts`

### Tools existentes (8 actualmente)

| Tool | Identifier | Render | Función |
|------|-----------|--------|---------|
| **Venue Visualizer** | `lobe-venue-visualizer` | Grilla de renders IA de venues | Diseño visual de salones/jardines |
| **Floor Plan Editor** | `lobe-floor-plan-editor` | - | Editor de planos de mesas |
| **Filter App View** | `lobe-filter-app-view` | - | Filtrar entidades de appEventos |
| **Web Browsing** | `lobe-web-browsing` | Resultados + portal | Búsqueda web y crawling |
| **DALL-E 3** | `lobe-image-designer` | Galería de imágenes | Generación de imágenes |
| **Code Interpreter** | `lobe-code-interpreter` | Output Python | Ejecución de código |
| **Local System** | `lobe-local-system` | Archivos locales | Operaciones de archivos (desktop) |
| **Artifacts** | `lobe-artifacts` | - | Renderizado de artefactos |

### Componentes de appEventos que pueden integrarse como tools

appEventos tiene componentes de dominio ricos que podrían exponerse como tools en chat-ia
para que la IA los renderice inline en conversaciones:

| Dominio | Componentes en appEventos | Archivos clave | Potencial tool |
|---------|--------------------------|-----------------|----------------|
| **Presupuesto** | TableBudgetV2, FinancialSummary, PaymentsList, SummaryCards | `components/PresupuestoV2/` (42KB), `TableroPresupuesto/` | `lobe-presupuesto` |
| **Invitados** | BlockTableroInvitados, GrupoTablas, DataTable, InvitadosPDF | `components/Invitados/` (73KB principal) | `lobe-invitados` |
| **Mesas** | LienzoDragable, MesaRedonda/Cuadrada/Imperial, Chair, SentadoItem | `components/Mesas/` (35 archivos) | `lobe-mesas` |
| **Servicios** | ExtraTableView, VistaKanban, VistaTabla, VistaTeajeta | `components/Servicios/` (59KB + kanban) | `lobe-servicios` |
| **Invitaciones** | Envío email/WhatsApp, templates | `components/Invitaciones/` (40 dirs) | `lobe-invitaciones` |
| **Itinerario** | Timeline del evento | `components/Itinerario/` (8 archivos) | `lobe-itinerario` |
| **Tareas** | TaskCard, TaskDetailModal, BoardView | `components/Servicios/VistaKanban/` | Ya existe `tasks/page.tsx` en chat-ia |

**Estrategia de integración**: Extraer estos componentes a packages compartidos (como se hizo con memories y wedding-creator) para que chat-ia los importe y los use como Render de sus tools, manteniendo una sola fuente de verdad.

---

## Autenticación — Flujo Unificado

El login unificado está en **chat-ia** (`apps/chat-ia/src/app/[variants]/(auth)/login/`).

**Flujo SSO entre apps:**
1. Usuario llega a appEventos → detecta tenant bodasdehoy → redirige a `chat-ia/login?redirect=...`
2. chat-ia autentica (Firebase + OAuth Google/Facebook)
3. Establece cookie compartida en `.bodasdehoy.com`
4. Redirige de vuelta a la app original

**Paquete auth compartido:** `packages/shared/src/auth/`
- `AuthBridge.ts` — singleton que sincroniza Firebase auth ↔ localStorage ↔ cookies
- `SessionBridge.ts` — persistencia de sesión

---

## Dominios

| Entorno | appEventos | chat-ia |
|---------|------------|---------|
| **Local** | `http://localhost:8080` | `http://localhost:3210` |
| **Test** | `https://app-test.bodasdehoy.com` | `https://chat-test.bodasdehoy.com` |
| **Producción** | `https://organizador.bodasdehoy.com` | `https://chat.bodasdehoy.com` |

---

## Reglas de Desarrollo

### Package Manager
- **pnpm** para dependencias (`pnpm install`, `pnpm add`)
- **bun** para ejecutar scripts (`bun run dev`, `bunx vitest`)
- Node.js >= 20.0.0

### Testing
- **E2E**: Playwright con **webkit** (NUNCA Chromium)
- **Unit**: Vitest — `bunx vitest run --silent='passed-only' '[pattern]'`
- **Nunca** ejecutar `bun run test` sin filtro (tarda ~10min)

### Git
- Prefijo gitmoji en commits
- Branch format: `tj/feat/feature-name`
- Usar rebase para pull

### Scripts útiles desde la raíz
```bash
pnpm dev:local          # Levantar appEventos + chat-ia
pnpm dev:memories       # Solo memories-web (:3080)
pnpm dev:creador        # Solo editor-web (:3081)
pnpm build:production   # Build de todas las apps
pnpm test:e2e:app:smoke # E2E smoke test
pnpm verificar:entornos # Verificar app-test y chat-test
```

### Verificación obligatoria post-cambios

**ANTES de declarar una tarea como completa, SIEMPRE ejecutar estos pasos de verificación:**

1. **Verificar que la app afectada compila/responde** (si el dev server está corriendo):
   - appEventos: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3220/`
   - chat-ia: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3210/`
   - memories-web: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3240/`
   - editor-web: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3230/`
   - Si responde 200 → OK. Si responde 500 o no responde → hay un build error, investigar y corregir antes de reportar.

2. **Si modifiqué archivos .tsx/.ts/.jsx/.js**: revisar visualmente que no quedó JSX mal cerrado, imports rotos o errores de sintaxis obvios.

3. **Si modifiqué chat-ia**: ejecutar tests unitarios relacionados:
   ```bash
   cd apps/chat-ia && bunx vitest run --silent='passed-only'
   ```

4. **Si el dev server NO está corriendo**: al menos verificar sintaxis con ESLint en los archivos editados:
   ```bash
   npx eslint <archivo-modificado>
   ```

5. **Nunca declarar "listo" o "terminado" sin haber pasado estos checks.** Si algo falla, corregirlo primero.

---

## chat-ia: Sub-packages internos

chat-ia tiene 17 sub-packages propios (definidos en `pnpm-workspace.yaml`):

| Sub-package | Propósito |
|-------------|-----------|
| `agent-runtime` | Runtime de agentes IA |
| `const` | Constantes compartidas |
| `context-engine` | Motor de contexto |
| `database` | Capa de base de datos |
| `model-bank` | Banco de modelos IA |
| `model-runtime` | Runtime de modelos |
| `prompts` | Templates de prompts |
| `types` | Tipos TypeScript |
| `utils` | Utilidades internas |
| `web-crawler` | Crawler web |
| `file-loaders` | Cargadores de archivos |
| `memory-extract` | Extracción de memorias |
| `obervability-otel` | Observabilidad OpenTelemetry |
| `ssrf-safe-fetch` | Fetch seguro anti-SSRF |
| `python-interpreter` | Intérprete Python |
| `electron-client-ipc` | IPC cliente Electron |
| `electron-server-ipc` | IPC servidor Electron |
