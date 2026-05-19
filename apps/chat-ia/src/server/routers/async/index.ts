import { publicProcedure, asyncRouter as router } from '@/libs/trpc/async';

// SPRINT-O 2026-05-19 — migración:
// Eliminados sub-routers `file`, `image`, `ragEval` (ejecutaban LLM via ModelRuntime
// que ahora es stub porque chat-ia es proxy puro a api-ia). Esos routers son código
// muerto en bodasdehoy — la funcionalidad real está en api-ia /webapi/*.

export const asyncRouter = router({
  healthcheck: publicProcedure.query(() => "i'm live!"),
});

export type AsyncRouter = typeof asyncRouter;

export type { UnifiedAsyncCaller } from './caller';
export { createAsyncCaller, createAsyncServerClient } from './caller';
