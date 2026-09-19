/**
 * ModelProvider enum — movido desde model-bank/const/modelProvider.ts a
 * @lobechat/types (2026-05-19, SPRINT-A) para permitir eliminar model-bank
 * gradualmente del bundle chat-ia sin breaking changes.
 *
 * Re-exportado por model-bank/index.ts para retrocompat.
 */

// ─── AiModelSourceEnum (movido 2026-05-19 SPRINT-A.2) ──────────────────────
export const AiModelSourceEnum = {
  Builtin: 'builtin',
  Custom: 'custom',
  Remote: 'remote',
} as const;

export type AiModelSourceType = (typeof AiModelSourceEnum)[keyof typeof AiModelSourceEnum];

// ─── ModelPriceCurrency (movido 2026-05-19 SPRINT-A.5) ─────────────────────
/** Moneda usada en pricing de modelos LLM */
export type ModelPriceCurrency = 'CNY' | 'USD';

// ─── AiModelType (movido 2026-05-19 SPRINT-A.5) ────────────────────────────
/** Tipo de modelo IA. Schema zod sigue en model-bank/types/aiModel.ts */
export type AiModelType =
  | 'chat'
  | 'embedding'
  | 'tts'
  | 'stt'
  | 'image'
  | 'text2video'
  | 'text2music'
  | 'realtime';

// ─── BasicModelPricing (movido 2026-05-19 SPRINT-A.5) ──────────────────────
/** Pricing base — moneda + input. Heredado por ChatModelPricing */
export interface BasicModelPricing {
  /** @default USD */
  currency?: ModelPriceCurrency;
  /** input pricing, e.g. $1 / 1M tokens */
  input?: number;
}

// ─── ModelAbilities (movido 2026-05-19 SPRINT-A.4) ─────────────────────────
/** Capacidades soportadas por un modelo LLM (files, functionCall, vision, etc.) */
export interface ModelAbilities {
  /** whether model supports file upload */
  files?: boolean;
  /** whether model supports function call */
  functionCall?: boolean;
  /** whether model supports image output */
  imageOutput?: boolean;
  /** whether model supports reasoning */
  reasoning?: boolean;
  /** whether model supports search web */
  search?: boolean;
  /** whether model supports structured output */
  structuredOutput?: boolean;
  /** whether model supports video */
  video?: boolean;
  /** whether model supports vision */
  vision?: boolean;
}

// ─── LLMParams (movido 2026-05-19 SPRINT-A.3) ──────────────────────────────
/** Parámetros de configuración del modelo LLM (temperature, max_tokens, etc.) */
export interface LLMParams {
  /** Penaliza repetición (-2 a 2, default 0) */
  frequency_penalty?: number;
  /** Longitud máxima de generación */
  max_tokens?: number;
  /** Penaliza temas repetidos (-2 a 2, default 0) */
  presence_penalty?: number;
  /** Esfuerzo de reasoning (modelos o1, etc.) */
  reasoning_effort?: string;
  /** Creatividad/temperatura (0-2, default 1) */
  temperature?: number;
  /** Top-p nucleus sampling (0-1, default 1) */
  top_p?: number;
}

// ─── ModelProvider enum ─────────────────────────────────────────────────────
export enum ModelProvider {
  Ai21 = 'ai21',
  Ai302 = 'ai302',
  Ai360 = 'ai360',
  AiHubMix = 'aihubmix',
  AkashChat = 'akashchat',
  Anthropic = 'anthropic',
  Azure = 'azure',
  AzureAI = 'azureai',
  Baichuan = 'baichuan',
  Bedrock = 'bedrock',
  Bfl = 'bfl',
  Cerebras = 'cerebras',
  Cloudflare = 'cloudflare',
  Cohere = 'cohere',
  CometAPI = 'cometapi',
  ComfyUI = 'comfyui',
  DeepSeek = 'deepseek',
  Fal = 'fal',
  FireworksAI = 'fireworksai',
  GiteeAI = 'giteeai',
  Github = 'github',
  Google = 'google',
  Groq = 'groq',
  Higress = 'higress',
  HuggingFace = 'huggingface',
  Hunyuan = 'hunyuan',
  InfiniAI = 'infiniai',
  InternLM = 'internlm',
  Jina = 'jina',
  LMStudio = 'lmstudio',
  LobeHub = 'lobehub',
  Minimax = 'minimax',
  Mistral = 'mistral',
  ModelScope = 'modelscope',
  Moonshot = 'moonshot',
  Nebius = 'nebius',
  NewAPI = 'newapi',
  Novita = 'novita',
  Nvidia = 'nvidia',
  Ollama = 'ollama',
  OllamaCloud = 'ollamacloud',
  OpenAI = 'openai',
  OpenRouter = 'openrouter',
  PPIO = 'ppio',
  Perplexity = 'perplexity',
  Qiniu = 'qiniu',
  Qwen = 'qwen',
  SambaNova = 'sambanova',
  Search1API = 'search1api',
  SenseNova = 'sensenova',
  SiliconCloud = 'siliconcloud',
  Spark = 'spark',
  Stepfun = 'stepfun',
  Taichu = 'taichu',
  TencentCloud = 'tencentcloud',
  TogetherAI = 'togetherai',
  Upstage = 'upstage',
  V0 = 'v0',
  VLLM = 'vllm',
  VercelAIGateway = 'vercelaigateway',
  VertexAI = 'vertexai',
  Volcengine = 'volcengine',
  Wenxin = 'wenxin',
  XAI = 'xai',
  Xinference = 'xinference',
  ZeroOne = 'zeroone',
  ZhiPu = 'zhipu',
}
