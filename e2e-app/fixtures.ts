/**
 * fixtures.ts — Datos de prueba fijos para E2E
 *
 * Para los tests CRUD reales (acciones-crud.spec.ts) necesitamos:
 *   1. Una cuenta de prueba que ya tenga al menos un evento creado
 *   2. Nombres/emails únicos de invitados de prueba (con timestamp para no colisionar)
 *   3. Descripciones únicas de partidas de presupuesto
 *
 * La cuenta principal de prueba es bodasdehoy.com@gmail.com
 * que ya tiene eventos creados en app-test.bodasdehoy.com.
 */

/** Timestamp corto del día de hoy para sufijos únicos sin colisiones de runs paralelos */
const TODAY = new Date().toISOString().slice(0, 10).replace(/-/g, '');

export const TEST_CREDENTIALS = {
  email: process.env.TEST_USER_EMAIL || 'bodasdehoy.com@gmail.com',
  password: process.env.TEST_USER_PASSWORD || 'lorca2012M*+',
};

export const TEST_GUEST = {
  /** Nombre único por ejecución: "E2E Test 20240308" */
  nombre: `E2E Test ${TODAY}`,
  email: `e2e-test-${TODAY}@bodasdehoy-test.com`,
  telefono: '+34600000000',
};

export const TEST_BUDGET_ITEM = {
  descripcion: `E2E Partida ${TODAY}`,
  importe: '250',
};

export const TEST_TASK = {
  descripcion: `E2E Tarea ${TODAY}`,
  prioridad: 'alta',
};

export const TEST_TABLE = {
  nombre: `Mesa E2E ${TODAY}`,
  capacidad: 8,
};

/**
 * IDs conocidos de eventos de prueba en la cuenta bodasdehoy.com@gmail.com.
 * Si está vacío los tests seleccionan el primer evento disponible.
 * Actualizar cuando se cree un evento de prueba fijo.
 */
export const KNOWN_EVENT_IDS: string[] = [
  // '507f1f77bcf86cd799439011', // ejemplo — actualizar con el ID real
];

/** URL base de test (app y chat) */
export const TEST_URLS = {
  app: process.env.BASE_URL || 'https://app-test.bodasdehoy.com',
  chat: process.env.CHAT_URL || 'https://chat-test.bodasdehoy.com',
};

/** Usuario secundario (novia/pareja) — comparte evento con U1 */
export const TEST_CREDENTIALS_U2 = {
  email: process.env.TEST_USER2_EMAIL || 'test-usuario2@bodasdehoy.com',
  password: process.env.TEST_USER2_PASSWORD || 'TestBodas2024!',
};

/** vivetuboda — developer distinto para tests de billing/saldo */
export const VIVETUBODA_URLS = {
  chat: process.env.VTB_CHAT_URL || 'https://chat.vivetuboda.com',
  app: process.env.VTB_APP_URL || 'https://app.vivetuboda.com',
};

export const TEST_CREDENTIALS_VTB = {
  email: process.env.TEST_VIVETUBODA_EMAIL || '',
  password: process.env.TEST_VIVETUBODA_PASSWORD || '',
};

/** Destinatario real de invitaciones de prueba */
export const TEST_INVITATION_RECIPIENT = {
  email: 'carlos.carrillo@recargaexpress.com',
  name: 'Carlos',
};

/** Tiempo máximo en ms para operaciones de login */
export const LOGIN_TIMEOUT = 45_000;
/** Tiempo máximo para que la app cargue tras login */
export const APP_READY_TIMEOUT = 20_000;
/** Tiempo de debounce para operaciones CRUD */
export const CRUD_DEBOUNCE = 1_500;
