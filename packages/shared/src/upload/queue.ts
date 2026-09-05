/**
 * UploadQueue universal — cola de subida persistente con concurrencia + retries.
 *
 * Diseño:
 *   - Agnóstica al transporte. Recibe un `uploader(file, ctx, onProgress, signal)`
 *     que el caller proporciona (hoy singleUpload, mañana D5).
 *   - Persistencia en IndexedDB: SOLO metadata + el handle del File (los File
 *     binarios pesan y no se persisten — IndexedDB con structuredClone los
 *     guarda como Blob automáticamente cuando el browser lo soporta).
 *   - Concurrencia configurable (default 3).
 *   - Resume después de refresh: al instanciar, restaura items con
 *     status='queued' o 'error' y los relanza.
 *   - Eventos: subscribers reactivos para UI (tray, badge, etc.).
 *
 * Lo que NO hace este módulo (intencional):
 *   - Validación: ya la hace validateFiles/validateFile antes de add().
 *   - Compresión: ya la hace compressImage antes de add().
 *   - HEIC: ya lo hace convertHeicIfNeeded antes de add().
 *   - Renderizado: hooks/components viven en apps consumidoras.
 */

import { withRetry } from './retry';
import type { FileCategory } from './validation';

// ════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════

export type UploadStatus = 'queued' | 'uploading' | 'paused' | 'error' | 'done';

export interface UploadContext {
  entityType: string;
  entityId: string;
  category?: string;
  visibility?: string;
  development?: string;
  /** Tag libre para identificar/agrupar items (ej. 'task-attachment'). */
  tag?: string;
  /** Datos extra que el uploader consumidor necesite (no se persisten si no son serializables). */
  meta?: Record<string, any>;
}

export interface UploadResult {
  /** ID asignado por el backend (api-mcp file._id, etc.). */
  fileId?: string;
  /** URL pública absoluta del archivo subido (origin o publicUrls.original). */
  url?: string;
  /** Forma legacy {i320,i640,i800,i1024} si aplica (consumers viejos). */
  sizes?: { i320?: string | null; i640?: string | null; i800?: string | null; i1024?: string | null };
  /** Cualquier metadata adicional que devuelva el uploader. */
  raw?: any;
}

export interface UploadItem {
  /** ID único del item en la cola (no del archivo en el backend). */
  id: string;
  /** Archivo a subir. */
  file: File;
  category: FileCategory;
  ctx: UploadContext;
  status: UploadStatus;
  /** Progreso 0..100. */
  progress: number;
  /** Reintentos consumidos (para mostrar al usuario "reintento 2/3"). */
  attempts: number;
  /** Mensaje legible si status='error'. */
  error?: string;
  /** Resultado del uploader cuando status='done'. */
  result?: UploadResult;
  /** Timestamps para ordenar y debug. */
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

/** Función que el caller proporciona para hacer el upload real. */
export type UploaderFn = (
  file: File,
  ctx: UploadContext,
  onProgress: (pct: number) => void,
  signal: AbortSignal,
) => Promise<UploadResult>;

export interface UploadQueueOptions {
  /** Cuántos items en paralelo. Default: 3. */
  concurrency?: number;
  /** Persistencia. Default: true (IndexedDB). */
  persist?: boolean;
  /** Nombre del store en IndexedDB. Default: 'upload-queue'. */
  storeName?: string;
  /** Reintentos por item (sobre los retries que ya pueda hacer el uploader). Default: 1. */
  maxItemRetries?: number;
}

export type QueueListener = (items: ReadonlyArray<UploadItem>) => void;

// ════════════════════════════════════════════════════════════════
// PERSISTENCIA IndexedDB (mínima, sin lib externa)
// ════════════════════════════════════════════════════════════════

const DB_NAME = 'bodasdehoy-upload-queue';
const DB_VERSION = 1;

async function openDB(storeName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      }
    };
  });
}

async function persistItem(storeName: string, item: UploadItem): Promise<void> {
  try {
    const db = await openDB(storeName);
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    // status='uploading' lo guardamos como 'queued' para que al restaurar se
    // relance (no hay manera de reanudar a media subida con singleUpload).
    const persistable = { ...item, status: item.status === 'uploading' ? 'queued' : item.status };
    store.put(persistable);
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  } catch {
    // Persistencia es best-effort; si IndexedDB falla (Safari privado, cuota
    // llena, etc.), la cola sigue funcionando en memoria.
  }
}

async function deleteItem(storeName: string, id: string): Promise<void> {
  try {
    const db = await openDB(storeName);
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id);
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  } catch {
    /* best-effort */
  }
}

async function loadAll(storeName: string): Promise<UploadItem[]> {
  try {
    const db = await openDB(storeName);
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => {
        db.close();
        resolve((req.result as UploadItem[]) ?? []);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return [];
  }
}

// ════════════════════════════════════════════════════════════════
// COLA
// ════════════════════════════════════════════════════════════════

let _idSeq = 0;
function newId(): string {
  _idSeq += 1;
  // Date.now() permitido al cliente (no a workflows). En cola del runtime browser sin problema.
  return `up_${typeof Date !== 'undefined' ? Date.now() : 0}_${_idSeq}`;
}

export class UploadQueue {
  private items: UploadItem[] = [];
  private listeners = new Set<QueueListener>();
  private running = 0;
  private aborts = new Map<string, AbortController>();
  private uploader: UploaderFn;
  private concurrency: number;
  private persist: boolean;
  private storeName: string;
  private maxItemRetries: number;

  constructor(uploader: UploaderFn, opts: UploadQueueOptions = {}) {
    this.uploader = uploader;
    this.concurrency = opts.concurrency ?? 3;
    this.persist = opts.persist !== false && typeof indexedDB !== 'undefined';
    this.storeName = opts.storeName ?? 'upload-queue';
    this.maxItemRetries = opts.maxItemRetries ?? 1;
  }

  /** Restaura items pendientes desde IndexedDB (llamar al montar la app). */
  async restore(): Promise<void> {
    if (!this.persist) return;
    const restored = await loadAll(this.storeName);
    const pending = restored.filter((i) => i.status === 'queued' || i.status === 'error');
    if (pending.length === 0) return;
    this.items = [...this.items, ...pending];
    this.emit();
    this.drain();
  }

  /** Suscribirse a cambios. Devuelve unsubscribe. */
  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    listener([...this.items]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    const snapshot: ReadonlyArray<UploadItem> = [...this.items];
    for (const l of this.listeners) {
      try {
        l(snapshot);
      } catch {
        /* listener errors no rompen la cola */
      }
    }
  }

  /** Snapshot de la cola actual. */
  getItems(): ReadonlyArray<UploadItem> {
    return [...this.items];
  }

  /** Progreso global 0..100. */
  getTotalProgress(): number {
    const active = this.items.filter((i) => i.status !== 'done');
    if (active.length === 0) return 100;
    const sum = active.reduce((acc, i) => acc + i.progress, 0);
    return Math.round(sum / active.length);
  }

  /** Añade archivos a la cola. Devuelve los IDs creados. */
  add(files: File[] | FileList, ctx: UploadContext, category?: FileCategory): string[] {
    const arr = Array.from(files);
    const ids: string[] = [];
    for (const file of arr) {
      const item: UploadItem = {
        id: newId(),
        file,
        category: category ?? ('other' as FileCategory),
        ctx,
        status: 'queued',
        progress: 0,
        attempts: 0,
        createdAt: Date.now(),
      };
      this.items.push(item);
      ids.push(item.id);
      if (this.persist) void persistItem(this.storeName, item);
    }
    this.emit();
    this.drain();
    return ids;
  }

  /** Cancela un item (aborta upload si está en curso, lo quita de la cola). */
  cancel(id: string): void {
    const i = this.items.findIndex((x) => x.id === id);
    if (i < 0) return;
    const abort = this.aborts.get(id);
    if (abort) abort.abort();
    this.aborts.delete(id);
    this.items.splice(i, 1);
    if (this.persist) void deleteItem(this.storeName, id);
    this.emit();
    this.drain();
  }

  /** Reintenta un item en estado error. */
  retry(id: string): void {
    const item = this.items.find((x) => x.id === id);
    if (!item || item.status !== 'error') return;
    item.status = 'queued';
    item.progress = 0;
    item.error = undefined;
    if (this.persist) void persistItem(this.storeName, item);
    this.emit();
    this.drain();
  }

  /** Quita los items terminados (done) de la cola (clean-up UI). */
  clearDone(): void {
    const remaining: UploadItem[] = [];
    for (const item of this.items) {
      if (item.status === 'done') {
        if (this.persist) void deleteItem(this.storeName, item.id);
      } else {
        remaining.push(item);
      }
    }
    this.items = remaining;
    this.emit();
  }

  /** Cancela TODO (panic button). */
  cancelAll(): void {
    for (const item of this.items) {
      const a = this.aborts.get(item.id);
      if (a) a.abort();
      if (this.persist) void deleteItem(this.storeName, item.id);
    }
    this.aborts.clear();
    this.items = [];
    this.emit();
  }

  /** Drain loop — arranca uploads hasta llenar concurrencia. */
  private drain(): void {
    while (this.running < this.concurrency) {
      const next = this.items.find((i) => i.status === 'queued');
      if (!next) return;
      void this.startItem(next);
    }
  }

  private async startItem(item: UploadItem): Promise<void> {
    item.status = 'uploading';
    item.startedAt = Date.now();
    this.running += 1;
    if (this.persist) void persistItem(this.storeName, item);
    this.emit();

    const ctrl = new AbortController();
    this.aborts.set(item.id, ctrl);

    try {
      const result = await withRetry(
        () =>
          this.uploader(item.file, item.ctx, (pct) => {
            item.progress = Math.max(0, Math.min(100, pct));
            this.emit();
          }, ctrl.signal),
        { maxRetries: this.maxItemRetries, initialDelay: 1000, backoffMultiplier: 2 },
      );
      item.status = 'done';
      item.progress = 100;
      item.completedAt = Date.now();
      item.result = result;
    } catch (err: any) {
      item.attempts += 1;
      // Si fue cancelación explícita, el item ya no está en this.items;
      // si sigue, marcar como error.
      const stillThere = this.items.find((x) => x.id === item.id);
      if (stillThere) {
        item.status = 'error';
        item.error = (err?.message as string) || 'Upload failed';
      }
    } finally {
      this.aborts.delete(item.id);
      this.running -= 1;
      if (this.persist) void persistItem(this.storeName, item);
      this.emit();
      this.drain();
    }
  }
}
