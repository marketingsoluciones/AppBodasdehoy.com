#!/usr/bin/env node

/**
 * TEST COMPLETO PARA EL EQUIPO DE API-IA
 * Pruebas reales con usuario autenticado para identificar problemas del backend
 */

const https = require('https');

const BACKEND_IA_URL = 'https://api-ia.bodasdehoy.com';
const TEST_USER = {
  uid: 'upSETrmXc7ZnsIhrjDjbHd7u2up1',
  email: 'bodasdehoy.com@gmail.com',
  displayName: 'Bodas de Hoy Test'
};

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║                                                                ║');
console.log('║         TEST COMPLETO PARA API-IA BACKEND                     ║');
console.log('║                                                                ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log(`Usuario de prueba: ${TEST_USER.email}`);
console.log(`UID: ${TEST_USER.uid}\n`);

const results = {
  tests: [],
  errors: [],
  warnings: []
};

// Helper para hacer requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => reject(error));

    if (postData) {
      req.write(JSON.stringify(postData));
    }

    req.end();
  });
}

async function runTests() {

  // ════════════════════════════════════════════════════════════════
  // TEST 1: Verificar que el backend esté arriba
  // ════════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Verificar estado del backend');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const response = await makeRequest({
      hostname: 'api-ia.bodasdehoy.com',
      path: '/health',
      method: 'GET'
    });

    console.log(`Status: ${response.statusCode}`);
    console.log(`Body: ${response.body.substring(0, 200)}...\n`);

    if (response.statusCode === 200) {
      console.log('✅ Backend está ARRIBA\n');
      results.tests.push({ test: 'Backend Health', status: 'PASS' });
    } else {
      console.log(`⚠️ Backend responde pero con status ${response.statusCode}\n`);
      results.warnings.push(`Backend /health retorna ${response.statusCode}`);
    }
  } catch (error) {
    console.log(`❌ Backend NO responde: ${error.message}\n`);
    results.errors.push({ test: 'Backend Health', error: error.message });
  }

  // ════════════════════════════════════════════════════════════════
  // TEST 2: Verificar endpoint de configuración
  // ════════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Endpoint de configuración (/api/config/bodasdehoy)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const response = await makeRequest({
      hostname: 'api-ia.bodasdehoy.com',
      path: '/api/config/bodasdehoy',
      method: 'GET'
    });

    console.log(`Status: ${response.statusCode}`);
    console.log(`Body: ${response.body.substring(0, 300)}...\n`);

    if (response.statusCode === 200) {
      console.log('✅ Configuración accesible\n');
      results.tests.push({ test: 'Config Endpoint', status: 'PASS' });
    } else {
      console.log(`❌ Error ${response.statusCode} al obtener configuración\n`);
      results.errors.push({ test: 'Config Endpoint', status: response.statusCode });
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
    results.errors.push({ test: 'Config Endpoint', error: error.message });
  }

  // ════════════════════════════════════════════════════════════════
  // TEST 3: Verificar identify-user (CRÍTICO - Retorna 404)
  // ════════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Identificar usuario (/api/auth/identify-user)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('⚠️ Este endpoint retorna 404 en las pruebas anteriores\n');

  try {
    const response = await makeRequest({
      hostname: 'api-ia.bodasdehoy.com',
      path: '/api/auth/identify-user',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      uid: TEST_USER.uid,
      email: TEST_USER.email,
      displayName: TEST_USER.displayName
    });

    console.log(`Status: ${response.statusCode}`);
    console.log(`Body: ${response.body}\n`);

    if (response.statusCode === 200) {
      console.log('✅ Usuario identificado correctamente\n');
      results.tests.push({ test: 'Identify User', status: 'PASS' });
    } else if (response.statusCode === 404) {
      console.log('❌ PROBLEMA ENCONTRADO: Endpoint NO existe (404)\n');
      console.log('   🔍 PREGUNTA PARA API-IA:');
      console.log('   ¿Este endpoint está implementado?');
      console.log('   ¿Cómo debería identificarse el usuario?\n');
      results.errors.push({
        test: 'Identify User',
        status: 404,
        question: 'Endpoint no existe - ¿Está implementado?'
      });
    } else {
      console.log(`⚠️ Status inesperado: ${response.statusCode}\n`);
      results.warnings.push(`Identify user retorna ${response.statusCode}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
    results.errors.push({ test: 'Identify User', error: error.message });
  }

  // ════════════════════════════════════════════════════════════════
  // TEST 4: Verificar debug-logs (Retorna 500)
  // ════════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 4: Debug logs (/api/debug-logs/upload)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('⚠️ Este endpoint retorna 500 en las pruebas anteriores\n');

  try {
    const response = await makeRequest({
      hostname: 'api-ia.bodasdehoy.com',
      path: '/api/debug-logs/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      level: 'info',
      message: 'Test log from automated test',
      timestamp: new Date().toISOString()
    });

    console.log(`Status: ${response.statusCode}`);
    console.log(`Body: ${response.body}\n`);

    if (response.statusCode === 200) {
      console.log('✅ Debug logs funcionan\n');
      results.tests.push({ test: 'Debug Logs', status: 'PASS' });
    } else if (response.statusCode === 500) {
      console.log('❌ PROBLEMA ENCONTRADO: Error interno del servidor (500)\n');
      console.log('   🔍 PREGUNTA PARA API-IA:');
      console.log('   ¿Por qué este endpoint falla?');
      console.log('   ¿Hay logs del servidor mostrando el error?\n');
      results.errors.push({
        test: 'Debug Logs',
        status: 500,
        question: 'Error 500 - ¿Qué causa el fallo?'
      });
    } else {
      console.log(`⚠️ Status inesperado: ${response.statusCode}\n`);
      results.warnings.push(`Debug logs retorna ${response.statusCode}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
    results.errors.push({ test: 'Debug Logs', error: error.message });
  }

  // ════════════════════════════════════════════════════════════════
  // TEST 5: Verificar GraphQL endpoint
  // ════════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 5: GraphQL endpoint (/graphql)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const response = await makeRequest({
      hostname: 'api-ia.bodasdehoy.com',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      query: `
        query {
          __schema {
            queryType {
              name
            }
          }
        }
      `
    });

    console.log(`Status: ${response.statusCode}`);
    console.log(`Body: ${response.body.substring(0, 200)}...\n`);

    if (response.statusCode === 200) {
      console.log('✅ GraphQL endpoint funciona\n');
      results.tests.push({ test: 'GraphQL', status: 'PASS' });
    } else {
      console.log(`❌ Error ${response.statusCode} en GraphQL\n`);
      results.errors.push({ test: 'GraphQL', status: response.statusCode });
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
    results.errors.push({ test: 'GraphQL', error: error.message });
  }

  // ════════════════════════════════════════════════════════════════
  // TEST 6: Verificar sync-user-identity
  // ════════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 6: Sincronizar identidad (/api/auth/sync-user-identity)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const response = await makeRequest({
      hostname: 'api-ia.bodasdehoy.com',
      path: '/api/auth/sync-user-identity',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      uid: TEST_USER.uid,
      email: TEST_USER.email,
      provider: 'firebase'
    });

    console.log(`Status: ${response.statusCode}`);
    console.log(`Body: ${response.body}\n`);

    if (response.statusCode === 200) {
      console.log('✅ Sincronización funciona\n');
      results.tests.push({ test: 'Sync Identity', status: 'PASS' });
    } else {
      console.log(`❌ Error ${response.statusCode}\n`);
      results.errors.push({ test: 'Sync Identity', status: response.statusCode });
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
    results.errors.push({ test: 'Sync Identity', error: error.message });
  }

  // ════════════════════════════════════════════════════════════════
  // TEST 7: Verificar save-user-config
  // ════════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 7: Guardar configuración (/api/auth/save-user-config)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const response = await makeRequest({
      hostname: 'api-ia.bodasdehoy.com',
      path: '/api/auth/save-user-config',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      uid: TEST_USER.uid,
      config: {
        theme: 'dark',
        language: 'es'
      }
    });

    console.log(`Status: ${response.statusCode}`);
    console.log(`Body: ${response.body}\n`);

    if (response.statusCode === 200) {
      console.log('✅ Guardar config funciona\n');
      results.tests.push({ test: 'Save Config', status: 'PASS' });
    } else {
      console.log(`❌ Error ${response.statusCode}\n`);
      results.errors.push({ test: 'Save Config', status: response.statusCode });
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
    results.errors.push({ test: 'Save Config', error: error.message });
  }

  // ════════════════════════════════════════════════════════════════
  // RESUMEN FINAL
  // ════════════════════════════════════════════════════════════════
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║                    RESUMEN DE PRUEBAS                          ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log(`Tests ejecutados: ${results.tests.length + results.errors.length}`);
  console.log(`✅ Tests exitosos: ${results.tests.length}`);
  console.log(`❌ Tests fallidos: ${results.errors.length}`);
  console.log(`⚠️ Advertencias: ${results.warnings.length}\n`);

  if (results.errors.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ERRORES ENCONTRADOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    results.errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.test}`);
      if (err.status) console.log(`   Status: ${err.status}`);
      if (err.error) console.log(`   Error: ${err.error}`);
      if (err.question) console.log(`   ❓ ${err.question}`);
      console.log('');
    });
  }

  if (results.warnings.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ADVERTENCIAS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    results.warnings.forEach((warn, i) => {
      console.log(`${i + 1}. ${warn}`);
    });
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PREGUNTAS PARA EL EQUIPO DE API-IA:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('1. ¿Existe el endpoint /api/auth/identify-user?');
  console.log('   → Actualmente retorna 404\n');
  console.log('2. ¿Por qué /api/debug-logs/upload retorna 500?');
  console.log('   → ¿Hay logs del servidor mostrando el error?\n');
  console.log('3. ¿Cómo debería autenticarse el usuario con el backend?');
  console.log('   → ¿Necesita token de Firebase?\n');
  console.log('4. ¿El backend está recibiendo las preguntas del Copilot?');
  console.log('   → ¿Se están procesando?\n');
  console.log('5. ¿Los eventos SSE se están enviando correctamente?');
  console.log('   → ¿El frontend los está recibiendo?\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📁 Resultados guardados en formato JSON para el equipo\n');

  // Guardar resultados en JSON
  const fs = require('fs');
  fs.writeFileSync(
    '/tmp/resultados-api-ia.json',
    JSON.stringify(results, null, 2)
  );

  console.log('✅ /tmp/resultados-api-ia.json\n');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
}

runTests().catch(console.error);
