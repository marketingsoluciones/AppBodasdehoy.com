# Por qué chat-test y app-test dan error

Resumen de las **causas habituales** cuando `https://app-test.bodasdehoy.com` o `https://chat-test.bodasdehoy.com` dan error (ERR, timeout, 503, pantalla en blanco).

---

## 1. No carga la página (ERR, timeout, no resuelve)

**Causa:** El tráfico **no llega** a los servidores que sirven app-test y chat-test.

### 1.1 DNS / Cloudflare (la más frecuente)

En la cuenta de **Cloudflare** donde está el dominio **bodasdehoy.com** tienen que estar configurados:

- **DNS:** CNAME de `app-test.bodasdehoy.com` y `chat-test.bodasdehoy.com` hacia el túnel (ej. `xxx.cfargotunnel.com`).
- **Zero Trust → Tunnels → Public Hostname:** app-test → localhost:8080, chat-test → localhost:3210.

Si eso **no está** o está mal, el navegador no resuelve o Cloudflare no envía el tráfico al túnel → **ERR**, timeout o “no carga”.

**Dónde está el detalle:** [PENDIENTES-Y-POR-QUE-VPN-NO-CARGA.md](./PENDIENTES-Y-POR-QUE-VPN-NO-CARGA.md) (secciones 2, 3 y 4).

### 1.2 VPN

Para que **resuelvan** y respondan app-test y chat-test, en muchos entornos hace falta **VPN** activa. Sin VPN, esos dominios pueden no resolverse o dar timeout.

**En E2E:** [e2e-app/README.md](../e2e-app/README.md) — “VPN (app-test + chat-test)”.

---

## 2. La página carga pero el chat/API da 503 (o “API key no válida”)

**Causa:** **api-ia** no puede obtener la configuración del whitelabel (API key del proveedor) desde **API2**, y devuelve 503 o mensaje de “API key no válida”.

### 2.1 Headers hacia api-ia

api-ia necesita saber **qué** desarrollo es (X-Development) y, si ellos llaman a API2, una **Support Key** válida para ese desarrollo. Si falta o falla:

- api-ia no obtiene la API key en API2 → **503** o error de autenticación.

**Dónde está el detalle:** [X-DEVELOPMENT-VS-X-SUPPORT-KEY.md](./X-DEVELOPMENT-VS-X-SUPPORT-KEY.md).

- **X-Development:** ej. `bodasdehoy` (identifica el tenant).
- **X-Support-Key:** credencial para que api-ia (o API2) pueda llamar a getWhiteLabelConfig; si no la tienen o es inválida → error.

### 2.2 Credenciales en API2

Si en **API2** la config del whitelabel (bodasdehoy) tiene mal la API key de Anthropic/OpenAI (o está vacía), api-ia también puede devolver **503** aunque los headers sean correctos. Eso lo gestiona el equipo de API2/api-ia.

---

## 3. Resumen rápido

| Síntoma | Causa probable | Qué revisar |
|--------|----------------|-------------|
| ERR, timeout, no carga app-test/chat-test | DNS/Cloudflare o falta VPN | Cloudflare: CNAME + Public Hostnames; VPN activa. Ver PENDIENTES-Y-POR-QUE-VPN-NO-CARGA.md. |
| Página carga pero chat/API 503 | api-ia no obtiene config/API key | Headers X-Development y X-Support-Key; credenciales whitelabel en API2. Ver X-DEVELOPMENT-VS-X-SUPPORT-KEY.md. |
| Pantalla en blanco en E2E | BASE_URL=app-test sin VPN o sin config Cloudflare | Usar VPN y/o comprobar que app-test/chat-test cargan en el navegador. |

---

## 4. Próximos pasos (consultar / reiniciar)

En MCP e IA **solo consultar o reiniciar**, no modificar código. Ver [MCP-IA-SOLO-CONSULTAR-O-REINICIAR.md](./MCP-IA-SOLO-CONSULTAR-O-REINICIAR.md).

- **Desde tu terminal (SSH):** `ssh backend-ia-v2` y revisar: `pgrep -fl cloudflared`, escucha en 8080/3210, logs de túnel o api-ia. (En backend-ia-v2 no hay cloudflared ni 8080/3210; ver [ESTADO-SERVIDOR-BACKEND-IA-V2.md](./ESTADO-SERVIDOR-BACKEND-IA-V2.md).)
- **En esta máquina:** Si 8080/3210 están activos pero app-test y chat-test no cargan, **arrancar el túnel:** `cloudflared tunnel run` (config en `~/.cloudflared/config.yml`).
- **Cloudflare:** Revisar en el dashboard DNS + Public Hostnames del túnel para app-test y chat-test.
- **Slack:** Avisar al equipo (#copilot-api-ia) con resumen de este doc si hace falta que alguien con acceso revise api2/api-ia o Cloudflare:  
  `bash scripts/slack-notify.sh --web question "🔍 app-test/chat-test ERR: revisar Cloudflare DNS + Public Hostnames y/o api-ia 503 (X-Support-Key)"`

---

## 5. Referencias

- **Cloudflare / túnel / DNS:** [PENDIENTES-Y-POR-QUE-VPN-NO-CARGA.md](./PENDIENTES-Y-POR-QUE-VPN-NO-CARGA.md)
- **Headers y Support Key:** [X-DEVELOPMENT-VS-X-SUPPORT-KEY.md](./X-DEVELOPMENT-VS-X-SUPPORT-KEY.md)
- **E2E y VPN:** [e2e-app/README.md](../e2e-app/README.md)
- **Login y subdominios:** [LOGIN-REQUIERE-SUBDOMINIOS-APP-TEST-CHAT-TEST.md](./LOGIN-REQUIERE-SUBDOMINIOS-APP-TEST-CHAT-TEST.md)
