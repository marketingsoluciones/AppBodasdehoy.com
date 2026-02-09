/**
 * Analizador de logs para identificar problemas de rendimiento
 */

interface LogEntry {
  data?: any;
  level: 'log' | 'warn' | 'error' | 'perf';
  message: string;
  timestamp: number;
}

interface PerformancePhase {
  duration?: number;
  endTime?: number;
  phase: string;
  startTime: number;
}

class LogAnalyzer {
  private logs: LogEntry[] = [];
  private performancePhases: Map<string, PerformancePhase> = new Map();
  private startTime: number = performance.now();

  /**
   * Captura un log
   */
  captureLog(level: 'log' | 'warn' | 'error', message: string, data?: any): void {
    const entry: LogEntry = {
      data,
      level,
      message,
      timestamp: performance.now(),
    };
    this.logs.push(entry);
  }

  /**
   * Captura una fase de rendimiento
   */
  capturePhase(phase: string, startTime: number, endTime?: number): void {
    const phaseData: PerformancePhase = {
      duration: endTime ? endTime - startTime : undefined,
      endTime,
      phase,
      startTime,
    };
    this.performancePhases.set(phase, phaseData);
  }

  /**
   * Analiza los logs y genera un reporte
   */
  analyze(): {
    bottlenecks: Array<{ duration: number; percentage: number, phase: string; }>;
    errors: LogEntry[];
    slowPhases: Array<{ duration: number, phase: string; }>;
    totalTime: number;
    warnings: LogEntry[];
  } {
    const totalTime = performance.now() - this.startTime;
    const slowPhases: Array<{ duration: number, phase: string; }> = [];
    const errors: LogEntry[] = [];
    const warnings: LogEntry[] = [];
    const bottlenecks: Array<{ duration: number; percentage: number, phase: string; }> = [];

    // Analizar fases de rendimiento
    this.performancePhases.forEach((phaseData, phase) => {
      if (phaseData.duration) {
        const percentage = (phaseData.duration / totalTime) * 100;
        slowPhases.push({
          duration: phaseData.duration,
          phase,
        });
        if (percentage > 10) {
          // Fase que toma más del 10% del tiempo total
          bottlenecks.push({
            duration: phaseData.duration,
            percentage,
            phase,
          });
        }
      }
    });

    // Analizar logs
    this.logs.forEach((log) => {
      if (log.level === 'error') {
        errors.push(log);
      } else if (log.level === 'warn') {
        warnings.push(log);
      }
    });

    // Ordenar por duración
    slowPhases.sort((a, b) => b.duration - a.duration);
    bottlenecks.sort((a, b) => b.percentage - a.percentage);

    return {
      
bottlenecks,
      
// Top 10
errors, 
      slowPhases: slowPhases.slice(0, 10),
      totalTime,
      warnings,
    };
  }

  /**
   * Imprime un reporte completo en la consola
   */
  printReport(): void {
    const analysis = this.analyze();

    console.group('🔍 [LOG ANALYZER] Análisis de Rendimiento');

    console.log(`⏱️ Tiempo total: ${analysis.totalTime.toFixed(2)}ms (${(analysis.totalTime / 1000).toFixed(2)}s)`);
    console.log('');

    // Fases más lentas
    if (analysis.slowPhases.length > 0) {
      console.log('🐌 Top 10 fases más lentas:');
      analysis.slowPhases.forEach((phase, index) => {
        console.log(`  ${index + 1}. ${phase.phase}: ${phase.duration.toFixed(2)}ms`);
      });
      console.log('');
    }

    // Cuellos de botella
    if (analysis.bottlenecks.length > 0) {
      console.log('⚠️ Cuellos de botella (>10% del tiempo total):');
      analysis.bottlenecks.forEach((bottleneck) => {
        console.log(`  • ${bottleneck.phase}: ${bottleneck.duration.toFixed(2)}ms (${bottleneck.percentage.toFixed(1)}%)`);
      });
      console.log('');
    }

    // Errores
    if (analysis.errors.length > 0) {
      console.log(`❌ Errores encontrados: ${analysis.errors.length}`);
      analysis.errors.forEach((error, index) => {
        const timeFromStart = ((error.timestamp - this.startTime) / 1000).toFixed(2);
        console.log(`  ${index + 1}. [${timeFromStart}s] ${error.message}`);
        if (error.data) {
          console.log('     Data:', error.data);
        }
      });
      console.log('');
    }

    // Advertencias
    if (analysis.warnings.length > 0) {
      console.log(`⚠️ Advertencias encontradas: ${analysis.warnings.length}`);
      analysis.warnings.slice(0, 10).forEach((warning, index) => {
        const timeFromStart = ((warning.timestamp - this.startTime) / 1000).toFixed(2);
        console.log(`  ${index + 1}. [${timeFromStart}s] ${warning.message}`);
      });
      if (analysis.warnings.length > 10) {
        console.log(`  ... y ${analysis.warnings.length - 10} más`);
      }
      console.log('');
    }

    // Recomendaciones
    this.printRecommendations(analysis);

    console.groupEnd();
  }

  /**
   * Imprime recomendaciones basadas en el análisis
   */
  private printRecommendations(analysis: {
    bottlenecks: Array<{ duration: number; percentage: number, phase: string; }>;
    errors: LogEntry[];
    slowPhases: Array<{ duration: number, phase: string; }>;
    totalTime: number;
    warnings: LogEntry[];
  }): void {
    const recommendations: string[] = [];

    // Si el tiempo total es > 1 segundo
    if (analysis.totalTime > 1000) {
      recommendations.push('⏱️ El tiempo total de carga es > 1 segundo. Considera diferir operaciones no críticas.');
    }

    // Si hay cuellos de botella
    if (analysis.bottlenecks.length > 0) {
      const topBottleneck = analysis.bottlenecks[0];
      recommendations.push(`🐌 "${topBottleneck.phase}" es el mayor cuello de botella (${topBottleneck.percentage.toFixed(1)}%). Considera optimizarlo.`);
    }

    // Si hay errores
    if (analysis.errors.length > 0) {
      recommendations.push(`❌ Hay ${analysis.errors.length} error(es). Revisa los logs de error arriba.`);
    }

    // Si hay fases que tardan > 500ms
    const verySlowPhases = analysis.slowPhases.filter((p) => p.duration > 500);
    if (verySlowPhases.length > 0) {
      recommendations.push(`⚠️ ${verySlowPhases.length} fase(s) tardan > 500ms. Considera agregar timeouts o diferir estas operaciones.`);
    }

    if (recommendations.length > 0) {
      console.log('💡 Recomendaciones:');
      recommendations.forEach((rec) => console.log(`  ${rec}`));
    } else {
      console.log('✅ No se encontraron problemas críticos de rendimiento.');
    }
  }

  /**
   * Limpia todos los logs
   */
  clear(): void {
    this.logs = [];
    this.performancePhases.clear();
    this.startTime = performance.now();
  }
}

// Singleton global
export const logAnalyzer = new LogAnalyzer();

// Interceptar console.log, console.warn, console.error
if (typeof window !== 'undefined') {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = (...args: any[]) => {
    const message = args.join(' ');
    logAnalyzer.captureLog('log', message, args);
    originalLog.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    logAnalyzer.captureLog('warn', message, args);
    originalWarn.apply(console, args);
  };

  console.error = (...args: any[]) => {
    const message = args.join(' ');
    logAnalyzer.captureLog('error', message, args);
    originalError.apply(console, args);
  };
}
































