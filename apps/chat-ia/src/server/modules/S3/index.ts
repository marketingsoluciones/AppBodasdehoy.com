/**
 * S3 stub — SPRINT-O 2026-05-19 — migración:
 *
 * @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner eliminados en SPRINT-J.
 * bodasdehoy NO usa storage S3/R2 directo desde chat-ia — el file storage real
 * está en api-ia / apiapp (asset proxy) o appEventos (uploads).
 *
 * Mantenemos los tipos y la class stub para que los routers de upload (edge/lambda)
 * sigan compilando. Si en runtime se invocan, throws con mensaje claro.
 *
 * En sprint dedicado de storage podrían eliminarse routers/upload completamente.
 */
import { z } from 'zod';

const STUB_ERROR =
  '[S3 stub] chat-ia NO ejecuta storage S3/R2 directo. ' +
  'Usar /api/assets via apiapp o api-ia para upload/download de archivos.';

export const fileSchema = z.object({
  Key: z.string(),
  LastModified: z.date().optional(),
  Size: z.number().optional(),
});

export const listFileSchema = z.array(fileSchema);

export type FileType = z.infer<typeof fileSchema>;

export class S3 {
  public async deleteFile(_key: string, _development?: string): Promise<void> {
    throw new Error(STUB_ERROR);
  }

  public async deleteFiles(_keys: string[], _development?: string): Promise<void> {
    throw new Error(STUB_ERROR);
  }

  public async getFileContent(_key: string, _development?: string): Promise<string> {
    throw new Error(STUB_ERROR);
  }

  public async getFileByteArray(_key: string, _development?: string): Promise<Uint8Array> {
    throw new Error(STUB_ERROR);
  }

  public async createPreSignedUrl(_key: string, _development?: string): Promise<string> {
    throw new Error(STUB_ERROR);
  }

  public async createPreSignedUrlForPreview(
    _key: string,
    _expiresIn?: number,
    _development?: string,
  ): Promise<string> {
    throw new Error(STUB_ERROR);
  }

  public async uploadBuffer(
    _path: string,
    _buffer: Buffer,
    _contentType?: string,
    _development?: string,
  ): Promise<void> {
    throw new Error(STUB_ERROR);
  }

  public async uploadContent(
    _path: string,
    _content: string,
    _development?: string,
  ): Promise<void> {
    throw new Error(STUB_ERROR);
  }

  public async uploadMedia(_key: string, _buffer: Buffer, _development?: string): Promise<void> {
    throw new Error(STUB_ERROR);
  }
}
