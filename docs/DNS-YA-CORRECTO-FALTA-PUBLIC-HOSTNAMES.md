# DNS ya correcto – falta Public Hostnames del túnel

**Situación:** Con el puerto en la URL (p. ej. `http://app-test.bodasdehoy.com:8080`) **tampoco carga**. Por eso hace falta el **reverse proxy**: que Cloudflare Tunnel reciba el tráfico en **https://app-test.bodasdehoy.com** (sin puerto) y lo envíe al servicio en esta máquina.

---

## DNS en Cloudflare ✅ (revisado)

En **Cloudflare → bodasdehoy.com → DNS** ya están:

| Tipo  | Nombre    | Contenido                                              | Estado de proxy      |
|-------|-----------|--------------------------------------------------------|----------------------|
| CNAME | app-test  | 30fdf520-9577-470f-a224-4cda1e5eb3f0.cfargotunnel.com  | Redirigido mediante proxy |
| CNAME | chat-test | 30fdf520-9577-470f-a224-4cda1e5eb3f0.cfargotunnel.com  | Redirigido mediante proxy |

No hace falta tocar el DNS. El siguiente paso es **solo** el túnel y sus Public Hostnames.

---

## Qué falta: Public Hostnames del túnel

El tráfico que llega a **app-test.bodasdehoy.com** y **chat-test.bodasdehoy.com** va al túnel; el túnel tiene que saber **a qué puerto local** enviarlo.

**Quien tenga acceso a Cloudflare debe revisar:**

1. **Zero Trust** (o **Dashboard** según la cuenta) → **Access** → **Tunnels**.
2. Entrar en el túnel **lobe-chat-harbor** (ID `30fdf520-9577-470f-a224-4cda1e5eb3f0`).
3. Ir a **Public Hostname** (o **Routes** / **Hostnames**).
4. Comprobar que existan **estas rutas**:
   - **Subdomain / Hostname:** `app-test.bodasdehoy.com` (o dominio **bodasdehoy.com**, subdominio **app-test**)  
     **Service:** HTTP → **localhost** (o **127.0.0.1**) → puerto **8080**.
   - **Subdomain / Hostname:** `chat-test.bodasdehoy.com`  
     **Service:** HTTP → **localhost** → puerto **3210**.

Si no están, añadirlas. Si el túnel usa **solo el archivo** `~/.cloudflared/config.yml` en esta máquina (ingress), esos hostnames pueden estar definidos ahí; en ese caso el dashboard puede no mostrar rutas adicionales, pero el tunnel debe estar **conectado** y el **config.yml** debe tener el ingress correcto.

---

## En esta máquina (donde corre el código)

1. **Túnel en marcha:** `./scripts/iniciar-tunnel.sh` (o `cloudflared tunnel run lobe-chat-harbor` con el config que tenga app-test → 8080, chat-test → 3210).
2. **Servicios en marcha:** `pnpm dev` para que escuchen en **8080** (web) y **3210** (Copilot).

Cuando Public Hostnames (o el config del tunnel) estén bien y el tunnel + servicios estén arriba, **https://app-test.bodasdehoy.com** y **https://chat-test.bodasdehoy.com** deberían cargar sin puerto.

---

## Resumen

| Dónde              | Estado | Acción |
|--------------------|--------|--------|
| DNS (app-test, chat-test) | ✅ Hecho | Nada. Ya apuntan al túnel con proxy. |
| Public Hostnames del túnel | ⏳ Revisar | Zero Trust → Tunnels → lobe-chat-harbor → Public Hostname: app-test→8080, chat-test→3210. |
| Túnel (cloudflared)       | ⏳ Revisar | En esta máquina: `./scripts/iniciar-tunnel.sh`. |
| Web + Copilot             | ⏳ Revisar | En esta máquina: `pnpm dev` (8080 y 3210). |
