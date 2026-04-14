#!/usr/bin/env bash
# Repara (comprueba), compacta state.vscdb y libera espacio en datos de Cursor.
# Útil si la IA o el editor van raros o el disco está lleno.
#
# OBLIGATORIO: cierra Cursor por completo (Cursor → Salir / Cmd+Q) antes de ejecutar.

set -euo pipefail

CURSOR_SUPPORT="${HOME}/Library/Application Support/Cursor"
GLOB="${CURSOR_SUPPORT}/User/globalStorage"
DB="${GLOB}/state.vscdb"
BACKUP="${GLOB}/state.vscdb.backup"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cursor_running() {
  pgrep -f "/Applications/Cursor.app/Contents/MacOS/Cursor" >/dev/null 2>&1 \
    || pgrep -x "Cursor" >/dev/null 2>&1
}

echo "🔧 Reparar + compactar datos de Cursor"
echo ""

if cursor_running; then
  echo -e "${RED}Cursor sigue en ejecución.${NC} Ciérralo por completo y vuelve a ejecutar:"
  echo "  Cursor → Salir (Cmd+Q)"
  exit 1
fi

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo -e "${RED}No está sqlite3 en PATH.${NC} Instala Xcode CLI tools o: brew install sqlite"
  exit 1
fi

if [[ ! -f "$DB" ]]; then
  echo -e "${RED}No existe la base:${NC} $DB"
  exit 1
fi

echo "📋 Comprobando integridad de state.vscdb..."
chk="$(sqlite3 "$DB" "PRAGMA integrity_check;" 2>&1 || true)"
if [[ "$chk" != "ok" ]]; then
  echo -e "${RED}integrity_check falló:${NC}"
  echo "$chk"
  echo ""
  echo "No se ha modificado nada. Opciones: copia de seguridad Time Machine,"
  echo "o renombrar state.vscdb y dejar que Cursor cree una nueva (pierdes estado global)."
  exit 1
fi
echo -e "   ${GREEN}✓${NC} integridad: ok"

echo "📌 WAL: checkpoint y truncado (deja el .wal pequeño si había pendiente)..."
sqlite3 "$DB" "PRAGMA wal_checkpoint(TRUNCATE);" >/dev/null 2>&1 || true

echo "🗜️  Compactando (VACUUM)… puede tardar 1–2 minutos..."
sqlite3 "$DB" "VACUUM;"

if [[ -f "$BACKUP" ]]; then
  sz="$(du -sh "$BACKUP" 2>/dev/null | cut -f1)"
  echo ""
  echo -e "${YELLOW}Duplicado pesado:${NC} state.vscdb.backup ($sz)"
  read -r -p "¿Eliminar state.vscdb.backup para liberar ~1,5 GB? [s/N] " ans
  if [[ "${ans:-}" =~ ^[sSyY]$ ]]; then
    rm -f "$BACKUP"
    echo -e "   ${GREEN}✓${NC} eliminado state.vscdb.backup"
  else
    echo "   (conservado; puedes borrarlo a mano cuando quieras)"
  fi
fi

echo ""
echo "🧹 Cachés que Cursor regenera..."
for dir in "CachedData" "Cache" "Code Cache" "GPUCache" "logs"; do
  path="${CURSOR_SUPPORT}/${dir}"
  if [[ -d "$path" ]]; then
    find "$path" -mindepth 1 -maxdepth 1 -exec rm -rf {} + 2>/dev/null || true
    echo -e "   ${GREEN}✓${NC} $dir"
  fi
done

echo ""
echo -e "${GREEN}✅ Hecho.${NC} Abre Cursor de nuevo."
echo ""
echo "Si el chat IA seguía «pillado»:"
echo "  • Paleta: Developer: Reload Window"
echo "  • O cierra el proyecto y vuelve a abrirlo"
echo "  • Revisa cuenta / sesión en Cursor si fallan solo las conversaciones en la nube"
