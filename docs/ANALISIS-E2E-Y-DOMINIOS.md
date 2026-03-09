# Análisis: E2E (Playwright) y uso de dominios

## 1. Estado actual

### 1.1 Configuración Playwright (`playwright.config.ts`)

| Aspecto | Valor |
|--------|--------|
| **Navegador** | WebKit (Desktop Safari) |
| **baseURL** | `process.env.BASE_URL` o `http://127.0.0.1:8080` |
| **webServer** | Solo si la URL es local (localhost / 127.0.0.1). Si `BASE_URL` es un dominio real, no se arranca servidor. |
| **Timeouts** | 60s test, 20s action, 60s navigation |
| **Headless** | Solo cuando `CI === 'true'` |

**Detección de “local”:**  
`isLocal` es `true` solo si `baseURL` es `http(s)://localhost(...)` o `http(s)://127.0.0.1(...)`. Cualquier otro dominio (p. ej. `https://app-test.bodasdehoy.com`) se trata como remoto y no se lanza `webServer`.

### 1.2 Scripts E2E (`package.json`)

| Script | Comportamiento |
|--------|----------------|
| `test:e2e:app` | Tests contra localhost; arranca `pnpm dev:web` si la URL es local. |
| `test:e2e:app:dominios` | `BASE_URL=https://app-test.bodasdehoy.com` → tests contra dominio real, sin servidor local. |
| `test:e2e:app:install` | Instala WebKit. |
| `test:e2e:app:smoke` / `:login` / `:rutas` | Subconjuntos de tests (smoke, login, rutas). |
| `test:e2e:app:ui` | Interfaz de Playwright (depuración). |
| `verify:e2e` | `CI=true BASE_URL=https://app-test.bodasdehoy.com`; headless contra app-test (para CI). |

### 1.3 Specs en `e2e-app/`

| Spec | Propósito |
|------|-----------|
| `smoke.spec.ts` | Raíz `/` carga; `/api/health` responde. Usa `waitForAppReady`. |
| `home.spec.ts` | Home muestra perfil o contenido; no ErrorBoundary. |
| `login.spec.ts` | `/login` muestra marca/formulario (Bodas de Hoy, Iniciar sesión, etc.). |
| `menu-usuario.spec.ts` | Menú de perfil (abrir, opciones según login, nombre). |
| `presupuesto.spec.ts` | `/presupuesto` carga y muestra contenido esperado. |
| `rutas.spec.ts` | 16 rutas: /, /login, invitados, resumen-evento, presupuesto, mesas, itinerario, invitaciones, lista-regalos, configuracion, facturacion, info-app, eventos, servicios, bandeja-de-mensajes, momentos. |

**Helpers:** `helpers.ts` exporta `waitForAppReady(page)` para esperar a que el body tenga contenido (evitar fallos por “Cargando…” del AuthContext).

**Eliminado:** `global-setup.ts` se eliminó (no se usaba); el arranque del servidor se controla solo con `webServer` cuando la URL es local.

---

## 2. APIs y autenticación (por qué importa el dominio)

- Las APIs están en **servidores reales** (api.bodasdehoy.com, apiapp, api-ia, etc.). No hay “API local” que simule todo.
- **Auth (cookies, Firebase, SSO):** dominios y cookies están configurados para `.bodasdehoy.com` (o similares). En `localhost`:
  - Cookies de sesión pueden no compartirse o no ser válidas.
  - Login con Google/SSO puede estar restringido a dominios autorizados.
  - Algunas rutas pueden redirigir a chat-test/chat para login unificado.
- Por tanto: **contra dominio real (p. ej. app-test) login y auth suelen funcionar; contra localhost pueden fallar** (login, permisos, redirecciones).

---

## 3. Riesgos y puntos débiles

1. **`verify:e2e` en CI**  
   Ya usa `BASE_URL=https://app-test.bodasdehoy.com` y `CI=true` (headless). El pipeline debe tener app-test desplegado y estable.

2. **app-test disponible**  
   Si `https://app-test.bodasdehoy.com` no responde o no tiene `/api/health`, `test:e2e:app:dominios` fallará. El health está en `apps/appEventos/pages/api/health.ts` y debe estar desplegado.

3. **Rutas que requieren login/evento**  
   Especs como `menu-usuario`, `presupuesto` o `rutas` pueden ver “No tienes permiso” o redirección a login cuando se ejecutan sin sesión. Eso es esperado; los tests comprueban que la página carga y muestra algo coherente (permiso, login, etc.), no que el usuario esté logueado.

4. **Código muerto**  
   `e2e-app/global-setup.ts` fue eliminado (no se usaba).

5. **Dependencia de WebKit**  
   Si en algún entorno WebKit no está disponible o da problemas, habría que añadir otro proyecto (p. ej. Chromium) y elegirlo por variable de entorno.

---

## 4. Recomendaciones

1. **Uso diario:**  
   Ejecutar contra dominio real:  
   `pnpm test:e2e:app:dominios`  
   (o `BASE_URL=https://app-test.bodasdehoy.com pnpm test:e2e:app`).

2. **CI:**  
   Usar `pnpm verify:e2e` en el pipeline; ya lleva `BASE_URL=https://app-test.bodasdehoy.com` y headless.

3. **Limpieza:**  
   Hecho: se eliminó `e2e-app/global-setup.ts`.

4. **Estabilidad contra app-test:**  
   Tener en cuenta que tests contra app-test dependen de que el entorno esté desplegado y de que no haya cambios que rompan rutas o health (por ejemplo, mantener `/api/health` en despliegues).

5. **Login real en E2E (opcional):**  
   Si se quieren flujos “con usuario logueado”, haría falta un flujo de login en los tests (por ejemplo con cuenta de test y/o bypass en app-test) y reutilizar la sesión (storage state). Hoy los specs se centran en “página carga y muestra contenido coherente”.

---

## 5. Resumen

- **Configuración:** correcta para distinguir local vs dominio real y no arrancar servidor cuando se usa un dominio.
- **Recomendado:** usar `pnpm test:e2e:app:dominios` (app-test) para que login y auth funcionen como en producción.
- **Local:** `pnpm test:e2e:app` sigue siendo útil para ver que la app arranca y las rutas responden, asumiendo que auth/APIs pueden fallar.
- **Pendiente/opcional:** CI con `BASE_URL` a app-test, limpieza de `global-setup.ts`, y si se desea, E2E con login real y storage state.
