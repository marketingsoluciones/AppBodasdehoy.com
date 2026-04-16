/**
 * Memory Router — tRPC endpoints para memory recall
 *
 * Patron: sigue src/server/routers/lambda/chunk.ts
 */

import { z } from 'zod';

import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';

const memoryProcedure = authedProcedure.use(serverDatabase);

export const memoryRouter = router({
  
  /**
   * Trigger manual de extracción de memorias desde un summary.
   */
extractFromSummary: memoryProcedure
    .input(
      z.object({
        summary: z.string().min(1).max(50_000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { extractAndPersistMemories } = await import(
        '@/server/services/memoryRecall/extractor'
      );

      const count = await extractAndPersistMemories(
        input.summary,
        ctx.userId,
        ctx.serverDB,
      );

      return { extracted: count };
    }),

  
  /**
   * Busca memorias relevantes para una query dada.
   * Se usa en el cliente para preview/debug de memory recall.
   */
recallForQuery: memoryProcedure
    .input(
      z.object({
        query: z.string().min(1).max(8000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { recallMemories } = await import('@/server/services/memoryRecall');

      const result = await recallMemories(ctx.serverDB, ctx.userId, input.query);

      return {
        contextBlock: result.contextBlock,
        hasMemories: result.hasMemories,
        memoriesCount: result.memoriesCount,
      };
    }),
});
