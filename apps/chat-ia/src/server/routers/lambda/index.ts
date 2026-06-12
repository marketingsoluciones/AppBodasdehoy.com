/**
 * Root router del backend tRPC lambda de chat-ia.
 *
 * CAPA 3 PASO C 2026-06-05: borrados 12 routers ya migrados a api-ia REST.
 * Quedan 15 routers que el cliente AÚN consume (pendientes de migrar en
 * subfases CAPA 3 posteriores):
 *   agent, aiChat, aiModel, apiKey, config, exporter, file, generation,
 *   generationBatch, generationTopic, image, importer, market, memory, thread, upload
 *
 * Cuando estos 15 estén migrados → este archivo se elimina y se borran
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
import { configRouter } from './config';
import { exporterRouter } from './exporter';
import { fileRouter } from './file';
import { generationRouter } from './generation';
import { generationBatchRouter } from './generationBatch';
import { generationTopicRouter } from './generationTopic';
import { imageRouter } from './image';
import { importerRouter } from './importer';
import { marketRouter } from './market';
import { memoryRouter } from './memory';
import { threadRouter } from './thread';
import { uploadRouter } from './upload';

export const lambdaRouter = router({
  agent: agentRouter,
  aiChat: aiChatRouter,
  aiModel: aiModelRouter,
  apiKey: apiKeyRouter,
  chunk: chunkRouter,
  config: configRouter,
  exporter: exporterRouter,
  file: fileRouter,
  generation: generationRouter,
  generationBatch: generationBatchRouter,
  generationTopic: generationTopicRouter,
  healthcheck: publicProcedure.query(() => "i'm live!"),
  image: imageRouter,
  importer: importerRouter,
  market: marketRouter,
  memory: memoryRouter,
  thread: threadRouter,
  upload: uploadRouter,
});

export type LambdaRouter = typeof lambdaRouter;
