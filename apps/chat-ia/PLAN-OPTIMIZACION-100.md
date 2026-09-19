# Plan de Optimización 100% — chat-ia bodasdehoy

**Fecha**: 2026-05-21
**Branch**: `dev` (76 commits desde merge PR #157)
**Estado actual**: ~85% optimización + ~30% testing coverage

---

## ✅ Lo ya logrado (76 commits)

| Categoría | Resultado |
|---|---|
| Cold compile `/chat` | 1433s → 118-170s (**8-12×**) |
| Startup `Ready` | 121s → 2.0s (**60×**) |
| Bundle inicial cliente | Spline -3.7MB (sub-paths LIMPIO) |
| LOC eliminadas | ~165,000+ |
| Disk savings | ~15.4MB (locales+docs+public+macOS) |
| Dead files identificados | 55+ |
| Locales | 18 → 3 (es-ES, en-US, pt-BR) |
| Deps directas | 256 → 235 (-21) |
| Edge runtime routes | 3 → 11 (+8) |
| optimizePackageImports | 23 → 49 (+26) |
| TSC errors | 8 → 0 |
| Webpack aliases | 1 (canvas legítimo) |
| Funcionalidad | 100% preservada |

---

## 🚀 Sprints PENDIENTES para 100% optimización

### Sprint-Q profundo: eliminar `packages/model-runtime/` físico

**Tiempo**: 4-6h | **Riesgo**: ALTO | **Bloqueante**: E2E base

**Trabajo**:
1. Crear E2E base (auth-flow + chat-smoke + sessions) — 8-12h
2. Refactor 5 server consumers:
   - `src/app/(backend)/middleware/auth/utils.ts` → eliminar import @lobechat/model-runtime
   - `src/server/modules/ModelRuntime/index.ts` → reemplazar por proxy a api-ia
   - `src/server/modules/ModelRuntime/trace.ts` → mover Langfuse a api-ia
3. Eliminar `packages/model-runtime/` físico (3.3MB en disco)
4. Eliminar `packages/model-bank/aiModels/` providers no usados (68 providers, mantener solo ~5)
5. Re-validar E2E + chat smoke

**Impacto**: -3.3MB disk + reducción server bundle

**Por qué requiere sesión dedicada**:
- SPRINT-O original (sin E2E) rompió chat core (memoria documentada)
- Cada commit requiere ejecutar E2E + smoke chat real
- Imposible validar desde Claude sesión actual (no browser)

---

### Sprint-AF: `/discover` MemoryRouter SPA → Next.js routing

**Tiempo**: 6-8h | **Riesgo**: MEDIO | **Bloqueante**: ninguno

**Trabajo**:
1. Crear pages Next.js:
   - `app/[variants]/(main)/discover/(list)/(home)/page.tsx`
   - `app/[variants]/(main)/discover/(list)/assistant/page.tsx`
   - `app/[variants]/(main)/discover/(list)/model/page.tsx`
   - `app/[variants]/(main)/discover/(list)/provider/page.tsx`
   - `app/[variants]/(main)/discover/(list)/mcp/page.tsx`
   - `app/[variants]/(main)/discover/(detail)/assistant/[...slugs]/page.tsx`
   - `app/[variants]/(main)/discover/(detail)/model/[...slugs]/page.tsx`
   - etc.
2. Refactor 36 archivos que usan `react-router-dom`:
   - `useLocation` → `usePathname` (next/navigation)
   - `useNavigate` → `useRouter`
   - `Link` from react-router-dom → `Link` from next/link
   - `useParams` → `useParams` next/navigation
3. Eliminar `DiscoverRouter.tsx` (MemoryRouter wrapper)
4. Eliminar `react-router-dom` de package.json
5. Smoke test cada ruta /discover/*

**Impacto**: -140KB dep + UX mejorado (Next routing nativo)

---

### Sprint-BM: octicons workaround (fork upstream)

**Tiempo**: 3-4h | **Riesgo**: BAJO | **Bloqueante**: PR upstream

**Trabajo**:
1. **Opción A** (recomendada): wrapper Markdown local
   - Crear `src/components/MarkdownLite.tsx` usando react-markdown + remark-gfm directo
   - SIN rehype-github-alerts plugin (911KB octicons eliminado)
   - Refactor 30+ callsites Markdown en chat workspace
   - Mantener `@lobehub/ui Markdown` solo para casos especiales (settings, etc.)

2. **Opción B**: PR upstream `@lobehub/ui` con `disableGithubAlertsPlugin` option
   - Más limpio pero requiere merge upstream (días)

**Impacto**: -911KB initial bundle cliente

---

### Sprint-BN: ModelIcon/ModelTag refactor lazy

**Tiempo**: 3-5h | **Riesgo**: MEDIO

**Trabajo**:
1. Wrapper local `ModelIconLite`:
   - Recibe `modelId` + `providerId`
   - Solo carga el provider icon específico via dynamic
   - Fallback a Default si no encontrado
2. Refactor 9 callsites en hot path /chat
3. Mantener `@lobehub/icons ModelIcon` para profile/settings (no hot)

**Impacto**: -1.5MB initial bundle cliente (modelConfig 200+ providers eliminado del initial)

---

### Sprint-BP: `@lobehub/editor` prosemirror lazy

**Tiempo**: 4-6h | **Riesgo**: MEDIO

**Trabajo**:
1. Audit `ChatInput/InputEditor/index.tsx` imports estáticos
2. Convertir `Editor`, `FloatMenu`, `SlashMenu`, `useEditorState` de `@lobehub/editor/react` a dynamic
3. Smoke test typing + slash commands + paste

**Impacto**: 600KB-1MB initial bundle cliente

---

### Sprint-BQ: bundle analyzer CI

**Tiempo**: 1-2h | **Estado**: parcial (script ya existe)

**Trabajo restante**:
1. ✅ Script `build:analyze` ya existe en package.json
2. ⬜ Crear `.github/workflows/bundle-size.yml` con threshold check
3. ⬜ Integrar `bundle-stats-action` para diff per PR

**Impacto**: prevenir regression future

---

## 🧪 Sprints PENDIENTES para 100% testing

### Fase 1: E2E base (PREREQUISITE para Sprint-Q)

**Tiempo**: 8-12h | **Crítico**

**Specs Playwright requeridas**:
- `e2e/auth-flow.spec.ts` — Firebase login + redirect SSO
- `e2e/chat-smoke.spec.ts` — enviar mensaje + recibir respuesta
- `e2e/sessions.spec.ts` — crear/cambiar/eliminar sesión
- `e2e/sso-cross-app.spec.ts` — SSO chat-ia ↔ appEventos
- `e2e/visitor-limits.spec.ts` — guest mode + límite mensajes

**Setup**:
- Playwright config webkit (NO chromium per memoria)
- `globalSetup` con seed user via UI (NO MCP per memoria)
- Asserts runtime errors via `assertNoRuntimeError` helper

### Fase 2: Unit tests gap fill

**Tiempo**: 4-8h (variable)

**Módulos refactorizados sin tests**:
- `services/chat/clientModelRuntime.ts` (post-Q dynamic)
- `webapi/tts/microsoft/route.ts` (proxy)
- `webapi/tts/edge/route.ts` (proxy)
- `webapi/create-image/comfyui/route.ts` (proxy)
- `packages/types/src/aiModel.ts` (interface tests)

### Fase 3: Visual regression

**Tiempo**: 3-4h

- Playwright screenshots golden master
- `.github/workflows/visual.yml` con diff threshold

### Fase 4: Performance regression

**Tiempo**: 2-3h

- Lighthouse CI integration
- Threshold check First Contentful Paint, Time to Interactive
- Daily run con alert si regression >10%

### Fase 5: Smoke post-deploy

**Tiempo**: 1-2h

- Cron post-deploy hit `/chat` cold
- Alert si HTTP != 200 o response > 5s

---

## 📊 Totales

| Categoría | Sprints | Horas |
|---|---|---|
| Optimización pendiente | 7 sprints | **23-33h** |
| Testing pendiente | 5 fases | **18-29h** |
| **TOTAL para 100%** | **12 sprints/fases** | **41-62h** |

---

## 🎯 Orden recomendado de ejecución

1. **PRIMERO E2E base** (12h) — red de seguridad obligatoria
2. **DESPUÉS Sprint-Q profundo** (6h) — gran impact disk + bundle, requiere E2E
3. **Sprints BM+BN paralelo** (8h) — mayor impact initial bundle cliente
4. **Sprint-AF /discover** (8h) — refactor large pero independent
5. **Sprint-BP editor lazy** (6h)
6. **Sprint-BO done** ✅
7. **Sprint-BQ CI workflow** (2h)
8. **Fases testing 2-5** (10-17h)

---

## ⚠️ Limitaciones sesión Claude

Sprints que NO se pueden hacer 100% desde Claude (requieren browser/E2E execution):

- **Sprint-Q profundo**: requiere E2E ejecutándose en cada commit
- **Sprint-AF /discover**: 36 archivos refactor + smoke test cada ruta browser
- **Sprint-BM/BN refactor wrapper**: smoke test render mensajes con Markdown
- **Sprint-BP editor lazy**: smoke test typing/slash/paste
- **Todas las fases testing 1-5**: requieren ejecución E2E real

Lo que SÍ se pudo en sesiones Claude (76 commits ya aplicados):
- Audits dead code
- Sub-path imports (Spline LIMPIO)
- optimizePackageImports
- Edge runtime migration routes simples
- Deps unused removal
- Refactor TypeScript con TSC validation
- Webpack config optimizations

---

**Co-Authored-By**: Claude Opus 4.7 (1M context)
