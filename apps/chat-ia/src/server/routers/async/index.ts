import { publicProcedure, asyncRouter as router } from '@/libs/trpc/async';

// Routers eliminados (refactor runtime-only-api-ia 24-jun-2026):
//   · fileRouter   (embeddingChunks, parseFileToChunks) → migrado a api-ia /webapi/embeddings
//   · imageRouter  (DALL-E/BFL background)              → migrado a api-ia /api/ai/images/generate
//   · ragEvalRouter                                     → ningún consumidor cliente
// Todos usaban runtime SDK directo. La generación/embeddings ahora pasa por api-ia.

export const asyncRouter = router({
  healthcheck: publicProcedure.query(() => "i'm live!"),
});

export type AsyncRouter = typeof asyncRouter;

export type { UnifiedAsyncCaller } from './caller';
export { createAsyncCaller, createAsyncServerClient } from './caller';
