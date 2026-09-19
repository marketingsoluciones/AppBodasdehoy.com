#!/bin/bash
# slack-copy.sh — copia mensaje al portapapeles para pegar en Slack con Cmd+V
#
# CANAL Slack: #coordinacion (C0AV8EV5495)
# HILO único: 1778170638.897419

set -e
cd "$(dirname "$0")"

choice="$1"

if [ -z "$choice" ]; then
  cat <<'MENU'

╔══════════════════════════════════════════════════════════════╗
║   MENSAJE PENDIENTE DE ENVIAR                               ║
║   Canal: #coordinacion  Hilo: 1778170638.897419              ║
╚══════════════════════════════════════════════════════════════╝

  [F3] → api-ia    🛑 CORRECCIÓN — NO borrar features, migrar TODAS a REST
                    Regla 0: no perder funcionalidad. Pido endpoints REST
                    para apikey, marketplace, memory, export/import (GDPR),
                    galería, chunks, PDF, modelos custom, agent files.

  [F1] → api-mcp   📋 Pendientes finales (User fields + Business types)
                    Sin urgencia, gaps menores.

  [s] → salir

Elige (F3/F1/s):
MENU
  read choice
fi

case "$choice" in
  F3|f3|correccion|ia)
    file="F3-RE-API-IA-correccion-NO-borrar.txt"
    target="api-ia"
    note="🛑 CORRECCIÓN regla 0 — migrar todas las features a REST"
    ;;
  F1|f1|mcp)
    file="F1-PARA-API-MCP-pendientes-finales.txt"
    target="api-mcp"
    note="📋 2 gaps menores"
    ;;
  s|S|salir)
    echo "Saliendo."
    exit 0
    ;;
  *)
    echo "Opción inválida: $choice"
    exit 1
    ;;
esac

if [ ! -f "$file" ]; then
  echo "ERROR: $file no existe en $(pwd)"
  exit 1
fi

cat "$file" | pbcopy
lines=$(wc -l < "$file" | tr -d ' ')
bytes=$(wc -c < "$file" | tr -d ' ')

cat <<EOF

✅ COPIADO al portapapeles
   archivo: $file
   tamaño:  $lines líneas, $bytes bytes
   destino: $target
   asunto:  $note

📋 Pegar en Slack:
   1. Cmd+Tab → Slack
   2. #coordinacion (C0AV8EV5495)
   3. Hilo 1778170638.897419 → "Reply in thread"
   4. Cmd+V → Enter

EOF
