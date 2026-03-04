# Estado: subdominios y avances

## Si el subdominio sigue sin cargar cuando lo usas

El subdominio (app-test) **es lo básico para el login**; sin que cargue no puedes hacer login ni el resto de pruebas.

**Guía detallada (repositorio y puertos):** **`docs/SUBDOMINIOS-APUNTAN-REPOSITORIO.md`** (en la raíz del monorepo). **Si la VPN está creada pero falta algo:** **`docs/QUE-FALTA-VPN-Y-SUBDOMINIOS.md`** (login requiere app-test; Firebase no acepta localhost).

Resumen rápido:
- **Local (esta máquina):** 1) Añadir a `/etc/hosts`: `127.0.0.1 app-test.bodasdehoy.com` y `127.0.0.1 chat-test.bodasdehoy.com`. 2) Levantar web en 8080 (`apps/web`: `npm run dev:local`) y Copilot en 3210 (`apps/copilot`: `pnpm dev`). 3) Abrir **http://app-test.bodasdehoy.com:8080** y **http://chat-test.bodasdehoy.com:3210**.
- **Remoto (Cloudflare → servidor):** Servidor con web en 3000 (prod) o 8080 (dev) y Copilot en 3210; proxy (p. ej. nginx) derivando app-test → :3000 (o :8080) y chat-test → :3210.

Cuando el subdominio cargue, ya puedes hacer login y seguir con las pruebas.

---

## Subdominios sí funcionan (cuando la config está bien)

**Los subdominios (app-test, chat-test)** están configurados y son **lo básico para seguir probando**. Si desde algún entorno no cargan, revisar la sección de arriba y el diagnóstico más abajo (Cloudflare, puerto, servidor).

---

## Lo que está hecho (avances)

| Avance | Dónde |
|--------|--------|
| **Login sin redirigir a otro subdominio** | Tras iniciar sesión ya no se manda al usuario a chat-test; se queda en el mismo origen. Menos errores por subdominio. |
| **Normalización del redirect** | `utils/urlHelpers.ts` → `normalizeRedirectAfterLogin()`. Usado en AuthContext y Authentication. |
| **Página de testing** | `/test-preguntas`: estado del front, login, preguntas de ejemplo, recordatorio de usar origen real y que chat-test esté arriba. |
| **Canal que da menos errores** | Documentado: app-test + Copilot en panel lateral (iframe), no abrir chat-test en otra pestaña. |
| **Login automático (consejos)** | Doc: esperar a que cargue la pantalla, escribir usuario/clave muy despacio (3 s entre teclas) para no ser baneados por Firebase. |
| **Origen real, no localhost** | Instrucciones de usar app-test.bodasdehoy.com para pruebas, no localhost. |
| **Botón Copilot con testid** | `data-testid="copilot-toggle"` para pruebas automáticas cuando el snapshot devuelva refs. |

**Dependencia:** Sin levantar el dominio y hacer login **no se puede ejecutar el resto de pruebas**. Primero dominio arriba, luego login (con cuidado: si actúas como robot, Firebase o Google te banean). Después ya se puede abrir Copilot y lanzar preguntas.

Flujo: **1) Levantar dominio (app-test, chat-test)** → **2) Login** (manual o muy lento si se automatiza) → **3) Resto de pruebas** (Copilot, preguntas).

---

## Por qué los subdominios no cargan (diagnóstico)

**La red/VPN está configurada en Cloudflare.** Al diagnosticar que no cargan app-test o chat-test, revisar primero en Cloudflare (DNS, proxy, reglas, WAF).

Si **app-test.bodasdehoy.com** o **chat-test.bodasdehoy.com** no cargan (pantalla en blanco, 502, timeout, chrome-error), revisar por este orden:

1. **Cloudflare (red/VPN configurada aquí)**  
   - DNS: registros de `app-test.bodasdehoy.com` y `chat-test.bodasdehoy.com` apuntando al origen correcto.  
   - Proxy: que el tráfico llegue al servidor de origen; revisar reglas, WAF, Page Rules que puedan bloquear o redirigir mal.  
   - Origen: que los hostnames de origen en Cloudflare coincidan con donde están levantadas la app web y el Copilot.

2. **Puerto de esta máquina y derivación (forwarding)**  
   - **app-test** = app web: en **dev** puerto **8080** (`apps/web`: `npm run dev`), en **prod** puerto **3000** (`apps/web/start.sh`: `next start -p 3000`).  
   - **chat-test** = Copilot: puerto **3210** (dev y prod).  
   - Cloudflare (o el proxy) debe derivar: **app-test** → **3000** (prod) o **8080** (dev); **chat-test** → **3210**.  
   - En **local** hace falta **/etc/hosts** (127.0.0.1 app-test y chat-test) y abrir **http://app-test.bodasdehoy.com:8080** y **http://chat-test.bodasdehoy.com:3210**.  
   - Guía completa: **`docs/SUBDOMINIOS-APUNTAN-REPOSITORIO.md`** (repositorio y puertos con detalle).

3. **Servidor de origen**  
   - Web (app-test): levantada en **8080** (dev) o **3000** (prod, start.sh).  
   - Copilot (chat-test): levantada en **3210**.  
   - Probar en el servidor: `curl -I http://127.0.0.1:3000` (o 8080) y `curl -I http://127.0.0.1:3210`.  
   - Ver **`docs/SUBDOMINIOS-APUNTAN-REPOSITORIO.md`** para local (etc/hosts) y remoto (Cloudflare + proxy).

4. **Red / VPN**  
   - En algunas redes o con VPN los subdominios pueden no resolverse o bloquearse. Probar en otra red o sin VPN.

5. **Firebase (solo para login)**  
   - Que en Firebase Console → Authentication → Authorized domains estén `app-test.bodasdehoy.com` y `chat-test.bodasdehoy.com` (ya configurado según comentaste).

---

## Próximos pasos cuando los subdominios carguen

1. Abrir **https://app-test.bodasdehoy.com/test-preguntas** (origen real).
2. Iniciar sesión en app-test (siguiendo los consejos de login si es automático).
3. Abrir el Copilot desde el **panel lateral** (no abrir chat-test en otra pestaña).
4. Lanzar las preguntas de ejemplo desde ese Copilot.

Si quieres, el siguiente paso puede ser un **checklist de verificación** (script o lista de comandos) para comprobar DNS, curl a app-test/chat-test y Firebase desde tu máquina.
