# ✅ Avanzar – Estado y Próximos Pasos

## ✅ Verificado

- **Build**: `npm run build` compila correctamente
- **Lint**: `npm run lint` pasa (solo warnings menores)
- Código listo para producción

## Configuración actual

- **Puerto**: 8080 (`next dev -H 127.0.0.1 -p 8080`)
- **Chat**: `https://chat-test.bodasdehoy.com` (NEXT_PUBLIC_CHAT)
- **Fallback en código**: `chat-test.bodasdehoy.com`

## Levantar el servidor

```bash
cd apps/web
npm run dev
```

O con el script (puerto 8080 por defecto):

```bash
./start-dev.sh
```

**Si falla EPERM en 8080**, prueba otro puerto:

```bash
PORT=3001 ./start-dev.sh    # → http://127.0.0.1:3001
# o
npm run dev:3001
npm run dev:5050
```

## URLs

- **Web**: http://127.0.0.1:8080
- **Chat (iframe)**: https://chat-test.bodasdehoy.com
- **Chat local** (si corres copilot): http://127.0.0.1:3210

## Verificar en el navegador

1. Abre: http://127.0.0.1:8080 (o el puerto que uses)
2. F12 → pestaña **Console**
3. Revisa errores y si el iframe del chat carga.

**Probar solo chat-test** (sin levantar la app):

```bash
open apps/web/public/probar-chat-test.html
```

## Si chat-test da 502

- El 502 viene de **Cloudflare / servidor de origen**, no del código.
- Revisar en Cloudflare: DNS, proxy, origen y logs.
- Temporalmente puedes usar producción:
  - En `.env.production`: `NEXT_PUBLIC_CHAT=https://chat.bodasdehoy.com`

## Resumen

| Qué | Estado |
|-----|--------|
| Build | ✅ OK |
| Lint | ✅ OK |
| Código | ✅ Listo |
| Puerto | 8080 |
| Chat URL | chat-test.bodasdehoy.com |
| Script | `./start-dev.sh` |

**Siguiente paso**: Levantar el servidor en tu máquina (`npm run dev` o `./start-dev.sh`) y probar en http://127.0.0.1:8080. Si EPERM, usa `PORT=3001 ./start-dev.sh`.
