#!/bin/bash
# SOLUCIÓN COMPLETA LOCAL SIN VPN - Champagne Events
# Funciona SIN app-test.champagne-events.com.mx

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}   🚀 SOLUCIÓN LOCAL SIN VPN           ${NC}"
    echo -e "${BLUE}   🍾 Champagne Events                 ${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_step() {
    echo -e "${CYAN}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${PURPLE}💡 $1${NC}"
}

check_server_running() {
    print_step "Verificando servidor local..."
    
    if ps aux | grep -E "next.*dev|node.*3220" | grep -v grep > /dev/null; then
        print_success "Servidor local corriendo"
        return 0
    else
        print_error "Servidor local NO corriendo"
        return 1
    fi
}

start_local_server() {
    print_step "Iniciando servidor local..."
    
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm no encontrado. Instala con: npm install -g pnpm"
        return 1
    fi
    
    cd /Users/juancarlosparra/Projects/AppBodasdehoy.com
    
    print_info "Ejecutando: pnpm dev (en background)"
    
    # Iniciar en background
    pnpm dev > /tmp/champagne-local.log 2>&1 &
    SERVER_PID=$!
    
    # Esperar a que arranque
    print_step "Esperando que el servidor arranque (15 segundos)..."
    sleep 15
    
    # Verificar
    if curl -s http://localhost:3220 > /dev/null; then
        print_success "Servidor local iniciado (PID: $SERVER_PID)"
        print_info "Logs: /tmp/champagne-local.log"
        return 0
    else
        print_error "No se pudo iniciar servidor local"
        print_info "Revisa logs: /tmp/champagne-local.log"
        return 1
    fi
}

fix_authcontext_for_localhost() {
    print_step "Modificando AuthContext para permitir bypass en localhost..."
    
    cd /Users/juancarlosparra/Projects/AppBodasdehoy.com
    
    # Verificar si ya está modificado
    if grep -q "window.location.hostname.includes('localhost')" apps/appEventos/context/AuthContext.tsx; then
        print_success "AuthContext YA modificado para localhost"
        return 0
    fi
    
    # Crear backup
    cp apps/appEventos/context/AuthContext.tsx apps/appEventos/context/AuthContext.tsx.backup
    print_success "Backup creado: apps/appEventos/context/AuthContext.tsx.backup"
    
    # Modificar línea específica (línea 296)
    sed -i '' "s/const isTestEnv = window.location.hostname.includes('chat-test') || window.location.hostname.includes('app-test') || window.location.hostname.includes('test.') || window.location.hostname.includes('app-dev')/const isTestEnv = window.location.hostname.includes('chat-test') || window.location.hostname.includes('app-test') || window.location.hostname.includes('test.') || window.location.hostname.includes('app-dev') || window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')/" apps/appEventos/context/AuthContext.tsx
    
    if [ $? -eq 0 ]; then
        print_success "✅ AuthContext modificado exitosamente"
        print_info "Ahora el bypass funcionará en localhost:3220"
        return 0
    else
        print_error "❌ Error modificando AuthContext"
        return 1
    fi
}

restore_authcontext() {
    print_step "Restaurando AuthContext original..."
    
    cd /Users/juancarlosparra/Projects/AppBodasdehoy.com
    
    if [ -f "apps/appEventos/context/AuthContext.tsx.backup" ]; then
        cp apps/appEventos/context/AuthContext.tsx.backup apps/appEventos/context/AuthContext.tsx
        print_success "AuthContext restaurado desde backup"
        
        # Opcional: eliminar backup
        rm apps/appEventos/context/AuthContext.tsx.backup
        print_info "Backup eliminado"
        return 0
    else
        print_warning "No hay backup para restaurar"
        return 1
    fi
}

activate_local_bypass() {
    print_step "Activando bypass local..."
    
    local url="http://localhost:3220/api/dev/bypass?email=test-owner@champagne-events.com.mx&development=champagne-events&uid=TEST_OWNER_UID_001"
    
    print_info "URL bypass local:"
    echo -e "${GREEN}$url${NC}"
    echo ""
    
    print_info "🌐 Abriendo bypass en navegador..."
    open "$url" 2>/dev/null || echo "Abre manualmente: $url"
    
    echo ""
    print_info "📋 Instrucciones después de abrir el bypass:"
    echo "1. Espera a que cargue la página"
    echo "2. Abre consola (F12)"
    echo "3. Ejecuta el código de verificación (paso siguiente)"
    echo "4. Refresca página (F5)"
}

show_verification_code() {
    print_step "Código de verificación (ejecuta en consola F12):"
    
    cat << 'EOF'

// ===== VERIFICACIÓN LOCALHOST =====
console.log('=== VERIFICACIÓN LOCALHOST ===');

// 1. Verificar localStorage
console.log('1. localStorage:');
console.log('   • dev_bypass:', localStorage.getItem('dev_bypass'));
console.log('   • dev_bypass_email:', localStorage.getItem('dev_bypass_email'));
console.log('   • dev_bypass_uid:', localStorage.getItem('dev_bypass_uid'));
console.log('   • __dev_domain:', localStorage.getItem('__dev_domain'));

const bypassOk = localStorage.getItem('dev_bypass') === 'true' &&
                 localStorage.getItem('dev_bypass_email') &&
                 localStorage.getItem('__dev_domain') === 'champagne-events';
console.log('   ✅ Bypass configurado:', bypassOk ? 'SÍ' : 'NO');

// 2. Verificar entorno
console.log('2. Entorno:');
console.log('   • Hostname:', window.location.hostname);
console.log('   • isTestEnv (modificado):', window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1'));

// 3. Refrescar página
console.log('3. ✅ Ahora refresca la página (F5) para que AuthContext detecte el bypass');

// 4. Después de refrescar, verificar usuario
console.log('4. Después de refrescar, ejecuta:');
console.log('   console.log("Usuario:", window.__user || window.__NEXT_DATA__?.props?.pageProps?.user);');
console.log('   console.log("Nombre visible:", document.querySelector(\'[class*="profile"], [class*="user"]\')?.textContent);');
EOF
}

test_local_functionality() {
    print_step "Probando funcionalidad local..."
    
    cat << 'EOF'

🎯 PARA PROBAR QUE FUNCIONA:

1. ✅ LOGIN:
   • Debe aparecer "Test Owner" arriba a la derecha
   • Tema champagne events (colores beige/marrón)

2. ✅ EVENTOS:
   • Ve a la página principal
   • Debe verse evento "juanito" (comunión)
   • Los eventos vienen de fixtures champagne-events

3. ✅ INVITADOS:
   • Ve a: http://localhost:3220/invitados
   • Busca "QA-COORG-Ev1-Inv1"
   • Debe aparecer el invitado de test

4. ✅ NOTIFICACIONES:
   • Envía mensaje de prueba al invitado
   • Verifica icono campana 🔔
   • Las notificaciones deberían funcionar

📊 DATOS USADOS:
   • UID: TEST_OWNER_UID_001 (owner real en fixtures)
   • Email: test-owner@champagne-events.com.mx
   • Development: champagne-events
   • Entorno: localhost:3220

🔗 URLS LOCALES:
   • App: http://localhost:3220
   • Invitados: http://localhost:3220/invitados
   • Eventos: http://localhost:3220/eventos
   • Mensajes: http://localhost:3220/mensajes
EOF
}

show_quick_test() {
    print_step "Test rápido de conectividad..."
    
    echo ""
    echo -e "${YELLOW}Ejecuta estos comandos en terminal:${NC}"
    echo ""
    echo "1. Verificar servidor:"
    echo "   curl -I http://localhost:3220"
    echo ""
    echo "2. Verificar bypass endpoint:"
    echo "   curl -I \"http://localhost:3220/api/dev/bypass?email=test-owner@champagne-events.com.mx\""
    echo ""
    echo "3. Verificar eventos API:"
    echo "   curl -s \"http://localhost:3220/api/eventos\" | head -20"
    echo ""
    echo "4. Verificar fixtures champagne:"
    echo "   ls -la e2e-app/fixtures/champagne-events/"
    echo ""
}

create_test_html() {
    print_step "Creando página de test local..."
    
    cat > /tmp/test-champagne-local.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>🍾 Test Local Champagne Events</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5dc; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        h1 { color: #8b4513; }
        .button { display: inline-block; background: #8b4513; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; margin: 10px 5px; }
        .button:hover { background: #a0522d; }
        .code { background: #2d2d2d; color: white; padding: 15px; border-radius: 5px; font-family: monospace; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🍾 Test Local Champagne Events</h1>
        <p>Esta página te ayuda a probar el bypass en localhost</p>
        
        <h2>🚀 Paso 1: Activar Bypass</h2>
        <a class="button" href="http://localhost:3220/api/dev/bypass?email=test-owner@champagne-events.com.mx&development=champagne-events&uid=TEST_OWNER_UID_001" target="_blank">
            Activar Bypass Local
        </a>
        
        <h2>🔍 Paso 2: Verificar en Consola (F12)</h2>
        <div class="code">
// Ejecuta en consola:
console.log('dev_bypass:', localStorage.getItem('dev_bypass'));
console.log('dev_bypass_email:', localStorage.getItem('dev_bypass_email'));
console.log('__dev_domain:', localStorage.getItem('__dev_domain'));
        </div>
        
        <h2>🔄 Paso 3: Refrescar Página</h2>
        <p>Después de activar bypass, refresca la página (F5)</p>
        
        <h2>✅ Paso 4: Verificar Login</h2>
        <a class="button" href="http://localhost:3220" target="_blank">
            Ir a App Local
        </a>
        
        <h2>📊 Verificar Eventos</h2>
        <a class="button" href="http://localhost:3220/eventos" target="_blank">
            Ver Eventos
        </a>
        
        <h2>👥 Verificar Invitados</h2>
        <a class="button" href="http://localhost:3220/invitados" target="_blank">
            Ver Invitados
        </a>
    </div>
    
    <script>
        // Auto-detección de localhost
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('✅ Estás en localhost - El bypass debería funcionar');
        }
    </script>
</body>
</html>
EOF
    
    print_success "Página de test creada: /tmp/test-champagne-local.html"
    print_info "Ábrela con: open /tmp/test-champagne-local.html"
}

main_menu() {
    print_header
    
    echo -e "${GREEN}Selecciona una opción:${NC}"
    echo "1) Solución COMPLETA (recomendado)"
    echo "2) Solo modificar AuthContext para localhost"
    echo "3) Solo iniciar servidor local"
    echo "4) Solo activar bypass local"
    echo "5) Verificar estado actual"
    echo "6) Restaurar AuthContext original"
    echo "7) Crear página de test"
    echo "8) Mostrar instrucciones detalladas"
    echo "9) Salir"
    echo ""
    
    read -p "Opción [1-9]: " option
    
    case $option in
        1)
            # Solución completa
            check_server_running || start_local_server
            fix_authcontext_for_localhost
            activate_local_bypass
            show_verification_code
            test_local_functionality
            ;;
        2)
            # Solo modificar AuthContext
            fix_authcontext_for_localhost
            ;;
        3)
            # Solo iniciar servidor
            check_server_running || start_local_server
            ;;
        4)
            # Solo activar bypass
            activate_local_bypass
            show_verification_code
            ;;
        5)
            # Verificar estado
            check_server_running
            if grep -q "window.location.hostname.includes('localhost')" apps/appEventos/context/AuthContext.tsx 2>/dev/null; then
                print_success "AuthContext modificado para localhost"
            else
                print_error "AuthContext NO modificado para localhost"
            fi
            ;;
        6)
            # Restaurar original
            restore_authcontext
            ;;
        7)
            # Crear página test
            create_test_html
            ;;
        8)
            # Instrucciones detalladas
            show_verification_code
            echo ""
            test_local_functionality
            echo ""
            show_quick_test
            ;;
        9)
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
        main_menu
    else
        echo "👋 ¡Hasta luego!"
    fi
}

# Ejecutar menú principal
main_menu "$@"