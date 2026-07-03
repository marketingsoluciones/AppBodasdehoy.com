# Debug Session: app-dev-slow-load
- **Status**: [CLOSED — 2026-07-04]
- **Issue**: app-dev / chat-dev van lentos o no cargan
- **Resolución**: PM2 restart loop por /tmp/start-*.sh limpiado. Fix aplicado 30-jun por
  otro agente en scripts/build-*-en-portatil.sh (path $HOME/.pm2-scripts/).
- **Verificación empírica 2026-07-04 (COORD):**
    - curl app-dev  → 200, TTFB 80ms
    - curl chat-dev → 200, TTFB 827ms
    - PM2 app-dev  → 17h uptime, 0 restarts
    - PM2 chat-dev → 30h uptime, 0 restarts
    - BUILD_IDs mtime 2-jul (fresh, no stale)
    - E2E smoke-r5-abc-fixes.spec.ts DebugFooter test: 2/2 PASS (commit a8c1685
      app-dev / b321cae chat-dev renderizan en <5s con dominios reales)
- **Debug Server**: http://127.0.0.1:7777/event (obsoleto)
- **Log File**: .dbg/trae-debug-log-app-dev-slow-load.ndjson (nunca generado)

## Reproduction Steps
1. Abrir https://app-dev.bodasdehoy.com y/o https://chat-dev.bodasdehoy.com
2. Observar si carga, cuánto tarda, y si aparece error de red/DNS/timeout.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | Problema DNS / resolución (tiempo alto en lookup o no resuelve) | High | Low | Pending |
| B | Problema de conexión/SSL/Cloudflare (timeout al connect/TLS o 52x/53x) | High | Low | Pending |
| C | Cloudflare Tunnel/dev routing mal configurado (subdominios dev apuntan a origen caído) | Med | Med | Pending |
| D | Redirección/auth loop (la página carga pero se queda “girando” por redirects) | Med | Med | Pending |
| E | Bloqueo por requests a servicios IA/APIs (CORS/timeout) que detienen la UI | Low | Med | Pending |

## Log Evidence
- 2026-06-04 local curl:
  - `https://app-dev.bodasdehoy.com/` → timeout 20s (HTTP=000) con connect+TLS OK (no TTFB).
  - `https://chat-dev.bodasdehoy.com/` → HTTP 200 pero TTFB ~7.3s (lento).
  - `https://chat-dev.bodasdehoy.com/bodasdehoy/chat` → HTTP 200 pero TTFB ~7.0s (lento).
  - `https://app-test.bodasdehoy.com/` → HTTP 200 (rápido).
  - `https://chat-test.bodasdehoy.com/` → HTTP 404 (rápido).
  - `https://chat-test.bodasdehoy.com/bodasdehoy/chat` → HTTP 404 (rápido).
  - `https://api-mcp.eventosorganizador.com/health` → HTTP 200 (Cloudflare).
  - `https://api-mcp.eventosorganizador.com/graphql` (POST Ping) → HTTP 200 (rápido).
  - `https://api-ia.bodasdehoy.com/health` (GET) → HTTP 200 (rápido). HEAD devuelve 405 (normal si solo permiten GET).
  - `https://api3-ia.eventosorganizador.com/health` → DNS no resuelve (NXDOMAIN/resolve error).

- 2026-07-03 re-check (COORD, sandbox local):
  - `https://app-dev.bodasdehoy.com/` → HTTP 200 · TTFB 80ms · total 81ms.
    BUILD_ID `1yZBVcu6h6n33M-jjM6y9` (mtime del `.next` en Mac portátil sin verificar).
  - `https://chat-dev.bodasdehoy.com/` → HTTP 200 · TTFB 827ms · total 879ms.
    BUILD_ID `VorYTh1zJHec2xzR47vN3` (mtime del `.next` sin verificar).
  - `https://api3-ia.eventosorganizador.com/` → sigue NXDOMAIN (correcto, OBSOLETO desde 18-may).

⚠️ **CAVEAT importante (user 03-jul):** dev **no se despliega hace semanas**.
Los TTFB rápidos actuales pueden ser un artefacto de que `.next` está cacheado
sin regeneración, NO evidencia de que el bug esté arreglado. Antes de descartar
nada hay que verificar en Mac portátil:
  - `stat -f "%Sm" apps/appEventos/.next/BUILD_ID` (mtime de la última build)
  - `pm2 list` (uptime app-dev/chat-dev + restart count `↺`)

**NO usar app-test / chat-test / -test como baseline** — es infraestructura
Vercel de otro equipo, no comparable con nuestro `next start` en Mac.
Ver [memory/feedback_solo_dev_no_test.md] y [memory/feedback_no_vercel_solo_dev_reverse_proxy.md].
`-test` solo se usa cuando `-dev` está estable y pasa QA, no como referencia.

## Hipótesis actualizadas (03-jul) — sin verificación completa

| ID | Estado | Notas |
|----|--------|-------|
| A DNS | ❌ Descartado | nslookup app-dev/chat-dev resuelve. Sin evidencia de fallo DNS. |
| B CF/SSL/timeout | 🟡 Sin evidencia hoy | TTFB < 1s en ambos, connect+TLS estables. Pero build puede ser stale. |
| C CF Tunnel/dev routing mal | 🟡 Sin evidencia hoy | Tunnels responden 200. NO verificado que sirven build reciente. |
| D Redirect/auth loop | ❌ No aplica | HTTP 200 directo, no redirect. |
| E Bloqueo requests IA/APIs | 🟡 Fuera de scope UI raíz | api-ia + api-mcp health 200, pero UI puede seguir bloqueada por otras razones. |

**Correlación temporal con fix PM2 (30-jun):** Otro agente arregló el bucle de
restart en `scripts/build-*-en-portatil.sh` moviendo start scripts de `/tmp/`
a `$HOME/.pm2-scripts/`. Ese fix se llevó los síntomas de "app-dev caído por
restart loop", pero **no cierra esta sesión** porque:
  1. dev no se ha redesplegado con build limpia desde ese fix.
  2. Los TTFB actuales pueden reflejar cache CF + build viejo, no `next start`
     realmente estable con el fix aplicado.

## Verification Conclusion — CERRADO 2026-07-04

**Todas las verificaciones planteadas en 03-jul cumplidas 04-jul:**
1. ✅ mtime `.next/BUILD_ID` reciente (2-jul, <48h)
2. ✅ Curl `-dev` TTFB < 1s (80ms app, 827ms chat)
3. ✅ `pm2 list ↺` count = 0 en ambos
4. ✅ E2E smoke sobre dev real (T1 R5) valida DebugFooter renderiza <5s
5. ✅ QA R5 backend (Mongo timeout) también arreglado por api-mcp (d2912cb)

**Causa raíz confirmada:** PM2 restart loop por scripts start en `/tmp/`.
**Fix confirmado:** commits en scripts/build-*-en-portatil.sh (path
persistente $HOME/.pm2-scripts/, aplicado 30-jun por otro agente).

Cierre limpio. Si vuelve a fallar → sesión nueva, no reabrir esta.
