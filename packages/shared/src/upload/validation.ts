/**
 * File validation utilities for upload.
 * Cubre TODO el catálogo de tipos soportados por el sistema:
 * fotos, vídeos, documentos, archives, audio.
 */

// ════════════════════════════════════════════════════════════════
// CATÁLOGOS DE TIPOS MIME
// ════════════════════════════════════════════════════════════════

export const PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/avif',
] as const;

export const VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime', // MOV
  'video/x-matroska', // MKV
] as const;

export const DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',                                                        // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',   // .docx
  'application/vnd.ms-excel',                                                  // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',         // .xlsx
  'application/vnd.ms-powerpoint',                                             // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.oasis.opendocument.text',                                   // .odt
  'application/vnd.oasis.opendocument.spreadsheet',                            // .ods
  'application/vnd.oasis.opendocument.presentation',                           // .odp
  'application/rtf',
  'text/rtf',
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/json',
] as const;

export const ARCHIVE_TYPES = [
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  'application/x-gzip',
] as const;

export const AUDIO_TYPES = [
  'audio/mpeg',  // mp3
  'audio/mp4',   // m4a
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/flac',
  'audio/x-flac',
] as const;

export const PHOTO_VIDEO_TYPES = [...PHOTO_TYPES, ...VIDEO_TYPES] as const;

/** Whitelist global: foto + vídeo + documento + archive + audio. */
export const ALL_ALLOWED_TYPES = [
  ...PHOTO_TYPES,
  ...VIDEO_TYPES,
  ...DOCUMENT_TYPES,
  ...ARCHIVE_TYPES,
  ...AUDIO_TYPES,
] as const;

// ════════════════════════════════════════════════════════════════
// CATEGORIZACIÓN
// ════════════════════════════════════════════════════════════════

export type FileCategory = 'photos' | 'videos' | 'documents' | 'archives' | 'audio' | 'other';

const EXT_TO_MIME: Record<string, string> = {
  // photos
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  avif: 'image/avif',
  // videos
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mkv: 'video/x-matroska',
  // documents
  pdf:  'application/pdf',
  doc:  'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls:  'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt:  'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odt:  'application/vnd.oasis.opendocument.text',
  ods:  'application/vnd.oasis.opendocument.spreadsheet',
  odp:  'application/vnd.oasis.opendocument.presentation',
  rtf:  'application/rtf',
  txt:  'text/plain',
  csv:  'text/csv',
  md:   'text/markdown',
  json: 'application/json',
  // archives
  zip:  'application/zip',
  rar:  'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  tar:  'application/x-tar',
  gz:   'application/gzip',
  // audio
  mp3:  'audio/mpeg',
  m4a:  'audio/mp4',
  wav:  'audio/wav',
  ogg:  'audio/ogg',
  flac: 'audio/flac',
};

/**
 * Adivina el MIME por extensión cuando el browser devuelve file.type vacío.
 * Caso típico: iOS Safari con HEIC/MOV, Android con algunos docs.
 */
export function guessMimeFromExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return EXT_TO_MIME[ext] ?? 'application/octet-stream';
}

/**
 * Devuelve el MIME efectivo: file.type si existe, si no, deducido por extensión.
 */
export function resolveMime(file: File): string {
  const mime = (file.type || '').toLowerCase();
  if (mime) return mime;
  return guessMimeFromExtension(file.name);
}

/**
 * Clasifica un archivo en una de las 6 categorías.
 * Usa MIME efectivo (resuelve extensión si el browser lo dejó vacío).
 */
export function categorize(file: File): FileCategory {
  const mime = resolveMime(file);
  if ((PHOTO_TYPES as readonly string[]).includes(mime))    return 'photos';
  if ((VIDEO_TYPES as readonly string[]).includes(mime))    return 'videos';
  if ((DOCUMENT_TYPES as readonly string[]).includes(mime)) return 'documents';
  if ((ARCHIVE_TYPES as readonly string[]).includes(mime))  return 'archives';
  if ((AUDIO_TYPES as readonly string[]).includes(mime))    return 'audio';
  return 'other';
}

// ════════════════════════════════════════════════════════════════
// LÍMITES POR CATEGORÍA (alineados con D5 backend)
// ════════════════════════════════════════════════════════════════

export const MAX_SIZE_BY_CATEGORY: Record<FileCategory, number> = {
  photos:    50  * 1024 * 1024,             // 50MB  (D5 imagen)
  videos:    5   * 1024 * 1024 * 1024,      // 5GB   (D5 vídeo, multipart >100MB)
  documents: 100 * 1024 * 1024,             // 100MB (D5 documento)
  archives:  500 * 1024 * 1024,             // 500MB (zips de backup)
  audio:     100 * 1024 * 1024,             // 100MB
  other:     10  * 1024 * 1024,             // 10MB conservador
};

/** Compatibilidad — algunos consumers viejos siguen importando esto. */
export const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024;

// ════════════════════════════════════════════════════════════════
// ACCEPT= STRINGS PARA <input type="file">
// ════════════════════════════════════════════════════════════════

/** Solo foto + HEIC iOS (perfil, evento, invitación). */
export const PHOTO_ACCEPT =
  '.heic,.heif,image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/avif';

/** Compat — usado por componentes legacy. Sin SVG (XSS risk). */
export const PHOTO_VIDEO_ACCEPT =
  PHOTO_ACCEPT + ',video/mp4,video/quicktime,video/webm';

/** Foto + documento (recibos de pago, facturas). */
export const PHOTO_DOC_ACCEPT =
  PHOTO_ACCEPT +
  ',.pdf,.doc,.docx,application/pdf,application/msword,' +
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** TODO: foto+vídeo+doc+archive+audio. Para adjuntos genéricos. */
export const ALL_FILES_ACCEPT =
  PHOTO_VIDEO_ACCEPT + ',' +
  // documents
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.rtf,.txt,.csv,.md,.json,' +
  // archives
  '.zip,.rar,.7z,.tar,.gz,' +
  // audio
  '.mp3,.m4a,.wav,.ogg,.flac,' +
  // MIMEs explícitos
  'application/pdf,application/msword,application/vnd.ms-excel,' +
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document,' +
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,' +
  'application/vnd.openxmlformats-officedocument.presentationml.presentation,' +
  'application/zip,application/x-zip-compressed,application/vnd.rar,' +
  'application/x-7z-compressed,audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/flac';

/** Importers locales — XLSX para invitados. */
export const XLSX_ONLY_ACCEPT = '.xlsx';

/** Importers locales — JSON/CSV/TXT para itinerario. */
export const JSON_CSV_TXT_ACCEPT = '.json,.csv,.txt';

/** Mesas — solo SVG (tope 10KB lo gestiona svgSizeUtils). */
export const SVG_ONLY_ACCEPT = '.svg';

// ════════════════════════════════════════════════════════════════
// VALIDACIÓN
// ════════════════════════════════════════════════════════════════

export interface ValidateFileOptions {
  /** MIMEs permitidos. Default: ALL_ALLOWED_TYPES. */
  allowedTypes?: readonly string[];
  /**
   * Tamaño máximo en bytes. Si NO se pasa y `allowedTypes` no se pasa,
   * usa MAX_SIZE_BY_CATEGORY[categorize(file)] (dinámico).
   * Si solo se pasa `allowedTypes` sin maxSize, usa DEFAULT_MAX_FILE_SIZE.
   */
  maxSize?: number;
}

export type ValidationErrorCode =
  | 'FILE_TOO_LARGE'
  | 'INVALID_TYPE'
  | 'NO_FILE'
  | 'EMPTY_FILE';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: ValidationErrorCode;
  /** Categoría detectada (útil para downstream: comprimir solo si es photos). */
  category?: FileCategory;
}

/**
 * Valida un archivo antes de subir.
 * - Si no se pasan `allowedTypes`, acepta TODO el catálogo soportado.
 * - Si no se pasa `maxSize`, usa el tope dinámico por categoría detectada.
 * - Rechaza archivos vacíos (0 bytes, bug iOS típico).
 */
export function validateFile(
  file: File | null | undefined,
  options: ValidateFileOptions = {},
): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided', errorCode: 'NO_FILE' };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'El archivo está vacío (0 bytes)',
      errorCode: 'EMPTY_FILE',
    };
  }

  const category = categorize(file);
  const allowedTypes = options.allowedTypes ?? ALL_ALLOWED_TYPES;
  const maxSize =
    options.maxSize ??
    (options.allowedTypes ? DEFAULT_MAX_FILE_SIZE : MAX_SIZE_BY_CATEGORY[category]);

  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `El archivo es demasiado grande (máx ${maxMB}MB)`,
      errorCode: 'FILE_TOO_LARGE',
      category,
    };
  }

  const mimeType = resolveMime(file);
  const isAllowed = allowedTypes.some((t) => {
    if (t === mimeType) return true;
    // Wildcard: "image/*" matches "image/jpeg"
    if (t.endsWith('/*')) return mimeType.startsWith(t.replace('/*', '/'));
    return false;
  });

  if (!isAllowed) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido: ${mimeType || file.name}`,
      errorCode: 'INVALID_TYPE',
      category,
    };
  }

  return { valid: true, category };
}

/**
 * Valida una lista de archivos. Devuelve los válidos + los rechazados con su motivo.
 * Útil para multi-select / drag&drop de muchos archivos.
 */
export interface BatchValidationResult {
  valid: Array<{ file: File; category: FileCategory }>;
  rejected: Array<{ file: File; error: string; errorCode: ValidationErrorCode }>;
}

export function validateFiles(
  files: FileList | File[] | null | undefined,
  options: ValidateFileOptions = {},
): BatchValidationResult {
  const result: BatchValidationResult = { valid: [], rejected: [] };
  if (!files) return result;
  const arr = Array.from(files);
  for (const file of arr) {
    const v = validateFile(file, options);
    if (v.valid) {
      result.valid.push({ file, category: v.category ?? categorize(file) });
    } else {
      result.rejected.push({
        file,
        error: v.error ?? 'Archivo inválido',
        errorCode: v.errorCode ?? 'INVALID_TYPE',
      });
    }
  }
  return result;
}
