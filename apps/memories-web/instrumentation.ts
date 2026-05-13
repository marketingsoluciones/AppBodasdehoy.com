// Sentry/OTEL solo cuando hay DSN definido. En dev o sin DSN el SDK ni se importa
// (tree-shake elimina la rama inalcanzable), evitando ~3min compile extra.
let captureRequestError: ((err: unknown, req: unknown, ctx: unknown) => void) | undefined;

export async function register() {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      const Sentry = await import('@sentry/nextjs');
      captureRequestError = Sentry.captureRequestError;
      await import('./sentry.server.config');
    }
  }
}

export const onRequestError = (err: unknown, req: unknown, ctx: unknown) => {
  if (captureRequestError) captureRequestError(err, req, ctx);
};
