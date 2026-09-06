/**
 * Stub post SPRINT-N (2026-05-19) — recuperado en SPRINT-N hotfix (2026-05-20).
 *
 * El directorio libs/langchain/ original (32 archivos, 1844 LOC con loaders
 * code/csv/docx/epub/excel/pdf/pptx/txt + ChunkingLoader) fue eliminado en
 * SPRINT-N porque chat-ia bodasdehoy migra el parsing de documentos a
 * api-ia (/webapi/files/parse). Las deps langchain/* también fueron
 * eliminadas (SPRINT-J).
 *
 * Sin embargo, server/modules/ContentChunk + server/services/chunk + tRPC
 * routers chunk/file/ragEval aún importan ChunkingLoader. En producción
 * bodasdehoy esos routers NO se invocan (no hay RAG/KB activo) — TSC se
 * queja en compile pero runtime no falla.
 *
 * Este stub mantiene la firma para que TSC compile. Si alguien invoca el
 * router por error, lanza un error claro pidiendo migrar a api-ia.
 *
 * Para restaurar functionality completa: revertir los archivos del commit
 * pre-SPRINT-N (22732e2b) — recupera 32 archivos + re-añadir 4 deps
 * langchain/*. ROI bajo si bodasdehoy nunca activará RAG en chat-ia.
 */

const STUB_ERROR =
  'ChunkingLoader removed in SPRINT-N. Document chunking moved to api-ia ' +
  '/webapi/files/parse. Use that endpoint instead. To restore local parsing, ' +
  'revert apps/chat-ia/src/libs/langchain/ from commit 22732e2b + re-add ' +
  'langchain dependencies to package.json.';

export class ChunkingLoader {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  partitionContent = async (..._args: unknown[]): Promise<any[]> => {
    throw new Error(STUB_ERROR);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadFile = async (..._args: unknown[]): Promise<any> => {
    throw new Error(STUB_ERROR);
  };
}

export const LANGCHAIN_SUPPORT_TEXT_LIST: string[] = [];
