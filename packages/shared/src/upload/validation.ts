/**
 * File validation utilities for upload.
 */

export const PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
] as const;

export const VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime', // MOV
] as const;

export const PHOTO_VIDEO_TYPES = [...PHOTO_TYPES, ...VIDEO_TYPES] as const;

/** MIME types that are valid for upload (photo + video) */
export const PHOTO_VIDEO_ACCEPT = '.heic,.heif,.mov,image/*,video/*';

export const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export interface ValidateFileOptions {
  /** Allowed MIME types. Defaults to PHOTO_VIDEO_TYPES. */
  allowedTypes?: readonly string[];
  /** Max file size in bytes. Defaults to 50MB. */
  maxSize?: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'NO_FILE';
}

/**
 * Validate a file before upload.
 * Checks for HEIC/HEIF by extension when browser reports empty MIME.
 */
export function validateFile(
  file: File | null | undefined,
  options: ValidateFileOptions = {},
): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided', errorCode: 'NO_FILE' };
  }

  const maxSize = options.maxSize ?? DEFAULT_MAX_FILE_SIZE;
  const allowedTypes = options.allowedTypes ?? PHOTO_VIDEO_TYPES;

  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File too large (max ${maxMB}MB)`,
      errorCode: 'FILE_TOO_LARGE',
    };
  }

  // Browser may report empty MIME for HEIC/HEIF/MOV — check extension
  let mimeType = file.type.toLowerCase();
  if (!mimeType) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'heic' || ext === 'heif') mimeType = `image/${ext}`;
    else if (ext === 'mov') mimeType = 'video/quicktime';
  }

  const isAllowed = allowedTypes.some((t) => {
    if (t === mimeType) return true;
    // Wildcard matching: "image/*" matches "image/jpeg"
    if (t.endsWith('/*')) return mimeType.startsWith(t.replace('/*', '/'));
    return false;
  });

  if (!isAllowed) {
    return {
      valid: false,
      error: `File type not allowed: ${mimeType || file.name}`,
      errorCode: 'INVALID_TYPE',
    };
  }

  return { valid: true };
}
