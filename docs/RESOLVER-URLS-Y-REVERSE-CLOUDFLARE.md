# Resolver: que las URLs tengan acceso (VPN llega; falta el “reverse”)

**Situación:** La VPN (tunnel) **está llegando a este equipo** (lobe-chat-harbor conectado). Lo que falta es el **“reverse”**: la parte que se configura en **Cloudflare** para que el tráfico que llega a app-test y chat-test (y al resto de dominios) se envíe a este túnel y, desde el túnel, a los puertos correctos (8080, 3210, etc.).

En Cloudflare Tunnel, ese “reverse” son dos cosas:

1. **DNS**: que las URLs (app-test, chat-test, etc.) apunten **al túnel** (CNAME al hostname del tunnel).
2. **Public Hostnames del túnel**: que el tunnel tenga definido qué hostname va a qué servicio (localhost:8080, localhost:3210, etc.). Eso puede venir del **archivo** `~/.cloudflared/config.yml` (ingress) o del **dashboard** (Zero Trust → Tunnels → Public Hostname).

El ingress en **esta máquina** ya está en el config (app-test → 8080, chat-test → 3210). Si las URLs no cargan, lo que falta es que **en Cloudflare** esté configurado el “reverse” hacia este túnel: **DNS + (si aplica) Public Hostnames**.

---

## 1. Qué configurar en Cloudflare (el “reverse”)

### Paso 1: DNS (que la URL apunte al túnel)

En **Cloudflare Dashboard** → dominio **bodasdehoy.com** → **DNS** → **Records**:

| Tipo  | Nombre     | Target (Contenido) |
|-------|------------|----------------------------------------|
| CNAME | app-test   | `30fdf520-9577-470f-a224-4cda1e5eb3f0.cfargotunnel.com` |
| CNAME | chat-test  | `30fdf520-9577-470f-a224-4cda1e5eb3f0.cfargotunnel.com` |

- **Proxy:** Proxied (nube naranja).
- El hostname exacto del tunnel lo ves en **Zero Trust → Access → Tunnels → lobe-chat-harbor** (ahí suele salir el CNAME recomendado). Si en tu cuenta el dominio del tunnel es otro (p. ej. custom), usa ese como target.

Para **eventosorganizador.com** (chat-test, crm-leads, python-api, api-ia): mismos CNAME al mismo tunnel ID si quieres que ese tráfico llegue a este equipo.

### Paso 2: Public Hostnames del tunnel (opcional si usas solo config file)

Si usas **solo el archivo** `~/.cloudflared/config.yml` (ingress), Cloudflare puede usar ese ingress cuando el tunnel está registrado. En ese caso lo crítico es el **DNS** (Paso 1).

Si en cambio configuras hostnames desde el **dashboard**:

- **Zero Trust** → **Access** → **Tunnels** → **lobe-chat-harbor** → **Public Hostname**.
- Añadir (o comprobar):
  - **app-test.bodasdehoy.com** → **HTTP** → **localhost** → **8080**
  - **chat-test.bodasdehoy.com** → **HTTP** → **localhost** → **3210**

Así el “reverse” en Cloudflare queda configurado: la URL llega al tunnel y el tunnel (con tu config local) envía a 8080 y 3210.

---

## 2. Por qué hay más dominios en este equipo

En este equipo solo corre **un tunnel** (**lobe-chat-harbor**) y en su config (`~/.cloudflared/config.yml`) hay **varios hostnames** en el mismo ingress. Es normal: un solo tunnel puede atender muchos dominios y repartir por hostname a distintos servicios (locales o remotos).

| Dominio | Origen en config | Motivo en este equipo |
|---------|-------------------|------------------------|
| app-test.bodasdehoy.com | localhost:8080 | Web (apps/web) |
| chat-test.bodasdehoy.com | localhost:3210 | Copilot (apps/copilot) |
| chat-test.eventosorganizador.com | localhost:3210 | Mismo Copilot, otro dominio |
| auth-test.bodasdehoy.com | localhost:8000 | Servicio auth en este equipo |
| api-ia.bodasdehoy.com | 164.92.81.153:8030 | **Remoto** (no es este equipo) |
| backend-chat-test.* | 164.92.81.153:8030 | **Remoto** |
| crm-leads.eventosorganizador.com | localhost:3002 | CRM en este equipo |
| python-api.eventosorganizador.com | localhost:8000 | API Python en este equipo |

Es decir: **hay más dominios** porque el mismo tunnel sirve varios proyectos/dominios (bodasdehoy + eventosorganizador) y reparte por hostname a puertos locales (8080, 3210, 8000, 3002) o al servidor remoto (164.92.81.153:8030). No hace falta un tunnel por dominio; uno solo con ingress basta.

---

## 3. Probar desde la terminal

Después de configurar DNS (y Public Hostnames si usas dashboard), puedes probar desde la terminal:

```bash
# Desde la raíz del repo
./scripts/probar-urls-tunnel.sh
```

O a mano:

```bash
curl -I https://app-test.bodasdehoy.com/login?d=app
curl -I https://chat-test.bodasdehoy.com
```

- **200 / 301 / 302**: el “reverse” está bien; las URLs tienen acceso.
- **502 / timeout / connection refused**: el tráfico no está llegando al tunnel o al puerto; revisar DNS y Public Hostnames (y que 8080/3210 sigan levantados en este equipo).

---

## 4. Resumen

| Qué | Dónde | Acción |
|-----|--------|--------|
| **VPN / tunnel** | Esta máquina | Ya llega (lobe-chat-harbor corriendo). |
| **Reverse** | **Cloudflare** | DNS: CNAME app-test y chat-test al hostname del tunnel. Opcional: Public Hostnames en el tunnel (app-test → :8080, chat-test → :3210). |
| **Ingress local** | `~/.cloudflared/config.yml` | Ya está (app-test → 8080, chat-test → 3210). |
| **Probar** | Terminal | `./scripts/probar-urls-tunnel.sh` o `curl -I https://app-test.bodasdehoy.com/login?d=app` y `curl -I https://chat-test.bodasdehoy.com`. |

Resumiendo: **resolver** = configurar en Cloudflare el “reverse” (DNS + Public Hostnames si aplica) para que las URLs tengan acceso a este equipo a través del tunnel. Luego probar con el script o con curl desde la terminal.

---

## 5. Prompt para probar desde la terminal

**Importante en zsh:** Las URLs con `?` o `&` van **entre comillas**; si no, zsh da "no matches found". Si usas **/etc/hosts** (127.0.0.1 app-test y chat-test), en local **no hay nada en 443**; usa **http** y puerto **8080** o **3210**. Ver **[PROBAR-URLS-DESDE-TERMINAL.md](./PROBAR-URLS-DESDE-TERMINAL.md)**.

Copia y pega (desde la raíz del repo):

**Probar por tunnel (HTTPS):**
```bash
./scripts/probar-urls-tunnel.sh
```
o solo:
```bash
curl -I "https://app-test.bodasdehoy.com/login?d=app"
curl -I "https://chat-test.bodasdehoy.com/"
```

**Probar en local (con /etc/hosts, http + puerto):**
```bash
curl -I "http://app-test.bodasdehoy.com:8080/login?d=app"
curl -I "http://chat-test.bodasdehoy.com:3210/"
```
