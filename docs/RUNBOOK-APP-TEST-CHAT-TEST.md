# Runbook: app-test y chat-test

**Objetivo:** No perder horas. Si falla, hacer solo lo de abajo y pasar página.

---

## Para avanzar (levantar y probar)

1. **Apps en los puertos del túnel:** app-test en **8080**, chat-test en **3210** (igual que `config/cloudflared-config.yml`).
2. **Levantar:** `pnpm dev` o `pnpm dev:levantar` (libera 8080/3210 y arranca ambas apps).
3. **Túnel (si usas app-test/chat-test por dominio):** en otra terminal `./scripts/iniciar-tunnel.sh`.
4. **Comprobar:** `./scripts/verificar-app-test-chat-test.sh` o abrir https://app-test.bodasdehoy.com y https://chat-test.bodasdehoy.com.

Si usas **PM2** o los `start.sh`, ya están configurados en 8080 (app-eventos) y 3210 (chat-ia).

**Pasos completos (2 terminales):**
- **Terminal 1:** `pnpm dev` (o `pnpm dev:levantar` si los puertos estaban ocupados).
- **Terminal 2:** `./scripts/iniciar-tunnel.sh` (para que https://app-test... y https://chat-test... respondan).

---

## Estado esperado (URLs sin puerto: reverse proxy)

| URL | Debe devolver |
|-----|----------------|
| https://app-test.bodasdehoy.com | 200 (o redirect a login) |
| https://chat-test.bodasdehoy.com | 307 → /en-US__0__light y luego 200 |

Los dominios no llevan :8080 ni :3210; el túnel (reverse proxy) redirige a los puertos internos.

---

## Comprobar en 30 segundos

**Solo local (sin túnel)** — confirmar que las apps responden en 8080 y 3210:
```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/   # 200 o 3xx
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3210/   # 200 o 307
```

**Por dominio (con túnel):**
```bash
./scripts/verificar-app-test-chat-test.sh
```
Si todo está OK, el script termina en 0. Si no, imprime qué falla y qué hacer.

---

## Si chat-test da 404

1. **¿El servidor de chat-ia está arriba?** Donde corre el túnel/proceso que sirve chat-test:
   ```bash
   curl -sI http://127.0.0.1:3210/
   ```
   - Si no responde: levantar con `pnpm dev` o `pnpm dev:levantar` (puertos 8080 + 3210).

2. **¿El build tiene el fix del middleware?** El middleware debe hacer **redirect 307** de `/` a `/en-US__0__light`. Si el despliegue es un build antiguo, hacer **build nuevo** de chat-ia y volver a desplegar.

3. **¿El túnel apunta al puerto correcto?** En `config/cloudflared-config.yml` debe estar:
   - `app-test.bodasdehoy.com` → `http://127.0.0.1:8080`
   - `chat-test.bodasdehoy.com` → `http://127.0.0.1:3210`

---

## Si ves 502 Bad Gateway (app-test o chat-test)

El túnel responde pero **el proceso en 8080 o 3210 no está arriba** en la máquina donde corre el túnel.

**Hacer:**

1. En la **misma máquina** donde está `cloudflared` (túnel), levantar las apps:
   ```bash
   pnpm dev
   ```
   Si los puertos están ocupados:
   ```bash
   pnpm dev:levantar
   ```
2. Comprobar que responden:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/   # debe ser 200 o 3xx
   curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3210/   # debe ser 200 o 3xx o 307
   ```
3. Si el túnel corre en **otro servidor**, allí deben estar levantados 8080 y 3210 (o apuntar el config del túnel a la IP:puerto correctos).

## Si app-test da 502 (solo app)

1. Proceso de app-eventos en 8080 no está corriendo. Levantar con `pnpm dev` o `pnpm dev:levantar`.
2. En `config/cloudflared-config.yml`, app-test debe apuntar a `http://127.0.0.1:8080`.

---

## Levantar todo (una vez)

**En terminal:** (1) servicios 8080 + 3210, (2) túnel. Las URLs son **sin puerto** (reverse proxy).

```bash
pnpm dev
# o si puertos ocupados: pnpm dev:levantar
```

En otra terminal, túnel (para que https://app-test... y https://chat-test... funcionen):

```bash
./scripts/iniciar-tunnel.sh
```

Abrir en el navegador: **https://app-test.bodasdehoy.com** y **https://chat-test.bodasdehoy.com** (nunca :8080 ni :3210 en la barra).

---

## Resumen de lo que ya está en el código

- **Middleware chat-ia:** redirect 307 de `/` a `/en-US__0__light` (evita 404).
- **Cloudflared:** app-test → 8080, chat-test → 3210.
- **Scripts:** `levantar-app-test-chat-test.sh` y `levantar-para-proxy.mjs` usan 8080 y 3210.
- **Producción/PM2:** `apps/appEventos/start.sh` y `apps/chat-ia/start.sh` escuchan en 8080 y 3210; `scripts/reiniciar-servicios-test.sh` comprueba esos puertos.

No hace falta tocar código para “arreglar” 404/502; suele ser proceso caído, build viejo o túnel mal configurado. Si no se resuelve con esto, no seguir: pasar a infra y centrarse en mejorar la web.

---

## Si ves 530 (Cloudflare)

**Significado:** Cloudflare no puede conectar con el origen (túnel caído, túnel en otra máquina, o DNS/Public Hostname no apuntan a este túnel).

**Qué hacer:**
1. En la **misma máquina** donde están 8080 y 3210, arrancar el túnel: `./scripts/iniciar-tunnel.sh`.
2. En el dashboard de Cloudflare Zero Trust → Tunnels → lobe-chat-harbor, comprobar que los Public Hostnames **app-test.bodasdehoy.com** y **chat-test.bodasdehoy.com** existen y apuntan a este túnel.
3. Mientras tanto, probar en local: http://127.0.0.1:8080 y http://127.0.0.1:3210.

---

## Error 1033 (Cloudflare Tunnel error)

**Significado:** Cloudflare no puede alcanzar el túnel; `cloudflared` no está conectado o no corre en la máquina donde están 8080 y 3210.

**Qué hacer (en la máquina donde corre `pnpm dev`):**

1. Iniciar el túnel y **dejarlo en marcha**:
   ```bash
   ./scripts/iniciar-tunnel.sh
   ```
   O en primer plano para ver logs: `./scripts/iniciar-tunnel.sh --foreground`

2. Comprobar que el config usa los puertos correctos (app-test → 8080, chat-test → 3210):
   ```bash
   grep -A1 "app-test\|chat-test" config/cloudflared-config.yml
   ```

3. Túnel y servicios deben estar **en la misma máquina**: si el túnel corre en un servidor y las apps en tu portátil, 1033 seguirá. O bien todo en tu máquina, o bien todo en el servidor.
