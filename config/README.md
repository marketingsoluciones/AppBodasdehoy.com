# Config del túnel Cloudflare (subdominios app-test, chat-test)

## `cloudflared-config.yml`

Config del túnel **lobe-chat-harbor** para que **app-test.bodasdehoy.com** y **chat-test.bodasdehoy.com** enruten a esta máquina.

- **Uso:** `./scripts/iniciar-tunnel.sh` usa este archivo si existe (si no, usa `~/.cloudflared/config.yml`).
- **Ingress:** app-test → localhost:8080, chat-test → localhost:3210 (y resto de hostnames).
- **Credenciales:** deben estar en `~/.cloudflared/30fdf520-9577-470f-a224-4cda1e5eb3f0.json` (obtener desde Cloudflare Zero Trust → Tunnels → lobe-chat-harbor).

Para que las URLs **https://app-test.bodasdehoy.com** y **https://chat-test.bodasdehoy.com** carguen, además hace falta en **Cloudflare**: DNS (CNAME) y Public Hostnames. Ver **docs/PENDIENTES-Y-POR-QUE-VPN-NO-CARGA.md**.
