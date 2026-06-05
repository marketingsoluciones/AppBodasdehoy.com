import { PluginQueryParams } from '@/types/discover';
import { convertOpenAIManifestToLobeManifest, getToolManifest } from '@/utils/toolManifest';

// CAPA 2 PASO C 2026-06-05 opción (c): marketplace de plugins deprecado.
// `getOldPluginList` era el listado del marketplace (lambdaClient.market.getPluginList).
// Con plugins via URL/manifest en runtime ya no hay marketplace centralizado.
// Stub devuelve lista vacía para no romper la UI antigua del store oldStore.

class ToolService {
  getOldPluginList = async (_params: PluginQueryParams): Promise<any> => {
    return { items: [], pageCount: 0, totalCount: 0 };
  };

  getToolManifest = getToolManifest;
  convertOpenAIManifestToLobeManifest = convertOpenAIManifestToLobeManifest;
}

export const toolService = new ToolService();
