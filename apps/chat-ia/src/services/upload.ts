import { isDesktop, isServerMode } from '@lobechat/const';
import { parseDataUri } from '@lobechat/model-runtime';
import { uuid } from '@lobechat/utils';
import dayjs from 'dayjs';
import { sha256 } from 'js-sha256';

import { fileEnv } from '@/envs/file';
import { lambdaClient } from '@/libs/trpc/client';
import { API_ENDPOINTS } from '@/services/_url';
import { clientS3Storage } from '@/services/file/ClientS3';
import { FileMetadata, UploadBase64ToS3Result } from '@/types/files';
import { FileUploadState, FileUploadStatus } from '@/types/files/upload';

export const UPLOAD_NETWORK_ERROR = 'NetWorkError';
export const UPLOAD_GUEST_CAPTATION = 'GuestCaptation';

// Tipo para respuestas de captación del backend
export interface CaptationUploadResponse {
  action_required: string;
  cta: {
    primary_text: string;
    register_url: string;
    secondary_text: string;
  };
  is_guest: boolean;
  message: {
    cta_secondary?: string;
    cta_text: string;
    features: string[];
    subtitle: string;
    title: string;
    urgency?: string;
  };
  success: boolean;
}

/**
 * Generate file storage path metadata for S3-compatible storage
 * @param originalFilename - Original filename
 * @param options - Path generation options
 * @returns Path metadata including date, dirname, filename, and pathname
 */
const generateFilePathMetadata = (
  originalFilename: string,
  options: { directory?: string; pathname?: string } = {},
): {
  date: string;
  dirname: string;
  filename: string;
  pathname: string;
} => {
  // Generate unique filename with UUID prefix and original extension
  const extension = originalFilename.split('.').at(-1);
  const filename = `${uuid()}.${extension}`;

  // Generate timestamp-based directory path
  const date = (Date.now() / 1000 / 60 / 60).toFixed(0);
  const dirname = `${options.directory || fileEnv.NEXT_PUBLIC_S3_FILE_PATH}/${date}`;
  const pathname = options.pathname ?? `${dirname}/${filename}`;

  return {
    date,
    dirname,
    filename,
    pathname,
  };
};

interface UploadFileToS3Options {
  directory?: string;
  eventId?: string;
  filename?: string;
  onCaptation?: (captationData: CaptationUploadResponse) => void; // Callback para mostrar modal de captación
  onNotSupported?: () => void;
  onProgress?: (status: FileUploadStatus, state: FileUploadState) => void;
  pathname?: string;
  skipCheckFileType?: boolean;
}

class UploadService {
  /**
   * Método principal de subida de archivos.
   *
   * Todos los uploads van a R2 via api-ia (whitelabel).
   * Credenciales gestionadas por api2 — nunca por variables de entorno S3_*.
   *
   * Casos especiales:
   * - Desktop (Electron, sin sync): usa almacenamiento local → uploadToDesktopS3
   * - Si api-ia detecta usuario guest: retorna captación en lugar de subir
   */
  uploadFileToS3 = async (
    file: File,
    { onProgress, directory, skipCheckFileType, onNotSupported, pathname, eventId, onCaptation }: UploadFileToS3Options = {},
  ): Promise<{ captation?: CaptationUploadResponse; data: FileMetadata; success: boolean }> => {
    // Desktop (Electron sin sync activo): usa sistema de archivos local
    if (isDesktop) {
      const { getElectronStoreState } = await import('@/store/electron');
      const { electronSyncSelectors } = await import('@/store/electron/selectors');
      const state = getElectronStoreState();
      const isSyncActive = electronSyncSelectors.isSyncActive(state);

      if (!isSyncActive) {
        onProgress?.('uploading', { progress: 0, restTime: 0, speed: 0 });
        const data = await this.uploadToDesktopS3(file, { directory, pathname });
        onProgress?.('success', { progress: 100, restTime: 0, speed: 0 });
        return { data, success: true };
      }
    }

    // Todos los demás casos: R2 via api-ia (whitelabel)
    // - eventId presente → guarda en {development}/events/{eventId}/...
    // - eventId ausente  → guarda en {development}/users/{userId}/...
    const result = await this.uploadToStorageR2(file, { eventId, onCaptation, onProgress });

    // Respuesta de captación: usuario guest detectado por api-ia
    if (result.isCaptation && result.captationData) {
      return {
        captation: result.captationData,
        data: undefined as unknown as FileMetadata,
        success: false,
      };
    }

    return { data: result.metadata!, success: true };
  };

  uploadBase64ToS3 = async (
    base64Data: string,
    options: UploadFileToS3Options = {},
  ): Promise<UploadBase64ToS3Result> => {
    // 解析 base64 数据
    const { base64, mimeType, type } = parseDataUri(base64Data);

    if (!base64 || !mimeType || type !== 'base64') {
      throw new Error('Invalid base64 data for image');
    }

    // 将 base64 转换为 Blob
    const byteCharacters = atob(base64);
    const byteArrays = [];

    // 分块处理以避免内存问题
    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
      const slice = byteCharacters.slice(offset, offset + 1024);

      const byteNumbers: number[] = Array.from({ length: slice.length });
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: mimeType });

    // 确定文件扩展名
    const fileExtension = mimeType.split('/')[1] || 'png';
    const fileName = `${options.filename || `image_${dayjs().format('YYYY-MM-DD-hh-mm-ss')}`}.${fileExtension}`;

    // 创建文件对象
    const file = new File([blob], fileName, { type: mimeType });

    // 使用统一的上传方法
    const { data: metadata } = await this.uploadFileToS3(file, options);
    const hash = sha256(await file.arrayBuffer());

    return {
      fileType: mimeType,
      hash,
      metadata,
      size: file.size,
    };
  };

  uploadDataToS3 = async (data: object, options: UploadFileToS3Options = {}) => {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const file = new File([blob], options.filename || 'data.json', { type: 'application/json' });
    return await this.uploadFileToS3(file, options);
  };

  uploadToServerS3 = async (
    file: File,
    {
      onProgress,
      directory,
      pathname,
    }: {
      directory?: string;
      onProgress?: (status: FileUploadStatus, state: FileUploadState) => void;
      pathname?: string;
    },
  ): Promise<FileMetadata> => {
    const xhr = new XMLHttpRequest();

    const { preSignUrl, ...result } = await this.getSignedUploadUrl(file, { directory, pathname });
    let startTime = Date.now();
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Number(((event.loaded / event.total) * 100).toFixed(1));

        const speedInByte = event.loaded / ((Date.now() - startTime) / 1000);

        onProgress?.('uploading', {
          // if the progress is 100, it means the file is uploaded
          // but the server is still processing it
          // so make it as 99.9 and let users think it's still uploading
          progress: progress === 100 ? 99.9 : progress,
          restTime: (event.total - event.loaded) / speedInByte,
          speed: speedInByte,
        });
      }
    });

    xhr.open('PUT', preSignUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    const data = await file.arrayBuffer();

    await new Promise((resolve, reject) => {
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.('success', {
            progress: 100,
            restTime: 0,
            speed: file.size / ((Date.now() - startTime) / 1000),
          });
          resolve(xhr.response);
        } else {
          reject(xhr.statusText);
        }
      });
      xhr.addEventListener('error', () => {
        if (xhr.status === 0) reject(UPLOAD_NETWORK_ERROR);
        else reject(xhr.statusText);
      });
      xhr.send(data);
    });

    return result;
  };

  private uploadToDesktopS3 = async (
    file: File,
    options: { directory?: string; pathname?: string } = {},
  ) => {
    const fileArrayBuffer = await file.arrayBuffer();
    const hash = sha256(fileArrayBuffer);

    // 生成文件路径元数据
    const { pathname } = generateFilePathMetadata(file.name, options);

    const { desktopFileAPI } = await import('@/services/electron/file');
    const { metadata } = await desktopFileAPI.uploadFile(file, hash, pathname);
    return metadata;
  };

  /**
   * ✅ NUEVO: Subir archivo a Storage R2 (Cloudflare R2)
   * Ahora maneja respuestas de captación para usuarios guest
   */
  uploadToStorageR2 = async (
    file: File,
    {
      eventId,
      onProgress,
      onCaptation,
    }: {
      eventId: string;
      onCaptation?: (captationData: CaptationUploadResponse) => void;
      onProgress?: (status: FileUploadStatus, state: FileUploadState) => void;
    },
  ): Promise<{
    captationData?: CaptationUploadResponse;
    isCaptation: boolean;
    metadata?: FileMetadata;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('event_id', eventId);
    formData.append('access_level', 'shared');

    // Obtener headers de usuario si están disponibles
    // NO incluir Content-Type - FormData lo maneja automáticamente con boundary
    const headers: Record<string, string> = {};

    // Intentar obtener user_id y development desde localStorage o contexto
    if (typeof window !== 'undefined') {
      try {
        const devConfig = localStorage.getItem('dev-user-config');
        if (devConfig) {
          const config = JSON.parse(devConfig);
          if (config.user_id) {
            headers['X-User-ID'] = config.user_id;
          }
          if (config.development) {
            headers['X-Development'] = config.development;
          }
        }
      } catch (e) {
        console.warn('⚠️ No se pudo obtener configuración de usuario:', e);
      }
    }

    onProgress?.('uploading', {
      progress: 0,
      restTime: 0,
      speed: 0,
    });

    const response = await fetch('/api/storage/upload', {
      body: formData,
      headers,
      method: 'POST',
    });

    const result = await response.json();

    // ✅ DETECTAR RESPUESTA DE CAPTACIÓN (usuario guest)
    if (result.is_guest === true && result.action_required === 'register') {
      console.log('📢 Backend detectó usuario guest - respuesta de captación recibida');

      const captationData: CaptationUploadResponse = {
        action_required: result.action_required,
        cta: result.cta,
        is_guest: true,
        message: result.message,
        success: false,
      };

      // Llamar callback si está disponible
      if (onCaptation) {
        onCaptation(captationData);
      }

      return {
        captationData,
        isCaptation: true,
        metadata: undefined,
      };
    }

    // Verificar errores normales
    if (!response.ok) {
      throw new Error(result.error || `Error ${response.status}`);
    }

    if (!result.success) {
      throw new Error(result.error || 'Error subiendo archivo');
    }

    onProgress?.('success', {
      progress: 100,
      restTime: 0,
      speed: file.size / 1000, // Estimación
    });

    // Convertir respuesta de Storage R2 a formato FileMetadata
    const fileData = result.data || {};
    const publicUrl =
      fileData.public_urls?.original ||
      fileData.public_urls?.optimized_800w ||
      fileData.public_urls?.thumbnail ||
      '';

    return {
      isCaptation: false,
      metadata: {
        date: new Date().toISOString(),
        dirname: `storage-r2/${eventId}`,
        filename: file.name,
        path: publicUrl,
      },
    };
  };

  private uploadToClientS3 = async (hash: string, file: File): Promise<FileMetadata> => {
    await clientS3Storage.putObject(hash, file);

    return {
      date: (Date.now() / 1000 / 60 / 60).toFixed(0),
      dirname: '',
      filename: file.name,
      path: `client-s3://${hash}`,
    };
  };

  /**
   * get image File item with cors image URL
   * @param url
   * @param filename
   * @param fileType
   */
  getImageFileByUrlWithCORS = async (url: string, filename: string, fileType = 'image/png') => {
    const res = await fetch(API_ENDPOINTS.proxy, { body: url, method: 'POST' });
    const data = await res.arrayBuffer();

    return new File([data], filename, { lastModified: Date.now(), type: fileType });
  };

  private getSignedUploadUrl = async (
    file: File,
    options: { directory?: string; pathname?: string } = {},
  ): Promise<
    FileMetadata & {
      preSignUrl: string;
    }
  > => {
    // 生成文件路径元数据
    const { date, dirname, filename, pathname } = generateFilePathMetadata(file.name, options);

    const preSignUrl = await lambdaClient.upload.createS3PreSignedUrl.mutate({ pathname });

    return {
      date,
      dirname,
      filename,
      path: pathname,
      preSignUrl,
    };
  };
}

export const uploadService = new UploadService();
