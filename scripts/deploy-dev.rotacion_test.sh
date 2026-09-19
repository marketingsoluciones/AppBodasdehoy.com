#!/usr/bin/env bash
#
# deploy-dev.rotacion_test.sh — el guardián de `rotar_builds`.
#
# Existe porque un comentario avisa y un test impide. La rotación tuvo un fallo
# latente que solo se activaba al combinarse con otra cosa: ordenaba
# ALFABÉTICAMENTE, y en ASCII el guion (0x2D) va antes que las letras, así que
# `.next-chat-20260917-bandeja1` ordenaba por delante de `.next-chat-20260917a`.
# El día que se añadió la convención `<fecha>-<zona><n>`, el build MÁS NUEVO pasó
# a ser el primer candidato a borrar — el rollback bueno.
#
# Este test crea builds con fechas conocidas (`touch -t`) y nombres MEZCLADOS de
# las dos convenciones, ejecuta solo la función y comprueba que muere el más
# antiguo. Si alguien vuelve a `sort` alfabético, cae y dice por qué.
#
# No despliega nada: importa deploy-dev.sh, que se para solo al ser "sourced".
#
# Uso:  scripts/deploy-dev.rotacion_test.sh
#
set -uo pipefail

AQUI="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=/dev/null
. "$AQUI/deploy-dev.sh"

type rotar_builds >/dev/null 2>&1 || {
  echo "✗ deploy-dev.sh no expone rotar_builds: ¿se quitó el guard de BASH_SOURCE?" >&2
  exit 1
}

PASADOS=0; FALLIDOS=0
ok()    { printf '  \033[32m✓\033[0m %s\n' "$1"; PASADOS=$((PASADOS+1)); }
falla() { printf '  \033[31m✗ %s\033[0m\n     %s\n' "$1" "$2" >&2; FALLIDOS=$((FALLIDOS+1)); }

# Construye un escenario con fechas explícitas. El orden de ANTIGÜEDAD es el de
# los argumentos: el primero es el más viejo.
#   montar <dir> <prefijo> nombre1 nombre2 ...
montar() {
  local dir="$1" prefijo="$2"; shift 2
  rm -rf "$dir"; mkdir -p "$dir"
  local minuto=10 sello
  for n in "$@"; do
    mkdir -p "$dir/${prefijo}-${n}"
    # `touch -t` exige CCYYMMDDhhmm — DOCE dígitos. La primera versión construía
    # "202609172${minuto}" = once, así que touch fallaba, caía al respaldo y TODOS
    # los directorios acababan con la misma hora: `ls -t` quedaba indefinido y el
    # test no probaba nada. Se compone con printf para que no vuelva a pasar.
    sello=$(printf '2026091720%02d' "$minuto")
    [ "${#sello}" -eq 12 ] || { echo "✗ sello de fecha mal formado: $sello" >&2; exit 1; }
    touch -t "$sello" "$dir/${prefijo}-${n}" || {
      echo "✗ touch -t $sello falló: el escenario no tendría fechas distintas" >&2; exit 1; }
    minuto=$((minuto+1))
  done
}

# Pone la marca de verificación en los builds indicados (por nombre corto).
#   marcar <dir> <prefijo> nombre1 nombre2 ...
#
# CONSERVA EL MTIME DEL DIRECTORIO, y eso es el detalle que hace que este test valga.
# Escribir un fichero DENTRO de un directorio actualiza el mtime del directorio. Sin
# restaurarlo, marcar `a` y `b` los convertía en los más NUEVOS y dejaba `c` como el
# más antiguo: entonces la rotación por fecha y la rotación por marca borraban `c` por
# caminos distintos, y el caso 7 pasaba con las dos implementaciones. Verde y vacuo,
# la segunda vez hoy que me pasa lo mismo.
marcar() {
  local dir="$1" prefijo="$2"; shift 2
  local d antes
  for n in "$@"; do
    d="$dir/${prefijo}-${n}"
    antes=$(stat -f '%Sm' -t '%Y%m%d%H%M' "$d")
    echo "verificado" > "$d/.deploy-ok"
    touch -t "$antes" "$d"
  done
}

# Los builds empiezan por punto: `ls -1` los OCULTA. Con `-A` se ven y se excluyen
# `.` y `..`. Este mismo despiste hizo que la primera versión del test devolviera
# vacío siempre y que la comprobación de la trampa pasara por accidente.
quedan() { ls -1A "$1" 2>/dev/null | sort | tr '\n' ' ' | sed 's/ $//'; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# ── 1 · el caso que rompió: nombres de las DOS convenciones mezclados ────────
# `-bandeja1` es el MÁS NUEVO pero ordena PRIMERO alfabéticamente. Con `sort`,
# sería el primero en morir.
D="$TMP/mezcla"
montar "$D" ".next-chat" "20260917a" "20260917b" "20260917-bandeja1"
rotar_builds "$D" ".next-chat" 2 ".next-chat-20260917-bandeja1" ".next-chat-20260917b" >/dev/null 2>&1
RESTO=$(quedan "$D")
if [ "$RESTO" = ".next-chat-20260917-bandeja1 .next-chat-20260917b" ]; then
  ok "borra el más antiguo aunque el más nuevo ordene primero alfabéticamente"
else
  falla "REGRESIÓN: la rotación no va por fecha" \
        "quedan: $RESTO · esperado: -bandeja1 y b (se borra 20260917a)"
fi

# ── 1b · cuatro builds y DOS fechas distintas, borrando dos de golpe ─────────
# Escenario que faltaba. Las fechas están elegidas para que los dos órdenes NO
# coincidan: por fecha mueren `a` y `b`; por alfabeto morirían `-bandeja1` y `a`,
# o sea se cargaría el penúltimo bueno y dejaría vivo el más viejo.
#   alfabético: -bandeja1 · a · b · 20260918-invitaciones1
#   por fecha:  a · b · -bandeja1 · 20260918-invitaciones1
D="$TMP/dosfechas"
montar "$D" ".next-chat" "20260917a" "20260917b" "20260917-bandeja1" "20260918-invitaciones1"
rotar_builds "$D" ".next-chat" 2 ".next-chat-20260918-invitaciones1" ".next-chat-20260917-bandeja1" >/dev/null 2>&1
RESTO=$(quedan "$D")
if [ "$RESTO" = ".next-chat-20260917-bandeja1 .next-chat-20260918-invitaciones1" ]; then
  ok "borra los dos más antiguos cuando hay varias fechas en juego"
else
  falla "con dos fechas no elige por antigüedad" \
        "quedan: $RESTO · esperado: -bandeja1 y -invitaciones1 (mueren a y b)"
fi

# ── 2 · nunca se borra el build VIVO, aunque sea el más antiguo ──────────────
D="$TMP/vivo"
montar "$D" ".next-app" "20260916a" "20260917a" "20260917b"
rotar_builds "$D" ".next-app" 1 ".next-app-20260917b" ".next-app-20260916a" >/dev/null 2>&1
RESTO=$(quedan "$D")
case "$RESTO" in
  *".next-app-20260916a"*) ok "conserva el vivo aunque sea el más antiguo de todos" ;;
  *) falla "borró el build VIVO" "quedan: $RESTO" ;;
esac

# ── 3 · nunca se borra el recién desplegado ─────────────────────────────────
case "$RESTO" in
  *".next-app-20260917b"*) ok "conserva el recién desplegado" ;;
  *) falla "borró el build recién desplegado" "quedan: $RESTO" ;;
esac

# ── 4 · con menos builds que el mínimo, no toca nada ────────────────────────
D="$TMP/pocos"
montar "$D" ".next-chat" "20260917a" "20260917b"
rotar_builds "$D" ".next-chat" 2 ".next-chat-20260917b" ".next-chat-20260917a" >/dev/null 2>&1
if [ "$(ls -1A "$D" | wc -l | tr -d ' ')" = "2" ]; then
  ok "no borra nada cuando no sobra ninguno"
else
  falla "borró de más" "quedan: $(quedan "$D")"
fi

# ── 5 · un directorio vacío no la hace fallar ───────────────────────────────
D="$TMP/vacio"; mkdir -p "$D"
if rotar_builds "$D" ".next-chat" 2 "" "" >/dev/null 2>&1; then
  ok "aguanta un directorio sin builds"
else
  falla "falló con un directorio vacío" "devolvió un código distinto de 0"
fi

# ── 6 · la trampa al descubierto: `sort` alfabético debe FALLAR el test 1 ───
# Se reimplementa la versión mala y se comprueba que el test la pillaría. Sin
# esto, un test que siempre pasa da una falsa sensación de estar protegido.
rotar_mal() {
  local dir="$1" prefijo="$2" conservar="$3" nuevo="$4" vivo="$5" total a_borrar b
  total=$(ls -1d "$dir/${prefijo}-"* 2>/dev/null | wc -l | tr -d ' ')
  [ "${total:-0}" -gt "$conservar" ] || return 0
  a_borrar=$(( total - conservar ))
  ls -1d "$dir/${prefijo}-"* 2>/dev/null | sort | head -n "$a_borrar" | while read -r d; do
    b=$(basename "$d")
    { [ "$b" = "$nuevo" ] || [ "$b" = "$vivo" ]; } && continue
    rm -rf "$d"
  done
}
D="$TMP/trampa"
montar "$D" ".next-chat" "20260917a" "20260917b" "20260917-bandeja1"
[ -d "$D/.next-chat-20260917-bandeja1" ] || {
  falla "el escenario de la trampa no se montó" "sin esto, el test 6 pasaría por accidente"
}
# Con `vivo` distinto del más nuevo, la protección de $VIVO no lo salva.
rotar_mal "$D" ".next-chat" 2 ".next-chat-nada" ".next-chat-20260917b" >/dev/null 2>&1
if [ -d "$D/.next-chat-20260917-bandeja1" ]; then
  falla "el test NO detectaría la versión alfabética" \
        "la implementación mala sobrevivió: el test no protege de nada"
else
  ok "la versión alfabética borra el build nuevo — el test sí la detectaría"
fi

# ── 7 · el intento FALLIDO muere antes que un build verificado más antiguo ───
# El caso real del 17-09: un build cuyo `next build` terminó pero cuyo postbuild
# murió queda con BUILD_ID, los cuatro manifiestos y los mismos 281 MB. Ninguna
# inspección del artefacto lo distingue de uno bueno, así que la rotación por fecha
# lo conservaba como "rollback" y sacrificaba uno verificado más viejo. El veredicto
# tiene que venir de la marca que se escribe al terminar el pipeline, no de los restos.
D="$TMP/marca"
montar "$D" ".next-chat" "20260917a" "20260917b" "20260917c"   # a más viejo, c más nuevo
marcar "$D" ".next-chat" "20260917a" "20260917b"               # c es el intento fallido
# vivo=b, nuevo=nada de esos: sobra 1 y debe morir c, aunque sea el MÁS NUEVO.
rotar_builds "$D" ".next-chat" 2 ".next-chat-nada" ".next-chat-20260917b" >/dev/null 2>&1
RESTO=$(quedan "$D")
if [ "$RESTO" = ".next-chat-20260917a .next-chat-20260917b" ]; then
  ok "sacrifica el build sin verificar antes que uno verificado más antiguo"
else
  falla "conservó el intento fallido como rollback" \
        "quedan: $RESTO · esperado: a y b (muere c, que no tiene marca)"
fi

# ── 8 · con todos verificados, vuelve a mandar la fecha ─────────────────────
# La marca decide el ORDEN de sacrificio, no sustituye al criterio de antigüedad.
D="$TMP/marcados"
montar "$D" ".next-chat" "20260917a" "20260917b" "20260917c"
marcar "$D" ".next-chat" "20260917a" "20260917b" "20260917c"
rotar_builds "$D" ".next-chat" 2 ".next-chat-20260917c" ".next-chat-20260917b" >/dev/null 2>&1
RESTO=$(quedan "$D")
if [ "$RESTO" = ".next-chat-20260917b .next-chat-20260917c" ]; then
  ok "con todos verificados sigue borrando el más antiguo"
else
  falla "con todos verificados no respeta la antigüedad" \
        "quedan: $RESTO · esperado: b y c (muere a)"
fi

# ── 9 · el vivo sin marca sigue protegido ───────────────────────────────────
# Un build desplegado a mano no tiene marca, pero si está SIRVIENDO no se toca:
# la marca ordena el sacrificio, no autoriza a tirar lo que está en producción.
D="$TMP/vivosinmarca"
montar "$D" ".next-chat" "20260917a" "20260917b" "20260917c"
marcar "$D" ".next-chat" "20260917b" "20260917c"
rotar_builds "$D" ".next-chat" 2 ".next-chat-20260917c" ".next-chat-20260917a" >/dev/null 2>&1
case "$(quedan "$D")" in
  *".next-chat-20260917a"*) ok "no borra el vivo aunque sea el único sin verificar" ;;
  *) falla "borró el build VIVO por no tener marca" "quedan: $(quedan "$D")" ;;
esac

# ── 10 · libera el cache de los supervivientes que ya no sirven ─────────────
# Un build de app son ~4.2 GB de los que 4.1 son cache regenerable. Guardar el cache
# de un rollback cuesta 4 GB por nada, y ya perdimos un build por disco lleno.
D="$TMP/cache"
montar "$D" ".next-app" "20260917a" "20260917b" "20260917c"
for n in 20260917a 20260917b 20260917c; do
  mkdir -p "$D/.next-app-$n/cache"; echo "basura" > "$D/.next-app-$n/cache/chunk"
done
# vivo=c, nuevo=c: sobra 1 (muere a), y b sobrevive sin servir → su cache debe irse.
rotar_builds "$D" ".next-app" 2 ".next-app-20260917c" ".next-app-20260917c" >/dev/null 2>&1
if [ ! -d "$D/.next-app-20260917b/cache" ] && [ -d "$D/.next-app-20260917b" ]; then
  ok "libera el cache del superviviente que ya no sirve"
else
  falla "no liberó el cache del rollback" \
        "cache de b: $([ -d "$D/.next-app-20260917b/cache" ] && echo sigue || echo no existe) · dir b: $([ -d "$D/.next-app-20260917b" ] && echo existe || echo BORRADO)"
fi

# ── 11 · pero NO toca el cache del vivo ni del recién desplegado ────────────
# En el que está sirviendo, `cache/` guarda también el de ISR y el de imágenes en
# ejecución: vaciarlo en caliente no rompe nada pero hace trabajar de más al servidor.
if [ -d "$D/.next-app-20260917c/cache" ]; then
  ok "conserva el cache del build que está sirviendo"
else
  falla "borró el cache del build VIVO" "es el que atiende peticiones ahora mismo"
fi

# ── 12 · el registro no puede mentir sobre lo que borró ────────────────────
# La versión anterior leía la marca DESPUÉS del `rm -rf`, así que el fichero ya no
# existía y todo salía como "(sin verificar)". Un build verificado se registraba como
# si no lo estuviera. Visto en un despliegue real: «borrado .next-app-20260917a (sin
# verificar)» cuando ese build sí tenía marca.
# Importa más de lo que parece: si la rotación empezara a sacrificar builds verificados
# por un fallo de orden, el log diría "sin verificar" igual y nadie lo notaría. Un
# registro que miente tapa justo la regresión que existe para detectar.
D="$TMP/registro"
montar "$D" ".next-app" "20260917a" "20260917b" "20260917c"
marcar "$D" ".next-app" "20260917a" "20260917b" "20260917c"
SALIDA_ROT=$(rotar_builds "$D" ".next-app" 2 ".next-app-20260917c" ".next-app-20260917b" 2>&1) || true
case "$SALIDA_ROT" in
  *"estaba verificado"*) ok "dice 'estaba verificado' al borrar uno que lo estaba" ;;
  *"sin verificar"*) falla "registra un build verificado como 'sin verificar'" \
        "la marca se está leyendo después del rm -rf, cuando ya no existe" ;;
  *) falla "el registro no dice nada del estado de verificación" "salida: $SALIDA_ROT" ;;
esac

# Y el caso contrario, para que la etiqueta no sea un adorno fijo.
D="$TMP/registro2"
montar "$D" ".next-app" "20260917a" "20260917b" "20260917c"
SALIDA_ROT=$(rotar_builds "$D" ".next-app" 2 ".next-app-20260917c" ".next-app-20260917b" 2>&1) || true
case "$SALIDA_ROT" in
  *"sin verificar"*) ok "dice 'sin verificar' al borrar uno que no lo estaba" ;;
  *) falla "no distingue el caso sin marca" "salida: $SALIDA_ROT" ;;
esac

echo
if [ "$FALLIDOS" -eq 0 ]; then
  printf '\033[32m%s\033[0m\n' "✓ rotar_builds: $PASADOS comprobaciones en verde"
else
  printf '\033[31m%s\033[0m\n' "✗ rotar_builds: $FALLIDOS fallos de $((PASADOS+FALLIDOS))"
  exit 1
fi
