import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

// B1 (8-sep): Firebase POR WHITELABEL (igual que appEventos) — proyecto Firebase por development
// (dominio/URL). En SSR resuelve al env (bodasdehoy). Necesario para SSO multi-marca.
import { resolveFirebaseConfig } from '@/config/firebaseWhitelabels';

const firebaseConfig = resolveFirebaseConfig();

// Inicializar Firebase (solo una vez)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Obtener Auth instance
export const auth = getAuth(app);

// ✅ Configurar persistencia para que funcione mejor con redirects
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.warn('⚠️ Error configurando persistencia de Firebase:', error);
  });
}

// Exportar configuración
export { firebaseConfig };

