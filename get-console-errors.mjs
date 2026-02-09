#!/usr/bin/env node
import { chromium } from 'playwright';

async function getConsoleErrors() {
  console.log('🔍 Obteniendo errores de la consola del navegador...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    // Capturar errores de consola
    const errors = [];
    const warnings = [];
    const logs = [];

    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        errors.push(text);
      } else if (msg.type() === 'warning') {
        warnings.push(text);
      } else {
        logs.push(text);
      }
    });

    page.on('pageerror', error => {
      errors.push(`PageError: ${error.message}\n${error.stack}`);
    });

    console.log('📍 Navegando a localhost:8080...');
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log('\n❌ ERRORES:\n');
    if (errors.length > 0) {
      errors.forEach((err, idx) => {
        console.log(`${idx + 1}. ${err}\n`);
      });
    } else {
      console.log('   No hay errores\n');
    }

    console.log('⚠️  WARNINGS:\n');
    if (warnings.length > 0) {
      warnings.slice(0, 5).forEach((warn, idx) => {
        console.log(`${idx + 1}. ${warn}\n`);
      });
    } else {
      console.log('   No hay warnings\n');
    }

    await page.screenshot({ path: 'with-console-monitoring.png', fullPage: true });
    console.log('📸 Screenshot: with-console-monitoring.png\n');

  } catch (error) {
    console.error('❌ Error al obtener logs:', error.message);
  }
}

getConsoleErrors().catch(console.error);
