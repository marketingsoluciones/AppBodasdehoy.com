# Básico: app-test y chat-test no cargan por URL

**Problema:** Al abrir por URL no cargan:
- **https://app-test.bodasdehoy.com/login?d=app**
- **https://chat-test.bodasdehoy.com**

En esta máquina el túnel **lobe-chat-harbor** está corriendo y el config tiene app-test → 8080 y chat-test → 3210; los puertos responden. Si aun así no cargan por URL, el fallo está en **Cloudflare**: DNS o Public Hostnames del túnel.

---

## 1. Qué tiene que pasar para que carguen por URL

1. **DNS** de `app-test.bodasdehoy.com` y `chat-test.bodasdehoy.com` debe enviar el tráfico al **túnel** (no a una IP suelta).
2. El túnel **lobe-chat-harbor** debe tener configurados en Cloudflare los **Public Hostnames** para esos dominios.

Si falta (1) o (2), la URL no llega a tu máquina y no carga.

---

## 2. Revisar en Cloudflare (pasos básicos)

### A) DNS (Cloudflare Dashboard → bodasdehoy.com → DNS → Records)

Para que el tráfico vaya al túnel:

| Tipo | Nombre | Contenido / Target | Proxy |
|------|--------|---------------------|-------|
| CNAME | **app-test** | **30fdf520-9577-470f-a224-4cda1e5eb3f0.cfargotunnel.com** | Proxied (naranja) |
| CNAME | **chat-test** | **30fdf520-9577-470f-a224-4cda1e5eb3f0.cfargotunnel.com** | Proxied (naranja) |

El valor `30fdf520-9577-470f-a224-4cda1e5eb3f0` es el **ID del tunnel lobe-chat-harbor**. En tu cuenta el hostname del tunnel puede ser otro (por ejemplo `xxx.trycloudflare.com` o un dominio custom). Comprueba en **Zero Trust → Access → Tunnels → lobe-chat-harbor** cuál es la URL del tunnel y usa ese mismo valor como **Target** del CNAME.

- Si **app-test** o **chat-test** son tipo **A** o apuntan a una **IP**, el tráfico no pasará por el túnel de esta máquina; hay que cambiarlos a **CNAME** al hostname del tunnel.
- Si el dominio está en otro proveedor DNS (no Cloudflare), hay que crear ahí el CNAME hacia el hostname del tunnel de Cloudflare.

### B) Public Hostnames del tunnel (Zero Trust → Access → Tunnels)

1. Entra en **Cloudflare Zero Trust** (o Dashboard donde gestiones el tunnel).
2. **Access → Tunnels** → túnel **lobe-chat-harbor**.
3. **Public Hostname**: deben existir entradas para:
   - **app-test.bodasdehoy.com** → servicio **HTTP** → **localhost:8080** (o el que use el ingress).
   - **chat-test.bodasdehoy.com** → servicio **HTTP** → **localhost:3210**.

Si el tunnel se configuró solo por **archivo de config** (`~/.cloudflared/config.yml`) y no por el dashboard, a veces Cloudflare usa igualmente el ingress del config; en ese caso lo crítico es que **DNS** apunte al tunnel (CNAME como arriba).

---

## 3. Comprobar desde fuera

En un navegador o con curl (en otra red, o con “bypass cache”):

```bash
curl -I https://app-test.bodasdehoy.com/login?d=app
curl -I https://chat-test.bodasdehoy.com
```

- **200 / 301 / 302**: la URL está llegando al origen (esta máquina) y debería cargar.
- **502 / 503 / connection refused**: el tráfico no llega bien al tunnel o al puerto local (revisar DNS y Public Hostnames).
- **DNS resolution failed**: los registros DNS de app-test o chat-test no existen o no apuntan al hostname del tunnel.

---

## 4. Resumen

| Qué | Dónde | Revisar |
|-----|--------|---------|
| **DNS** | Cloudflare → bodasdehoy.com → DNS | app-test y chat-test en **CNAME** al hostname del tunnel **lobe-chat-harbor** (ej. `30fdf520-9577-470f-a224-4cda1e5eb3f0.cfargotunnel.com`), proxy activado. |
| **Public Hostnames** | Zero Trust → Tunnels → lobe-chat-harbor | app-test.bodasdehoy.com → :8080, chat-test.bodasdehoy.com → :3210. |
| **Tunnel y puertos** | Esta máquina | Ya comprobado: tunnel corriendo, 8080 y 3210 OK. |

Es **básico**: si las URLs no cargan, casi siempre es que **DNS no apunta al tunnel** o que **Public Hostnames** no tienen app-test y chat-test. Corrige eso y **https://app-test.bodasdehoy.com/login?d=app** y **https://chat-test.bodasdehoy.com** deberían cargar por URL.

**VPN llega aquí pero falta el “reverse” (configurar en Cloudflare) y probar desde terminal:** ver **[RESOLVER-URLS-Y-REVERSE-CLOUDFLARE.md](./RESOLVER-URLS-Y-REVERSE-CLOUDFLARE.md)**. Para probar: `./scripts/probar-urls-tunnel.sh`.
