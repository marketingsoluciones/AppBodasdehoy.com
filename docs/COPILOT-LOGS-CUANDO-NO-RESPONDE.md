# Logs del chat del Copilot cuando no responde

Guía para revisar **qué está pasando** cuando el Copilot no responde: dónde mirar los logs y qué significan.

---

## 1. Dónde están los logs

### A) Terminal del servidor **web** (Next.js, puerto 8080)

Al enviar un mensaje en el chat, la **API** `POST /api/copilot/chat` escribe en la consola donde corre `pnpm dev` (o `next dev`) de `apps/web`.

**Mensajes útiles:**

| Log | Significado |
|-----|-------------|
| `[Copilot API] Step 1: Proxying to Python backend...` | Se intenta enviar al backend api-ia. |
| `[Copilot API] Proxying to Python backend: https://api-ia.../webapi/chat/...` | URL y provider usados. |
| `[Copilot API] Backend response status: 200` | Backend respondió bien. |
| `[Copilot API] Backend response status: 502` (o 500, 503) | **Backend falló**; ver siguiente mensaje de error. |
| `[Copilot API] Backend error, status: ...` | Detalle del error del backend (trace_id, error_code en headers). |
| `[Copilot API] Python backend proxy successful` | Todo OK por proxy. |
| `[Copilot API] Backend IA failed; fallbacks disabled.` | Falló backend y no hay fallback (ENABLE_COPILOT_FALLBACK=false). |
| `[Copilot API] Step 2: Using OpenAI direct fallback...` | Se usa OpenAI como respaldo. |
| `[Copilot API] Could not get API key from whitelabel` | No hay API key; el usuario verá mensaje de “servicio no disponible”. |
| `[Copilot API] Proxy error:` | Error en el proxy (red, timeout, etc.). |
| `[Copilot API] Error:` | Error no esperado en el handler. |

**Qué revisar:** Si ves `Backend response status: 502/503` o `Proxy error`, el problema suele ser **api-ia** (no responde, timeout o error interno). Si ves `Could not get API key`, el problema es **configuración/whitelabel**.

---

### B) Consola del **navegador** (DevTools → Console)

En la pestaña donde está abierta la app (ej. localhost:8080), al enviar un mensaje:

| Log | Significado |
|-----|-------------|
| `[Copilot] Message sent (stream) XXX ms` | Mensaje enviado y respuesta recibida (métricas). |
| `[CopilotEmbed] Error sending message:` | Error en el cliente al enviar o al leer el stream. |
| `[CopilotChat] Error sending message:` | Error en `sendChatMessage` (red, timeout, parseo). |

Si el Copilot **no responde** y no aparece ningún error en consola, puede ser:
- Timeout (35 s en el cliente): se cancela la petición y a veces se muestra “La solicitud tardó demasiado y se canceló”.
- La respuesta del backend no llega o el stream se corta sin `[DONE]`.

**Qué revisar:** Errores de red (Failed to fetch, CORS), `AbortError` (timeout) o mensajes de `[CopilotEmbed]` / `[CopilotChat]`.

---

### C) Logs del **backend api-ia** (Python)

Si tienes acceso al servidor donde corre **api-ia** (api-ia.bodasdehoy.com o local), ahí aparecen:

- Errores de conexión con el proveedor de IA (OpenAI, Anthropic, etc.).
- Timeouts, rate limits, errores 5xx del proveedor.
- `trace_id` que se reenvía en las cabeceras de respuesta y que puedes cruzar con los logs del proxy.

**Qué revisar:** Buscar por `trace_id` o por la hora del request; ver si api-ia recibe la petición y qué error devuelve (502, 503, timeout, etc.).

---

### D) Logs en **archivo** (solo desarrollo)

En `apps/web`, en desarrollo, algunos logs del navegador se envían a:

- **API:** `POST /api/dev/browser-log`
- **Archivo:** `.browser-logs.json` en la raíz de `apps/web`
- **Ver:** `GET /api/dev/browser-log?limit=50` o la página de debug si existe (ej. `/debug-front`).

Aquí no se registran por defecto los logs del **servidor** de la API (`/api/copilot/chat`); solo lo que el front envía explícitamente a `browser-log`.

---

## 2. Flujo cuando “no responde”

1. **Front** (CopilotEmbed/CopilotIframe) llama a `sendChatMessage` → `POST /api/copilot/chat` (web, puerto 8080).
2. **Web** (`apps/web/pages/api/copilot/chat.ts`) hace proxy a **api-ia**: `POST {PYTHON_BACKEND_URL}/webapi/chat/{provider}`.
3. **Api-ia** habla con el proveedor de IA y devuelve stream (SSE) o JSON.
4. Si api-ia falla o no responde, el handler de la web puede usar **fallbacks** (OpenAI directo, whitelabel, etc.) si están configurados.

Cuando el usuario dice que “no responde”, suele ser uno de estos casos:

- **Timeout:** Cliente (35 s) o proxy (60 s) o api-ia. En consola: `AbortError` o “La solicitud tardó demasiado”.
- **Backend no disponible:** 502/503 desde api-ia. En **terminal del servidor web**: `Backend response status: 502` (o 503) y a veces `[Copilot API] Backend error`.
- **Sin API key:** En terminal: `Could not get API key from whitelabel`; el usuario ve “El servicio de IA no está disponible”.
- **Error de red/CORS:** En **consola del navegador**: “Failed to fetch” o error CORS; la petición ni llega a la web o a api-ia.
- **Stream cortado:** Backend envía stream pero se cierra antes de tiempo; en navegador puede no haber error claro, solo falta de contenido.

---

## 3. Qué revisar en orden (checklist)

1. **Terminal del servidor web (8080)**  
   - ¿Aparece `[Copilot API] Step 1: Proxying to Python backend...`?  
   - ¿Qué sale después: `Backend response status: 200` o `502/503` / `Backend error` / `Proxy error`?

2. **Consola del navegador**  
   - ¿Hay `[CopilotEmbed] Error sending message` o `[CopilotChat] Error sending message`?  
   - ¿Hay “Failed to fetch”, CORS o “AbortError”?

3. **Pestaña Network (navegador)**  
   - Petición a `.../api/copilot/chat`: ¿status 200 (stream) o 502/503/500?  
   - Si es 200, ¿llegan datos (stream) o la respuesta queda vacía/cortada?

4. **Variables de entorno (web)**  
   - `PYTHON_BACKEND_URL` o la URL del backend: ¿es la correcta y alcanzable?  
   - Si usas fallback: `OPENAI_API_KEY`, `ENABLE_COPILOT_FALLBACK`, whitelabel/api-ia.

5. **Api-ia (si tienes acceso)**  
   - Logs del servidor en el momento del request; buscar por `trace_id` o por la hora.

Con esto puedes acotar si el fallo está en el **cliente**, en el **proxy (web)** o en el **backend api-ia**, y qué mensaje de log corresponde a “no responde”.
