#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ -f "$ROOT_DIR/.env.slack.local" ]; then
  set -a && source "$ROOT_DIR/.env.slack.local" && set +a
elif [ -f "$ROOT_DIR/.env.local" ]; then
  set -a && source "$ROOT_DIR/.env.local" && set +a
elif [ -f "$ROOT_DIR/.env" ]; then
  set -a && source "$ROOT_DIR/.env" && set +a
fi

if [ -z "${SLACK_BOT_TOKEN:-}" ] && [ -f "$HOME/.slack-bodasdehoy.env" ]; then
  set -a && source "$HOME/.slack-bodasdehoy.env" && set +a
fi

TOKEN="${SLACK_BOT_TOKEN:-${SLACK_OAUTH_TOKEN:-}}"
if [ -z "$TOKEN" ]; then
  echo "Error: SLACK_BOT_TOKEN no está definido" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq no está instalado" >&2
  exit 1
fi

OUR_USER_ID="${SLACK_WATCH_OUR_USER_ID:-U0AEBNW9TD3}"
SLEEP_SECONDS="${SLACK_WATCH_SLEEP_SECONDS:-480}"
PING_COOLDOWN_SECONDS="${SLACK_WATCH_PING_COOLDOWN_SECONDS:-3600}"

CH_MCP="${SLACK_WATCH_CH_MCP:-C0AE8K47VNF}"
CH_API_IA="${SLACK_WATCH_CH_API_IA:-C0AEV0GCLM7}"
CH_LEGACY="${SLACK_WATCH_CH_LEGACY:-C0AV8EV5495}"

last_ts_mcp="0"
last_ts_api_ia="0"
last_ts_legacy="0"

last_ping_mcp_epoch=0
last_ping_apiia_epoch=0

now_epoch() { date +%s; }

fetch_messages() {
  local channel="$1"
  local oldest="$2"
  curl -sS --max-time 15 \
    -H "Authorization: Bearer $TOKEN" \
    "https://slack.com/api/conversations.history?channel=${channel}&limit=20&oldest=${oldest}"
}

send_norm_reminder() {
  local label="$1"
  local text='Recordatorio normas: empezar con "DE: <equipo> | PARA: <equipo> | DRI: @handle". Si no sabes a quién asignar: "DRI: @backend_oncall".'
  if [ "$label" = "mcp" ]; then
    bash scripts/slack-send.sh --to mcp --web --dri @backend_oncall "$text" || true
  elif [ "$label" = "api-ia" ]; then
    bash scripts/slack-send.sh --to api-ia --web --dri @backend_oncall "$text" || true
  else
    bash scripts/slack-send.sh --to coordinacion --web --dri @backend_oncall "$text" || true
  fi
}

send_ping_pendientes() {
  local label="$1"
  if [ "$label" = "mcp" ]; then
    bash scripts/slack-send.sh --to mcp --web --dri @backend_oncall \
      "Ping pendientes (normas): ¿DRI+Estado+ETA para (createComment Task no encontrada / getNotifications=0 / schema updateCustomer+getEventTicket)?" || true
  elif [ "$label" = "api-ia" ]; then
    bash scripts/slack-send.sh --to api-ia --web --dri @backend_oncall \
      "Ping realtime (normas): confirmad DRI+ETA + contrato final (room user:<uid> y evento notification)." || true
  fi
}

process_channel() {
  local label="$1"
  local channel="$2"
  local last_ts_var="$3"

  local json ok newest rows
  json="$(fetch_messages "$channel" "${!last_ts_var}")"

  ok="$(echo "$json" | jq -r '.ok // false')"
  if [ "$ok" != "true" ]; then
    echo "[$label] Slack API error: $(echo "$json" | jq -r '.error // "unknown"')" >&2
    return 0
  fi

  newest="$(echo "$json" | jq -r '[.messages[].ts|tonumber] | max // 0')"
  if [ "$newest" = "0" ]; then
    return 0
  fi

  rows="$(echo "$json" | jq -r ".messages
    | map(select(.ts|tonumber > (${!last_ts_var}|tonumber)))
    | sort_by(.ts|tonumber)
    | .[]
    | [(.ts//\"\"), (.user//\"\"), (.bot_id//\"\"), (.text//\"\")]
    | @tsv")"

  local saw_eta="0"
  local sent_norm="0"

  while IFS=$'\t' read -r ts user bot_id text; do
    [ -z "$ts" ] && continue

    local sender="$user"
    [ -z "$sender" ] && sender="$bot_id"

    if [ "$sender" = "$OUR_USER_ID" ]; then
      continue
    fi

    if ! echo "$text" | grep -qE '^DE: .+\| PARA: .+\| DRI: @'; then
      if [ "$sent_norm" = "0" ]; then
        send_norm_reminder "$label"
        sent_norm="1"
      fi
    fi

    if echo "$text" | grep -qiE 'Estado:|\bETA\b|DRI: @'; then
      saw_eta="1"
    fi
  done <<< "$rows"

  local now
  now="$(now_epoch)"

  if [ "$label" = "mcp" ] && [ "$saw_eta" = "0" ] && [ $((now - last_ping_mcp_epoch)) -ge "$PING_COOLDOWN_SECONDS" ]; then
    send_ping_pendientes "mcp"
    last_ping_mcp_epoch="$now"
  fi

  if [ "$label" = "api-ia" ] && [ "$saw_eta" = "0" ] && [ $((now - last_ping_apiia_epoch)) -ge "$PING_COOLDOWN_SECONDS" ]; then
    send_ping_pendientes "api-ia"
    last_ping_apiia_epoch="$now"
  fi

  printf -v "$last_ts_var" "%s" "$newest"
}

echo "Slack watcher activo: cada 8 min revisa pendientes + cumplimiento DE|PARA|DRI." >&2

while true; do
  echo "=== Watch tick $(date -u +"%Y-%m-%dT%H:%M:%SZ") ===" >&2
  process_channel mcp "$CH_MCP" last_ts_mcp || true
  process_channel api-ia "$CH_API_IA" last_ts_api_ia || true
  process_channel legacy "$CH_LEGACY" last_ts_legacy || true
  sleep "$SLEEP_SECONDS"
done

