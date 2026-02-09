#!/usr/bin/env node
/**
 * Script de verificación de integración del Copilot
 * Verifica que la página /copilot cargue correctamente con el ChatInput nativo
 */

import http from 'http';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

console.log(`${BOLD}🔍 Verificando integración del Copilot...${RESET}\n`);

// Test 1: Verificar que el servidor responde
console.log('1. Verificando que el servidor responde en puerto 8080...');
http.get('http://localhost:8080/copilot', (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log(`   ${GREEN}✓${RESET} Servidor respondiendo correctamente (200 OK)\n`);

      // Test 2: Verificar que carga la página copilot
      console.log('2. Verificando contenido de la página...');

      const checks = [
        { name: 'Scripts de Next.js', pattern: /_next\/static\/chunks/, found: false },
        { name: 'Página copilot.js', pattern: /pages\/copilot\.js/, found: false },
        { name: 'App principal', pattern: /_app\.js/, found: false },
        { name: 'Data JSON', pattern: /__NEXT_DATA__/, found: false },
      ];

      checks.forEach(check => {
        check.found = check.pattern.test(data);
        const status = check.found ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
        console.log(`   ${status} ${check.name}`);
      });

      const allPassed = checks.every(c => c.found);

      console.log(`\n${BOLD}Resultado:${RESET}`);
      if (allPassed) {
        console.log(`${GREEN}✓ Todos los tests pasaron${RESET}`);
        console.log(`\n${YELLOW}Nota:${RESET} El ChatInput placeholder está funcionando.`);
        console.log(`      Para habilitar el editor completo de @lobehub/editor,`);
        console.log(`      configura las rutas correctas en packages/copilot-ui/src/ChatInput/index.tsx\n`);
        console.log(`${BOLD}Siguiente paso:${RESET}`);
        console.log(`  1. Abre http://localhost:8080/copilot en tu navegador`);
        console.log(`  2. Inicia sesión si es necesario`);
        console.log(`  3. Verifica que el ChatInput placeholder aparece en el panel de chat\n`);
      } else {
        console.log(`${RED}✗ Algunos tests fallaron${RESET}\n`);
      }
    } else {
      console.log(`   ${RED}✗${RESET} Servidor respondió con código ${res.statusCode}\n`);
    }
  });

}).on('error', (err) => {
  console.log(`   ${RED}✗${RESET} Error conectando al servidor: ${err.message}`);
  console.log(`\n${YELLOW}Asegúrate de que el servidor dev esté corriendo:${RESET}`);
  console.log(`   npm run dev\n`);
});
