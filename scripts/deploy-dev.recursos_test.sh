#!/usr/bin/env bash
#
# deploy-dev.recursos_test.sh — guardián del guardián de recursos.
#
# La primera versión del guardián mataba el despliegue si el load de 1 minuto llegaba
# a 8. Medido en la máquina: load 8.49 con CERO builds corriendo, 79% de memoria libre,
# y la carga la hacían un renderer de Chrome y cuatro helpers de Trae al 100% de CPU.
# O sea el estado NORMAL de un equipo con IDE y navegador. Un umbral que nunca se
# cumple se esquiva de rutina, y entonces ya no protege de nada.
#
# El fallo real que hay que evitar es otro: dos `next build` a la vez agotando la RAM.
# Eso se detecta directamente, no por un promedio de procesos ejecutables.
#
# Uso:  scripts/deploy-dev.recursos_test.sh
#
set -Eeuo pipefail   # las MISMAS banderas del script: aquí importa, ver caso 5

AQUI="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=/dev/null
. "$AQUI/deploy-dev.sh"

for f in recursos_veredicto medir_recursos; do
  type "$f" >/dev/null 2>&1 || { echo "✗ deploy-dev.sh no expone $f" >&2; exit 1; }
done

PASADOS=0; FALLIDOS=0
ok()    { printf '  \033[32m✓\033[0m %s\n' "$1"; PASADOS=$((PASADOS+1)); }
falla() { printf '  \033[31m✗ %s\033[0m\n     %s\n' "$1" "$2" >&2; FALLIDOS=$((FALLIDOS+1)); }

# ── 1 · otro build corriendo → PARAR. Es el fallo real del 17-09 ────────────
V=$(recursos_veredicto 1 79 2)
case "$V" in
  parar:*) ok "para si ya hay otro next build corriendo" ;;
  *) falla "no para con otro build corriendo" "devolvió: $V" ;;
esac

# ── 2 · poca memoria → PARAR. Es la magnitud que limita un heap de 8 GB ─────
V=$(recursos_veredicto 0 15 2)
case "$V" in
  parar:*) ok "para si queda poca memoria libre" ;;
  *) falla "no para con 15% de memoria" "devolvió: $V" ;;
esac

# ── 3 · LOAD ALTO NO PARA. Esta es la regresión que se arregló ──────────────
# Si alguien vuelve a `morir` por load, este caso cae y dice por qué.
V=$(recursos_veredicto 0 79 12)
case "$V" in
  parar:*) falla "REGRESIÓN: vuelve a matar por load" \
                 "load 12 con 79% de memoria y sin otros builds NO es motivo para parar: el load cuenta procesos ejecutables, no presión de memoria" ;;
  avisar:*) ok "con load alto avisa pero sigue" ;;
  *) falla "con load alto no dice nada" "devolvió: $V" ;;
esac

# ── 4 · máquina tranquila → seguir sin ruido ────────────────────────────────
V=$(recursos_veredicto 0 79 3)
[ "$V" = "seguir" ] && ok "con la máquina tranquila sigue sin avisos" \
  || falla "añade ruido con la máquina tranquila" "devolvió: $V"

# ── 5 · la MEDICIÓN no puede reventar cuando no hay builds ─────────────────
# `pgrep` devuelve 1 si no encuentra nada y, con pipefail, eso mataba el script justo
# en el caso normal. Este test corre con `set -Eeuo pipefail` a propósito: si alguien
# quita el `|| true`, la llamada de abajo mata el test entero y se nota.
# MEDIDO, no supuesto: el estado de salida depende de CÓMO se llame a la función.
#   · dentro de `$( )` → el fallo se traga y sale 0, con o sin `|| true`
#   · como parte de un `&&`/`||` → set -e no aplica, también sale 0
#   · en PLANO, sin capturar → set -e mata el script
# El script la llama dentro de una sustitución, así que hoy el `|| true` NO es lo que
# lo salva: lo salva la forma de la llamada. Pero eso es frágil — basta que alguien
# mueva la llamada a una línea suelta — así que el test la ejecuta en PLANO, que es la
# única forma que destapa la falta del `|| true`.
#
# Primera versión de este caso: contaba campos y mirarba el estado de un `$( )`. No
# detectaba nada, porque en esa forma no hay nada que detectar. Verde y vacuo, por
# tercera vez hoy.
SALIDA=$(medir_recursos)
CAMPOS=$(echo "$SALIDA" | awk '{print NF}')
if [ "$CAMPOS" != "4" ]; then
  falla "medir_recursos no devolvió 4 campos" "devolvió: '$SALIDA' ($CAMPOS campos)"
elif bash -c "set -Eeuo pipefail; . '$AQUI/deploy-dev.sh'; medir_recursos 'patron-que-no-casa-jamas-xyz' >/dev/null; echo VIVO" 2>/dev/null | grep -q VIVO; then
  ok "medir_recursos sobrevive llamada en plano bajo set -e (pgrep sin coincidencias)"
else
  falla "medir_recursos muere llamada en plano" \
        "pgrep devuelve 1 si no encuentra nada y pipefail lo propaga: falta un || true. Mataría el despliegue en el caso NORMAL, sin otros builds"
fi

# ── 6 · y los datos medidos tienen forma de número ─────────────────────────
read -r A L C _ <<EOF_T
$SALIDA
EOF_T
if echo "$A$L" | grep -qE '^[0-9]+$' && echo "$C" | grep -qE '^[0-9]+([.,][0-9]+)?$'; then
  ok "los datos medidos son numéricos (ajenos=$A libre=$L load=$C)"
else
  falla "algún dato medido no es numérico" "ajenos='$A' libre='$L' load='$C'"
fi

# ── 7 · mide el swap aunque el PATH no traiga /usr/sbin ────────────────────
# El fallo que encontró el otro agente en una ejecución real: su línea de diagnóstico
# decía "swap usado ?" porque `sysctl` vive en /usr/sbin y su entorno no lo tenía en
# el PATH. No era grave —el swap es informativo, no una puerta— pero un dato que no se
# mide y se muestra como "?" se lee dentro de un mes como "no hay swap".
SALIDA_MIN=$(env -i PATH=/usr/bin:/bin HOME="$HOME" bash -c \
  ". '$AQUI/deploy-dev.sh'; medir_recursos 'patron-que-no-casa-jamas-xyz'" 2>/dev/null) || SALIDA_MIN=""
SWAP_MIN=$(echo "$SALIDA_MIN" | awk '{print $4}')
if echo "$SWAP_MIN" | grep -qE '^[0-9]+([.,][0-9]+)?M?$'; then
  ok "mide el swap con un PATH sin /usr/sbin (leído: $SWAP_MIN)"
elif [ -z "$SALIDA_MIN" ]; then
  falla "con PATH mínimo la medición no devuelve nada" "salida vacía: ¿murió al arrancar?"
else
  falla "con PATH mínimo el swap sale sin medir ($SWAP_MIN)" \
        "sysctl está en /usr/sbin: hay que llamarlo por ruta absoluta, no confiar en el PATH"
fi

# ── 8 · y lo no medido se dice con palabras, no con un interrogante ────────
if grep -q 'no-medido' "$AQUI/deploy-dev.sh"; then
  ok "el valor no medido se etiqueta 'no-medido', no '?'"
else
  falla "volvió el '?' como marca de no medido" \
        "un interrogante en una línea de diagnóstico se lee como 'no hay', no como 'no se pudo medir'"
fi

echo
if [ "$FALLIDOS" -eq 0 ]; then
  printf '\033[32m%s\033[0m\n' "✓ recursos: $PASADOS comprobaciones en verde"
else
  printf '\033[31m%s\033[0m\n' "✗ recursos: $FALLIDOS fallos de $((PASADOS+FALLIDOS))"
  exit 1
fi
