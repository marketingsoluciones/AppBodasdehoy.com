/**
 * Detector de bloqueos - Identifica qué está bloqueando la carga
 */

interface BlockingOperation {
  duration?: number;
  endTime?: number;
  name: string;
  stack?: string;
  startTime: number;
}

class BlockingDetector {
  private operations: Map<string, BlockingOperation> = new Map();
  private startTime: number = performance.now();
  private checkInterval: number | null = null;

  /**
   * Inicia el monitoreo de bloqueos
   */
  startMonitoring(): void {
    console.log('🔍 [BLOCKING DETECTOR] Iniciando monitoreo de bloqueos...');

    // Verificar cada 100ms si hay operaciones bloqueadas
    this.checkInterval = window.setInterval(() => {
      this.checkBlockedOperations();
    }, 100);

    // Detener después de 10 segundos
    setTimeout(() => {
      this.stopMonitoring();
      this.printReport();
    }, 10_000);
  }

  /**
   * Registra una operación
   */
  startOperation(name: string): void {
    const operation: BlockingOperation = {
      name,
      stack: new Error().stack,
      startTime: performance.now(),
    };
    this.operations.set(name, operation);
    console.log(`⏱️ [BLOCKING] Iniciando: ${name}`);
  }

  /**
   * Finaliza una operación
   */
  endOperation(name: string): void {
    const operation = this.operations.get(name);
    if (!operation) {
      console.warn(`⚠️ [BLOCKING] No se encontró operación: ${name}`);
      return;
    }

    operation.endTime = performance.now();
    operation.duration = operation.endTime - operation.startTime;

    if (operation.duration > 100) {
      console.warn(`⚠️ [BLOCKING] ${name} tardó ${operation.duration.toFixed(2)}ms (puede estar bloqueando)`);
    } else {
      console.log(`✅ [BLOCKING] ${name} completado en ${operation.duration.toFixed(2)}ms`);
    }
  }

  /**
   * Verifica operaciones bloqueadas
   */
  private checkBlockedOperations(): void {
    const now = performance.now();
    const blocked: BlockingOperation[] = [];

    this.operations.forEach((operation, name) => {
      if (!operation.endTime) {
        const duration = now - operation.startTime;
        if (duration > 500) {
          // Operación bloqueada por más de 500ms
          blocked.push({
            ...operation,
            duration,
          });
        }
      }
    });

    if (blocked.length > 0) {
      console.group('🚨 [BLOCKING DETECTOR] Operaciones bloqueadas detectadas');
      blocked.forEach((op) => {
        console.warn(`⚠️ ${op.name}: bloqueada por ${op.duration!.toFixed(2)}ms`);
        if (op.stack) {
          console.log('Stack:', op.stack);
        }
      });
      console.groupEnd();
    }
  }

  /**
   * Imprime reporte final
   */
  printReport(): void {
    console.group('📊 [BLOCKING DETECTOR] Reporte Final');

    const totalTime = performance.now() - this.startTime;
    console.log(`⏱️ Tiempo total de monitoreo: ${totalTime.toFixed(2)}ms`);

    const slowOperations: BlockingOperation[] = [];
    const blockedOperations: BlockingOperation[] = [];

    this.operations.forEach((operation) => {
      if (operation.duration) {
        if (operation.duration > 500) {
          slowOperations.push(operation);
        }
      } else {
        // Operación que nunca terminó
        const duration = performance.now() - operation.startTime;
        blockedOperations.push({
          ...operation,
          duration,
        });
      }
    });

    if (slowOperations.length > 0) {
      console.log('');
      console.log('🐌 Operaciones lentas (>500ms):');
      slowOperations
        .sort((a, b) => (b.duration || 0) - (a.duration || 0))
        .forEach((op) => {
          console.log(`  • ${op.name}: ${op.duration!.toFixed(2)}ms`);
        });
    }

    if (blockedOperations.length > 0) {
      console.log('');
      console.log('🚨 Operaciones bloqueadas (nunca terminaron):');
      blockedOperations
        .sort((a, b) => (b.duration || 0) - (a.duration || 0))
        .forEach((op) => {
          console.error(`  ❌ ${op.name}: bloqueada por ${op.duration!.toFixed(2)}ms`);
          if (op.stack) {
            console.log('     Stack:', op.stack.split('\n').slice(0, 5).join('\n     '));
          }
        });
    }

    if (slowOperations.length === 0 && blockedOperations.length === 0) {
      console.log('✅ No se detectaron operaciones bloqueadas');
    }

    console.groupEnd();
  }

  /**
   * Detiene el monitoreo
   */
  stopMonitoring(): void {
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🔍 [BLOCKING DETECTOR] Monitoreo detenido');
    }
  }
}

// Singleton global
export const blockingDetector = new BlockingDetector();

// Iniciar monitoreo automáticamente cuando se importa el módulo
if (typeof window !== 'undefined') {
  // Exponer globalmente inmediatamente
  (window as any).blockingDetector = blockingDetector;

  // Iniciar monitoreo cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      blockingDetector.startMonitoring();
    });
  } else {
    // DOM ya está listo, iniciar inmediatamente
    setTimeout(() => {
      blockingDetector.startMonitoring();
    }, 0);
  }
}
































