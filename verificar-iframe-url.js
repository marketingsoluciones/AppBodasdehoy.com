/**
 * Script de Verificación del Iframe del Copilot
 *
 * INSTRUCCIONES:
 * 1. Abrir http://localhost:8080 en el navegador
 * 2. Presionar Cmd+Shift+R (Mac) o Ctrl+Shift+R (Windows) para HARD REFRESH
 * 3. Abrir DevTools (F12)
 * 4. Click en el botón "Copilot" para abrir el sidebar
 * 5. Ir a la pestaña "Console" en DevTools
 * 6. Copiar y pegar este script completo
 * 7. Presionar Enter
 */

console.clear();
console.log('═══════════════════════════════════════════════════');
console.log('🔍 VERIFICACIÓN DEL IFRAME DEL COPILOT');
console.log('═══════════════════════════════════════════════════\n');

// 1. Verificar información del entorno
console.log('1️⃣ INFORMACIÓN DEL ENTORNO:');
console.log('   window.location.href:', window.location.href);
console.log('   window.location.hostname:', window.location.hostname);
console.log('   Debería usar localhost:3210:',
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
);
console.log('');

// 2. Buscar el iframe del Copilot
console.log('2️⃣ BUSCANDO IFRAME DEL COPILOT:');
const iframe = document.querySelector('iframe[title="LobeChat Copilot"]');

if (!iframe) {
  console.error('   ❌ ERROR: No se encontró el iframe del Copilot');
  console.log('   💡 SOLUCIÓN: ¿Abriste el sidebar haciendo click en "Copilot"?');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
} else {
  console.log('   ✅ Iframe encontrado');
  console.log('');

  // 3. Verificar URL del iframe
  console.log('3️⃣ URL DEL IFRAME:');
  console.log('   src:', iframe.src);

  const expectedBase = 'http://localhost:3210';
  const hasCorrectBase = iframe.src.startsWith(expectedBase);
  const hasTimestamp = iframe.src.includes('?t=');

  console.log('   ✅ Base URL correcta:', hasCorrectBase ? '✅ SÍ' : '❌ NO');
  console.log('   ✅ Tiene timestamp (cache-bust):', hasTimestamp ? '✅ SÍ' : '❌ NO');
  console.log('');

  // 4. Verificar dimensiones del iframe
  console.log('4️⃣ DIMENSIONES DEL IFRAME:');
  console.log('   width:', iframe.style.width || iframe.width);
  console.log('   height:', iframe.style.height || iframe.height);
  console.log('');

  // 5. Intentar acceder al contenido del iframe
  console.log('5️⃣ CONTENIDO DEL IFRAME:');
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    const iframeUrl = iframeDoc.location.href;
    const iframeTitle = iframeDoc.title;

    console.log('   URL del documento:', iframeUrl);
    console.log('   Título del documento:', iframeTitle);
    console.log('');

    // Verificar que NO contiene elementos de bodasdehoy.com
    const hasBodaHeader = iframeDoc.querySelector('[class*="header"]')?.textContent?.includes('bodas');
    const hasChatDebug = iframeDoc.body.textContent.includes('Prueba eventos, largo array');
    const hasAquiMensaje = iframeDoc.body.textContent.includes('aqui el mensaje');

    console.log('6️⃣ VERIFICACIÓN DE CONTENIDO:');
    console.log('   ❌ Tiene header de bodasdehoy:', hasBodaHeader ? '❌ SÍ (MALO)' : '✅ NO (BUENO)');
    console.log('   ❌ Tiene "Prueba eventos, largo array":', hasChatDebug ? '❌ SÍ (MALO)' : '✅ NO (BUENO)');
    console.log('   ❌ Tiene "aqui el mensaje":', hasAquiMensaje ? '❌ SÍ (MALO)' : '✅ NO (BUENO)');
    console.log('');

    if (!hasBodaHeader && !hasChatDebug && !hasAquiMensaje) {
      console.log('🎉 ✅ ¡ÉXITO! El iframe muestra LobeChat PURO correctamente');
    } else {
      console.warn('⚠️ PROBLEMA: El iframe todavía muestra contenido viejo');
      console.log('');
      console.log('💡 SOLUCIONES:');
      console.log('   1. Hacer HARD REFRESH: Cmd+Shift+R (Mac) o Ctrl+Shift+R (Windows)');
      console.log('   2. Borrar caché del navegador:');
      console.log('      - DevTools → Application → Clear site data');
      console.log('   3. Desregistrar Service Workers:');
      console.log('      - Ejecutar en consola:');
      console.log('        navigator.serviceWorker.getRegistrations().then(r => r.forEach(x => x.unregister()))');
      console.log('   4. Probar en ventana de incógnito');
    }

  } catch (e) {
    console.log('   ℹ️ No se puede acceder al contenido del iframe');
    console.log('   Razón:', e.message);
    console.log('   Esto es normal si el iframe está en un origen diferente (CORS)');
    console.log('');
    console.log('   ✅ Si el src del iframe es correcto (http://localhost:3210?t=...),');
    console.log('   entonces el iframe está funcionando correctamente.');
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════');

  // 7. Logs de la consola relacionados con el Copilot
  console.log('');
  console.log('7️⃣ BUSCAR EN CONSOLA:');
  console.log('   Busca mensajes que empiecen con:');
  console.log('   - [CopilotChatIframe] URL del iframe: ...');
  console.log('   - [CopilotChatIframe] window.location.hostname: ...');
  console.log('   - [CopilotChatIframe] Contexto guardado: ...');
  console.log('');
  console.log('   Si NO ves estos mensajes, el componente no se está montando correctamente.');
  console.log('');
}

// 8. Resumen de verificación
console.log('═══════════════════════════════════════════════════');
console.log('📋 RESUMEN:');
console.log('   Si todo está bien, deberías ver:');
console.log('   ✅ Iframe encontrado');
console.log('   ✅ src empieza con http://localhost:3210');
console.log('   ✅ src tiene parámetro ?t=[timestamp]');
console.log('   ✅ NO contiene elementos de bodasdehoy.com');
console.log('   ✅ Muestra interfaz pura de LobeChat');
console.log('═══════════════════════════════════════════════════\n');

// Retornar el iframe para inspección adicional
iframe;
