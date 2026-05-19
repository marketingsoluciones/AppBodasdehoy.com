/**
 * SPRINT-O 2026-05-19 — migración a thin client proxy:
 *
 * chat-ia ya NO ejecuta LLMs directamente. Todos los providers (OpenAI, Anthropic,
 * Google, Vertex, Bedrock, Cloudflare, ComfyUI, etc.) viven en api-ia, accesibles
 * via los endpoints /webapi/chat/{provider}, /webapi/text-to-image/{provider},
 * /webapi/embeddings, etc.
 *
 * Este module antes orquestaba la inicialización de ModelRuntime + ChatStream con
 * deps directas a @anthropic-ai/sdk, openai, @google/genai, @aws-sdk, etc. Esas
 * deps se eliminaron en SPRINT-J (no se usan en runtime — api-ia hace todo).
 *
 * Los routers que aún importan `initModelRuntimeWithUserPayload` (server/routers/
 * lambda/aiChat.ts, async/file.ts, async/image.ts, async/ragEval.ts) son código
 * MUERTO en bodasdehoy — el cliente chat-ia consume `/webapi/*` directamente.
 *
 * Mantenemos el stub para que TSC siga verde + estos routers compilen. Si en
 * runtime se invocan, throws con mensaje claro guiando al uso correcto.
 */
import type { ClientSecretPayload } from '@lobechat/types';

export * from './trace';

const PROXY_ERROR_MSG =
  '[ModelRuntime stub] chat-ia es proxy puro a api-ia. ' +
  'Usar fetch a /webapi/chat/{provider}, /webapi/text-to-image/{provider}, etc., ' +
  'en lugar de ejecutar runtime LLM en chat-ia. ' +
  'Si invocas esta función, hay código legacy de LobeChat upstream que debe migrarse.';

export const initModelRuntimeWithUserPayload = (
  _provider: string,
  _payload: ClientSecretPayload,
  _params: any = {},
): never => {
  throw new Error(PROXY_ERROR_MSG);
};
