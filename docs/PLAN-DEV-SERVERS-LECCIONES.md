# Plan dev servers (app-dev, chat-dev) — lecciones tras incidente Trae 2026-06-04

> Para cualquier agente que herede el setup local de esta máquina (Mac mini, 16GB RAM, macOS 25.3.0).
> Escrito tras un incidente en el que Trae metió `app-dev` y `chat-dev` en bucle de `next build` y dejó
> los tunneles de Cloudflare devolviendo timeout.

---

## TL;DR — Las 5 reglas que no se rompen

1. **El reverse proxy es cloudflared, está siempre arriba, NO tocarlo.** Único proceso, único config, lo usan varios proyectos de esta máquina.
2. **`dev.sh` en el repo es para PM2. NUNCA poner `next build` dentro de `dev.sh`** (mata la Mac por OOM y mete en bucle).
3. **Modo dev = `next dev`. Modo "exposición pública por tunnel" = `next start` con build previo manual.** No se mezclan.
4. **NO lanzar `next build` ni `next dev` manualmente desde sandbox/terminal en paralelo a PM2.** Compiten por RAM y se rompen entre sí.
5. **La Mac tiene 16 GB. chat-ia compilando consume 5-6 GB pico.** Antes de cualquier operación pesada, mirar `vm.swapusage`. Si swap > 6 GB usado, NO arrancar más cosas.

---

## Arquitectura

```
                Internet
                   │
                   ▼
        Cloudflare edge (DNS público bodasdehoy.com)
                   │
                   ▼
   cloudflared tunnel "lobe-chat-harbor" (en esta Mac, PID singleton)
                   │
                   ├── ssh-dev.bodasdehoy.com ────► ssh localhost:22
                   ├── app-dev.bodasdehoy.com ───► http://127.0.0.1:3220 (appEventos)
                   ├── chat-dev.bodasdehoy.com ──► http://192.168.1.48:3210 (chat-ia)
                   ├── memories-dev.bodasdehoy.com ─► http://127.0.0.1:3240
                   ├── editor-dev.bodasdehoy.com ──► http://127.0.0.1:3230
                   ├── python-api.eventosorganizador.com ─► http://127.0.0.1:8000 (scraper)
                   ├── suite-dev.eventosorganizador.com ──► http://127.0.0.1:3300 (CrmPro-1, otro proyecto)
                   └── terminal-dev.bodasdehoy.com ──► http://127.0.0.1:3250
                   │
                   ▼
            Procesos `next dev` arrancados por PM2
```

**Config tunnel:** `/Users/juancarlosparra/.cloudflared/config.yml` (NO modificar sin autorización del user — varios proyectos dependen de él).

**Proceso tunnel:** `/opt/homebrew/bin/cloudflared tunnel --config ~/.cloudflared/config.yml run lobe-chat-harbor` — siempre debe haber **EXACTAMENTE 1**. Verificar con `ps aux | grep cloudflared | grep -v grep`.

---

## El modelo mental clave: dev vs prod-local

Hay **dos formas distintas** de servir una app Next.js localmente y **NO son intercambiables**:

| Aspecto | `next dev` (modo desarrollo) | `next build + next start` (modo prod local) |
|---|---|---|
| Pensado para | Programar (cambias código y recargas) | Servir en un dominio público |
| Compilación | Lazy, on-demand al pedir cada ruta | Eager, todo de golpe antes de arrancar |
| Primera petición chat-ia `/chat` | ~10 min (40k módulos) | <1s (ya compilado) |
| RAM pico | ~6 GB | ~10 GB durante build, ~2 GB tras `next start` |
| Hot reload | Sí | No (hay que rebuildar tras cambios) |
| Sirve por CF tunnel | ❌ Cloudflare edge timeout 30-100s mata primera petición | ✅ Inmediato |
| Comando | `pnpm dev` | `pnpm build && pnpm next start -p PUERTO` |

**Decisión histórica de este repo:** se eligió **`next start`** para `dev.sh` para que `chat-dev.bodasdehoy.com` responda al instante via Cloudflare. El precio: hay que rebuildar manualmente tras cambios.

---

## El error que cometió Trae (no repetir)

Trae vio que `dev.sh` arrancaba `next build` si no había `BUILD_ID` y **lo dejó dentro del flujo PM2**. Esto creó el bucle:

```
dev.sh → next build (production, 10-15 min, ~10 GB RAM)
   │
   ├── PM2 max_memory_restart hit (6-10 GB) → SIGKILL
   ├── OOM kernel kill → SIGKILL
   └── Build no llega a generar BUILD_ID
        │
        └── PM2 reinicia → ejecuta dev.sh de nuevo → next build → ...
```

Además, Trae lanzaba `pnpm exec next build --no-lint` **manualmente desde su terminal** mientras PM2 lo hacía también. 3 procesos `next build` simultáneos compitiendo por RAM.

**Síntomas que indican que estás cayendo en esta trampa:**
- `pm2 list` muestra `↺` (restarts) > 0 con `chat-dev` o `app-dev`.
- Logs PM2 repiten `[dev.sh] Compilando chat-ia... (primera vez tarda 10-15 min)` cada minuto.
- `lsof -iTCP:3210 -sTCP:LISTEN` vacío durante > 5 min tras `pm2 start`.
- `ps aux | grep "next build"` muestra > 1 proceso.
- Swap usado > 8 GB.

---

## Procedimiento correcto

### Paso 0 — Antes de tocar nada, diagnóstico

```bash
# 1. ¿Tunnel cloudflared arriba? (debe haber EXACTAMENTE 1)
ps aux | grep "cloudflared tunnel" | grep -v grep | wc -l   # debe ser 1

# 2. ¿RAM/swap saludable?
sysctl vm.swapusage   # si used > 7 GB, cerrar apps antes de compilar

# 3. ¿Hay procesos node huérfanos? (residuos de runs anteriores)
ps aux | grep -E "next build|next dev|next-server" | grep -v grep

# 4. ¿PM2 sano?
pm2 list
```

### Paso 1 — Si chat-ia necesita estar disponible por `chat-dev.bodasdehoy.com`

**Una vez al día** (o tras cambiar código en chat-ia):

```bash
# Mata cualquier next dev/build huérfano antes
pm2 stop chat-dev 2>/dev/null
pkill -f "apps/chat-ia.*next" 2>/dev/null
sleep 2

# Build PRODUCTION manual (NO desde PM2, NO en bucle)
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/chat-ia
export PATH="/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:$PATH"
export NODE_OPTIONS=--max-old-space-size=8192
export NEXT_TELEMETRY_DISABLED=1
export ENABLE_OIDC=0
export APP_URL=http://localhost:8000
pnpm exec next build --no-lint   # 10-15 min, ~8 GB RAM pico

# Verificar que generó BUILD_ID
test -f .next/BUILD_ID && echo "OK build" || echo "FAIL — investigar logs"
```

Luego `dev.sh` debería ser simplemente `next start`:

```bash
# apps/chat-ia/dev.sh
#!/bin/bash
export PATH="/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:$PATH"
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/chat-ia
exec pnpm next start -p 3210 -H 0.0.0.0
```

Y arrancar con PM2:

```bash
pm2 start ecosystem.config.js --only chat-dev
sleep 5
lsof -nP -iTCP:3210 -sTCP:LISTEN   # debe escuchar
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3210/   # 200
```

**Validar tunnel:**
```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://chat-dev.bodasdehoy.com/   # 200
```

### Paso 2 — Si vas a programar chat-ia (hot reload necesario)

**Dual-mode oficial (2026-06-04):** PM2 sigue corriendo `next start` para el tunnel público. Tú arrancas `next dev` en otro puerto solo cuando programas.

```bash
# Terminal 1: PM2 sigue como está (chat-dev next start puerto 3210 → tunnel CF)
# No tocas nada.

# Terminal 2: tu HMR personal
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/chat-ia
pnpm dev:hmr   # next dev -H 127.0.0.1 -p 3215, hot reload activo
```

Para appEventos:
```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/appEventos
pnpm dev:hmr   # puerto 3225
```

Acceso:
- Programas en `http://localhost:3215` (chat-ia HMR) / `http://localhost:3225` (appEventos HMR)
- Tunnel sigue sirviendo `chat-dev.bodasdehoy.com` / `app-dev.bodasdehoy.com` (next start cacheado)

Trade-off:
- Primera petición a `/chat` en `localhost:3215` tarda ~10 min mientras webpack compila 40k módulos (UNA VEZ por sesión).
- Después: HMR < 2s por cambio.
- **No expongas el puerto 3215/3225 al tunnel** — Cloudflare edge daría timeout 524 en primera compilación.

Cuando termines de programar, **Ctrl+C** en el terminal HMR. PM2 sigue arriba con `next start`.

### Paso 3 — appEventos (más ligero)

appEventos pesa mucho menos (~500 MB RAM). Para uso normal:

```bash
# Modo dev (programar):
cd apps/appEventos && pnpm dev:local

# Modo prod local (servir vía tunnel):
cd apps/appEventos
pnpm build   # 3-5 min
exec pnpm next start -p 3220 -H 0.0.0.0
```

Para vía PM2:
```bash
pm2 start ecosystem.config.js --only app-dev
```

---

## Cuándo NO usar PM2

PM2 es genial para tener servidores arriba en background. Pero **rompe los flujos de larga duración** si `max_memory_restart` está mal calibrado.

**Usa PM2 SOLO con servidores ya buildeados** (`next start`). NO con `next build`. NO con `next dev` si vas a compilar rutas pesadas.

Si necesitas un build largo y no quieres que PM2 lo mate, hazlo **fuera de PM2** desde un terminal directo (como en el Paso 1).

---

## Ajustes recomendados de PM2

[ecosystem.config.js](../ecosystem.config.js) actualmente:

```js
{
  name: 'app-dev',
  script: './apps/appEventos/dev.sh',
  max_memory_restart: '1G',  // appEventos es ligero
},
{
  name: 'chat-dev',
  script: './apps/chat-ia/dev.sh',
  max_memory_restart: '6G',  // chat-ia next start ronda 2 GB, dev sube a 5-6 GB
  restart_delay: 60000,
  max_restarts: 10,
}
```

Si vas a usar `next start` en chat-dev (modo prod local), puedes bajar `max_memory_restart` a `4G`. Si vas a usar `next dev`, dejarlo en `6G` o subirlo a `8G` si tienes RAM libre.

---

## Verificación post-cambios (siempre ejecutar antes de cerrar)

```bash
# 1. PM2 estable (sin restarts en últimos 5 min)
pm2 list | grep -E "app-dev|chat-dev"   # uptime > 5m, ↺ = 0

# 2. Puertos escuchando
lsof -nP -iTCP:3220 -sTCP:LISTEN   # app-dev
lsof -nP -iTCP:3210 -sTCP:LISTEN   # chat-dev

# 3. Respuesta local
curl -sS -o /dev/null -w "3220: %{http_code} | %{time_total}s\n" --max-time 10 http://127.0.0.1:3220/
curl -sS -o /dev/null -w "3210: %{http_code} | %{time_total}s\n" --max-time 30 http://127.0.0.1:3210/

# 4. Respuesta vía tunnel (lo que ve el mundo)
curl -sS -o /dev/null -w "app:  %{http_code} | %{time_total}s\n" --max-time 30 https://app-dev.bodasdehoy.com/
curl -sS -o /dev/null -w "chat: %{http_code} | %{time_total}s\n" --max-time 30 https://chat-dev.bodasdehoy.com/

# 5. RAM/swap razonable
sysctl vm.swapusage   # used debe estar < 8 GB para que la Mac no sufra
```

Si alguno falla → investigar **antes** de "declarar listo".

---

## Comandos de emergencia (si algo se rompe)

```bash
# Matar todo lo de Next.js (limpieza nuclear)
pm2 stop all
pkill -9 -f "apps/(chat-ia|appEventos).*next" 2>/dev/null
pkill -9 -f "pnpm exec next" 2>/dev/null
sleep 3

# Verificar limpieza
ps aux | grep -E "next build|next dev|next-server" | grep -v grep   # debe estar vacío

# Borrar caches Next corruptos (solo si build se interrumpió mal)
rm -rf apps/chat-ia/.next apps/appEventos/.next

# Reiniciar PM2 limpio
pm2 delete app-dev chat-dev 2>/dev/null
pm2 start ecosystem.config.js --only app-dev
pm2 start ecosystem.config.js --only chat-dev
```

---

## Anti-patrones (cosas que se ven bien y son trampas)

| Anti-patrón | Por qué es trampa | Qué hacer en su lugar |
|---|---|---|
| `dev.sh` con `next build` dentro | Si build muere mid-run, PM2 reinicia y vuelve a empezar — bucle infinito | Build manual fuera de PM2, `dev.sh` solo `next start` |
| Lanzar `pnpm exec next build` desde sandbox/terminal mientras PM2 también compila | 2 builds simultáneos = OOM seguro | Parar PM2 primero, build, luego arrancar PM2 |
| Subir `max_memory_restart` para "evitar OOM" | Si el problema es RAM real (Mac saturada), subir el límite solo retrasa el crash | Cerrar otras apps; bajar `NODE_OPTIONS=--max-old-space-size` si compila igual |
| Tocar `~/.cloudflared/config.yml` para "arreglar" un timeout | El tunnel funciona — el origen tarda. Tocar el tunnel rompe los otros proyectos (CrmPro-1, scraper, ssh) | Arreglar el origen (precompilar) en vez del tunnel |
| Reactivar Turbopack en chat-ia | Memoria del proyecto: revertido 2026-06-02 por chunk-load failures (shiki/mermaid/dayjs) | Quedarse en webpack hasta resolver el chunk-loading |
| Borrar `.next` "por si acaso" en mitad de un dev | Pierdes 10 min recompilando | Solo borrar si build se interrumpió con kill -9 (estado inconsistente) |

---

## Apéndice: estructura de archivos relevantes

```
ecosystem.config.js                              ← PM2 apps definitions
apps/appEventos/dev.sh                            ← Script PM2 app-dev
apps/appEventos/package.json (scripts.dev, dev:local)
apps/chat-ia/dev.sh                               ← Script PM2 chat-dev
apps/chat-ia/package.json (scripts.dev, dev:local, dev:turbo)
apps/chat-ia/next.config.ts                       ← serverExternalPackages, transpilePackages, withPWA
~/.cloudflared/config.yml                         ← Tunnel ingress rules (NO TOCAR)
~/.cloudflared/<tunnel-id>.json                   ← Credenciales tunnel
docs/CLOUDFLARE-CONFIGURADO-EN-ESTA-MAQUINA.md   ← Histórico tunnel
docs/ESTADO-TUNELES-ESTE-EQUIPO.md
```

---

## Apéndice: incidente del 2026-06-04 (qué pasó)

1. Trae detectó que `dev.sh` chat-ia usaba `next build` + `next start` (decisión histórica para esquivar timeout edge en primera compilación lazy de Turbopack).
2. Trae intentó "mejorar" tocando:
   - `apps/chat-ia/next.config.ts` — quitó `serverExternalPackages: isProd ? ['pglite', 'sharp'] : undefined` y `transpilePackages: []`, añadió flag `ENABLE_PWA=0`
   - `ecosystem.config.js` — subió `max_memory_restart` chat-dev de 6G a 10G, app-dev de 1G a 8G
   - `apps/{chat-ia,appEventos}/dev.sh` — añadió `TMPDIR`, `NEXT_TELEMETRY_DISABLED`, `ENABLE_PWA=0`
3. Resultado: `dev.sh` seguía haciendo `next build` cada vez que faltaba `BUILD_ID`. Con 3 procesos `next build` simultáneos (2 lanzados manualmente desde sandbox Trae + 1 de PM2), la Mac (16 GB) se ahogó. PM2 mató procesos mid-build → reinició → bucle.
4. Síntoma visible: `app-dev.bodasdehoy.com` y `chat-dev.bodasdehoy.com` timeout. Trae intentaba más builds. Loop.
5. **Causa raíz:** `next build` dentro de un flujo PM2 con `max_memory_restart` < pico de RAM real.
6. **Fix aplicado:** revertir `dev.sh` ambos a `next dev` (modo desarrollo), revertir `next.config.ts` y `ecosystem.config.js` a valores razonables, borrar `.next` corruptos, arrancar PM2 limpio.

Estado final post-fix: `app-dev` funcionando vía tunnel (HTTP 200, 1.3s). `chat-dev` arranca pero primera petición a `/chat` tarda ~10 min mientras webpack compila (limitación real, no bug).
