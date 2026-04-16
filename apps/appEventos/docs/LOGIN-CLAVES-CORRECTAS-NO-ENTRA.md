# Si las claves son correctas pero no inicia sesión

## Causas habituales

1. **Contraseña o email incorrectos**  
   Firebase puede devolver `auth/invalid-credential` (antes `auth/wrong-password`). Ahora se muestra el mensaje: *"Usuario o contraseña inválida"*.

2. **Firebase OK pero falla la API o la cookie**  
   El login con Firebase puede ser correcto y fallar después:
   - La llamada a **getUser** (API Bodas) no responde o devuelve error.
   - La llamada para obtener la **cookie de sesión** falla.  
   En esos casos antes no se mostraba ningún mensaje. **Ahora** verás:
   - *"Sesión iniciada pero no se pudieron cargar tus datos. Comprueba tu conexión e inténtalo de nuevo."*
   - O *"Sesión iniciada pero no se pudo guardar. Comprueba tu conexión e inténtalo de nuevo."*

3. **Dominio y redirección**  
   En **app-test.bodasdehoy.com** (o producción), si el desarrollo es `bodasdehoy`, al entrar en `/login` se **redirige a chat-test** para un login unificado. Tras iniciar sesión en chat-test, te devuelve a app-test (cookie `idTokenV0.1.0` con dominio `.bodasdehoy.com`). Si no se inicia sesión al volver o prefieres el formulario en la app, usa **`?local-login=1`**:  
   `https://app-test.bodasdehoy.com/login?local-login=1`

4. **Cookies / terceros**  
   Si las cookies de sesión no se guardan (navegador, privacidad, extensiones), la app puede no considerar la sesión como iniciada. Prueba en ventana privada sin extensiones o en otro navegador.

## Cambios hechos en código

- **Authentication.tsx:** mensajes distintos para credenciales incorrectas, error de cookie de sesión y error al cargar datos; manejo de `auth/invalid-credential`; `.catch()` en la llamada a getUser para mostrar error cuando falle la API tras un login correcto.
- **FormLogin.tsx:** códigos de error actualizados (`auth/invalid-credential`, `auth/user-not-found`, etc.) y mensaje de fallback para cualquier error.

Si tras esto sigues sin poder entrar, revisa la consola del navegador (F12 → Console) y la pestaña Red para ver si hay errores en `/api/` o en las llamadas a Firebase.
