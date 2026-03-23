/**
 * HEIC/HEIF conversion utilities.
 * Uses `heic2any` as a peer dependency (dynamic import).
 */

/**
 * Check if a file is HEIC/HEIF based on MIME type or extension.
 */
export function isHeicFile(file: File): boolean {
  const mime = file.type.toLowerCase();
  if (mime === 'image/heic' || mime === 'image/heif') return true;

  // Browsers often report empty MIME for HEIC
  if (!mime || mime === 'application/octet-stream') {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext === 'heic' || ext === 'heif';
  }

  return false;
}

/**
 * Convert HEIC/HEIF file to JPEG. Returns original file if not HEIC or conversion fails.
 * Requires `heic2any` to be installed — falls back gracefully if unavailable.
 */
export async function convertHeicIfNeeded(file: File): Promise<File> {
  if (!isHeicFile(file)) return file;

  try {
    const heic2any = (await import('heic2any')).default;
    const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
    const result = Array.isArray(blob) ? blob[0] : blob;
    const baseName = file.name.replace(/\.(heic|heif)$/i, '');
    return new File([result], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: file.lastModified,
    });
  } catch {
    // heic2any not available or conversion failed — return original for server-side handling
    return file;
  }
}
