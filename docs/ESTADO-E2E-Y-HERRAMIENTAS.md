# Estado E2E y herramientas

Resumen de lo que tienes para avanzar con independencia.

## Tests de front (Jest + React Testing Library)

En **apps/appEventos** hay tests de componentes con Jest y `@testing-library/react`:

- **components/Presupuesto/__tests__/BlockListaCategorias.test.tsx** — no lanza error con `presupuesto_objeto` undefined, muestra botón nueva categoría, acepta `categorias_array` por prop.
- **components/DefaultLayout/__tests__/ListItemProfile.test.tsx** — muestra título, onClick del ítem del menú.

**Comandos:**

```bash
# Todos los tests de appEventos (API, utils, componentes)
pnpm test:web

# Solo tests de componentes (front)
pnpm test:front
```

---

## Playwright (tests E2E)

- **Navegador:** Firefox (el de Playwright). No Chromium.
- **Config:** `playwright.config.ts` (raíz). En local el navegador se abre; en CI corre headless.
- **Tests:** `e2e-app/*.spec.ts`
  - **home.spec.ts** — home carga, menú accesible.
  - **menu-usuario.spec.ts** — menú de perfil: abre, opciones según sesión, nombre visible.
  - **presupuesto.spec.ts** — /presupuesto carga sin error `categorias_array`, muestra contenido.

**Comandos:**

```bash
pnpm test:e2e:app          # Ejecuta todos (en local se abre Firefox)
pnpm test:e2e:app:headed   # Forzar navegador visible
pnpm test:e2e:app:ui       # Interfaz para depurar
pnpm verify:e2e             # Mismo que test:e2e:app, reporter list
```

**Requisito:** `pnpm exec playwright install firefox` (una vez).

---

## Nginx (reverse proxy)

- **Ejemplo de config:** `config/nginx-app-test-chat-test.conf.example`
- **Cómo cargarla:** ver `config/README.md` (copiar a sites-available, `nginx -t`, `nginx -s reload`).

---

## App y Copilot

- **Desarrollo:** `pnpm dev:local` (app 8080 + chat 3210).
- **Producción/test:** PM2 con `ecosystem.config.js` (app-test, chat-test).

Puedes seguir añadiendo tests en `e2e-app/`, ajustar nginx o Playwright según necesites.
