#!/bin/bash
# SCRIPT COMPLETO BYPASS CHAMPAGNE EVENTS
# Maneja todos los escenarios: local, test, verificación, debug

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuración
CHAMPAGNE_UID="TEST_OWNER_UID_001"
CHAMPAGNE_EMAIL="test-owner@champagne-events.com.mx"
CHAMPAGNE_NAME="Test Owner"
CHAMPAGNE_DEVELOPMENT="champagne-events"

# Funciones
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}   🍾 CHAMPAGNE EVENTS BYPASS COMPLETO  ${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_step() {
    echo -e "${CYAN}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${PURPLE}💡 $1${NC}"
}

check_connectivity() {
    local url=$1
    print_step "Verificando conectividad a: $url"
    
    if curl -s --head --request GET "$url" 2>/dev/null | head -n 1 | grep -q "200"; then
        print_success "Conectividad OK: $url"
        return 0
    else
        print_error "No hay conectividad: $url"
        return 1
    fi
}

start_local_server() {
    print_step "Iniciando servidor local..."
    
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm no encontrado. Instala con: npm install -g pnpm"
        return 1
    fi
    
    # Verificar si ya está corriendo
    if ps aux | grep -E "next.*dev|node.*3220" | grep -v grep > /dev/null; then
        print_success "Servidor local ya está corriendo"
        return 0
    fi
    
    print_info "Ejecutando: pnpm dev (en background)"
    cd /Users/juancarlosparra/Projects/AppBodasdehoy.com
    
    # Iniciar en background
    pnpm dev > /tmp/champagne-dev.log 2>&1 &
    SERVER_PID=$!
    
    # Esperar a que arranque
    print_step "Esperando que el servidor arranque (10 segundos)..."
    sleep 10
    
    # Verificar
    if check_connectivity "http://localhost:3220"; then
        print_success "Servidor local iniciado (PID: $SERVER_PID)"
        echo "Logs: /tmp/champagne-dev.log"
        return 0
    else
        print_error "No se pudo iniciar servidor local"
        echo "Revisa logs: /tmp/champagne-dev.log"
        return 1
    fi
}

test_local_bypass() {
    print_step "Probando bypass local (localhost:3220)..."
    
    local url="http://localhost:3220/api/dev/bypass?email=${CHAMPAGNE_EMAIL}&development=${CHAMPAGNE_DEVELOPMENT}&uid=${CHAMPAGNE_UID}"
    
    print_info "URL local: $url"
    
    if check_connectivity "http://localhost:3220"; then
        print_warning "⚠️  ATENCIÓN: Bypass local NO funciona según código AuthContext"
        print_warning "   El bypass solo funciona en entornos test (app-test, chat-test)"
        print_info "   Pero puedes probar igual..."
        
        echo -e "${YELLOW}🌐 Abriendo bypass local...${NC}"
        open "$url" 2>/dev/null || echo "Abre manualmente: $url"
        
        return 0
    else
        print_error "Servidor local no disponible"
        return 1
    fi
}

test_champagne_bypass() {
    print_step "Probando bypass champagne events (app-test)..."
    
    local url="https://app-test.champagne-events.com.mx/api/dev/bypass?email=${CHAMPAGNE_EMAIL}&development=${CHAMPAGNE_DEVELOPMENT}&uid=${CHAMPAGNE_UID}"
    
    print_info "URL champagne: $url"
    
    if check_connectivity "https://app-test.champagne-events.com.mx"; then
        print_success "✅ Conectividad a champagne events OK"
        print_info "🎯 Esta URL SÍ funciona (entorno test)"
        
        echo -e "${GREEN}🌐 Abriendo bypass champagne events...${NC}"
        open "$url" 2>/dev/null || echo "Abre manualmente: $url"
        
        return 0
    else
        print_error "No hay conectividad a champagne events"
        print_warning "Posibles causas:"
        print_warning "1. VPN no conectada"
        print_warning "2. Dominio incorrecto"
        print_warning "3. Servicio caído"
        return 1
    fi
}

verify_bypass() {
    print_step "Verificación del bypass"
    
    cat << 'EOF'

📋 PARA VERIFICAR MANUALMENTE:

1. Después de abrir el bypass, en consola (F12) ejecuta:

// Verificar bypass activado
console.log('=== VERIFICACIÓN BYPASS ===');
console.log('dev_bypass:', localStorage.getItem('dev_bypass'));
console.log('dev_bypass_email:', localStorage.getItem('dev_bypass_email'));
console.log('dev_bypass_uid:', localStorage.getItem('dev_bypass_uid'));
console.log('__dev_domain:', localStorage.getItem('__dev_domain'));

// Verificar entorno
const hostname = window.location.hostname;
const isTestEnv = hostname.includes('chat-test') || 
                 hostname.includes('app-test') || 
                 hostname.includes('test.') || 
                 hostname.includes('app-dev');
console.log('Hostname:', hostname);
console.log('isTestEnv:', isTestEnv);
console.log('=== FIN VERIFICACIÓN ===');

2. Refresca la página (F5)

3. Verifica login exitoso:
   - Nombre "Test Owner" en esquina superior derecha
   - Tema champagne events (colores beige/marrón)
   - Evento "juanito" visible

EOF
}

run_e2e_test() {
    print_step "Ejecutando prueba E2E básica..."
    
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm no encontrado"
        return 1
    fi
    
    cd /Users/juancarlosparra/Projects/AppBodasdehoy.com
    
    print_info "Ejecutando: pnpm test:e2e:app:ver:local"
    
    # Ejecutar test E2E
    if pnpm test:e2e:app:ver:local 2>&1 | tee /tmp/champagne-e2e.log; then
        print_success "✅ Prueba E2E completada"
        return 0
    else
        print_error "❌ Prueba E2E falló"
        echo "Revisa logs: /tmp/champagne-e2e.log"
        return 1
    fi
}

show_quick_commands() {
    print_step "Comandos rápidos para debug"
    
    cat << 'EOF'

🔧 COMANDOS RÁPIDOS:

# Verificar conectividad
curl -I https://app-test.champagne-events.com.mx
curl -I http://localhost:3220

# Verificar servidor local
ps aux | grep -E "next.*dev|node.*3220" | grep -v grep

# Iniciar servidor local
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com
pnpm dev

# Scripts disponibles
./scripts/test-bypass-champagne-debug.sh
./scripts/bypass-champagne-now.sh
open scripts/test-champagne-bypass.html

# Test E2E
pnpm test:e2e:app:ver:local
pnpm test:e2e:mesas:dev

EOF
}

show_summary() {
    print_step "Resumen de la solución"
    
    cat << 'EOF'

🎯 RESUMEN DE LA SOLUCIÓN:

✅ PROBLEMA 1: Bypass no funciona en localhost
   SOLUCIÓN: Usar app-test.champagne-events.com.mx

✅ PROBLEMA 2: No hace login real  
   SOLUCIÓN: AuthContext detecta bypass en entornos test

✅ PROBLEMA 3: Mensajes no llegan
   SOLUCIÓN: Usar datos REALES de fixtures (TEST_OWNER_UID_001)

📊 DATOS USADOS:
   • UID: TEST_OWNER_UID_001 (de fixtures champagne-events)
   • Email: test-owner@champagne-events.com.mx
   • Development: champagne-events
   • Entorno: app-test.champagne-events.com.mx

🚀 URL QUE SÍ FUNCIONA:
   https://app-test.champagne-events.com.mx/api/dev/bypass?email=test-owner@champagne-events.com.mx&development=champagne-events&uid=TEST_OWNER_UID_001

EOF
}

# Menú principal
main() {
    print_header
    
    echo -e "${GREEN}Selecciona una opción:${NC}"
    echo "1) Probar bypass champagne events (app-test) - RECOMENDADO"
    echo "2) Probar bypass local (localhost) - NO funciona según código"
    echo "3) Iniciar servidor local + probar bypass"
    echo "4) Ejecutar prueba E2E"
    echo "5) Verificar conectividad"
    echo "6) Mostrar comandos rápidos"
    echo "7) Mostrar resumen solución"
    echo "8) Salir"
    echo ""
    
    read -p "Opción [1-8]: " option
    
    case $option in
        1)
            test_champagne_bypass
            verify_bypass
            ;;
        2)
            test_local_bypass
            verify_bypass
            ;;
        3)
            start_local_server
            test_local_bypass
            verify_bypass
            ;;
        4)
            run_e2e_test
            ;;
        5)
            check_connectivity "https://app-test.champagne-events.com.mx"
            check_connectivity "http://localhost:3220"
            ;;
        6)
            show_quick_commands
            ;;
        7)
            show_summary
            ;;
        8)
            echo "👋 ¡Hasta luego!"
            exit 0
            ;;
        *)
            print_error "Opción inválida"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}¿Deseas realizar otra acción? (s/n)${NC}"
    read -p "" continue
    
    if [[ "$continue" == "s" || "$continue" == "S" ]]; then
        main
    else
        echo "👋 ¡Hasta luego!"
    fi
}

# Ejecutar
main "$@"