import { clientDB } from '@/database/client/db';
import { FileModel } from '@/database/models/file';
import { BaseClientService } from '@/services/baseClientService';
import { clientS3Storage } from '@/services/file/ClientS3';
import { FileListItem, QueryFileListParams } from '@/types/files';

import { IFileService } from './type';

export class ClientService extends BaseClientService implements IFileService {
  private get fileModel(): FileModel {
    return new FileModel(clientDB as any, this.userId);
  }

  createFile: IFileService['createFile'] = async (file) => {
    const { isExist } = await this.fileModel.checkHash(file.hash!);

    // save to local storage
    // we may want to save to a remote server later
    const res = await this.fileModel.create(
      {
        fileHash: file.hash,
        fileType: file.fileType,
        knowledgeBaseId: file.knowledgeBaseId,
        metadata: file.metadata,
        name: file.name,
        size: file.size,
        url: file.url!,
      },
      !isExist,
    );

    // get file to base64 url
    const base64 = await this.getBase64ByFileHash(file.hash!);

    return {
      id: res.id,
      url: `data:${file.fileType};base64,${base64}`,
    };
  };

  getFile: IFileService['getFile'] = async (id) => {
    const item = await this.fileModel.findById(id);
    if (!item) {
      throw new Error('file not found');
    }

    // arrayBuffer to url
    const fileItem = await clientS3Storage.getObject(item.fileHash!);
    if (!fileItem) throw new Error('file not found');

    const url = URL.createObjectURL(fileItem);

    return {
      createdAt: new Date(item.createdAt),
      id,
      name: item.name,
      size: item.size,
      type: item.fileType,
      updatedAt: new Date(item.updatedAt),
      url,
    };
  };

  removeFile: IFileService['removeFile'] = async (id) => {
    await this.fileModel.delete(id, false);
  };

  removeFiles: IFileService['removeFiles'] = async (ids) => {
    await this.fileModel.deleteMany(ids, false);
  };

  removeAllFiles: IFileService['removeAllFiles'] = async () => {
    return this.fileModel.clear();
  };

  checkFileHash: IFileService['checkFileHash'] = async (hash) => {
    return this.fileModel.checkHash(hash);
  };

  /** Listado para File Manager (modo PGLite); sin agregados de tareas async del servidor. */
  getFiles = async (params: QueryFileListParams): Promise<FileListItem[]> => {
    const rows = await this.fileModel.query(params);
    return rows.map((item) => ({
      chunkCount: null,
      chunkingError: null,
      chunkingStatus: null,
      createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt as any),
      embeddingError: null,
      embeddingStatus: null,
      fileType: item.fileType,
      finishEmbedding: false,
      id: item.id,
      name: item.name,
      size: item.size,
      updatedAt: item.updatedAt instanceof Date ? item.updatedAt : new Date(item.updatedAt as any),
      url: item.url ?? '',
    }));
  };

  getFileItem = async (id: string): Promise<FileListItem | undefined> => {
    const item = await this.fileModel.findById(id);
    if (!item) return undefined;

    return {
      chunkCount: null,
      chunkingError: null,
      chunkingStatus: null,
      createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt as any),
      embeddingError: null,
      embeddingStatus: null,
      fileType: item.fileType,
      finishEmbedding: false,
      id: item.id,
      name: item.name,
      size: item.size,
      updatedAt: item.updatedAt instanceof Date ? item.updatedAt : new Date(item.updatedAt as any),
      url: item.url ?? '',
    };
  };

  /** En cliente PGLite las tareas async pueden no existir; evitar llamar siempre a tRPC. */
  removeFileAsyncTask = async (_id: string, _type: 'embedding' | 'chunk') => {
    return;
  };

  private getBase64ByFileHash = async (hash: string) => {
    const fileItem = await clientS3Storage.getObject(hash);
    if (!fileItem) throw new Error('file not found');

    return Buffer.from(await fileItem.arrayBuffer()).toString('base64');
  };
}
