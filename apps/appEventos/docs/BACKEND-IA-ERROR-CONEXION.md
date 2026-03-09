# "Backend IA: Error de conexión" — qué es y qué hacer

## Qué significa

El **Copilot** (panel de IA) comprueba al cargar si el **Backend IA** (`api-ia.bodasdehoy.com`) responde. Si no, muestra el banner amarillo **"Backend IA: Error de conexión"** (o un mensaje más concreto según el fallo).

Flujo:

1. La app llama a **`/api/copilot/chat`** (proxy en Next.js).
2. Ese proxy reenvía la petición a **`https://api-ia.bodasdehoy.com`**.
3. Si api-ia no responde, responde con error (502/503) o hay fallo de red, el banner aparece.

## Mensajes que puedes ver (tras la mejora)

| Mensaje | Causa probable |
|--------|------------------|
| **Servicio IA no disponible. Intenta en unos minutos.** | Backend IA devolvió 503 (servicio no disponible). |
| **El servidor IA no responde (502). Comprueba que api-ia esté en marcha.** | Backend devolvió 502 (bad gateway). |
| **Demasiadas peticiones. Espera unos segundos.** | Rate limit (429). |
| **No se pudo conectar con el servidor IA. Comprueba tu conexión o que api-ia.bodasdehoy.com esté disponible.** | Fallo de red (timeout, DNS, firewall). |
| **Inicia sesión para chatear con el asistente.** | Usuario **anónimo/invitado**: el backend IA exige autenticación (401). Para chatear hay que iniciar sesión. |

## Usuario anónimo y chat

Si entras **como invitado** y abres el Copilot:

- El preflight no envía token; si el backend devuelve **401**, el banner muestra **"Inicia sesión para chatear con el asistente"** (ya no un genérico "Error de conexión").
- Si intentas enviar un mensaje sin estar logueado, la API puede devolver 401 y el propio chat mostrará un mensaje de "No autorizado. Inicia sesión de nuevo para usar el asistente."

Para que los anónimos puedan chatear con límites habría que permitirlo en el backend (api-ia) cuando reciba `metadata.isAnonymous` y aplicar, por ejemplo, rate limit por sesión invitado.

## Qué hacer

1. **Reintentar:** Usar el botón **"Reintentar"** del banner por si fue un fallo puntual.
2. **Comprobar api-ia:** Que el servicio Backend IA esté desplegado y responda:
   - Health: `https://api-ia.bodasdehoy.com/health` (si existe).
   - O que el equipo que mantiene api-ia confirme que está en marcha.
3. **Red / VPN:** Si estás en una red restringida o con VPN, prueba sin VPN o desde otra red.
4. **Variable de entorno:** En el despliegue de la app, `PYTHON_BACKEND_URL` debe apuntar al Backend IA correcto (por defecto `https://api-ia.bodasdehoy.com`).

## Dónde se maneja en código

- **Banner y preflight:** `apps/appEventos/components/Copilot/CopilotIframe.tsx` → `checkBackendIa()`.
- **Proxy al backend:** `apps/appEventos/pages/api/copilot/chat.ts` → usa `PYTHON_BACKEND_URL` (por defecto api-ia.bodasdehoy.com).

El banner **no bloquea** el uso de la app; el Copilot puede seguir intentando usarse y el error es informativo.

---

## Para api-ia (enviar por Slack)

Si necesitas **consultar** algo en api-ia puedes usar SSH. Si hace falta **modificar código** en api-ia, envía por Slack la siguiente especificación (o este bloque) al equipo del backend.

### Objetivo

Permitir que usuarios **anónimos/invitados** puedan chatear con el Copilot con límites (p. ej. rate limit por sesión), sin exigir `Authorization`.

### Qué envía ya el proxy (Next.js → api-ia)

En **todas** las peticiones a `POST .../webapi/chat/{provider}` el proxy reenvía:

- **Headers que ya existían:** `Content-Type`, `X-Development`, `X-Request-Id`, `Authorization` (si viene), `X-User-Id`, `X-Event-Id`, `X-Page-Name`, y si hay API key `X-API-Key`.
- **Nuevo header cuando el usuario es invitado:**  
  `X-Is-Anonymous: true`  
  (solo presente si el usuario no está logueado).
- **Body:** igual que antes; en `metadata` puede venir `isAnonymous: true` y `userId` con el id de sesión invitado (ej. `copilot_guest_xxx`).

Para invitados, **no** se envía `Authorization` (o se envía vacío). `X-User-Id` puede llevar el id de sesión invitado para rate limit por sesión.

### Qué pedir a api-ia

1. **Si `X-Is-Anonymous: true` (o `metadata.isAnonymous === true`):**  
   No devolver 401 por falta de token. Tratar la petición como usuario anónimo.
2. **Límites sugeridos:**  
   - Rate limit por `X-User-Id` (sesión invitado) para no abusar (ej. N mensajes/minuto).
   - Opcional: límite de mensajes por sesión invitado al día.
3. **Respuesta:**  
   Misma forma que para usuarios autenticados (stream o JSON), para que el front no cambie.

### Resumen para Slack

> **Asunto:** Soporte chat anónimo en api-ia  
> El front ya envía `X-Is-Anonymous: true` y `X-User-Id` (sesión invitado) en las peticiones a webapi/chat cuando el usuario no está logueado. ¿Podéis en api-ia aceptar esas peticiones sin exigir Authorization y aplicar rate limit por X-User-Id? Especificación detallada en `apps/appEventos/docs/BACKEND-IA-ERROR-CONEXION.md` sección "Para api-ia (enviar por Slack)".
