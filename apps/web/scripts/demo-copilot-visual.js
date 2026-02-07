#!/usr/bin/env node
/**
 * Demo Visual del Copilot - Control Total del Navegador
 *
 * Abre el navegador y demuestra:
 * 1. Copilot a la IZQUIERDA
 * 2. Contenido a la DERECHA
 * 3. Interacción en tiempo real
 */

const { chromium } = require('playwright');

const BASE = 'http://127.0.0.1:8080';

async function main() {
  console.clear();
  console.log('='.repeat(80));
  console.log('🎬 DEMO VISUAL - COPILOT FUNCIONANDO');
  console.log('='.repeat(80));
  console.log('');
  console.log('📌 Vas a ver:');
  console.log('   1. Navegador abriendo la web app');
  console.log('   2. Copilot apareciendo a la IZQUIERDA');
  console.log('   3. Contenido ajustándose a la DERECHA');
  console.log('   4. Todo funcionando en tiempo real');
  console.log('');
  console.log('💡 El navegador quedará ABIERTO para que lo controles manualmente');
  console.log('   Presiona Ctrl+C cuando termines');
  console.log('');
  console.log('='.repeat(80));
  console.log('');

  console.log('🌐 Abriendo navegador...');

  const browser = await chromium.launch({
    headless: false,  // ✅ VISUAL
    slowMo: 500,      // ✅ Movimientos lentos para que veas
    args: [
      '--window-size=1800,1200',
      '--window-position=100,50',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1800, height: 1200 }
  });

  const page = await context.newPage();

  // Capturar logs para mostrar actividad
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('CopilotDirect') || text.includes('ChatSidebar')) {
      console.log(`   [NAVEGADOR] ${text}`);
    }
  });

  console.log('📄 Navegando a home...');
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);

  console.log('');
  console.log('📊 Estado actual:');

  // Verificar layout inicial
  const initialLayout = await page.evaluate(() => {
    const sidebar = document.querySelector('[class*="ChatSidebar"]');
    const content = document.querySelector('#rootElementMain, main');

    return {
      sidebarVisible: sidebar ? window.getComputedStyle(sidebar).display !== 'none' : false,
      contentMarginLeft: content ? window.getComputedStyle(content.parentElement).marginLeft : '0px'
    };
  });

  console.log(`   Sidebar visible: ${initialLayout.sidebarVisible ? '✅ SÍ' : '❌ NO (aún cerrado)'}`);
  console.log(`   Contenido margin-left: ${initialLayout.contentMarginLeft}`);
  console.log('');

  console.log('🤖 Abriendo copilot con Cmd+Shift+C...');
  console.log('   (Vas a ver el sidebar entrando desde la IZQUIERDA)');
  console.log('');

  // Abrir copilot
  await page.keyboard.press('Meta+Shift+C');
  await page.waitForTimeout(2000);

  // Verificar que abrió
  const afterOpen = await page.evaluate(() => {
    const sidebar = document.querySelector('[class*="ChatSidebar"], [class*="motion"]');
    const content = document.querySelector('#rootElementMain, main');

    if (!sidebar) return { error: 'Sidebar no encontrado' };

    const rect = sidebar.getBoundingClientRect();
    const contentParent = content?.parentElement;
    const contentMargin = contentParent ? window.getComputedStyle(contentParent).marginLeft : '0px';

    return {
      sidebar: {
        visible: window.getComputedStyle(sidebar).display !== 'none',
        left: rect.left,
        width: rect.width,
        position: window.getComputedStyle(sidebar).position
      },
      content: {
        marginLeft: contentMargin,
        width: content?.getBoundingClientRect().width
      }
    };
  });

  console.log('📊 Estado después de abrir copilot:');
  console.log('');

  if (afterOpen.error) {
    console.log(`   ⚠️  ${afterOpen.error}`);
  } else {
    console.log('   🎨 SIDEBAR (Copilot):');
    console.log(`      Visible: ${afterOpen.sidebar.visible ? '✅ SÍ' : '❌ NO'}`);
    console.log(`      Position: ${afterOpen.sidebar.position}`);
    console.log(`      Left: ${afterOpen.sidebar.left}px ${afterOpen.sidebar.left < 10 ? '✅ (IZQUIERDA!)' : '❌ (debería ser 0)'}`);
    console.log(`      Width: ${afterOpen.sidebar.width}px`);
    console.log('');
    console.log('   📄 CONTENIDO PRINCIPAL:');
    console.log(`      Margin Left: ${afterOpen.content.marginLeft} ${parseFloat(afterOpen.content.marginLeft) > 100 ? '✅ (Empujado a la derecha!)' : '⚠️'}`);
    console.log(`      Width: ${afterOpen.content.width}px`);
    console.log('');
  }

  // Esperar a que cargue el iframe
  console.log('⏳ Esperando a que cargue el copilot iframe...');
  await page.waitForTimeout(5000);

  // Verificar iframe
  const iframeStatus = await page.evaluate(() => {
    const iframe = document.querySelector('iframe[title*="Copilot"], iframe[src*="localhost:3210"]');
    if (!iframe) return { found: false };

    return {
      found: true,
      src: iframe.src,
      width: iframe.getBoundingClientRect().width,
      height: iframe.getBoundingClientRect().height
    };
  });

  console.log('📦 Estado del iframe:');
  if (iframeStatus.found) {
    console.log(`   ✅ Iframe encontrado`);
    console.log(`   URL: ${iframeStatus.src}`);
    console.log(`   Tamaño: ${iframeStatus.width}x${iframeStatus.height}px`);
  } else {
    console.log(`   ⚠️  Iframe no encontrado`);
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('✅ DEMO COMPLETADA');
  console.log('='.repeat(80));
  console.log('');
  console.log('💡 El navegador está ABIERTO y funcionando');
  console.log('   Puedes:');
  console.log('   - Interactuar con el copilot');
  console.log('   - Hacer preguntas');
  console.log('   - Redimensionar el sidebar arrastrando el borde');
  console.log('   - Cerrar con Cmd+Shift+C de nuevo');
  console.log('');
  console.log('🔧 Para cerrar: Presiona Ctrl+C en esta terminal');
  console.log('');

  // Mantener abierto
  await new Promise(() => {});
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
