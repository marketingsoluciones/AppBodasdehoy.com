#!/usr/bin/env node

/**
 * Script de prueba/scraper para verificar chat-test.bodasdehoy.com
 * Verifica:
 * - Estado HTTP del servidor
 * - DNS resolution
 * - Fallback a chat producción
 * - Headers y respuesta
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import https from 'https';
import http from 'http';
import { URL } from 'url';

const execAsync = promisify(exec);

// Colores para output
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

// URLs a probar
const TEST_URLS = {
  chatTest: 'https://chat-test.bodasdehoy.com',
  chatProd: 'https://chat.bodasdehoy.com',
  chatTestPath: 'https://chat-test.bodasdehoy.com/bodasdehoy/chat',
  chatProdPath: 'https://chat.bodasdehoy.com/bodasdehoy/chat',
};

/**
 * Hacer request HTTP/HTTPS
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        ...options.headers,
      },
      timeout: options.timeout || 10000,
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          url: url,
        });
      });
    });

    req.on('error', (error) => {
      reject({ error, url });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({ error: new Error('Request timeout'), url });
    });

    req.end();
  });
}

/**
 * Verificar DNS resolution
 */
async function checkDNS(hostname) {
  try {
    const { stdout } = await execAsync(`dig +short ${hostname} | head -1`);
    const ip = stdout.trim();
    if (ip && ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      return { success: true, ip };
    }
    return { success: false, ip: null };
  } catch (error) {
    return { success: false, ip: null, error: error.message };
  }
}

/**
 * Verificar URL completa
 */
async function testUrl(url, label) {
  log.info(`Probando: ${label}`);
  log.info(`URL: ${url}`);

  try {
    // 1. Verificar DNS
    const urlObj = new URL(url);
    const dnsCheck = await checkDNS(urlObj.hostname);
    
    if (dnsCheck.success) {
      log.success(`DNS resuelto: ${dnsCheck.ip}`);
    } else {
      log.error(`DNS NO resuelto`);
      return {
        url,
        label,
        dns: false,
        http: null,
        error: 'DNS resolution failed',
      };
    }

    // 2. Hacer request HTTP
    const response = await makeRequest(url, { timeout: 15000 });
    
    const result = {
      url,
      label,
      dns: true,
      ip: dnsCheck.ip,
      http: {
        statusCode: response.statusCode,
        statusText: response.statusCode === 200 ? 'OK' : 
                    response.statusCode === 502 ? 'Bad Gateway' :
                    response.statusCode === 503 ? 'Service Unavailable' :
                    response.statusCode === 404 ? 'Not Found' : 'Unknown',
        headers: {
          'content-type': response.headers['content-type'],
          'server': response.headers['server'],
          'cf-ray': response.headers['cf-ray'],
          'cf-cache-status': response.headers['cf-cache-status'],
        },
        bodyLength: response.body.length,
        isCloudflare: !!response.headers['cf-ray'],
      },
      error: null,
    };

    if (response.statusCode === 200) {
      log.success(`HTTP ${response.statusCode} - OK`);
    } else if (response.statusCode === 502) {
      log.error(`HTTP ${response.statusCode} - Bad Gateway (servidor no responde)`);
    } else {
      log.warning(`HTTP ${response.statusCode} - ${result.http.statusText}`);
    }

    return result;

  } catch (error) {
    log.error(`Error: ${error.error?.message || error.message}`);
    
    return {
      url,
      label,
      dns: false,
      http: null,
      error: error.error?.message || error.message,
    };
  }
}

/**
 * Generar reporte
 */
function generateReport(results) {
  log.section('REPORTE FINAL');

  console.log('\n📊 Resultados:\n');

  results.forEach((result) => {
    console.log(`${colors.cyan}━━━ ${result.label} ━━━${colors.reset}`);
    console.log(`URL: ${result.url}`);
    
    if (result.dns) {
      console.log(`DNS: ${colors.green}✅ Resuelto${colors.reset} → ${result.ip}`);
    } else {
      console.log(`DNS: ${colors.red}❌ No resuelto${colors.reset}`);
    }

    if (result.http) {
      const statusColor = result.http.statusCode === 200 ? colors.green : 
                         result.http.statusCode === 502 ? colors.red : colors.yellow;
      console.log(`HTTP: ${statusColor}${result.http.statusCode} ${result.http.statusText}${colors.reset}`);
      
      if (result.http.isCloudflare) {
        console.log(`Cloudflare: ${colors.green}✅ Detectado${colors.reset}`);
        if (result.http.headers['cf-ray']) {
          console.log(`CF-Ray: ${result.http.headers['cf-ray']}`);
        }
      }

      if (result.http.statusCode === 502) {
        console.log(`\n${colors.red}⚠️ PROBLEMA DETECTADO:${colors.reset}`);
        console.log(`   El servidor de origen NO está respondiendo.`);
        console.log(`   Cloudflare funciona, pero el host detrás no responde.`);
      }
    } else if (result.error) {
      console.log(`Error: ${colors.red}${result.error}${colors.reset}`);
    }

    console.log('');
  });

  // Análisis comparativo
  const chatTest = results.find(r => r.label === 'chat-test');
  const chatProd = results.find(r => r.label === 'chat producción');

  if (chatTest && chatProd) {
    log.section('ANÁLISIS COMPARATIVO');

    if (chatTest.http?.statusCode === 502 && chatProd.http?.statusCode === 200) {
      log.warning('chat-test da 502 pero chat producción funciona');
      log.info('✅ RECOMENDACIÓN: Usar chat producción como fallback (ya implementado en código)');
      log.info('✅ O configurar DNS: chat-test → CNAME → chat.bodasdehoy.com');
    } else if (chatTest.http?.statusCode === 200) {
      log.success('chat-test funciona correctamente');
    } else if (!chatTest.dns) {
      log.error('chat-test no resuelve DNS');
      log.info('⚠️ Verificar configuración DNS en Cloudflare');
    }
  }

  // Resumen ejecutivo
  log.section('RESUMEN EJECUTIVO');

  const working = results.filter(r => r.http?.statusCode === 200).length;
  const failing = results.filter(r => r.http?.statusCode === 502 || !r.dns).length;

  console.log(`✅ URLs funcionando: ${colors.green}${working}${colors.reset}`);
  console.log(`❌ URLs con problemas: ${colors.red}${failing}${colors.reset}`);
  console.log(`📊 Total probadas: ${results.length}`);

  if (failing > 0) {
    console.log(`\n${colors.yellow}⚠️ ACCIÓN REQUERIDA:${colors.reset}`);
    console.log(`   1. Verificar servidor de origen para URLs con 502`);
    console.log(`   2. O configurar DNS para usar servidor de producción`);
    console.log(`   3. El código ya tiene fallback automático implementado`);
  } else {
    console.log(`\n${colors.green}✅ Todo funciona correctamente${colors.reset}`);
  }
}

/**
 * Main
 */
async function main() {
  console.log(`${colors.blue}
╔══════════════════════════════════════════════════════════╗
║   Test Scraper: chat-test.bodasdehoy.com                ║
║   Verificación de DNS, HTTP y Fallback                  ║
╚══════════════════════════════════════════════════════════╝
${colors.reset}\n`);

  const results = [];

  // Probar chat-test
  log.section('PROBANDO chat-test.bodasdehoy.com');
  results.push(await testUrl(TEST_URLS.chatTest, 'chat-test (raíz)'));
  results.push(await testUrl(TEST_URLS.chatTestPath, 'chat-test (/chat)'));

  // Probar chat producción
  log.section('PROBANDO chat.bodasdehoy.com');
  results.push(await testUrl(TEST_URLS.chatProd, 'chat producción (raíz)'));
  results.push(await testUrl(TEST_URLS.chatProdPath, 'chat producción (/chat)'));

  // Generar reporte
  generateReport(results);

  // Exit code
  const hasErrors = results.some(r => r.http?.statusCode === 502 || !r.dns);
  process.exit(hasErrors ? 1 : 0);
}

// Ejecutar
main().catch((error) => {
  log.error(`Error fatal: ${error.message}`);
  console.error(error);
  process.exit(1);
});
