# Mensaje "Solicitud fallida" / Error 500 en chat-ia (Copilot)

## Qué significa

Cuando en **chat-test** (Copilot) ves:

- **Título:** "Solicitud fallida"
- **Texto:** "Lo sentimos, el servidor parece estar experimentando dificultades y no puede completar su solicitud en este momento. Por favor, inténtelo de nuevo más tarde"
- **"Detalles del error"** (expandible)

es la **pantalla de error genérica para HTTP 500** que muestra la app cuando **alguna llamada tRPC al backend de chat-ia falla con error interno** (status 500).

Esa llamada va a **`/trpc/lambda`**: el router Lambda de chat-ia (procedimientos como sesiones, mensajes, chat con IA, wallet, plugins, etc.). Algo en ese flujo está devolviendo 500.

## Cómo saber qué petición falla

1. **En la propia pantalla:**  
   Abre **"Detalles del error"** en la notificación. Ahí suele aparecer el mensaje de error del servidor (o el de la excepción), que ayuda a ver si es timeout, conexión rechazada, error de API externa, etc.

2. **En el navegador (Network):**  
   - Abre DevTools → pestaña **Network**.  
   - Filtra por **"trpc"** o **"lambda"**.  
   - Reproduce la acción que dispara el error.  
   - Busca la petición a **`/trpc/lambda/...`** que devuelva **500** (o en rojo). La URL del procedimiento (p. ej. `session.get`, `message.get`, `aiChat.generate`, etc.) te dice qué operación está fallando.

3. **En los logs del servidor (chat-ia):**  
   Si tienes acceso a la terminal donde corre `pnpm dev` (o el proceso de chat-ia en 3210), revisa los logs en el momento del error. Ahí suelen salir stack traces o mensajes como "ECONNREFUSED", "fetch failed", "502", etc., que apuntan al servicio real que está fallando (API-IA, API2, base de datos, etc.).

## Causas típicas

- **Backend de IA (api-ia, Python, etc.)** caído, timeout o devolviendo 500.
- **API2** (eventosorganizador.com) no disponible o devolviendo error.
- **Base de datos / servicios internos** del servidor de chat-ia no disponibles.
- **Túnel / proxy** (app-test, chat-test): si el front llega bien pero el servidor de chat-ia no puede salir a internet o a otro servicio, también pueden aparecer 500.

## Resumen

El mensaje **no es un bug de texto**: es la UI de error ante un **500 real** en alguna llamada a **/trpc/lambda**. Para saber el motivo hay que ver los "Detalles del error", la petición fallida en Network y, si es posible, los logs del servidor de chat-ia.
