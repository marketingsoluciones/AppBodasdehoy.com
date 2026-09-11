/**
 * SPRINT-L 2026-05-19: Types stub locales para reemplazar @lobechat/electron-server-ipc
 * eliminado en SPRINT-K. Mantenidos para que TSC pase. Las features LocalFile y
 * electron-service son desktop-only — en bodasdehoy web nunca se ejecutan en runtime,
 * pero el código existe en el grafo de compile.
 *
 * Si en futuro se elimina LocalFile + electron-service features completamente,
 * este archivo y server/modules/ElectronIPCClient/index.ts pueden borrarse.
 */
export interface CreateFileParams {
  content?: Buffer | string;
  filename: string;
  hash?: string;
  metadata?: Record<string, any>;
  path?: string;
  type?: string;
}

export interface FileMetadata {
  date: string;
  filename: string;
  hash: string;
  path: string;
  size?: number;
  type?: string;
}

export interface DeleteFilesResponse {
  errors?: Array<{ message: string; path: string }>;
  success: boolean;
}

/**
 * Stub de la class ElectronIpcClient — implementa interface vacía.
 * En desktop real esto vendría del package eliminado.
 */
export class ElectronIpcClient {
  constructor(_appId: string) {
    // noop en web
  }

  protected sendRequest<T = unknown>(_event: string, ..._args: any[]): Promise<T> {
    throw new Error('[ElectronIpcClient stub] not available in web build');
  }
}
