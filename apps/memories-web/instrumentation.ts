// Sentry/OTEL solo cuando hay DSN definido. En dev o sin DSN el SDK ni se importa
// (tree-shake elimina la rama inalcanzable), evitando ~3min compile extra.
export async function register() {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      await import('./sentry.server.config');
    }
  }
}
