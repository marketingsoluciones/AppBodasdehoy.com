// Script para verificar qué URL está usando el iframe del Copilot
// Ejecutar en la consola del navegador después de abrir el sidebar

console.log('=== DEBUG IFRAME COPILOT ===\n');

// Buscar todos los iframes
const iframes = document.querySelectorAll('iframe');
console.log(`Total iframes encontrados: ${iframes.length}\n`);

iframes.forEach((iframe, index) => {
  console.log(`\n--- Iframe ${index + 1} ---`);
  console.log('src:', iframe.src);
  console.log('title:', iframe.title);
  console.log('width:', iframe.style.width || iframe.width);
  console.log('height:', iframe.style.height || iframe.height);

  // Intentar acceder al contenido del iframe (puede fallar por CORS)
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    console.log('URL del documento:', iframeDoc.location.href);
    console.log('Title del documento:', iframeDoc.title);
  } catch (e) {
    console.log('No se puede acceder al contenido del iframe (CORS o diferente origen)');
  }
});

// Buscar el componente CopilotChatIframe en el DOM
console.log('\n--- Buscando componente Copilot ---');
const copilotElements = document.querySelectorAll('[class*="copilot" i], [class*="Copilot" i]');
console.log(`Elementos con "copilot": ${copilotElements.length}`);

// Verificar hostname
console.log('\n--- Información del entorno ---');
console.log('window.location.hostname:', window.location.hostname);
console.log('window.location.href:', window.location.href);
console.log('Debería usar localhost:3210:',
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
);

console.log('\n=== FIN DEBUG ===');
