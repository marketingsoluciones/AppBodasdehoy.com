# Local con dominios app-test y chat-test (login y Copilot)

Objetivo: que **en local** todo funcione usando los dominios **app-test.bodasdehoy.com** y **chat-test.bodasdehoy.com** (por temas de login, cookies y OAuth).

**¿Sigo sin ver que funcione?** → Ve a la **sección 8** (Cómo verificar que funciona) y sigue los pasos en orden; el paso 2 usa `/api/health` para comprobar que la app responde.

**¿Sigo sin ver que funcione?** Ir a la **sección 8** (Cómo verificar que funciona) y seguir los pasos; el paso 2 usa `/api/health` para comprobar que la app responde.

**Importante:** En producción (o detrás de proxy), **app-test** y **chat-test** no llevan puerto en la URL (usan 80/443). Los puertos **8080** y **3210** son **solo para desarrollo local**, porque en tu máquina los servidores de Next.js escuchan en esos puertos.

---

## 1. /etc/hosts

Añade en tu máquina (macOS/Linux: `sudo nano /etc/hosts` o `sudo vim /etc/hosts`):

```
127.0.0.1   app-test.bodasdehoy.com
127.0.0.1   chat-test.bodasdehoy.com
```

Guarda y cierra. Así el navegador resuelve esos dominios a tu localhost.

---

## 2. Levantar los servicios en modo “local con dominios”

Desde la **raíz del monorepo**:

```bash
pnpm dev:local
```

Esto levanta:

- **app-test** (web) en `0.0.0.0:8080` → lo accedes como **http://app-test.bodasdehoy.com:8080**
- **chat-test** (copilot) en `0.0.0.0:3210` → lo accedes como **http://chat-test.bodasdehoy.com:3210**

O por separado:

```bash
pnpm dev:web:local    # solo app web (puerto 8080)
pnpm dev:copilot:local # solo copilot (puerto 3210)
```

---

## 3. Variables de entorno para local (con puertos, solo en tu máquina)

En producción, las URLs son **https://app-test.bodasdehoy.com** y **https://chat-test.bodasdehoy.com** (sin puerto). En local, como los servidores dev usan 8080 y 3210, hay que poner el puerto en la URL para que el login, los redirects y el iframe del Copilot coincidan con lo que abres en el navegador.

### apps/web

En **`apps/web/.env.local`** (o crea el archivo si no existe), para **solo desarrollo local** puedes usar:

```env
# Local con dominios y puertos (solo desarrollo)
NEXT_PUBLIC_DIRECTORY=http://app-test.bodasdehoy.com:8080
NEXT_PUBLIC_EVENTSAPP=http://app-test.bodasdehoy.com:8080
NEXT_PUBLIC_CHAT=http://chat-test.bodasdehoy.com:3210
```

Así el iframe del Copilot carga `http://chat-test.bodasdehoy.com:3210` y los enlaces/redirects apuntan a app-test:8080.

Si prefieres no tocar `.env.local` (porque lo usas para otros entornos), puedes crear `apps/web/.env.development.local` con solo esas tres variables; Next.js las carga en `next dev`.

### apps/copilot

En **`apps/copilot/.env.local`**, para que el copilot se crea en la URL correcta (redirects OAuth, etc.) en local:

```env
APP_URL=http://chat-test.bodasdehoy.com:3210
NEXT_PUBLIC_BASE_URL=http://chat-test.bodasdehoy.com:3210
```

(O crea `apps/copilot/.env.development.local` solo con eso si no quieres cambiar el `.env.local` actual.)

---

## 4. Resumen de URLs

| Entorno     | App (web) | Chat/Copilot |
|------------|-----------|----------------|
| **Producción** (sin puerto) | https://app-test.bodasdehoy.com | https://chat-test.bodasdehoy.com |
| **Local** (con puerto)     | http://app-test.bodasdehoy.com:8080 | http://chat-test.bodasdehoy.com:3210 |

Los puertos **:8080** y **:3210** son solo para desarrollo en tu máquina. El Copilot dentro de la app se carga desde `NEXT_PUBLIC_CHAT` (en local con puerto si usas el `.env.development.local` de la sección 3).

---

## 5. Si usas proxy local (puerto 80/443)

Si tienes nginx, Caddy o similar para que **app-test.bodasdehoy.com** y **chat-test.bodasdehoy.com** respondan en 80/443 sin puerto:

- Apunta **app-test.bodasdehoy.com** al backend en `127.0.0.1:8080`.
- Apunta **chat-test.bodasdehoy.com** al backend en `127.0.0.1:3210`.

Entonces en `.env.local` / `.env.development.local` puedes usar **sin puerto** (y **https** si el proxy tiene SSL, p. ej. con mkcert):

- Web: `NEXT_PUBLIC_EVENTSAPP=https://app-test.bodasdehoy.com`, `NEXT_PUBLIC_CHAT=https://chat-test.bodasdehoy.com`
- Copilot: `APP_URL=https://chat-test.bodasdehoy.com`, `NEXT_PUBLIC_BASE_URL=https://chat-test.bodasdehoy.com`

Y sigues usando **`pnpm dev:local`** para que ambos escuchen en `0.0.0.0` y el proxy pueda conectarse.

---

## 6. Comandos rápidos

```bash
# Desde la raíz del monorepo
pnpm dev:local

# Abrir en el navegador
# App:   http://app-test.bodasdehoy.com:8080
# Chat:  http://chat-test.bodasdehoy.com:3210
```

Con **/etc/hosts** y las variables de entorno anteriores, el login y el Copilot deberían funcionar en local con los dominios app-test y chat-test.

---

## 7. Verificación rápida

Desde la raíz del proyecto puedes ejecutar:

```bash
./scripts/verificar-local.sh
```

Comprueba: entradas en `/etc/hosts`, si los puertos 8080 y 3210 están en uso, y que los dominios resuelvan a 127.0.0.1.

---

## 8. Si la pantalla se queda en blanco

- **App (app-test):** Deberías ver "Cargando..." como mucho 2 segundos; luego la app o el login. Si sigue en blanco: abre la consola del navegador (F12 → Console) y revisa errores; ejecuta `pnpm clean:next` y vuelve a levantar con `pnpm dev:local`.
- **Chat (chat-test):** Deberías ver "Cargando..." y luego el chat. Si sigue en blanco: revisa la consola (F12); asegúrate de usar la URL con variantes que aplica el middleware (p. ej. al entrar por `/` te reescribe a `/en-US__0__light` y luego redirige a `/chat`).
- **Ambos:** Comprueba que en **/etc/hosts** tengas las dos líneas para `app-test.bodasdehoy.com` y `chat-test.bodasdehoy.com` apuntando a `127.0.0.1`.

---

## 8. Cómo verificar que funciona (paso a paso)

1. **Servidores en marcha**  
   En la raíz: `pnpm dev:local`. En la terminal deberías ver que web (8080) y copilot (3210) están "Ready".

2. **App web responde**  
   Abre en el navegador:  
   **http://app-test.bodasdehoy.com:8080/api/health**  
   (o http://127.0.0.1:8080/api/health si no usas dominios).  
   Debes ver algo como: `{"ok":true,"app":"web","time":"..."}`.  
   Si ves eso, la app web está funcionando.

3. **Página principal de la app**  
   Abre: **http://app-test.bodasdehoy.com:8080/**  
   Deberías ver primero "Cargando... Si ves esto, la app está respondiendo" y en unos segundos la pantalla de login o la home.  
   Si la pantalla se queda en blanco (sin ese texto), abre F12 → pestaña Console y revisa si hay errores en rojo.

4. **Chat (copilot) responde**  
   Abre: **http://chat-test.bodasdehoy.com:3210/**  
   Deberías ver "Cargando..." y luego la redirección al chat.  
   Si solo ves blanco, revisa la consola (F12) por errores.

5. **Si /api/health no carga**  
   El servidor web no está levantado o el puerto es otro. Revisa la terminal donde ejecutaste `pnpm dev:local` y que no haya errores; si 8080 está ocupado, para el proceso que lo use o usa `pnpm dev:web:local` después de cambiar el puerto en `apps/web/package.json`.
