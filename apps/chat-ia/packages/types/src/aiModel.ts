// Tipos puros movidos desde @lobechat/model-bank 2026-05-20 SPRINT-A.final
// Schemas zod (AiModelTypeSchema, AiModelAbilitiesSchema, CreateAiModelSchema,
// UpdateAiModelSchema, ToggleAiModelEnableSchema) permanecen en model-bank.
// ModelPriceCurrency, AiModelType, ModelAbilities, BasicModelPricing, LLMParams,
// AiModelSourceEnum, AiModelSourceType ya están en ./modelProvider (SPRINT-A.1-A.5).

import type {
  AiModelType,
  BasicModelPricing,
  ModelAbilities,
  ModelPriceCurrency,
} from './modelProvider';
import type { ModelParamsSchema } from './aiModelParams';

export interface ChatModelPricing extends BasicModelPricing {
  audioInput?: number;
  audioOutput?: number;
  cachedAudioInput?: number;
  cachedInput?: number;
  output?: number;
  writeCacheInput?: number;
}

export type PricingUnitName =
  | 'textInput'
  | 'textOutput'
  | 'textInput_cacheRead'
  | 'textInput_cacheWrite'
  | 'audioInput'
  | 'audioOutput'
  | 'audioInput_cacheRead'
  | 'imageGeneration'
  | 'imageInput'
  | 'imageInput_cacheRead'
  | 'imageOutput';

export type PricingUnitType =
  | 'millionTokens'
  | 'millionCharacters'
  | 'image'
  | 'megapixel'
  | 'second';

export type PricingStrategy = 'fixed' | 'tiered' | 'lookup';

export interface PricingUnitBase {
  name: PricingUnitName;
  strategy: PricingStrategy;
  unit: PricingUnitType;
}

export interface FixedPricingUnit extends PricingUnitBase {
  rate: number;
  strategy: 'fixed';
}

export interface TieredPricingUnit extends PricingUnitBase {
  strategy: 'tiered';
  tiers: Array<{
    rate: number;
    upTo: number | 'infinity';
  }>;
}

export interface LookupPricingUnit extends PricingUnitBase {
  lookup: {
    prices: Record<string, number>;
    pricingParams: string[];
  };
  strategy: 'lookup';
}

export type PricingUnit = FixedPricingUnit | TieredPricingUnit | LookupPricingUnit;

export interface Pricing {
  currency?: ModelPriceCurrency;
  units: PricingUnit[];
}

export interface AIBaseModelCard {
  contextWindowTokens?: number;
  description?: string;
  displayName?: string;
  enabled?: boolean;
  id: string;
  legacy?: boolean;
  maxOutput?: number;
  organization?: string;
  releasedAt?: string;
}

export interface AiModelConfig {
  deploymentName?: string;
  enabledSearch?: boolean;
}

export type ModelSearchImplementType = 'tool' | 'params' | 'internal';

export type ExtendParamsType =
  | 'reasoningBudgetToken'
  | 'enableReasoning'
  | 'disableContextCaching'
  | 'reasoningEffort'
  | 'gpt5ReasoningEffort'
  | 'textVerbosity'
  | 'thinking'
  | 'thinkingBudget'
  | 'urlContext';

export interface AiModelSettings {
  extendParams?: ExtendParamsType[];
  searchImpl?: ModelSearchImplementType;
  searchProvider?: string;
}

export interface AIChatModelCard extends AIBaseModelCard {
  abilities?: ModelAbilities;
  config?: AiModelConfig;
  maxOutput?: number;
  pricing?: Pricing;
  settings?: AiModelSettings;
  type: 'chat';
}

export interface AIEmbeddingModelCard extends AIBaseModelCard {
  maxDimension: number;
  pricing?: Pricing;
  type: 'embedding';
}

export interface AIImageModelCard extends AIBaseModelCard {
  parameters?: ModelParamsSchema;
  pricing?: Pricing;
  resolutions?: string[];
  type: 'image';
}

export interface AITTSModelCard extends AIBaseModelCard {
  pricing?: Pricing;
  type: 'tts';
}

export interface AISTTModelCard extends AIBaseModelCard {
  pricing?: Pricing;
  type: 'stt';
}

export interface AIRealtimeModelCard extends AIBaseModelCard {
  abilities?: {
    files?: boolean;
    functionCall?: boolean;
    reasoning?: boolean;
    vision?: boolean;
  };
  deploymentName?: string;
  maxOutput?: number;
  pricing?: Pricing;
  type: 'realtime';
}

export interface AiFullModelCard extends AIBaseModelCard {
  abilities?: ModelAbilities;
  config?: AiModelConfig;
  contextWindowTokens?: number;
  displayName?: string;
  id: string;
  maxDimension?: number;
  parameters?: ModelParamsSchema;
  pricing?: Pricing;
  type: AiModelType;
}

export interface LobeDefaultAiModelListItem extends AiFullModelCard {
  abilities: ModelAbilities;
  providerId: string;
}

export interface AiModelSortMap {
  id: string;
  sort: number;
  type?: AiModelType;
}

export interface AiProviderModelListItem {
  abilities?: ModelAbilities;
  config?: AiModelConfig;
  contextWindowTokens?: number;
  displayName?: string;
  enabled: boolean;
  id: string;
  parameters?: ModelParamsSchema;
  pricing?: Pricing;
  releasedAt?: string;
  settings?: AiModelSettings;
  source?: import('./modelProvider').AiModelSourceType;
  type: AiModelType;
}

export interface AiModelForSelect {
  abilities: ModelAbilities;
  contextWindowTokens?: number;
  displayName?: string;
  id: string;
}

export interface EnabledAiModel {
  abilities: ModelAbilities;
  config?: AiModelConfig;
  contextWindowTokens?: number;
  displayName?: string;
  enabled?: boolean;
  id: string;
  parameters?: ModelParamsSchema;
  providerId: string;
  settings?: AiModelSettings;
  sort?: number;
  type: AiModelType;
}
