import { t } from 'i18next';
import { StateCreator } from 'zustand/vanilla';

import { message } from '@/components/AntdStaticMethods';
import { LOBE_CHAT_CLOUD } from '@/const/branding';
import { uploadService } from '@/services/upload';
import { UploadFileItem } from '@/types/files';
import { getImageDimensions } from '@/utils/client/imageDimensions';

import { FileStore } from '../../store';

type OnStatusUpdate = (
  data:
    | {
        id: string;
        type: 'updateFile';
        value: Partial<UploadFileItem>;
      }
    | {
        id: string;
        type: 'removeFile';
      },
) => void;

interface UploadWithProgressParams {
  file: File;
  knowledgeBaseId?: string;
  onStatusUpdate?: OnStatusUpdate;
  /**
   * Optional flag to indicate whether to skip the file type check.
   * When set to `true`, any file type checks will be bypassed.
   * Default is `false`, which means file type checks will be performed.
   */
  skipCheckFileType?: boolean;
}

interface UploadWithProgressResult {
  dimensions?: {
    height: number;
    width: number;
  };
  filename?: string;
  id: string;
  url: string;
}

export interface FileUploadAction {
  uploadBase64FileWithProgress: (
    base64: string,
    params?: {
      onStatusUpdate?: OnStatusUpdate;
    },
  ) => Promise<UploadWithProgressResult | undefined>;

  uploadWithProgress: (
    params: UploadWithProgressParams,
  ) => Promise<UploadWithProgressResult | undefined>;
}

/**
 * Leer identidad y evento del usuario desde localStorage.
 * Se usa tanto en upload como en base64 upload.
 */
function getUserContext() {
  let eventId: string | undefined;
  let userId: string | undefined;
  let userEmail: string | undefined;
  let development: string | undefined;

  if (typeof window !== 'undefined') {
    try {
      const devConfig = localStorage.getItem('dev-user-config');
      if (devConfig) {
        const config = JSON.parse(devConfig);
        userId = config.user_id ?? config.userId;
        userEmail = config.user_email ?? config.email;
        development = config.development ?? config.developer;
        if (config.current_event_id) {
          eventId = config.current_event_id;
        } else if (config.eventos && config.eventos.length > 0) {
          eventId = config.eventos[0]._id || config.eventos[0].id;
        }
      }
    } catch (e) {
      console.warn('⚠️ No se pudo obtener contexto de usuario:', e);
    }
  }

  return { development, eventId, userEmail, userId };
}

export const createFileUploadSlice: StateCreator<
  FileStore,
  [['zustand/devtools', never]],
  [],
  FileUploadAction
> = () => ({
  uploadBase64FileWithProgress: async (base64) => {
    const dimensions = await getImageDimensions(base64);
    const ctx = getUserContext();

    const { metadata } = await uploadService.uploadBase64ToS3(base64, {
      eventId: ctx.eventId,
    });

    // ID sintético basado en path (R2 es la fuente de verdad, no Postgres)
    const syntheticId = metadata.path || `r2_${Date.now()}`;

    return {
      dimensions,
      filename: metadata.filename,
      id: syntheticId,
      url: metadata.path,
    };
  },
  uploadWithProgress: async ({ file, onStatusUpdate, skipCheckFileType }) => {
    try {
      // Feedback inmediato
      onStatusUpdate?.({
        id: file.name,
        type: 'updateFile',
        value: {
          status: 'uploading',
          uploadState: { progress: 0, restTime: 0, speed: 0 },
        },
      });

      // 1. Dimensiones de imagen si aplica
      const dimensions = await getImageDimensions(file);

      // 2. Contexto de usuario (eventId, userId, etc.)
      const ctx = getUserContext();

      // 3. Subir directamente a R2 via api-ia — sin checkFileHash ni Postgres
      const { data, success } = await uploadService.uploadFileToS3(file, {
        development: ctx.development,
        eventId: ctx.eventId,
        onNotSupported: () => {
          onStatusUpdate?.({ id: file.name, type: 'removeFile' });
          message.info({
            content: t('upload.fileOnlySupportInServerMode', {
              cloud: LOBE_CHAT_CLOUD,
              ext: file.name.split('.').pop(),
              ns: 'error',
            }),
            duration: 5,
          });
        },
        onProgress: (status, upload) => {
          onStatusUpdate?.({
            id: file.name,
            type: 'updateFile',
            value: { status: status === 'success' ? 'processing' : status, uploadState: upload },
          });
        },
        skipCheckFileType,
        userEmail: ctx.userEmail,
        userId: ctx.userId,
      });

      if (!success) {
        onStatusUpdate?.({
          id: file.name,
          type: 'updateFile',
          value: {
            status: 'error',
            uploadState: { progress: 0, restTime: 0, speed: 0 },
          },
        });
        return;
      }

      // 4. ID sintético — R2/api-ia es la fuente de verdad
      const syntheticId = data.path || `r2_${Date.now()}_${file.name}`;

      onStatusUpdate?.({
        id: file.name,
        type: 'updateFile',
        value: {
          fileUrl: data.path,
          id: syntheticId,
          status: 'success',
          uploadState: { progress: 100, restTime: 0, speed: 0 },
        },
      });

      // Notificar al StorageFileList para que refresque
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage-files-changed'));
      }

      return { dimensions, filename: file.name, id: syntheticId, url: data.path };
    } catch (error) {
      console.error('[uploadWithProgress] fallo al subir', file.name, error);
      const msg = error instanceof Error ? error.message : String(error);
      message.error({
        content: `Error subiendo archivo: ${msg}`,
        duration: 8,
      });
      onStatusUpdate?.({
        id: file.name,
        type: 'updateFile',
        value: {
          status: 'error',
          uploadState: { progress: 0, restTime: 0, speed: 0 },
        },
      });
      return;
    }
  },
});
