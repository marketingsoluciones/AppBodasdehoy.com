# API2 Login Quick Guide

Esta guía resume el flujo de autenticación directa contra API2 utilizando la mutación `generateCRMToken`. Todo el código se ha integrado en el proyecto para que puedas validar el extremo a extremo sin depender de credenciales externas.

## Credenciales Demo

Estas credenciales están hardcodeadas en el backend de API2 y funcionan siempre:

- **Email:** `admin@eventosorganizador.com`
- **Password:** `Admin123!`
- **Development:** `bodasdehoy`

> Los valores se definen en `src/services/api2/auth.ts` como `DEMO_CREDENTIALS`. Puedes sobrescribirlos mediante variables de entorno (`NEXT_PUBLIC_API2_GRAPHQL_URL`, `NEXT_PUBLIC_API2_DEVELOPMENT`) si fuese necesario.

## Flujo

1. **Pantalla `dev-login`**  
   - Selecciona el modo (`Middleware` o `API2 directo`).  
   - Usa el botón **“Usar credenciales demo”** para autocompletar.  
   - El modo “API2 directo” invoca `loginAPI2` y guarda el token en `localStorage.jwt_token`.

2. **Servicios**  
   - `src/services/api2/auth.ts` → Exporta `loginAPI2` y `loginWithDemoCredentials`.  
   - `src/services/api2/client.ts` → Cliente ligero que añade el header `Authorization: Bearer <token>` y expone el helper `ensureDemoToken`.

3. **Consumo**  
   - Cualquier llamada al backend FastAPI reutilizará el token gracias a `buildAuthHeaders`.  
   - Si necesitas consumir API2 desde el frontend, importa `api2Client` y usa `api2Client.query(...)`.

## Validación Rápida

```bash
curl -X POST https://api2.eventosorganizador.com/graphql \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{"query": "mutation { generateCRMToken(input: { email: \"admin@eventosorganizador.com\", password: \"Admin123!\" }) { success token errors { message } } }"}'
```

La respuesta debe incluir `success: true` y un JWT válido. Una vez logueado, verifica el token en consola:

```js
localStorage.getItem('jwt_token');
```

## Nuevos flujos soportados

Además del login clásico con email/password (`generateCRMToken`), ahora puedes autenticarte mediante:

- **Login con Google** usando Google Identity Services.
- **Enlaces de invitado** (tokens temporales) para acceso directo desde URLs compartidas.

### Login con Google

1. Configura `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (y opcionalmente `GOOGLE_OAUTH_CLIENT_ID(S)`) con el Client ID de tu proyecto Google.
2. Entra a `http://localhost:8000/dev-login` y usa el botón **Iniciar sesión con Google**. El componente carga GIS dinámicamente y guarda el `id_token` en `localStorage.jwt_token`.
3. El endpoint `/api/auth/login-with-google` valida el token contra Google, reutiliza `/api/auth/identify-user` para traer eventos reales y devuelve el payload habitual (`token`, `user_data`, `eventos`, etc.).

**Verificación rápida**

- Tras el login revisa en consola:

  ```js
  localStorage.getItem('jwt_token'); // token actual
  localStorage.getItem('dev-user-config'); // metadata del usuario autenticado
  ```

- Cualquier llamada que use `buildAuthHeaders()` enviará automáticamente el Bearer token almacenado.

### Enlaces de invitado (guest tokens)

Pensado para usuarios que llegan con una URL del tipo `/chat?token=...&email=...`.

**Variables de entorno relevantes**

- `INVITE_TOKEN_SECRET` y `GUEST_SESSION_SECRET`: claves para firmar tokens de invitado y la sesión temporal (por defecto se apoya en `JWT_SECRET`).
- `INVITE_TOKEN_ADMIN_SECRET`: si se define, el endpoint `/api/auth/invite-token` exige este secreto.
- `INVITE_TOKEN_DEFAULT_MINUTES` / `GUEST_SESSION_TTL_MINUTES`: TTLs (por defecto 30 min y 120 min).

**Emisión del token**

```bash
curl -X POST http://localhost:8030/api/auth/invite-token \
  -H "Content-Type: application/json" \
  -d '{
        "developer": "bodasdehoy",
        "email": "demo@ejemplo.com",
        "scopes": ["chat:read"],
        "expires_in_minutes": 60,
        "admin_secret": "super-secreto"
      }'
```

**Consumo del token**

```bash
curl -X POST http://localhost:8030/api/auth/consume-invite \
  -H "Content-Type: application/json" \
  -d '{
        "token": "<TOKEN_INVITADO>",
        "developer": "bodasdehoy"
      }'
```

Si el token es válido, recibirás un JWT temporal (`token`) junto con la ficha del usuario y sus `eventos`. El frontend lo guarda en `localStorage` (`jwt_token`, `invite-token`, snapshot de eventos) y `EventosAutoAuth` configura el store automáticamente.

**Prueba end-to-end**

1. Genera un token de invitado (paso anterior).
2. Abre `http://localhost:8000/chat?token=<TOKEN>&email=demo@ejemplo.com`.
3. Confirma que:
   ```js
   localStorage.getItem('jwt_token');
   localStorage.getItem('dev-user-config');
   localStorage.getItem('invite-events');
   ```
   contengan valores recientes y que el panel liste las conversaciones reales.

## Troubleshooting

- **Credenciales inválidas** → Asegúrate de usar las demo (respeta mayúsculas/minúsculas).  
- **Token caducado** → Repite el login; el helper elimina el token si API2 devuelve errores relacionados.  
- **Fallo de red / CORS** → Verifica HTTPS y que los headers `Content-Type` y `X-Development` se envían correctamente.

Para más detalles consulta el documento extenso proporcionado por el equipo de backend o amplía la lógica en `src/services/api2`.


