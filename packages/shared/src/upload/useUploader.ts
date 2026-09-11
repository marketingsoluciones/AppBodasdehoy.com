/**
 * useUploader — hook React para consumir la UploadQueue.
 *
 * Una UploadQueue por app (se crea una vez y se reusa). El hook se suscribe
 * y expone API mínima a componentes consumidores.
 *
 * Uso:
 *   const queue = useMemo(() => new UploadQueue(myUploader), []);
 *   const { items, totalProgress, add, cancel, retry, clearDone } = useUploader(queue);
 *
 * Componentes legacy (AttachmentsEditor, etc.) pueden seguir usando su
 * uploadBytesResumable directo; este hook es para los nuevos flujos.
 */

import { useEffect, useState, useCallback } from 'react';
import type { UploadQueue, UploadItem, UploadContext } from './queue';
import type { FileCategory } from './validation';

export interface UseUploaderResult {
  items: ReadonlyArray<UploadItem>;
  totalProgress: number;
  add: (files: File[] | FileList, ctx: UploadContext, category?: FileCategory) => string[];
  cancel: (id: string) => void;
  retry: (id: string) => void;
  cancelAll: () => void;
  clearDone: () => void;
  /** Items separados por estado para tray UI. */
  active: ReadonlyArray<UploadItem>;
  done: ReadonlyArray<UploadItem>;
  errored: ReadonlyArray<UploadItem>;
}

export function useUploader(queue: UploadQueue): UseUploaderResult {
  const [items, setItems] = useState<ReadonlyArray<UploadItem>>(() => queue.getItems());

  useEffect(() => {
    const unsubscribe = queue.subscribe(setItems);
    return unsubscribe;
  }, [queue]);

  const add = useCallback(
    (files: File[] | FileList, ctx: UploadContext, category?: FileCategory) =>
      queue.add(files, ctx, category),
    [queue],
  );
  const cancel = useCallback((id: string) => queue.cancel(id), [queue]);
  const retry = useCallback((id: string) => queue.retry(id), [queue]);
  const cancelAll = useCallback(() => queue.cancelAll(), [queue]);
  const clearDone = useCallback(() => queue.clearDone(), [queue]);

  const active = items.filter((i) => i.status === 'uploading' || i.status === 'queued');
  const done = items.filter((i) => i.status === 'done');
  const errored = items.filter((i) => i.status === 'error');
  const totalProgress = queue.getTotalProgress();

  return { items, totalProgress, add, cancel, retry, cancelAll, clearDone, active, done, errored };
}
