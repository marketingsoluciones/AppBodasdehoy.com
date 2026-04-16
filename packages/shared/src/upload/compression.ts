/**
 * Client-side image compression using Canvas API.
 * No external dependencies required.
 */

export interface CompressImageOptions {
  /** Max width in pixels. Defaults to 1920. */
  maxWidth?: number;
  /** JPEG/WebP quality 0-1. Defaults to 0.85. */
  quality?: number;
  /** Output format. Defaults to 'image/jpeg'. */
  outputType?: 'image/jpeg' | 'image/webp';
  /** Skip compression if file is already under this size in bytes. Defaults to 500KB. */
  skipUnderSize?: number;
}

/**
 * Compress an image file using Canvas API.
 * Returns original file if not an image, already small, or if compression fails.
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  const {
    maxWidth = 1920,
    quality = 0.85,
    outputType = 'image/jpeg',
    skipUnderSize = 500 * 1024, // 500KB
  } = options;

  // Not an image or already small enough — return as-is
  if (!file.type.startsWith('image/') || file.size <= skipUnderSize) {
    return file;
  }

  // Skip non-rasterizable formats (SVG, etc.)
  if (file.type === 'image/svg+xml') return file;

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    // No resize needed and already small
    if (width <= maxWidth && file.size <= skipUnderSize) {
      bitmap.close();
      return file;
    }

    const scale = width > maxWidth ? maxWidth / width : 1;
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    const blob = await canvas.convertToBlob({ type: outputType, quality });

    // Only use compressed version if it's actually smaller
    if (blob.size >= file.size) return file;

    const ext = outputType === 'image/webp' ? 'webp' : 'jpg';
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.${ext}`, {
      type: outputType,
      lastModified: file.lastModified,
    });
  } catch {
    // Canvas compression not supported (e.g. HEIC before conversion) — return original
    return file;
  }
}
