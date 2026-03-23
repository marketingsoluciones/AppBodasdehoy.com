import { SemanticSearchSchema } from '@lobechat/types';
import { TRPCError } from '@trpc/server';
import { inArray } from 'drizzle-orm';
import { z } from 'zod';

import { AsyncTaskModel } from '@/database/models/asyncTask';
import { ChunkModel } from '@/database/models/chunk';
import { EmbeddingModel } from '@/database/models/embedding';
import { FileModel } from '@/database/models/file';
import { MessageModel } from '@/database/models/message';
import { knowledgeBaseFiles } from '@/database/schemas';
import { authedProcedure, router } from '@/libs/trpc/lambda';
import { keyVaults, serverDatabase } from '@/libs/trpc/lambda/middleware';
import { ChunkService } from '@/server/services/chunk';

/** RAG semántico: solo api-ia (/api/lobechat-kb). Sin vectores ni embeddings en Postgres. */
const kbUnavailableMessage =
  'Base de conocimiento no disponible: api-ia no responde en /api/lobechat-kb. ' +
  'Revisa NEXT_PUBLIC_BACKEND_URL (servidor Next), USE_MIDDLEWARE_FOR_LOBECHAT_KB y el servicio de embeddings en api-ia.';

const chunkProcedure = authedProcedure
  .use(serverDatabase)
  .use(keyVaults)
  .use(async (opts) => {
    const { ctx } = opts;

    return opts.next({
      ctx: {
        asyncTaskModel: new AsyncTaskModel(ctx.serverDB, ctx.userId),
        chunkModel: new ChunkModel(ctx.serverDB, ctx.userId),
        chunkService: new ChunkService(ctx.serverDB, ctx.userId),
        embeddingModel: new EmbeddingModel(ctx.serverDB, ctx.userId),
        fileModel: new FileModel(ctx.serverDB, ctx.userId),
        messageModel: new MessageModel(ctx.serverDB, ctx.userId),
      },
    });
  });

export const chunkRouter = router({
  createEmbeddingChunksTask: chunkProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const asyncTaskId = await ctx.chunkService.asyncEmbeddingFileChunks(input.id, ctx.jwtPayload);

      return { id: asyncTaskId, success: true };
    }),

  createParseFileTask: chunkProcedure
    .input(
      z.object({
        id: z.string(),
        skipExist: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const asyncTaskId = await ctx.chunkService.asyncParseFileToChunks(
        input.id,
        ctx.jwtPayload,
        input.skipExist,
      );

      return { id: asyncTaskId, success: true };
    }),

  getChunksByFileId: chunkProcedure
    .input(
      z.object({
        cursor: z.number().nullish(),
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return {
        items: await ctx.chunkModel.findByFileId(input.id, input.cursor || 0),
        nextCursor: input.cursor ? input.cursor + 1 : 1,
      };
    }),

  retryParseFileTask: chunkProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.fileModel.findById(input.id);

      if (!result) return;

      // 1. delete the previous task if exist
      if (result.chunkTaskId) {
        await ctx.asyncTaskModel.delete(result.chunkTaskId);
      }

      // 2. create a new asyncTask for chunking
      const asyncTaskId = await ctx.chunkService.asyncParseFileToChunks(input.id, ctx.jwtPayload);

      return { id: asyncTaskId, success: true };
    }),

  semanticSearch: chunkProcedure
    .input(
      z.object({
        fileIds: z.array(z.string()).optional(),
        query: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        shouldUseMiddleware,
        searchViaMiddleware,
      } = await import('@/server/services/lobechatKBMiddlewareService');

      const useMiddleware = await shouldUseMiddleware();
      if (!useMiddleware) {
        throw new TRPCError({ code: 'FAILED_PRECONDITION', message: kbUnavailableMessage });
      }

      console.log(`🔧 RAG vía lobechat-kb (api-ia) — sin Postgres vectores`);
      let results: Awaited<ReturnType<typeof searchViaMiddleware>>;
      try {
        results = await searchViaMiddleware(
          input.query,
          ctx.userId,
          input.fileIds,
          30, // limit
        );
      } catch (e) {
        const detail = e instanceof Error ? e.message : String(e);
        throw new TRPCError({
          cause: e,
          code: 'FAILED_PRECONDITION',
          message: `KB (api-ia): ${detail}`,
        });
      }

      return results.map((r) => ({
        fileId: r.metadata?.file_id?.split('_chunk_')[0] || '',
        fileName: r.metadata?.file_name || '',
        id: r.metadata?.chunk_id || r.id,
        index: r.metadata?.chunk_index || 0,
        metadata: r.metadata || {},
        similarity: r.score,
        text: r.text_content,
        type: r.metadata?.chunk_type || null,
      }));
    }),

  semanticSearchForChat: chunkProcedure
    .input(SemanticSearchSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const {
          shouldUseMiddleware,
          searchViaMiddleware,
        } = await import('@/server/services/lobechatKBMiddlewareService');

        const useMiddleware = await shouldUseMiddleware();

        let finalFileIds = input.fileIds ?? [];

        // Resolución de archivos por knowledge base (metadato en BD LobeChat). Vectores siguen solo en api-ia.
        if (input.knowledgeIds && input.knowledgeIds.length > 0) {
          const knowledgeFiles = await ctx.serverDB.query.knowledgeBaseFiles.findMany({
            where: inArray(knowledgeBaseFiles.knowledgeBaseId, input.knowledgeIds),
          });

          finalFileIds = knowledgeFiles.map((f) => f.fileId).concat(finalFileIds);
        }

        if (!useMiddleware) {
          throw new TRPCError({ code: 'FAILED_PRECONDITION', message: kbUnavailableMessage });
        }

        console.log(`🔧 RAG chat vía lobechat-kb (api-ia) — sin Postgres vectores`);

        const query =
          input.rewriteQuery.length > 8000
            ? input.rewriteQuery.slice(0, 8000)
            : input.rewriteQuery;

        let results: Awaited<ReturnType<typeof searchViaMiddleware>>;
        try {
          results = await searchViaMiddleware(query, ctx.userId, finalFileIds, 15);
        } catch (e) {
          const detail = e instanceof Error ? e.message : String(e);
          throw new TRPCError({
            cause: e,
            code: 'FAILED_PRECONDITION',
            message: `KB (api-ia): ${detail}`,
          });
        }

        const chunks = results.map((r) => ({
          fileId: r.metadata?.file_id?.split('_chunk_')[0] || '',
          fileName: r.metadata?.file_name || '',
          id: r.metadata?.chunk_id || r.id,
          index: r.metadata?.chunk_index || 0,
          similarity: r.score,
          text: r.text_content,
        }));

        const ragQueryId = `middleware_${Date.now()}`;

        return { chunks, queryId: ragQueryId };
      } catch (e) {
        console.error(e);
        if (e instanceof TRPCError) throw e;

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: (e as any).errorType || (e instanceof Error ? e.message : JSON.stringify(e)),
        });
      }
    }),
});
