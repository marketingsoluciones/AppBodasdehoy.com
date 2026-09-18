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
# `$HOME` con `set -u` revienta con "unbound variable" si el script se lanza desde un
# entorno limpio (cron, un PM2 sin env heredado, `env -i`). Comprobado. Mejor decir qué
# falta que soltar el mensaje de bash.
PM2_SCRIPTS="${PM2_SCRIPTS_DIR:-${HOME:?falta HOME en el entorno: pasa PM2_SCRIPTS_DIR o lanza con un shell de login}/.pm2-scripts}"
LOCK="/tmp/appbodasdehoy-deploy.lock"
# `npx pm2` puede resolver un pm2 DISTINTO del que tiene el demonio con los
# procesos, y en el peor caso levanta un segundo demonio: dos mundos paralelos.
# Aquí el del PATH es 6.0.14 y npx da 7.0.4, así que el riesgo es real.
PM2BIN="$(command -v pm2 || echo 'npx pm2')"
CONSERVAR="${DEPLOY_KEEP:-2}"     # builds a conservar por app (el vivo incluido)

rojo()  { printf '\033[31m%s\033[0m\n' "$*"; }
verde() { printf '\033[32m%s\033[0m\n' "$*"; }
info()  { printf '\033[36m▸\033[0m %s\n' "$*"; }
morir() { rojo "✗ $*"; exit 1; }

# rotar_builds <dir> <prefijo> <conservar> <nuevo> <vivo>
#
# Borra los builds MÁS ANTIGUOS hasta dejar <conservar>, sin tocar nunca <nuevo>
# ni <vivo>.
#
# El orden es por FECHA DE MODIFICACIÓN (`ls -1dt` + `tail`), no alfabético, y eso
# no es un detalle: en ASCII el guion (0x2D) va ANTES que las letras, así que
# `.next-chat-20260917-bandeja1` ordena por delante de `.next-chat-20260917a`.
# Con la convención `<fecha>-<zona><n>` el build MÁS NUEVO se convertía en el
# primer candidato a borrar. Lo impide `scripts/deploy-dev.rotacion_test.sh`.
# Marca que ESTE build superó el pipeline completo: build + postbuild + puntero +
# reinicio + verificación. Se escribe al final, nunca antes.
#
# Hace falta porque el 17-09 un build FALLIDO resultó indistinguible de uno bueno por
# cualquier inspección del artefacto: `next build` terminó entero y solo murió el
# postbuild, así que la carpeta tenía BUILD_ID, los cuatro manifiestos y los mismos
# 281 MB. Todas las validaciones de este script la habrían aprobado. Lo único que la
# cazó fue el código de salida — un dato que existe DURANTE el despliegue y se pierde
# después. Al rotar, esa carpeta quedaba como el "rollback" designado: el sitio al que
# volver si algo va mal sería un build cuyo postbuild nunca corrió.
#
# De ahí que el veredicto se ESCRIBA en el momento en que se conoce, en vez de
# intentar deducirlo luego de los restos. Un build sin marca no es necesariamente
# malo (puede venir de un despliegue a mano), pero tampoco está verificado, y como
# rollback se prefiere siempre uno que sí lo esté.
MARCA_OK=".deploy-ok"
marcar_build_ok() {
  local dir="$1" nombre="$2"
  { echo "desplegado: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "commit: $(git -C "$(dirname "$0")/.." rev-parse --short HEAD 2>/dev/null || echo desconocido)"
    echo "pipeline: build + postbuild + puntero + reinicio + verificacion"
  } > "$dir/$nombre/$MARCA_OK" 2>/dev/null || true
}

# ¿Hay cambios sin commitear que IMPORTEN? Recibe la salida de `git status --porcelain`
# por la entrada estándar e imprime solo las rutas relevantes.
#
# Existe porque el aviso saltaba en el 100% de los despliegues. Next reescribe
# `apps/appEventos/next-env.d.ts` en cada build para apuntar al distDir del momento, así
# que el checkout de despliegue está permanentemente sucio por un fichero que el propio
# build acaba de generar. Un aviso que salta siempre enseña a ignorarlo — y este es el
# que debe avisar de que alguien va a compilar cambios que no sabía que tenía.
#
# La lista es corta y explícita a propósito: si mañana otro fichero generado ensucia el
# árbol, el aviso volverá a saltar y habrá que decidirlo, que es lo correcto. Una regla
# amplia (p. ej. ignorar todo *.d.ts) taparía cambios de verdad.
GENERADOS_POR_BUILD="apps/appEventos/next-env.d.ts"
cambios_relevantes() {
  local ruta
  while read -r _estado ruta _resto; do
    [ -n "$ruta" ] || continue
    case " $GENERADOS_POR_BUILD " in
      *" $ruta "*) continue ;;
    esac
    echo "$ruta"
  done
}

# Mide el estado de la máquina. Separada de la decisión, y en una función para que el
# test pueda comprobar que NO revienta — porque su primera versión reventaba.
#
# `pgrep` devuelve 1 cuando no encuentra nada, y con `set -Eeuo pipefail` (línea 30)
# eso mata el script. O sea que moría justo en el caso NORMAL: ningún otro build
# corriendo. Es la tercera vez hoy que este script se rompe por el estado de salida de
# una tubería, y las tres veces con la misma forma: un comando cuyo "no hay nada" se
# codifica como error. El `|| true` no es adorno.
#
# Imprime: "<builds_ajenos> <memoria_libre_pct> <load_1min> <swap_usado>"
#
# El patrón de búsqueda es un argumento con valor por defecto para que el test pueda
# pasar uno que NO case. Sin eso, el test dependía de que no hubiera ningún build
# corriendo: cuando el otro agente arrancó el suyo, `pgrep` encontró algo, dejó de
# devolver 1 y el caso que vigilaba el `|| true` pasó a ser vacuo sin avisar. Cuarta
# vez hoy que un test verde no prueba nada, y la primera en que la causa era el estado
# de la máquina y no el test.
medir_recursos() {
  local patron="${1:-next build}"
  local ajenos libre carga swap
  # Por RUTA ABSOLUTA con respaldo al PATH. `sysctl` vive en /usr/sbin, que no está en
  # todos los entornos: en la ejecución del otro agente salió "swap usado ?" justo por
  # eso. `memory_pressure` está en /usr/bin y sí resolvía, pero se trata igual para no
  # depender de qué directorio falta en el PATH de quien lanza.
  local SYSCTL=/usr/sbin/sysctl MEMP=/usr/bin/memory_pressure
  [ -x "$SYSCTL" ] || SYSCTL=$(command -v sysctl || echo /nonexistent)
  [ -x "$MEMP" ] || MEMP=$(command -v memory_pressure || echo /nonexistent)

  ajenos=$(pgrep -f "$patron" 2>/dev/null | wc -l | tr -d ' ') || ajenos=0
  libre=$("$MEMP" 2>/dev/null | awk '/free percentage/{print $5+0}') || libre=""
  carga=$(uptime | sed 's/.*averages*: *//' | awk '{print $1}' | tr -d ',') || carga=0
  swap=$("$SYSCTL" -n vm.swapusage 2>/dev/null | awk '{print $6}') || swap=""
  # "no-medido" en vez de "?": un interrogante en una línea de diagnóstico se lee dentro
  # de un mes como "no hay swap" en lugar de "no lo pude medir". Aviso del otro agente.
  echo "${ajenos:-0} ${libre:-100} ${carga:-0} ${swap:-no-medido}"
}

# Decide si se puede compilar, a partir de datos ya medidos. Está separada de la
# medición a propósito: así `deploy-dev.recursos_test.sh` puede probar la REGLA sin
# depender del estado real de la máquina.
#   recursos_veredicto <builds_ajenos> <memoria_libre_pct> <load_entero>
# Imprime: "parar: <motivo>" | "avisar: <motivo>" | "seguir"
recursos_veredicto() {
  local ajenos="${1:-0}" libre="${2:-100}" carga="${3:-0}"
  if [ "$ajenos" -gt 0 ]; then
    echo "parar: ya hay $ajenos proceso(s) next build corriendo"
    return 0
  fi
  if [ "$libre" -lt 20 ]; then
    echo "parar: solo queda ${libre}% de memoria libre"
    return 0
  fi
  # El load NO para: cuenta procesos ejecutables, no presión de memoria, y con un IDE
  # y un navegador abiertos esta máquina no baja de 8 ni estando libre de builds.
  if [ "$carga" -ge 8 ]; then
    echo "avisar: load $carga, el build tardará más"
    return 0
  fi
  echo "seguir"
}

rotar_builds() {
  local dir="$1" prefijo="$2" conservar="$3" nuevo="$4" vivo="$5"
  local total a_borrar b marca="${MARCA_OK:-.deploy-ok}"
  total=$(ls -1d "$dir/${prefijo}-"* 2>/dev/null | wc -l | tr -d ' ')
  [ "${total:-0}" -gt "$conservar" ] || return 0
  a_borrar=$(( total - conservar ))
  info "Rotando: $total builds, conservo $conservar (vivo + rollback)"

  # Orden de sacrificio: primero los SIN marca de verificación (más antiguo primero),
  # después los verificados (más antiguo primero). Así el rollback que sobrevive es uno
  # que de verdad se probó, y no la carpeta del intento que falló.
  # macOS trae bash 3.2, sin `mapfile`: se hace con `ls` y un bucle.
  # Los cuerpos van con `if`, no con `&&`/`||`: un `[ -f ... ] && echo` que falla en la
  # ÚLTIMA vuelta deja el while en estado 1, `pipefail` lo propaga a la sustitución y
  # `set -Eeuo pipefail` (línea 30) mata el despliegue entero — después de haber movido
  # el puntero y reiniciado. Pasaba justo cuando NINGÚN build tenía marca, que es el
  # caso normal la primera vez que se estrena esto. Un `if` sin `else` devuelve 0.
  # Es la misma clase de fallo que la revisión ya me señaló una vez en este script;
  # lo volví a introducir y esta vez lo cazó el test, no una ejecución en producción.
  local sin_marca con_marca
  sin_marca=$(ls -1dt "$dir/${prefijo}-"* 2>/dev/null | while read -r d; do
    if [ ! -f "$d/$marca" ]; then echo "$d"; fi
  done | tail -r) || true
  con_marca=$(ls -1dt "$dir/${prefijo}-"* 2>/dev/null | while read -r d; do
    if [ -f "$d/$marca" ]; then echo "$d"; fi
  done | tail -r) || true

  printf '%s\n%s\n' "$sin_marca" "$con_marca" | grep -v '^$' | while read -r d; do
    [ "$a_borrar" -gt 0 ] || break
    b=$(basename "$d")
    if [ "$b" = "$nuevo" ] || [ "$b" = "$vivo" ]; then
      echo "    conservo $b (vivo o recién desplegado)"
      continue
    fi
    # La marca se lee ANTES de borrar. Parece obvio y no lo era: la versión anterior
    # hacía `[ -f "$d/$marca" ]` DESPUÉS del `rm -rf`, así que el fichero nunca existía
    # y TODO salía como "(sin verificar)". Un build verificado se registraba como si no
    # lo estuviera, y leyendo el log parecía que la rotación sacrificaba correctamente
    # lo no verificado cuando podía estar borrando builds buenos. Visto en el log de un
    # despliegue real: «borrado .next-app-20260917a (sin verificar)» y ese build SÍ
    # tenía marca. Un registro que miente sobre lo que hizo tapa justo la regresión que
    # existe para detectar.
    local estaba_marcado="no"
    [ -f "$d/$marca" ] && estaba_marcado="sí"
    if rm -rf "$d"; then
      if [ "$estaba_marcado" = "sí" ]; then
        echo "    borrado $b (estaba verificado)"
      else
        echo "    borrado $b (sin verificar)"
      fi
      a_borrar=$(( a_borrar - 1 ))
    fi
  done || true

  # A los que SOBREVIVEN y ya no sirven se les quita `cache/`. Un build de app son
  # ~4.2 GB de los que 4.1 son cache regenerable; el artefacto que hace falta para
  # SERVIR son 156 MB. Guardar el cache de un rollback es pagar 4 GB por nada, y ya
  # nos costó un build muerto por disco lleno.
  # El VIVO y el RECIÉN DESPLEGADO se quedan con el suyo: en el que está sirviendo,
  # `cache/` también guarda el cache de ISR y de imágenes en ejecución.
  ls -1d "$dir/${prefijo}-"* 2>/dev/null | while read -r d; do
    b=$(basename "$d")
    if [ "$b" != "$nuevo" ] && [ "$b" != "$vivo" ] && [ -d "$d/cache" ]; then
      liberado=$(du -sm "$d/cache" 2>/dev/null | cut -f1)
      rm -rf "$d/cache" && echo "    cache de $b liberado (${liberado:-?} MB)"
    fi
  done || true
  return 0
}

# ─── Importable desde los tests ───────────────────────────────────────────────
# Si este fichero se hace `source` desde otro script, se cargan las funciones y se
# para aquí: nada de argumentos, cerrojo ni despliegue. Es lo que permite probar
# `rotar_builds` de verdad en vez de confiar en un comentario.
if [ "${BASH_SOURCE[0]}" != "$0" ]; then
  return 0 2>/dev/null || true
fi

# ─── Todo el trabajo va dentro de main() ──────────────────────────────────────
# NO es cosmético. Bash lee un script por POSICIÓN DE BYTE, no por líneas: si el
# fichero cambia de tamaño mientras se ejecuta, al volver de un comando largo retoma
# en el offset viejo, que en el fichero nuevo cae a mitad de una línea. Pasó el 17-09:
# yo copié una versión nueva de este script al checkout de despliegue —con `cp`, que
# escribe sobre el MISMO inodo— mientras el otro agente estaba dentro de un `next build`
# de doce minutos. Al terminar el build, su bash retomó en el byte equivocado y murió
# con «line 421: 7: command not found», apuntando a un comentario. Perdió el despliegue
# y tuvo que hacer los cuatro pasos finales a mano.
#
# Con el cuerpo dentro de una función, bash parsea la definición COMPLETA antes de
# ejecutarla, así que una edición a mitad de camino ya no puede partirla. Medido:
#   sin envoltorio      → «line 5: hacia: command not found», el trabajo NO termina
#   con main()          → el trabajo termina, pero bash sigue leyendo tras la llamada
#                          y saca un error espurio con salida ≠ 0
#   con main() + exit   → termina bien, salida 0, sin ruido
# De ahí el `exit $?` de la última línea: sin él la inmunidad está a medias.
#
# Aun así, la forma correcta de actualizar este fichero es atómica (`mv`, que crea un
# inodo nuevo), no `cp`. Esto es la red por si alguien se olvida — y me olvidé yo, que
# lo había hecho bien dos horas antes.
main() {


# ─── Argumentos ───────────────────────────────────────────────────────────────
APP="${1:-}"; shift || true
DRY=0
while [ $# -gt 0 ]; do
  case "$1" in
    --dry|--dry-run) DRY=1 ;;
    --keep) CONSERVAR="${2:-2}"; shift ;;
    --zona) ZONA="${2:-}"; shift ;;
    *) morir "opción desconocida: $1" ;;
  esac
  shift
done

case "$APP" in
  app)  DIR="apps/appEventos"; PREFIJO=".next-app";  VAR="APP_BUILD_DIR";  PM2="app-dev";  PUERTO=3220; SCRIPT="start-app.sh" ;;
  chat) DIR="apps/chat-ia";    PREFIJO=".next-chat"; VAR="CHAT_BUILD_DIR"; PM2="chat-dev"; PUERTO=3210; SCRIPT="start-chat.sh" ;;
  *) cat >&2 <<'AYUDA'
uso: deploy-dev.sh app|chat [--zona NOMBRE] [--dry] [--keep N]

  app   appEventos → app-dev  (:3220)
  chat  chat-ia    → chat-dev (:3210)

  --dry     compila y valida, pero NO cambia el puntero ni reinicia
  --keep N  builds a conservar por app (por defecto 2)
  --zona X  etiqueta del build: .next-<app>-<fecha>-<zona>N en vez de letras.
            Dice QUIÉN lo hizo, que vale más que una letra corta cuando hay
            varios agentes desplegando. Ej: --zona bandeja, --zona invitaciones
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
  if [ "$codigo" -ne 0 ]; then
    # Decir la verdad importa más de noche que tranquilizar: el mensaje anterior
    # afirmaba SIEMPRE que el puntero no se había tocado, también cuando el fallo
    # era posterior. Eso manda a buscar el problema al lado equivocado.
    if [ "${PUNTERO_TOCADO:-0}" = 1 ]; then
      rojo "✗ Falló DESPUÉS de cambiar el puntero a ${NUEVO:-?}."
      rojo "  Revertir: pon ${VAR}=\"${VIVO:-?}\" en $PM2_SCRIPTS/$SCRIPT y ejecuta:"
      rojo "    $PM2BIN restart $PM2"
    else
      rojo "✗ Falló antes de tocar el puntero: el sitio sigue con el build anterior."
    fi
  fi
  return $codigo
}
trap limpiar EXIT

cd "$REPO" || morir "no existe el checkout: $REPO"

# ─── Estado de partida ────────────────────────────────────────────────────────
VIVO=$(grep -oE "${VAR}=\"[^\"]+\"" "$PM2_SCRIPTS/$SCRIPT" 2>/dev/null | sed 's/.*="//;s/"//' || true)
info "Checkout : $REPO"
info "Rama     : $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?') @ $(git rev-parse --short HEAD 2>/dev/null || echo '?')"
info "Build vivo: ${VIVO:-(ninguno)}"

# Aviso, no bloqueo: trabajo sin commitear puede no ser intencionado. Se excluyen los
# ficheros que el propio build regenera (ver cambios_relevantes), porque si no el aviso
# salta siempre y deja de decir nada.
SUCIOS=$(git status --porcelain 2>/dev/null | grep -v '^??' | cambios_relevantes) || SUCIOS=""
if [ -n "$SUCIOS" ]; then
  rojo "⚠ Hay cambios sin commitear en el checkout de despliegue:"
  echo "$SUCIOS" | sed 's/^/     /' >&2
  rojo "  Se van a compilar tal cual. Ctrl-C si no es lo que quieres."
  sleep 4
fi

# ─── Recursos de la máquina ───────────────────────────────────────────────────
# ESTO MIRABA EL DATO EQUIVOCADO. La versión anterior moría si el load de 1 minuto
# llegaba a 8. El fallo que se quería evitar era el del 17-09: dos `next build` a la
# vez agotando la RAM y el sistema matando los dos. Pero el load de macOS cuenta
# procesos EJECUTABLES, no presión de memoria.
#
# Medido en esta máquina con el guardián bloqueando un despliegue: load 8.49, CERO
# builds corriendo, 79% de memoria libre, y la carga la hacían un renderer de Chrome
# y cuatro helpers de Trae al 100% de CPU cada uno. O sea el estado NORMAL de un
# equipo con IDE y navegador abiertos. Un umbral que nunca se cumple acaba
# esquivándose de rutina, y un guardián que se esquiva ya no protege.
#
# Ahora se comprueba lo que de verdad importa, en orden de cuán directo es el dato:
#   1. ¿hay OTRO `next build` corriendo? — detección directa del fallo real. El
#      cerrojo de este script cubre dos ejecuciones SUYAS, pero no un build lanzado
#      a mano o por otra herramienta, que es exactamente lo que pasó el 17-09.
#   2. ¿queda poca memoria? — la magnitud que limita un heap de 8 GB.
#   3. el load pasa a ser AVISO, no muerte: informa de que va a tardar más.
#
# Y se imprime el swap sin usarlo como puerta: aquí marca 8,7 GB de 10,2 usados
# mientras `memory_pressure` dice 79% libre. Los dos datos se contradicen (macOS
# acumula swap con la memoria comprimida y no lo libera), así que cambiar un umbral
# equivocado por otro habría sido repetir el error con otra magnitud. Lo ve un humano
# y decide.
read -r AJENOS LIBRE CARGA SWAP <<EOF_REC
$(medir_recursos)
EOF_REC
info "Recursos: ${LIBRE}% memoria libre · load $CARGA · swap usado ${SWAP} · otros builds: $AJENOS"

VEREDICTO=$(recursos_veredicto "${AJENOS:-0}" "${LIBRE:-100}" "${CARGA%%.*}")
case "$VEREDICTO" in
  parar:*)  morir "${VEREDICTO#parar: }. Dos builds a la vez agotan la RAM y el sistema mata los dos." ;;
  avisar:*) rojo "⚠ ${VEREDICTO#avisar: }. Sigo." ;;
esac

# ─── Nombre del build: se RESERVA dentro del cerrojo ──────────────────────────
# El 17-09 dos agentes eligieron `.next-chat-20260917h` a la vez y el segundo
# sobrescribió un build ya validado y desplegado. Calcular la letra libre fuera
# del cerrojo no basta: hay que reservarla creando el directorio aquí dentro,
# donde nadie más puede estar mirando.
HOY=$(date '+%Y%m%d')
NUEVO=""
if [ -n "${ZONA:-}" ]; then
  # Nombre con zona: `.next-chat-20260917-bandeja1`. Requiere que la rotación
  # ordene por FECHA y no alfabéticamente — en ASCII el guion va antes que las
  # letras, así que un nombre con zona ordenaría por delante de los de letra y
  # sería el primer candidato a borrar. Eso ya está arreglado más abajo; si
  # alguien revierte esa parte, esta convención vuelve a ser peligrosa.
  ZONA_LIMPIA=$(printf '%s' "$ZONA" | tr -cd 'a-zA-Z0-9-')
  [ -n "$ZONA_LIMPIA" ] || morir "--zona solo admite letras, dígitos y guiones"
  for N in 1 2 3 4 5 6 7 8 9; do
    cand="${PREFIJO}-${HOY}-${ZONA_LIMPIA}${N}"
    if mkdir "$DIR/$cand" 2>/dev/null; then NUEVO="$cand"; break; fi
  done
  [ -n "$NUEVO" ] || morir "9 builds hoy de la zona '$ZONA_LIMPIA'; limpia antes de seguir"
else
  for L in a b c d e f g h i j k l m n o p q r s t u v w x y z; do
    cand="${PREFIJO}-${HOY}${L}"
    # mkdir atómico = reserva. Si existe, la letra está tomada (por un build vivo
    # o por otro agente que la reservó hace un instante).
    if mkdir "$DIR/$cand" 2>/dev/null; then NUEVO="$cand"; break; fi
  done
  [ -n "$NUEVO" ] || morir "26 builds hoy ya; limpia antes de seguir"
fi
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
# Solo donde molestan: e2e-app (rompen el glob de Playwright) y la app que se
# compila. Un `find .` desde la raíz en un volumen externo tenía a fskitd al 40%
# de CPU y contribuía al load que frena los builds de los demás.
for zona in e2e-app "$DIR/src" "$DIR/components" "$DIR/pages" "$DIR/utils"; do
  [ -d "$zona" ] || continue
  find "$zona" -name '._*' -not -path '*/node_modules/*' -delete 2>/dev/null || true
done

# ─── Paquetes que se consumen desde dist ──────────────────────────────────────
# NO SOLO `shared`. Esto enumeraba un paquete y los otros CUATRO podían quedarse
# rancios en silencio. Medido el 18-09: los cinco de packages/ tienen
# `main: ./dist/index.js` y ninguno está en transpilePackages, o sea que las apps
# leen su dist compilado. El dist de copilot-shared en el checkout de despliegue era
# de JULIO — un cambio en sus burbujas se habría desplegado sin aparecer, y el build
# habría salido en verde.
#
# Es la misma trampa de la lista curada, ahora a nivel de paquete: se descubren
# leyendo el package.json en vez de nombrarlos, así que uno nuevo entra solo.
info "Recompilando los paquetes que las apps leen desde dist"
for PKG_JSON in packages/*/package.json; do
  PKG_DIR=$(dirname "$PKG_JSON")
  PKG_NOMBRE=$(basename "$PKG_DIR")
  # ¿Su punto de entrada apunta a dist? Si no, no hay nada que recompilar.
  case "$(grep -o '"main"[^,]*' "$PKG_JSON" | head -1)" in
    *dist*) ;;
    *) continue ;;
  esac
  rm -rf "$PKG_DIR/dist"
  SALIDA_TSC=$( cd "$PKG_DIR" && npx tsc 2>&1 ) && CODIGO_TSC=0 || CODIGO_TSC=$?
  # `src/crm-ui/client.ts` usa `process` sin @types/node y falla desde antes de que
  # este script existiera. tsc EMITE igual. Se muere solo si hay errores DISTINTOS.
  OTROS_TSC=$(echo "$SALIDA_TSC" | grep -E "error TS" \
              | grep -vE "src/crm-ui/.*Cannot find name 'process'" || true)
  if [ -n "$OTROS_TSC" ]; then
    echo "$OTROS_TSC" >&2
    morir "$PKG_NOMBRE no compila"
  fi
  [ -f "$PKG_DIR/dist/index.js" ] || morir "$PKG_NOMBRE: dist no se generó"
  echo "    $PKG_NOMBRE ✓$([ "$CODIGO_TSC" = 0 ] || echo " (tsc $CODIGO_TSC, solo errores conocidos)")"
done

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
# El tamaño se mide SIN `cache/`, y esto no es cosmético: medido el 17-09, un build de
# app son 4348 MB en total de los que 4192 son cache y solo 156 el artefacto. El umbral
# de 2000 MB estaba calibrado sobre la cifra con cache, así que:
#   · un build BUENO en una máquina con cache frío (156 MB) se habría rechazado como
#     "a medias" — el fallo más tonto posible, y solo aparece la primera vez en una
#     máquina nueva, que es cuando menos ganas hay de depurar el script;
#   · y un build ROTO con un cache gordo pasaba el mínimo sin problema, o sea que la
#     comprobación estaba midiendo casi solo el cache.
# `du` de BSD no tiene --exclude, así que se resta.
TAM_TOTAL=$(du -sm "$D" 2>/dev/null | cut -f1)
TAM_CACHE=$(du -sm "$D/cache" 2>/dev/null | cut -f1 || echo 0)
TAM_MB=$(( ${TAM_TOTAL:-0} - ${TAM_CACHE:-0} ))
MIN_MB=$([ "$APP" = app ] && echo 100 || echo 150)
[ "${TAM_MB:-0}" -ge "$MIN_MB" ] || morir "artefacto de solo ${TAM_MB} MB (mínimo ${MIN_MB}) → build a medias."
verde "✓ Build válido · BUILD_ID=$BID · ${TAM_MB} MB de artefacto (+${TAM_CACHE:-0} MB de cache)"

if [ "$DRY" = 1 ]; then
  verde "✓ --dry: build listo en $D. Puntero sin tocar."
  exit 0
fi

# ─── Cambio de puntero + reinicio ─────────────────────────────────────────────
cp "$PM2_SCRIPTS/$SCRIPT" "$PM2_SCRIPTS/$SCRIPT.bak-$(date '+%Y%m%d-%H%M%S')"
sed -i '' "s|^export ${VAR}=.*|export ${VAR}=\"${NUEVO}\"|" "$PM2_SCRIPTS/$SCRIPT"
PUNTERO_TOCADO=1
# `sed -i ''` NO falla si el patrón no casa: si alguien cambió la forma de esa
# línea, se desplegaría apuntando al build VIEJO con todo en verde hasta el final.
grep -q "^export ${VAR}=\"${NUEVO}\"$" "$PM2_SCRIPTS/$SCRIPT" \
  || morir "no pude escribir el puntero en $SCRIPT (¿cambió el formato de la línea?)"
info "Puntero: ${VIVO:-?} → $NUEVO"

$PM2BIN restart "$PM2" --update-env >/dev/null 2>&1 || true
info "Reiniciado $PM2; esperando a que responda"

# next start tarda en aceptar la primera petición: sondear, no asumir.
OK=0
# Mientras `next start` arranca el puerto está CERRADO y curl vuelve en
# milisegundos con "connection refused". Sin `sleep`, los 20 intentos se gastaban
# en menos de un segundo y el script declaraba fallido un despliegue que iba bien.
for _ in $(seq 1 20); do
  if [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "http://127.0.0.1:$PUERTO/" 2>/dev/null)" = "200" ]; then
    OK=1; break
  fi
  sleep 3
done
[ "$OK" = 1 ] || morir "no responde en :$PUERTO. Revierte: $VAR=\"$VIVO\" y $PM2BIN restart $PM2"

# Que responda 200 no prueba nada: el proceso viejo sigue sirviendo desde memoria
# aunque el puntero ya apunte a otro sitio (pasó el 17-09 con un build a medias).
# Hay que comprobar qué build ha cargado DE VERDAD, y eso se hace de dos formas
# según el router:
#
#   · El entorno del proceso — la fiable para las dos apps. OJO: `pm2 jlist`
#     MIENTE aquí, porque la variable la exporta el script de arranque por dentro
#     y pm2 solo guarda el entorno del `pm2 start` original; sigue mostrando el
#     directorio del primer arranque para siempre. La fuente buena es `ps eww`.
#     Sobre QUÉ pid: medido el 17-09 en la máquina, el proceso que casa con
#     `next start -p PUERTO` es `node .../pnpm next start`, su entorno SÍ trae la
#     variable, y su padre es el God Daemon de pm2 (pid 1 de pm2), que NO la trae.
#     O sea: preguntar al padre devuelve vacío. De ahí que el bucle de abajo
#     recorra los candidatos y se quede con el que TIENE el dato, en vez de
#     asumir una jerarquía concreta — que además cambia según cómo reinicie pm2.
#
#   · El buildId del HTML — solo sirve en appEventos (Pages Router, emite
#     __NEXT_DATA__). chat-ia es App Router y NO lo emite: comprobarlo ahí daba un
#     aviso falso en cada despliegue.
# `grep next start -p PUERTO` puede casar con más de un proceso. Quedarse con el
# PID más bajo, o con el padre, confía en una jerarquía que pm2 no garantiza. El
# único criterio que aguanta es "el que TIENE el dato".
PID_APP=""; CARGADO=""
for _p in $(ps -eo pid,command 2>/dev/null | grep "[n]ext start -p $PUERTO" | awk '{print $1}'); do
  _v=$(ps eww "$_p" 2>/dev/null | tr ' ' '\n' | grep -E "^${VAR}=" | head -1 | cut -d= -f2)
  if [ -n "$_v" ]; then PID_APP="$_p"; CARGADO="$_v"; break; fi
done

if [ "$CARGADO" = "$NUEVO" ]; then
  verde "✓ El proceso (pid $PID_APP) ha cargado $NUEVO"
elif [ -n "$CARGADO" ]; then
  rojo "⚠ El proceso sirve $CARGADO, no $NUEVO. ¿Reinició de verdad?"
  rojo "  Reintenta: $PM2BIN restart $PM2 --update-env"
else
  rojo "⚠ No pude leer ${VAR} del proceso. Comprueba a mano: ps eww \$(lsof -ti:$PUERTO)"
fi

# Comprobación extra, solo donde el router la permite.
if [ "$APP" = app ]; then
  SERVIDO=$(curl -s --max-time 30 "http://127.0.0.1:$PUERTO/" 2>/dev/null \
            | grep -oE '"buildId":"[^"]+"' | head -1 | sed 's/.*://;s/"//g')
  if [ "$SERVIDO" = "$BID" ]; then
    verde "✓ buildId servido coincide con el compilado ($BID)"
  elif [ -n "$SERVIDO" ]; then
    rojo "⚠ buildId servido $SERVIDO ≠ compilado $BID"
  fi
fi

# ─── Rotación ─────────────────────────────────────────────────────────────────
# Si tocas el orden de borrado, ejecuta scripts/deploy-dev.rotacion_test.sh.
# El comentario avisa; el test impide. Comprobado que la versión alfabética lo
# hace fallar, así que no es decorativo.
marcar_build_ok "$DIR" "$NUEVO"
rotar_builds "$DIR" "$PREFIJO" "$CONSERVAR" "$NUEVO" "$VIVO"

# El rollback se ofrece sobre el build que estaba vivo, pero si ESE no está verificado
# conviene decirlo: volver a él puede ser volver a un build que nunca se comprobó.
if [ -n "$VIVO" ] && [ -d "$DIR/$VIVO" ] && [ ! -f "$DIR/$VIVO/$MARCA_OK" ]; then
  rojo "⚠ Ojo: $VIVO no tiene marca de verificación (se desplegó a mano o falló su postbuild)."
  ROLLBACK_ALT=$(ls -1dt "$DIR/$PREFIJO-"*/"$MARCA_OK" 2>/dev/null | head -1 | xargs -I{} dirname {} | xargs -I{} basename {})
  [ -n "$ROLLBACK_ALT" ] && [ "$ROLLBACK_ALT" != "$NUEVO" ] \
    && rojo "  Verificado más reciente: $ROLLBACK_ALT"
fi
verde "✓ $APP desplegado. Rollback: $VAR=\"$VIVO\" en $PM2_SCRIPTS/$SCRIPT + $PM2BIN restart $PM2"

}

main "$@"
exit $?
