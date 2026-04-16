# Login y subdominios (app-test / chat-test)

## Problema

Al hacer **Iniciar sesión** a veces se redirige a **chat-test** y falla por el subdominio:

- Si el usuario entra en app-test y tras el login se le manda a chat-test, la sesión puede no funcionar bien en el otro subdominio.
- Si el usuario intenta iniciar sesión desde **chat-test**, Firebase puede devolver **auth/unauthorized-domain** si chat-test no está en los dominios autorizados.

## Solución aplicada en código

1. **No redirigir a otro subdominio tras el login**  
   En app-test y chat-test, la redirección después del login se normaliza: si el parámetro `d` apunta a una URL de **otro** subdominio (por ejemplo de app-test a chat-test), se ignora y se redirige a `/` en el **mismo** origen. Así el usuario se queda en el sitio donde hizo login y no falla por subdominio.

   - Implementado en `utils/urlHelpers.ts` → `normalizeRedirectAfterLogin()`.
   - Usado en `context/AuthContext.tsx` (login por redirect) y en `utils/Authentication.tsx` (login por popup).

2. **Recomendación de uso**  
   Hacer login siempre en **app-test** (organizador). El Copilot (chat-test) se usa desde app-test (iframe o pestaña); no hace falta iniciar sesión en chat-test por separado.

## Firebase: dominios autorizados

Los subdominios **dependen de configuración** (Firebase Authorized domains, DNS, etc.). Ya los hemos configurado más de una vez y **funcionan**; si en el futuro hubiera que revisarlos:

1. Ir a [Firebase Console](https://console.firebase.google.com) → tu proyecto.
2. **Authentication** → **Settings** → **Authorized domains**.
3. Tener presentes: `app-test.bodasdehoy.com`, `chat-test.bodasdehoy.com`.

Sin ellos, Firebase puede devolver **auth/unauthorized-domain**. Con la config actual, seguimos adelante.

## Hacer pruebas por el canal que da menos errores

Para las pruebas (test de preguntas, Copilot, etc.) usamos **este canal**:

1. **Cargar el origen real, no localhost:** usar **app-test.bodasdehoy.com** (el origen con los subdominios configurados). No usar localhost para estas pruebas; seguir los consejos de subdominios y login que hemos documentado.
2. **Asegurarse de que chat-test está arriba:** el Copilot funciona cargando un iframe de chat-test; si chat-test no está levantado, el Copilot no cargará (502 o pantalla en blanco).
3. Entrar en **app-test** (ej. `https://app-test.bodasdehoy.com`).
4. Iniciar sesión ahí (sin redirigir a chat-test).
5. Usar el **Copilot desde el panel lateral** de la misma página (iframe), no abrir chat-test en otra pestaña.
6. Lanzar las preguntas desde ese Copilot embebido.

Así todo va por el **mismo origen** y hay menos errores por subdominio, cookies o Firebase. La página de testing está en **/test-preguntas**. Recordatorio: **chat-test tiene que estar arriba** para que el Copilot funcione.

Si **los subdominios no cargan**, ver avances hechos y diagnóstico en [ESTADO-SUBDOMINIOS-Y-AVANCES.md](ESTADO-SUBDOMINIOS-Y-AVANCES.md).

## Resumen

| Qué | Acción |
|-----|--------|
| Tras login en app-test | No se redirige a chat-test; se queda en app-test (ruta normalizada). |
| Login desde chat-test | Añadir chat-test en Firebase Authorized domains si se quiere permitir. |
| Uso recomendado | Login en app-test; usar Copilot (chat-test) desde ahí (iframe). |
| Pruebas | Hacerlas por app-test + Copilot en panel lateral (canal que da menos errores). |
