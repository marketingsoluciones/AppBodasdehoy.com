#!/bin/bash
# Script para configurar mantenimiento automático

set -e

echo "⚙️  CONFIGURACIÓN DE MANTENIMIENTO AUTOMÁTICO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR=$(pwd)
SCRIPT_PATH="$PROJECT_DIR/scripts/mantenimiento-automatico.sh"

echo "Este script te ayudará a configurar el mantenimiento automático."
echo ""

# Verificar si el script existe
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Error: No se encuentra el script de mantenimiento"
    exit 1
fi

echo "📋 Opciones disponibles:"
echo ""
echo "1. Crear alias para ejecución rápida"
echo "2. Crear recordatorio en calendario (macOS)"
echo "3. Crear script de ejecución manual"
echo "4. Ver configuración actual"
echo ""

read -p "Selecciona una opción (1-4): " opcion

case $opcion in
    1)
        echo ""
        echo "📝 Agregando alias a ~/.zshrc..."
        
        ALIAS_LINE="alias mantenimiento-bodas='cd $PROJECT_DIR && ./scripts/mantenimiento-automatico.sh'"
        
        if ! grep -q "mantenimiento-bodas" ~/.zshrc 2>/dev/null; then
            echo "" >> ~/.zshrc
            echo "# Mantenimiento automático AppBodasdehoy" >> ~/.zshrc
            echo "$ALIAS_LINE" >> ~/.zshrc
            echo "✅ Alias agregado"
            echo ""
            echo "💡 Ejecuta: source ~/.zshrc"
            echo "   Luego podrás usar: mantenimiento-bodas"
        else
            echo "⚠️  El alias ya existe"
        fi
        ;;
        
    2)
        echo ""
        echo "📅 Creando recordatorio en calendario (macOS)..."
        
        # Crear un script que se puede programar
        CALENDAR_SCRIPT="$PROJECT_DIR/scripts/mantenimiento-calendario.sh"
        cat > "$CALENDAR_SCRIPT" << SCRIPT
#!/bin/bash
cd "$PROJECT_DIR"
./scripts/mantenimiento-automatico.sh
SCRIPT
        chmod +x "$CALENDAR_SCRIPT"
        
        echo "✅ Script creado: $CALENDAR_SCRIPT"
        echo ""
        echo "💡 Para programar en macOS:"
        echo "   1. Abre 'Calendario'"
        echo "   2. Crea un evento nuevo"
        echo "   3. Configura alerta: 'Ejecutar script'"
        echo "   4. Selecciona: $CALENDAR_SCRIPT"
        echo "   5. Repetir: Semanalmente"
        ;;
        
    3)
        echo ""
        echo "📝 Creando script de ejecución rápida..."
        
        QUICK_SCRIPT="$HOME/bin/mantenimiento-bodas"
        mkdir -p "$HOME/bin"
        
        cat > "$QUICK_SCRIPT" << SCRIPT
#!/bin/bash
cd "$PROJECT_DIR"
./scripts/mantenimiento-automatico.sh
SCRIPT
        chmod +x "$QUICK_SCRIPT"
        
        echo "✅ Script creado: $QUICK_SCRIPT"
        echo ""
        echo "💡 Agrega ~/bin a tu PATH si no está:"
        echo "   export PATH=\"\$HOME/bin:\$PATH\""
        echo ""
        echo "   Luego podrás ejecutar desde cualquier lugar:"
        echo "   mantenimiento-bodas"
        ;;
        
    4)
        echo ""
        echo "📋 Configuración actual:"
        echo ""
        echo "   Script de mantenimiento: $SCRIPT_PATH"
        echo "   Directorio del proyecto: $PROJECT_DIR"
        echo ""
        
        if grep -q "mantenimiento-bodas" ~/.zshrc 2>/dev/null; then
            echo "   ✅ Alias configurado en ~/.zshrc"
        else
            echo "   ⚠️  Alias no configurado"
        fi
        
        if [ -f "$HOME/bin/mantenimiento-bodas" ]; then
            echo "   ✅ Script rápido en ~/bin"
        else
            echo "   ⚠️  Script rápido no configurado"
        fi
        ;;
        
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac

echo ""
echo "${GREEN}✅ Configuración completada!${NC}"
echo ""
