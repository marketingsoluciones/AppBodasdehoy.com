#!/bin/bash
# Escribe la clave SSH en la partición root (ext4) de la tarjeta de la Raspberry Pi GR-HABARES.
# Ejecutar con: sudo ./pi-authorized-keys-on-sd.sh
# Requiere: tarjeta SD conectada (ej. /dev/disk4), e2fsprogs instalado (brew install e2fsprogs)

set -e
DEBUGFS="/opt/homebrew/opt/e2fsprogs/sbin/debugfs"
KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPMEcLEGviVgBDEeil0g8xg0Mer+qvsH05iOoktjkj9r juancarlosparra@Mac-mini-de-juan.local"
TMP="/tmp/pi_authorized_keys_$$"

if [ -n "$1" ]; then
  DISK="$1"
else
  # Detectar tarjeta Raspberry (partición Linux ~125 GB)
  PART=$(diskutil list | grep "Linux" | grep "125" | awk '{print $NF}' | head -1)
  if [ -n "$PART" ] && [[ "$PART" =~ ^disk[0-9]+s2$ ]]; then
    DISK="/dev/r${PART}"
  else
    DISK="/dev/rdisk4s2"
  fi
fi

echo "Dispositivo: $DISK"
echo "Comprobando que existe..."
if [ ! -e "$DISK" ]; then
  echo "Error: $DISK no existe."
  echo ""
  echo "¿Está la tarjeta SD de la Raspberry conectada al Mac?"
  echo "Comprueba con: diskutil list"
  echo "Busca la línea de 125.7 GB (external). Si es disk5, ejecuta:"
  echo "  sudo $0 /dev/rdisk5s2"
  echo "Si es disk4: sudo $0 /dev/rdisk4s2"
  echo ""
  diskutil list 2>/dev/null | grep -E "external|125\.|Linux|bootfs" || true
  exit 1
fi

echo "$KEY" > "$TMP"
echo "Contenido a escribir:"
cat "$TMP"

echo ""
echo "Creando /home/pi/.ssh si no existe..."
"$DEBUGFS" -w -R "mkdir /home/pi/.ssh" "$DISK" 2>/dev/null || true

echo "Escribiendo authorized_keys..."
CMDFILE="/tmp/debugfs_cmd_$$"
{
  echo "cd /home/pi/.ssh"
  echo "write $TMP authorized_keys"
  echo "quit"
} > "$CMDFILE"
"$DEBUGFS" -w -f "$CMDFILE" "$DISK" 2>/dev/null
rm -f "$CMDFILE"

echo "Ajustando permisos y propietario (usuario pi = uid 1000)..."
DIR_INODE=$("$DEBUGFS" -R "stat /home/pi/.ssh" "$DISK" 2>/dev/null | awk '/^Inode:/{print $2}')
FILE_INODE=$("$DEBUGFS" -R "stat /home/pi/.ssh/authorized_keys" "$DISK" 2>/dev/null | awk '/^Inode:/{print $2}')
# SSH exige: propietario pi (1000:1000), .ssh=700, authorized_keys=600
for INODE in $DIR_INODE $FILE_INODE; do
  [ -z "$INODE" ] && continue
  "$DEBUGFS" -w -R "set_inode_field $INODE uid 1000" "$DISK" 2>/dev/null || true
  "$DEBUGFS" -w -R "set_inode_field $INODE gid 1000" "$DISK" 2>/dev/null || true
done
if [ -n "$DIR_INODE" ]; then
  "$DEBUGFS" -w -R "set_inode_field $DIR_INODE mode 16832" "$DISK" 2>/dev/null || true
fi
if [ -n "$FILE_INODE" ]; then
  "$DEBUGFS" -w -R "set_inode_field $FILE_INODE mode 33152" "$DISK" 2>/dev/null || true
fi

rm -f "$TMP"
EJECT_DISK=$(echo "$DISK" | sed 's|/dev/rdisk|/dev/disk|' | sed 's|s2$||')
echo "Listo. Expulsa la tarjeta: diskutil eject $EJECT_DISK"
echo "Luego arranca la Raspberry y: ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedAlgorithms=+ssh-rsa pi@192.168.1.90"
