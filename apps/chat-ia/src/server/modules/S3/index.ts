/**
 * S3 — Cliente R2/S3 con credenciales dinámicas desde whitelabel (api2)
 *
 * Las credenciales NO se leen de variables de entorno S3_*.
 * Se obtienen de api2 vía getServerS3Config() con cache de 15 min.
 *
 * Si api2 no responde → las operaciones de S3 lanzan error (sin servicio, aceptado).
 */
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { z } from 'zod';

import { YEAR } from '@/utils/units';
import { inferContentTypeFromImageUrl } from '@/utils/url';

import { getServerS3Config } from '@/server/services/s3Config';

export const fileSchema = z.object({
  Key: z.string(),
  LastModified: z.date(),
  Size: z.number(),
});

export const listFileSchema = z.array(fileSchema);

export type FileType = z.infer<typeof fileSchema>;

const DEFAULT_PREVIEW_EXPIRE = 7200; // 2 horas

export class S3 {
  /** Cache de clientes S3 por development, invalidados cada 15 min */
  private clientCache = new Map<string, { client: S3Client; bucket: string; publicDomain: string | null; setAcl: boolean; expiresAt: number }>();

  /**
   * Obtiene (o crea) un cliente S3 autenticado para el development dado.
   * Reutiliza el cliente cacheado si no ha expirado.
   */
  private async getClient(development = 'bodasdehoy') {
    const cached = this.clientCache.get(development);
    if (cached && cached.expiresAt > Date.now()) return cached;

    const config = await getServerS3Config(development);

    const client = new S3Client({
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      endpoint: config.endpoint,
      forcePathStyle: config.enablePathStyle,
      region: config.region,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });

    const entry = {
      bucket: config.bucket,
      client,
      expiresAt: Date.now() + 15 * 60 * 1000,
      publicDomain: config.publicDomain,
      setAcl: false, // R2 no requiere ACL — acceso público via custom domain
    };

    this.clientCache.set(development, entry);
    return entry;
  }

  public async deleteFile(key: string, development?: string) {
    const { client, bucket } = await this.getClient(development);
    return client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }

  public async deleteFiles(keys: string[], development?: string) {
    const { client, bucket } = await this.getClient(development);
    return client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: keys.map((key) => ({ Key: key })) },
      }),
    );
  }

  public async getFileContent(key: string, development?: string): Promise<string> {
    const { client, bucket } = await this.getClient(development);
    const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

    if (!response.Body) throw new Error(`No body in response with ${key}`);
    return response.Body.transformToString();
  }

  public async getFileByteArray(key: string, development?: string): Promise<Uint8Array> {
    const { client, bucket } = await this.getClient(development);
    const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

    if (!response.Body) throw new Error(`No body in response with ${key}`);
    return response.Body.transformToByteArray();
  }

  public async createPreSignedUrl(key: string, development?: string): Promise<string> {
    const { client, bucket, setAcl } = await this.getClient(development);
    const command = new PutObjectCommand({
      ACL: setAcl ? 'public-read' : undefined,
      Bucket: bucket,
      Key: key,
    });
    return getSignedUrl(client, command, { expiresIn: 3600 });
  }

  public async createPreSignedUrlForPreview(key: string, expiresIn?: number, development?: string): Promise<string> {
    const { client, bucket } = await this.getClient(development);
    return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
      expiresIn: expiresIn ?? DEFAULT_PREVIEW_EXPIRE,
    });
  }

  public async uploadBuffer(path: string, buffer: Buffer, contentType?: string, development?: string) {
    const { client, bucket, setAcl } = await this.getClient(development);
    return client.send(
      new PutObjectCommand({
        ACL: setAcl ? 'public-read' : undefined,
        Body: buffer,
        Bucket: bucket,
        ContentType: contentType,
        Key: path,
      }),
    );
  }

  public async uploadContent(path: string, content: string, development?: string) {
    const { client, bucket, setAcl } = await this.getClient(development);
    return client.send(
      new PutObjectCommand({
        ACL: setAcl ? 'public-read' : undefined,
        Body: content,
        Bucket: bucket,
        Key: path,
      }),
    );
  }

  public async uploadMedia(key: string, buffer: Buffer, development?: string) {
    const { client, bucket, setAcl } = await this.getClient(development);
    await client.send(
      new PutObjectCommand({
        ACL: setAcl ? 'public-read' : undefined,
        Body: buffer,
        Bucket: bucket,
        CacheControl: `public, max-age=${YEAR}`,
        ContentType: inferContentTypeFromImageUrl(key)!,
        Key: key,
      }),
    );
  }
}
