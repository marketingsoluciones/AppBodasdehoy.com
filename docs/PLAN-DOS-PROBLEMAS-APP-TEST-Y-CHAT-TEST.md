# Plan: dos problemas (app-test URL + chat-test ↔ api-ia)

**Objetivo:** Avanzar rápido en paralelo: en un frente resolver que la URL cargue con el dominio; en el otro ver por qué chat-test no se comunica con api-ia.

**Estado hoy (12 feb 2025):** **No trabajar con localhost.** Lo correcto es el **reverse proxy**: en el navegador (y en Cursor) se abre **sin puerto** → **https://app-test.bodasdehoy.com** y **https://chat-test.bodasdehoy.com**; el proxy reenvía a 8080/3210. Falta que en Cloudflare estén los Public Hostnames del túnel. Workaround: /etc/hosts + URLs con puerto. Ver [NAVEGADOR-CURSOR-ARRANCAR-Y-PROBAR-URLS.md](./NAVEGADOR-CURSOR-ARRANCAR-Y-PROBAR-URLS.md).

- **DNS en Cloudflare:** ✅ **Ya está correcto.** app-test y chat-test → CNAME a `30fdf520-9577-470f-a224-4cda1e5eb3f0.cfargotunnel.com` (Redirigido mediante proxy). No tocar DNS.
- **Falta:** En Cloudflare **Zero Trust → Tunnels → lobe-chat-harbor → Public Hostname**: que existan **app-test.bodasdehoy.com** → localhost:8080 y **chat-test.bodasdehoy.com** → localhost:3210. En esta máquina: túnel (`./scripts/iniciar-tunnel.sh`) y `pnpm dev` (8080 + 3210).
- Detalle: [DNS-YA-CORRECTO-FALTA-PUBLIC-HOSTNAMES.md](./DNS-YA-CORRECTO-FALTA-PUBLIC-HOSTNAMES.md).

---

## Problema 1: app-test no carga por VPN / dominio

**Qué pasa:** https://app-test.bodasdehoy.com no carga (ERR o timeout).

**Dónde se resuelve:** Configuración en **Cloudflare** (no en el código). El túnel en esta máquina ya está corriendo; falta que el tráfico de **bodasdehoy.com** llegue a este túnel.

### Pasos para que cargue (Cloudflare) — DNS ✅; falta Public Hostnames

**DNS ya está bien** (app-test y chat-test → túnel, Proxied). Solo falta:

| Paso | Dónde | Qué hacer |
|------|--------|-----------|
| 1 | **Zero Trust** → **Access** → **Tunnels** → **lobe-chat-harbor** → **Public Hostname** | Comprobar o añadir: **app-test.bodasdehoy.com** → HTTP → **localhost** → **8080**. Y **chat-test.bodasdehoy.com** → **localhost** → **3210**. |
| 2 | Esta máquina | `./scripts/iniciar-tunnel.sh` (túnel) y `pnpm dev` (8080 + 3210). |

Después, probar: https://app-test.bodasdehoy.com (sin puerto) → debe cargar y permitir login. Ver [DNS-YA-CORRECTO-FALTA-PUBLIC-HOSTNAMES.md](./DNS-YA-CORRECTO-FALTA-PUBLIC-HOSTNAMES.md).

Detalle: [RESOLVER-URLS-Y-REVERSE-CLOUDFLARE.md](./RESOLVER-URLS-Y-REVERSE-CLOUDFLARE.md), [REINICIAR-Y-REVISAR-APP-TEST-CHAT-TEST.md](./REINICIAR-Y-REVISAR-APP-TEST-CHAT-TEST.md).

### Por qué hace falta el reverse proxy (túnel)

Con el **puerto en la URL** (p. ej. http://app-test.bodasdehoy.com:8080) **tampoco carga** en muchos casos (red, firewall, dispositivo). Por eso se usa el **reverse proxy**: el usuario abre **https://app-test.bodasdehoy.com** (sin puerto), Cloudflare envía el tráfico al túnel y el túnel lo reenvía a localhost:8080 en esta máquina. El DNS ya apunta al túnel; falta que el túnel tenga los Public Hostnames (tabla anterior) y que túnel + servicios estén en marcha.

---

## Problema 2: chat-test no se comunica con api-ia

**Qué pasa:** El Copilot (chat-test o localhost:3210) no consigue hablar con el backend api-ia (auth, config, chat).

**Dónde se resuelve:**  
- **Repo Copilot (apps/copilot):** ya se aplicó uso de **same-origin + proxy** para que el navegador no llame a api-ia directo (evita CORS). Las llamadas van a `/api/auth/...`, `/api/config/...`, `/api/graphql` del Copilot y el servidor Next.js hace proxy a api-ia.  
- **Repo Web (apps/web):** cuando el usuario escribe en el chat desde la web, la petición va a **web** `POST /api/copilot/chat` y esa ruta hace proxy a api-ia. Si api-ia devuelve 503 (p. ej. API key no válida), el mensaje “no se comunica” viene de ahí.

### Comprobar qué falla (chat-test ↔ api-ia)

1. **Probar api-ia directo desde terminal:**
   ```bash
   ./scripts/test-api-ia-y-enviar-slack.sh
   ```
   Si ves **POST /webapi/chat/auto → 503** (API key no válida), el fallo está en **api-ia** (credenciales). Nosotros ya enviamos pruebas por Slack para que lo revisen.

2. **En local (sin depender de la URL):**
   - Arrancar: `pnpm dev` (web 8080 + Copilot 3210).
   - Abrir http://localhost:8080 → abrir Copilot → enviar un mensaje.
   - Si sale “Error al conectar con el servidor de autenticación”: en el Copilot ya usamos proxy; si api-ia devuelve error o no responde, se verá en **terminal del servidor web** (logs `[Copilot API]`) y en **consola del navegador**.

3. **Logs cuando “no se comunica”:**
   - **Terminal de apps/web (8080):** buscar `[Copilot API] Backend response status: 502/503` o `Proxy error`.
   - **Consola del navegador:** `[CopilotChat] Error sending message` o `Failed to fetch`.
   - Ver: [COPILOT-LOGS-CUANDO-NO-RESPONDE.md](./COPILOT-LOGS-CUANDO-NO-RESPONDE.md).

### Resumen por repo

| Repo | Qué toca | Acción |
|------|----------|--------|
| **Monorepo (este)** | **app (web)** – no hace falta cambiar código para que “cargue la URL”; eso es Cloudflare. | Usar localhost:8080 mientras no cargue el dominio; cuando Cloudflare esté bien, app-test cargará. |
| **Monorepo (este)** | **Copilot** – comunicación con api-ia | Ya está con proxy same-origin. Si sigue fallando, es api-ia (503/credenciales) o red; revisar logs y `test-api-ia-y-enviar-slack.sh`. |
| **api-ia (otro repo)** | Backend que recibe auth, config, chat | Corregir API key / credenciales para bodasdehoy; nosotros ya enviamos pruebas por Slack. |

---

## Cómo trabajar ya y avanzar rápido

| Objetivo | Qué hacer ahora |
|----------|------------------|
| **Que la URL cargue con el dominio** | Alguien con acceso a Cloudflare: aplicar pasos de la sección “Problema 1” (DNS + Public Hostnames). En paralelo, seguir desarrollando con localhost:8080 y :3210. |
| **Que chat-test “se comunique” con api-ia** | Probar en local (`pnpm dev` → localhost:8080 → Copilot → enviar mensaje). Revisar logs (web y navegador). Si api-ia devuelve 503, esperar corrección de credenciales por equipo api-ia (ya hay pruebas enviadas por Slack). |
| **Ambos repos** | Web: no hay cambio de código pendiente para “cargar URL”. Copilot: proxy ya aplicado; si algo falla, es backend o Cloudflare. |

Referencias rápidas:
- URL/túnel: [REINICIAR-Y-REVISAR-APP-TEST-CHAT-TEST.md](./REINICIAR-Y-REVISAR-APP-TEST-CHAT-TEST.md), [RESOLVER-URLS-Y-REVERSE-CLOUDFLARE.md](./RESOLVER-URLS-Y-REVERSE-CLOUDFLARE.md).
- Copilot ↔ api-ia: [COPILOT-ERROR-AUTENTICACION-Y-CORS.md](./COPILOT-ERROR-AUTENTICACION-Y-CORS.md), [COPILOT-LOGS-CUANDO-NO-RESPONDE.md](./COPILOT-LOGS-CUANDO-NO-RESPONDE.md).

---

## Ejecución del plan (12 feb 2025)

| Paso | Estado | Notas |
|------|--------|--------|
| 1. `./scripts/iniciar-tunnel.sh` | ✅ Ejecutado | Túnel iniciado en segundo plano (revisar `./cloudflared.log` en tu máquina). |
| 2. `pnpm dev` | ✅ En marcha | Web **http://localhost:8080** y Copilot **http://localhost:3210** responden 200. |
| 3. Cloudflare (DNS + Public Hostnames) | ⏳ Pendiente | **Frontend (nosotros)** tenemos acceso. Ver tabla siguiente. |
| 4. Probar en local | ✅ Listo | Usar localhost:8080 y :3210 hasta que app-test/chat-test carguen. |
| 5. api-ia | ✅ Probado + Slack | `test-api-ia-y-enviar-slack.sh`: health 200, config 200, **chat/auto 503** (API key/región). Resumen enviado a #copilot-api-ia. |

**URLs públicas:** app-test y chat-test.bodasdehoy.com siguen en **ERR** hasta que se configure Cloudflare. chat-test.eventosorganizador.com y api-ia → 200.

---

## Próximos pasos (avanzar ya)

| Orden | Quién / Dónde | Acción |
|-------|----------------|--------|
| 1 | Esta máquina | `./scripts/iniciar-tunnel.sh` → arranca el túnel (si no está corriendo). |
| 2 | Esta máquina | `pnpm dev` → web :8080 + Copilot :3210 (ya responden 200 en local). |
| 3 | Frontend (nosotros) – tenemos acceso a Cloudflare | DNS ya está ✅. Solo: Zero Trust → Tunnels → lobe-chat-harbor → Public Hostname: app-test.bodasdehoy.com→8080, chat-test.bodasdehoy.com→3210. |
| 4 | Desarrollar / probar | Usar **http://app-test.bodasdehoy.com:8080** y **http://chat-test.bodasdehoy.com:3210** (con /etc/hosts en esta máquina). No usar localhost. Ver `./scripts/avanzar-sin-localhost.sh`. |
| 5 | Si el chat no habla con api-ia | Ejecutar `./scripts/test-api-ia-y-enviar-slack.sh`; revisar logs en terminal web y consola; esperar corrección de API key por equipo api-ia. |
