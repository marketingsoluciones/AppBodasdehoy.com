# Pendientes y por qué las URLs (VPN/túnel) no cargan

**Resumen rápido:** Lo que falla no es la VPN ni el túnel en sí; es que **en Cloudflare** el dominio **bodasdehoy.com** no tiene configurados app-test y chat-test para que el tráfico vaya a nuestro túnel. Sin esa config, https://app-test.bodasdehoy.com y https://chat-test.bodasdehoy.com dan ERR.

**El config del túnel y de Cloudflare (DNS, Public Hostnames) lo gestionamos nosotros** (Frontend / este equipo).

---

## 1. Qué hay pendiente

### 1.1 Para nosotros (Frontend) – acciones nuestras

| # | Pendiente | Acción |
|---|-----------|--------|
| 1 | **Cloudflare: app-test y chat-test** | **Nosotros gestionamos este config.** En Cloudflare (zona bodasdehoy.com): DNS CNAME de app-test y chat-test al túnel, y Public Hostnames del túnel lobe-chat-harbor (app-test→8080, chat-test→3210). Ver sección 3 más abajo. |
| 2 | **Sistema de monitoreo de API Keys** | Ya respondimos breve en Slack. Si api-ia pide más detalle, enviar contenido de RESPUESTA-SLACK-SISTEMA-KEYS.md. |
| 3 | **Balance de keys en UI** | api-ia preguntó si queremos mostrar balance en UI. Decidir y responder en #copilot-api-ia. |
| 4 | **Notificaciones keys deshabilitadas** | api-ia ofreció: Slack, Dashboard, Email. Decidir y responder. |
| 5 | **Pruebas con usuario real (opcional)** | Si se quieren pruebas con JWT: definir TEST_USER_EMAIL y TEST_USER_PASSWORD (Firebase) y usar docs/PRUEBAS-COMO-USUARIO-REAL.md. |

### 1.2 Resuelto / en espera de otros

- **503 api-ia chat:** Resuelto (16 feb 2026: 20/20 preguntas → 200). Ya no bloquea.
- **Credenciales whitelabel:** Lo gestiona API2/api-ia; cuando cambien algo nos avisan.

---

## 2. Por qué “la VPN” no carga (app-test y chat-test en HTTPS)

No es que la VPN o el túnel estén rotos. Es que **el tráfico nunca llega a nuestro túnel** para esos hostnames.

### Qué sí funciona

- El **túnel** (cloudflared, lobe-chat-harbor) está corriendo en esta máquina.
- El **config local** (`~/.cloudflared/config.yml`) tiene el **ingress** correcto:
  - app-test.bodasdehoy.com → http://localhost:8080
  - chat-test.bodasdehoy.com → http://localhost:3210
- Los **servicios** en 8080 (web) y 3210 (Copilot) responden 200 en local.
- **Otros hostnames del mismo túnel** sí cargan por HTTPS, por ejemplo:
  - https://chat-test.eventosorganizador.com → 200
  - https://api-ia.bodasdehoy.com → 200 (remoto)
  - https://backend-chat-test.bodasdehoy.com → 200 (remoto)

Es decir: el túnel y los puertos locales están bien; el fallo es **solo para app-test.bodasdehoy.com y chat-test.bodasdehoy.com**.

### Por qué fallan app-test y chat-test.bodasdehoy.com

El flujo correcto sería:

1. El navegador pide **https://app-test.bodasdehoy.com**.
2. **DNS** resuelve app-test.bodasdehoy.com hacia Cloudflare (idealmente al túnel).
3. **Cloudflare** sabe que ese hostname lo sirve el túnel **lobe-chat-harbor** (Public Hostname).
4. Cloudflare envía el tráfico al **túnel** (que está en esta máquina).
5. El túnel, según el ingress, reenvía a **localhost:8080**.

Hoy falla en los pasos **2 y/o 3** para el dominio **bodasdehoy.com**:

- O bien **no hay CNAME** (o no apuntan al túnel) para app-test.bodasdehoy.com y chat-test.bodasdehoy.com en la zona DNS de **bodasdehoy.com**.
- O bien en **Zero Trust → Tunnels → lobe-chat-harbor** no hay **Public Hostname** para app-test.bodasdehoy.com y chat-test.bodasdehoy.com.

Mientras eso no esté configurado en Cloudflare, cuando alguien abre https://app-test.bodasdehoy.com o https://chat-test.bodasdehoy.com:

- El navegador puede recibir **ERR** (no resuelve, no conecta, timeout).
- El tráfico **no llega** al túnel de esta máquina, así que da igual que el túnel y el ingress estén bien.

**Resumen:** Las “VPN”/URLs no cargan porque **en Cloudflare (cuenta donde está bodasdehoy.com) faltan DNS (CNAME) y/o Public Hostnames** que envíen app-test y chat-test a nuestro túnel. **Ese config lo gestionamos nosotros** (Frontend / este equipo).

---

## 3. Qué falta en el reverse proxy (checklist)

Lo gestionamos nosotros. Para que **https://app-test.bodasdehoy.com** y **https://chat-test.bodasdehoy.com** carguen:

| # | Dónde | Qué falta |
|---|--------|-----------|
| 1 | **Cloudflare → DNS** (zona bodasdehoy.com) | CNAME **app-test.bodasdehoy.com** → `30fdf520-9577-470f-a224-4cda1e5eb3f0.cfargotunnel.com` (Proxied). |
| 2 | **Cloudflare → DNS** (zona bodasdehoy.com) | CNAME **chat-test.bodasdehoy.com** → `30fdf520-9577-470f-a224-4cda1e5eb3f0.cfargotunnel.com` (Proxied). |
| 3 | **Cloudflare Zero Trust → Tunnels → lobe-chat-harbor → Public Hostname** | Entrada: **app-test.bodasdehoy.com** → HTTP → **localhost:8080**. |
| 4 | **Cloudflare Zero Trust → Tunnels → lobe-chat-harbor → Public Hostname** | Entrada: **chat-test.bodasdehoy.com** → HTTP → **localhost:3210**. |

En esta máquina: el **ingress** está en **`config/cloudflared-config.yml`** del repo (app-test→8080, chat-test→3210). Al arrancar con `./scripts/iniciar-tunnel.sh` se usa ese config. Lo que falta para que las URLs carguen es la config en **Cloudflare** (DNS + Public Hostnames) para bodasdehoy.com.

---

## 4. Qué hacer en Cloudflare para que carguen

**Nosotros gestionamos este config.** En la cuenta de Cloudflare donde está el dominio **bodasdehoy.com**:

### 4.1 DNS

- **app-test.bodasdehoy.com** → CNAME → `30fdf520-9577-470f-a224-4cda1e5eb3f0.cfargotunnel.com` (Proxied: sí).
- **chat-test.bodasdehoy.com** → CNAME → mismo valor.

(El ID del túnel lobe-chat-harbor es `30fdf520-9577-470f-a224-4cda1e5eb3f0`.)

### 4.2 Zero Trust → Tunnels → lobe-chat-harbor → Public Hostname

- **Hostname:** app-test.bodasdehoy.com → **Service:** HTTP → **localhost:8080**.
- **Hostname:** chat-test.bodasdehoy.com → **Service:** HTTP → **localhost:3210**.

Cuando eso esté guardado y el túnel siga corriendo en esta máquina (y `pnpm dev` con 8080 y 3210), **https://app-test.bodasdehoy.com** y **https://chat-test.bodasdehoy.com** deberían cargar.

### 4.3 Comprobar después

```bash
./scripts/probar-urls-tunnel.sh
```

Si app-test y chat-test pasan a OK 200, ya se puede usar el navegador con esas URLs.

---

## 5. Workaround mientras tanto (solo en esta máquina)

- **/etc/hosts:**  
  `127.0.0.1 app-test.bodasdehoy.com chat-test.bodasdehoy.com`
- **Túnel y dev:** `./scripts/iniciar-tunnel.sh` y `pnpm dev`.
- **URLs:**  
  - http://app-test.bodasdehoy.com:8080  
  - http://chat-test.bodasdehoy.com:3210  

Firebase permite login desde app-test/chat-test.bodasdehoy.com (con o sin puerto según dominios autorizados).

---

## 6. Referencias en el repo

- **Estado túnel y URLs:** docs/ESTADO-TUNELES-ESTE-EQUIPO.md, docs/RESUMEN-APP-TEST-CHAT-TEST-BODASDEHOY.md.
- **Checklist completo:** docs/QUE-FALTA-VPN-Y-SUBDOMINIOS.md, docs/PLAN-DOS-PROBLEMAS-APP-TEST-Y-CHAT-TEST.md.
- **Public Hostnames / reverse:** docs/RESOLVER-URLS-Y-REVERSE-CLOUDFLARE.md, docs/DNS-YA-CORRECTO-FALTA-PUBLIC-HOSTNAMES.md.
- **Pendientes Slack/api-ia:** docs/PENDIENTES-Y-SLACK-ESTADO.md, TAREAS-PENDIENTES-SLACK.md.
