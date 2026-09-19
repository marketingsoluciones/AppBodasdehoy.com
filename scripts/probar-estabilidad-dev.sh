#!/usr/bin/env bash
set -euo pipefail

N="${N:-60}"
SLEEP_SEC="${SLEEP_SEC:-1}"

APP_LOCAL_URL="${APP_LOCAL_URL:-http://127.0.0.1:3220/}"
CHAT_LOCAL_URL="${CHAT_LOCAL_URL:-http://127.0.0.1:3210/bodasdehoy/chat}"
CHAT_LAN_URL="${CHAT_LAN_URL:-http://192.168.1.48:3210/bodasdehoy/chat}"

APP_DEV_URL="${APP_DEV_URL:-https://app-dev.bodasdehoy.com/}"
CHAT_DEV_URL="${CHAT_DEV_URL:-https://chat-dev.bodasdehoy.com/bodasdehoy/chat}"

ok_code() {
  [[ "$1" =~ ^(200|301|302|303|307|308|304)$ ]]
}

curl_code() {
  local url="$1"
  curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 12 "$url" 2>/dev/null || echo "ERR"
}

ok=0
local_fail=0
dev_fail=0
app_only=0
chat_only=0
chat_lan_fail=0
unknown=0

echo "=== Estabilidad DEV (HTTP) ==="
echo "N=$N SLEEP_SEC=$SLEEP_SEC"
echo "APP_LOCAL_URL=$APP_LOCAL_URL"
echo "CHAT_LOCAL_URL=$CHAT_LOCAL_URL"
echo "CHAT_LAN_URL=$CHAT_LAN_URL"
echo "APP_DEV_URL=$APP_DEV_URL"
echo "CHAT_DEV_URL=$CHAT_DEV_URL"
echo ""

for i in $(seq 1 "$N"); do
  c_app_local="$(curl_code "$APP_LOCAL_URL")"
  c_chat_local="$(curl_code "$CHAT_LOCAL_URL")"
  c_chat_lan="$(curl_code "$CHAT_LAN_URL")"
  c_app_dev="$(curl_code "$APP_DEV_URL")"
  c_chat_dev="$(curl_code "$CHAT_DEV_URL")"

  app_local_ok=0; chat_local_ok=0; chat_lan_ok=0; app_dev_ok=0; chat_dev_ok=0
  ok_code "$c_app_local" && app_local_ok=1
  ok_code "$c_chat_local" && chat_local_ok=1
  ok_code "$c_chat_lan" && chat_lan_ok=1
  ok_code "$c_app_dev" && app_dev_ok=1
  ok_code "$c_chat_dev" && chat_dev_ok=1

  verdict="OK"
  if [[ $app_local_ok -ne 1 || $chat_local_ok -ne 1 ]]; then
    verdict="LOCAL_FAIL"
  elif [[ $app_dev_ok -ne 1 || $chat_dev_ok -ne 1 ]]; then
    verdict="DEV_FAIL"
  fi

  if [[ $app_dev_ok -eq 1 && $chat_dev_ok -ne 1 ]]; then
    verdict="CHAT_ONLY_FAIL"
  elif [[ $app_dev_ok -ne 1 && $chat_dev_ok -eq 1 ]]; then
    verdict="APP_ONLY_FAIL"
  fi

  if [[ $verdict == "OK" ]]; then
    ok=$((ok+1))
  elif [[ $verdict == "LOCAL_FAIL" ]]; then
    local_fail=$((local_fail+1))
  elif [[ $verdict == "DEV_FAIL" ]]; then
    dev_fail=$((dev_fail+1))
  elif [[ $verdict == "CHAT_ONLY_FAIL" ]]; then
    chat_only=$((chat_only+1))
  elif [[ $verdict == "APP_ONLY_FAIL" ]]; then
    app_only=$((app_only+1))
  else
    unknown=$((unknown+1))
  fi

  if [[ $chat_lan_ok -ne 1 ]]; then
    chat_lan_fail=$((chat_lan_fail+1))
  fi

  if [[ $verdict != "OK" ]]; then
    ts="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    echo "[$ts] $i/$N $verdict app_local=$c_app_local chat_local=$c_chat_local chat_lan=$c_chat_lan app_dev=$c_app_dev chat_dev=$c_chat_dev"
  fi

  sleep "$SLEEP_SEC"
done

echo ""
echo "=== Summary ==="
echo "OK=$ok"
echo "LOCAL_FAIL=$local_fail"
echo "DEV_FAIL=$dev_fail"
echo "CHAT_ONLY_FAIL=$chat_only"
echo "APP_ONLY_FAIL=$app_only"
echo "CHAT_LAN_FAIL=$chat_lan_fail"
echo "UNKNOWN=$unknown"
echo "TOTAL=$N"

