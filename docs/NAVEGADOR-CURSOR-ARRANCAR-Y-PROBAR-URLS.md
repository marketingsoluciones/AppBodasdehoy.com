# Navegador interno de Cursor: arrancar y probar las dos URLs (y hacer login)

**Última comprobación:** 12 feb 2025

---

## Crítico: login solo con subdominio

Si no cargamos por la **URL de subdominio** (app-test / chat-test), **no se puede hacer login** (Firebase no acepta localhost). Es crítico resolver esto y que se vea por el **navegador interno de Cursor**.

---

## Lo correcto: reverse proxy → sin puerto en el navegador

Es un **reverse proxy** (Cloudflare Tunnel): el navegador **no** lleva puerto en la URL. Abres en el navegador (o en Cursor):

- **https://app-test.bodasdehoy.com** (web / login)
- **https://chat-test.bodasdehoy.com** (Copilot)

El proxy recibe en 443 y reenvía internamente a 8080 y 3210. **No se escribe :8080 ni :3210 en el navegador.**

Para que eso funcione hace falta: **Public Hostnames** del túnel en Cloudflare + túnel en marcha + `pnpm dev`. Ver [DNS-YA-CORRECTO-FALTA-PUBLIC-HOSTNAMES.md](./DNS-YA-CORRECTO-FALTA-PUBLIC-HOSTNAMES.md).

---

## Workaround (solo si el reverse proxy no está listo)

Si el túnel/Cloudflare aún no está configurado, en **esta máquina** se puede usar el subdominio **con puerto** y **/etc/hosts** para que el Host sea el correcto y Firebase permita login:

- http://app-test.bodasdehoy.com:8080
- http://chat-test.bodasdehoy.com:3210

Requisitos: /etc/hosts (app-test y chat-test → 127.0.0.1) y `pnpm dev`. Es un parche; lo definitivo es el reverse proxy y abrir **sin puerto** en el navegador.

---

## Capacidad del agente

El agente (Cursor) puede:

1. **Arrancar** servicios: `./scripts/iniciar-tunnel.sh` y `pnpm dev`.
2. **Abrir el navegador interno** y navegar a las URLs **sin puerto** (cuando el reverse proxy esté activo) o con puerto (workaround).
3. **Probar** que cargan y que se puede hacer login.

---

## Resultado de las pruebas en el navegador interno

| URL | Resultado |
|-----|-----------|
| **https://app-test.bodasdehoy.com** (sin puerto) | No carga → `chrome-error` mientras el reverse proxy no esté bien configurado. |
| **https://chat-test.bodasdehoy.com** (sin puerto) | No carga → mismo motivo. |
| http://app-test.bodasdehoy.com:8080 (workaround) | Sí carga → login posible con /etc/hosts. |
| http://chat-test.bodasdehoy.com:3210 (workaround) | Sí carga → Copilot. |
| http://localhost:8080/ | Sí carga (pero Firebase no acepta login desde localhost). |

**Objetivo:** Que **https://app-test.bodasdehoy.com** y **https://chat-test.bodasdehoy.com** carguen **sin puerto** en el navegador de Cursor gracias al reverse proxy (túnel + Public Hostnames). Mientras tanto, el workaround con puerto + /etc/hosts permite probar login en esta máquina.

---

## Cargar en el navegador interno de Cursor (necesario para probar login)

Para que **cargue en el navegador interno de Cursor** hay que usar las URLs **con puerto** (el agente no alcanza el túnel HTTPS desde su contexto):

1. **Requisitos en esta máquina:** `/etc/hosts` con `app-test.bodasdehoy.com` y `chat-test.bodasdehoy.com` → 127.0.0.1. Si falta: `./scripts/avanzar-sin-localhost.sh --añadir-hosts`. Y **pnpm dev** (8080 + 3210).
2. **Abrir en el navegador interno de Cursor:**
   - **http://app-test.bodasdehoy.com:8080** (web / login)
   - **http://chat-test.bodasdehoy.com:3210** (Copilot)

Así se cargan ambas en Cursor y el login funciona (Host = subdominio real).

## Flujo recomendado para el agente

1. Comprobar /etc/hosts y servicios: `./scripts/avanzar-sin-localhost.sh`; si faltan procesos, `pnpm dev`.
2. En el navegador interno de Cursor, abrir:
   - **http://app-test.bodasdehoy.com:8080**
   - **http://chat-test.bodasdehoy.com:3210**
3. Para uso sin puerto (https) desde un navegador externo hace falta reverse proxy + Public Hostnames en Cloudflare.

Referencias: [PLAN-DOS-PROBLEMAS-APP-TEST-Y-CHAT-TEST.md](./PLAN-DOS-PROBLEMAS-APP-TEST-Y-CHAT-TEST.md), [LOGIN-REQUIERE-SUBDOMINIOS-APP-TEST-CHAT-TEST.md](./LOGIN-REQUIERE-SUBDOMINIOS-APP-TEST-CHAT-TEST.md).
