/**
 * Firebase POR WHITELABEL (B1, 8-sep) — chat-ia adopta el modelo multi-Firebase de appEventos.
 * =============================================================================================
 * Antes chat-ia usaba UN solo proyecto Firebase (bodasdehoy-1063 vía env), mientras appEventos
 * usa un proyecto DISTINTO por marca (`apps/appEventos/firebase.tsx`). Eso rompía el SSO
 * chat-ia↔appEventos para marcas != bodasdehoy (tokens de proyectos Firebase distintos).
 *
 * Estos valores son un ESPEJO EXACTO de `apps/appEventos/firebase.tsx` (fileConfig por marca).
 * ⚠️ Mantener sincronizado con appEventos. TODO: extraer a `packages/shared` como fuente única.
 */
import { getCurrentDevelopment } from '@/utils/developmentDetector';

export interface FirebaseWhitelabelConfig {
  apiKey: string;
  authDomain: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

export const FIREBASE_BY_DEVELOPMENT: Record<string, FirebaseWhitelabelConfig> = {
  bodasdehoy: {
    apiKey: 'AIzaSyDVMoVLWWvolofYOcTYA0JZ0QHyng72LAM',
    appId: '1:593952495916:web:c63cf15fd16a6796f6f489',
    authDomain: 'bodasdehoy-1063.firebaseapp.com',
    measurementId: 'G-GWQ17NF2YR',
    messagingSenderId: '593952495916',
    projectId: 'bodasdehoy-1063',
    storageBucket: 'bodasdehoy-1063.appspot.com',
  },
  'eventosplanificador': {
    apiKey: 'AIzaSyA_BIthVz_uwQR7gObnKPjI2KincIvP5lo',
    appId: '1:1087923505585:web:7573effc0a8663d5429590',
    authDomain: 'eventosplanificador-74e59.firebaseapp.com',
    measurementId: 'G-BJK5EBV8H0',
    messagingSenderId: '1087923505585',
    projectId: 'eventosplanificador-74e59',
    storageBucket: 'eventosplanificador-74e59.appspot.com',
  },
  eventosorganizador: {
    apiKey: 'AIzaSyD3O0Nb4du1DPZod-6ZGpzw4jLGjXXKKUI',
    appId: '1:492151341830:web:35178ccf72d2dbcf6d1487',
    authDomain: 'eventosorganizador-2ed10.firebaseapp.com',
    measurementId: 'G-FC99T7WZS8',
    messagingSenderId: '492151341830',
    projectId: 'eventosorganizador-2ed10',
  },
  vivetuboda: {
    apiKey: 'AIzaSyCkj2D1mO-jdMUDwAQVL7tXCGuNusT5ubc',
    appId: '1:209046290590:web:db0fbe47c3963ddd143b8f',
    authDomain: 'vivetuboda-l.firebaseapp.com',
    measurementId: 'G-PTQM1HELZC',
    messagingSenderId: '209046290590',
    projectId: 'vivetuboda-l',
    storageBucket: 'vivetuboda-l.appspot.com',
  },
  'champagne-events': {
    apiKey: 'AIzaSyAhDpYfpElzfl-RNP9Tyz7GTaF5N_hHKlA',
    appId: '1:70019683977:web:10648516be16afd5879858',
    authDomain: 'champagne-events-mx.firebaseapp.com',
    measurementId: 'G-8X6QVM9165',
    messagingSenderId: '70019683977',
    projectId: 'champagne-events-mx',
    storageBucket: 'champagne-events-mx.appspot.com',
  },
  annloevents: {
    apiKey: 'AIzaSyC9mUmQ_wiIu-itBfgSlVNLdzRcZbjI3MM',
    appId: '1:204540888172:web:2f174c646cb822116f0449',
    authDomain: 'annloevents-app.firebaseapp.com',
    measurementId: 'G-4W4VHN7TVN',
    messagingSenderId: '204540888172',
    projectId: 'annloevents-app',
    storageBucket: 'annloevents-app.firebasestorage.app',
  },
  miamorcitocorazon: {
    apiKey: 'AIzaSyABo01h3OYGUa-edeknZ2-F1b3ltGudbYo',
    appId: '1:621496856930:web:87aa45e6977b3ea2813c3b',
    authDomain: 'miamorcitocorazon-planificador.firebaseapp.com',
    measurementId: 'G-ZRY28E6YPG',
    messagingSenderId: '621496856930',
    projectId: 'miamorcitocorazon-planificador',
    storageBucket: 'miamorcitocorazon-planificador.firebasestorage.app',
  },
  eventosintegrados: {
    apiKey: 'AIzaSyD2oie-ze53bnkwGs84O07dg-vooDnLY-g',
    appId: '1:251095054818:web:ad74627e3112f20504a1bb',
    authDomain: 'eventosintegrados-app.firebaseapp.com',
    measurementId: 'G-4WVS9SGEY5',
    messagingSenderId: '251095054818',
    projectId: 'eventosintegrados-app',
    storageBucket: 'eventosintegrados-app.firebasestorage.app',
  },
  ohmaratilano: {
    apiKey: 'AIzaSyDgog0QuV2ZAduEGYroBUoDp_COwgh-ePc',
    appId: '1:834371259019:web:dd8d6a7bf21a4e4e56228e',
    authDomain: 'ohmaratilano-app.firebaseapp.com',
    measurementId: 'G-4XH8FBGR1R',
    messagingSenderId: '834371259019',
    projectId: 'ohmaratilano-app',
    storageBucket: 'ohmaratilano-app.firebasestorage.app',
  },
  corporativozr: {
    apiKey: 'AIzaSyCyNPFSVkh7u7JkiYYI2oHzSSnIKok5JpE',
    appId: '1:798723721379:web:3c13e3999ab357f1fad716',
    authDomain: 'corporativozr-app.firebaseapp.com',
    measurementId: 'G-M58YVQJ0LS',
    messagingSenderId: '798723721379',
    projectId: 'corporativozr-app',
    storageBucket: 'corporativozr-app.firebasestorage.app',
  },
  theweddingplanner: {
    apiKey: 'AIzaSyDaJcojMTSdMkjxCLY3rEtL0Htf51sFUik',
    appId: '1:557540930291:web:518494e9c89789ffbcfd86',
    authDomain: 'theweddingplanner-app.firebaseapp.com',
    measurementId: 'G-FW08N94PTL',
    messagingSenderId: '557540930291',
    projectId: 'theweddingplanner-app',
    storageBucket: 'theweddingplanner-app.firebasestorage.app',
  },
};

/** Config Firebase del env (fallback ultimate — proyecto bodasdehoy-1063). */
const ENV_FIREBASE_CONFIG: FirebaseWhitelabelConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || FIREBASE_BY_DEVELOPMENT.bodasdehoy.apiKey,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || FIREBASE_BY_DEVELOPMENT.bodasdehoy.appId,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || FIREBASE_BY_DEVELOPMENT.bodasdehoy.authDomain,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || FIREBASE_BY_DEVELOPMENT.bodasdehoy.messagingSenderId,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || FIREBASE_BY_DEVELOPMENT.bodasdehoy.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || FIREBASE_BY_DEVELOPMENT.bodasdehoy.storageBucket,
};

/**
 * Resuelve el config Firebase del whitelabel ACTUAL (por dominio/URL, igual que appEventos).
 * Fallback: env (bodasdehoy). Se llama en cliente (getCurrentDevelopment usa window); en SSR
 * devuelve el env por defecto.
 */
export function resolveFirebaseConfig(): FirebaseWhitelabelConfig {
  try {
    const dev = getCurrentDevelopment();
    if (dev && FIREBASE_BY_DEVELOPMENT[dev]) return FIREBASE_BY_DEVELOPMENT[dev];
  } catch {
    /* noop */
  }
  return ENV_FIREBASE_CONFIG;
}
