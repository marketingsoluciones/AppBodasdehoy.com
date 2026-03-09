import { sql } from 'drizzle-orm';
import { PgliteDatabase, drizzle } from 'drizzle-orm/pglite';
import { Md5 } from 'ts-md5';

import {
  ClientDBLoadingProgress,
  DatabaseLoadingState,
  MigrationSQL,
  MigrationTableItem,
} from '@/types/clientDB';
import { sleep } from '@/utils/sleep';

import migrations from '../core/migrations.json';
import { DrizzleMigrationModel } from '../models/drizzleMigration';
import * as schema from '../schemas';

const pgliteSchemaHashCache = 'LOBE_CHAT_PGLITE_SCHEMA_HASH';

const DB_NAME = 'lobechat';
type DrizzleInstance = PgliteDatabase<typeof schema>;

interface onErrorState {
  error: Error;
  migrationTableItems: MigrationTableItem[];
  migrationsSQL: MigrationSQL[];
}

export interface DatabaseLoadingCallbacks {
  onError?: (error: onErrorState) => void;
  onProgress?: (progress: ClientDBLoadingProgress) => void;
  onStateChange?: (state: DatabaseLoadingState) => void;
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private dbInstance: DrizzleInstance | null = null;
  private initPromise: Promise<DrizzleInstance> | null = null;
  private callbacks?: DatabaseLoadingCallbacks;
  private isLocalDBSchemaSynced = false;

  // CDN 配置
  private static WASM_CDN_URL =
    'https://registry.npmmirror.com/@electric-sql/pglite/0.2.17/files/dist/postgres.wasm';

  private static FSBUNDLER_CDN_URL =
    'https://registry.npmmirror.com/@electric-sql/pglite/0.2.17/files/dist/postgres.data';

  private static VECTOR_CDN_URL =
    'https://registry.npmmirror.com/@electric-sql/pglite/0.2.17/files/dist/vector.tar.gz';

  // ✅ OPTIMIZACIÓN: Timeouts reducidos agresivamente para carga más rápida
  // Si algo tarda más, es mejor fallar rápido y usar cache/fallback
  private static readonly TIMEOUTS = {
    LOAD_DEPENDENCIES: 15000, // ✅ Reducido de 30s a 15s
    LOAD_WASM: 30000, // ✅ Reducido de 60s a 30s (WASM puede ser grande, pero 30s es suficiente)
    INIT_WORKER: 10000, // ✅ Reducido de 15s a 10s
    MIGRATE: 10000, // ✅ Reducido de 20s a 10s
    INITIALIZE: 60000, // ✅ Reducido de 120s a 60s (1 minuto) para todo el proceso
  };

  // Helper para crear timeout promise
  private createTimeout<T>(ms: number, message: string): Promise<never> {
    return new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout: ${message} después de ${ms}ms`)), ms);
    });
  }

  private constructor() {}

  static getInstance() {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // 加载并编译 WASM 模块
  private async loadWasmModule(): Promise<WebAssembly.Module> {
    const start = Date.now();
    this.callbacks?.onStateChange?.(DatabaseLoadingState.LoadingWasm);

    try {
      // ✅ Agregar timeout a la descarga de WASM
      const fetchPromise = fetch(DatabaseManager.WASM_CDN_URL);
      const timeoutPromise = this.createTimeout(
        DatabaseManager.TIMEOUTS.LOAD_WASM,
        'Descarga de WASM',
      );

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      const contentLength = Number(response.headers.get('Content-Length')) || 0;
      const reader = response.body?.getReader();

      if (!reader) throw new Error('Failed to start WASM download');

      let receivedLength = 0;
      const chunks: Uint8Array[] = [];

      // ✅ Agregar timeout al bucle de lectura
      const readTimeout = Date.now() + DatabaseManager.TIMEOUTS.LOAD_WASM;

      // 读取数据流
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // Verificar timeout en cada iteración
        if (Date.now() > readTimeout) {
          throw new Error(
            `Timeout: Lectura de WASM tardó más de ${DatabaseManager.TIMEOUTS.LOAD_WASM}ms`,
          );
        }

        const readPromise = reader.read();
        const readTimeoutPromise = this.createTimeout(5000, 'Lectura de chunk WASM');

        const { done, value } = await Promise.race([readPromise, readTimeoutPromise]);

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        // 计算并报告进度
        const progress = Math.min(Math.round((receivedLength / contentLength) * 100), 100);
        this.callbacks?.onProgress?.({
          phase: 'wasm',
          progress,
        });
      }

      // 合并数据块
      const wasmBytes = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        wasmBytes.set(chunk, position);
        position += chunk.length;
      }

      this.callbacks?.onProgress?.({
        costTime: Date.now() - start,
        phase: 'wasm',
        progress: 100,
      });

      // ✅ Agregar timeout a la compilación WASM
      const compilePromise = WebAssembly.compile(wasmBytes);
      const compileTimeoutPromise = this.createTimeout(30000, 'Compilación de WASM');

      return await Promise.race([compilePromise, compileTimeoutPromise]);
    } catch (error) {
      console.error('❌ Error cargando WASM:', error);
      throw error;
    }
  }

  private fetchFsBundle = async () => {
    // ✅ MEJORADO: Mostrar progreso durante la descarga del bundle
    const startTime = Date.now();
    console.log('📦 Iniciando descarga de postgres.data...');

    const fetchPromise = fetch(DatabaseManager.FSBUNDLER_CDN_URL);
    const timeoutPromise = this.createTimeout(
      DatabaseManager.TIMEOUTS.LOAD_DEPENDENCIES,
      'Descarga de FSBundle',
    );

    const res = await Promise.race([fetchPromise, timeoutPromise]);

    const contentLength = Number(res.headers.get('Content-Length')) || 0;
    const reader = res.body?.getReader();

    if (!reader) {
      // Si no hay reader, devolver blob directamente
      return await res.blob();
    }

    // ✅ MEJORADO: Mostrar progreso durante la descarga
    let receivedLength = 0;
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      receivedLength += value.length;

      // Reportar progreso cada 10% o cada segundo
      if (contentLength > 0) {
        const progress = Math.min(Math.round((receivedLength / contentLength) * 100), 100);
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = receivedLength / elapsed; // bytes por segundo
        const sizeMB = (contentLength / 1024 / 1024).toFixed(2);
        const receivedMB = (receivedLength / 1024 / 1024).toFixed(2);

        // Solo reportar cada 5% para no saturar
        if (progress % 5 === 0 || receivedLength === contentLength) {
          console.log(`📦 Descargando postgres.data: ${progress}% (${receivedMB}MB / ${sizeMB}MB) - ${(speed / 1024 / 1024).toFixed(2)} MB/s`);
          this.callbacks?.onProgress?.({
            phase: 'dependencies',
            progress: progress,
            costTime: elapsed * 1000,
          });
        }
      }
    }

    // Combinar chunks
    const blob = new Blob(chunks);
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ postgres.data descargado en ${totalTime}s`);

    return blob;
  };

  // 异步加载 PGlite 相关依赖
  private async loadDependencies() {
    const start = Date.now();
    this.callbacks?.onStateChange?.(DatabaseLoadingState.LoadingDependencies);

    try {
      const imports = [
        import('@electric-sql/pglite').then((m) => ({
          IdbFs: m.IdbFs,
          MemoryFS: m.MemoryFS,
          PGlite: m.PGlite,
        })),
        import('@electric-sql/pglite/vector'),
        this.fetchFsBundle(),
      ];

      // ✅ MEJORADO: Mostrar qué archivo se está cargando
      const loadPromise = (async () => {
        let loaded = 0;
        const fileNames = ['PGlite (módulo)', 'Vector (extensión)', 'postgres.data (archivo)'];

        const results = await Promise.all(
          imports.map(async (importPromise, index) => {
            const fileName = fileNames[index] || `Archivo ${index + 1}`;
            console.log(`📥 Cargando ${fileName}...`);

            // ✅ Agregar timeout individual a cada import
            const timeoutPromise = this.createTimeout(
              DatabaseManager.TIMEOUTS.LOAD_DEPENDENCIES,
              `Carga de ${fileName}`,
            );

            try {
              const result = await Promise.race([importPromise, timeoutPromise]);
              loaded += 1;
              console.log(`✅ ${fileName} cargado (${loaded}/${imports.length})`);

              // 计算加载进度
              this.callbacks?.onProgress?.({
                phase: 'dependencies',
                progress: Math.min(Math.round((loaded / imports.length) * 100), 100),
              });
              return result;
            } catch (error) {
              console.error(`❌ Error cargando ${fileName}:`, error);
              throw error;
            }
          }),
        );

        this.callbacks?.onProgress?.({
          costTime: Date.now() - start,
          phase: 'dependencies',
          progress: 100,
        });

        // @ts-ignore
        const [{ PGlite, IdbFs, MemoryFS }, { vector }, fsBundle] = results;

        return { IdbFs, MemoryFS, PGlite, fsBundle, vector };
      })();

      const timeoutPromise = this.createTimeout(
        DatabaseManager.TIMEOUTS.LOAD_DEPENDENCIES,
        'Carga de dependencias',
      );

      return await Promise.race([loadPromise, timeoutPromise]);
    } catch (error) {
      console.error('❌ Error cargando dependencias:', error);
      throw error;
    }
  }

  // 数据库迁移方法
  private async migrate(skipMultiRun = false): Promise<DrizzleInstance> {
    if (this.isLocalDBSchemaSynced && skipMultiRun) return this.db;

    let hash: string | undefined;
    if (typeof localStorage !== 'undefined') {
      const cacheHash = localStorage.getItem(pgliteSchemaHashCache);
      hash = Md5.hashStr(JSON.stringify(migrations));
      // if hash is the same, no need to migrate
      if (hash === cacheHash) {
        try {
          const drizzleMigration = new DrizzleMigrationModel(this.db as any);

          // ✅ Agregar timeout a la verificación de tablas
          const checkPromise = drizzleMigration.getTableCounts();
          const timeoutPromise = this.createTimeout(5000, 'Verificación de tablas');

          // 检查数据库中是否存在表
          const tableCount = await Promise.race([checkPromise, timeoutPromise]);

          // 如果表数量大于0，则认为数据库已正确初始化
          if (tableCount > 0) {
            this.isLocalDBSchemaSynced = true;
            return this.db;
          }
        } catch (error) {
          console.warn('Error checking table existence, proceeding with migration', error);
          // 如果查询失败，继续执行迁移以确保安全
        }
      }
    }

    const start = Date.now();
    try {
      this.callbacks?.onStateChange?.(DatabaseLoadingState.Migrating);

      // ✅ Agregar timeout a la migración
      const migratePromise = (async () => {
        // refs: https://github.com/drizzle-team/drizzle-orm/discussions/2532
        // @ts-expect-error
        await this.db.dialect.migrate(migrations, this.db.session, {});

        if (typeof localStorage !== 'undefined' && hash) {
          localStorage.setItem(pgliteSchemaHashCache, hash);
        }

        this.isLocalDBSchemaSynced = true;

        console.info(`🗂 Migration success, take ${Date.now() - start}ms`);
      })();

      const timeoutPromise = this.createTimeout(
        DatabaseManager.TIMEOUTS.MIGRATE,
        'Migración de base de datos',
      );

      await Promise.race([migratePromise, timeoutPromise]);
    } catch (cause) {
      console.error('❌ Local database schema migration failed', cause);
      throw cause;
    }

    return this.db;
  }

  // 初始化数据库
  async initialize(callbacks?: DatabaseLoadingCallbacks): Promise<DrizzleInstance> {
    if (this.initPromise) return this.initPromise;

    this.callbacks = callbacks;

    this.initPromise = (async () => {
      try {
        if (this.dbInstance) return this.dbInstance;

        const time = Date.now();
        // 初始化数据库
        this.callbacks?.onStateChange?.(DatabaseLoadingState.Initializing);

        // ✅ Agregar timeout general a toda la inicialización
        const initPromise = (async () => {
          // 加载依赖
          const { fsBundle, PGlite, MemoryFS, IdbFs, vector } = await this.loadDependencies();

          // 加载并编译 WASM 模块
          const wasmModule = await this.loadWasmModule();

          const { initPgliteWorker } = await import('./pglite');

          let db: typeof PGlite;

          // make db as web worker if worker is available
          // https://github.com/lobehub/lobe-chat/issues/5785
          if (typeof Worker !== 'undefined' && typeof navigator.locks !== 'undefined') {
            // ✅ Agregar timeout a la inicialización del worker
            const workerPromise = initPgliteWorker({
              dbName: DB_NAME,
              fsBundle: fsBundle as Blob,
              vectorBundlePath: DatabaseManager.VECTOR_CDN_URL,
              wasmModule,
            });
            const workerTimeoutPromise = this.createTimeout(
              DatabaseManager.TIMEOUTS.INIT_WORKER,
              'Inicialización de PGlite Worker',
            );
            db = await Promise.race([workerPromise, workerTimeoutPromise]);
          } else {
            // in edge runtime or test runtime, we don't have worker
            db = new PGlite({
              extensions: { vector },
              fs: typeof window === 'undefined' ? new MemoryFS(DB_NAME) : new IdbFs(DB_NAME),
              relaxedDurability: true,
              wasmModule,
            });
          }

          this.dbInstance = drizzle({ client: db, schema });

          await this.migrate(true);

          this.callbacks?.onStateChange?.(DatabaseLoadingState.Finished);
          console.log(`✅ Database initialized in ${Date.now() - time}ms`);

          await sleep(50);

          this.callbacks?.onStateChange?.(DatabaseLoadingState.Ready);

          return this.dbInstance as DrizzleInstance;
        })();

        // ✅ Timeout general de 2 minutos para toda la inicialización
        const timeoutPromise = this.createTimeout(
          DatabaseManager.TIMEOUTS.INITIALIZE,
          'Inicialización completa de base de datos',
        );

        return await Promise.race([initPromise, timeoutPromise]);
      } catch (e) {
        this.initPromise = null;
        this.callbacks?.onStateChange?.(DatabaseLoadingState.Error);
        const error = e as Error;

        // 查询迁移表数据
        let migrationsTableData: MigrationTableItem[] = [];
        try {
          // 尝试查询迁移表
          const drizzleMigration = new DrizzleMigrationModel(this.db as any);
          migrationsTableData = await drizzleMigration.getMigrationList();
        } catch (queryError) {
          console.error('Failed to query migrations table:', queryError);
        }

        this.callbacks?.onError?.({
          error: {
            message: error.message,
            name: error.name,
            stack: error.stack,
          },
          migrationTableItems: migrationsTableData,
          migrationsSQL: migrations,
        });

        console.error('❌ Error inicializando base de datos:', error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  // 获取数据库实例
  get db(): DrizzleInstance {
    if (!this.dbInstance) {
      throw new Error('Database not initialized. Please call initialize() first.');
    }
    return this.dbInstance;
  }

  // 创建代理对象
  createProxy(): DrizzleInstance {
    return new Proxy({} as DrizzleInstance, {
      get: (target, prop) => {
        return this.db[prop as keyof DrizzleInstance];
      },
    });
  }

  async resetDatabase(): Promise<void> {
    // 1. 关闭现有的 PGlite 连接（如果存在）
    if (this.dbInstance) {
      try {
        // @ts-ignore
        await (this.dbInstance.session as any).client.close();
        console.log('PGlite instance closed successfully.');
      } catch (e) {
        console.error('Error closing PGlite instance:', e);
        // 即使关闭失败，也尝试继续删除，IndexedDB 的 onblocked 或 onerror 会处理后续问题
      }
    }

    // 2. 重置数据库实例和初始化状态
    this.dbInstance = null;
    this.initPromise = null;
    this.isLocalDBSchemaSynced = false; // 重置同步状态

    // 3. 删除 IndexedDB 数据库
    return new Promise<void>((resolve, reject) => {
      // 检查 IndexedDB 是否可用
      if (typeof indexedDB === 'undefined') {
        console.warn('IndexedDB is not available, cannot delete database');
        resolve(); // 在此环境下无法删除，直接解决
        return;
      }

      const dbName = `/pglite/${DB_NAME}`; // PGlite IdbFs 使用的路径
      const request = indexedDB.deleteDatabase(dbName);

      request.onsuccess = () => {
        console.log(`✅ Database '${dbName}' reset successfully`);

        // 清除本地存储的模式哈希
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(pgliteSchemaHashCache);
        }

        resolve();
      };

      // eslint-disable-next-line unicorn/prefer-add-event-listener
      request.onerror = (event) => {
        const error = (event.target as IDBOpenDBRequest)?.error;
        console.error(`❌ Error resetting database '${dbName}':`, error);
        reject(
          new Error(
            `Failed to reset database '${dbName}'. Error: ${error?.message || 'Unknown error'}`,
          ),
        );
      };

      request.onblocked = (event) => {
        // 当其他打开的连接阻止数据库删除时，会触发此事件
        console.warn(
          `Deletion of database '${dbName}' is blocked. This usually means other connections (e.g., in other tabs) are still open. Event:`,
          event,
        );
        reject(
          new Error(
            `Failed to reset database '${dbName}' because it is blocked by other open connections. Please close other tabs or applications using this database and try again.`,
          ),
        );
      };
    });
  }
}

// 导出单例
const dbManager = DatabaseManager.getInstance();

// 保持原有的 clientDB 导出不变
export const clientDB = dbManager.createProxy();

// 导出初始化方法，供应用启动时使用
export const initializeDB = (callbacks?: DatabaseLoadingCallbacks) =>
  dbManager.initialize(callbacks);

export const resetClientDatabase = async () => {
  await dbManager.resetDatabase();
};

export const updateMigrationRecord = async (migrationHash: string) => {
  await clientDB.execute(
    sql`INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at") VALUES (${migrationHash}, ${Date.now()});`,
  );

  await initializeDB();
};
