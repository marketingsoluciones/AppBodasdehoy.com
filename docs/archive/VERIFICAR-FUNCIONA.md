# Verificar que app-test y chat-test funcionan

Pasos en orden si no ves que funcione.

## 1. Levantar

En la raiz del monorepo: `pnpm dev:local`. Espera "Ready" en 8080 y 3210.

## 2. App web responde

Abre en el navegador: **http://127.0.0.1:8080/api/health**

- Si ves `{"ok":true,"app":"web",...}` la app web esta funcionando.
- Si no carga, el servidor no esta arriba o el puerto es otro.

## 3. Pagina principal

Abre: **http://127.0.0.1:8080/**

- Deberias ver "Cargando... Si ves esto, la app esta respondiendo" y luego login o home.
- Si pantalla en blanco: F12, pestana Console, revisa errores en rojo.

## 4. Chat (copilot)

Abre: **http://127.0.0.1:3210/**

- Deberias ver "Cargando..." y luego el chat.
- Si en blanco: F12, Console, revisa errores.

## 5. Con dominios

En /etc/hosts: `127.0.0.1 app-test.bodasdehoy.com` y `127.0.0.1 chat-test.bodasdehoy.com`.  
Luego: http://app-test.bodasdehoy.com:8080/api/health y http://chat-test.bodasdehoy.com:3210/

Mas detalle: docs/LOCAL-DOMINIOS-APP-TEST-CHAT-TEST.md seccion 8.
