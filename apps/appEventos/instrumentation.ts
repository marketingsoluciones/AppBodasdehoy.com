// Sentry/OTEL solo cuando hay DSN definido. En dev o sin DSN el SDK ni se importa
// (tree-shake elimina la rama inalcanzable), evitando ~3min compile extra.
let captureRequestError: ((err: unknown, req: unknown, ctx: unknown) => void) | undefined;

export async function register() {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      let Sentry: any = null
      try {
        const req = (new Function('return typeof require !== "undefined" ? require : null'))()
        if (req) Sentry = req('@sentry/nextjs')
      } catch {}
      if (Sentry?.captureRequestError) {
        captureRequestError = Sentry.captureRequestError;
        await import('./sentry.server.config');
      }
    }
  }
}

export const onRequestError = (err: unknown, req: unknown, ctx: unknown) => {
  if (captureRequestError) captureRequestError(err, req, ctx);
};
