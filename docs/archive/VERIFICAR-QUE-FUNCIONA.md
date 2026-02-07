# Cómo verificar que app-test y chat-test funcionan

Si sigues sin ver que funcione, haz estos pasos **en orden**.

---

## 1. Levantar los servidores

En la **raíz del monorepo** (donde está `package.json`):

```bash
pnpm dev:local
```

Espera a ver en la terminal algo como "Ready" para web (8080) y para copilot (3210). Si sale error de puerto en uso, ejecuta antes: `pnpm clean:next`.

---

## 2. Comprobar que la app web responde

Abre en el navegador **esta URL** (cópiala tal cual):

```
http://127.0.0.1:8080/api/health
```

- **Si ves** algo como `{"ok":true,"app":"web","time":"..."}` → la app web **está funcionando**. Sigue al paso 3.
- **Si no carga** (error de conexión, página en blanco) → el servidor web no está arriba o usa otro puerto. Vuelve al paso 1 y revisa la terminal por errores.

---

## 3. Comprobar la página principal de la app

Abre:

```
http://127.0.0.1:8080/
```

- **Si ves** primero "Cargando... Si ves esto, la app está respondiendo" y luego login o home → **funciona**.
- **Si la pantalla se queda en blanco** (sin ese texto): abre la consola del navegador (F12 → pestaña Console) y mira si hay mensajes en rojo. Esos errores indican qué falla.

---

## 4. Comprobar el chat (copilot)

Abre:

```
http://127.0.0.1:3210/
```

- **Si ves** "Cargando..." y luego el chat → **funciona**.
- **Si se queda en blanco**: F12 → Console y revisa errores.

---

## 5. Si usas dominios app-test / chat-test

Asegúrate de tener en **/etc/hosts**:

```
127.0.0.1   app-test.bodasdehoy.com
127.0.0.1   chat-test.bodasdehoy.com
```

Luego puedes usar en el navegador:

- http://app-test.bodasdehoy.com:8080/api/health  
- http://app-test.bodasdehoy.com:8080/  
- http://chat-test.bodasdehoy.com:3210/

---

## Resumen

El **paso 2** (`/api/health`) es el más importante: si esa URL devuelve `{"ok":true,...}`, el servidor web está respondiendo. Si ni eso carga, el problema es que el proceso no está en marcha o el puerto es otro.

Más detalles: `docs/LOCAL-DOMINIOS-APP-TEST-CHAT-TEST.md` (sección 8).
