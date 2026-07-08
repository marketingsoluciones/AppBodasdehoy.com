import * as admin from 'firebase-admin';

/**
 * Inicializa Firebase Admin SDK
 * Solo se inicializa una vez (singleton)
 */
export function initializeFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Verificar que las 3 credenciales estén configuradas (sin fallback).
  // Política PROHIBIDO FALLBACK + recomendación AWS SES (26-jun) "no almacenar
  // identificadores hardcoded en repos terceros". Cada whitelabel usa su
  // propio proyecto Firebase → el project ID DEBE venir de env, no de default.
  if (
    !process.env.FIREBASE_ADMIN_PROJECT_ID ||
    !process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
    !process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ) {
    throw new Error(
      'Firebase Admin credentials no configurados. Faltan FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL o FIREBASE_ADMIN_PRIVATE_KEY en .env del servidor.',
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

/**
 * Obtiene la instancia de Firebase Admin
 */
export function getFirebaseAdmin(): admin.app.App {
  if (admin.apps.length === 0) {
    return initializeFirebaseAdmin();
  }
  return admin.app();
}
