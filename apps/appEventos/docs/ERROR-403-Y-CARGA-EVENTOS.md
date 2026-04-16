# Error 403 al cargar eventos o al iniciar sesión

## Qué significa el 403

Cuando la API devuelve **403 Forbidden**, el servidor **sí ha respondido** (no es un fallo de red). Significa que la petición no está autorizada: token inválido, cookie de sesión expirada o rechazada por el backend.

Por eso no debe mostrarse un mensaje de "error de conexión": la conexión fue correcta; lo que falla es la **autorización**.

## Cambios realizados

1. **`utils/Fetching.ts`**
   - Nueva función `getApiErrorMessage(error)` que devuelve un mensaje según el código HTTP:
     - **403**: "Sesión no autorizada o expirada. Cierra sesión e inicia de nuevo."
     - **401**: "Debes iniciar sesión de nuevo."
     - **502/503**: "El servidor no está disponible. Inténtalo en unos minutos."
     - **429**: "Demasiadas peticiones. Espera un momento e inténtalo de nuevo."
     - Error de red: "No se pudo conectar con el servidor. Comprueba tu conexión."

2. **Carga de eventos (`EventsGroupContext` + `pages/index.tsx`)**
   - Si falla la carga de eventos (p. ej. `fetchApiBodas` o `fetchApiEventos` con 403), se muestra el mensaje amigable anterior en lugar de "El servidor no responde".
   - El usuario ve claramente que debe cerrar sesión e iniciar de nuevo cuando el problema es 403.

3. **Login (`utils/Authentication.tsx`)**
   - Si tras el login Firebase la llamada a `getUser` (o auth) devuelve 403, se muestra "Sesión no autorizada o expirada..." en lugar de "Comprueba tu conexión".
   - En el `catch` del login, si el error tiene `response.status === 403`, se usa el mismo mensaje.

## Cómo probar

- **403**: En entorno real, si la cookie/token está mal o expirada, al cargar la app o al hacer login deberías ver el mensaje de sesión expirada, no "error de conexión".
- **Playwright**: Los E2E (`pnpm test:e2e:app:real`) siguen comprobando que la app carga y que login muestra el formulario; no simulan 403. Para reproducir 403 hace falta que el backend devuelva 403 (p. ej. cookie inválida en app-test).
