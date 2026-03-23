# Diagnóstico: chat-test y app-test no cargan

**Fecha comprobación:** 12 mar 2026

## Qué es qué

- **app-test** = El sitio `https://app-test.bodasdehoy.com` (la app de bodas/eventos).
- **chat-test** = El sitio `https://chat-test.bodasdehoy.com` (el chat/Copilot).
- **Servidor de app-test** = La máquina donde está desplegada la aplicación que ves en app-test. Si el proceso que sirve las páginas está caído, app-test da 502.

---

## Resultado de la comprobación

| Entorno     | HTTP status | Significado |
|------------|-------------|-------------|
| **app-test**  | **502** Bad Gateway | Cloudflare responde, pero el **servidor donde está app-test** no responde o está caído. |
| **chat-test** | **500** Internal Server Error | El servidor **sí responde**, pero devuelve error (excepción no capturada, fallo al renderizar, etc.). |

Por eso no carga nada: app-test devuelve 502 (servidor de app-test caído o mal configurado) y chat-test devuelve 500 (error en el servidor).

---

## Qué revisar

### app-test (502)

- **Servidor donde está desplegado app-test:** que el proceso que sirve las páginas esté **arrancado** y escuchando en el puerto que Cloudflare usa como origin.
- **Cloudflare:** en app-test.bodasdehoy.com, comprobar que el **Origin Server** apunte al host y puerto correctos.
- **Logs del servidor** de app-test: si el proceso está caído, ver el motivo (crash, OOM, etc.).

### chat-test (500)

- **Logs del servidor** donde corre chat-ia (Next.js): el 500 suele dejar stack trace o mensaje en consola. Buscar el error justo al servir la ruta `/` o la que reescribe el middleware (`/en-US__0__dark?developer=bodasdehoy`).
- **Variables de entorno** en el despliegue de chat-test: falta alguna (p. ej. de BD, auth, api-ia) que rompe al arrancar o al renderizar.
- **Health:** si existe `https://chat-test.bodasdehoy.com/api/health`, probar con `curl -s -o /dev/null -w "%{http_code}" https://chat-test.bodasdehoy.com/api/health` para ver si al menos esa ruta responde 200.

---

## Comandos para comprobar desde tu máquina

```bash
# Status de app-test
curl -s -o /dev/null -w "app-test: HTTP %{http_code}\n" https://app-test.bodasdehoy.com/

# Status de chat-test
curl -s -o /dev/null -w "chat-test: HTTP %{http_code}\n" https://chat-test.bodasdehoy.com/

# Si tienes health en chat-test
curl -s -o /dev/null -w "chat-test health: HTTP %{http_code}\n" https://chat-test.bodasdehoy.com/api/health
```

---

## Resumen

| Problema   | Causa más probable                         | Acción |
|-----------|--------------------------------------------|--------|
| app-test 502 | Servidor de app-test caído o mal configurado en Cloudflare | Revisar que el proceso que sirve app-test esté arriba y que Cloudflare apunte al origin correcto. |
| chat-test 500 | Error en el servidor al servir la página   | Revisar logs del proceso Next.js de chat-ia y variables de entorno. |

Esto es un problema de **infraestructura/despliegue** (servidores o configuración), no del código en el repo. Hay que revisar los entornos donde están desplegados app-test y chat-test.
