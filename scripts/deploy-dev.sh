#!/usr/bin/env bash
#
# deploy-dev.sh — el único camino para desplegar en DEV.
#
# Nació de tres clases de fallo sufridas el 17-09 con varios agentes trabajando
# sobre la misma máquina y el mismo árbol:
#
#   1. DOS BUILDS A LA VEZ MATAN LA MÁQUINA. Lanzar appEventos y chat-ia en
#      paralelo agotó la memoria y el sistema mató los dos con SIGKILL. El
#      cerrojo de abajo serializa cualquier despliegue de cualquier agente.
#
#   2. SE DESPLEGARON BUILDS INVÁLIDOS. Un `next build` que muere deja la carpeta
#      a medias — sin BUILD_ID, ~9 MB en chat frente a 280 MB, 2 GB en app frente
#      a 4,3 GB. Si se cambia el puntero a eso, el sitio cae. Aquí el puntero NO
#      se toca hasta validar.
#
#   3. NADIE LIMPIA. Se acumularon 20 builds de chat y 6 de app: ~33 GB. El disco
#      se llenó dos veces y bloqueó los builds. Aquí se rotan a los 2 últimos.
#
# Y un cuarto, silencioso: `packages/shared` se consume desde `dist/`, no desde
# fuente. Si se toca ese paquete y no se recompila, la app compila SIN ERRORES y
# sin el cambio. Este script lo recompila siempre.
#
# Uso:
#   scripts/deploy-dev.sh app          # appEventos → app-dev
#   scripts/deploy-dev.sh chat         # chat-ia    → chat-dev
#   scripts/deploy-dev.sh app --dry    # todo menos cambiar puntero y reiniciar
#   scripts/deploy-dev.sh chat --keep 4
#
set -Eeuo pipefail

# ─── Configuración ────────────────────────────────────────────────────────────
# Checkout que SIRVE dev (el que PM2 tiene como cwd). No es necesariamente el
# árbol donde estás trabajando: cámbialo si mueves el despliegue.
REPO="${DEPLOY_REPO:-/Users/juancarlosparra/Projects/AppBodasdehoy.com}"
PM2_SCRIPTS="${PM2_SCRIPTS_DIR:-$HOME/.pm2-scripts}"
LOCK="/tmp/appbodasdehoy-deploy.lock"
CONSERVAR="${DEPLOY_KEEP:-2}"     # builds a conservar por app (el vivo incluido)

rojo()  { printf '\033[31m%s\033[0m\n' "$*"; }
verde() { printf '\033[32m%s\033[0m\n' "$*"; }
info()  { printf '\033[36m▸\033[0m %s\n' "$*"; }
morir() { rojo "✗ $*"; exit 1; }

# ─── Argumentos ───────────────────────────────────────────────────────────────
APP="${1:-}"; shift || true
DRY=0
while [ $# -gt 0 ]; do
  case "$1" in
    --dry|--dry-run) DRY=1 ;;
    --keep) CONSERVAR="${2:-2}"; shift ;;
    *) morir "opción desconocida: $1" ;;
  esac
  shift
done

case "$APP" in
  app)  DIR="apps/appEventos"; PREFIJO=".next-app";  VAR="APP_BUILD_DIR";  PM2="app-dev";  PUERTO=3220; SCRIPT="start-app.sh" ;;
  chat) DIR="apps/chat-ia";    PREFIJO=".next-chat"; VAR="CHAT_BUILD_DIR"; PM2="chat-dev"; PUERTO=3210; SCRIPT="start-chat.sh" ;;
  *) cat >&2 <<'AYUDA'
uso: deploy-dev.sh app|chat [--dry] [--keep N]

  app   appEventos → app-dev  (:3220)
  chat  chat-ia    → chat-dev (:3210)

  --dry     compila y valida, pero NO cambia el puntero ni reinicia
  --keep N  builds a conservar por app (por defecto 2)
AYUDA
     exit 2 ;;
esac

# ─── Cerrojo: un despliegue a la vez en TODA la máquina ───────────────────────
# `flock` NO existe en macOS, así que se usa `mkdir`, que es atómico en POSIX:
# o lo crea uno o falla, sin carrera posible. Cubre el BUILD ENTERO, no solo el
# cambio de puntero: el problema de memoria son dos `next build` a la vez.
if ! mkdir "$LOCK" 2>/dev/null; then
  DUENO=$(cat "$LOCK/owner" 2>/dev/null || echo '?')
  PID_D=$(cat "$LOCK/pid" 2>/dev/null || echo '')
  # Cerrojo huérfano: el proceso que lo tomó ya no existe (build muerto, sesión
  # cerrada). Sin esto, un SIGKILL dejaría la máquina bloqueada para siempre.
  if [ -n "$PID_D" ] && ! kill -0 "$PID_D" 2>/dev/null; then
    rojo "⚠ Cerrojo huérfano de un proceso muerto ($DUENO). Lo libero."
    rm -rf "$LOCK"; mkdir "$LOCK" 2>/dev/null || morir "no pude tomar el cerrojo"
  else
    rojo "✗ Hay otro despliegue en curso: $DUENO"
    rojo "  Espera a que termine. Dos builds simultáneos agotan la RAM de esta máquina"
    rojo "  y el sistema mata los dos (pasó el 17-09)."
    exit 1
  fi
fi
echo "$$" > "$LOCK/pid"
echo "$APP · pid $$ · $(date '+%F %T')" > "$LOCK/owner"

# Al salir: liberar el cerrojo SIEMPRE y, si el build no llegó a validar, borrar
# el directorio reservado — si no, un build fallido gasta una letra del día y
# deja 2 GB de basura que la rotación no distingue de un build bueno.
limpiar() {
  local codigo=$?
  rm -rf "$LOCK"
  if [ "$codigo" -ne 0 ] && [ -n "${NUEVO:-}" ] && [ -d "$DIR/$NUEVO" ] \
     && [ ! -f "$DIR/$NUEVO/BUILD_ID" ]; then
    rojo "  Limpiando el build incompleto $NUEVO"
    rm -rf "$DIR/$NUEVO"
  fi
  [ "$codigo" -ne 0 ] && rojo "✗ Terminó con error. El puntero NO se cambió: el sitio sigue con el build anterior."
  return $codigo
}
trap limpiar EXIT

cd "$REPO" || morir "no existe el checkout: $REPO"

# ─── Estado de partida ────────────────────────────────────────────────────────
VIVO=$(grep -oE "${VAR}=\"[^\"]+\"" "$PM2_SCRIPTS/$SCRIPT" 2>/dev/null | sed 's/.*="//;s/"//' || true)
info "Checkout : $REPO"
info "Rama     : $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?') @ $(git rev-parse --short HEAD 2>/dev/null || echo '?')"
info "Build vivo: ${VIVO:-(ninguno)}"

# Aviso, no bloqueo: trabajo sin commitear puede no ser intencionado.
if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
  rojo "⚠ Hay cambios sin commitear en el checkout de despliegue."
  rojo "  Se van a compilar tal cual. Ctrl-C si no es lo que quieres."
  sleep 4
fi

# ─── Carga de la máquina ──────────────────────────────────────────────────────
# Petición del otro agente que despliega aquí: si el equipo ya va ahogado, no
# empezar. Un build con la máquina saturada acaba en SIGKILL y hay que repetirlo.
CARGA=$(uptime | sed 's/.*averages*: *//' | awk '{print $1}' | tr -d ',')
CARGA_ENT=${CARGA%%.*}
info "Carga (1 min): $CARGA"
if [ "${CARGA_ENT:-0}" -ge 8 ]; then
  morir "la máquina va cargada (load $CARGA ≥ 8). Espera y reintenta."
fi

# ─── Nombre del build: se RESERVA dentro del cerrojo ──────────────────────────
# El 17-09 dos agentes eligieron `.next-chat-20260917h` a la vez y el segundo
# sobrescribió un build ya validado y desplegado. Calcular la letra libre fuera
# del cerrojo no basta: hay que reservarla creando el directorio aquí dentro,
# donde nadie más puede estar mirando.
HOY=$(date '+%Y%m%d')
NUEVO=""
for L in a b c d e f g h i j k l m n o p q r s t u v w x y z; do
  cand="${PREFIJO}-${HOY}${L}"
  # mkdir atómico = reserva. Si existe, la letra está tomada (por un build vivo
  # o por otro agente que la reservó hace un instante).
  if mkdir "$DIR/$cand" 2>/dev/null; then NUEVO="$cand"; break; fi
done
[ -n "$NUEVO" ] || morir "26 builds hoy ya; limpia antes de seguir"
info "Build nuevo: $NUEVO"

# ─── Disco ────────────────────────────────────────────────────────────────────
# app necesita ~5 GB; chat ~1 GB. Con menos, el build muere por ENOSPC o SIGKILL
# y cuesta media hora descubrir por qué.
LIBRE_GB=$(df -g "$REPO" 2>/dev/null | awk 'NR==2{print $4}')
MINIMO=$([ "$APP" = app ] && echo 12 || echo 4)
info "Disco libre: ${LIBRE_GB} GB (mínimo para $APP: ${MINIMO} GB)"
if [ "${LIBRE_GB:-0}" -lt "$MINIMO" ]; then
  morir "poco disco. Ejecuta con --keep 1, o borra builds antiguos a mano."
fi

# ─── AppleDouble: rompen Playwright y ESLint ───────────────────────────────────
BASURA=$(find . -name '._*' -not -path '*/node_modules/*' 2>/dev/null | wc -l | tr -d ' ')
if [ "$BASURA" -gt 0 ]; then
  info "Limpiando $BASURA ficheros AppleDouble (rompen el glob de tests y el linter)"
  find . -name '._*' -not -path '*/node_modules/*' -delete 2>/dev/null || true
fi

# ─── packages/shared SIEMPRE: se consume desde dist ───────────────────────────
info "Recompilando packages/shared (las apps leen su dist, no su fuente)"
( cd packages/shared && npx tsc ) 2>&1 | grep -vE "Cannot find name 'process'" || true
[ -f packages/shared/dist/index.js ] || morir "packages/shared/dist no se generó"

# ─── Build ────────────────────────────────────────────────────────────────────
info "Compilando $APP → $NUEVO (esto tarda; el sitio sigue sirviendo el build anterior)"
if [ "$APP" = app ]; then
  # appEventos no tiene flags propios en su script de build.
  ( cd "$DIR" && env "$VAR=$NUEVO" NODE_OPTIONS="--max-old-space-size=6144" \
      NEXT_TELEMETRY_DISABLED=1 npx next build ) || morir "el build falló"
else
  # chat-ia SÍ los tiene (heap 8 GB, --no-lint, postbuild). Usar su script.
  ( cd "$DIR" && env "$VAR=$NUEVO" npx pnpm build ) || morir "el build falló"
fi

# ─── Validación: aquí es donde se evita tirar el sitio ────────────────────────
D="$DIR/$NUEVO"
info "Validando el build antes de tocar el puntero"
[ -f "$D/BUILD_ID" ]            || morir "sin BUILD_ID → build incompleto. NO se despliega."
[ -f "$D/routes-manifest.json" ] || morir "sin routes-manifest.json → build incompleto."
BID=$(cat "$D/BUILD_ID")
TAM_MB=$(du -sm "$D" 2>/dev/null | cut -f1)
MIN_MB=$([ "$APP" = app ] && echo 2000 || echo 150)
[ "${TAM_MB:-0}" -ge "$MIN_MB" ] || morir "solo ${TAM_MB} MB (mínimo ${MIN_MB}) → build a medias."
verde "✓ Build válido · BUILD_ID=$BID · ${TAM_MB} MB"

if [ "$DRY" = 1 ]; then
  verde "✓ --dry: build listo en $D. Puntero sin tocar."
  exit 0
fi

# ─── Cambio de puntero + reinicio ─────────────────────────────────────────────
cp "$PM2_SCRIPTS/$SCRIPT" "$PM2_SCRIPTS/$SCRIPT.bak-$(date '+%Y%m%d-%H%M%S')"
sed -i '' "s|^export ${VAR}=.*|export ${VAR}=\"${NUEVO}\"|" "$PM2_SCRIPTS/$SCRIPT"
info "Puntero: ${VIVO:-?} → $NUEVO"

npx pm2 restart "$PM2" --update-env >/dev/null 2>&1 || true
info "Reiniciado $PM2; esperando a que responda"

# next start tarda en aceptar la primera petición: sondear, no asumir.
OK=0
for _ in $(seq 1 20); do
  if [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "http://127.0.0.1:$PUERTO/" 2>/dev/null)" = "200" ]; then
    OK=1; break
  fi
done
[ "$OK" = 1 ] || morir "no responde en :$PUERTO. Revierte: $VAR=\"$VIVO\" y pm2 restart $PM2"

# Lo que importa no es que responda, sino que sirva EL build nuevo.
SERVIDO=$(curl -s --max-time 30 "http://127.0.0.1:$PUERTO/" 2>/dev/null \
          | grep -oE '"buildId":"[^"]+"' | head -1 | sed 's/.*://;s/"//g')
if [ "$SERVIDO" = "$BID" ]; then
  verde "✓ Sirviendo el build nuevo · buildId=$SERVIDO"
else
  rojo "⚠ Responde 200 pero sirve buildId=$SERVIDO (esperado $BID)."
  rojo "  Puede ser caché del proceso: revisa con pm2 logs $PM2."
fi

# ─── Rotación: conservar los N últimos ────────────────────────────────────────
# macOS trae bash 3.2, que NO tiene `mapfile`/`readarray`: se hace con `ls` y un
# bucle normal. (El shebang es `env bash`, así que aquí manda el bash del sistema.)
TOTAL=$(ls -1d "$DIR/${PREFIJO}-"* 2>/dev/null | wc -l | tr -d ' ')
if [ "${TOTAL:-0}" -gt "$CONSERVAR" ]; then
  A_BORRAR=$(( TOTAL - CONSERVAR ))
  info "Rotando: $TOTAL builds, conservo $CONSERVAR (vivo + rollback)"
  # Los más antiguos primero; nunca el vivo ni el que acabamos de desplegar.
  ls -1d "$DIR/${PREFIJO}-"* 2>/dev/null | sort | head -n "$A_BORRAR" | while read -r d; do
    b=$(basename "$d")
    if [ "$b" = "$NUEVO" ] || [ "$b" = "$VIVO" ]; then
      echo "    conservo $b (vivo o recién desplegado)"
      continue
    fi
    rm -rf "$d" && echo "    borrado $b"
  done
fi

verde "✓ $APP desplegado. Rollback: $VAR=\"$VIVO\" en $PM2_SCRIPTS/$SCRIPT + pm2 restart $PM2"
