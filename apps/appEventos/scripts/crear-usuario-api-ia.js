#!/usr/bin/env node

/**
 * Script para crear/sincronizar usuario en API-IA
 *
 * Uso:
 *   node crear-usuario-api-ia.js
 *
 * Este script llama al endpoint /api/auth/sync-user-identity
 * que CREA el usuario automáticamente si no existe.
 */

const https = require('https');

const BACKEND_URL = 'api-ia.bodasdehoy.com';
const USER_DATA = {
  user_id: 'upSETrmXc7ZnsIhrjDjbHd7u2up1',
  email: 'bodasdehoy.com@gmail.com',
  provider: 'firebase',
  development: 'bodasdehoy'
};

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║                                                                ║');
console.log('║         🔧 CREAR USUARIO EN API-IA (Sin SQL)                  ║');
console.log('║                                                                ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('');

console.log('📋 Datos del usuario:');
console.log(`   User ID:     ${USER_DATA.user_id}`);
console.log(`   Email:       ${USER_DATA.email}`);
console.log(`   Provider:    ${USER_DATA.provider}`);
console.log(`   Development: ${USER_DATA.development}`);
console.log('');

console.log('🔄 Sincronizando usuario con API-IA...');
console.log('');

const payload = JSON.stringify(USER_DATA);

const options = {
  hostname: BACKEND_URL,
  port: 443,
  path: '/api/auth/sync-user-identity',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`📡 Respuesta del servidor: HTTP ${res.statusCode}`);
    console.log('');

    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(data);

        if (response.success) {
          console.log('✅ ÉXITO: Usuario creado/sincronizado correctamente');
          console.log('');
          console.log('📊 Respuesta:');
          console.log(JSON.stringify(response, null, 2));
          console.log('');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🎉 EL USUARIO YA ESTÁ LISTO EN API-IA');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('');
          console.log('✅ Siguiente paso:');
          console.log('   1. Arreglar servidor LobeChat (chat-test.bodasdehoy.com)');
          console.log('   2. Ejecutar: node scripts/test-para-proveedor.js');
          console.log('');
          process.exit(0);
        } else {
          console.log('⚠️  Respuesta con success=false:');
          console.log(JSON.stringify(response, null, 2));
          process.exit(1);
        }
      } catch (err) {
        console.log('❌ Error parseando respuesta JSON:');
        console.log(data);
        process.exit(1);
      }
    } else {
      console.log('❌ Error del servidor:');
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Respuesta: ${data}`);
      console.log('');
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Error de conexión:');
  console.log(`   ${error.message}`);
  console.log('');
  console.log('Posibles causas:');
  console.log('   • No hay conexión a internet');
  console.log('   • El servidor API-IA no está accesible');
  console.log('   • Firewall bloqueando la conexión');
  console.log('');
  process.exit(1);
});

req.write(payload);
req.end();
