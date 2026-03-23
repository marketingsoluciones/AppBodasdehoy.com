/**
 * fixtures.ts — Datos de prueba y resolución centralizada de URLs para E2E
 *
 * ═══════════════════════════════════════════════════════════════════════
 * ENTORNOS SOPORTADOS (un solo env var controla todo):
 *
 *   E2E_ENV=local  →  http://<LAN-IP>:3210  (auto-detecta IP)
 *   E2E_ENV=dev    →  https://*-dev.bodasdehoy.com
 *   E2E_ENV=test   →  https://*-test.bodasdehoy.com
 *   E2E_ENV=prod   →  https://*.bodasdehoy.com
 *
 * También se puede forzar con BASE_URL / CHAT_URL / MEMORIES_URL.
 * Si no se pasa nada, default = local.
 *
 * PUERTOS LOCALES (monorepo):
 *   chat-ia     = 3210
 *   appEventos  = 3220
 *   editor-web  = 3230
 *   memories-web = 3240
 * ═══════════════════════════════════════════════════════════════════════
 */

import * as os from 'os';

// ─── LAN IP auto-detect ────────────────────────────────────────────────────────

/** Detecta la primera IPv4 no-loopback de la máquina (192.168.x.x, 10.x.x.x, etc.) */
function detectLanIp(): string {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] ?? []) {
        if (iface.family === 'IPv4' && !iface.internal && iface.address !== '127.0.0.1') {
          return iface.address;
        }
      }
    }
  } catch { /* ignore */ }
  // Fallback: usar 0.0.0.0 (Next.js -H 0.0.0.0 escucha en todas)
  return '0.0.0.0';
}

const LAN_IP = detectLanIp();

// ─── Puertos locales del monorepo ──────────────────────────────────────────────

const LOCAL_PORTS = {
  app: 3220,      // appEventos
  chat: 3210,     // chat-ia
  editor: 3230,   // editor-web
  memories: 3240, // memories-web
} as const;

// ─── Entorno ───────────────────────────────────────────────────────────────────

type E2eEnv = 'local' | 'dev' | 'test' | 'prod';

function detectEnv(): E2eEnv {
  const explicit = (process.env.E2E_ENV || '').toLowerCase();
  if (['local', 'dev', 'test', 'prod'].includes(explicit)) return explicit as E2eEnv;

  const base = process.env.BASE_URL || '';
  if (base.includes('-dev.')) return 'dev';
  if (base.includes('-test.')) return 'test';
  if (base.includes('.bodasdehoy.com') && !base.includes('-')) return 'prod';
  // 192.168, 127.0.0.1, localhost, o vacío → local
  return 'local';
}

export const E2E_ENV = detectEnv();

// ─── URL resolution ────────────────────────────────────────────────────────────

interface E2eUrls {
  app: string;       // appEventos
  chat: string;      // chat-ia
  memories: string;  // memories-web
}

function buildUrls(): E2eUrls {
  const envChat = process.env.CHAT_URL;
  const envApp = process.env.BASE_URL;
  const envMem = process.env.MEMORIES_URL;

  switch (E2E_ENV) {
    case 'dev':
      return {
        app: envApp || 'https://app-dev.bodasdehoy.com',
        chat: envChat || 'https://chat-dev.bodasdehoy.com',
        memories: envMem || 'https://memories-dev.bodasdehoy.com',
      };
    case 'test':
      return {
        app: envApp || 'https://app-test.bodasdehoy.com',
        chat: envChat || 'https://chat-test.bodasdehoy.com',
        memories: envMem || 'https://memories-test.bodasdehoy.com',
      };
    case 'prod':
      return {
        app: envApp || 'https://app.bodasdehoy.com',
        chat: envChat || 'https://chat.bodasdehoy.com',
        memories: envMem || 'https://memories.bodasdehoy.com',
      };
    case 'local':
    default: {
      // Si BASE_URL apunta a una IP/localhost específica, respetar eso
      const host = extractHost(envApp) || LAN_IP;
      return {
        app: envApp || `http://${host}:${LOCAL_PORTS.app}`,
        chat: envChat || `http://${host}:${LOCAL_PORTS.chat}`,
        memories: envMem || `http://${host}:${LOCAL_PORTS.memories}`,
      };
    }
  }
}

/** Extrae host de una URL (sin puerto). Ej: "http://192.168.1.48:3210" → "192.168.1.48" */
function extractHost(url?: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}

/** URLs resueltas para el entorno actual. Usar SIEMPRE estas. */
export const TEST_URLS: E2eUrls = buildUrls();

// ─── Compat: getChatUrl (legacy — los specs que lo importan siguen funcionando) ─

/**
 * @deprecated Usa TEST_URLS.chat directamente.
 * Mantenida para compatibilidad con specs existentes.
 */
export function getChatUrl(baseUrl?: string): string {
  if (process.env.CHAT_URL) return process.env.CHAT_URL;
  // Si no hay argumento, retorna la URL centralizada
  if (!baseUrl) return TEST_URLS.chat;

  const url = baseUrl;
  const lanMatch = url.match(/(https?:\/\/(?:192\.168|10|172\.(?:1[6-9]|2\d|3[01]))\.\d+\.\d+)/);
  if (lanMatch) return `${lanMatch[1]}:${LOCAL_PORTS.chat}`;
  const isLocal = url.includes('127.0.0.1') || url.includes('localhost') || !url.startsWith('http');
  if (isLocal) return `http://${LAN_IP}:${LOCAL_PORTS.chat}`;
  if (url.includes('-dev.')) return 'https://chat-dev.bodasdehoy.com';
  if (url.includes('-test.')) return 'https://chat-test.bodasdehoy.com';
  return 'https://chat.bodasdehoy.com';
}

/** URL de appEventos para el entorno actual. */
export function getAppUrl(): string {
  return process.env.APP_URL ?? TEST_URLS.app;
}

/** URL de memories-web para el entorno actual. */
export function getMemoriesUrl(): string {
  return process.env.MEMORIES_URL ?? TEST_URLS.memories;
}

// ─── Timestamp ─────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10).replace(/-/g, '');

// ─── Test data ─────────────────────────────────────────────────────────────────

export const TEST_CREDENTIALS = {
  email: process.env.TEST_USER_EMAIL || 'bodasdehoy.com@gmail.com',
  password: process.env.TEST_USER_PASSWORD || 'lorca2012M*+',
};

export const TEST_GUEST = {
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

export const KNOWN_EVENT_IDS: string[] = [];

export const TEST_CREDENTIALS_U2 = {
  email: process.env.TEST_USER2_EMAIL || 'test-usuario2@bodasdehoy.com',
  password: process.env.TEST_USER2_PASSWORD || 'TestBodas2024!',
};

export const VIVETUBODA_URLS = {
  chat: process.env.VTB_CHAT_URL || 'https://chat.vivetuboda.com',
  app: process.env.VTB_APP_URL || 'https://app.vivetuboda.com',
};

export const TEST_CREDENTIALS_VTB = {
  email: process.env.TEST_VIVETUBODA_EMAIL || '',
  password: process.env.TEST_VIVETUBODA_PASSWORD || '',
};

export const TEST_INVITATION_RECIPIENT = {
  email: 'carlos.carrillo@recargaexpress.com',
  name: 'Carlos',
};

export const LOGIN_TIMEOUT = 45_000;
export const APP_READY_TIMEOUT = 20_000;
export const CRUD_DEBOUNCE = 1_500;
