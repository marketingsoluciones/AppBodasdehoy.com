/**
 * 2026-05-19 SPRINT-F: import estático LOBE_DEFAULT_MODEL_LIST eliminado.
 *
 * Razón: este archivo solo construía un dict `{modelId: {description}}` para i18n,
 * forzando que el bundle cliente cargara las 77 tablas de aiModels/*.ts (~3MB+ TS).
 *
 * En bodasdehoy api-ia es orquestador: el cliente NO elige modelo, así que las
 * descripciones i18n de modelos no se muestran en UI. Dejamos dict vacío para
 * mantener la firma del recurso i18n (locales[modelId]?.description = undefined).
 *
 * Si en el futuro se necesita description por modelo, recuperar via api-ia:
 *   GET /webapi/models/{provider} → cada entry incluye `description?`.
 */
const locales: {
  [key: string]: {
    description?: string;
  };
} = {};

export default locales;
