#!/usr/bin/env node

/**
 * Script para verificar el estado del TestSuite sin necesidad de Playwright
 * Usa fetch para verificar que el endpoint responde correctamente
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

function getTestSuiteUrl() {
  const envFile = path.join(PROJECT_ROOT, 'apps/web/.env.production');
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

function getBackendUrl() {
  const envFile = path.join(PROJECT_ROOT, 'apps/web/.env.production');
  let backendUrl = 'https://api-ia.bodasdehoy.com';
  
  if (fs.existsSync(envFile)) {
    try {
      const content = fs.readFileSync(envFile, 'utf-8');
      const match = content.match(/^PYTHON_BACKEND_URL=(.+)$/m);
      if (match) {
        backendUrl = match[1].trim().replace(/['"]/g, '');
      }
    } catch (e) {
      // Ignorar
    }
  }
  
  return backendUrl;
}

async function checkEndpoint(url, description) {
  try {
    console.log(`\n🔍 Verificando ${description}...`);
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/json',
      },
      redirect: 'follow',
    });
    
    const status = response.status;
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    
    let content = '';
    if (isJson) {
      content = await response.text();
    } else {
      content = await response.text();
    }
    
    console.log(`   Status: ${status}`);
    console.log(`   Content-Type: ${contentType}`);
    
    if (status === 200) {
      if (isJson) {
        console.log(`   ✅ Responde con JSON`);
        try {
          const json = JSON.parse(content);
          if (json.message) {
            console.log(`   Mensaje: ${json.message}`);
          }
        } catch (e) {
          // No es JSON válido
        }
      } else {
        console.log(`   ✅ Responde con HTML (interfaz web)`);
        // Verificar si es la interfaz del TestSuite
        if (content.includes('Test Suite') || content.includes('tests disponibles') || content.includes('Run Tests')) {
          console.log(`   ✅ Contiene elementos del TestSuite`);
        }
        if (content.includes('error.title') || content.includes('error.desc')) {
          console.log(`   ⚠️  ADVERTENCIA: Contiene marcadores de error sin resolver`);
        }
      }
      return { success: true, status, isJson, content };
    } else {
      console.log(`   ⚠️  Status ${status}`);
      return { success: false, status, isJson, content };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log(`   💡 Puede ser problema de DNS/VPN. Prueba desde el navegador.`);
    }
    return { success: false, error: error.message };
  }
}

async function main() {
  const testSuiteUrl = getTestSuiteUrl();
  const backendUrl = getBackendUrl();
  
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   Verificar Estado del TestSuite                        ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  console.log(`📍 URLs configuradas:`);
  console.log(`   Frontend: ${testSuiteUrl}`);
  console.log(`   Backend: ${backendUrl}`);
  
  // Verificar backend primero
  const backendResult = await checkEndpoint(backendUrl, 'Backend IA');
  
  // Verificar frontend TestSuite
  const frontendResult = await checkEndpoint(testSuiteUrl, 'Frontend TestSuite');
  
  // Resumen
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   Resumen                                                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  console.log(`Backend IA:`);
  if (backendResult.success) {
    console.log(`   ✅ ${backendResult.isJson ? 'Responde con JSON' : 'Responde correctamente'}`);
  } else {
    console.log(`   ⚠️  ${backendResult.error || `Status ${backendResult.status}`}`);
    console.log(`   💡 Verifica desde navegador: ${backendUrl}`);
  }
  
  console.log(`\nFrontend TestSuite:`);
  if (frontendResult.success) {
    if (frontendResult.isJson) {
      console.log(`   ⚠️  Responde con JSON (puede ser redirección o error)`);
      console.log(`   💡 Verifica que la URL sea correcta: ${testSuiteUrl}`);
    } else {
      console.log(`   ✅ Responde con HTML (interfaz web)`);
      if (frontendResult.content.includes('error.title') || frontendResult.content.includes('error.desc')) {
        console.log(`   ⚠️  ADVERTENCIA: Contiene marcadores de error sin resolver`);
        console.log(`   💡 Verifica que el fix de i18n esté aplicado`);
      } else {
        console.log(`   ✅ No se detectaron errores de i18n`);
      }
    }
  } else {
    console.log(`   ⚠️  ${frontendResult.error || `Status ${frontendResult.status}`}`);
    console.log(`   💡 Verifica desde navegador: ${testSuiteUrl}`);
  }
  
  console.log('\n💡 Próximos pasos:');
  console.log('   1. Abre el TestSuite en el navegador:');
  console.log(`      ${testSuiteUrl}`);
  console.log('   2. Verifica que veas la interfaz web (no solo JSON)');
  console.log('   3. Si ves la interfaz, puedes ejecutar tests');
  console.log('   4. Si ves errores, revisa la consola del navegador (F12)\n');
}

main().catch(console.error);
