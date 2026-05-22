// Tipo placeholder permisivo para back-compat con consumers que importan
// AIImageModelCard / AiFullModelCard / EnabledAiModel desde @lobechat/types.
// El tipo estricto vive en @lobechat/model-bank/standard-parameters y
// los consumers que necesitan validación deben importarlo desde allí.
//
// Usamos `any` (no Record/unknown) para preservar compatibilidad bidireccional
// con el tipo estricto de model-bank sin crear dependencia circular types ↔ model-bank.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ModelParamsSchema = any;
