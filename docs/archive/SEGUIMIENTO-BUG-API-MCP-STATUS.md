# Seguimiento — Bug api-mcp `status` mutation single-secret

> Documento de seguimiento para COORD. Copia/pega secciones según necesites.
> Creado 2026-05-24.

## ✅ RESUELTO 2026-05-25 — migración en FRONT

BACKEND decidió NO dar compat al legacy `status` (contrato limpio). Migrado en front:
- Commit `bb5bb30d` en dev — appEventos valida sesión SSO vía `getCurrentUser` (Bearer sessionBodas), ya no usa `status`.
- `api.ApiBodas` honra param `token` como Bearer override.
- Fix colateral: `getUser` query `onLine{status}` → `onLine` (schema drift, rompía moreInfo en todos los logins).
- Verificado: /eventos con avatar logueado, sidebar, SIN guest gate, SIN login redirect.

### 🆕 Bug pendiente DISTINTO (causa real de /eventos vacío)
Query `queryenEvento` contra apiapp/eventos (3er backend, /api/proxy) → `400 "Syntax Error: Unexpected \"`. Pre-existente. El postData sale limpio del cliente; el error se genera en apiapp. Reportado Slack ts `1779694354.322289`. Esperando confirmación de dueño para investigar.

---

## Estado del reporte

| # | Acción | Slack ts | Estado |
|---|---|---|---|
| 1 | Reporte inicial | `1779526417.816909` | enviado, sin respuesta |
| 2 | Recordatorio técnico | `1779549889.918339` | enviado, sin respuesta |
| 3 | Pruebas reproducibles | `1779603147.742659` | enviado, sin respuesta |

Canal: `C0AV8EV5495` (hilo único AppBodas, thread_ts `1778170638.897419`).

---

## Resumen del bug (1 línea)

`status` mutation/query de api-mcp valida sessionCookie SOLO con `JWT_SECRET` (OLD), pero el backend mintea tokens con `JWT_SECRET_NEW` → rechaza todo token legítimo post-rotación 28-abr-2026 con "Sesión inválida o expirada".

## Archivos a corregir (verificado SSH read-only prod)

`/var/www/api-production/src/graphql/resolvers/auth.ts`
- **L613** — `Mutation.status` (DiarioCivitas legacy)
- **L658** — `Query.status`

Ambos:
```js
const decoded = jwt.verify(sessionCookie, process.env.JWT_SECRET || 'bodasdehoy-secret-key'); // SOLO OLD
```

## Fix (ya implementado en context.ts:165-185)

```js
const verifyDual = (token) => {
  try {
    if (process.env.JWT_SECRET_NEW) return jwt.verify(token, process.env.JWT_SECRET_NEW);
    throw new Error('No JWT_SECRET_NEW');
  } catch {
    return jwt.verify(token, process.env.JWT_SECRET || 'bodasdehoy-secret-key');
  }
};
// usar verifyDual(sessionCookie) en ambos resolvers
```
Mismo patrón ya aplicado en `auth.ts:214`, `:321`, `:377`. Solo los 2 `status` quedaron sin migrar. ~10 LOC, riesgo bajo.

## Evidencia reproducible (curl, sin browser)

```bash
# 1. Extraer un sessionBodas JWT (de login real o del dual state)
SESSION_JWT="<JWT firmado con NEW>"

# 2. Reproducir el rechazo
curl -X POST https://api-mcp.eventosorganizador.com/graphql \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"mutation(\$s:String!){status(sessionCookie:\$s){customToken}}\",\"variables\":{\"s\":\"$SESSION_JWT\"}}"

# Respuesta:
# {"errors":[{"message":"Sesión inválida o expirada","path":["status"],
#   "extensions":{"trace_id":"..."}}],"data":{"status":null}}
```

Traces capturados (4 corridas): `944e40d6` · `5f6a4f2f` · `68f492ba`.

JWT de ejemplo usado (válido 154h, payload correcto, firma NEW verificada):
```json
{"uid":"2eBU8Hhnx1PrVPzhx9QwAD2CXtc2","email":"jcc@bodasdehoy.com","role":"user",
 "development":"bodasdehoy","firebaseAuth":true,"userProvisioned":true,
 "iat":1779553698,"exp":1780158498}
```

## Impacto

- **appEventos**: AuthContext verificator entra en bucle de restablecimiento → `/eventos` no carga → cascada.
- **E2E**: 59/103 specs backend-dep + lote 12 completo (realtime + permisos multi-user) bloqueados.
- **Producción (a confirmar)**: cualquier cliente que invoque `status` (path SSO DiarioCivitas legacy) post-28-abr quedará rechazado. Verificar si chat/app.bodasdehoy.com lo usan en flujos críticos.

## Qué desbloquea el fix

Lote 12 E2E ejecutable:
- `chat-mensajes-2usuarios` (44t) · `comunicacion-entre-usuarios` (19t) · `concurrent-editing` (18t)
- `share-event-permissions` (14t) · `crud-permission` (19t)
- `socket-notificacion-comentario-2usuarios` (3t) · `smoke-tarea-notificacion` (3t)

Run: `E2E_ENV=local PLAYWRIGHT_BROWSER=webkit npx playwright test --config=playwright.config.ts e2e-app/<spec>`

## Mensaje recordatorio listo para reenviar

> Hola equipo api-mcp — recordatorio del bug `status` mutation single-secret (auth.ts:613 + 658).
> Pruebas reproducibles enviadas en el hilo. Es ~10 LOC (dual-accept, igual que context.ts:165).
> Bloquea lote 12 E2E completo. ¿Confirmáis fecha de aplicación? Gracias.
