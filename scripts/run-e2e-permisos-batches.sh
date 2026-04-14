#!/usr/bin/env bash
# Ejecuta batches de permisos-modulos.spec.ts (E2E_ENV=dev, webkit).
# Tras BATCH 0, cada batch incluye PM-S01 en el grep para que smokeOk quede true en el mismo proceso.
set -uo pipefail
cd "$(dirname "$0")/.."
export E2E_ENV=dev
SPEC="e2e-app/permisos-modulos.spec.ts"
MASTER="${1:-/tmp/e2e-permisos-master.log}"
: > "$MASTER"

run_batch () {
  local key="$1"
  local grep_pat="$2"
  echo "" >> "$MASTER"
  echo "=== BATCH_MARKER $key ===" >> "$MASTER"
  set +e
  npx playwright test "$SPEC" --project=webkit --grep "$grep_pat" --reporter=list 2>&1 | tee -a "$MASTER"
  local ec=$?
  set +e
  echo "=== EXIT $key $ec ===" >> "$MASTER"
}

echo "=== BATCH_MARKER BATCH0 ===" | tee -a "$MASTER"
set +e
npx playwright test "$SPEC" --project=webkit --grep "BATCH 0" --reporter=list 2>&1 | tee -a "$MASTER"
B0=$?
set +e
echo "=== EXIT BATCH0 $B0 ===" >> "$MASTER"
if [[ "$B0" -ne 0 ]]; then
  echo "Smoke BATCH 0 falló (exit $B0). Abortando resto de batches." >&2
  echo "Log: $MASTER"
  exit "$B0"
fi

run_batch "INV"     'PM-S01|BATCH INV —'
run_batch "PRE"     'PM-S01|BATCH PRE —'
run_batch "TAR"     'PM-S01|BATCH TAR'
run_batch "EVT"     'PM-S01|BATCH EVT'
run_batch "MES"     'PM-S01|BATCH MES'
run_batch "INV-EMAIL" 'PM-S01|BATCH INV-EMAIL'
run_batch "PRE-PAGOS" 'PM-S01|BATCH PRE-PAGOS'
run_batch "PRE-ITEMS" 'PM-S01|BATCH PRE-ITEMS'
run_batch "PRE-DASH"  'PM-S01|BATCH PRE-DASH'
run_batch "SRV"       'PM-S01|BATCH SRV'
run_batch "ITR"       'PM-S01|BATCH ITR'
run_batch "CROSS"     'PM-S01|BATCH CROSS'

echo "Log completo: $MASTER"
