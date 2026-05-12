#!/bin/bash

set -euo pipefail

resolve_from_ssh_config() {
  local key
  key="$(ssh -G leadscarap 2>/dev/null | awk '$1=="identityfile"{print $2; exit}')"
  if [[ -n "${key}" && -f "${key/#\~/$HOME}" ]]; then
    echo "${key/#\~/$HOME}"
  fi
}

KEY_PATH="${SSH_KEY_PATH:-}"
if [[ -z "$KEY_PATH" ]]; then
  KEY_PATH="$(resolve_from_ssh_config || true)"
fi

if [[ -z "$KEY_PATH" ]]; then
  echo "Falta SSH_KEY_PATH (o un Host 'leadscarap' con IdentityFile en ~/.ssh/config)" >&2
  exit 2
fi

KEY_PATH="${KEY_PATH/#\~/$HOME}"
if [[ ! -f "$KEY_PATH" ]]; then
  echo "No existe la key: $KEY_PATH" >&2
  exit 2
fi

SSH_USER="${SSH_USER:-}"
if [[ -z "$SSH_USER" ]]; then
  SSH_USER="$(ssh -G leadscarap 2>/dev/null | awk '$1=="user"{print $2; exit}' || true)"
fi
SSH_USER="${SSH_USER:-root}"

SSH_PORT="${SSH_PORT:-22}"

check_one() {
  local host
  host="$1"
  ssh -o BatchMode=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new -p "$SSH_PORT" -i "$KEY_PATH" "${SSH_USER}@${host}" 'echo ok' >/dev/null
}

echo "KEY_PATH=$KEY_PATH"
echo "SSH_USER=$SSH_USER"
echo "SSH_PORT=$SSH_PORT"

for host in api3-mcp-graphql.eventosorganizador.com api3-ia.eventosorganizador.com; do
  printf '%s ... ' "$host"
  if check_one "$host"; then
    echo "OK"
  else
    echo "FAIL"
    exit 1
  fi
done
