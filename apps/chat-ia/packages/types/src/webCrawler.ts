/**
 * Web Crawler types — movidos desde @lobechat/web-crawler (2026-05-19)
 * para permitir eliminar el package interno (chat-ia ahora hace crawl via
 * api-ia POST /webapi/crawl).
 *
 * model-runtime/web-crawler son packages internos chat-ia que se eliminan
 * en FASE 2 de la migración. Estos types se mantienen aquí porque la UI
 * (`tools/web-browsing/`) los consume.
 */

export interface CrawlSuccessResult {
  content?: string;
  contentType: 'text' | 'json';
  description?: string;
  length?: number;
  siteName?: string;
  title?: string;
  url: string;
}

export interface CrawlErrorResult {
  content: string;
  errorMessage?: string;
  errorType?: string;
  url?: string;
}

export type CrawlImplType = 'naive' | 'jina' | 'browserless' | 'search1api' | 'apiIa';

export interface CrawlUniformResult {
  crawler: string;
  data: CrawlSuccessResult | CrawlErrorResult;
  originalUrl: string;
  transformedUrl?: string;
}
