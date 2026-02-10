#!/usr/bin/env node

// Script para obtener token de Firebase usando REST API
const https = require('https');

const FIREBASE_API_KEY = 'AIzaSyDVMoVLWWvolofYOcTYA0JZ0QHyng72LAM';
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('❌ Uso: node get-firebase-token.js <email> <password>');
  process.exit(1);
}

const data = JSON.stringify({
  email: email,
  password: password,
  returnSecureToken: true
});

const options = {
  hostname: 'identitytoolkit.googleapis.com',
  path: `/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🔐 Autenticando con Firebase...\n');

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      const result = JSON.parse(responseData);
      const token = result.idToken;

      console.log('✅ Token obtenido exitosamente!\n');
      console.log('════════════════════════════════════════════');
      console.log('📋 EJECUTA ESTE COMANDO:');
      console.log('════════════════════════════════════════════\n');
      console.log(`FIREBASE_TOKEN="${token}" node test-memories-api.js`);
      console.log('\n════════════════════════════════════════════\n');
    } else {
      const error = JSON.parse(responseData);
      console.error('❌ Error:', error.error?.message || 'Error desconocido');
      console.error('Status:', res.statusCode);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error de red:', error.message);
  process.exit(1);
});

req.write(data);
req.end();
