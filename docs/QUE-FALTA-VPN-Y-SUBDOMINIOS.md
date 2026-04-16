# Qué falta para que app-test y chat-test carguen (VPN creada)

**Importante:** Firebase **no acepta login con localhost**. El login solo funciona en **app-test.bodasdehoy.com** (y chat-test si aplica). Si los subdominios no cargan, el sistema no puede usarse.

URL de login que debe funcionar: **https://app-test.bodasdehoy.com/login?d=app**

**Si app-test ya carga pero chat-test no:** ver **[CHAT-TEST-NO-CARGA-REVISAR.md](./CHAT-TEST-NO-CARGA-REVISAR.md)** — revisar puerto 3210 y derivación de chat-test.

**Cloudflare está configurado en esta máquina:** ver **[CLOUDFLARE-CONFIGURADO-EN-ESTA-MAQUINA.md](./CLOUDFLARE-CONFIGURADO-EN-ESTA-MAQUINA.md)** — config en `~/.cloudflared/config.yml`, ingress para app-test y chat-test.

---

## 0. Arquitectura: Cloudflare (reverse proxy / VPN) + máquina local con reverse proxy

En tu setup hay **dos capas**:

| Capa | Qué es | Dónde |
|------|--------|--------|
| **1. Cloudflare** | Reverse proxy o VPN de Cloudflare (tráfico entra por Cloudflare, HTTPS, WAF, etc.). | En la nube (Cloudflare). |
| **2. Máquina local** | “Resuelve” (DNS o /etc/hosts hace que app-test y chat-test apunten a tu equipo) y tienes **una especie de reverse proxy local** que recibe el tráfico y lo deriva a los puertos donde corren la web y el Copilot. | Tu máquina (donde corre el repo). |

Flujo típico:

```
Navegador  →  Cloudflare (reverse proxy / VPN)  →  Tu máquina (reverse proxy local)  →  :3000 (web) y :3210 (Copilot)
```

- **Cloudflare:** puede ser el proxy naranja (DNS proxied) hacia tu IP, o un **Cloudflare Tunnel** (cloudflared) donde el tunnel conecta Cloudflare con tu máquina sin abrir puertos.
- **Máquina local:** para que “resuelva” y funcione como origen hace falta:
  1. Que **app-test** y **chat-test** lleguen a esta máquina (DNS apuntando a tu IP, o Tunnel que termine aquí).
  2. Un **reverse proxy local** que reciba por 80/443 (o por el Tunnel) y envíe:
     - **app-test.bodasdehoy.com** → `http://127.0.0.1:3000` (o 8080 en dev)
     - **chat-test.bodasdehoy.com** → `http://127.0.0.1:3210`

Ese “reverse proxy local” puede ser:

- **Cloudflare Tunnel (cloudflared)** en tu máquina: el archivo `~/.cloudflared/config.yml` con **ingress** que mapee cada hostname a `http://localhost:3000` y `http://localhost:3210`.
- **Nginx o Caddy** en tu máquina: virtual hosts que hagan `proxy_pass` a 3000 y 3210.
- Si usas **solo /etc/hosts** y abres **http://app-test.bodasdehoy.com:8080** en el navegador, no hay reverse proxy local: el navegador habla directo con los puertos 8080 y 3210. Eso vale en local, pero para que **Cloudflare** envíe tráfico a tu máquina hace falta Tunnel o que tu IP tenga algo escuchando en 80/443 y derivando (reverse proxy local).

Resumen: **Cloudflare = reverse proxy/VPN delante; en la máquina local hace falta que “algo” (Tunnel o nginx/Caddy) haga de reverse proxy y envíe app-test → :3000 y chat-test → :3210.**

---

## 1. Por qué tienen que cargar app-test y chat-test

| Requisito | Motivo |
|-----------|--------|
| **Login** | Firebase Auth solo autoriza dominios configurados (app-test, chat-test). **localhost no está aceptado** para login en producción. |
| **Sistema completo** | Sin app-test y chat-test cargando, no hay login ni Copilot; el flujo se rompe. |

---

## 2. VPN “están creadas pero falta”

Si la **VPN** (o el acceso por Cloudflare/Tunnel) ya está creada, suele faltar una o varias de estas cosas:

### 2.1 DNS en Cloudflare

- [ ] **app-test.bodasdehoy.com** → registro A o CNAME apuntando al **servidor de origen** (IP o hostname donde corren web y Copilot).
- [ ] **chat-test.bodasdehoy.com** → mismo servidor (o el que corresponda).
- [ ] Proxy (nube naranja) activado si quieres que Cloudflare haga de proxy; si usas solo DNS (gris), el tráfico va directo al origen.

### 2.2 Derivación al puerto correcto (lo que más suele faltar)

Cloudflare llega al servidor por 80/443. En el servidor hace falta **algo** que envíe cada host al puerto correcto:

| Host | Puerto en el servidor | Quién debe derivar |
|------|------------------------|--------------------|
| **app-test.bodasdehoy.com** | **3000** (prod) o 8080 (dev) | Nginx / Caddy / Cloudflare Tunnel |
| **chat-test.bodasdehoy.com** | **3210** | Nginx / Caddy / Cloudflare Tunnel |

**Si falta esto:** aunque DNS y VPN estén bien, verás 502 o “connection refused” porque nadie está escuchando en 80/443 para ese host y reenviando a 3000 y 3210.

**Opciones:**

- **Nginx (o Caddy) en el servidor**  
  - Virtual host para `app-test.bodasdehoy.com` → `proxy_pass http://127.0.0.1:3000`.  
  - Virtual host para `chat-test.bodasdehoy.com` → `proxy_pass http://127.0.0.1:3210`.

- **Cloudflare Tunnel (cloudflared)** en la máquina local (actúa como reverse proxy hacia tus puertos):
  - En `~/.cloudflared/config.yml` (o el config que use el tunnel) definir **ingress** para que cada hostname vaya al puerto correcto:
    - `app-test.bodasdehoy.com` → `http://localhost:3000` (o `http://localhost:8080` en dev)
    - `chat-test.bodasdehoy.com` → `http://localhost:3210`
  - Ejemplo mínimo de ingress (el tunnel debe estar creado y el DNS en Cloudflare apuntando al tunnel):
    ```yaml
    ingress:
      - hostname: app-test.bodasdehoy.com
        service: http://localhost:3000
      - hostname: chat-test.bodasdehoy.com
        service: http://localhost:3210
      - service: http_status:404
    ```
  - Arrancar: `cloudflared tunnel run <nombre-del-tunnel>` (o `cloudflared tunnel --config ~/.cloudflared/config.yml run`).

### 2.3 Procesos en el servidor

- [ ] **Web (app-test):** `apps/web/start.sh` o PM2 en puerto **3000** (prod).
- [ ] **Copilot (chat-test):** `apps/copilot/start.sh` o PM2 en puerto **3210**.

Comprobar en el servidor:

```bash
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1:3210
```

Deben devolver 200 (o 304). Si no, los procesos no están arriba o no escuchan en ese puerto.

### 2.4 Firebase (Authorized domains)

- [ ] En **Firebase Console → Authentication → Authorized domains** deben estar:
  - **app-test.bodasdehoy.com**
  - **chat-test.bodasdehoy.com**

Sin esto, el login en esos dominios puede fallar aunque la web cargue.

### 2.5 VPN / WAF / Reglas Cloudflare

- [ ] **WAF:** que no bloquee tráfico legítimo a app-test/chat-test (por IP de salida VPN, datacenter, etc.).
- [ ] **Timeouts:** tiempo de origen suficiente (p. ej. 100 s por defecto) para no devolver 502 por timeout.
- [ ] Si usas **Cloudflare Tunnel:** que el tunnel esté activo y las rutas de ingress apunten a 3000 y 3210 como arriba.

---

## 3. Checklist rápido “qué revisar”

| Paso | Comprobación | Si falla |
|------|--------------|----------|
| 1 | DNS: app-test y chat-test apuntan al servidor correcto | Ajustar registros en Cloudflare |
| 2 | En el servidor: procesos en 3000 y 3210 (`curl` local) | Levantar web y Copilot (PM2/start.sh) |
| 3 | **Derivación por host:** app-test → :3000, chat-test → :3210 (nginx, Caddy o Tunnel) | Configurar proxy o ingress en Tunnel |
| 4 | Firebase: app-test y chat-test en Authorized domains | Añadirlos en Firebase Console |
| 5 | VPN/WAF: no bloquear ni cortar por timeout | Revisar Security/WAF y timeouts en Cloudflare |

---

## 4. Cómo comprobar desde fuera (con VPN si la usas)

```bash
# Deben devolver 200 (o 301/302), no 502 ni connection refused
curl -I https://app-test.bodasdehoy.com
curl -I https://app-test.bodasdehoy.com/login?d=app
curl -I https://chat-test.bodasdehoy.com
```

Si ves **502**: el fallo está entre Cloudflare y el origen (proceso no levantado o **falta derivación al puerto 3000/3210**).  
Si ves **connection refused** o no resuelve: DNS o tunnel no apuntan al servidor correcto.

---

## 5. Resumen

- **Login solo con app-test** (y chat-test si aplica); **localhost no vale** para Firebase.
- **VPN creada** suele estar bien a nivel de “camino” hasta Cloudflare; lo que **suele faltar** es:
  1. **Derivación en el servidor:** que app-test y chat-test lleguen a los puertos **3000** y **3210** (nginx, Caddy o Cloudflare Tunnel).
  2. Que los procesos **web (3000)** y **Copilot (3210)** estén levantados en ese servidor.
  3. Firebase con **app-test.bodasdehoy.com** y **chat-test.bodasdehoy.com** en Authorized domains.

Revisando esos tres puntos (sobre todo la derivación a 3000 y 3210), app-test y chat-test deberían cargar y el login en https://app-test.bodasdehoy.com/login?d=app podrá usarse.
