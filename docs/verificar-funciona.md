# Verificar que funciona

1. `pnpm dev:local` en la raiz.
2. Abre http://127.0.0.1:8080/api/health - debe devolver ok true.
3. Abre http://127.0.0.1:8080/ - debe verse Cargando y luego la app.
4. Abre http://127.0.0.1:3210/ - debe verse Cargando y luego el chat.

Si /api/health no carga, el servidor no esta arriba. Ver LOCAL-DOMINIOS-APP-TEST-CHAT-TEST.md seccion 8.
