# Relación máxima de tests y preguntas

Documento generado a partir del análisis en profundidad de: **tests E2E**, **tests unitarios/integración**, **documentación Claude Code**, **reglas de testing**, **scripts de baterías de preguntas** y **backend api-ia**. Incluye todos los tests y preguntas identificados en el repo.

---

## 1. Resumen numérico

| Concepto | Cantidad | Fuente |
|----------|----------|--------|
| **Tests E2E (Playwright)** | **~176** | `e2e-app/*.spec.ts` |
| **Tests appEventos (Jest)** | **~46** | `apps/appEventos/**/*.test.*` |
| **Tests chat-ia (Vitest)** | **~3.000+** (store: ~1.263; model-runtime: 2.683) | `apps/chat-ia` + packages |
| **Total casos de prueba (aprox.)** | **~3.220+** | — |
| **Preguntas en scripts (baterías A+B+C+D)** | **80** (20×4) | `scripts/run-20-preguntas-api-ia*.mjs` |
| **Preguntas en backend api-ia** | **1.000** | `GET /api/admin/tests/questions` |
| **Acciones guardadas (backend)** | **300–600** | Plan PLAN_TESTS_BACKEND_REAL_V2 |
| **Nombres únicos de tests E2E** | **~130** | Extracción de `test('...')` en e2e-app |

---

## 2. Documentación Claude Code y testing (referencia)

Documentos que debe seguir Claude Code al escribir o ejecutar tests:

| Documento | Contenido |
|-----------|-----------|
| **apps/chat-ia/CLAUDE.md** | Regla obligatoria: leer `testing-guide.mdc` antes de escribir tests; comandos Vitest por archivo; no ejecutar todos los tests (~10 min). |
| **apps/chat-ia/AGENTS.md** | Testing: Vitest, Testing Library; comando por archivo; referencia a testing-guide. |
| **.cursor/rules/testing-guide/testing-guide.mdc** | Entornos (happy-dom / Node), comandos, principios de reparación, nombres por comportamiento, mocks, cobertura por ramas, `vi.resetModules()`. |
| **.cursor/rules/testing-guide/zustand-store-action-test.mdc** | Tests de actions Zustand: spy en dependencia directa, `act()`, no mockear de más, estructura describe (validation, normal flow, error handling). |
| **.cursor/rules/testing-guide/electron-ipc-test.mdc** | Tests IPC Electron: mock de `electronIpcClient`, escenarios éxito/fallo. |
| **.cursor/rules/testing-guide/db-model-test.mdc** | Tests de Model en `packages/database`: doble entorno (PGLite + PostgreSQL), permisos por usuario, seguridad, FK, timeouts. |
| **.cursor/rules/desktop-controller-tests.mdc** | Tests de controladores desktop: Vitest, `__tests__`, mock de App y dependencias. |
| **apps/chat-ia/src/store/test-coverage.md** | Cobertura store (~80%, 40/40 actions), workflow, subagentes, comandos. |
| **apps/chat-ia/packages/model-runtime/docs/test-coverage.md** | Cobertura model-runtime (94%, 117 archivos, 2.683 tests), patrón por provider. |
| **docs/archive/PLAN_TESTS_BACKEND_REAL_V2.md** | Plan con 1.000 preguntas, 300–600 acciones, TestSuite, scripts con backend real. |

---

## 3. Listado de tests E2E (nombres extraídos)

Cada línea es el título de un `test('...')` en `e2e-app/*.spec.ts` (algunos con variables tipo `${path}`):

```
/api/health responde 200
/chat carga sin pantalla en blanco (modo visitante o sesión existente)
/messages carga sin ErrorBoundary y con contenido
/messages no devuelve 500 (health check vía response)
403 de /api/events → banner "sesión expirada" visible (no crash genérico)
503 de API de eventos → app muestra error claro, no crash
CLEAR_FILTER elimina el banner
CLEAR_FILTER postMessage elimina el banner de filtro
FILTER_VIEW budget_items → banner en /presupuesto
FILTER_VIEW events → banner rosa en home
FILTER_VIEW guests → banner rosa en /invitados
FILTER_VIEW postMessage activa banner en /invitados
"Continuar como visitante" lleva al chat con user_type visitor
abre el menú al hacer clic en el trigger de perfil
admin panel — carga sin crash
al hacer clic en "Iniciar sesión" aparece formulario de login
al ir a /login en app-test redirige (no queda en app-test/login)
al ir a /login en app-test, ocurre redirect (no queda en app-test/login)
ambos usuarios pueden acceder a chat-ia de forma independiente
app-test con __dev_domain=vivetuboda — módulos no crashean
app-test home carga en menos de 15s
app-test: módulos principales cargan para usuario 2
asistente.tsx embeds chat-ia en iframe sin crash
botón crear evento — abre formulario
cambio de developer en app-test no crashea ningún módulo
campo "nombre" vacío no avanza en el formulario
carga sin ErrorBoundary
carga sin crash y muestra UI de configuración
carga sin pantalla blanca ni ErrorBoundary
chat vivetuboda — smoke directo
chat-ia /messages ruta con sesión — Bandeja carga
chat-ia carga sin pantalla en blanco ni error 500
chat-ia con __dev_domain=vivetuboda cambia el contexto
chat-ia home carga en menos de 15s
chat-ia: bandeja y módulos cargan sin crash
chat-test carga sin pantalla blanca ni error 500
chat-test.bodasdehoy.com accesible y carga sin crash
click en ✕ del banner activa clearCopilotFilter
con evento real muestra buscador o mensaje (requiere E2E_EVENT_ID)
con sesión y evento real: muestra workspace con sidebar y tarjeta
con sesión: botón añadir categoría/partida visible
con sesión: botón añadir invitado es visible
con sesión: botón de opciones de servicio abre panel
con sesión: campana de notificaciones presente
con sesión: interfaz de mesas muestra plano o lista
con sesión: muestra opciones de conexión WhatsApp
con sesión: muestra sección Tareas pendientes si hay eventos
con sesión: settings/billing muestra saldo
con sesión: tabla de invitados muestra columnas
con sesión: tarjetas de servicios visibles o botón añadir
con tarea inválida: muestra "no encontrada" sin crash
cookie vis_mc es compartida entre iframe (chat-test) y standalone (chat-test)
cookie vis_mc persiste entre recargas de página
cookie vis_mc se incrementa al enviar mensajes como visitante
copilot iframe está presente en el DOM para visitante
credenciales incorrectas muestran mensaje de error (no crash)
desde home, clic en Iniciar sesión redirige a chat-test
editar descripción de una tarea actualiza la UI
el API de health responde ok
el formulario de crear evento es accesible (home o modal)
el menú muestra el nombre del usuario en la cabecera
eliminar cookie sessionBodas y navegar → banner o redirect a login
endpoint /webapi/chat permite visitor con vis_mc<3
endpoint /webapi/chat rechaza visitor con vis_mc>=3 y X-User-ID visitor_xxx
eventId inválido no crashea
eventId inválido no crashea — muestra 404 graceful o mensaje de evento no encontrado
eventos del usuario con dev=bodasdehoy vs dev=vivetuboda son distintos
guest en app-test: redirige a login o muestra guest UI
guest: sidebar muestra menos opciones que autenticado
hay un input de búsqueda o botón de añadir invitado
home carga sin errores y muestra acceso a login
home carga y muestra contenido principal sin ErrorBoundary
home carga y muestra opción de Iniciar sesión
home muestra contenido principal sin ErrorBoundary
iframe del copilot carga sin Internal Server Error
iframe del copilot está presente en el DOM
input del chat es visible para visitante
itinerario carga en menos de 15s
itinerario emite REFRESH_EVENTS en window.parent tras editar
itinerario no genera 500 ni ErrorBoundary
la página de login muestra banner de sesión expirada con ?session_expired=1
la raíz / responde y muestra contenido
la ruta carga sin pantalla en blanco ni ErrorBoundary
login app + acceso a módulos principales
login chat-ia + ver Bandeja + nav a /messages/whatsapp
login en app-test.bodasdehoy.com → cookie sessionBodas presente
login en chat-test.bodasdehoy.com → sesión disponible
login exitoso → redirige a /chat y localStorage tiene user_type registered
logout desde app-test limpia la sesión y muestra "Iniciar sesión"
límite de mensajes visitante: al 4° mensaje se bloquea y aparece modal de registro
menú de perfil abre y muestra opciones de usuario logueado o guest
menú de perfil muestra "Iniciar sesión" para visitante
menú de perfil muestra Iniciar sesión (guest)
muestra "selecciona una tarea" o redirige a login
muestra contenido esperado: Presupuesto, permiso o login
muestra datos del evento o mensaje de acceso
muestra el trigger de perfil o contenido principal
muestra encabezado "Bandeja" en el sidebar
muestra historial o mensaje vacío (nunca crash)
muestra itinerario o mensaje de acceso
muestra la página de login con marca o formulario
muestra lista de invitados, tabla o acceso
muestra los 4 planes: FREE, BASIC, PRO, MAX (con sesión)
muestra opciones de registro, login y modo visitante
muestra planes (FREE/BASIC/PRO/MAX) en la sección de billing
muestra plano de mesas o mensaje de acceso
muestra saldo o redirige a login si no hay sesión
muestra saldo, plan o acceso requerido
muestra secciones de presupuesto o acceso
muestra sección de conversaciones
muestra servicios contratados o mensaje de acceso
navegar entre 5 rutas rápidamente no produce ErrorBoundary
no muestra ErrorBoundary
no muestra datos de 0€ como errores (total puede ser 0)
no muestra pantalla de error del ErrorBoundary
no muestra pantalla en blanco
panel de tarea tiene campos editables
perfil de usuario — dropdown / menú abre sin crash
plan actual está marcado (badge "Actual" o similar)
portal con evento real carga sin ErrorBoundary (requiere E2E_EVENT_ID)
portal con evento real muestra countdown si fecha es futura (requiere E2E_EVENT_ID)
portal con evento real muestra formulario RSVP (requiere E2E_EVENT_ID)
preguntar sobre invitados → IA responde sin crash
preguntar sobre presupuesto → IA responde sin crash
preguntar sobre servicios → IA responde sin crash
preguntar sobre tareas → IA responde sin crash
página /invitados carga sin ErrorBoundary (test context copilot)
página /presupuesto carga sin ErrorBoundary (test context copilot)
página de invitados carga sin crash
página de servicios carga sin crash
página presupuesto carga sin crash
página principal carga con copilot sin errores visibles
registra o loguea jcc@recargaexpress.com en app-test
registra o loguea jcc@recargaexpress.com en chat-ia
reload de la app no produce ErrorBoundary
respuesta 402 del servidor muestra modal InsufficientBalance (no crash)
resumen del evento — totales y métricas
ruta /e/ base (sin eventId) no crashea
ruta /invitados con visitante no explota
ruta /presupuesto carga (logueado o redirige/permiso si guest)
ruta /presupuesto con visitante no explota (redirige o muestra login)
ruta carga sin crash
ruta carga sin crash (con o sin sesión)
rutas /e/ y /buscador-mesa/ son accesibles sin cookie sessionBodas
sesión persiste tras recarga de página
si el usuario está logueado no debe mostrar Iniciar sesión y debe mostrar opciones de usuario
sidebar navigation — cada ítem del menú principal
tiene un botón o acceso para crear evento
tras login en chat-test con ?redirect=app-test, vuelve a app-test autenticado
tras login en chat-test, la cookie idTokenV0.1.0 existe en dominio .bodasdehoy.com
usuario 2 no ve los eventos del usuario 1
visitante no ve datos privados de eventos de otro usuario
visitante ve mensaje de bienvenida comercial (sin funciones de planificación)
visitor ID guardado en iframe está disponible en standalone chat-ia
visitor ID se persiste en localStorage tras "Continuar como visitante"
visitor ID se reutiliza en segunda visita a login (no genera uno nuevo)
visitor ID se reutiliza en visitas posteriores (no se genera uno nuevo cada vez)
vivetuboda — smoke directo al dominio de producción
workspace de tarea tiene textarea para escribir al asistente
```

Además, en **rutas.spec.ts** hay **16 tests** generados por bucle (uno por ruta): `${path} carga y muestra contenido` para `/`, `/login`, `/invitados`, `/resumen-evento`, `/presupuesto`, `/mesas`, `/itinerario`, `/invitaciones`, `/lista-regalos`, `/configuracion`, `/facturacion`, `/info-app`, `/eventos`, `/servicios`, `/bandeja-de-mensajes`, `/momentos`.

---

## 4. Preguntas utilizadas en tests y baterías

### 4.1 Batería A (20 preguntas) — oficial, docs/ANALISIS-20-PREGUNTAS-API-IA.md y scripts/run-20-preguntas-api-ia.mjs

1. Hola  
2. ¿Cuántos invitados tengo?  
3. ¿Cuánto llevo pagado del presupuesto?  
4. Quiero ver mis invitados  
5. Llévame al presupuesto  
6. ¿Cómo se llama mi evento?  
7. ¿Cuántas mesas tengo?  
8. Dime 3 consejos para organizar una boda  
9. Dame un resumen completo de mi evento  
10. Agrega a Jose Garcia y Jose Morales como invitados  
11. ¿Cuántos días faltan para mi boda?  
12. ¿Cuál es la boda de Raul?  
13. Muéstrame la lista de todas las bodas  
14. ¿Qué tareas tengo pendientes para mi boda?  
15. Dame ideas para el menú del banquete  
16. ¿Cuánto llevo gastado en el presupuesto?  
17. ¿Qué eventos tengo para el próximo año?  
18. ¿Quién es mi proveedor de flores?  
19. Resume los invitados confirmados  
20. ¿En qué fecha es la boda de María?  

### 4.2 Batería B (20 preguntas) — scripts/run-20-preguntas-api-ia-bateria-b.mjs

1. Buenos tardes  
2. ¿Cuál es el menú de mi banquete?  
3. Añade una tarea: contratar fotógrafo  
4. ¿Qué proveedores tengo contratados?  
5. Dame el detalle del presupuesto por categoría  
6. ¿Cuántos invitados han confirmado asistencia?  
7. Cambia la fecha del evento al 15 de junio  
8. ¿Dónde es la ceremonia?  
9. Lista los invitados que faltan por confirmar  
10. Sugiere flores de temporada para el centro de mesa  
11. ¿Cuál es mi lista de regalos?  
12. Envíame un recordatorio para la prueba de vestido  
13. ¿Quién es el invitado número 25?  
14. Compara precios de salones en la zona  
15. Resumen de pagos pendientes  
16. ¿A qué hora empieza el cóctel?  
17. Crea una mesa llamada Familia García  
18. ¿Qué música suena en el primer baile?  
19. Ayúdame a redactar las invitaciones  
20. ¿Cuánto me queda por pagar al catering?  

### 4.3 Batería C (20 preguntas) — scripts/run-20-preguntas-api-ia-bateria-c.mjs

1. Buenos días, ¿qué puedo hacer hoy?  
2. ¿Cuánto cuesta el banquete en total?  
3. Elimina la tarea de contratar DJ  
4. ¿Qué decoración tengo contratada?  
5. Muéstrame el desglose de invitados por mesa  
6. ¿Cuándo es la entrega del vestido?  
7. Añade un invitado: Laura Martínez, mesa 3  
8. ¿Dónde está el banquete?  
9. ¿Cuántos invitados son vegetarianos?  
10. Recomiéndame un pastel de boda para 80 personas  
11. ¿Qué regalos me han enviado ya?  
12. Pon recordatorio para confirmar catering la próxima semana  
13. ¿Quién se sienta en la mesa 5?  
14. Dame opciones de transporte para invitados  
15. ¿Qué facturas tengo pendientes de pago?  
16. ¿A qué hora es la ceremonia?  
17. Asigna a los García a la mesa principal  
18. Sugiere una canción para el baile de los novios  
19. Texto corto para las invitaciones de boda  
20. ¿Cuánto he pagado al fotógrafo?  

### 4.4 Batería D (20 preguntas) — scripts/run-20-preguntas-api-ia-bateria-d.mjs

1. Hola, necesito ayuda con mi boda  
2. ¿Cuál es el total del presupuesto?  
3. Marca como hecha la tarea de reservar salón  
4. ¿Tengo proveedor de música?  
5. ¿Cuánto he gastado en decoración?  
6. Lista los invitados con dieta especial  
7. Cambia el menú del banquete a menú degustación  
8. ¿En qué ciudad es el evento?  
9. Invitados que aún no han confirmado  
10. Ideas de centros de mesa low cost  
11. ¿Puedo ver mi lista de bodas de regalo?  
12. Recordatorio: llamar al catering mañana  
13. Dame el nombre del invitado en asiento 12  
14. Opciones de alojamiento para invitados  
15. Próximos pagos del evento  
16. Horario completo del día de la boda  
17. Renombra la mesa 2 a "Amigos del trabajo"  
18. Playlist sugerida para el cóctel  
19. Borrador de tarjeta de agradecimiento  
20. Estado de pago del salón  

**Total baterías A+B+C+D: 80 preguntas** (sin contar duplicados conceptuales entre baterías).

### 4.5 Otras preguntas en código (fixtures / tests)

- **appEventos __fixtures__/copilot.ts**: `"¿Cuántos invitados tengo?"`, `"¿Cuántos invitados confirmados hay?"`, `"Tienes 42 invitados confirmados."` (respuesta asistente).  
- **appEventos __tests__/api/copilot/chat.test.ts**: `"Hola"` (varias variantes de body).  
- **appEventos __tests__/api/chat/messages.test.ts**: `"Hola"`, `"Respuesta"`.  
- **e2e-app visitor-limit.spec.ts**: `"test"` (contenido de mensaje para probar límite de visitante).  
- **E2E multi-developer.spec.ts**: tests “preguntar sobre invitados / presupuesto / tareas / servicios” (sin texto literal único en código; se simula en UI).

### 4.6 Backend api-ia (preguntas y acciones)

- **1.000 preguntas**: `GET https://api-ia.bodasdehoy.com/api/admin/tests/questions` (categorías: general, wedding, events, etc.; dificultades: easy, medium, hard).  
- **300–600 acciones**: referidas en `docs/archive/PLAN_TESTS_BACKEND_REAL_V2.md` (endpoint por confirmar).  
- **TestSuite**: `POST /api/admin/tests/run`, `GET /api/admin/tests/stats`, `POST /api/admin/tests/compare`, `POST /api/admin/tests/questions`.  
- **Integración en repo**: `apps/chat-ia/src/test-helpers/integration/questions.test.ts` (conexión al backend, carga de preguntas, estructura; opcional `SKIP_BACKEND_TESTS`).

---

## 5. Tests appEventos (Jest) — resumen

| Archivo | Casos (aprox.) | Qué cubren |
|---------|-----------------|------------|
| components/Presupuesto/__tests__/BlockListaCategorias.test.tsx | 3 | presupuesto_objeto undefined, botón nueva categoría, categorias_array por prop |
| components/DefaultLayout/__tests__/ListItemProfile.test.tsx | 2 | título, onClick ítem menú |
| __tests__/api/copilot/chat.test.ts | 7 | POST /api/copilot/chat: 400 sin messages, contrato, backend no disponible |
| __tests__/api/chat/messages.test.ts | 6 | API chat/messages |
| __tests__/api/copilot/chat-history.test.ts | 6 | Historial copilot |
| utils/__tests__/copilotMetrics.test.ts | 2 | Métricas copilot |
| utils/__tests__/memoriesIntegration.test.ts | 2 | Integración memorias |
| services/__tests__/copilotChat.test.ts | 18 | Servicio copilot chat |

**Total appEventos: ~46 tests.**

---

## 6. Tests chat-ia (Vitest) — ámbitos

- **Store (Zustand)**: ~94 archivos, ~1.263 tests; 40/40 action files con test; guía en `zustand-store-action-test.mdc`.  
- **model-runtime**: 117 archivos, 2.683 tests; cobertura ~94%; `providerTestUtils`, tests por provider.  
- **database**: modelos, repositorios, cliente; doble entorno (PGLite + PostgreSQL con `TEST_SERVER_DB=1`); guía en `db-model-test.mdc`.  
- **Desktop (Electron)**: controladores en `apps/desktop/src/main/controllers/__tests__/`; guía en `desktop-controller-tests.mdc` y `electron-ipc-test.mdc`.  
- **Servidor/routers**: lambda (aiProvider, generation, message, user, etc.), globalConfig, ComfyUI, MCP, traducción, etc.  
- **Migraciones**: FromV1ToV2 … FromV6ToV7.  
- **Otros**: componentes, hooks, libs, prompts, context-engine, file-loaders, utils.

No se listan aquí los ~3.000+ nombres concretos de `it(...)` / `test(...)`; se ejecutan por patrón de archivo o por `-t "nombre"` (ver testing-guide y test-coverage.md).

---

## 7. Comandos para ejecutar tests (Claude Code)

- **E2E**: desde raíz, `pnpm test:e2e:app`, `pnpm test:e2e:app:todo`, `pnpm test:e2e:app:ver:local`, etc.  
- **appEventos**: desde raíz `pnpm test:web` o `pnpm test:front`; desde app `pnpm test` / `pnpm test:run`.  
- **chat-ia (por archivo)**: `pnpm exec vitest run --silent='passed-only' 'ruta/al/archivo.test.ts'`; packages: `cd packages/<nombre> && pnpm exec vitest run --silent='passed-only' 'patrón'`.  
- **Store**: `pnpm exec vitest run --silent='passed-only' 'src/store'`.  
- **Baterías de preguntas**:  
  - A: `node scripts/run-20-preguntas-api-ia.mjs [--json] [--output resultado.json]`  
  - B: `node scripts/run-20-preguntas-api-ia-bateria-b.mjs`  
  - C: `node scripts/run-20-preguntas-api-ia-bateria-c.mjs`  
  - D: `node scripts/run-20-preguntas-api-ia-bateria-d.mjs`  
  - Con usuario: `TEST_USER_EMAIL=... TEST_USER_PASSWORD=... node scripts/get-firebase-token-and-run-20.mjs`.

---

## 8. Referencias cruzadas

- Inventario general: **docs/INVENTARIO-TESTS.md**  
- Análisis 20 preguntas y criterio coherente/incoherente: **docs/ANALISIS-20-PREGUNTAS-API-IA.md**  
- Resultados baterías C y D: **docs/RESPUESTAS-BATERIAS-C-Y-D.md**  
- Plan backend real (1.000 preguntas, acciones, TestSuite): **docs/archive/PLAN_TESTS_BACKEND_REAL_V2.md**  
- E2E: **e2e-app/README.md**, **e2e-app/fixtures.ts**, **e2e-app/helpers.ts**

Este documento es la **relación máxima** de tests y preguntas identificada en el repositorio y en la documentación de Claude Code y testing.
