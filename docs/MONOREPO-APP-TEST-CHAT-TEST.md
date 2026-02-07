# app-test y chat-test: nueva versión que va junta

## Resumen

- Todo está en un **monorepo** que ha estado funcionando: **AppBodasdehoy** (`apps/web`) y **LobeChat** (`apps/copilot`).
- **app-test** (AppBodasdehoy) y **chat-test** (LobeChat) son la **nueva versión** que estáis lanzando y **van de la mano**.
- **Producción** (organizador/chat en bodasdehoy.com) es **otra cosa** y **no es compatible** con esta versión; no se debe usar como sustitución de chat-test.
- Los dos entornos de test (app-test y chat-test) van detrás de **Cloudflare** en la misma “máquina”/red.

Para que el Copilot funcione en app-test hace falta que **chat-test responda**. No hay fallback a producción. La integración es el Copilot en panel lateral cargando chat-test en iframe (ver **MONOREPO-INTEGRACION-COPILOT.md**).

---

## Arquitectura

| Entorno    | App                | Origen en el repo | Rol                    |
|-----------|--------------------|-------------------|------------------------|
| **app-test**  | AppBodasdehoy (web) | `apps/web`        | Organizador (eventos, itinerario, etc.) |
| **chat-test** | LobeChat (Copilot)  | `apps/copilot`    | IA / Copilot           |

- **app-test.bodasdehoy.com** → app web (Next.js, `apps/web`).
- **chat-test.bodasdehoy.com** → LobeChat (Next.js, `apps/copilot`).

El Copilot en app-test es un iframe que carga **solo chat-test**. Si chat-test no responde (502, timeout), el Copilot no carga; no se usa chat de producción.

---

## Cloudflare

Los dos (app-test y chat-test) están detrás de Cloudflare. Para que todo funcione:

1. **app-test** debe resolver y servir la app web.
2. **chat-test** debe resolver y que el **origen** (servidor que atiende a chat-test) responda; si el origen no responde, Cloudflare devuelve 502.

Por tanto, para que el Copilot funcione hay que asegurar que el **origen de chat-test** esté arriba y que DNS/Cloudflare apunten bien a ese origen.

---

## Qué hacer para que funcionen los dos

1. **Levantar el servicio de chat-test** en el servidor que use Cloudflare para chat-test (por ejemplo con PM2: `ecosystem.config.js` → `chat-test` con `apps/copilot/start.sh`), **o**
2. **Configurar DNS en Cloudflare** para chat-test (por ejemplo CNAME u origen) de forma que el tráfico llegue al servidor donde corre `apps/copilot`.

Cuando chat-test responda, app-test y el Copilot funcionarán juntos como la nueva versión. Producción se deja aparte y no se mezcla con este par.
