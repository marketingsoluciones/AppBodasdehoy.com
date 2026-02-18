# Subdominios que apuntan a nuestros repositorios: hacer que funcionen

Los subdominios **app-test** y **chat-test** apuntan al código de este repositorio. Si **siguen sin cargar**, sigue esta guía.

---

## 1. Qué subdominio corresponde a qué app y puerto

| Subdominio | Repositorio / app | Puerto (dev) | Puerto (prod / start.sh) |
|------------|-------------------|--------------|---------------------------|
| **app-test.bodasdehoy.com** | `apps/web` (organizador) | **8080** | **3000** |
| **chat-test.bodasdehoy.com** | `apps/copilot` (Copilot) | **3210** | **3210** |

- **app-test** = web (login, eventos, Copilot en iframe).  
- **chat-test** = Copilot (LobeChat).  
- En **desarrollo** la web usa `npm run dev` → 8080. En **producción** (PM2 con `start.sh`) la web usa **3000** (ver `apps/web/start.sh`).

---

## 2. Escenario A: Uso en esta máquina (local)

Para que los subdominios carguen **en tu máquina** (sin Cloudflare en medio):

### 2.1 /etc/hosts (obligatorio)

Sin esto, `app-test.bodasdehoy.com` no resuelve a tu equipo.

```bash
echo "127.0.0.1 app-test.bodasdehoy.com" | sudo tee -a /etc/hosts
echo "127.0.0.1 chat-test.bodasdehoy.com" | sudo tee -a /etc/hosts
```

Comprobar:

```bash
grep -E "app-test|chat-test" /etc/hosts
```

### 2.2 Levantar las dos apps

**Terminal 1 – Web (app-test):**

```bash
cd apps/web
npm run dev
# Escucha en 0.0.0.0:8080 si usas dev:local; por defecto 127.0.0.1:8080
```

Para que responda en `app-test.bodasdehoy.com` desde el navegador, la web debe escuchar en todas las interfaces. Si `npm run dev` usa solo 127.0.0.1, usar:

```bash
npm run dev:local
# next dev -H 0.0.0.0 -p 8080
```

**Terminal 2 – Copilot (chat-test):**

```bash
cd apps/copilot
pnpm dev
# 0.0.0.0:3210
```

### 2.3 URLs a usar en el navegador

- **app-test (web + login):**  
  **http://app-test.bodasdehoy.com:8080**
- **chat-test (Copilot):**  
  **http://chat-test.bodasdehoy.com:3210**

Si en vez de `dev` usas PM2 con `start.sh` (producción), la web queda en **3000**; en ese caso usa `http://app-test.bodasdehoy.com:3000`.

### 2.4 Comprobar que “cargan”

```bash
curl -I http://app-test.bodasdehoy.com:8080
curl -I http://chat-test.bodasdehoy.com:3210
```

Deben devolver `200` (o `304`). Si falla, revisar que no haya otro proceso en 8080/3210 y que /etc/hosts esté bien.

---

## 3. Escenario B: Servidor remoto (Cloudflare → servidor)

Los subdominios apuntan al mismo repositorio pero desplegado en un **servidor**; Cloudflare hace proxy al origen.

### 3.1 En el servidor (donde corre el código del repo)

- **app-test** debe estar servido por la app web en el puerto que use en producción: **3000** (si usas `apps/web/start.sh`) o el que tenga configurado (p. ej. 8080).
- **chat-test** debe estar en **3210** (mismo en dev y prod).

Procesos típicos (PM2 con `ecosystem.config.js`):

- `app-test` → `apps/web/start.sh` → `next start -p 3000`
- `chat-test` → `apps/copilot/start.sh` → `next start -p 3210`

Comprobar en el servidor:

```bash
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1:3210
```

### 3.2 Cloudflare (o proxy delante)

- **DNS:**  
  - `app-test.bodasdehoy.com` → A o CNAME al servidor.  
  - `chat-test.bodasdehoy.com` → mismo servidor (o el que corresponda).
- **Proxy:**  
  El tráfico a cada host debe derivarse al puerto correcto del origen:
  - **app-test** → `http://origen:3000` (o el puerto donde escucha la web en prod).
  - **chat-test** → `http://origen:3210`.

Si el proxy no hace “derivación por host” a distintos puertos, suele usarse **nginx** (o similar) en el servidor:

- `app-test.bodasdehoy.com` → `proxy_pass http://127.0.0.1:3000`
- `chat-test.bodasdehoy.com` → `proxy_pass http://127.0.0.1:3210`

Cloudflare solo apunta al servidor (puerto 80/443); nginx reparte por host al 3000 y al 3210.

---

## 4. Resumen rápido

| Dónde | Qué hacer para que “carguen” |
|-------|------------------------------|
| **Local** | 1) /etc/hosts con app-test y chat-test → 127.0.0.1. 2) Web en 8080 (dev) o 3000 (start.sh). 3) Copilot en 3210. 4) Abrir http://app-test.bodasdehoy.com:8080 y http://chat-test.bodasdehoy.com:3210. |
| **Remoto** | 1) Servidor con web en 3000 y copilot en 3210. 2) Cloudflare DNS a ese servidor. 3) Proxy (p. ej. nginx) que envíe app-test → :3000 y chat-test → :3210. |

---

## 5. Referencia en el repo

- **Web (app-test):** `apps/web/package.json` (scripts dev/dev:local), `apps/web/start.sh` (puerto 3000).
- **Copilot (chat-test):** `apps/copilot/package.json` (dev/start en 3210), `apps/copilot/start.sh`.
- **PM2:** `ecosystem.config.js` (app-test → web, chat-test → copilot).

**Script de verificación:** desde la raíz del repo ejecuta `./scripts/verificar-subdominios.sh` para comprobar /etc/hosts y que los puertos 8080 y 3210 respondan.

Si tras esto los subdominios **siguen sin cargar**, el fallo está en: (1) /etc/hosts (local), (2) procesos no levantados o en otro puerto, o (3) proxy/Cloudflare no derivando al puerto correcto (3000 / 3210).

**Si la VPN está creada pero app-test/chat-test no cargan (y Firebase no acepta localhost para login):** ver **[QUE-FALTA-VPN-Y-SUBDOMINIOS.md](./QUE-FALTA-VPN-Y-SUBDOMINIOS.md)** — checklist de qué revisar (DNS, derivación a puertos 3000/3210, Firebase, WAF).
