# Estado de los túneles Cloudflare en este equipo

**Fecha de revisión:** 2026-02-13  
**Equipo:** Esta máquina (gestión del tunnel con acceso al PC).

---

## 0. Por qué no cargan app-test y chat-test (resumen)

| Qué | Estado |
|-----|--------|
| **localhost:8080** (web) | ✅ 200 |
| **localhost:3210** (Copilot) | ✅ 200 |
| **https://app-test.bodasdehoy.com** | ❌ ERR (no llega al túnel) |
| **https://chat-test.bodasdehoy.com** | ❌ ERR (no llega al túnel) |
| **https://chat-test.eventosorganizador.com** | ✅ 200 (mismo túnel) |
| **https://api-ia.bodasdehoy.com/health** | ✅ 200 (remoto) |

**Conclusión:** Los servicios locales están bien. Aunque el **túnel esté corriendo** en esta máquina (lobe-chat-harbor, 4 conexiones), si app-test/chat-test.bodasdehoy.com siguen en **ERR** es porque **en Cloudflare** el tráfico de **bodasdehoy.com** no está asociado a este túnel: hay que revisar **DNS (CNAME)** y **Public Hostnames** para que apunten al túnel `30fdf520-9577-470f-a224-4cda1e5eb3f0.cfargotunnel.com`. Ver **[RESOLVER-URLS-Y-REVERSE-CLOUDFLARE.md](./RESOLVER-URLS-Y-REVERSE-CLOUDFLARE.md)**.

**Arrancar túnel en esta máquina:** `./scripts/iniciar-tunnel.sh` (o `cloudflared tunnel run lobe-chat-harbor`).  
**Reiniciar dev:** `pnpm dev` (web 8080, copilot 3210).

---

## 1. Túnel que SÍ está corriendo

| Tunnel | ID | Conexiones | Estado |
|--------|-----|-------------|--------|
| **lobe-chat-harbor** | 30fdf520-9577-470f-a224-4cda1e5eb3f0 | 2x mad01, 2x mad05 | ✅ **Corriendo** (PID 59310) |

- **Proceso:** `cloudflared tunnel run lobe-chat-harbor`
- **Config en uso:** `~/.cloudflared/config.yml` (tunnel: 30fdf520-9577-470f-a224-4cda1e5eb3f0)

Este túnel es el que lleva todo el tráfico de app-test, chat-test, api-ia, etc. a esta máquina o al servidor remoto según el ingress.

---

## 2. Ingress del config (hostnames que atiende este túnel)

Según `~/.cloudflared/config.yml`:

| Hostname | Servicio (origen) | ¿Puerto local OK? |
|----------|-------------------|--------------------|
| app-test.bodasdehoy.com | http://localhost:8080 | ✅ 200 |
| chat-test.bodasdehoy.com | http://localhost:3210 | ✅ 200 |
| chat-test.eventosorganizador.com | http://localhost:3210 | ✅ 200 |
| auth-test.bodasdehoy.com | http://localhost:8000 | (no comprobado) |
| api-ia.bodasdehoy.com | http://164.92.81.153:8030 | (remoto) |
| api-ia.eventosorganizador.com | http://164.92.81.153:8030 | (remoto) |
| backend-chat-test.bodasdehoy.com | http://164.92.81.153:8030 | (remoto) |
| backend-chat-test.eventosorganizador.com | http://164.92.81.153:8030 | (remoto) |
| crm-leads.eventosorganizador.com | http://localhost:3002 | (no comprobado) |
| python-api.eventosorganizador.com | http://localhost:8000 | (no comprobado) |

En esta máquina se comprobó que **8080** y **3210** responden **200** (web y Copilot).

---

## 3. Túneles que NO están corriendo (solo definidos en Cloudflare)

Estos existen en la cuenta pero **no tienen proceso cloudflared** en este equipo:

| Tunnel | ID | Conexiones |
|--------|-----|------------|
| chat-test | c2c7909c-6d2f-48df-ba8f-1493f488afd6 | (ninguna) |
| iatest | 9fa222d8-7832-4469-8e37-ff0f13722625 | (ninguna) |
| lead-marketing | 19cef26d-7c36-4921-8349-6a2ece3cd3e4 | (ninguna) |
| mi-tunnel-localhost | 69968aa2-120c-48be-9a87-cc0ef9fae2da | (ninguna) |

No es necesario que corran si todo el tráfico de app-test y chat-test va por **lobe-chat-harbor** (un solo túnel con varios hostnames en el ingress). Solo hace falta un túnel activo con el ingress correcto.

---

## 4. Resumen

- **Un solo túnel activo en este equipo:** **lobe-chat-harbor**, con 2 conexiones a Cloudflare.
- **Config:** `~/.cloudflared/config.yml` con app-test → 8080 y chat-test → 3210.
- **Puertos locales comprobados:** 3210 (Copilot) y 8080 (web) responden **200**.

**Conclusión:** El túnel que gestiona app-test y chat-test está corriendo bien en este equipo. Si las URLs **no tienen acceso** (VPN llega pero falta el “reverse”): configurar en Cloudflare DNS + Public Hostnames. Ver **[RESOLVER-URLS-Y-REVERSE-CLOUDFLARE.md](./RESOLVER-URLS-Y-REVERSE-CLOUDFLARE.md)**. **Probar desde terminal:** `./scripts/probar-urls-tunnel.sh`.
