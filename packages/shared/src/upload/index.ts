export {
  // tipos MIME
  PHOTO_TYPES,
  VIDEO_TYPES,
  DOCUMENT_TYPES,
  ARCHIVE_TYPES,
  AUDIO_TYPES,
  PHOTO_VIDEO_TYPES,
  ALL_ALLOWED_TYPES,
  // accept= para inputs
  PHOTO_ACCEPT,
  PHOTO_VIDEO_ACCEPT,
  PHOTO_DOC_ACCEPT,
  ALL_FILES_ACCEPT,
  XLSX_ONLY_ACCEPT,
  JSON_CSV_TXT_ACCEPT,
  SVG_ONLY_ACCEPT,
  // límites
  MAX_SIZE_BY_CATEGORY,
  DEFAULT_MAX_FILE_SIZE,
  // utilidades
  validateFile,
  validateFiles,
  categorize,
  resolveMime,
  guessMimeFromExtension,
  type FileCategory,
  type ValidateFileOptions,
  type ValidationResult,
  type ValidationErrorCode,
  type BatchValidationResult,
} from './validation';

export { compressImage, type CompressImageOptions } from './compression';

export { isHeicFile, convertHeicIfNeeded } from './heic';

export { withRetry, type RetryOptions } from './retry';

// FASE C — cola universal
export {
  UploadQueue,
  type UploadStatus,
  type UploadItem,
  type UploadContext,
  type UploadResult,
  type UploaderFn,
  type UploadQueueOptions,
  type QueueListener,
} from './queue';
export { useUploader, type UseUploaderResult } from './useUploader';

// FASE D — drag & drop carpetas
export {
  filesFromDataTransfer,
  filterDropFiles,
  type FilesFromDropResult,
} from './dropzone';

// FASE E (parcial) — EXIF auto-rotate
export {
  readExifOrientation,
  rotateForOrientation,
  isOrientationSwapped,
  type ExifOrientation,
} from './exif';
