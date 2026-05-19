import { CrawlImplType, CrawlSuccessResult, SearchParams, SearchQuery } from '@lobechat/types';
import pMap from 'p-map';

import { getSupportKey } from '@/const/supportKeys';
import { resolveServerBackendOrigin } from '@/const/backendEndpoints';
import { toolsEnv } from '@/envs/tools';

import { SearchImplType, SearchServiceImpl, createSearchServiceImpl } from './impls';

/**
 * Llama POST /webapi/crawl de api-ia para obtener el contenido de una URL.
 * Reemplaza @lobechat/web-crawler (2026-05-19) — el crawl real vive
 * server-side en api-ia con SSRF guards.
 */
async function crawlViaApiIa(
  url: string,
  development = 'bodasdehoy',
): Promise<CrawlSuccessResult | { content: string; errorMessage: string; errorType: string; url: string }> {
  const backendUrl = resolveServerBackendOrigin();
  if (!backendUrl) {
    return { content: '', errorMessage: 'API_IA_URL no configurado', errorType: 'config_error', url };
  }

  try {
    const resp = await fetch(`${backendUrl}/webapi/crawl`, {
      body: JSON.stringify({ depth: 1, format: 'markdown', include_links: false, timeout: 30, url }),
      headers: {
        'Content-Type': 'application/json',
        'X-Development': development,
        'X-Support-Key': getSupportKey(development),
      },
      method: 'POST',
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return { content: '', errorMessage: text.slice(0, 200), errorType: `http_${resp.status}`, url };
    }

    const data = (await resp.json()) as {
      content?: string;
      links?: string[];
      metadata?: { word_count?: number; language?: string };
      title?: string;
      url: string;
    };

    return {
      content: data.content,
      contentType: 'text',
      description: undefined,
      length: data.metadata?.word_count,
      title: data.title,
      url: data.url ?? url,
    };
  } catch (e: any) {
    return { content: '', errorMessage: e?.message ?? 'fetch_failed', errorType: 'network_error', url };
  }
}

const parseImplEnv = (envString: string = '') => {
  // Handle full-width commas and extra whitespace
  const envValue = envString.replaceAll('，', ',').trim();
  return envValue.split(',').filter(Boolean);
};

/**
 * Search service class
 * Uses different implementations for different search operations
 */
export class SearchService {
  private searchImpl: SearchServiceImpl;

  private get crawlerImpls() {
    return parseImplEnv(toolsEnv.CRAWLER_IMPLS);
  }

  constructor() {
    const impls = this.searchImpls;
    // TODO: need use turn mode
    this.searchImpl = createSearchServiceImpl(impls.length > 0 ? impls[0] : undefined);
  }

  async crawlPages(input: { impls?: CrawlImplType[]; urls: string[] }) {
    // Migración 2026-05-19: en lugar de Crawler local con node-html-markdown,
    // delegamos a api-ia POST /webapi/crawl. Mantenemos el shape de resultado
    // {crawler, data, originalUrl} esperado por los consumidores.
    const results = await pMap(
      input.urls,
      async (url) => {
        const data = await crawlViaApiIa(url);
        return {
          crawler: 'apiIa',
          data,
          originalUrl: url,
        };
      },
      { concurrency: 3 },
    );

    return { results };
  }

  private get searchImpls() {
    return parseImplEnv(toolsEnv.SEARCH_PROVIDERS) as SearchImplType[];
  }

  /**
   * Query for search results
   */
  async query(query: string, params?: SearchParams) {
    return this.searchImpl.query(query, params);
  }

  async webSearch({ query, searchCategories, searchEngines, searchTimeRange }: SearchQuery) {
    let data = await this.query(query, {
      searchCategories: searchCategories,
      searchEngines: searchEngines,
      searchTimeRange: searchTimeRange,
    });

    // First retry: remove search engine restrictions if no results found
    if (data.results.length === 0 && searchEngines && searchEngines?.length > 0) {
      const paramsExcludeSearchEngines = {
        searchCategories: searchCategories,
        searchEngines: undefined,
        searchTimeRange: searchTimeRange,
      };
      data = await this.query(query, paramsExcludeSearchEngines);
    }

    // Second retry: remove all restrictions if still no results found
    if (data?.results.length === 0) {
      data = await this.query(query);
    }

    return data;
  }
}

// Add a default exported instance for convenience
export const searchService = new SearchService();
