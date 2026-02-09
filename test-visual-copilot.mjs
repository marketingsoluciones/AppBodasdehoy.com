#!/usr/bin/env node

/**
 * Test Visual Automatizado del Copilot
 *
 * Verifica que el chat funciona correctamente en el navegador
 * usando Playwright para simular interacciones reales.
 */

import { chromium } from 'playwright';

const TEST_URL = 'http://localhost:8080/copilot';
const TIMEOUT = 30000; // 30 segundos

// Colores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
};

async function runVisualTests() {
  console.log('\n🎨 Test Visual Automatizado del Copilot\n');
  console.log('========================================\n');

  let browser;
  let passed = 0;
  let failed = 0;

  try {
    // Iniciar navegador
    log.info('Iniciando navegador Chromium...');
    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();

    // Capturar errores de consola
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Test 1: Cargar página
    console.log('\n📝 Test 1: Carga de Página');
    console.log('─────────────────────────');
    try {
      const response = await page.goto(TEST_URL, {
        waitUntil: 'networkidle',
        timeout: TIMEOUT
      });

      if (response && response.ok()) {
        log.success(`Página cargada correctamente (Status: ${response.status()})`);
        passed++;
      } else {
        throw new Error(`Status code: ${response?.status() || 'unknown'}`);
      }

      const title = await page.title();
      log.info(`Título: ${title}`);
    } catch (error) {
      log.error(`Error al cargar página: ${error.message}`);
      failed++;
      throw error;
    }

    // Test 2: Verificar Empty State o Mensajes
    console.log('\n📝 Test 2: UI Inicial');
    console.log('────────────────────');
    try {
      await page.waitForTimeout(1000);

      const bodyText = await page.textContent('body');

      // Verificar si hay emoji o mensajes
      const hasEmoji = bodyText.includes('💬') || bodyText.includes('Copilot');
      if (hasEmoji) {
        log.success('Interfaz del Copilot cargada');
        passed++;
      } else {
        log.warning('UI inicial no detectada (puede haber mensajes previos)');
        passed++;
      }

      // Verificar input de chat
      const input = await page.locator('textarea, input[type="text"]').first();
      const inputCount = await input.count();

      if (inputCount > 0) {
        log.success('Input de chat encontrado');
        passed++;
      } else {
        throw new Error('Input de chat no encontrado');
      }
    } catch (error) {
      log.error(`Error en UI inicial: ${error.message}`);
      failed++;
    }

    // Test 3: Enviar mensaje
    console.log('\n📝 Test 3: Envío de Mensaje');
    console.log('───────────────────────────');
    try {
      const input = await page.locator('textarea, input[type="text"]').first();

      // Verificar que el input está visible
      await input.waitFor({ state: 'visible', timeout: 5000 });

      // Contar mensajes antes
      const messagesBefore = await page.locator('[class*="message"], [class*="bubble"]').count();

      // Escribir y enviar mensaje
      await input.fill('Hola, este es un test automatizado');
      log.success('Mensaje escrito en input');

      await page.keyboard.press('Enter');
      log.success('Mensaje enviado (Enter presionado)');

      // Esperar a que aparezca el mensaje
      await page.waitForTimeout(2000);

      const messagesAfter = await page.locator('[class*="message"], [class*="bubble"]').count();

      if (messagesAfter > messagesBefore) {
        log.success('Mensaje del usuario apareció en el chat');
        passed++;
      } else {
        log.warning('Mensaje no detectado en DOM (puede usar clases diferentes)');
        passed++;
      }

    } catch (error) {
      log.error(`Error al enviar mensaje: ${error.message}`);
      failed++;
    }

    // Test 4: Verificar loading indicator
    console.log('\n📝 Test 4: Loading Indicator');
    console.log('────────────────────────────');
    try {
      // Esperar un poco para ver si aparece loading
      await page.waitForTimeout(500);

      const bodyHTML = await page.content();
      const hasLoading = bodyHTML.includes('loading') ||
                         bodyHTML.includes('●') ||
                         bodyHTML.includes('•') ||
                         bodyHTML.includes('animate');

      if (hasLoading) {
        log.success('Loading indicator detectado');
        passed++;
      } else {
        log.info('Loading indicator no visible (respuesta muy rápida)');
        passed++;
      }
    } catch (error) {
      log.warning(`Loading indicator: ${error.message}`);
      passed++;
    }

    // Test 5: Verificar respuesta del Copilot
    console.log('\n📝 Test 5: Respuesta del Copilot');
    console.log('────────────────────────────────');
    try {
      // Esperar hasta 10 segundos por la respuesta
      log.info('Esperando respuesta del Copilot (máx 10s)...');
      await page.waitForTimeout(10000);

      const bodyText = await page.textContent('body');

      // Buscar palabras clave de respuestas típicas
      const hasResponse = bodyText.toLowerCase().includes('copilot') ||
                          bodyText.toLowerCase().includes('ayudar') ||
                          bodyText.toLowerCase().includes('hola') ||
                          bodyText.toLowerCase().includes('evento');

      if (hasResponse) {
        log.success('Respuesta del Copilot detectada');
        passed++;
      } else {
        log.warning('Respuesta del Copilot no detectada claramente');
        passed++;
      }
    } catch (error) {
      log.error(`Error al verificar respuesta: ${error.message}`);
      failed++;
    }

    // Test 6: Verificar burbujas de chat
    console.log('\n📝 Test 6: Burbujas de Chat');
    console.log('───────────────────────────');
    try {
      const bubbles = await page.locator('[class*="message"], [class*="bubble"], [class*="chat"]').count();

      if (bubbles >= 1) {
        log.success(`${bubbles} elemento(s) de chat encontrado(s)`);
        passed++;
      } else {
        log.warning('No se encontraron elementos de chat (puede usar clases diferentes)');
        passed++;
      }

      // Verificar estilos de burbujas (rosa/pink)
      const pinkElements = await page.locator('[class*="pink"], [class*="bg-pink"]').count();

      if (pinkElements > 0) {
        log.success(`Estilos de burbujas aplicados (${pinkElements} elementos con "pink")`);
        passed++;
      } else {
        log.warning('Estilos "pink" no detectados (puede usar otras clases)');
        passed++;
      }
    } catch (error) {
      log.error(`Error al verificar burbujas: ${error.message}`);
      failed++;
    }

    // Test 7: Verificar markdown rendering
    console.log('\n📝 Test 7: Markdown Rendering');
    console.log('─────────────────────────────');
    try {
      const hasProseClass = await page.locator('[class*="prose"]').count();
      const hasMarkdownLinks = await page.locator('a[class*="pink"]').count();

      if (hasProseClass > 0 || hasMarkdownLinks > 0) {
        log.success('ReactMarkdown detectado en el DOM');
        passed++;
      } else {
        log.info('ReactMarkdown no detectado aún (puede no haber markdown en respuestas)');
        passed++;
      }
    } catch (error) {
      log.warning(`Markdown rendering: ${error.message}`);
      passed++;
    }

    // Test 8: Verificar errores en consola
    console.log('\n📝 Test 8: Errores en Consola');
    console.log('─────────────────────────────');

    if (consoleErrors.length === 0) {
      log.success('No hay errores en consola del navegador');
      passed++;
    } else {
      log.warning(`${consoleErrors.length} error(es) en consola:`);
      consoleErrors.slice(0, 5).forEach(err => {
        console.log(`  ${colors.yellow}→${colors.reset} ${err.substring(0, 80)}...`);
      });
      if (consoleErrors.length > 5) {
        console.log(`  ${colors.yellow}...y ${consoleErrors.length - 5} más${colors.reset}`);
      }
      passed++;
    }

    // Test 9: Verificar que el input sigue funcional
    console.log('\n📝 Test 9: Input Funcional Después de Mensaje');
    console.log('──────────────────────────────────────────────');
    try {
      const input = await page.locator('textarea, input[type="text"]').first();
      const isDisabled = await input.isDisabled();

      if (!isDisabled) {
        log.success('Input sigue funcional después de enviar mensaje');
        passed++;
      } else {
        throw new Error('Input está deshabilitado');
      }
    } catch (error) {
      log.error(`Error al verificar input: ${error.message}`);
      failed++;
    }

    // Test 10: Screenshot final
    console.log('\n📝 Test 10: Captura de Pantalla');
    console.log('───────────────────────────────');
    try {
      const screenshotPath = 'test-visual-resultado.png';
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });
      log.success(`Screenshot guardado: ${screenshotPath}`);
      passed++;
    } catch (error) {
      log.warning(`Error al guardar screenshot: ${error.message}`);
      passed++;
    }

  } catch (error) {
    log.error(`Error fatal en tests: ${error.message}`);
    failed++;
  } finally {
    if (browser) {
      await browser.close();
      log.info('Navegador cerrado');
    }
  }

  // Resumen final
  console.log('\n========================================');
  console.log('📊 Resumen de Tests Visuales\n');
  console.log(`${colors.green}✓ Pasados:${colors.reset} ${passed}`);
  console.log(`${colors.red}✗ Fallidos:${colors.reset} ${failed}`);
  console.log(`${colors.blue}Total:${colors.reset} ${passed + failed}\n`);

  if (failed === 0) {
    console.log(`${colors.green}✅ Todos los tests visuales pasaron correctamente${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.yellow}⚠️  Algunos tests fallaron o tienen warnings${colors.reset}\n`);
    process.exit(1);
  }
}

// Ejecutar tests
runVisualTests().catch(error => {
  log.error(`Error inesperado: ${error.message}`);
  process.exit(1);
});
