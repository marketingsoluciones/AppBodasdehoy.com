'use client';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

// B1 (8-sep): Firebase POR WHITELABEL (igual que appEventos) — el proyecto Firebase se resuelve
// por el development detectado (dominio/URL), no un único env. Necesario para el SSO multi-marca.
import { resolveFirebaseConfig } from './firebaseWhitelabels';

// Inicializar Firebase solo en cliente
function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;

  if (!getApps().length) {
    return initializeApp(resolveFirebaseConfig());
  }
  return getApps()[0];
}

function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) return null;
  return getAuth(app);
}

// Exportar como getters para evitar errores en SSR
export const app = getFirebaseApp();
export const auth = getFirebaseAuth() as Auth;
