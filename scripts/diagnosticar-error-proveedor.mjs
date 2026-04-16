#!/usr/bin/env node

/**
 * Script para diagnosticar errores de proveedor y verificar URLs
 * Verifica:
 * - Estado de chat-test y app-test
 * - Configuración de proveedores
 * - URLs y conectividad
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import https from 'https';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.blue}━━━ ${msg} ━━━${colors.reset}\n`),
};

// URLs a verificar
const URLS_TO_CHECK = {
  chatTest: 'https://chat-test.bodasdehoy.com',
  chatProd: 'https://chat.bodasdehoy.com',
  appTest: 'https://app-test.bodasdehoy.com',
  appProd: 'https://app.bodasdehoy.com',
  backendIA: 'https://api-ia.bodasdehoy.com',
};

/**
 * Hacer request HTTP
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      timeout: 10000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data.substring(0, 200), // Primeros 200 caracteres
        });
      });
    });

    req.on('error', (error) => reject({ error, url }));
    req.on('timeout', () => {
      req.destroy();
      reject({ error: new Error('Request timeout'), url });
    });
    req.end();
  });
}

/**
 * Verificar URL
 */
async function checkUrl(label, url) {
  log.info(`Verificando: ${label}`);
  log.info(`URL: ${url}`);

  try {
    const response = await makeRequest(url);
    const result = {
      label,
      url,
      status: 'ok',
      statusCode: response.statusCode,
      isCloudflare: !!response.headers['cf-ray'],
      cfRay: response.headers['cf-ray'],
    };

    if (response.statusCode === 200) {
      log.success(`HTTP ${response.statusCode} - OK`);
    } else if (response.statusCode === 502) {
      log.error(`HTTP ${response.statusCode} - Bad Gateway`);
      result.status = '502';
    } else {
      log.warning(`HTTP ${response.statusCode}`);
      result.status = 'error';
    }

    if (result.isCloudflare) {
      log.info(`Cloudflare detectado: ${result.cfRay}`);
    }

    return result;
  } catch (error) {
    log.error(`Error: ${error.error?.message || error.message}`);
    return {
      label,
      url,
      status: 'failed',
      error: error.error?.message || error.message,
    };
  }
}

/**
 * Leer configuración de .env
 */
function readEnvConfig() {
  const envFiles = [
    join(__dirname, '../apps/appEventos/.env.production'),
    join(__dirname, '../apps/appEventos/.env.local'),
    join(__dirname, '../apps/appEventos/.env'),
  ];

  const config = {};

  for (const envFile of envFiles) {
    try {
      const content = readFileSync(envFile, 'utf-8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        if (line.trim() && !line.startsWith('#')) {
          const match = line.match(/^([^=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^['"]|['"]$/g, '');
            if (key.startsWith('NEXT_PUBLIC_') || key.includes('BACKEND') || key.includes('API')) {
              config[key] = value;
            }
          }
        }
      }
    } catch (error) {
      // Archivo no existe, continuar
    }
  }

  return config;
}

/**
 * Main
 */
async function main() {
  console.log(`${colors.blue}
╔══════════════════════════════════════════════════════════╗
║   Diagnóstico: Error de Proveedor y URLs                 ║
╚══════════════════════════════════════════════════════════╝
${colors.reset}\n`);

  // 1. Verificar configuración
  log.section('CONFIGURACIÓN');
  const config = readEnvConfig();
  
  console.log('Variables de entorno relevantes:');
  Object.entries(config).forEach(([key, value]) => {
    if (key.includes('CHAT') || key.includes('BACKEND') || key.includes('API')) {
      console.log(`  ${key}: ${value}`);
    }
  });

  // 2. Verificar URLs
  log.section('VERIFICACIÓN DE URLs');

  const results = [];

  // chat-test
  results.push(await checkUrl('chat-test', URLS_TO_CHECK.chatTest));
  
  // chat producción
  results.push(await checkUrl('chat producción', URLS_TO_CHECK.chatProd));
  
  // app-test
  results.push(await checkUrl('app-test', URLS_TO_CHECK.appTest));
  
  // app producción
  results.push(await checkUrl('app producción', URLS_TO_CHECK.appProd));
  
  // backend IA
  results.push(await checkUrl('backend IA', URLS_TO_CHECK.backendIA));

  // 3. Análisis
  log.section('ANÁLISIS');

  const chatTest = results.find(r => r.label === 'chat-test');
  const chatProd = results.find(r => r.label === 'chat producción');
  const appTest = results.find(r => r.label === 'app-test');
  const appProd = results.find(r => r.label === 'app producción');
  const backendIA = results.find(r => r.label === 'backend IA');

  console.log('\nEstado de servicios:');
  console.log(`  chat-test: ${chatTest?.statusCode === 200 ? colors.green + '✅ OK' : colors.red + '❌ Error'}${colors.reset} (${chatTest?.statusCode || 'N/A'})`);
  console.log(`  chat producción: ${chatProd?.statusCode === 200 ? colors.green + '✅ OK' : colors.red + '❌ Error'}${colors.reset} (${chatProd?.statusCode || 'N/A'})`);
  console.log(`  app-test: ${appTest?.statusCode === 200 ? colors.green + '✅ OK' : colors.red + '❌ Error'}${colors.reset} (${appTest?.statusCode || 'N/A'})`);
  console.log(`  app producción: ${appProd?.statusCode === 200 ? colors.green + '✅ OK' : colors.red + '❌ Error'}${colors.reset} (${appProd?.statusCode || 'N/A'})`);
  console.log(`  backend IA: ${backendIA?.statusCode === 200 ? colors.green + '✅ OK' : colors.red + '❌ Error'}${colors.reset} (${backendIA?.statusCode || 'N/A'})`);

  // 4. Recomendaciones
  log.section('RECOMENDACIONES');

  if (chatTest?.status === '502' && chatProd?.statusCode === 200) {
    log.warning('chat-test da 502 pero chat producción funciona');
    log.info('✅ El fix en código ya resuelve esto automáticamente');
    log.info('✅ O configurar DNS: chat-test → CNAME → chat.bodasdehoy.com');
  }

  if (appTest?.status === '502' && appProd?.statusCode === 200) {
    log.warning('app-test da 502 pero app producción funciona');
    log.info('⚠️ Verificar configuración DNS para app-test');
  }

  if (backendIA?.status !== 'ok') {
    log.error('Backend IA no responde correctamente');
    log.info('⚠️ Esto puede causar errores de proveedor');
    log.info('⚠️ Verificar: https://api-ia.bodasdehoy.com');
  }

  // 5. Resumen
  log.section('RESUMEN');

  const working = results.filter(r => r.statusCode === 200).length;
  const failing = results.filter(r => r.status !== 'ok').length;

  console.log(`✅ Servicios funcionando: ${colors.green}${working}${colors.reset}`);
  console.log(`❌ Servicios con problemas: ${colors.red}${failing}${colors.reset}`);
  console.log(`📊 Total verificados: ${results.length}`);

  if (failing > 0) {
    console.log(`\n${colors.yellow}⚠️ ACCIÓN REQUERIDA:${colors.reset}`);
    console.log(`   1. Verificar servidores de origen para URLs con 502`);
    console.log(`   2. Verificar configuración DNS`);
    console.log(`   3. Verificar backend IA si hay errores de proveedor`);
  }

  process.exit(failing > 0 ? 1 : 0);
}

main().catch((error) => {
  log.error(`Error fatal: ${error.message}`);
  console.error(error);
  process.exit(1);
});
