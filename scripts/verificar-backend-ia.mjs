#!/usr/bin/env node

/**
 * Script para verificar el estado del backend IA
 * Verifica:
 * - Conectividad con api-ia.bodasdehoy.com
 * - Configuración de variables de entorno
 * - Estado de salud del backend
 */

import https from 'https';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
const BACKEND_IA_URL = 'https://api-ia.bodasdehoy.com';

/**
 * Hacer request HTTP
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        ...options.headers,
      },
      timeout: options.timeout || 10000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data.substring(0, 500), // Primeros 500 caracteres
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
 * Leer configuración de .env
 */
function readEnvConfig() {
  const envFiles = [
    join(__dirname, '../apps/web/.env.production'),
    join(__dirname, '../apps/web/.env.local'),
    join(__dirname, '../apps/web/.env'),
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
            if (key.includes('BACKEND') || key.includes('API') || key.includes('IA')) {
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
 * Verificar backend IA
 */
async function checkBackendIA() {
  log.section('VERIFICANDO Backend IA');

  try {
    log.info(`Probando: ${BACKEND_IA_URL}`);
    
    const response = await makeRequest(BACKEND_IA_URL, { timeout: 15000 });
    
    const result = {
      url: BACKEND_IA_URL,
      statusCode: response.statusCode,
      isCloudflare: !!response.headers['cf-ray'],
      cfRay: response.headers['cf-ray'],
      server: response.headers['server'],
      contentType: response.headers['content-type'],
      bodyPreview: response.body.substring(0, 200),
    };

    if (response.statusCode === 200) {
      log.success(`HTTP ${response.statusCode} - Backend IA responde correctamente`);
    } else if (response.statusCode === 502) {
      log.error(`HTTP ${response.statusCode} - Bad Gateway (servidor no responde)`);
    } else if (response.statusCode === 503) {
      log.warning(`HTTP ${response.statusCode} - Service Unavailable`);
    } else {
      log.warning(`HTTP ${response.statusCode}`);
    }

    if (result.isCloudflare) {
      log.info(`Cloudflare detectado: ${result.cfRay}`);
    }

    if (result.server) {
      log.info(`Servidor: ${result.server}`);
    }

    return result;

  } catch (error) {
    log.error(`Error: ${error.error?.message || error.message}`);
    
    return {
      url: BACKEND_IA_URL,
      statusCode: null,
      error: error.error?.message || error.message,
    };
  }
}

/**
 * Verificar endpoint de salud si existe
 */
async function checkHealthEndpoint() {
  log.section('VERIFICANDO Endpoint de Salud');

  const healthUrls = [
    `${BACKEND_IA_URL}/health`,
    `${BACKEND_IA_URL}/api/health`,
    `${BACKEND_IA_URL}/status`,
  ];

  for (const url of healthUrls) {
    try {
      log.info(`Probando: ${url}`);
      const response = await makeRequest(url, { timeout: 5000 });
      
      if (response.statusCode === 200) {
        log.success(`✅ Endpoint de salud responde: ${url}`);
        log.info(`Respuesta: ${response.body.substring(0, 100)}`);
        return { url, status: 'ok', response: response.body };
      }
    } catch (error) {
      // Continuar con siguiente URL
    }
  }

  log.warning('No se encontró endpoint de salud funcional');
  return null;
}

/**
 * Main
 */
async function main() {
  console.log(`${colors.blue}
╔══════════════════════════════════════════════════════════╗
║   Verificación: Backend IA (api-ia.bodasdehoy.com)      ║
╚══════════════════════════════════════════════════════════╝
${colors.reset}\n`);

  // 1. Verificar configuración
  log.section('CONFIGURACIÓN');
  const config = readEnvConfig();
  
  console.log('Variables de entorno relacionadas con Backend IA:');
  Object.entries(config).forEach(([key, value]) => {
    const maskedValue = key.includes('KEY') || key.includes('SECRET') 
      ? value.substring(0, 10) + '...' 
      : value;
    console.log(`  ${key}: ${maskedValue}`);
  });

  // 2. Verificar backend IA
  const backendResult = await checkBackendIA();

  // 3. Verificar endpoint de salud
  const healthResult = await checkHealthEndpoint();

  // 4. Análisis y recomendaciones
  log.section('ANÁLISIS Y RECOMENDACIONES');

  if (backendResult.statusCode === 200) {
    log.success('Backend IA está funcionando correctamente');
    log.info('✅ Puedes usar el servicio sin problemas');
  } else if (backendResult.statusCode === 502) {
    log.error('Backend IA da error 502 - Servidor no responde');
    log.warning('⚠️ ACCIÓN REQUERIDA:');
    log.info('   1. Verificar que el servidor de backend IA esté corriendo');
    log.info('   2. Verificar logs del servidor');
    log.info('   3. Verificar configuración de DNS y Cloudflare');
  } else if (backendResult.error) {
    log.error(`Error de conexión: ${backendResult.error}`);
    log.warning('⚠️ POSIBLES CAUSAS:');
    log.info('   1. VPN bloqueando conexión');
    log.info('   2. DNS no resuelve (probar desde navegador)');
    log.info('   3. Servidor no está corriendo');
  }

  // 5. Resumen
  log.section('RESUMEN');

  const isWorking = backendResult.statusCode === 200;
  
  console.log(`Estado del Backend IA: ${isWorking ? colors.green + '✅ FUNCIONANDO' : colors.red + '❌ CON PROBLEMAS'}${colors.reset}`);
  console.log(`URL: ${BACKEND_IA_URL}`);
  console.log(`Status Code: ${backendResult.statusCode || 'N/A'}`);
  
  if (healthResult) {
    console.log(`Endpoint de Salud: ${colors.green}✅ Disponible${colors.reset}`);
  } else {
    console.log(`Endpoint de Salud: ${colors.yellow}⚠️ No encontrado${colors.reset}`);
  }

  if (!isWorking) {
    console.log(`\n${colors.yellow}⚠️ RECOMENDACIÓN:${colors.reset}`);
    console.log(`   Verificar desde navegador: ${BACKEND_IA_URL}`);
    console.log(`   El navegador puede resolver DNS aunque la terminal no pueda`);
  }

  process.exit(isWorking ? 0 : 1);
}

main().catch((error) => {
  log.error(`Error fatal: ${error.message}`);
  console.error(error);
  process.exit(1);
});
