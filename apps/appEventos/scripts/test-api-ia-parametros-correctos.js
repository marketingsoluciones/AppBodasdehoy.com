#!/usr/bin/env node

/**
 * TEST CON PARÁMETROS CORREGIDOS
 * Basado en los errores 422 que indican qué parámetros espera el backend
 */

const https = require('https');

const TEST_USER = {
  user_id: 'upSETrmXc7ZnsIhrjDjbHd7u2up1', // Cambiado de uid a user_id
  email: 'bodasdehoy.com@gmail.com',
  displayName: 'Bodas de Hoy Test'
};

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║    TEST CON PARÁMETROS CORREGIDOS (user_id en lugar de uid)   ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        body: data
      }));
    });
    req.on('error', reject);
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

async function runTests() {

  // ════════════════════════════════════════════════════════════════
  // TEST 1: sync-user-identity con user_id
  // ════════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Sincronizar identidad (con user_id correcto)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const response = await makeRequest({
      hostname: 'api-ia.bodasdehoy.com',
      path: '/api/auth/sync-user-identity',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      user_id: TEST_USER.user_id,
      email: TEST_USER.email,
      provider: 'firebase'
    });

    console.log(`Status: ${response.statusCode}`);
    console.log(`Body: ${response.body}\n`);

    if (response.statusCode === 200) {
      console.log('✅ Sincronización exitosa\n');
    } else if (response.statusCode === 404) {
      console.log('❌ Usuario NO existe en api-ia\n');
      console.log('   → Necesita ser creado primero\n');
    } else {
      console.log(`⚠️ Status: ${response.statusCode}\n`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // ════════════════════════════════════════════════════════════════
  // TEST 2: save-user-config con user_id
  // ════════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Guardar configuración (con user_id correcto)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const response = await makeRequest({
      hostname: 'api-ia.bodasdehoy.com',
      path: '/api/auth/save-user-config',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      user_id: TEST_USER.user_id,
      config: {
        theme: 'dark',
        language: 'es'
      }
    });

    console.log(`Status: ${response.statusCode}`);
    console.log(`Body: ${response.body}\n`);

    if (response.statusCode === 200) {
      console.log('✅ Configuración guardada\n');
    } else if (response.statusCode === 404) {
      console.log('❌ Usuario NO existe en api-ia\n');
    } else {
      console.log(`⚠️ Status: ${response.statusCode}\n`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // ════════════════════════════════════════════════════════════════
  // TEST 3: debug-logs con formato de array
  // ════════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Debug logs (con array de logs)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const response = await makeRequest({
      hostname: 'api-ia.bodasdehoy.com',
      path: '/api/debug-logs/upload',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      logs: [
        {
          level: 'info',
          message: 'Test log from automated test',
          timestamp: new Date().toISOString()
        }
      ]
    });

    console.log(`Status: ${response.statusCode}`);
    console.log(`Body: ${response.body}\n`);

    if (response.statusCode === 200) {
      console.log('✅ Logs subidos correctamente\n');
    } else {
      console.log(`⚠️ Status: ${response.statusCode}\n`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // ════════════════════════════════════════════════════════════════
  // TEST 4: Intentar crear usuario (si hay endpoint)
  // ════════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 4: Crear usuario (si existe el endpoint)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const createEndpoints = [
    '/api/auth/create-user',
    '/api/auth/register',
    '/api/users/create'
  ];

  for (const endpoint of createEndpoints) {
    console.log(`Probando: ${endpoint}`);

    try {
      const response = await makeRequest({
        hostname: 'api-ia.bodasdehoy.com',
        path: endpoint,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        user_id: TEST_USER.user_id,
        email: TEST_USER.email,
        displayName: TEST_USER.displayName,
        provider: 'firebase'
      });

      console.log(`  Status: ${response.statusCode}`);

      if (response.statusCode === 200 || response.statusCode === 201) {
        console.log(`  ✅ ENCONTRADO: ${endpoint} funciona!\n`);
        console.log(`  Response: ${response.body}\n`);
        break;
      } else if (response.statusCode === 404) {
        console.log(`  ❌ No existe\n`);
      } else {
        console.log(`  ⚠️ Retorna ${response.statusCode}`);
        console.log(`  ${response.body.substring(0, 200)}\n`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
    }
  }

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                         CONCLUSIÓN                             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log('Si todos los tests fallaron con 404 "Usuario no encontrado",');
  console.log('significa que el usuario necesita existir en api-ia primero.\n');
  console.log('ACCIÓN REQUERIDA DEL EQUIPO API-IA:');
  console.log('1. Crear el usuario de prueba en la base de datos');
  console.log('2. O compartir cómo crear usuarios mediante API\n');
}

runTests().catch(console.error);
