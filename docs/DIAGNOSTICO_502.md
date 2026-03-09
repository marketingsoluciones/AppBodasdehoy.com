# Diagnóstico del error 502

Resumen de **dónde** puede aparecer el 502 y **qué revisar** en cada caso.

---

## 1. Dónde puede salir 502

| Origen | Qué hace el usuario | Backend implicado |
|--------|---------------------|-------------------|
| **chat-test.bodasdehoy.com** (página) | Abre el Copilot / iframe | Servidor que sirve el Copilot (Next.js) |
| **api-ia.bodasdehoy.com** | Envía mensaje en el chat, login, identify-user | Backend Python (orchestrator, auth) |
| **Cloudflare** | Cualquier petición a esos dominios | Proxy → origen (chat-test o api-ia) |

---

## 2. 502 al cargar chat-test (iframe / Copilot)

**Síntoma:** La página del chat no carga; ves 502 en el iframe o en la pestaña.

**Causas habituales:**

1. **Cloudflare → origen (chat-test):** El servidor que sirve el Copilot no responde, tarda demasiado o devuelve error.
2. **DNS:** `chat-test.bodasdehoy.com` no resuelve o apunta a un origen incorrecto.
3. **Origen caído o reiniciando:** El Next.js del Copilot no está arriba o está desplegando.

**Qué revisar:**

- Cloudflare: registro DNS de `chat-test`, proxy (nube naranja), estado del origen.
- Servidor del Copilot: que el proceso Next.js esté corriendo y respondiendo en el puerto configurado.
- Probar en navegador: `https://chat-test.bodasdehoy.com` y ver si responde 502, timeout o DNS.

**Temporal:** Usar producción: `NEXT_PUBLIC_CHAT=https://chat.bodasdehoy.com` (en `.env` del proyecto web).

---

## 3. 502 al enviar mensaje en el chat (backend IA)

**Síntoma:** El chat carga, pero al escribir y enviar falla con 502 (o mensaje de “backend no disponible”).

**Causas habituales:**

1. **api-ia.bodasdehoy.com** no responde (caído, reiniciando, timeout).
2. **Cloudflare** devuelve 502 porque el origen (api-ia) falla.
3. **Red / VPN:** No se puede conectar a api-ia (ECONNREFUSED, ENOTFOUND, etc.).
4. **Backend devuelve 502:** p. ej. error interno del orchestrator o de un upstream.

**Qué revisar:**

- `curl -I https://api-ia.bodasdehoy.com` (y si tienes healthcheck, ese endpoint).
- Logs del Copilot: buscan `[502]`; indican si el fallo es conexión, timeout o respuesta 502 del backend.
- Variables de entorno: `PYTHON_BACKEND_URL` / `NEXT_PUBLIC_BACKEND_URL` → deben apuntar a `https://api-ia.bodasdehoy.com` (o al backend correcto). **No** usar `127.0.0.1:8030` en despliegue.

**Código relevante:**

- Copilot: `apps/copilot/src/app/(backend)/webapi/chat/[provider]/route.ts` (proxy al backend IA).
- Web: `apps/web/pages/api/copilot/chat.ts` (proxy desde la app web).

---

## 4. 502 en identify-user o login-with-jwt

**Síntoma:** Fallos al identificar usuario o al hacer login (Ej. en Copilot / EventosAutoAuth).

**Causa típica:** Esas rutas hacen proxy a **api-ia** (`/api/auth/identify-user`, `/api/auth/login-with-jwt`). Si antes usaban `127.0.0.1:8030` y no hay backend local, **conexión rechazada** → 502.

**Corrección aplicada:**

- `identify-user` y `login-with-jwt` usan:
  - `PYTHON_BACKEND_URL` o `NEXT_PUBLIC_BACKEND_URL`, o
  - fallback `https://api-ia.bodasdehoy.com`.
- Se eliminó el fallback a `127.0.0.1:8030` en despliegue.

**Qué revisar:**

- Que `PYTHON_BACKEND_URL` (o `NEXT_PUBLIC_BACKEND_URL`) esté definido y sea `https://api-ia.bodasdehoy.com` en el entorno donde corre el Copilot.
- Logs de esas rutas: si ves `ECONNREFUSED` o `fetch failed`, el backend no está alcanzable.

---

## 5. EMPTY_RESPONSE (backend IA) vs 502

El **BUG_REPORT_BACKEND_IA_OLLAMA.md** describe que el orchestrator a veces devuelve **EMPTY_RESPONSE** (respuesta vacía) aunque el modelo sí contestó. Eso suele ser un **error 4xx/5xx en JSON**, no necesariamente 502.

- **502:** Fallo de proxy/conexión o que el backend responda con 502.
- **EMPTY_RESPONSE:** El backend responde 200 pero el payload se considera “vacío” por lógica interna.

Si ves 502, sigue este diagnóstico. Si ves EMPTY_RESPONSE, revisar la lógica de “vacío/genérico” en el orchestrator (ver bug report).

---

## 6. Comandos útiles

```bash
# Comprobar si chat-test responde
curl -I https://chat-test.bodasdehoy.com

# Comprobar si api-ia responde
curl -I https://api-ia.bodasdehoy.com

# Probar health/chat (si existe)
curl -s -o /dev/null -w "%{http_code}" https://api-ia.bodasdehoy.com/webapi/chat/auto
```

---

## 7. Resumen

| Problema | Revisar |
|----------|--------|
| 502 al cargar chat-test | DNS, Cloudflare, servidor Copilot (Next.js) |
| 502 al enviar mensaje | api-ia operativo, `PYTHON_BACKEND_URL`, logs `[502]` |
| 502 en identify-user / login | Misma URL de backend; sin `127.0.0.1:8030` en prod |
| 502 genérico | Logs del Copilot y de api-ia; Cloudflare si aplica |

Las rutas de auth y chat ya usan **api-ia.bodasdehoy.com** por defecto y registran mejor los 502. Revisar siempre logs al reproducir el fallo.
