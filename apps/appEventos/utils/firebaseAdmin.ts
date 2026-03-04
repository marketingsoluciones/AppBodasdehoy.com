import * as admin from 'firebase-admin';

/**
 * Inicializa Firebase Admin SDK
 * Solo se inicializa una vez (singleton)
 */
export function initializeFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Verificar que las credenciales estén configuradas
  if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    throw new Error('Firebase Admin credentials not configured. Set FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY');
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || 'bodasdehoy-1063',
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
