/**
 * Returns true if the given MIME type is not supported for text chunking
 * (i.e., cannot be parsed into chunks for the knowledge base).
 *
 * Images and binary formats cannot be chunked into text.
 */
const UNSUPPORTED_CHUNK_TYPES = new Set([
  // Images
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
  'image/ico',
  'image/x-icon',
  // Audio/Video
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'video/mp4',
  'video/mpeg',
  'video/webm',
  'video/ogg',
  // Binary archives
  'application/zip',
  'application/x-zip-compressed',
  'application/x-tar',
  'application/gzip',
  'application/x-7z-compressed',
  // Executables
  'application/octet-stream',
  'application/x-executable',
]);

export function isChunkingUnsupported(fileType?: string): boolean {
  if (!fileType) return false;
  return UNSUPPORTED_CHUNK_TYPES.has(fileType);
}
