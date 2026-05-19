import { LobeChatDatabase } from '@lobechat/database';
import debug from 'debug';
import * as fs from 'node:fs';

import { DocumentModel } from '@/database/models/document';
import { FileModel } from '@/database/models/file';
import { getSupportKey } from '@/const/supportKeys';
import { resolveServerBackendOrigin } from '@/const/backendEndpoints';
import { LobeDocument } from '@/types/document';

import { FileService } from '../file';

const log = debug('lobe-chat:service:document');

/**
 * Parsea un archivo via api-ia POST /webapi/files/parse (multipart).
 * Reemplaza @lobechat/file-loaders (2026-05-19) — el package interno
 * de chat-ia se elimina porque el parser real vive en api-ia
 * (services/document_scanner.py). Esto reduce el bundle Vercel ~27 archivos.
 *
 * Soporta MVP1: PDF, DOCX, XLSX. Fase 2 backend: PPTX, ODT, RTF.
 */
async function parseFileViaApiIa(
  filePath: string,
  fileName: string,
  development: string,
): Promise<{
  content: string;
  fileType: string;
  metadata: { pages?: number; word_count?: number; [k: string]: any };
  pages: Array<{
    charCount: number;
    lineCount: number;
    metadata: Record<string, any>;
    pageContent: string;
  }>;
  totalCharCount: number;
  totalLineCount: number;
}> {
  const backendUrl = resolveServerBackendOrigin();
  if (!backendUrl) {
    throw new Error('API_IA_URL no configurado — no se puede parsear archivos');
  }

  const fileBuffer = fs.readFileSync(filePath);
  const form = new FormData();
  // En Node 18+: Blob acepta Buffer
  form.append('file', new Blob([fileBuffer]), fileName);
  form.append('mode', 'text');

  const resp = await fetch(`${backendUrl}/webapi/files/parse`, {
    body: form,
    headers: {
      'X-Development': development,
      'X-Support-Key': getSupportKey(development),
    },
    method: 'POST',
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`api-ia files/parse ${resp.status}: ${body.slice(0, 200)}`);
  }

  const data = (await resp.json()) as {
    text: string;
    metadata: { mime_type?: string; pages?: number; word_count?: number; [k: string]: any };
  };

  const content = data.text ?? '';
  // api-ia MVP1 devuelve text plano sin chunks. Si más adelante exponen mode=chunks
  // mapeamos data.chunks[] → LobeDocumentPage[]. Por ahora: pages = single-page con todo el text.
  const lineCount = content ? content.split('\n').length : 0;
  const pagesArray = content
    ? [{ charCount: content.length, lineCount, metadata: {}, pageContent: content }]
    : [];
  return {
    content,
    fileType: data.metadata?.mime_type ?? 'application/octet-stream',
    metadata: data.metadata ?? {},
    pages: pagesArray,
    totalCharCount: content.length,
    totalLineCount: content.split('\n').length,
  };
}

export class DocumentService {
  userId: string;
  private fileModel: FileModel;
  private documentModel: DocumentModel;
  private fileService: FileService;

  constructor(db: LobeChatDatabase, userId: string) {
    this.userId = userId;
    this.fileModel = new FileModel(db, userId);
    this.fileService = new FileService(db, userId);
    this.documentModel = new DocumentModel(db, userId);
  }

  /** Parsear contenido de archivo via api-ia */
  async parseFile(fileId: string, development = 'bodasdehoy'): Promise<LobeDocument> {
    const { filePath, file, cleanup } = await this.fileService.downloadFileToLocal(fileId);

    const logPrefix = `[${file.name}]`;
    log(`${logPrefix} parseando via api-ia, path: ${filePath}`);

    try {
      const fileDocument = await parseFileViaApiIa(filePath, file.name, development);

      log(`${logPrefix} parse OK`, {
        fileType: fileDocument.fileType,
        size: fileDocument.content.length,
      });

      const document = await this.documentModel.create({
        content: fileDocument.content,
        fileId,
        fileType: file.fileType,
        metadata: fileDocument.metadata,
        pages: fileDocument.pages,
        source: file.url,
        sourceType: 'file',
        title: fileDocument.metadata?.title,
        totalCharCount: fileDocument.totalCharCount,
        totalLineCount: fileDocument.totalLineCount,
      });

      return document as LobeDocument;
    } catch (error) {
      console.error(`${logPrefix} parse error:`, error);
      throw error;
    } finally {
      cleanup();
    }
  }
}
