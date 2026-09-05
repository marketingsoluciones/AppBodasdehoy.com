#!/usr/bin/env bash
# Repara el caso habitual en Cursor: tener Cline Nightly junto a Cline estable.
# En los logs aparece: ReleaseVersionNotFound — la Nightly no tiene "versión de
# lanzamiento" en la galería y puede romper actualizaciones o el panel.
#
# Deja solo la extensión estable saoudrizwan.claude-dev (Cline).
#
# Tras ejecutar: cierra Cursor por completo (Cmd+Q) y vuelve a abrirlo.
#
# Si siguen errores: actualiza Cursor; revisa Output → "Extension Host";
# opcionalmente ejecuta (con Cursor cerrado): scripts/reparar-y-compactar-cursor.sh

set -euo pipefail

if ! command -v cursor >/dev/null 2>&1; then
  echo "No se encontró el comando 'cursor' en PATH. Instala/abre la CLI de Cursor."
  exit 1
fi

if cursor --list-extensions 2>/dev/null | grep -qx 'saoudrizwan.cline-nightly'; then
  echo "Desinstalando saoudrizwan.cline-nightly…"
  cursor --uninstall-extension saoudrizwan.cline-nightly
  echo "Listo."
else
  echo "saoudrizwan.cline-nightly no está instalada (correcto)."
fi

if cursor --list-extensions 2>/dev/null | grep -qx 'saoudrizwan.claude-dev'; then
  echo "Cline estable (saoudrizwan.claude-dev) ya está instalada."
else
  echo "Instalando Cline estable (saoudrizwan.claude-dev)…"
  cursor --install-extension saoudrizwan.claude-dev
fi

echo ""
echo "Reinicia Cursor (Cmd+Q) para que el host de extensiones cargue sin la Nightly."
