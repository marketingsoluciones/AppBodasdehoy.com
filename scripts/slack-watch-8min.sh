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
LOG_WINDOW_SECONDS="${SLACK_WATCH_LOG_WINDOW_SECONDS:-14400}"
LOG_FILE="${SLACK_WATCH_LOG_FILE:-$ROOT_DIR/.slack-watch-last4h.log}"

CH_WAR_ROOM="${SLACK_WATCH_CH_WAR_ROOM:-C0AV8EV5495}"
HEALTH_URL_APP="${SLACK_WATCH_HEALTH_URL_APP:-https://app-dev.bodasdehoy.com/}"
HEALTH_URL_CHAT="${SLACK_WATCH_HEALTH_URL_CHAT:-https://chat-dev.bodasdehoy.com/}"
HEALTH_URL_LOCAL_APP="${SLACK_WATCH_HEALTH_URL_LOCAL_APP:-http://localhost:3220/}"
HEALTH_URL_LOCAL_CHAT="${SLACK_WATCH_HEALTH_URL_LOCAL_CHAT:-http://localhost:3210/}"
ENV_DOWN_COOLDOWN_SECONDS="${SLACK_WATCH_ENV_DOWN_COOLDOWN_SECONDS:-1800}"
THREAD_TS="${SLACK_WATCH_THREAD_TS:-1778170638.897419}"
TICK_POSTS="${SLACK_WATCH_TICK_POSTS:-1}"
STATUS_TEXT="${SLACK_WATCH_STATUS_TEXT:-Watcher activo. Ver historial hilo para estado real (PENDIENTES/AVANCES/DIFICULTADES/PRÓXIMO).}"

last_ts_war_room="0"

last_ping_war_room_epoch=0
last_env_down_epoch=0

now_epoch() { date +%s; }
ts_to_epoch() { echo "${1%%.*}"; }

log_trim() {
  local now cutoff tmp
  now="$(now_epoch)"
  cutoff="$((now - LOG_WINDOW_SECONDS))"
  tmp="${LOG_FILE}.tmp"

  if [ ! -f "$LOG_FILE" ]; then
    return 0
  fi

  awk -F'\t' -v cutoff="$cutoff" 'NF>=2 && $1 >= cutoff {print}' "$LOG_FILE" > "$tmp" || true
  mv "$tmp" "$LOG_FILE" || true
}

log_append_rows() {
  local label="$1"
  local rows="$2"
  local now cutoff
  now="$(now_epoch)"
  cutoff="$((now - LOG_WINDOW_SECONDS))"

  mkdir -p "$(dirname "$LOG_FILE")" >/dev/null 2>&1 || true

  while IFS=$'\t' read -r ts user bot_id text; do
    [ -z "$ts" ] && continue
    local epoch sender safe_text
    epoch="$(ts_to_epoch "$ts")"
    if [ "$epoch" -lt "$cutoff" ]; then
      continue
    fi

    sender="$user"
    [ -z "$sender" ] && sender="$bot_id"
    safe_text="$(echo "$text" | tr '\n' ' ' | tr '\t' ' ' | sed 's/[[:space:]]\{1,\}/ /g')"
    printf "%s\t%s\t%s\t%s\t%s\n" "$epoch" "$label" "$ts" "$sender" "$safe_text" >> "$LOG_FILE"
  done <<< "$rows"

  log_trim
}

summarize_rows() {
  local label="$1"
  local rows="$2"
  local new_lines pending_lines deps now deps_src

  new_lines="$(echo "$rows" | awk -F'\t' 'NF>=4 {print $1 " | " $2 " | " substr($4,1,160)}')"
  pending_lines="$(echo "$rows" | awk -F'\t' 'NF>=4 {print $4}' | grep -iE 'Acción requerida|Necesito confirmación|Pendiente|Bloqueo|BLOCKED|P0|ERROR|502|524|1033|FORBIDDEN|LOGIN_FAILED|wrong-password|user-not-found' || true)"
  deps_src="$(echo "$pending_lines" \
    | sed -E 's/<mailto:[^>]+>//g' \
    | sed -E 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}//g')"
  deps="$(echo "$deps_src" | grep -oE '@[a-zA-Z][a-zA-Z0-9_\\-]{1,30}' | sort -u | tr '\n' ' ')"
  now="$(now_epoch)"

  if [ -n "$new_lines" ]; then
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      printf "%s\tsummary\t%s\tNEW\t%s\n" "$now" "$label" "$line" >> "$LOG_FILE"
    done <<< "$new_lines"
  else
    printf "%s\tsummary\t%s\tNEW\t(sin mensajes nuevos)\n" "$now" "$label" >> "$LOG_FILE"
  fi

  if [ -n "$pending_lines" ]; then
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      printf "%s\tsummary\t%s\tPENDING\t%s\n" "$now" "$label" "$line" >> "$LOG_FILE"
    done <<< "$pending_lines"
  else
    printf "%s\tsummary\t%s\tPENDING\t(sin pendientes detectados en mensajes nuevos)\n" "$now" "$label" >> "$LOG_FILE"
  fi

  if [ -n "$deps" ]; then
    printf "%s\tsummary\t%s\tDEPS\t%s\n" "$now" "$label" "$deps" >> "$LOG_FILE"
  else
    printf "%s\tsummary\t%s\tDEPS\t(sin @handles detectados)\n" "$now" "$label" >> "$LOG_FILE"
  fi

  printf "%s\tsummary\t%s\tRULE\tSi hay cambios de código: enviar análisis a COORD-APP, pedir confirmación explícita de @JuanCarlos (usuario) y solo aplicar tras OK.\n" "$now" "$label" >> "$LOG_FILE"

  log_trim
}

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
  bash scripts/slack-send.sh --to war-room --web --dri @backend_oncall "$text" || true
}

send_ping_pendientes() {
  # DESHABILITADO 2026-05-08: regla user — FRONT NO debe pingear backend directo.
  # FRONT solo comunica con COORD-APP. Los pendientes técnicos (createComment, getNotifications,
  # socket, schemas) los gestiona COORD-APP, no FRONT.
  # Si necesitas escalar pendiente, postea heartbeat con bloque DIFICULTADES para que COORD-APP decida.
  local label="$1"
  echo "[${label}] send_ping_pendientes deshabilitado por regla jerarquía (user 2026-05-08)" >&2
  return 0
}

check_env_health() {
  local now
  now="$(now_epoch)"
  if [ $((now - last_env_down_epoch)) -lt "$ENV_DOWN_COOLDOWN_SECONDS" ]; then
    return 0
  fi

  local app_code chat_code local_app_code local_chat_code
  app_code="$(curl -sS --max-time 5 -o /dev/null -w "%{http_code}" "$HEALTH_URL_APP" || echo "000")"
  chat_code="$(curl -sS --max-time 5 -o /dev/null -w "%{http_code}" "$HEALTH_URL_CHAT" || echo "000")"
  local_app_code="$(curl -sS --max-time 3 -o /dev/null -w "%{http_code}" "$HEALTH_URL_LOCAL_APP" || echo "000")"
  local_chat_code="$(curl -sS --max-time 3 -o /dev/null -w "%{http_code}" "$HEALTH_URL_LOCAL_CHAT" || echo "000")"

  if [ "$app_code" = "200" ] && [ "$chat_code" = "200" ] && [ "$local_app_code" = "200" ] && [ "$local_chat_code" = "200" ]; then
    return 0
  fi

  bash scripts/slack-send.sh --to coordinacion --web --para-equipo "COORD-APP" --dri @frontend_oncall --thread-ts "$THREAD_TS" \
    "ASUNTO: BLOQUEO_INFRA health-check\n\napp-dev: $HEALTH_URL_APP → HTTP $app_code\nchat-dev: $HEALTH_URL_CHAT → HTTP $chat_code\nlocal3220: $HEALTH_URL_LOCAL_APP → HTTP $local_app_code\nlocal3210: $HEALTH_URL_LOCAL_CHAT → HTTP $local_chat_code" || true

  last_env_down_epoch="$now"
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

  if [ "$label" = "war-room" ] && [ "$saw_eta" = "0" ] && [ $((now - last_ping_war_room_epoch)) -ge "$PING_COOLDOWN_SECONDS" ]; then
    send_ping_pendientes "war-room"
    last_ping_war_room_epoch="$now"
  fi

  if [ -n "$rows" ]; then
    log_append_rows "$label" "$rows"
    summarize_rows "$label" "$rows"
    echo "[$label] new messages logged -> $LOG_FILE" >&2
  fi

  printf -v "$last_ts_var" "%s" "$newest"
}

echo "Slack watcher activo: cada ${SLEEP_SECONDS}s. Log rolling últimas $((LOG_WINDOW_SECONDS/3600))h -> $LOG_FILE" >&2
log_trim || true

while true; do
  tick_utc="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "=== Watch tick ${tick_utc} ===" >&2
  check_env_health || true
  process_channel war-room "$CH_WAR_ROOM" last_ts_war_room || true
  if [ "$TICK_POSTS" = "1" ]; then
    # Health snapshot real para que tick sea útil (no plantilla muerta)
    local hcheck_app hcheck_chat
    hcheck_app="$(curl -sS --max-time 3 -o /dev/null -w "%{http_code}" "$HEALTH_URL_APP" 2>/dev/null || echo "000")"
    hcheck_chat="$(curl -sS --max-time 3 -o /dev/null -w "%{http_code}" "$HEALTH_URL_CHAT" 2>/dev/null || echo "000")"
    local last_head
    last_head="$(git log -1 --format='%h %s' 2>/dev/null | cut -c1-80 || echo "?")"
    bash scripts/slack-send.sh --to coordinacion --web --para-equipo "COORD-APP" --dri @frontend_oncall --thread-ts "$THREAD_TS" --reply-broadcast \
      "ASUNTO: Heartbeat ${tick_utc}\napp-dev=${hcheck_app} chat-dev=${hcheck_chat} HEAD=${last_head}\n${STATUS_TEXT}\n\nSi tienes algún PASS/FAIL nuevo desde el último heartbeat, reportalo APARTE con bloques PENDIENTES/AVANCES/DIFICULTADES/PRÓXIMO." || true
  fi
  sleep "$SLEEP_SECONDS"
done
