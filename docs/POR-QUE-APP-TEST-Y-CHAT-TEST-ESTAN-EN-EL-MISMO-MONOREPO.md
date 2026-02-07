# Por qué app-test (AppBodasdehoy) y chat-test (LobeChat) están en el mismo monorepo

## Estructura del monorepo

Es **un solo repositorio** (`bodasdehoy-monorepo`) con varias aplicaciones y paquetes compartidos:

```
bodasdehoy-monorepo/
├── apps/
│   ├── web/          → AppBodasdehoy  (desplegado como app-test.bodasdehoy.com)
│   └── copilot/      → LobeChat       (desplegado como chat-test.bodasdehoy.com)
├── packages/
│   ├── copilot-ui/   → UI del Copilot (iframe, URL, tipos) – lo usa apps/web
│   └── shared/       → Código compartido (auth, postMessage, tipos)
├── pnpm-workspace.yaml
├── package.json
└── ecosystem.config.js   → PM2: app-test (web), chat-test (copilot)
```

- **app-test** = build/despliegue de `apps/web` (nombre del paquete: `@bodasdehoy/web`).
- **chat-test** = build/despliegue de `apps/copilot` (nombre del paquete: `@bodasdehoy/copilot`, base LobeChat).

---

## Por qué están los dos en el mismo monorepo

### 1. Integración directa (Copilot dentro de la app)

La app web (AppBodasdehoy) **integra el Copilot** en el sidebar. Ese Copilot es LobeChat cargado en un iframe que apunta a **chat-test**. Para que esa integración sea estable y con tipos compartidos:

- La app web usa el paquete **`@bodasdehoy/copilot-ui`** (en `packages/copilot-ui`), que sabe cómo construir la URL del iframe (chat-test en app-test), manejar el timeout y el fallback “Abrir en nueva pestaña”.
- Ese paquete vive en el **mismo monorepo** que `apps/web` y `apps/copilot`, así que se puede cambiar la integración (rutas, query params, comportamiento) en un solo commit y con dependencias `workspace:*`.

Si LobeChat estuviera en otro repo sin monorepo, cada cambio de contrato (URL, parámetros, postMessage) implicaría publicar paquetes y coordinar versiones entre dos repos.

### 2. Código compartido (`packages/shared` y `packages/copilot-ui`)

- **`@bodasdehoy/shared`**: tipos, auth bridge, postMessage, etc., usados por la app web y por el paquete del Copilot.
- **`@bodasdehoy/copilot-ui`**: usado solo por `apps/web` y conoce la convención de URLs (app-test → chat-test, producción → otro).

Tener esto en el mismo monorepo permite:

- Una sola fuente de verdad para tipos y contratos entre la app y el chat.
- Refactors que tocan app + copilot + shared en un mismo PR.

### 3. Misma versión y ciclo de release

app-test y chat-test son la **nueva versión** que va junta. En un monorepo:

- Se puede levantar todo con `pnpm dev` (web + copilot).
- Un mismo tag o release puede incluir cambios en `apps/web` y `apps/copilot`.
- `ecosystem.config.js` define los dos procesos (app-test y chat-test) en un solo sitio, coherente con “una máquina / un despliegue de la nueva versión”.

### 4. Despliegue y configuración alineados

- **PM2** en el mismo repo: `app-test` → `apps/web/start.sh`, `chat-test` → `apps/copilot/start.sh`.
- Variables de entorno, dominios (app-test / chat-test) y documentación (p. ej. que van detrás de Cloudflare) se pueden mantener en un solo lugar.

Así se evita tener que coordinar dos repositorios y dos pipelines solo para “la app de bodas y su chat de prueba”.

### 5. Resumen en una frase

**App-test (AppBodasdehoy) y chat-test (LobeChat) están en el mismo monorepo porque son dos partes de la misma oferta (organizador + Copilot IA) que se integran directamente, comparten paquetes y tipos, y se versionan y despliegan juntos como una sola “nueva versión”.**

Producción (organizador/chat en bodasdehoy.com) es otra línea (otra versión, otro despliegue) y por eso no se mezcla en este par app-test ↔ chat-test.
