#!/bin/bash
# Estrategia alternativa: habilita SSH por clave para el usuario ROOT en la Raspberry Pi.
# Escribe en /root/.ssh/authorized_keys y crea config para PermitRootLogin prohibit-password.
# Ejecutar con: sudo ./pi-ssh-root-key-on-sd.sh /dev/rdisk4s2

set -e
DEBUGFS="/opt/homebrew/opt/e2fsprogs/sbin/debugfs"
KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPMEcLEGviVgBDEeil0g8xg0Mer+qvsH05iOoktjkj9r juancarlosparra@Mac-mini-de-juan.local"
TMP_KEY="/tmp/pi_root_authorized_keys_$$"
TMP_CFG="/tmp/pi_sshd_config_$$"

if [ -n "$1" ]; then
  DISK="$1"
else
  PART=$(diskutil list | grep "Linux" | grep "125" | awk '{print $NF}' | head -1)
  if [ -n "$PART" ] && [[ "$PART" =~ ^disk[0-9]+s2$ ]]; then
    DISK="/dev/r${PART}"
  else
    DISK="/dev/rdisk4s2"
  fi
fi

echo "Dispositivo: $DISK"
test -e "$DISK" || { echo "Error: $DISK no existe. Conecta la tarjeta y usa: diskutil list"; exit 1; }

echo "$KEY" > "$TMP_KEY"
echo "PermitRootLogin prohibit-password" > "$TMP_CFG"

echo "Creando /root/.ssh..."
"$DEBUGFS" -w -R "mkdir /root/.ssh" "$DISK" 2>/dev/null || true

echo "Escribiendo /root/.ssh/authorized_keys..."
CMDFILE="/tmp/debugfs_root_$$"
{ echo "cd /root/.ssh"; echo "write $TMP_KEY authorized_keys"; echo "quit"; } > "$CMDFILE"
"$DEBUGFS" -w -f "$CMDFILE" "$DISK" 2>/dev/null
rm -f "$CMDFILE"

echo "Creando /etc/ssh/sshd_config.d y permitiendo root por clave..."
"$DEBUGFS" -w -R "mkdir /etc/ssh/sshd_config.d" "$DISK" 2>/dev/null || true
CMDFILE2="/tmp/debugfs_cfg_$$"
{ echo "cd /etc/ssh/sshd_config.d"; echo "write $TMP_CFG 99-allow-root-key.conf"; echo "quit"; } > "$CMDFILE2"
"$DEBUGFS" -w -f "$CMDFILE2" "$DISK" 2>/dev/null
rm -f "$CMDFILE2"

echo "Ajustando permisos (root = uid 0, .ssh=700, authorized_keys=600)..."
ROOT_DIR=$("$DEBUGFS" -R "stat /root/.ssh" "$DISK" 2>/dev/null | awk '/^Inode:/{print $2}')
ROOT_FILE=$("$DEBUGFS" -R "stat /root/.ssh/authorized_keys" "$DISK" 2>/dev/null | awk '/^Inode:/{print $2}')
for INODE in $ROOT_DIR $ROOT_FILE; do
  [ -z "$INODE" ] && continue
  "$DEBUGFS" -w -R "set_inode_field $INODE uid 0" "$DISK" 2>/dev/null || true
  "$DEBUGFS" -w -R "set_inode_field $INODE gid 0" "$DISK" 2>/dev/null || true
done
[ -n "$ROOT_DIR" ] && "$DEBUGFS" -w -R "set_inode_field $ROOT_DIR mode 16832" "$DISK" 2>/dev/null || true
[ -n "$ROOT_FILE" ] && "$DEBUGFS" -w -R "set_inode_field $ROOT_FILE mode 33152" "$DISK" 2>/dev/null || true

# Config file: root-owned, 644
CFG_INODE=$("$DEBUGFS" -R "stat /etc/ssh/sshd_config.d/99-allow-root-key.conf" "$DISK" 2>/dev/null | awk '/^Inode:/{print $2}')
if [ -n "$CFG_INODE" ]; then
  "$DEBUGFS" -w -R "set_inode_field $CFG_INODE uid 0" "$DISK" 2>/dev/null || true
  "$DEBUGFS" -w -R "set_inode_field $CFG_INODE gid 0" "$DISK" 2>/dev/null || true
  "$DEBUGFS" -w -R "set_inode_field $CFG_INODE mode 33188" "$DISK" 2>/dev/null || true
fi

rm -f "$TMP_KEY" "$TMP_CFG"
EJECT_DISK=$(echo "$DISK" | sed 's|/dev/rdisk|/dev/disk|' | sed 's|s2$||')
echo "Listo. Expulsa: diskutil eject $EJECT_DISK"
echo "Arranca la Raspberry y conecta con: ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedAlgorithms=+ssh-rsa root@192.168.1.90"
