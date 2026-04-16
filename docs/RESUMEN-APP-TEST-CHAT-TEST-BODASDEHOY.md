# Resumen: app-test.bodasdehoy.com y chat-test.bodasdehoy.com

**Última comprobación:** 17 feb 2026 (scripts/probar-urls-tunnel.sh)

---

## 1. Estado actual (HTTPS sin puerto)

| URL | Resultado | Nota |
|-----|-----------|------|
| **https://app-test.bodasdehoy.com/** | **ERR** (no conecta) | Falta config en Cloudflare |
| **https://chat-test.bodasdehoy.com/** | **ERR** (no conecta) | Falta config en Cloudflare |
| https://chat-test.eventosorganizador.com/ | 200 | Mismo túnel, mismo puerto 3210 |
| https://api-ia.bodasdehoy.com/health | 200 | Remoto |
| https://backend-chat-test.bodasdehoy.com/ | 200 | Remoto |

**Conclusión:** El túnel **lobe-chat-harbor** y los servicios locales (8080, 3210) están bien. **chat-test.eventosorganizador.com** responde 200 con el mismo túnel. Lo que falla es que **app-test** y **chat-test** bajo **bodasdehoy.com** no están asociados a este túnel en Cloudflare (DNS o Public Hostnames para el dominio bodasdehoy.com).

---

## 2. Qué hay en el repo (referencias)

- **Docs:**  
  - [QUE-FALTA-VPN-Y-SUBDOMINIOS.md](./QUE-FALTA-VPN-Y-SUBDOMINIOS.md) – checklist DNS, derivación 8080/3210, Firebase.  
  - [ESTADO-TUNELES-ESTE-EQUIPO.md](./ESTADO-TUNELES-ESTE-EQUIPO.md) – túnel lobe-chat-harbor, ingress (app-test→8080, chat-test→3210).  
  - [PLAN-DOS-PROBLEMAS-APP-TEST-Y-CHAT-TEST.md](./PLAN-DOS-PROBLEMAS-APP-TEST-Y-CHAT-TEST.md) – qué falta en Cloudflare.  
  - [LOGIN-REQUIERE-SUBDOMINIOS-APP-TEST-CHAT-TEST.md](./LOGIN-REQUIERE-SUBDOMINIOS-APP-TEST-CHAT-TEST.md) – Firebase solo acepta app-test/chat-test, no localhost.  
  - [RESOLVER-URLS-Y-REVERSE-CLOUDFLARE.md](./RESOLVER-URLS-Y-REVERSE-CLOUDFLARE.md) – Public Hostnames.  
  - [DNS-YA-CORRECTO-FALTA-PUBLIC-HOSTNAMES.md](./DNS-YA-CORRECTO-FALTA-PUBLIC-HOSTNAMES.md) – mismo tema.  
  - [NAVEGADOR-CURSOR-ARRANCAR-Y-PROBAR-URLS.md](./NAVEGADOR-CURSOR-ARRANCAR-Y-PROBAR-URLS.md) – URLs con/sin puerto, workaround /etc/hosts.  
  - [PENDIENTES-Y-SLACK-ESTADO.md](./PENDIENTES-Y-SLACK-ESTADO.md) – pendiente Cloudflare app-test/chat-test (Frontend).

- **Scripts:**  
  - `./scripts/probar-urls-tunnel.sh` – prueba todas las URLs del túnel.  
  - `./scripts/avanzar-sin-localhost.sh` – comprueba /etc/hosts, sugiere añadir app-test y chat-test, comprueba 8080/3210.  
  - `./scripts/iniciar-tunnel.sh` – arranca cloudflared tunnel; **usa `config/cloudflared-config.yml` del repo si existe** (subdominios versionados).  
  - `./scripts/cloudflare-revisar-parametros.sh` – muestra qué revisar en Cloudflare (CNAME, Public Hostnames).

- **Config del túnel (en el repo):**  
  - **`config/cloudflared-config.yml`** – config versionado del túnel: ingress con **app-test.bodasdehoy.com → localhost:8080** y **chat-test.bodasdehoy.com → localhost:3210** (y el resto de hostnames). Al ejecutar `./scripts/iniciar-tunnel.sh` se usa este archivo. Credenciales siguen en `~/.cloudflared/<tunnel-id>.json`.  
  - Si no existe ese archivo, el script usa `~/.cloudflared/config.yml` (cloudflared tunnel run lobe-chat-harbor).

---

## 3. Qué falta (lo gestionamos nosotros)

**El config del túnel y de Cloudflare lo gestionamos nosotros** (Frontend / este equipo). En **Cloudflare** (cuenta donde está **bodasdehoy.com**):

1. **DNS (CNAME):**  
   - `app-test.bodasdehoy.com` → `30fdf520-9577-470f-a224-4cda1e5eb3f0.cfargotunnel.com` (Proxied).  
   - `chat-test.bodasdehoy.com` → mismo túnel.

2. **Zero Trust → Tunnels → lobe-chat-harbor → Public Hostname:**  
   - **app-test.bodasdehoy.com** → HTTP → **localhost** → **8080**.  
   - **chat-test.bodasdehoy.com** → HTTP → **localhost** → **3210**.

Mientras eso no esté hecho, **https://app-test.bodasdehoy.com** y **https://chat-test.bodasdehoy.com** seguirán en ERR.

### Checklist rápido (hacer en Cloudflare)

| Paso | Dónde en Cloudflare | Acción |
|------|---------------------|--------|
| 1 | Zero Trust → Access → Tunnels | Abrir túnel **lobe-chat-harbor**. |
| 2 | Public Hostname (o Routes) | Añadir/editar: **app-test.bodasdehoy.com** → HTTP → **localhost:8080**. |
| 3 | Public Hostname | Añadir/editar: **chat-test.bodasdehoy.com** → HTTP → **localhost:3210**. |
| 4 | Esta máquina | `./scripts/iniciar-tunnel.sh` y `pnpm dev` (8080 + 3210). |
| 5 | Verificar | `./scripts/probar-urls-tunnel.sh` → deben salir OK para app-test y chat-test. |

Detalle: [DNS-YA-CORRECTO-FALTA-PUBLIC-HOSTNAMES.md](./DNS-YA-CORRECTO-FALTA-PUBLIC-HOSTNAMES.md), [PLAN-DOS-PROBLEMAS-APP-TEST-Y-CHAT-TEST.md](./PLAN-DOS-PROBLEMAS-APP-TEST-Y-CHAT-TEST.md).

---

## 4. Workaround en esta máquina (sin HTTPS público)

- Añadir en **/etc/hosts:**  
  `127.0.0.1 app-test.bodasdehoy.com chat-test.bodasdehoy.com`  
  (o usar `./scripts/avanzar-sin-localhost.sh --añadir-hosts` si lo soporta).

- Tener **túnel** y **pnpm dev** (8080 + 3210) en marcha.

- Abrir en el navegador:  
  - **http://app-test.bodasdehoy.com:8080** (web / login)  
  - **http://chat-test.bodasdehoy.com:3210** (Copilot)

Firebase acepta login desde app-test/chat-test.bodasdehoy.com (con o sin puerto en la URL según configuración de dominios autorizados).

---

## 5. Probar de nuevo cuando Cloudflare esté configurado

```bash
./scripts/probar-urls-tunnel.sh
```

Si app-test y chat-test pasan a **OK 200**, probar en navegador:

- https://app-test.bodasdehoy.com/login?d=app  
- https://chat-test.bodasdehoy.com  

Para probar chat en navegador/Cursor: [apps/web/PROBAR_CHAT_TEST_NAVEGADOR.md](../apps/web/PROBAR_CHAT_TEST_NAVEGADOR.md).
