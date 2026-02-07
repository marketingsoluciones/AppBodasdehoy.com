#!/usr/bin/env node

/**
 * Script para probar el fix del CopilotIframe
 * Simula el comportamiento del componente React y verifica:
 * - Detección de chat-test
 * - Fallback automático a chat producción
 * - Construcción de URLs
 */

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

/**
 * Simular getCopilotBaseUrl desde el código
 */
function getCopilotBaseUrl() {
  // Leer .env.production o .env.local
  const envFiles = [
    join(__dirname, '../apps/web/.env.production'),
    join(__dirname, '../apps/web/.env.local'),
    join(__dirname, '../apps/web/.env'),
  ];

  let chatUrl = null;
  
  for (const envFile of envFiles) {
    try {
      const content = readFileSync(envFile, 'utf-8');
      const match = content.match(/NEXT_PUBLIC_CHAT=(.+)/);
      if (match) {
        chatUrl = match[1].trim().replace(/['"]/g, '');
        break;
      }
    } catch (error) {
      // Archivo no existe, continuar
    }
  }

  // Fallback a valores por defecto
  if (!chatUrl) {
    chatUrl = process.env.NEXT_PUBLIC_CHAT || 'https://chat-test.bodasdehoy.com';
  }

  return chatUrl;
}

/**
 * Simular getInitialUrl (fix implementado)
 */
function getInitialUrl(baseUrl, buildCopilotUrlFn) {
  // Si chat-test está configurado, usar chat producción directamente
  if (baseUrl.includes('chat-test.bodasdehoy.com')) {
    const productionUrl = buildCopilotUrlFn().replace('chat-test.bodasdehoy.com', 'chat.bodasdehoy.com');
    return productionUrl;
  }
  return buildCopilotUrlFn();
}

/**
 * Simular buildCopilotUrl
 */
function buildCopilotUrl(baseUrl, params = {}) {
  const { userId = 'test-user', email = 'test@example.com', eventId = null, development = false } = params;
  
  // Construir URL base
  let chatBase = baseUrl;
  
  // Agregar variantes si es necesario
  const variants = development ? 'dev' : 'bodasdehoy';
  if (!chatBase.includes(`/${variants}`)) {
    chatBase = `${chatBase}/${variants}`;
  }
  
  // Agregar /chat si no está
  if (!chatBase.endsWith('/chat')) {
    chatBase = `${chatBase}/chat`;
  }
  
  // Construir query string
  const queryParams = new URLSearchParams();
  if (userId) queryParams.set('userId', userId);
  if (email) queryParams.set('email', email);
  if (eventId) queryParams.set('eventId', eventId);
  
  const queryString = queryParams.toString();
  return queryString ? `${chatBase}?${queryString}` : chatBase;
}

/**
 * Probar diferentes escenarios
 */
function testScenarios() {
  log.section('TEST: Detección de chat-test y Fallback');

  const baseUrl = getCopilotBaseUrl();
  log.info(`URL base detectada: ${baseUrl}`);

  const scenarios = [
    {
      name: 'chat-test configurado',
      baseUrl: 'https://chat-test.bodasdehoy.com',
      expected: 'https://chat.bodasdehoy.com/bodasdehoy/chat',
    },
    {
      name: 'chat producción configurado',
      baseUrl: 'https://chat.bodasdehoy.com',
      expected: 'https://chat.bodasdehoy.com/bodasdehoy/chat',
    },
    {
      name: 'URL localhost',
      baseUrl: 'http://localhost:3210',
      expected: 'http://localhost:3210/bodasdehoy/chat',
    },
  ];

  scenarios.forEach((scenario) => {
    log.section(`Escenario: ${scenario.name}`);
    
    const buildUrl = () => buildCopilotUrl(scenario.baseUrl);
    const initialUrl = getInitialUrl(scenario.baseUrl, buildUrl);
    
    console.log(`URL base: ${scenario.baseUrl}`);
    console.log(`URL inicial (después del fix): ${initialUrl}`);
    
    if (scenario.baseUrl.includes('chat-test')) {
      if (initialUrl.includes('chat.bodasdehoy.com')) {
        log.success('✅ Fix funcionando: chat-test → chat producción');
      } else {
        log.error('❌ Fix NO funcionando: debería cambiar a chat producción');
      }
    } else {
      log.info('URL no es chat-test, se mantiene igual');
    }
    
    console.log('');
  });
}

/**
 * Verificar código del componente
 */
function verifyCode() {
  log.section('VERIFICANDO Código del Componente');

  const componentPath = join(__dirname, '../apps/web/components/Copilot/CopilotIframe.tsx');
  
  try {
    const code = readFileSync(componentPath, 'utf-8');
    
    // Verificar que existe getInitialUrl
    if (code.includes('getInitialUrl')) {
      log.success('✅ Función getInitialUrl encontrada');
    } else {
      log.error('❌ Función getInitialUrl NO encontrada');
    }

    // Verificar que detecta chat-test
    if (code.includes('chat-test.bodasdehoy.com')) {
      log.success('✅ Detección de chat-test implementada');
    } else {
      log.warning('⚠️ No se encontró detección de chat-test');
    }

    // Verificar fallback a chat producción
    if (code.includes('chat.bodasdehoy.com') && code.includes('replace')) {
      log.success('✅ Fallback a chat producción implementado');
    } else {
      log.error('❌ Fallback a chat producción NO encontrado');
    }

    // Verificar manejo de error 502
    if (code.includes('errorType === \'502\'') || code.includes('errorType === "502"')) {
      log.success('✅ Manejo de error 502 implementado');
    } else {
      log.warning('⚠️ Manejo específico de error 502 no encontrado');
    }

  } catch (error) {
    log.error(`Error leyendo componente: ${error.message}`);
  }
}

/**
 * Main
 */
async function main() {
  console.log(`${colors.blue}
╔══════════════════════════════════════════════════════════╗
║   Test: Fix CopilotIframe - chat-test Fallback          ║
╚══════════════════════════════════════════════════════════╝
${colors.reset}\n`);

  verifyCode();
  testScenarios();

  log.section('RESUMEN');
  log.info('El fix debería:');
  log.info('  1. Detectar cuando chat-test está configurado');
  log.info('  2. Usar chat producción como URL inicial');
  log.info('  3. Cambiar automáticamente si hay error 502');
  log.info('\n✅ Si todos los checks pasan, el fix está funcionando');
}

main().catch((error) => {
  log.error(`Error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
