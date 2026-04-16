# Inventario completo de tests — AppBodasdehoy.com

Documento de referencia: **qué tests existen**, **qué datos necesitan**, **qué hay que hacer** para ejecutarlos y **qué se está probando**. Actualizado a partir del estado del repo (E2E, appEventos, chat-ia).

**Resumen en una página:** [DOS-TIPOS-DE-TESTS-Y-DONDE-SE-PRUEBA-LA-IA.md](./DOS-TIPOS-DE-TESTS-Y-DONDE-SE-PRUEBA-LA-IA.md) — solo dos tipos (Vitest + E2E Playwright) y **dónde están los que prueban la IA** (specs E2E + scripts de batería).

---

## 0. Números rápidos: preguntas vs tests

| Concepto | Cantidad | Dónde |
|----------|----------|--------|
| **Tests E2E (Playwright)** | **~176** | 22 specs en `e2e-app/*.spec.ts` |
| **Tests appEventos (Jest)** | **~46** | 8 archivos en `apps/appEventos` |
| **Tests chat-ia (Vitest)** | **~3.000+** (store solo: **~1.263**) | `apps/chat-ia` (src + packages) |
| **Total tests (aprox.)** | **~3.220+** | — |
| **Preguntas explícitas al chat/IA en tests** | **~6–8** textos fijos | E2E (multi-developer, visitor-limit), appEventos (fixtures copilot) |

**Preguntas** que aparecen en código de tests (no son “tests”, son el contenido del mensaje que se envía al chat):

- E2E: `"test"` (visitor-limit, 3 envíos); tests que “preguntan sobre invitados / presupuesto / tareas / servicios” (multi-developer) sin texto literal único.
- appEventos: `"¿Cuántos invitados confirmados hay?"`, `"¿Cuántos invitados tengo?"`, `"Hola"` (en fixtures y tests de `/api/copilot/chat`).

---

## 1. Resumen ejecutivo

| Área | Herramienta | Archivos | Datos / requisitos principales |
|------|-------------|----------|--------------------------------|
| **E2E (Playwright)** | Playwright | 29 specs en `e2e-app/` | BASE_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD, VPN para app-test |
| **appEventos (Jest)** | Jest | 8 archivos | Mocks de contexto, fixtures de API copilot |
| **chat-ia (Vitest)** | Vitest | ~572 archivos .test.* | Mocks de servicios, store state, sin datos reales |

---

## 2. Tests E2E (Playwright) — `e2e-app/*.spec.ts`

### 2.1 Listado de specs y qué certifican

| Spec | Qué prueba | Requiere login | Requiere VPN/app-test |
|------|------------|----------------|------------------------|
| **smoke.spec.ts** | Raíz `/` carga; `/api/health` (solo local) | No | No (local OK) |
| **home.spec.ts** | Home visible; sin ErrorBoundary | No | No |
| **login.spec.ts** | Página login con marca/formulario; no pantalla blanca | No | No |
| **redirect-login.spec.ts** | En app-test: /login redirige a chat-test; clic "Iniciar sesión" va a chat-test | No | **Sí (app-test)** |
| **rutas.spec.ts** | 16 rutas cargan sin ErrorBoundary y con texto esperado | No | No |
| **presupuesto.spec.ts** | `/presupuesto` carga sin crash; texto Presupuesto/permiso/login | No | No |
| **menu-usuario.spec.ts** | Menú perfil abre; opciones según sesión; nombre visible | Opcional | No |
| **errores-api.spec.ts** | 403 de API → banner "sesión expirada" (no error genérico) | No | Puede requerir app-test |
| **guest-y-logueado.spec.ts** | Diferencia guest vs logueado: menú, rutas, sin ErrorBoundary | Parcial | **Sí (app-test)** |
| **perfiles-visitante.spec.ts** | UX visitante: home, rutas protegidas, chat-ia, iframe copilot | No | **Sí (app-test)** |
| **visitor-limit.spec.ts** | Límite 3 mensajes; cookie vis_mc; visitor ID; server-side check; identidad iframe+standalone | No | **Sí (app-test + chat-test)** |
| **registro-y-onboarding.spec.ts** | Login page; credenciales erróneas; login real; sesión persiste; logout; SSO chat→app; modo visitante | **Sí (para login real)** | **Sí (app-test)** |
| **modulos-organizador.spec.ts** | Home, resumen, presupuesto, invitados, mesas, itinerario, servicios; crear evento; navegación | **Sí** | **Sí (app-test)** |
| **copilot-chat.spec.ts** | Iframe copilot; sin 500; PAGE_CONTEXT; filter_view; chat standalone; modal 402 | Parcial | **Sí (app-test + chat-test)** |
| **copilot-invitados-evento.spec.ts** | Con evento seleccionado: Copilot pregunta "invitados que se llama Raul" → respuesta no es error de BD (eventId/metadata) | **Sí** | **Sí (app-test + chat-test)** |
| **billing.spec.ts** | /settings/billing, /transactions, /planes (FREE/BASIC/PRO/MAX); plan; /facturacion en appEventos | **Sí** | **Sí (app-test)** |
| **portal-invitado.spec.ts** | /e/[eventId] sin auth; 404; countdown; RSVP; buscador-mesa | No (puede usar E2E_EVENT_ID) | **Sí (app-test)** |
| **edge-cases.spec.ts** | 404; 403 mid-session; API 503; navegación rápida; reload; health | No | Parcial |
| **acciones-crud.spec.ts** | CRUD real: itinerario (editar tarea), invitados (añadir), presupuesto (partida), filter_view, notificaciones | **Sí** | **Sí (app-test)** |
| **filter-view.spec.ts** | Filtros por entidad; login + selección evento; rutas invitados/presupuesto | **Sí** | **Sí (app-test)** |
| **bandeja-mensajes.spec.ts** | Bandeja de mensajes con/sin sesión | **Sí (completo)** | **Sí (app-test)** |
| **multi-developer.spec.ts** | Módulos, itinerario, carga, IA reasoning | **Sí** | **Sí (app-test)** |
| **usuario-secundario-vivetuboda.spec.ts** | Usuario secundario (vivetuboda); dos cuentas | **Sí (USER1 + USER2)** | **Sí (app-test)** |
| **auth.spec.ts** ⭐ | Login, cookies, SSO cross-domain, sesiones U1+U2 aisladas | **Sí** | **Sí (app-test)** |
| **billing-saldo.spec.ts** ⭐ | Saldo €, plan, modal sin saldo (mock 402), vivetuboda | **Sí** | **Sí (app-test + vtb)** |
| **crud-ia-verificado.spec.ts** ⭐ | CRUD via IA + cross-verification en UI (getByText) | **Sí** | **Sí (app-test)** |
| **invitaciones.spec.ts** ⭐ | Email + WA a carlos.carrillo@recargaexpress.com | **Sí** | **Sí (app-test)** |
| **presupuesto-pagos.spec.ts** ⭐ | Categorías, gastos, pagos con importe/medio/fecha | **Sí** | **Sí (app-test)** |
| **mesas.spec.ts** ⭐ | Editor visual, planos, drag invitado→mesa | **Sí** | **Sí (app-test)** |
| **kanban-tareas.spec.ts** ⭐ | Kanban /servicios, drag entre columnas, "novia" responsable | **Sí** | **Sí (app-test)** |

### 2.2 Datos y variables de entorno E2E

#### Obligatorios para specs con login

| Variable | Valor por defecto (en código) | Uso |
|----------|-------------------------------|-----|
| **BASE_URL** | `http://127.0.0.1:8080` (local) o `https://app-test.bodasdehoy.com` | URL de la app de eventos |
| **TEST_USER_EMAIL** | `bodasdehoy.com@gmail.com` (en fixtures) | Usuario Firebase de prueba |
| **TEST_USER_PASSWORD** | `lorca2012M*.` (en fixtures) | Contraseña del usuario de prueba |

#### Opcionales

| Variable | Uso |
|----------|-----|
| **CHAT_URL** | URL del chat-ia (por defecto `https://chat-test.bodasdehoy.com` si BASE_URL es app-test) |
| **TEST_USER2_EMAIL** | Usuario secundario (ej. `test-usuario2@bodasdehoy.com`) |
| **TEST_USER2_PASSWORD** | Contraseña usuario 2 (ej. `TestBodas2024!`) |
| **TEST_VIVETUBODA_EMAIL** | Email usuario vivetuboda (para billing-saldo.spec.ts) |
| **TEST_VIVETUBODA_PASSWORD** | Contraseña usuario vivetuboda |
| **VTB_CHAT_URL** | URL chat vivetuboda (default: `https://chat.vivetuboda.com`) |
| **E2E_EVENT_ID** | ID de evento real para portal invitado |
| **E2E_HEADED=1** | Navegador visible |
| **E2E_SLOW=1** | Animación lenta (slowMo) |
| **E2E_DELAY_BEFORE** | Milisegundos de pausa tras cargar página (para ver en navegador) |
| **PLAYWRIGHT_BROWSER** | `webkit` \| `chromium` \| `firefox` |

#### Fixtures E2E (`e2e-app/fixtures.ts`)

- **TEST_CREDENTIALS**: email y password (env o por defecto bodasdehoy.com@gmail.com / lorca2012M*.)
- **TEST_GUEST**: nombre `E2E Test YYYYMMDD`, email `e2e-test-YYYYMMDD@bodasdehoy-test.com`, teléfono
- **TEST_BUDGET_ITEM**: descripción `E2E Partida YYYYMMDD`, importe `250`
- **TEST_TASK**: descripción, prioridad alta
- **TEST_TABLE**: nombre mesa, capacidad 8
- **KNOWN_EVENT_IDS**: array de IDs de eventos conocidos (opcional; si vacío se usa el primero disponible)
- **TEST_URLS**: app y chat (BASE_URL y CHAT_URL)
- **LOGIN_TIMEOUT**, **APP_READY_TIMEOUT**, **CRUD_DEBOUNCE**: timeouts

### 2.3 Qué hay que hacer antes de correr E2E

1. **Ejecutar desde la raíz del monorepo** (donde está `package.json` con los scripts `test:e2e:app:*`).
2. **Contra app-test/chat-test**: tener **VPN** activa para que resuelvan `app-test.bodasdehoy.com` y `chat-test.bodasdehoy.com`.
3. **Cuenta de prueba**: la cuenta `bodasdehoy.com@gmail.com` debe existir en Firebase y tener al menos un evento en app-test (para login, CRUD, módulos).
4. **Datos a insertar/modificar**:  
   - Para CRUD e invitados/presupuesto: la cuenta debe tener eventos; los tests crean invitados/partidas con sufijo de fecha para no colisionar.  
   - **KNOWN_EVENT_IDS** en fixtures: opcional; si se quiere fijar un evento concreto, rellenar con IDs reales.
5. **Playwright**: primera vez `pnpm test:e2e:app:install` (Chromium); para WebKit: `pnpm exec playwright install webkit`.

### 2.4 Comandos E2E útiles

| Comando | Descripción |
|---------|-------------|
| `pnpm test:e2e:app` | Local: arranca servidor y corre todos los tests (navegador visible) |
| `pnpm test:e2e:app:ver:local` | Local: smoke + 8s de pausa para ver la app en el navegador |
| `pnpm test:e2e:app:real` | app-test (VPN): smoke + home + login + redirect, WebKit visible |
| `pnpm test:e2e:app:todo` | app-test (VPN): **todos** los specs, WebKit visible |
| `pnpm test:e2e:app:smoke` | Solo smoke |
| `pnpm test:e2e:app:ui` | Interfaz de Playwright para depurar |
| `pnpm test:e2e:auth` | Login, SSO, sesiones múltiples |
| `pnpm test:e2e:billing` | Saldo, plan, modal sin saldo (bodasdehoy) |
| `pnpm test:e2e:billing:vtb` | Solo tests vivetuboda |
| `pnpm test:e2e:crud-ia` | CRUD via IA + verificación cruzada |
| `pnpm test:e2e:invitaciones` | Email + WA Carlos Carrillo |
| `pnpm test:e2e:presupuesto` | Categorías, gastos, pagos |
| `pnpm test:e2e:mesas` | Editor visual mesas y planos |
| `pnpm test:e2e:kanban` | Kanban /servicios, drag & drop |
| `pnpm test:e2e:nuevos` | Todos los 7 nuevos specs juntos |
| `verify:e2e` | CI: headless contra app-test |

---

## 3. Tests appEventos (Jest) — `apps/appEventos/`

### 3.1 Listado de archivos

| Archivo | Qué prueba |
|---------|------------|
| **components/Presupuesto/__tests__/BlockListaCategorias.test.tsx** | BlockListaCategorias: no error con `presupuesto_objeto` undefined; botón nueva categoría; acepta `categorias_array` por prop |
| **components/DefaultLayout/__tests__/ListItemProfile.test.tsx** | ListItemProfile: título visible; onClick del ítem del menú |
| **__tests__/api/copilot/chat.test.ts** | POST /api/copilot/chat: 400 sin messages; contrato con api-ia; respuesta cuando backend no está |
| **__tests__/api/chat/messages.test.ts** | API chat/messages |
| **__tests__/api/copilot/chat-history.test.ts** | API copilot chat-history |
| **utils/__tests__/copilotMetrics.test.ts** | Utilidades de métricas copilot |
| **utils/__tests__/memoriesIntegration.test.ts** | Integración memorias |
| **services/__tests__/copilotChat.test.ts** | Servicio copilot chat |

### 3.2 Datos y mocks (appEventos)

- **BlockListaCategorias**: mock de `EventContextProvider` con `event._id`, `presupuesto_objeto: undefined`; mock de `useAllowed`, `useToast`, `react-i18next`. Props: `categorias_array`, `setShowCategoria`, `showCategoria`.
- **ListItemProfile**: se prueba render y clic (sin datos externos).
- **API copilot/chat**: fixture **`__fixtures__/copilot.ts`**:
  - `CHAT_REQUEST_BODY_REAL`: body real (messages, stream, metadata con userId, development, sessionId, eventId, pageContext).
  - Formas de respuesta API2 y api-ia: `API2_GET_CHAT_MESSAGES_RESPONSE`, `SSE_EVENT_CARD_REAL`, `SSE_USAGE_REAL`, `SSE_REASONING_REAL`, `SSE_TOOL_RESULT_UI_ACTION_REAL`, `SSE_TEXT_DELTA_REAL`.
- Variables de entorno en tests: `ENABLE_COPILOT_FALLBACK`, `OPENAI_API_KEY`, `PYTHON_BACKEND_URL` (por defecto `https://api-ia.bodasdehoy.com`).

### 3.3 Qué hay que hacer para correr tests appEventos

- Desde raíz: `pnpm test:web` (todos) o `pnpm test:front` (solo componentes).  
- O desde `apps/appEventos`: `pnpm test` / `pnpm test:run`.  
- No hace falta insertar datos reales; todo va con mocks y fixtures.

---

## 4. Tests chat-ia (Vitest) — `apps/chat-ia/`

### 4.1 Alcance

- **~572** archivos `*.test.{ts,tsx}` (incluye `src/` y `packages/`).
- **Store (Zustand)**: ~94 archivos, ~1263 tests; cobertura ~80%; **40/40** archivos de actions con tests (según `src/store/test-coverage.md`).
- Entorno: **happy-dom**; setup en `tests/setup.ts`. Los tests de **packages** tienen su propio `vitest.config.mts` y se ejecutan con `cd packages/<nombre> && pnpm exec vitest run ...`.

### 4.2 Tipos de tests chat-ia (resumen)

- **Store (actions, selectors, reducers)**: servicios mockeados (messageService, topicService, etc.); estado inicial con `useXStore.setState`; `act()` para actualizaciones.
- **Servicios y APIs**: mocks de fetch / trpc / backends.
- **Componentes**: Testing Library; mocks de contextos e i18n.
- **Migraciones**: FromV1ToV2, FromV2ToV3, … FromV6ToV7; datos de prueba en memoria.
- **Server/routers**: lambda (aiProvider, generation, message, user, etc.), globalConfig, ComfyUI, MCP, etc.
- **Packages**: model-runtime (providers), database (modelos), file-loaders, prompts, utils, context-engine, web-crawler, etc.

### 4.3 Datos a insertar o modificar (chat-ia)

- **Ninguno en condiciones normales**: los tests son unitarios/integración con mocks.  
- **Base de datos**: en `packages/database` existe la opción de tests contra DB real con `TEST_SERVER_DB=1` (configuración específica de ese package).  
- No se usan credenciales reales ni usuarios Firebase en los tests de chat-ia.

### 4.4 Comandos chat-ia

- **No ejecutar** `bun run test` (o equivalente “todos”) sin filtro: son 3000+ tests y tardan ~10 min.  
- Por archivo o patrón:  
  `pnpm exec vitest run --silent='passed-only' 'ruta/al/archivo.test.ts'`  
  Para packages: `cd packages/<nombre> && pnpm exec vitest run --silent='passed-only' 'patrón'`.  
- Store: `pnpm exec vitest run --silent='passed-only' 'src/store'`.  
- Cobertura store: `pnpm exec vitest run --coverage 'src/store'`.

---

## 5. Preguntas / flujos que se lanzan en tests

### 5.1 E2E (Playwright)

- **Login**: flujo completo en `/login` (email/password); redirect app-test → chat-test; clic "Iniciar sesión".
- **Visitante**: "Continuar como visitante"; persistencia de visitor ID; límite de mensajes (3) y modal.
- **Chat**: en copilot-chat se envían mensajes al chat y se comprueba respuesta y modal 402 si aplica.
- **CRUD**: no hay un único “pregunta” literal; se comprueban acciones en UI (editar tarea, añadir invitado, crear partida de presupuesto, etc.) y que la IA reciba REFRESH_EVENTS / filter_view.

### 5.2 appEventos (Jest)

- **POST /api/copilot/chat**: se prueba con body real (ej. `messages: [{ role: 'user', content: '¿Cuántos invitados confirmados hay?' }]`) y variantes (sin messages → 400, etc.). No se lanza una pregunta real al backend; se mockea `fetch`.

### 5.3 chat-ia (Vitest)

- Tests de store y servicios no envían preguntas a ningún backend real; usan mocks y estados. Los tests de prompts/chains pueden usar textos de ejemplo fijos en código.

---

## 6. Resumen: qué datos hay que insertar o modificar

| Área | Insertar/modificar datos | Notas |
|------|---------------------------|--------|
| **E2E** | Cuenta Firebase de prueba con al menos un evento en app-test; opcionalmente **KNOWN_EVENT_IDS** en `e2e-app/fixtures.ts` | Usuario por defecto: bodasdehoy.com@gmail.com. Invitados/partidas se generan con fecha para evitar colisiones. |
| **appEventos** | No | Fixtures en `__fixtures__/copilot.ts`; mocks en cada test. |
| **chat-ia** | No (salvo DB real en packages/database si se usa) | Todo mockeado. |

---

## 7. Referencias rápidas

- **E2E**: `e2e-app/README.md`, `e2e-app/fixtures.ts`, `e2e-app/helpers.ts`.
- **Store chat-ia**: `apps/chat-ia/src/store/test-coverage.md`, `apps/chat-ia/.cursor/rules/testing-guide/testing-guide.mdc`, `zustand-store-action-test.mdc`.
- **Claude/reglas**: `apps/chat-ia/CLAUDE.md`, `apps/chat-ia/AGENTS.md`.
