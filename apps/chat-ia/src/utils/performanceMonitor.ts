/**
 * Monitor de rendimiento para medir tiempos de cada fase de carga
 */

interface PhaseMeasurement {
  duration?: number;
  endTime?: number;
  phase: string;
  startTime: number;
  subPhases?: PhaseMeasurement[];
}

class PerformanceMonitor {
  private measurements: Map<string, PhaseMeasurement> = new Map();
  private startTimes: Map<string, number> = new Map();

  /**
   * Inicia la medición de una fase
   */
  startPhase(phaseName: string): void {
    const startTime = performance.now();
    this.startTimes.set(phaseName, startTime);

    const measurement: PhaseMeasurement = {
      phase: phaseName,
      startTime,
    };

    this.measurements.set(phaseName, measurement);

    console.log(`⏱️ [PERF] Iniciando fase: ${phaseName}`);

    // Capturar en logAnalyzer si está disponible
    if (typeof window !== 'undefined' && (window as any).logAnalyzer) {
      (window as any).logAnalyzer.capturePhase(phaseName, startTime);
    }
  }

  /**
   * Finaliza la medición de una fase
   */
  endPhase(phaseName: string): number {
    const startTime = this.startTimes.get(phaseName);
    if (!startTime) {
      console.warn(`⚠️ [PERF] No se encontró inicio para fase: ${phaseName}`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    const measurement = this.measurements.get(phaseName);
    if (measurement) {
      measurement.endTime = endTime;
      measurement.duration = duration;
    }

    console.log(`✅ [PERF] Fase completada: ${phaseName} - ${duration.toFixed(2)}ms`);

    // Capturar en logAnalyzer si está disponible
    if (typeof window !== 'undefined' && (window as any).logAnalyzer) {
      (window as any).logAnalyzer.capturePhase(phaseName, startTime, endTime);
    }

    this.startTimes.delete(phaseName);
    return duration;
  }

  /**
   * Agrega una sub-fase a una fase existente
   */
  addSubPhase(parentPhase: string, subPhaseName: string, duration: number): void {
    const parent = this.measurements.get(parentPhase);
    if (!parent) {
      console.warn(`⚠️ [PERF] No se encontró fase padre: ${parentPhase}`);
      return;
    }

    if (!parent.subPhases) {
      parent.subPhases = [];
    }

    parent.subPhases.push({
      duration,
      endTime: parent.startTime + duration,
      phase: subPhaseName,
      startTime: parent.startTime,
    });
  }

  /**
   * Obtiene el resumen de todas las mediciones
   */
  getSummary(): {
    phases: Array<{ duration: number; percentage: number, phase: string; }>;
    slowestPhases: Array<{ duration: number, phase: string; }>;
    totalTime: number;
  } {
    const phases: Array<{ duration: number; percentage: number, phase: string; }> = [];
    let totalTime = 0;

    this.measurements.forEach((measurement) => {
      if (measurement.duration) {
        phases.push({
          duration: measurement.duration,
          percentage: 0,
          phase: measurement.phase, // Se calculará después
        });
        totalTime += measurement.duration;
      }
    });

    // Calcular porcentajes
    phases.forEach((phase) => {
      phase.percentage = totalTime > 0 ? (phase.duration / totalTime) * 100 : 0;
    });

    // Ordenar por duración (más lento primero)
    const slowestPhases = [...phases]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)
      .map((p) => ({ duration: p.duration, phase: p.phase }));

    return {
      phases,
      slowestPhases,
      totalTime,
    };
  }

  /**
   * Imprime un resumen completo en la consola
   */
  printSummary(): void {
    const summary = this.getSummary();

    console.group('📊 [PERF] Resumen de Rendimiento');
    console.log(`⏱️ Tiempo total: ${summary.totalTime.toFixed(2)}ms (${(summary.totalTime / 1000).toFixed(2)}s)`);
    console.log('');
    console.log('📋 Fases (ordenadas por duración):');

    summary.phases
      .sort((a, b) => b.duration - a.duration)
      .forEach((phase) => {
        console.log(
          `  ${phase.phase}: ${phase.duration.toFixed(2)}ms (${phase.percentage.toFixed(1)}%)`
        );
      });

    console.log('');
    console.log('🐌 Top 5 fases más lentas:');
    summary.slowestPhases.forEach((phase, index) => {
      console.log(`  ${index + 1}. ${phase.phase}: ${phase.duration.toFixed(2)}ms`);
    });

    console.groupEnd();
  }

  /**
   * Limpia todas las mediciones
   */
  clear(): void {
    this.measurements.clear();
    this.startTimes.clear();
  }
}

// Singleton global
export const performanceMonitor = new PerformanceMonitor();

// Helper para medir una función
export function measurePhase<T>(
  phaseName: string,
  fn: () => Promise<T> | T
): Promise<T> | T {
  performanceMonitor.startPhase(phaseName);

  const result = fn();

  if (result instanceof Promise) {
    return result
      .then((value) => {
        performanceMonitor.endPhase(phaseName);
        return value;
      })
      .catch((error) => {
        performanceMonitor.endPhase(phaseName);
        throw error;
      });
  } else {
    performanceMonitor.endPhase(phaseName);
    return result;
  }
}
































