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
import { exporterRouter } from './exporter';
import { generationBatchRouter } from './generationBatch';
import { generationTopicRouter } from './generationTopic';
import { importerRouter } from './importer';
import { marketRouter } from './market';
import { memoryRouter } from './memory';

// Routers eliminados (refactor runtime-only-api-ia 24-jun-2026):
//   · chunk → migrado a services/apiIa/chunks.ts (api-ia REST)
//   · image → migrado a services/image.ts (POST /webapi/text-to-image)
// Ambos usaban runtime SDK directo en server-side.

export const lambdaRouter = router({
  agent: agentRouter,
  aiChat: aiChatRouter,
  aiModel: aiModelRouter,
  apiKey: apiKeyRouter,
  exporter: exporterRouter,
  generationBatch: generationBatchRouter,
  generationTopic: generationTopicRouter,
  healthcheck: publicProcedure.query(() => "i'm live!"),
  importer: importerRouter,
  market: marketRouter,
  memory: memoryRouter,
});

export type LambdaRouter = typeof lambdaRouter;
