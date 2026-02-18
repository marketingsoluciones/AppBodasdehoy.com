# Reiniciar y revisar por qué no cargan app-test y chat-test

**Última comprobación:** 2026-02-12

---

## Diagnóstico rápido: por qué las URLs dan ERR

| Comprobación | Resultado típico |
|--------------|------------------|
| **DNS** app-test / chat-test.bodasdehoy.com | ✅ Resuelve a IPs de Cloudflare (104.21.x, 172.67.x). |
| **localhost:8080 y :3210** | ✅ 200 si `pnpm dev` está corriendo. |
| **https://app-test.bodasdehoy.com** | ❌ **ERR** si el túnel **no está corriendo** en esta máquina. |
| **https://chat-test.eventosorganizador.com** | ✅ 200 (otro origen/túnel sí responde). |

**Conclusión:** El fallo no es DNS (resuelve a Cloudflare). Hay dos casos:  
1) **cloudflared no está corriendo** en esta máquina → Cloudflare no tiene origen al que enviar → **ERR**. Solución: `./scripts/iniciar-tunnel.sh`.  
2) **El túnel ya está corriendo** pero app-test/chat-test.bodasdehoy.com siguen **ERR** → en Cloudflare el dominio **bodasdehoy.com** no está configurado para usar este túnel (falta CNAME o Public Hostname al túnel `30fdf520-9577-470f-a224-4cda1e5eb3f0`). Solución: revisar Cloudflare Dashboard (sección 4 más abajo).

---

## 1. Reiniciar servicios

### Túnel Cloudflare (obligatorio para que las URLs públicas carguen)

**Opción A – Script (recomendado, en segundo plano):**

```bash
./scripts/iniciar-tunnel.sh
```

**Opción B – Manual en una terminal:**

```bash
# Si ya está corriendo, matar y volver a arrancar
pkill -f cloudflared
cloudflared tunnel run lobe-chat-harbor
```

Para ver logs en vivo: `./scripts/iniciar-tunnel.sh --foreground`

Config del túnel: `~/.cloudflared/config.yml` (app-test → localhost:8080, chat-test → localhost:3210).

### Web y Copilot (obligatorio para que respondan en 8080 y 3210)

En la raíz del repo:

```bash
pnpm dev
```

- **Web:** http://localhost:8080  
- **Copilot:** http://localhost:3210  

Si prefieres solo uno: `pnpm dev:web` o `pnpm dev:copilot`.

---

## 2. Comprobar en local

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/   # debe ser 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3210/   # debe ser 200
```

Si ambos dan **200**, los servicios están bien. Si no cargan **app-test** y **chat-test** por HTTPS, el problema no es este equipo sino Cloudflare.

---

## 3. Comprobar URLs públicas (túnel + Cloudflare)

```bash
./scripts/probar-urls-tunnel.sh
```

- **app-test.bodasdehoy.com** y **chat-test.bodasdehoy.com** en **FAIL ERR** → lo más probable es que **cloudflared no esté corriendo** en esta máquina. Arrancar con `./scripts/iniciar-tunnel.sh`.  
- Si tras arrancar el túnel siguen en FAIL, revisar en Cloudflare: **DNS (CNAME)** y **Public Hostnames** para bodasdehoy.com apuntando al túnel `30fdf520-9577-470f-a224-4cda1e5eb3f0.cfargotunnel.com`.  
- Si **chat-test.eventosorganizador.com** da **OK 200**, otro origen/túnel sí responde; en esta máquina hay que tener **cloudflared** corriendo para que bodasdehoy.com funcione.

---

## 4. Qué tocar en Cloudflare (si fallan app-test / chat-test)

1. **DNS** (dominio **bodasdehoy.com**):  
   - CNAME **app-test** → `30fdf520-9577-470f-a224-4cda1e5eb3f0.cfargotunnel.com`  
   - CNAME **chat-test** → `30fdf520-9577-470f-a224-4cda1e5eb3f0.cfargotunnel.com`  
   - Proxy: **Proxied** (nube naranja).

2. **Public Hostnames del túnel** (Zero Trust → Tunnels → lobe-chat-harbor):  
   - **app-test.bodasdehoy.com** → HTTP → localhost:8080  
   - **chat-test.bodasdehoy.com** → HTTP → localhost:3210  

Detalle: **[RESOLVER-URLS-Y-REVERSE-CLOUDFLARE.md](./RESOLVER-URLS-Y-REVERSE-CLOUDFLARE.md)**.

---

## 5. Resumen

| Paso              | Acción |
|-------------------|--------|
| **1. Arrancar túnel** | `./scripts/iniciar-tunnel.sh` (o `cloudflared tunnel run lobe-chat-harbor` en una terminal) |
| 2. Arrancar dev   | `pnpm dev` |
| 3. Probar local   | curl localhost:8080 y 3210 → 200 |
| 4. Probar públicos | `./scripts/probar-urls-tunnel.sh` |
| Si siguen FAIL    | Revisar DNS + Public Hostnames en Cloudflare (bodasdehoy.com); revisar `cloudflared.log` |
