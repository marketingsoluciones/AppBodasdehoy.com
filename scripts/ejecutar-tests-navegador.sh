#!/bin/bash

# Script para ejecutar tests desde el navegador usando Playwright
# Uso: ./scripts/ejecutar-tests-navegador.sh [url] [num-tests]

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🧪 Ejecutando tests en navegador...${NC}"

# Determinar URL
TESTSUITE_URL="${1:-https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests}"
NUM_TESTS="${2:-10}"

echo -e "${YELLOW}📍 URL: ${TESTSUITE_URL}${NC}"
echo -e "${YELLOW}📊 Tests a ejecutar: ${NUM_TESTS}${NC}"

# Verificar si Playwright está disponible
if ! command -v npx &> /dev/null; then
  echo -e "${RED}❌ npx no está disponible${NC}"
  exit 1
fi

# Crear script temporal de Playwright
TEMP_SCRIPT=$(mktemp)
cat > "$TEMP_SCRIPT" << 'EOF'
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const TESTSUITE_URL = process.argv[2] || 'https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests';
  const NUM_TESTS = parseInt(process.argv[3] || '10', 10);

  console.log(`🌐 Abriendo: ${TESTSUITE_URL}`);
  await page.goto(TESTSUITE_URL, { waitUntil: 'networkidle', timeout: 60000 });

  // Esperar a que cargue el TestSuite
  console.log('⏳ Esperando a que cargue el TestSuite...');
  await page.waitForSelector('h2:has-text("Test Suite")', { timeout: 30000 }).catch(() => {
    console.log('⚠️  No se encontró el título, continuando...');
  });

  // Esperar a que carguen los tests
  console.log('⏳ Esperando a que carguen los tests...');
  await page.waitForTimeout(3000);

  // Seleccionar los primeros N tests
  console.log(`✅ Seleccionando los primeros ${NUM_TESTS} tests...`);
  const checkboxes = await page.$$('tbody input[type="checkbox"]');
  const testsToSelect = Math.min(NUM_TESTS, checkboxes.length);
  
  for (let i = 0; i < testsToSelect; i++) {
    await checkboxes[i].check();
  }

  console.log(`✅ ${testsToSelect} tests seleccionados`);

  // Buscar y hacer click en el botón "Run Tests"
  console.log('🚀 Ejecutando tests...');
  const runButton = await page.$('button:has-text("Run Tests")');
  if (runButton) {
    await runButton.click();
    console.log('✅ Botón "Run Tests" presionado');
  } else {
    console.log('⚠️  No se encontró el botón "Run Tests"');
  }

  // Esperar a que termine la ejecución (máximo 5 minutos)
  console.log('⏳ Esperando a que terminen los tests (máximo 5 minutos)...');
  try {
    await page.waitForSelector('button:has-text("Stop")', { timeout: 10000 }).catch(() => {});
    
    // Esperar a que desaparezca el botón "Stop" (tests terminaron)
    await page.waitForFunction(
      () => {
        const stopButton = document.querySelector('button:has-text("Stop")');
        return !stopButton || stopButton.textContent?.includes('Run Tests');
      },
      { timeout: 300000 } // 5 minutos máximo
    );
    
    console.log('✅ Tests completados');
  } catch (error) {
    console.log('⚠️  Timeout esperando tests, pero continuando...');
  }

  // Tomar screenshot del resultado
  const screenshotPath = '/tmp/testsuite-result.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot guardado en: ${screenshotPath}`);

  // Mostrar resultados
  console.log('\n📊 Resultados:');
  const results = await page.evaluate(() => {
    const stats = document.querySelector('span:has-text("passed")');
    return stats ? stats.textContent : 'No se encontraron estadísticas';
  });
  console.log(`   ${results}`);

  // Mantener el navegador abierto por 10 segundos más para que el usuario vea los resultados
  console.log('\n⏳ Manteniendo navegador abierto por 10 segundos más...');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('✅ Completado');
})();
EOF

# Ejecutar el script
echo -e "${GREEN}🚀 Ejecutando Playwright...${NC}"
npx playwright-core run "$TEMP_SCRIPT" "$TESTSUITE_URL" "$NUM_TESTS" || {
  echo -e "${YELLOW}⚠️  Playwright no está disponible, intentando con Node.js directo...${NC}"
  node "$TEMP_SCRIPT" "$TESTSUITE_URL" "$NUM_TESTS" || {
    echo -e "${RED}❌ Error ejecutando tests${NC}"
    echo -e "${YELLOW}💡 Instala Playwright: npm install -D playwright${NC}"
    rm "$TEMP_SCRIPT"
    exit 1
  }
}

rm "$TEMP_SCRIPT"
echo -e "${GREEN}✅ Tests ejecutados${NC}"
