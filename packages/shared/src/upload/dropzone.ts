/**
 * Drag & drop avanzado — recorrer carpetas con webkitGetAsEntry.
 *
 * El navegador da DataTransferItemList con cada item siendo un FileSystemEntry.
 * Si es directory: recorrer recursivo. Si es file: añadir.
 *
 * NO usar FileSystem Access API (newer) — webkitGetAsEntry está en Chrome,
 * Edge, Safari, Firefox desde hace años y es lo suficientemente bueno para
 * nuestra necesidad.
 *
 * Para sub-carpetas profundas: aplana a Array<File> manteniendo el path
 * en file.webkitRelativePath cuando posible (algunos browsers lo soportan).
 */

interface FileSystemEntryLike {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath?: string;
}

interface FileSystemFileEntryLike extends FileSystemEntryLike {
  file(success: (f: File) => void, error?: (e: unknown) => void): void;
}

interface FileSystemDirectoryEntryLike extends FileSystemEntryLike {
  createReader(): FileSystemDirectoryReaderLike;
}

interface FileSystemDirectoryReaderLike {
  readEntries(
    success: (entries: FileSystemEntryLike[]) => void,
    error?: (e: unknown) => void,
  ): void;
}

function readFile(entry: FileSystemFileEntryLike): Promise<File | null> {
  return new Promise((resolve) => {
    entry.file(
      (f) => resolve(f),
      () => resolve(null),
    );
  });
}

async function readDirectory(entry: FileSystemDirectoryEntryLike): Promise<File[]> {
  const reader = entry.createReader();
  const out: File[] = [];

  // readEntries devuelve hasta 100 items por llamada — hay que ir paginando.
  const readChunk = (): Promise<FileSystemEntryLike[]> =>
    new Promise((resolve) => {
      reader.readEntries(
        (entries) => resolve(entries),
        () => resolve([]),
      );
    });

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const entries = await readChunk();
    if (entries.length === 0) break;
    for (const e of entries) {
      if (e.isFile) {
        const f = await readFile(e as FileSystemFileEntryLike);
        if (f) out.push(f);
      } else if (e.isDirectory) {
        const sub = await readDirectory(e as FileSystemDirectoryEntryLike);
        out.push(...sub);
      }
    }
  }
  return out;
}

export interface FilesFromDropResult {
  files: File[];
  /** Cuántos directorios se descubrieron en total (para info al usuario). */
  directoryCount: number;
}

/**
 * Extrae TODOS los archivos de un evento drop, incluyendo los que estén
 * dentro de carpetas (recursivo). Si el browser no soporta webkitGetAsEntry,
 * cae a dataTransfer.files (plano).
 */
export async function filesFromDataTransfer(dt: DataTransfer): Promise<FilesFromDropResult> {
  const items = dt.items as unknown as DataTransferItemList | undefined;
  const result: FilesFromDropResult = { files: [], directoryCount: 0 };

  if (!items || items.length === 0 || typeof (items[0] as any)?.webkitGetAsEntry !== 'function') {
    // Fallback: solo archivos planos
    if (dt.files) result.files = Array.from(dt.files);
    return result;
  }

  // Recoger entries primero (síncrono) y luego procesar (async).
  const entries: FileSystemEntryLike[] = [];
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (item.kind !== 'file') continue;
    const entry = (item as any).webkitGetAsEntry?.() as FileSystemEntryLike | null;
    if (entry) entries.push(entry);
  }

  for (const entry of entries) {
    if (entry.isFile) {
      const f = await readFile(entry as FileSystemFileEntryLike);
      if (f) result.files.push(f);
    } else if (entry.isDirectory) {
      result.directoryCount += 1;
      const sub = await readDirectory(entry as FileSystemDirectoryEntryLike);
      result.files.push(...sub);
    }
  }
  return result;
}

/**
 * Filtra archivos sospechosos antes de devolverlos:
 *   - 0 bytes (bug iOS típico)
 *   - Empieza con punto y NO tiene extensión "real" (.gitignore, .DS_Store)
 *
 * NOTA: .DS_Store en carpetas Mac es muy común y suele querer ignorarse.
 */
export function filterDropFiles(files: File[]): { kept: File[]; skipped: File[] } {
  const kept: File[] = [];
  const skipped: File[] = [];
  for (const f of files) {
    if (f.size === 0) {
      skipped.push(f);
      continue;
    }
    if (f.name === '.DS_Store' || f.name.startsWith('._')) {
      skipped.push(f);
      continue;
    }
    kept.push(f);
  }
  return { kept, skipped };
}
