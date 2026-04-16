#!/usr/bin/env node

/**
 * Script simplificado para ejecutar tests - usa el navegador del sistema
 */

import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

const TESTSUITE_URL = process.argv[2] || 'https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests';
const NUM_TESTS = process.argv[3] || '5';

console.log('🧪 Abriendo TestSuite para ejecutar tests...');
console.log(`📍 URL: ${TESTSUITE_URL}`);
console.log(`📊 Tests a ejecutar: ${NUM_TESTS}`);
console.log('');
console.log('💡 Instrucciones:');
console.log('   1. Selecciona los primeros', NUM_TESTS, 'tests (checkboxes)');
console.log('   2. Haz click en "Run Tests"');
console.log('   3. Observa el progreso en el banner azul');
console.log('   4. Los resultados aparecerán en la tabla');
console.log('');

// Abrir navegador según OS
const platform = process.platform;
let command;

if (platform === 'darwin') {
  // macOS
  command = `open -a "Google Chrome" "${TESTSUITE_URL}" || open -a "Safari" "${TESTSUITE_URL}" || open "${TESTSUITE_URL}"`;
} else if (platform === 'linux') {
  // Linux
  command = `xdg-open "${TESTSUITE_URL}" || sensible-browser "${TESTSUITE_URL}" || firefox "${TESTSUITE_URL}"`;
} else if (platform === 'win32') {
  // Windows
  command = `start "${TESTSUITE_URL}"`;
} else {
  console.log(`⚠️  Plataforma no soportada: ${platform}`);
  console.log(`💡 Abre manualmente: ${TESTSUITE_URL}`);
  process.exit(0);
}

execAsync(command)
  .then(() => {
    console.log('✅ Navegador abierto');
    console.log('');
    console.log('📊 Para ver logs en tiempo real:');
    console.log('   - Abre la consola del navegador (F12)');
    console.log('   - Busca mensajes que empiecen con [TestSuite]');
    console.log('');
    console.log('🎯 Los tests mostrarán:');
    console.log('   - Banner azul: "🚀 Ejecutando tests..."');
    console.log('   - Progreso: "Progreso: X / Y"');
    console.log('   - Resultados en la tabla');
  })
  .catch((error) => {
    console.error('❌ Error abriendo navegador:', error.message);
    console.log(`💡 Abre manualmente: ${TESTSUITE_URL}`);
  });
