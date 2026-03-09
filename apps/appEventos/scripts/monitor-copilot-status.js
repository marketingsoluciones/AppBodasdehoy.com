#!/usr/bin/env node
/**
 * Monitor de Estado del Copilot - Tiempo Real
 *
 * Monitorea:
 * - Posición del copilot (izquierda/derecha)
 * - Estado del contenido principal
 * - Logs de consola en vivo
 * - Errores del iframe
 * - Estado de servidores
 *
 * Uso: node apps/web/scripts/monitor-copilot-status.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://127.0.0.1:8080';
const REPORT_FILE = path.join(__dirname, '../../../REPORTE_ESTADO_COPILOT.md');

let statusLog = [];
let consoleLog = [];
let errorLog = [];

function log(message) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const msg = `[${timestamp}] ${message}`;
  console.log(msg);
  statusLog.push(msg);
}

async function checkLayout(page) {
  return await page.evaluate(() => {
    // Find sidebar
    const sidebar = document.querySelector('[class*="ChatSidebar"], [class*="motion"]');
    const mainContent = document.querySelector('#rootElementMain, main');
    const navbar = document.querySelector('nav, [class*="Navigation"]');

    const result = {
      timestamp: new Date().toISOString(),
      sidebar: null,
      content: null,
      navbar: null,
      layout: 'unknown'
    };

    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      const styles = window.getComputedStyle(sidebar);
      result.sidebar = {
        visible: styles.display !== 'none' && rect.width > 0,
        position: {
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height
        },
        css: {
          position: styles.position,
          left: styles.left,
          right: styles.right
        },
        isLeftSided: rect.left < 10
      };
    }

    if (mainContent) {
      const rect = mainContent.getBoundingClientRect();
      const styles = window.getComputedStyle(mainContent);
      result.content = {
        position: {
          left: rect.left,
          right: rect.right,
          width: rect.width
        },
        css: {
          marginLeft: styles.marginLeft,
          marginRight: styles.marginRight
        }
      };
    }

    if (navbar) {
      const rect = navbar.getBoundingClientRect();
      result.navbar = {
        height: rect.height,
        width: rect.width
      };
    }

    // Determine layout
    if (result.sidebar && result.sidebar.isLeftSided && result.content) {
      const contentLeft = parseFloat(result.content.position.left);
      result.layout = contentLeft > 100 ? 'sidebar-left-content-right' : 'sidebar-left-content-overlapped';
    } else if (result.sidebar && !result.sidebar.isLeftSided) {
      result.layout = 'sidebar-right';
    } else {
      result.layout = 'no-sidebar';
    }

    return result;
  });
}

async function checkServers() {
  const http = require('http');
  const https = require('https');

  const servers = [
    { name: 'Web App', url: 'http://127.0.0.1:8080', protocol: 'http' },
    { name: 'Copilot Local', url: 'http://localhost:3210/bodasdehoy', protocol: 'http' },
    { name: 'Copilot Test', url: 'https://chat-test.bodasdehoy.com/bodasdehoy', protocol: 'https' }
  ];

  const results = [];

  for (const server of servers) {
    try {
      const proto = server.protocol === 'https' ? https : http;
      const result = await new Promise((resolve) => {
        const startTime = Date.now();
        const req = proto.get(server.url, (res) => {
          resolve({
            name: server.name,
            status: res.statusCode,
            time: Date.now() - startTime,
            ok: res.statusCode >= 200 && res.statusCode < 400
          });
          res.resume();
        });

        req.on('error', (err) => {
          resolve({
            name: server.name,
            status: 'ERROR',
            error: err.message,
            ok: false
          });
        });

        req.setTimeout(5000, () => {
          req.destroy();
          resolve({
            name: server.name,
            status: 'TIMEOUT',
            ok: false
          });
        });
      });

      results.push(result);
    } catch (err) {
      results.push({
        name: server.name,
        status: 'FAILED',
        error: err.message,
        ok: false
      });
    }
  }

  return results;
}

async function generateReport(layoutData, serverStatus) {
  const report = `# 📊 Reporte de Estado - Copilot Web App

**Generado**: ${new Date().toLocaleString('es-ES')}

---

## 🖥️ Estado de Servidores

${serverStatus.map(s => {
  const icon = s.ok ? '✅' : '❌';
  const details = s.time ? `(${s.time}ms)` : s.error ? `(${s.error})` : '';
  return `${icon} **${s.name}**: ${s.status} ${details}`;
}).join('\n')}

---

## 🎨 Layout Actual

**Configuración**: ${layoutData.layout.replace(/-/g, ' ').toUpperCase()}

### Sidebar (Copilot)
${layoutData.sidebar ? `
- **Visible**: ${layoutData.sidebar.visible ? 'SÍ ✅' : 'NO ❌'}
- **Posición**: ${layoutData.sidebar.isLeftSided ? 'IZQUIERDA ✅' : 'DERECHA ❌'}
- **Dimensiones**: ${layoutData.sidebar.position.width}px × ${layoutData.sidebar.position.height}px
- **Left**: ${layoutData.sidebar.position.left}px
- **CSS Position**: ${layoutData.sidebar.css.position}
` : '❌ No encontrado'}

### Contenido Principal
${layoutData.content ? `
- **Left**: ${layoutData.content.position.left}px
- **Width**: ${layoutData.content.position.width}px
- **Margin Left**: ${layoutData.content.css.marginLeft}
- **Margin Right**: ${layoutData.content.css.marginRight}
` : '❌ No encontrado'}

### Navbar
${layoutData.navbar ? `
- **Height**: ${layoutData.navbar.height}px
- **Width**: ${layoutData.navbar.width}px
` : '❌ No encontrado'}

---

## 📋 Logs de Consola (Últimos 20)

\`\`\`
${consoleLog.slice(-20).join('\n')}
\`\`\`

---

## ❌ Errores Detectados

${errorLog.length > 0 ? errorLog.slice(-10).map(e => `- ${e}`).join('\n') : '✅ Sin errores'}

---

## 📈 Histórico de Estado

\`\`\`
${statusLog.slice(-30).join('\n')}
\`\`\`

---

## 🔧 Comandos Útiles

### Ver logs en tiempo real
\`\`\`bash
tail -f ${REPORT_FILE}
\`\`\`

### Reiniciar servidor web
\`\`\`bash
pkill -f "next dev.*8080"
pnpm --filter @bodasdehoy/web dev
\`\`\`

### Reiniciar copilot
\`\`\`bash
pkill -f "next dev.*3210"
pnpm --filter @bodasdehoy/copilot dev
\`\`\`

### Ver estado de procesos
\`\`\`bash
ps aux | grep -E "(8080|3210)" | grep next
\`\`\`

---

**Última actualización**: ${new Date().toISOString()}
`;

  fs.writeFileSync(REPORT_FILE, report);
  log(`✅ Reporte guardado en: ${REPORT_FILE}`);
}

async function main() {
  console.clear();
  console.log('='.repeat(80));
  console.log('🔍 MONITOR DE ESTADO - COPILOT WEB APP');
  console.log('='.repeat(80));
  console.log('');

  log('🚀 Iniciando monitor...');

  // Check servers first
  log('📡 Verificando servidores...');
  const serverStatus = await checkServers();

  serverStatus.forEach(s => {
    const icon = s.ok ? '✅' : '❌';
    log(`${icon} ${s.name}: ${s.status}${s.time ? ` (${s.time}ms)` : ''}`);
  });

  if (!serverStatus.find(s => s.name === 'Web App').ok) {
    log('❌ Servidor web no disponible. Abortando.');
    process.exit(1);
  }

  log('🌐 Abriendo navegador...');

  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1600,1000', '--window-position=0,0']
  });

  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 }
  });

  const page = await context.newPage();

  // Capture console
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleLog.push(text);

    if (msg.type() === 'error') {
      errorLog.push(text);
    }

    // Log relevant messages
    if (text.includes('CopilotDirect') || text.includes('ChatSidebar') || text.includes('ERROR')) {
      console.log(text);
    }
  });

  // Capture errors
  page.on('pageerror', err => {
    const msg = `[PAGE ERROR] ${err.message}`;
    errorLog.push(msg);
    console.log(msg);
  });

  log('📄 Navegando a home...');
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);

  log('🎨 Analizando layout...');
  const layoutData = await checkLayout(page);

  console.log('');
  console.log('📊 LAYOUT DETECTADO:');
  console.log(`   Configuración: ${layoutData.layout}`);
  if (layoutData.sidebar) {
    console.log(`   Sidebar: ${layoutData.sidebar.isLeftSided ? 'IZQUIERDA ✅' : 'DERECHA ❌'}`);
    console.log(`   Sidebar Visible: ${layoutData.sidebar.visible ? 'SÍ ✅' : 'NO ❌'}`);
  }
  if (layoutData.content) {
    console.log(`   Contenido Left: ${layoutData.content.position.left}px`);
    console.log(`   Contenido Width: ${layoutData.content.position.width}px`);
  }
  console.log('');

  // Try to open copilot
  log('🤖 Intentando abrir copilot...');
  await page.keyboard.press('Meta+Shift+C');
  await page.waitForTimeout(3000);

  const layoutAfterOpen = await checkLayout(page);
  log(`   Layout después de abrir: ${layoutAfterOpen.layout}`);

  // Generate initial report
  await generateReport(layoutAfterOpen, serverStatus);

  // Screenshot
  const screenshotPath = path.join(__dirname, 'monitor-screenshot.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  log(`📸 Screenshot guardado: ${screenshotPath}`);

  console.log('');
  console.log('='.repeat(80));
  console.log('✅ MONITOR ACTIVO');
  console.log('='.repeat(80));
  console.log('');
  console.log(`📄 Reporte: ${REPORT_FILE}`);
  console.log(`📸 Screenshot: ${screenshotPath}`);
  console.log('');
  console.log('💡 El navegador queda abierto para inspección manual');
  console.log('   Presiona Ctrl+C para cerrar');
  console.log('');

  // Monitor loop - update every 10 seconds
  setInterval(async () => {
    try {
      const currentLayout = await checkLayout(page);
      const currentServers = await checkServers();
      await generateReport(currentLayout, currentServers);
      log('🔄 Reporte actualizado');
    } catch (err) {
      log(`❌ Error en loop: ${err.message}`);
    }
  }, 10000);

  // Keep running
  await new Promise(() => {});

}

main().catch(err => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
