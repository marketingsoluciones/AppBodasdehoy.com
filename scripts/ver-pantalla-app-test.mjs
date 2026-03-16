#!/usr/bin/env node
/**
 * Abre app-test.bodasdehoy.com con Playwright y muestra qué se ve:
 * - A los 2s: texto visible (si sigue "Cargando...")
 * - A los 6s: texto visible de nuevo (debería ser ya la app o el botón "Continuar como invitado")
 * - Screenshot en test-results/pantalla-app-test.png
 *
 * Uso: node scripts/ver-pantalla-app-test.mjs
 *      BASE_URL=https://app-test.bodasdehoy.com node scripts/ver-pantalla-app-test.mjs
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'https://app-test.bodasdehoy.com';

async function getVisibleText(page) {
  const body = await page.locator('body').textContent();
  return (body || '').replace(/\s+/g, ' ').trim().slice(0, 800);
}

async function main() {
  console.log('Abriendo', BASE_URL, '...\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  try {
    await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('load').catch(() => {});

    console.log('--- A los 2 segundos ---');
    await page.waitForTimeout(2000);
    const text2 = await getVisibleText(page);
    console.log(text2);
    console.log('');

    console.log('--- A los 6 segundos (tras timeouts de carga) ---');
    await page.waitForTimeout(4000);
    const text6 = await getVisibleText(page);
    console.log(text6);
    console.log('');

    const hasCargando = text6.includes('Cargando') && text6.includes('está respondiendo');
    const hasContinuar = text6.includes('Continuar como invitado');
    const hasApp = text6.includes('eventos') || text6.includes('Eventos') || text6.includes('Iniciar') || text6.includes('Login');

    console.log('--- Resumen ---');
    console.log('¿Sigue "Cargando... está respondiendo"?', hasCargando ? 'Sí' : 'No');
    console.log('¿Aparece botón "Continuar como invitado"?', hasContinuar ? 'Sí' : 'No');
    console.log('¿Parece contenido de la app (eventos/login)?', hasApp ? 'Sí' : 'No');

    const outDir = dirname(__dirname) + '/test-results';
    try {
      mkdirSync(outDir, { recursive: true });
      const path = outDir + '/pantalla-app-test.png';
      await page.screenshot({ path, fullPage: false });
      console.log('\nScreenshot guardado:', path);
    } catch (e) {
      console.log('\nNo se pudo guardar screenshot:', e.message);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
