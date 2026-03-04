#!/usr/bin/env node

/**
 * TEST COPILOT - Usando cookies guardadas
 *
 * Este test usa las cookies capturadas previamente con capture-auth-cookies.js
 * para evitar el problema del login automatizado.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = 'https://app-test.bodasdehoy.com';
const COOKIES_FILE = path.join(__dirname, 'auth-cookies.json');

async function screenshot(page, name) {
  const path = `/tmp/copilot-cookies-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${path}`);
}

async function waitForLoadingToDisappear(page, timeout = 30000) {
  console.log('  ⏳ Esperando que el loading desaparezca...');

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const hasLoading = await page.evaluate(() => {
      const loadingDiv = document.querySelector('.font-display.fixed.top-0.left-0.w-full.h-screen.z-50.bg-white');
      if (!loadingDiv) return false;

      const style = window.getComputedStyle(loadingDiv);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });

    if (!hasLoading) {
      console.log('  ✅ Loading desapareció');
      return true;
    }

    await page.waitForTimeout(500);
  }

  console.log('  ⚠️  Loading aún visible');
  return false;
}

async function askQuestion(page, question, questionNumber) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`PREGUNTA ${questionNumber}: "${question}"`);
  console.log('='.repeat(70));

  const frames = page.frames();
  const copilotFrame = frames.find(f => {
    const url = f.url();
    return url.includes('chat') || url.includes('copilot') || url.includes(':3210');
  });

  if (!copilotFrame) {
    console.log('❌ Frame del Copilot no encontrado');
    await screenshot(page, `q${questionNumber}-no-frame`);
    return false;
  }

  try {
    await page.waitForTimeout(3000);

    let inputElement = null;
    const selectors = ['[contenteditable="true"]', 'textarea', 'input[type="text"]'];

    for (const selector of selectors) {
      try {
        const element = await copilotFrame.$(selector);
        if (element && await element.isVisible()) {
          inputElement = element;
          console.log(`✅ Input encontrado con: ${selector}`);
          break;
        }
      } catch (e) {}
    }

    if (!inputElement) {
      console.log('❌ Input no encontrado');
      await screenshot(page, `q${questionNumber}-no-input`);
      return false;
    }

    await screenshot(page, `q${questionNumber}-01-antes`);

    console.log('⌨️  Escribiendo pregunta...');
    await inputElement.click({ timeout: 15000, force: true });
    await page.waitForTimeout(1000);
    await inputElement.fill(question);
    await page.waitForTimeout(2000);
    await screenshot(page, `q${questionNumber}-02-escrita`);

    console.log('📤 Enviando...');
    const sendBtn = await copilotFrame.$('button[type="submit"]');
    if (sendBtn) {
      await sendBtn.click();
    } else {
      await inputElement.press('Enter');
    }

    await page.waitForTimeout(3000);
    await screenshot(page, `q${questionNumber}-03-enviada`);

    console.log('⏳ Esperando respuesta (75s)...');

    for (let i = 15; i <= 75; i += 15) {
      await page.waitForTimeout(15000);
      console.log(`   ${i}s...`);
      if (i === 75) await screenshot(page, `q${questionNumber}-04-respuesta`);
    }

    console.log('✅ Respuesta capturada');
    return true;

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    await screenshot(page, `q${questionNumber}-error`);
    return false;
  }
}

(async () => {
  console.log('======================================================================');
  console.log('TEST COPILOT - USANDO COOKIES GUARDADAS');
  console.log('======================================================================\n');

  let browser;
  let success = false;

  try {
    // Verificar que existe el archivo de cookies
    if (!fs.existsSync(COOKIES_FILE)) {
      console.error('❌ ERROR: No se encontró el archivo de cookies');
      console.log('\nPrimero ejecuta:');
      console.log('  node scripts/capture-auth-cookies.js');
      console.log('\nPara capturar las cookies manualmente.');
      process.exit(1);
    }

    const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf-8'));
    console.log(`[INFO] Cookies cargadas: ${cookies.length} en total`);

    const importantCookies = cookies.filter(c =>
      c.name === 'idTokenV0.1.0' || c.name === 'sessionBodas'
    );
    console.log(`  Cookies de autenticación: ${importantCookies.length}`);

    if (importantCookies.length < 2) {
      console.error('\n⚠️  ADVERTENCIA: Faltan cookies de autenticación');
      console.log('  Las cookies pueden haber expirado.');
      console.log('  Ejecuta de nuevo: node scripts/capture-auth-cookies.js');
    }

    console.log('\n[PASO 1] Abriendo navegador...');
    browser = await chromium.launch({
      headless: false,
      slowMo: 50
    });

    const context = await browser.newContext();

    // Inyectar las cookies ANTES de navegar
    console.log('\n[PASO 2] Inyectando cookies de autenticación...');
    await context.addCookies(cookies);
    console.log('  ✅ Cookies inyectadas');

    const page = await context.newPage();

    console.log('\n[PASO 3] Navegando a la homepage...');
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
    console.log('  ✅ Página cargada');

    // Verificar que las cookies están presentes
    const finalCookies = await context.cookies();
    const hasIdToken = finalCookies.some(c => c.name === 'idTokenV0.1.0');
    const hasSessionBodas = finalCookies.some(c => c.name === 'sessionBodas');

    console.log('\n[PASO 4] Verificando autenticación...');
    console.log(`  - idTokenV0.1.0: ${hasIdToken ? '✅' : '❌'}`);
    console.log(`  - sessionBodas: ${hasSessionBodas ? '✅' : '❌'}`);

    if (!hasIdToken || !hasSessionBodas) {
      console.log('\n❌ Las cookies no están presentes después de navegar');
      console.log('   Puede que hayan expirado. Captura nuevas cookies.');
      await screenshot(page, '00-auth-failed');
      await browser.close();
      process.exit(1);
    }

    // Esperar a que el loading desaparezca
    console.log('\n[PASO 5] Esperando que la página cargue completamente...');
    await page.waitForTimeout(5000);
    await waitForLoadingToDisappear(page, 30000);
    await screenshot(page, '01-homepage');

    console.log('\n[PASO 6] Abriendo Copilot...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const btn = btns.find(b => b.textContent?.trim() === 'Copilot');
      if (btn) btn.click();
    });
    await page.waitForTimeout(5000);
    await screenshot(page, '02-copilot-opened');

    console.log('\n[PASO 7] Esperando iframe del Copilot (60s)...');
    for (let i = 15; i <= 60; i += 15) {
      await page.waitForTimeout(15000);
      console.log(`  ${i}s...`);
    }
    console.log('  ✅ Iframe listo\n');
    await screenshot(page, '03-iframe-ready');

    const questions = [
      '¿Cuántos invitados tengo?',
      '¿Cuál es la boda de Raul?',
      'Muéstrame la lista de todas las bodas'
    ];
    const results = [];

    for (let i = 0; i < questions.length; i++) {
      const questionSuccess = await askQuestion(page, questions[i], i + 1);
      results.push({ question: questions[i], success: questionSuccess });
      if (i < questions.length - 1) {
        console.log('\n⏸️  Pausa 10s...\n');
        await page.waitForTimeout(10000);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN');
    console.log('='.repeat(70));
    results.forEach((r, i) => {
      console.log(`${i + 1}. ${r.success ? '✅' : '❌'} ${r.question}`);
    });
    console.log('='.repeat(70));

    success = results.every(r => r.success);

    if (success) {
      console.log('\n✅✅✅ TEST COMPLETADO EXITOSAMENTE ✅✅✅');
    } else {
      console.log('\n⚠️  TEST COMPLETADO CON ALGUNOS ERRORES');
    }

    console.log('\n📸 Capturas guardadas en /tmp/copilot-cookies-*.png');
    console.log('\n⏳ Manteniendo navegador abierto 10s para verificación...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  } finally {
    if (browser) {
      console.log('\n🔴 Cerrando navegador...');
      await browser.close();
      console.log('✅ Navegador cerrado');
    }

    process.exit(success ? 0 : 1);
  }
})();
