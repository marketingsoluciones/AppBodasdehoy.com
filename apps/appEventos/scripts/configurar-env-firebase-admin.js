#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ENV_FILE = path.join(__dirname, '..', '.env.local');

console.log('\n======================================================================');
console.log('  🔧 Configurar Firebase Admin - Variables de Entorno');
console.log('======================================================================\n');

console.log('Este script te ayudará a configurar las variables de entorno necesarias');
console.log('para el sistema de tests autónomos.\n');

console.log('📋 Opciones:\n');
console.log('1. Pegar el contenido del JSON descargado de Firebase');
console.log('2. Proporcionar la ruta al archivo JSON descargado');
console.log('3. Configurar manualmente las variables\n');

rl.question('Selecciona una opción (1-3): ', (option) => {
  if (option === '1') {
    console.log('\n📋 Pega el contenido completo del archivo JSON y presiona Enter dos veces:\n');

    let jsonContent = '';
    rl.on('line', (line) => {
      if (line === '' && jsonContent) {
        processJSON(jsonContent);
      } else {
        jsonContent += line + '\n';
      }
    });

  } else if (option === '2') {
    rl.question('\n📁 Ingresa la ruta completa al archivo JSON: ', (filePath) => {
      try {
        const content = fs.readFileSync(filePath.trim(), 'utf8');
        processJSON(content);
      } catch (error) {
        console.error('\n❌ Error leyendo archivo:', error.message);
        rl.close();
      }
    });

  } else if (option === '3') {
    configureManually();

  } else {
    console.log('\n❌ Opción inválida');
    rl.close();
  }
});

function processJSON(jsonContent) {
  try {
    const credentials = JSON.parse(jsonContent);

    // Validar que sea un service account JSON
    if (!credentials.type || credentials.type !== 'service_account') {
      console.error('\n❌ El JSON no parece ser de un Service Account');
      console.error('   Asegúrate de descargar "Service Account Key" desde Firebase Console');
      rl.close();
      return;
    }

    const projectId = credentials.project_id;
    const clientEmail = credentials.client_email;
    const privateKey = credentials.private_key;

    console.log('\n✅ JSON válido encontrado:');
    console.log(`   Project ID: ${projectId}`);
    console.log(`   Client Email: ${clientEmail}`);

    saveToEnvFile(projectId, clientEmail, privateKey);

  } catch (error) {
    console.error('\n❌ Error parseando JSON:', error.message);
    console.error('   Asegúrate de pegar el JSON completo y válido');
    rl.close();
  }
}

function configureManually() {
  console.log('\n📝 Ingresa los valores manualmente:\n');

  rl.question('Project ID (ej: bodasdehoy-1063): ', (projectId) => {
    rl.question('Client Email: ', (clientEmail) => {
      console.log('\nPrivate Key (pega todo el contenido incluyendo');
      console.log('"-----BEGIN PRIVATE KEY-----" y "-----END PRIVATE KEY-----"):');

      let privateKey = '';
      rl.on('line', (line) => {
        privateKey += line + '\n';

        if (line.includes('-----END PRIVATE KEY-----')) {
          saveToEnvFile(projectId.trim(), clientEmail.trim(), privateKey.trim());
        }
      });
    });
  });
}

function saveToEnvFile(projectId, clientEmail, privateKey) {
  // Preparar las variables de entorno
  const envVars = `
# Firebase Admin SDK - Para tests automatizados
# Generado automáticamente: ${new Date().toISOString()}
FIREBASE_ADMIN_PROJECT_ID=${projectId}
FIREBASE_ADMIN_CLIENT_EMAIL=${clientEmail}
FIREBASE_ADMIN_PRIVATE_KEY="${privateKey.replace(/\n/g, '\\n')}"
`;

  // Leer .env.local existente o crear uno nuevo
  let existingEnv = '';
  if (fs.existsSync(ENV_FILE)) {
    existingEnv = fs.readFileSync(ENV_FILE, 'utf8');

    // Eliminar variables FIREBASE_ADMIN anteriores si existen
    existingEnv = existingEnv
      .split('\n')
      .filter(line => !line.startsWith('FIREBASE_ADMIN_'))
      .join('\n');
  }

  // Agregar nuevas variables
  const newEnvContent = existingEnv.trim() + '\n' + envVars;

  // Guardar
  fs.writeFileSync(ENV_FILE, newEnvContent);

  console.log('\n✅ Variables de entorno configuradas exitosamente!');
  console.log(`   Archivo: ${ENV_FILE}\n`);

  console.log('🧪 Para verificar que funciona, ejecuta:\n');
  console.log('1. Inicia el servidor de desarrollo:');
  console.log('   npm run dev\n');
  console.log('2. En otra terminal, prueba el endpoint:');
  console.log('   curl -X POST http://localhost:3000/api/testing/generate-auth-token \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"userId": "upSETrmXc7ZnsIhrjDjbHd7u2up1"}\'\n');
  console.log('3. Si funciona, ejecuta el test autónomo:');
  console.log('   node scripts/test-copilot-autonomo.js\n');

  rl.close();
}
