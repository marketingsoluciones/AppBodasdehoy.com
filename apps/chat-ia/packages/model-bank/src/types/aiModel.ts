// Tipos puros movidos a @lobechat/types 2026-05-20 SPRINT-A.final.
// Este archivo retiene SOLO los zod schemas runtime + sus type aliases.
// Re-export de todos los tipos para back-compat con consumers externos.

import { z } from 'zod';

import { AiModelSourceEnum } from '@lobechat/types';

// Re-export tipos puros (movidos a @lobechat/types)
export type {
  AIBaseModelCard,
  AIChatModelCard,
  AIEmbeddingModelCard,
  AIImageModelCard,
  AIRealtimeModelCard,
  AISTTModelCard,
  AITTSModelCard,
  AiFullModelCard,
  AiModelConfig,
  AiModelForSelect,
  AiModelSettings,
  AiModelSortMap,
  AiModelSourceType,
  AiModelType,
  AiProviderModelListItem,
  BasicModelPricing,
  ChatModelPricing,
  EnabledAiModel,
  ExtendParamsType,
  FixedPricingUnit,
  LLMParams,
  LobeDefaultAiModelListItem,
  LookupPricingUnit,
  ModelAbilities,
  ModelPriceCurrency,
  ModelSearchImplementType,
  Pricing,
  PricingStrategy,
  PricingUnit,
  PricingUnitBase,
  PricingUnitName,
  PricingUnitType,
  TieredPricingUnit,
} from '@lobechat/types';

export { AiModelSourceEnum };

// Schemas runtime — permanecen en model-bank
export const AiModelTypeSchema = z.enum([
  'chat',
  'embedding',
  'tts',
  'stt',
  'image',
  'text2video',
  'text2music',
  'realtime',
] as const);

const AiModelAbilitiesSchema = z.object({
  functionCall: z.boolean().optional(),
  imageOutput: z.boolean().optional(),
  reasoning: z.boolean().optional(),
  search: z.boolean().optional(),
  video: z.boolean().optional(),
  vision: z.boolean().optional(),
});

export const CreateAiModelSchema = z.object({
  abilities: AiModelAbilitiesSchema.optional(),
  contextWindowTokens: z.number().optional(),
  displayName: z.string().optional(),
  id: z.string(),
  providerId: z.string(),
  releasedAt: z.string().optional(),
  type: AiModelTypeSchema.optional(),
});

export type CreateAiModelParams = z.infer<typeof CreateAiModelSchema>;

export const UpdateAiModelSchema = z.object({
  abilities: AiModelAbilitiesSchema.optional(),
  config: z
    .object({
      deploymentName: z.string().optional(),
    })
    .optional(),
  contextWindowTokens: z.number().nullable().optional(),
  displayName: z.string().nullable().optional(),
  type: AiModelTypeSchema.optional(),
});

export type UpdateAiModelParams = z.infer<typeof UpdateAiModelSchema>;

export const ToggleAiModelEnableSchema = z.object({
  enabled: z.boolean(),
  id: z.string(),
  providerId: z.string(),
  source: z.enum(['builtin', 'custom', 'remote']).optional(),
  type: AiModelTypeSchema.optional(),
});

export type ToggleAiModelEnableParams = z.infer<typeof ToggleAiModelEnableSchema>;
