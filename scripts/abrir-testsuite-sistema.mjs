#!/usr/bin/env node

/**
 * Script alternativo para abrir TestSuite usando el navegador del sistema
 * Útil mientras Playwright se instala o como alternativa más rápida
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

function getTestSuiteUrl() {
  const envFile = path.join(PROJECT_ROOT, 'apps/appEventos/.env.production');
  let chatUrl = 'https://chat-test.bodasdehoy.com';
  
  if (fs.existsSync(envFile)) {
    try {
      const content = fs.readFileSync(envFile, 'utf-8');
      const match = content.match(/^NEXT_PUBLIC_CHAT=(.+)$/m);
      if (match) {
        chatUrl = match[1].trim().replace(/['"]/g, '');
      }
    } catch (e) {
      // Ignorar
    }
  }
  
  return `${chatUrl}/bodasdehoy/admin/tests`;
}

async function openInBrowser(url) {
  const platform = process.platform;
  
  console.log(`\n🌐 Abriendo en navegador del sistema...\n`);
  
  try {
    if (platform === 'darwin') {
      // macOS - Intentar múltiples métodos
      try {
        await execAsync(`python3 -m webbrowser "${url}"`);
        console.log(`✅ Abierto usando Python webbrowser`);
      } catch (e1) {
        try {
          await execAsync(`open -a "Google Chrome" "${url}"`);
          console.log(`✅ Abierto en Google Chrome`);
        } catch (e2) {
          try {
            await execAsync(`open -a "Safari" "${url}"`);
            console.log(`✅ Abierto en Safari`);
          } catch (e3) {
            console.log(`⚠️  No se pudo abrir automáticamente`);
            console.log(`💡 Abre manualmente: ${url}`);
          }
        }
      }
    } else if (platform === 'linux') {
      // Linux
      await execAsync(`xdg-open "${url}"`);
      console.log(`✅ Abierto en navegador predeterminado (Linux)`);
    } else if (platform === 'win32') {
      // Windows
      await execAsync(`start "${url}"`);
      console.log(`✅ Abierto en navegador predeterminado (Windows)`);
    } else {
      console.log(`⚠️  Plataforma no soportada: ${platform}`);
      console.log(`💡 Abre manualmente: ${url}`);
    }
  } catch (error) {
    console.error(`❌ Error al abrir navegador: ${error.message}`);
    console.log(`\n💡 Abre manualmente esta URL:`);
    console.log(`   ${url}\n`);
  }
}

async function main() {
  const testSuiteUrl = getTestSuiteUrl();
  
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   Abrir TestSuite - Navegador del Sistema               ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  console.log(`📍 URL del TestSuite: ${testSuiteUrl}\n`);
  
  await openInBrowser(testSuiteUrl);
  
  console.log('\n✅ TestSuite abierto en el navegador');
  console.log('\n💡 Instrucciones:');
  console.log('   1. Verifica que el TestSuite carga correctamente');
  console.log('   2. Deberías ver la tabla con tests');
  console.log('   3. Puedes interactuar normalmente');
  console.log('   4. Para screenshots automáticos, usa:');
  console.log('      node scripts/abrir-testsuite-playwright.mjs');
  console.log('      (después de instalar Playwright: npx playwright install chromium)\n');
}

main().catch(console.error);
