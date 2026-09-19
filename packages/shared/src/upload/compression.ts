/**
 * Client-side image compression using Canvas API.
 * No external dependencies required.
 *
 * Lee EXIF orientation antes de canvas y rota — sin esto, fotos verticales
 * del iPhone (EXIF orientation 6/8) salían al revés tras compresión.
 */

import {
  hasExifMetadata,
  readExifOrientation,
  rotateForOrientation,
  isOrientationSwapped,
} from './exif';

export interface CompressImageOptions {
  /** Max width in pixels. Defaults to 1920. */
  maxWidth?: number;
  /** JPEG/WebP quality 0-1. Defaults to 0.85. */
  quality?: number;
  /** Output format. Defaults to 'image/jpeg'. */
  outputType?: 'image/jpeg' | 'image/webp';
  /** Skip compression if file is already under this size in bytes. Defaults to 500KB. */
  skipUnderSize?: number;
  /** Respect EXIF orientation. Defaults to true. */
  respectExif?: boolean;
  /**
   * Pasar por canvas también cuando el fichero es pequeño, si lleva EXIF.
   * Por defecto true: re-codificar es lo que borra los metadatos, y una foto
   * pequeña con GPS dentro es igual de sensible que una grande.
   *
   * Ponerlo a false solo cuando el EXIF se quiera conservar a propósito y el
   * destino no sea público.
   */
  stripMetadata?: boolean;
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
    respectExif = true,
    stripMetadata = true,
  } = options;

  if (!file.type.startsWith('image/')) return file;

  // Skip non-rasterizable formats (SVG, etc.)
  if (file.type === 'image/svg+xml') return file;

  // Fichero pequeño: se devolvía tal cual, y con él su EXIF (IMG-03). El atajo
  // sigue existiendo —re-codificar cuesta calidad y CPU— pero ya no se aplica a
  // una foto que lleva metadatos dentro: esa pasa por canvas para limpiarlos.
  //
  // `sanear` viaja hasta el final de la función porque hay dos atajos más abajo
  // que también devolvían el fichero original; con metadatos dentro, ninguno de
  // los tres puede tomarse.
  const esPequeno = file.size <= skipUnderSize;
  const sanear = stripMetadata && (await hasExifMetadata(file));
  if (esPequeno && !sanear) return file;

  try {
    const orientation = respectExif ? await readExifOrientation(file) : 1;
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    // No resize needed and already small
    if (width <= maxWidth && esPequeno && !sanear) {
      bitmap.close();
      return file;
    }

    const scale = width > maxWidth ? maxWidth / width : 1;
    const sourceWidth = Math.round(width * scale);
    const sourceHeight = Math.round(height * scale);
    // Si EXIF orientation rota 90°, el canvas final lleva w/h intercambiados.
    const swap = isOrientationSwapped(orientation);
    const canvasWidth = swap ? sourceHeight : sourceWidth;
    const canvasHeight = swap ? sourceWidth : sourceHeight;

    const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }

    if (orientation !== 1) {
      rotateForOrientation(bitmap, orientation, ctx, sourceWidth, sourceHeight);
    } else {
      ctx.drawImage(bitmap, 0, 0, sourceWidth, sourceHeight);
    }
    bitmap.close();

    const blob = await canvas.convertToBlob({ type: outputType, quality });

    // Only use compressed version if it's actually smaller.
    // Salvo cuando el objetivo era sanear: re-codificar una foto pequeña suele
    // dar un fichero MÁS grande, y devolver el original aquí sería devolver el
    // EXIF que veníamos a quitar. Unos KB de más valen menos que el GPS.
    if (blob.size >= file.size && !sanear) return file;

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
