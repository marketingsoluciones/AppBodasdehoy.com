#!/bin/bash
# VERIFICAR LOGIN Y NOTIFICACIONES CHAMPAGNE EVENTS
# Comprueba si el bypass funciona y si las notificaciones llegan

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}   🔍 VERIFICAR LOGIN Y NOTIFICACIONES  ${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
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

verificar_localstorage() {
    print_step "1. Verificando localStorage..."
    
    cat << 'EOF'

📋 EJECUTA EN CONSOLA (F12):

// ===== VERIFICACIÓN LOCALSTORAGE =====
console.log('=== LOCALSTORAGE ===');
console.log('1. dev_bypass:', localStorage.getItem('dev_bypass'));
console.log('2. dev_bypass_email:', localStorage.getItem('dev_bypass_email'));
console.log('3. dev_bypass_uid:', localStorage.getItem('dev_bypass_uid'));
console.log('4. __dev_domain:', localStorage.getItem('__dev_domain'));

// Verificar si está configurado correctamente
const bypassOk = localStorage.getItem('dev_bypass') === 'true' &&
                 localStorage.getItem('dev_bypass_email') &&
                 localStorage.getItem('__dev_domain') === 'champagne-events';

console.log('✅ Bypass configurado:', bypassOk ? 'SÍ' : 'NO');

if (!bypassOk) {
    console.error('❌ Bypass NO configurado. Ejecuta:');
    console.error('   https://app-test.champagne-events.com.mx/api/dev/bypass?email=test-owner@champagne-events.com.mx&development=champagne-events&uid=TEST_OWNER_UID_001');
}
EOF
}

verificar_login() {
    print_step "2. Verificando login..."
    
    cat << 'EOF'

📋 EJECUTA EN CONSOLA (F12):

// ===== VERIFICACIÓN LOGIN =====
console.log('=== LOGIN ===');

// Verificar usuario actual
const user = window.__user || window.__NEXT_DATA__?.props?.pageProps?.user;
console.log('1. Usuario actual:', user);

// Verificar si hay sesión
const hasSession = !!user;
console.log('2. ¿Tiene sesión?:', hasSession ? '✅ SÍ' : '❌ NO');

if (hasSession) {
    console.log('3. Detalles usuario:');
    console.log('   • Email:', user.email);
    console.log('   • Nombre:', user.displayName);
    console.log('   • UID:', user.uid);
    console.log('   • Rol:', user.role);
} else {
    console.error('❌ NO hay sesión. Refresca la página (F5)');
    console.error('   El AuthContext debe detectar el bypass y crear usuario');
}

// Verificar entorno
const hostname = window.location.hostname;
const isTestEnv = hostname.includes('chat-test') || 
                 hostname.includes('app-test') || 
                 hostname.includes('test.') || 
                 hostname.includes('app-dev');
console.log('4. Entorno test:', isTestEnv ? '✅ SÍ' : '❌ NO');
console.log('5. Hostname:', hostname);
EOF
}

verificar_notificaciones() {
    print_step "3. Verificando notificaciones..."
    
    cat << 'EOF'

📋 EJECUTA EN CONSOLA (F12):

// ===== VERIFICACIÓN NOTIFICACIONES =====
console.log('=== NOTIFICACIONES ===');

// Verificar si hay API de notificaciones
const hasNotificationsAPI = typeof window.Notification !== 'undefined';
console.log('1. API Notificaciones disponible:', hasNotificationsAPI ? '✅ SÍ' : '❌ NO');

// Verificar permisos
if (hasNotificationsAPI) {
    Notification.requestPermission().then(permission => {
        console.log('2. Permiso notificaciones:', permission);
    });
}

// Verificar icono de campana (UI)
const bellIcon = document.querySelector('[class*="bell"], [class*="notification"], svg[class*="bell"]');
console.log('3. Icono campana encontrado:', bellIcon ? '✅ SÍ' : '❌ NO');

if (bellIcon) {
    console.log('4. Click en icono para ver notificaciones');
    // bellIcon.click(); // Descomenta para hacer click automático
}

// Verificar contador de notificaciones
const notificationCount = document.querySelector('[class*="badge"], [class*="count"], [class*="notification-count"]');
console.log('5. Contador notificaciones:', notificationCount ? notificationCount.textContent : 'No encontrado');

// Verificar si hay eventos (para enviar notificaciones)
console.log('6. Para probar notificaciones:');
console.log('   • Ve a la sección de invitados');
console.log('   • Busca "QA-COORG-Ev1-Inv1"');
console.log('   • Envía un mensaje de prueba');
console.log('   • Verifica si llega notificación');
EOF
}

verificar_eventos() {
    print_step "4. Verificando eventos champagne..."
    
    cat << 'EOF'

📋 EJECUTA EN CONSOLA (F12):

// ===== VERIFICACIÓN EVENTOS =====
console.log('=== EVENTOS CHAMPAGNE ===');

// Verificar si hay eventos cargados
try {
    // Intentar acceder a datos de eventos
    const eventsData = window.__NEXT_DATA__?.props?.pageProps?.events ||
                      window.__events ||
                      window.__userEvents;
    
    console.log('1. Datos eventos:', eventsData ? '✅ Encontrados' : '❌ No encontrados');
    
    if (eventsData && Array.isArray(eventsData)) {
        console.log('2. Número de eventos:', eventsData.length);
        console.log('3. Primer evento:', eventsData[0]?.nombre || 'Sin nombre');
        console.log('4. Tipo evento:', eventsData[0]?.tipo || 'Sin tipo');
        
        // Verificar evento "juanito" (de fixtures)
        const juanitoEvent = eventsData.find(e => e.nombre === 'juanito');
        console.log('5. Evento "juanito":', juanitoEvent ? '✅ Encontrado' : '❌ No encontrado');
    }
} catch (error) {
    console.error('Error verificando eventos:', error.message);
}

// Verificar tema champagne events
const bodyClasses = document.body.className;
const hasChampagneTheme = bodyClasses.includes('champagne') || 
                         bodyClasses.includes('champagne-events') ||
                         document.documentElement.style.getPropertyValue('--primary-color') ||
                         document.querySelector('[class*="champagne"]');
console.log('6. Tema champagne:', hasChampagneTheme ? '✅ Detectado' : '❌ No detectado');

// Verificar colores (beige/marrón)
const computedStyle = window.getComputedStyle(document.body);
const bgColor = computedStyle.backgroundColor;
console.log('7. Color fondo:', bgColor);
console.log('   (Debería ser beige/marrón para champagne events)');
EOF
}

test_envio_notificacion() {
    print_step "5. Test envío notificación..."
    
    cat << 'EOF'

📋 PARA PROBAR ENVÍO DE NOTIFICACIÓN:

1. Ve a: https://app-test.champagne-events.com.mx/invitados
2. Busca invitado: "QA-COORG-Ev1-Inv1" (jcc+ev1inv1@bodasdehoy.com)
3. Haz clic en el invitado
4. Envía mensaje de prueba:

// En consola, prueba este código:
async function enviarMensajePrueba() {
    try {
        console.log('📨 Enviando mensaje de prueba...');
        
        const response = await fetch('/api/invitados/mensaje', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                invitado_id: 'INVITADO_ID', // Reemplaza con ID real
                mensaje: '🔔 TEST: Este es un mensaje de prueba para verificar notificaciones',
                tipo: 'whatsapp' // o 'email', 'sms'
            })
        });
        
        const result = await response.json();
        console.log('✅ Resultado:', result);
        
        if (result.success) {
            console.log('🎉 Mensaje enviado. Debería llegar notificación.');
            console.log('🔔 Verifica:');
            console.log('   • Icono campana (debería tener notificación)');
            console.log('   • Lista de notificaciones');
            console.log('   • Email/SMS/WhatsApp del usuario');
        } else {
            console.error('❌ Error enviando mensaje:', result.error);
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Ejecutar test
// enviarMensajePrueba();
EOF
}

resumen_solucion() {
    print_step "📋 RESUMEN DE LA SOLUCIÓN"
    
    cat << 'EOF'

🎯 PROBLEMA ORIGINAL:
   • Bypass no hace login visible
   • No se ven notificaciones

✅ SOLUCIÓN IMPLEMENTADA:

1. 🎯 USAR DATOS REALES:
   • UID: TEST_OWNER_UID_001 (de fixtures champagne-events)
   • Email: test-owner@champagne-events.com.mx
   • Development: champagne-events

2. 🎯 USAR ENTORNO CORRECTO:
   • URL: https://app-test.champagne-events.com.mx
   • NO localhost (no funciona según código AuthContext)

3. 🎯 PASOS PARA VERIFICAR:

   A. ACTIVAR BYPASS:
      https://app-test.champagne-events.com.mx/api/dev/bypass?email=test-owner@champagne-events.com.mx&development=champagne-events&uid=TEST_OWNER_UID_001

   B. VERIFICAR LOCALSTORAGE (F12):
      • dev_bypass debe ser 'true'
      • dev_bypass_email debe ser correcto
      • __dev_domain debe ser 'champagne-events'

   C. REFRESCAR PÁGINA (F5):
      • AuthContext detecta bypass
      • Crea usuario simulado

   D. VERIFICAR LOGIN:
      • Debe aparecer "Test Owner" arriba a la derecha
      • Tema champagne events (colores beige/marrón)
      • Evento "juanito" visible

   E. PROBAR NOTIFICACIONES:
      • Ve a invitados
      • Envía mensaje a "QA-COORG-Ev1-Inv1"
      • Verifica icono campana

4. 🎯 SI NO FUNCIONA:

   ❌ PROBLEMA: No se ve login
      SOLUCIÓN: Verificar que estás en app-test.champagne-events.com.mx (NO localhost)

   ❌ PROBLEMA: No hay eventos
      SOLUCIÓN: El usuario TEST_OWNER_UID_001 debe tener eventos en fixtures

   ❌ PROBLEMA: No llegan notificaciones
      SOLUCIÓN: Verificar que el mensaje se envía correctamente

🔗 URL DEFINITIVA QUE SÍ FUNCIONA:
   https://app-test.champagne-events.com.mx/api/dev/bypass?email=test-owner@champagne-events.com.mx&development=champagne-events&uid=TEST_OWNER_UID_001
EOF
}

main() {
    print_header
    
    echo -e "${GREEN}Este script te ayuda a VERIFICAR si el login funciona y si llegan notificaciones${NC}"
    echo ""
    
    echo -e "${YELLOW}Selecciona qué quieres verificar:${NC}"
    echo "1) Verificar localStorage (paso 1)"
    echo "2) Verificar login (paso 2)"
    echo "3) Verificar notificaciones (paso 3)"
    echo "4) Verificar eventos champagne (paso 4)"
    echo "5) Test envío notificación (paso 5)"
    echo "6) Ver resumen solución completa"
    echo "7) Todas las verificaciones"
    echo "8) Salir"
    echo ""
    
    read -p "Opción [1-8]: " option
    
    case $option in
        1)
            verificar_localstorage
            ;;
        2)
            verificar_login
            ;;
        3)
            verificar_notificaciones
            ;;
        4)
            verificar_eventos
            ;;
        5)
            test_envio_notificacion
            ;;
        6)
            resumen_solucion
            ;;
        7)
            verificar_localstorage
            echo ""
            verificar_login
            echo ""
            verificar_notificaciones
            echo ""
            verificar_eventos
            echo ""
            test_envio_notificacion
            echo ""
            resumen_solucion
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
    echo -e "${GREEN}¿Deseas realizar otra verificación? (s/n)${NC}"
    read -p "" continue
    
    if [[ "$continue" == "s" || "$continue" == "S" ]]; then
        main
    else
        echo "👋 ¡Hasta luego!"
    fi
}

# Ejecutar
main "$@"