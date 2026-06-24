/**
 * Root router del backend tRPC lambda de chat-ia.
 *
 * CAPA 3 PASO C 2026-06-05: borrados 12 routers ya migrados a api-ia REST.
 *
 * REFACTOR runtime-only-api-ia 2026-06-24 (commit auditoría 9e526d23):
 * Borrados 5 routers más sin consumidores cliente (verificado por grep):
 *   config, file, generation, thread, upload
 *
 * Quedan los routers que el cliente AÚN consume (pendientes de migrar):
 *   agent, aiChat, aiModel, apiKey, chunk, exporter,
 *   generationBatch, generationTopic, image, importer, market, memory
 *
 * Cuando estos estén migrados → este archivo se elimina y se borran
 * drizzle/pglite/@trpc/* del package.json (CAPA 3 final).
 */
import { publicProcedure, router } from '@/libs/trpc/lambda';

import { agentRouter } from './agent';
import { aiChatRouter } from './aiChat';
import { aiModelRouter } from './aiModel';
import { apiKeyRouter } from './apiKey';
// RE-REGISTRADO 2026-06-12: knowledge_base reactivado → el RAG nativo (chunk/embedding) vuelve
// a estar disponible para no perder funcionalidad. Ver docs/ANALISIS-FEATURES-DESACTIVADAS.md.
import { chunkRouter } from './chunk';
import { exporterRouter } from './exporter';
import { generationBatchRouter } from './generationBatch';
import { generationTopicRouter } from './generationTopic';
import { imageRouter } from './image';
import { importerRouter } from './importer';
import { marketRouter } from './market';
import { memoryRouter } from './memory';

export const lambdaRouter = router({
  agent: agentRouter,
  aiChat: aiChatRouter,
  aiModel: aiModelRouter,
  apiKey: apiKeyRouter,
  chunk: chunkRouter,
  exporter: exporterRouter,
  generationBatch: generationBatchRouter,
  generationTopic: generationTopicRouter,
  healthcheck: publicProcedure.query(() => "i'm live!"),
  image: imageRouter,
  importer: importerRouter,
  market: marketRouter,
  memory: memoryRouter,
});

export type LambdaRouter = typeof lambdaRouter;
