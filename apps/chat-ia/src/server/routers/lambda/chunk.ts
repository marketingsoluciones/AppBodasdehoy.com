import { DEFAULT_FILE_EMBEDDING_MODEL_ITEM } from '@lobechat/const';
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
import { getServerDefaultFilesConfig } from '@/server/globalConfig';
import { initModelRuntimeWithUserPayload } from '@/server/modules/ModelRuntime';
import { ChunkService } from '@/server/services/chunk';

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
      // ✅ NUEVO: Verificar si usar middleware
      const {
        shouldUseMiddleware,
        searchViaMiddleware,
      } = await import('@/server/services/lobechatKBMiddlewareService');
      
      const useMiddleware = await shouldUseMiddleware();

      if (useMiddleware) {
        // ✅ USAR MIDDLEWARE (Ollama + ChromaDB)
        console.log(`🔧 Usando middleware para búsqueda semántica (Ollama + ChromaDB)`);
        
        const results = await searchViaMiddleware(
          input.query,
          ctx.userId,
          input.fileIds,
          30 // limit
        );

        // Convertir resultados del middleware al formato esperado
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
      } else {
        // ✅ USAR POSTGRESQL (método original)
        const { model, provider } =
          getServerDefaultFilesConfig().embeddingModel || DEFAULT_FILE_EMBEDDING_MODEL_ITEM;
        const agentRuntime = await initModelRuntimeWithUserPayload(provider, ctx.jwtPayload);

        const embeddings = await agentRuntime.embeddings({
          dimensions: 1024,
          input: input.query,
          model,
        });
        console.timeEnd('embedding');

        return ctx.chunkModel.semanticSearch({
          embedding: embeddings![0],
          fileIds: input.fileIds,
          query: input.query,
        });
      }
    }),

  semanticSearchForChat: chunkProcedure
    .input(SemanticSearchSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // ✅ NUEVO: Verificar si usar middleware
        const {
          shouldUseMiddleware,
          searchViaMiddleware,
        } = await import('@/server/services/lobechatKBMiddlewareService');
        
        const useMiddleware = await shouldUseMiddleware();

        let finalFileIds = input.fileIds ?? [];

        if (input.knowledgeIds && input.knowledgeIds.length > 0) {
          const knowledgeFiles = await ctx.serverDB.query.knowledgeBaseFiles.findMany({
            where: inArray(knowledgeBaseFiles.knowledgeBaseId, input.knowledgeIds),
          });

          finalFileIds = knowledgeFiles.map((f) => f.fileId).concat(finalFileIds);
        }

        if (useMiddleware) {
          // ✅ USAR MIDDLEWARE (Ollama + ChromaDB)
          console.log(`🔧 Usando middleware para búsqueda semántica en chat (Ollama + ChromaDB)`);
          
          // slice content to make sure in the context window limit
          const query =
            input.rewriteQuery.length > 8000
              ? input.rewriteQuery.slice(0, 8000)
              : input.rewriteQuery;

          const results = await searchViaMiddleware(
            query,
            ctx.userId,
            finalFileIds,
            15 // limit
          );

          // Convertir resultados del middleware al formato esperado
          const chunks = results.map((r) => ({
            fileId: r.metadata?.file_id?.split('_chunk_')[0] || '',
            fileName: r.metadata?.file_name || '',
            id: r.metadata?.chunk_id || r.id,
            index: r.metadata?.chunk_index || 0,
            similarity: r.score,
            text: r.text_content,
          }));

          // TODO: need to rerank the chunks
          // Por ahora, usar un queryId temporal (el middleware no guarda queries)
          const ragQueryId = `middleware_${Date.now()}`;

          return { chunks, queryId: ragQueryId };
        } else {
          // ✅ USAR POSTGRESQL (método original)
          const item = await ctx.messageModel.findMessageQueriesById(input.messageId);
          const { model, provider } =
            getServerDefaultFilesConfig().embeddingModel || DEFAULT_FILE_EMBEDDING_MODEL_ITEM;
          let embedding: number[];
          let ragQueryId: string;

          // if there is no message rag or it's embeddings, then we need to create one
          if (!item || !item.embeddings) {
            // TODO: need to support customize
            const agentRuntime = await initModelRuntimeWithUserPayload(provider, ctx.jwtPayload);

            // slice content to make sure in the context window limit
            const query =
              input.rewriteQuery.length > 8000
                ? input.rewriteQuery.slice(0, 8000)
                : input.rewriteQuery;

            const embeddings = await agentRuntime.embeddings({
              dimensions: 1024,
              input: query,
              model,
            });

            embedding = embeddings![0];
            const embeddingsId = await ctx.embeddingModel.create({
              embeddings: embedding,
              model,
            });

            const result = await ctx.messageModel.createMessageQuery({
              embeddingsId,
              messageId: input.messageId,
              rewriteQuery: input.rewriteQuery,
              userQuery: input.userQuery,
            });

            ragQueryId = result.id;
          } else {
            embedding = item.embeddings;
            ragQueryId = item.id;
          }

          const chunks = await ctx.chunkModel.semanticSearchForChat({
            embedding,
            fileIds: finalFileIds,
            query: input.rewriteQuery,
          });

          // TODO: need to rerank the chunks

          return { chunks, queryId: ragQueryId };
        }
      } catch (e) {
        console.error(e);

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: (e as any).errorType || JSON.stringify(e),
        });
      }
    }),
});
