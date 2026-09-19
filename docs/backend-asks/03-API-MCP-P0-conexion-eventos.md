# [API-MCP] P0 — Conexión MongoDB `eventos` INTERMITENTE (flapping)

> **Solicitado por**: COORD-AppEventos · **Fecha**: 2026-06-04
> **Bloquea**: E2E con datos reales, declarar "migración funcional", lanzar Cat C
> **Prioridad**: P0 (blocker #1 para 100% migración)

---

## Síntoma

La conexión `MONGODB_DBEVENT_URI` → DB `prueba1` → colección `eventos` en
api-mcp **flapea** (sube y baja). Verificado con probe live:

| Fecha | Estado | Evidencia |
|---|---|---|
| 2026-05-27 | 🟢 OK | `getEventosByUsuario` → 158 eventos, `getEventos` → 228, estable con token fresco |
| 2026-05-28 03:37 | 🔴 FAIL | 8/8 queries fallan `MongoNotConnectedError: "Client must be connected"` |
| Logs api-mcp | 🔴 256 errores | `MongoNotConnectedError` repetidos en logs SSH |

**Característica:** afecta TODO eventos (reads + mutations) de forma intermitente.
No es bug de auth (el token válido pasa `resolveDualAuth`). Es **gestión de conexión
Mongoose** que no reconecta cuando se cae el socket.

---

## Impacto

1. **Tests E2E inestables** — un test pasa, se ejecuta otro 30s después y falla
   con "DB no conectada". Imposible certificar funcional.
2. **UX usuario** — el usuario carga `/mis-eventos` y a veces ve eventos, a veces
   "lista vacía" (porque la query devolvió error que el front trata como `[]`).
3. **Bloqueador Cat C** — si añadimos `nuevoPago`/`editPago` ahora, heredan el
   mismo problema. Lo que es peor, en mutations el flapping puede perder writes.
4. **Cierre de migración** — no podemos declarar Sprint 3 "100% migrado" mientras
   esto fluctúa.

---

## Bugs secundarios (probablemente derivados de la conexión)

| Bug | Estado | Detalle |
|---|---|---|
| `removerInvitado` no-op | 🟡 fix dado en Slack ts `1779920471` | resolver `evento-mutations.resolver.ts:707` filtra por `.id` en vez de `._id` (fix 1 línea) |
| `agregarInvitado` sin `_id` cliente → orphan | 🟡 pendiente | si cliente no manda `_id`, el doc queda huérfano |
| `agregarInvitadosBatch` "Cannot return null" | ✅ RESUELTO 2026-06-03/04 | smoke COORD con JWT real verificado |
| `removerInvitadosBatch` | ✅ funciona | |
| `borraMesa`, `borraMenu`, `borraPago`, `borraPlanSpace` | ✅ correctos | filtran por `_id` |

---

## Hipótesis de causa raíz (a confirmar por backend)

1. **Mongoose autoReconnect off o mal configurado.** Cuando el socket Mongo se
   cae (por keepalive, red, restart Atlas), Mongoose no reintenta hasta el
   próximo `await connect()`. Las queries en curso fallan con
   `MongoNotConnectedError`.
2. **Singleton de conexión sin healthcheck.** El proceso api-mcp comparte 1
   única conexión Mongo entre todas las requests. Si esa conexión muere,
   nada la revive hasta restart del proceso.
3. **PM2 no reinicia el proceso porque NO crashea.** El proceso sigue "vivo"
   respondiendo a HTTP pero la conexión Mongo está rota. PM2 no detecta nada.

---

## Diagnóstico solicitado a backend api-mcp

### 1. Estado actual de la conexión

```bash
# SSH api-mcp y ejecutar:
pm2 logs api-mcp | grep -E "MongoNotConnected|disconnected|reconnect" | tail -100
# ¿Cuántos errores en las últimas 24h?
# ¿Cuándo fue el último?
```

### 2. Config Mongoose actual

Auditar config de conexión en api-mcp:

```javascript
// Esperado / mejores prácticas:
mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
  // CRÍTICO:
  maxPoolSize: 50,
  minPoolSize: 5,
  // Reconexión:
  retryWrites: true,
  // Auto-reconnect en >= 5.0 está implícito, pero verificar
});

mongoose.connection.on('disconnected', () => {
  // log + tentar reconexión
});
```

### 3. Healthcheck endpoint

¿api-mcp expone `/health` que verifique la conexión Mongo *de verdad* (no solo
ping al puerto)?

Ejemplo de healthcheck robusto:
```javascript
app.get('/health', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.json({ ok: true, mongo: 'connected' });
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message });
  }
});
```

Si existe pero solo retorna `200` sin tocar Mongo, no detecta el flapping.

### 4. Mitigación inmediata propuesta

Mientras se arregla la conexión a fondo:

a) Añadir middleware que verifique `mongoose.connection.readyState === 1` antes
   de ejecutar queries en resolvers. Si `!== 1`, intentar `mongoose.connect()`
   antes de continuar.

b) PM2 con `health_check_grace_period` apuntando al endpoint `/health` real.
   Si la conexión muere, PM2 reinicia el proceso (workaround, no fix).

c) Monitoreo: alerta Slack si en 5min hay > 10 `MongoNotConnectedError`.

---

## Plan de verificación tras fix

1. **Backend api-mcp aplica fix + redeploy.**
2. **Smoke desde COORD** (queries estándar):
   ```bash
   curl -X POST https://api-mcp.eventosorganizador.com/graphql \
     -H "Authorization: Bearer $JWT" \
     -H "X-Development: bodasdehoy" \
     -H "Content-Type: application/json" \
     -d '{"query":"query{ getEventosByUsuario(uid:\"upSETrmXc7ZnsIhrjDjbHd7u2up1\", pag:{page:1,limit:10}, dev:\"bodasdehoy\"){ total results{ _id nombre } } }"}'
   ```
   Ejecutar 10 veces seguidas con pausa de 30s. Esperar 10/10 OK.

3. **Test E2E batería**: correr Playwright suite con datos reales. Esperar 0
   `DATABASE_CONNECTION_ERROR` / `MongoNotConnectedError` en logs durante el run.

4. **Monitoreo 24h**: dejar Slack alerta activa. Si en 24h hay 0 incidentes,
   declarar P0 cerrado.

---

## Pregunta a api-mcp

- ¿Estado actualizado a **04-jun**? (último estado conocido es 2026-05-28)
- ¿Fix aplicado? ¿Qué hace exactamente?
- ¿Logs nuevos muestran reducción de errores `MongoNotConnectedError`?
- ¿Cuándo podemos esperar declarar "conexión estable 24h"?

Mientras esto siga abierto, **NO podemos avanzar con Cat C** (las nuevas mutations
heredarían el problema) y **NO podemos certificar la migración Sprint 1+2+3 como
funcional** (los E2E reales fallan sporadically).

DRI: api-mcp → reporte estado en hilo Slack `1779939514` (escalación original).
