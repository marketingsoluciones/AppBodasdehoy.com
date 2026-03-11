# E2E — Playwright (app web)

Playwright: [microsoft/playwright](https://github.com/microsoft/playwright) — framework para testing y automatización web.

**Navegador:** en este proyecto **solo se usa WebKit (Safari)**. Chromium está vetado/prohibido. Instalación: `pnpm test:e2e:app:install` (instala WebKit).

Las **APIs y la autenticación están en servidores reales** (no hay APIs locales). Para que **login y auth funcionen**, hay que correr los tests contra el **dominio real**, no contra localhost.

## VPN (app-test + chat-test)

Para pruebas contra **app-test** y **chat-test** (login, redirect, usuario logueado) hace falta **VPN** activa para que resuelvan y respondan `app-test.bodasdehoy.com` y `chat-test.bodasdehoy.com`. Sin VPN, los tests que usan `BASE_URL=https://app-test.bodasdehoy.com` pueden fallar por timeout o red.

## Cuál usar: el que os funciona

**El que suele funcionar bien** (WebKit/Safari, app-test + chat-test con VPN) es:

```bash
pnpm test:e2e:app:real
```

Ejecuta smoke + home + login + redirect contra app-test con WebKit visible. **Usad este si los otros os fallan.**

Otras opciones:

- `pnpm test:e2e:app:basico` — solo smoke, WebKit.
- `pnpm test:e2e:app:fast` — smoke rápido, WebKit.

Si algo no carga o falla, volved a **`pnpm test:e2e:app:real`**.

## No veo nada en el navegador

Si el navegador se abre pero la página está en blanco, suele ser porque los tests están apuntando a **app-test** (remoto) y sin VPN no carga. Para **ver la app en el navegador** usando tu entorno local:

```bash
pnpm test:e2e:app:ver:local
```

Ese comando arranca la app en **localhost:8080**, abre **WebKit (Safari)**, carga la página y **espera 8 segundos** para que puedas verla antes de seguir. Usa animación lenta (E2E_SLOW=1). Ejecútalo desde la **raíz del monorepo**. Primera vez: `pnpm test:e2e:app:install` para instalar WebKit.

## Prerequisito: ejecutar desde la raíz del monorepo

Todos los comandos E2E deben ejecutarse **desde la raíz del repo** (donde está `playwright.config.ts` y el `package.json` que tiene los scripts `test:e2e:app:*`).

- Si estás en la carpeta padre (p. ej. `Projects`), entra en la carpeta del proyecto. El nombre puede ser `AppBodasdehoy.com` u otro (p. ej. `appbodasdehoy`). Para ver qué carpetas hay: `ls` y luego `cd <nombre-de-la-carpeta-del-proyecto>`.
- **Desde Cursor:** abre la terminal integrada (Terminal → New Terminal); suele abrir ya en la raíz del workspace. Ahí puedes ejecutar `pnpm test:e2e:app:todo` directamente.
- Si ves `Command "test:e2e:app:todo" not found`, no estás en la raíz del monorepo: entra en la carpeta donde está el `package.json` que contiene ese script.

## Pruebas reales en el navegador (recomendado)

Para **ver las pruebas en el navegador** (siempre se abre WebKit/Safari visible):

```bash
pnpm test:e2e:app:real      # smoke + home + login + redirect (app-test → chat-test) contra app-test — WebKit visible
pnpm test:e2e:app:real:rutas # las 16 rutas — mismo, WebKit visible
```

Los scripts usan **siempre WebKit (Safari)** con ventana visible. Para ir más despacio: `E2E_SLOW=1 pnpm test:e2e:app:real`.

## Correr todos los tests (todo)

**Desde la raíz del monorepo** (la carpeta donde está el `package.json` del proyecto):

```bash
pnpm test:e2e:app:todo     # TODOS los specs, Chrome visible, app-test (VPN)
pnpm test:e2e:app:dominios # mismo: todos los tests contra https://app-test.bodasdehoy.com
```

Con el spec de visitor-limit:
```bash
PLAYWRIGHT_BROWSER=webkit BASE_URL=https://app-test.bodasdehoy.com E2E_FAST=1 npx playwright test e2e-app/visitor-limit.spec.ts
```

## Scripts

| Comando | Descripción |
|--------|-------------|
| `pnpm test:e2e:app:install` | **Primera vez:** instala Chromium. Para WebKit: `pnpm exec playwright install webkit` |
| `pnpm test:e2e:app:real` | **El que suele funcionar:** smoke + home + login + redirect, Chrome visible, app-test (VPN) |
| `pnpm test:e2e:app:basico` | Alternativa ligera: solo smoke, Chromium de Playwright |
| `pnpm test:e2e:app:real:rutas` | Igual, 16 rutas (navegador visible) |
| `pnpm test:e2e:app:todo` | **Todos los specs**, WebKit (Safari) visible, app-test (VPN). |
| `pnpm test:e2e:app:dominios` | Igual que todo: todos los tests contra app-test.bodasdehoy.com |
| `pnpm test:e2e:app` | Tests contra localhost (arranca servidor local) |
| `pnpm test:e2e:app:smoke` | Solo smoke |
| `pnpm test:e2e:app:errores` | Mensaje 403: simula API con 403 y comprueba sesión expirada |
| `pnpm test:e2e:app:guest-logueado` | Guest + logueado (VPN + app-test) |
| `pnpm test:e2e:app:ui` | Interfaz de Playwright (depurar) |
| `pnpm verify:e2e` | Para CI: headless contra app-test.bodasdehoy.com |

---

## Estado actual de tests — Cobertura implementada

### Specs existentes (Marzo 2026)

| Spec | Tests | Qué certifica |
|------|-------|---------------|
| **smoke.spec.ts** | 2 | Raíz `/` carga; `/api/health` responde |
| **home.spec.ts** | 2 | Home visible sin ErrorBoundary |
| **login.spec.ts** | 2 | `/login` muestra formulario/marca |
| **menu-usuario.spec.ts** | 3 | Menú perfil abre; opciones según sesión; nombre visible |
| **presupuesto.spec.ts** | 2 | `/presupuesto` carga sin crash |
| **rutas.spec.ts** | 16 | Las 16 rutas de la app cargan sin pantalla blanca |
| **errores-api.spec.ts** | 1 | 403 de API → banner "sesión expirada" (no error genérico) |
| **redirect-login.spec.ts** | 2 | `/login` en app-test redirige a chat-test (SSO) |
| **guest-y-logueado.spec.ts** | 8 | Diferencia guest/logueado: menú, rutas, sin ErrorBoundary |
| **perfiles-visitante.spec.ts** | 10 | UX visitante completo: home, rutas protegidas, chat-ia, copilot iframe |
| **visitor-limit.spec.ts** | 8 | Límite mensajes: cookie vis_mc, visitor ID persistente, server-side check, identidad unificada iframe+standalone |
| **registro-y-onboarding.spec.ts** | ~15 | Login page estructura; credenciales erróneas; login real; sesión persiste; logout; SSO chat-test→app-test; modo visitante |
| **modulos-organizador.spec.ts** | ~20 | Home, resumen, presupuesto, invitados, mesas, itinerario, servicios; crear evento; navegación entre módulos |
| **copilot-chat.spec.ts** | ~10 | Iframe copilot presente; sin error 500; PAGE_CONTEXT; filter_view/CLEAR_FILTER; chat standalone; modal 402 |
| **billing.spec.ts** | ~10 | /settings/billing, /transactions, /planes (FREE/BASIC/PRO/MAX); plan actual marcado; /facturacion en appEventos |
| **portal-invitado.spec.ts** | ~10 | /e/[eventId] sin auth; 404 graceful; countdown; RSVP; buscador-mesa; acceso sin sesión |
| **edge-cases.spec.ts** | ~15 | Rutas 404; 403 mid-session; API 503; navegación rápida; reload sucesivo; health check |

**Total: ~136 tests** — Suite base (56) + nuevos specs (80) con variantes condicionales según credenciales y VPN.

---

## NOTA IMPORTANTE — Conversación de visitante al registrarse

**Las conversaciones del visitante SE PIERDEN al registrarse.** El nuevo Firebase UID no tiene acceso a los chats del `visitor_xxx` anterior (stored en api2 por userId). Esto es una oportunidad de mejora: migrar conversaciones del visitante al usuario registrado durante el proceso de signup.

**Impacto UX:** un visitante que tuvo 2-3 chats de exploración y luego se registra verá el chat vacío. Para la conversión esto es negativo — el usuario pierde contexto de lo que construyó antes.

**Solución pendiente:** pasar `previousVisitorId` en el payload de registro y hacer una migración de chats en api2.

---

## Vars de entorno para tests con credenciales

```bash
TEST_USER_EMAIL=tu@email.com    # Usuario Firebase real (test)
TEST_USER_PASSWORD=pass123      # Contraseña
E2E_EVENT_ID=abc123             # ID de evento real para tests de portal
```

Si no se definen, los tests que las necesitan se saltan automáticamente (`test.skip()`).

---

## Plan de tests para esta semana — Máxima cobertura

### PRIORIDAD 1 — Funcionalidad core (en cuanto se registra alguien)

```
e2e-app/registro-y-onboarding.spec.ts
```

| Test | Qué cubre |
|------|-----------|
| Registro con email+password funciona | Formulario → cuenta creada → redirige al chat |
| Login con email+password funciona | Credenciales válidas → sesión activa → app carga |
| Login con credenciales erróneas muestra error | No crashea; mensaje de error visible |
| Sesión persiste entre recargas | Reload → sigue logueado (cookie sessionBodas) |
| Logout limpia la sesión | Cerrar sesión → menú muestra "Iniciar sesión" |
| SSO chat-ia → appEventos | Login en chat-test → cookie idTokenV0.1.0 → app-test reconoce sesión |
| SSO appEventos → chat-ia | Session en app-test → iframe copilot ya autenticado |

### PRIORIDAD 2 — Módulos de organización de evento

```
e2e-app/modulos-organizador.spec.ts
```

| Test | Qué cubre |
|------|-----------|
| Crear evento: formulario válido y guarda | Nombre + tipo + fecha → evento creado en lista |
| Crear evento: fecha pasada muestra error de validación | Yup validation → campo marcado en rojo |
| Crear evento: campo vacío no avanza | Sin nombre → no submit |
| Añadir invitado: nombre y email mínimos | Formulario invitados → invitado aparece en tabla |
| Invitados: filtrar por nombre | Input search → tabla filtrada |
| Presupuesto: añadir partida | Nueva categoría + importe → total actualizado |
| Presupuesto: editar partida existente | Cambiar importe → total recalculado |
| Mesas: crear mesa y asignar invitado | Mesa creada → invitado asignado → aparece en plano |
| Itinerario: añadir momento | Momento con hora → aparece en línea de tiempo |
| Resumen evento: muestra datos del evento activo | Nombre, fecha, tipo visibles |

### PRIORIDAD 3 — Copilot y chat IA

```
e2e-app/copilot-chat.spec.ts
```

| Test | Qué cubre |
|------|-----------|
| Copilot iframe carga para usuario logueado | `LOBE_CHAT_READY` recibido o iframe visible con contenido |
| Copilot recibe contexto de página (PAGE_CONTEXT) | Navegar a /presupuesto → copilot recibe contexto |
| Copilot filter_view: filtra tabla al recibir FILTER_VIEW | Banner rosa aparece en /invitados tras filter |
| Chat en chat-ia: mensaje enviado recibe respuesta | Input → Enter → respuesta IA aparece |
| Chat: saldo insuficiente muestra modal correcto | 402 → InsufficientBalanceModal visible |
| Visitor: límite 3 mensajes → modal registro | Ya cubierto en visitor-limit.spec.ts |

### PRIORIDAD 4 — Billing y planes

```
e2e-app/billing.spec.ts
```

| Test | Qué cubre |
|------|-----------|
| `/facturacion` carga con saldo y plan | Balance visible, plan actual marcado |
| `/settings/billing/transactions` muestra historial | Tabla de transacciones visible o "sin transacciones" |
| `/settings/billing/planes` muestra los planes | FREE/BASIC/PRO/MAX visibles |
| Plan FREE: algunas funciones muestran upsell | Banner o restricción visible |
| Auto-recarga: toggle activa/desactiva | Switch cambia estado y persiste |

### PRIORIDAD 5 — Perfiles de usuario diferenciados

```
e2e-app/perfiles-registrado.spec.ts  (ampliar perfiles-visitante)
```

| Test | Qué cubre |
|------|-----------|
| Usuario FREE: /mesas accessible | Rutas de mesas cargan con contenido |
| Usuario FREE: copilot con límite de tokens | Al agotar tokens → modal InsufficientBalance |
| Usuario FREE→BASIC: upgrade flujo | Click upgrade → formulario pago visible |
| Guest (appEventos sin auth) → conversación visible | Guest crea evento → evento en lista |
| Guest → registro → conversación NO perdida (pendiente migración) | Verificar si existe migración |

### PRIORIDAD 6 — Portal del invitado

```
e2e-app/portal-invitado.spec.ts
```

| Test | Qué cubre |
|------|-----------|
| `/e/[eventId]` carga sin auth | Página pública del evento visible |
| Portal muestra countdown si fecha en futuro | Timer visible con días restantes |
| Portal muestra formulario RSVP | Input confirmar asistencia visible |
| RSVP: confirmar asistencia | Submit → mensaje de confirmación |
| Portal con eventId inválido no crashea | 404 graceful o mensaje de evento no encontrado |

### PRIORIDAD 7 — Gestión de errores y edge cases

```
e2e-app/edge-cases.spec.ts
```

| Test | Qué cubre |
|------|-----------|
| Ruta inexistente muestra 404 graceful | `/pagina-que-no-existe` → 404 o redirect, sin crash |
| App con JS desactivado no crashea | (Solo informativo, difícil de automatizar) |
| Sesión expirada en mid-session | Cookie eliminada → next request → banner sesión expirada |
| API caída: app muestra error útil | Mock 503 → mensaje de error claro |
| Reconexión tras error de red | Error temporal → retry → app recupera |

---

## Estado de implementación

```
✅ registro-y-onboarding.spec.ts  — Login page, SSO, visitor mode, logout
✅ modulos-organizador.spec.ts    — Todos los módulos del organizador
✅ copilot-chat.spec.ts           — Iframe, filter_view, chat standalone, 402
✅ billing.spec.ts                — Planes, transacciones, facturación
✅ portal-invitado.spec.ts        — Portal público, RSVP, buscador-mesa
✅ edge-cases.spec.ts             — 404, 403, 503, navegación rápida, mid-session
⏳ perfiles-registrado.spec.ts   — Pendiente: FREE vs BASIC vs PRO, upgrade flow
```

**Total implementado: ~136 tests** cubriendo todos los flujos principales del producto.

---

## Helpers disponibles

```ts
import { clearSession, waitForAppReady } from './helpers';

// Limpiar sesión completa (cookies + localStorage + IndexedDB Firebase)
await clearSession(context, page);

// Esperar a que la app cargue (body con texto, sin ErrorBoundary)
await waitForAppReady(page, 20_000);
```

## No se abre el navegador / no veo las pruebas

- **Ejecuta desde la terminal** (no desde el panel de Tests de Cursor/VS Code).
- Si tienes **CI=true** en el entorno, el navegador va en headless. Para verlo: `CI= E2E_HEADED=1 pnpm test:e2e:app:real`.
- **WebKit (por defecto):** los scripts usan `PLAYWRIGHT_BROWSER=webkit` (motor Safari en macOS, más ligero).
- **Interfaz de Playwright:** `pnpm test:e2e:app:ui` abre la UI de Playwright donde puedes elegir tests y ver el navegador.
