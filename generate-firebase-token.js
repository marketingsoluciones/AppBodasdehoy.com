#!/usr/bin/env node

/**
 * Script para generar un Custom Token de Firebase
 *
 * Este token puede usarse para autenticar requests al backend
 * sin necesidad de hacer login desde el navegador.
 *
 * IMPORTANTE: Requiere Firebase Admin SDK credentials
 */

// Configuración de Firebase desde .env
const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDVMoVLWWvolofYOcTYA0JZ0QHyng72LAM',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'bodasdehoy-1063.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'bodasdehoy-1063',
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

console.log(`\n${colors.cyan}═══════════════════════════════════════`);
console.log(`  Generador de Token Firebase`);
console.log(`  Proyecto: ${FIREBASE_CONFIG.projectId}`);
console.log(`═══════════════════════════════════════${colors.reset}\n`);

console.log(`${colors.yellow}⚠️  MÉTODO RECOMENDADO:${colors.reset}`);
console.log(`
En lugar de generar un token con Admin SDK (requiere service account),
es más fácil obtenerlo desde appbodasdehoy.com donde ya estás logueado:

${colors.cyan}Pasos:${colors.reset}
1. Ir a: ${colors.green}https://appbodasdehoy.com${colors.reset}
2. Abrir DevTools (F12) → Console
3. Ejecutar:

${colors.green}firebase.auth().currentUser.getIdToken().then(t => {
  console.log('FIREBASE_TOKEN="' + t + '" node test-memories-api.js');
});${colors.reset}

4. Copiar y ejecutar el comando que aparece

${colors.cyan}═══════════════════════════════════════${colors.reset}

${colors.yellow}Alternativa: Usar email y contraseña${colors.reset}

Si tienes credenciales de prueba, puedo ayudarte a obtener el token.
Ejecuta:

${colors.green}node generate-firebase-token.js --email tu@email.com --password tupassword${colors.reset}

Pero IMPORTANTE: Este método requiere instalar Firebase SDK:
${colors.green}npm install firebase${colors.reset}

${colors.cyan}═══════════════════════════════════════${colors.reset}
`);

// Si se proporcionaron credenciales, intentar obtener token
const args = process.argv.slice(2);
const emailIndex = args.indexOf('--email');
const passwordIndex = args.indexOf('--password');

if (emailIndex !== -1 && passwordIndex !== -1 && args[emailIndex + 1] && args[passwordIndex + 1]) {
  console.log(`\n${colors.cyan}Intentando obtener token con credenciales...${colors.reset}\n`);

  (async () => {
    try {
      // Intentar cargar Firebase
      let firebase;
      try {
        firebase = await import('firebase/app');
        await import('firebase/auth');
      } catch (error) {
        console.error(`${colors.red}❌ Firebase no está instalado.${colors.reset}`);
        console.log(`\nInstalar con: ${colors.green}npm install firebase${colors.reset}\n`);
        process.exit(1);
      }

      // Inicializar Firebase
      if (!firebase.getApps || firebase.getApps().length === 0) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }

      const auth = firebase.getAuth();
      const email = args[emailIndex + 1];
      const password = args[passwordIndex + 1];

      console.log(`Email: ${email}`);
      console.log(`Autenticando...`);

      const userCredential = await firebase.signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();

      console.log(`\n${colors.green}✅ Token obtenido exitosamente!${colors.reset}\n`);
      console.log(`${colors.cyan}═══════════════════════════════════════`);
      console.log(`🔑 TOKEN FIREBASE`);
      console.log(`═══════════════════════════════════════${colors.reset}\n`);
      console.log(token);
      console.log(`\n${colors.cyan}═══════════════════════════════════════`);
      console.log(`📋 COMANDO PARA TESTING:`);
      console.log(`═══════════════════════════════════════${colors.reset}\n`);
      console.log(`${colors.green}FIREBASE_TOKEN="${token}" node test-memories-api.js${colors.reset}`);
      console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);
    } catch (error) {
      console.error(`${colors.red}❌ Error:${colors.reset}`, error.message);
      console.log(`\n${colors.yellow}Verifica que el email y password sean correctos.${colors.reset}\n`);
      process.exit(1);
    }
  })();
} else {
  console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`\n${colors.green}✅ Usa el método recomendado arriba ↑${colors.reset}\n`);
}
