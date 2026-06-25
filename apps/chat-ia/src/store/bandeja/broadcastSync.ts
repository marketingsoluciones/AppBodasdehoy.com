/**
 * BroadcastChannel cross-tab sync.
 *
 * Cuando un user tiene varias tabs del mismo browser abiertas, NO queremos
 * abrir N conexiones SSE (una por tab). Una tab actúa de "leader" y mantiene
 * el SSE; las hermanas reciben los eventos vía BroadcastChannel.
 *
 * Leader election:
 *   - Cada tab al iniciar mira localStorage 'bandeja:leader' { tabId, ts }
 *   - Si ts > 5s atrás → asume liderazgo (el leader anterior murió)
 *   - El leader actualiza ts cada 2s (heartbeat)
 *   - Las hermanas no abren SSE, solo escuchan BroadcastChannel
 *
 * Si tu navegador no soporta BroadcastChannel (IE/Safari viejo) el cliente
 * se degrada a SSE por tab (comportamiento actual).
 */
import type { SSEEvent } from './types';

const CHANNEL_NAME = 'bandeja-events';
const LEADER_KEY = 'bandeja:leader';
const HEARTBEAT_MS = 2000;
const LEADER_STALE_MS = 5000;

let _channel: BroadcastChannel | null = null;
let _heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let _tabId: string | null = null;

function getTabId(): string {
  if (!_tabId) {
    _tabId = `tab-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
  }
  return _tabId;
}

function readLeader(): { tabId: string; ts: number } | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LEADER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.tabId !== 'string' || typeof parsed?.ts !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLeader(tabId: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LEADER_KEY, JSON.stringify({ tabId, ts: Date.now() }));
  } catch {
    /* quota or private mode */
  }
}

/**
 * Intenta tomar liderazgo. Devuelve true si esta tab es la leader.
 * Re-evaluar cada 2s.
 */
export function tryAcquireLeadership(): boolean {
  const tabId = getTabId();
  const current = readLeader();
  const now = Date.now();
  // Si no hay leader, soy yo. Si el leader es viejo (>5s sin heartbeat),
  // asumo. Si el leader soy yo, mantengo.
  if (!current || now - current.ts > LEADER_STALE_MS || current.tabId === tabId) {
    writeLeader(tabId);
    return true;
  }
  return false;
}

interface BroadcastInit {
  onLeaderEvent: (event: SSEEvent) => void;
  onBecameLeader?: () => void;
  onLostLeader?: () => void;
}

export function initBroadcast(opts: BroadcastInit): {
  isLeader: () => boolean;
  broadcastFromLeader: (event: SSEEvent) => void;
  destroy: () => void;
} {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    // Degradación: si no hay BroadcastChannel, esta tab es leader siempre
    return {
      isLeader: () => true,
      broadcastFromLeader: () => {},
      destroy: () => {},
    };
  }

  _channel = new BroadcastChannel(CHANNEL_NAME);
  let isLeader = tryAcquireLeadership();

  // Si soy leader, anuncio. Cuando pierdo liderazgo, otra tab tomará.
  _channel.onmessage = (e) => {
    if (!e?.data) return;
    if (e.data.kind === 'sse-event' && !isLeader) {
      opts.onLeaderEvent(e.data.event);
    }
  };

  _heartbeatTimer = setInterval(() => {
    const wasLeader = isLeader;
    isLeader = tryAcquireLeadership();
    if (isLeader && !wasLeader) opts.onBecameLeader?.();
    if (!isLeader && wasLeader) opts.onLostLeader?.();
  }, HEARTBEAT_MS);

  return {
    isLeader: () => isLeader,
    broadcastFromLeader: (event) => {
      if (!isLeader) return;
      _channel?.postMessage({ kind: 'sse-event', event });
    },
    destroy: () => {
      if (_heartbeatTimer) clearInterval(_heartbeatTimer);
      _heartbeatTimer = null;
      _channel?.close();
      _channel = null;
    },
  };
}
