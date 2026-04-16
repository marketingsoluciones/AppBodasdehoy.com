# Login solo funciona con los subdominios app-test y chat-test

**Última comprobación:** En el navegador interno de Cursor, **http://app-test.bodasdehoy.com:8080** y **http://chat-test.bodasdehoy.com:3210** sí cargan y permiten login (con /etc/hosts y pnpm dev). HTTPS sin puerto sigue pendiente de Cloudflare.

**Crítico:** Sin subdominio no hay login. Firebase Auth solo permite login desde app-test.bodasdehoy.com / chat-test.bodasdehoy.com (no localhost).

**Lo correcto (reverse proxy):** En el navegador (o Cursor) se abre **sin puerto**: **https://app-test.bodasdehoy.com** y **https://chat-test.bodasdehoy.com**. El proxy recibe en 443 y reenvía a 8080/3210. Requiere Public Hostnames del túnel en Cloudflare. **Workaround** si el proxy no está listo: /etc/hosts + http://app-test.bodasdehoy.com:8080 y :3210. Ver [NAVEGADOR-CURSOR-ARRANCAR-Y-PROBAR-URLS.md](./NAVEGADOR-CURSOR-ARRANCAR-Y-PROBAR-URLS.md).

**Opción definitiva (HTTPS sin puerto):** Cuando Cloudflare esté configurado, https://app-test.bodasdehoy.com y https://chat-test.bodasdehoy.com cargarán desde cualquier sitio. **Quien tiene acceso a Cloudflare somos nosotros (Frontend).**

**Para desbloquear el login** hace falta que en **Cloudflare** esté configurado el túnel para que app-test y chat-test lleguen a esta máquina. Pasos en: [PLAN-DOS-PROBLEMAS-APP-TEST-Y-CHAT-TEST.md](./PLAN-DOS-PROBLEMAS-APP-TEST-Y-CHAT-TEST.md) (sección “Pasos para que cargue con el dominio”).

Resumen para Frontend (nosotros tenemos acceso a Cloudflare):
1. DNS (bodasdehoy.com): CNAME **app-test** y **chat-test** → `30fdf520-9577-470f-a224-4cda1e5eb3f0.cfargotunnel.com` (Proxied).
2. Zero Trust → Tunnels → **lobe-chat-harbor** → Public Hostname: **app-test.bodasdehoy.com** → localhost:8080; **chat-test.bodasdehoy.com** → localhost:3210.
3. En esta máquina: `./scripts/iniciar-tunnel.sh` y `pnpm dev`.

---

## Mensaje para Slack (copiar y enviar a quien gestione Cloudflare)

```
Necesitamos que app-test.bodasdehoy.com y chat-test.bodasdehoy.com carguen por el túnel para poder hacer login (Firebase no permite login desde localhost).

Pasos en Cloudflare:
1) DNS bodasdehoy.com: CNAME app-test y chat-test → 30fdf520-9577-470f-a224-4cda1e5eb3f0.cfargotunnel.com (Proxied).
2) Zero Trust → Tunnels → lobe-chat-harbor → Public Hostname: app-test.bodasdehoy.com → localhost:8080; chat-test.bodasdehoy.com → localhost:3210.

Detalle en el repo: docs/LOGIN-REQUIERE-SUBDOMINIOS-APP-TEST-CHAT-TEST.md
```
