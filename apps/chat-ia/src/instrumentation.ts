// ⚡ PERF 2026-05-13: Sentry/OTEL solo en prod o cuando explícitamente activado.
// En dev sin DSN, evitamos bundle de @sentry/nextjs + @opentelemetry/* (~3 min compile extra).
// Usamos process.env.NODE_ENV directamente porque Next.js lo inline al build
// y webpack puede tree-shake las ramas inalcanzables.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.ENABLE_TELEMETRY) {
    await import('./instrumentation.node');
  }

  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      await import('../sentry.server.config');
    }
    if (process.env.NEXT_RUNTIME === 'edge') {
      await import('../sentry.edge.config');
    }
  }
}
