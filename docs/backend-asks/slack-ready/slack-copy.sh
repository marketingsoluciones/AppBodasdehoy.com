#!/bin/bash
# slack-copy.sh — copia un mensaje al portapapeles para pegar en Slack con Cmd+V
#
# CANAL Slack: #coordinacion (C0AV8EV5495)
# WORKSPACE:   eventosorganizador.slack.com
# HILO único:  1778170638.897419
#
# Uso:
#   ./slack-copy.sh         # menú
#   ./slack-copy.sh F1      # api-mcp pendientes finales (2 gaps menores)
#   ./slack-copy.sh F2      # api-ia pendientes CAPA 3 (13 puntos)
#
# Requisito: macOS (usa pbcopy).

set -e
cd "$(dirname "$0")"

choice="$1"

if [ -z "$choice" ]; then
  cat <<'MENU'

╔══════════════════════════════════════════════════════════════╗
║   MENSAJES SLACK PENDIENTES DE ENVIAR                       ║
║   Canal: #coordinacion (C0AV8EV5495)                        ║
║   Hilo:  1778170638.897419                                   ║
╚══════════════════════════════════════════════════════════════╝

  [F1] → api-mcp   📋 Pendientes finales tras CAPA 2 cerrada
                    2 gaps menores: User fields incompletos + Business
                    types Unknown. No bloquean nada. Respuesta corta.

  [F2] → api-ia    🟦 Pendientes CAPA 3 PASO C (decisión grande)
                    11 archivos cliente bloqueados, 13 puntos
                    priorizados. ATAJO: "ABCD = c,c,c,c" → cierro
                    CAPA 3 en 2-3h.

  [s] → salir

Elige (F1/F2/s):
MENU
  read choice
fi

case "$choice" in
  F1|f1|mcp)
    file="F1-PARA-API-MCP-pendientes-finales.txt"
    target="api-mcp"
    note="📋 2 gaps menores tras CAPA 2 cerrada"
    ;;
  F2|f2|ia)
    file="F2-PARA-API-IA-pendientes-CAPA3.txt"
    target="api-ia"
    note="🟦 CAPA 3 — 13 puntos para cerrar -25k módulos"
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
   2. Canal #coordinacion (C0AV8EV5495)
   3. Hilo 1778170638.897419 → "Reply in thread"
   4. Cmd+V → Enter

EOF
