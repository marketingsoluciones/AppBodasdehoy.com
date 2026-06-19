/**
 * EXIF orientation reader + auto-rotate.
 *
 * Por qué: el iPhone guarda fotos con dimensiones físicas siempre orientadas
 * a paisaje y un flag EXIF "Orientation" que dice "rótame al mostrar". Si
 * subes la foto sin tratar y luego la renderizas con <img src>, el browser
 * SÍ respeta el flag. Pero si pasas la foto por Canvas (compressImage,
 * resizeImage) el flag se PIERDE → la imagen sale al revés.
 *
 * Solución: leer el EXIF antes de canvas, y rotar el canvas según orientation.
 *
 * Valores EXIF orientation:
 *   1 = sin rotación (default)
 *   3 = 180°
 *   6 = 90° CW
 *   8 = 90° CCW
 *   (2, 4, 5, 7 = espejados, raros)
 *
 * Sin lib externa. Lee solo los primeros 64KB del archivo (basta para EXIF).
 */

export type ExifOrientation = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * Lee el flag EXIF Orientation de un JPEG.
 * Devuelve 1 (no rotar) si no es JPEG, no hay EXIF, o falla la lectura.
 */
export async function readExifOrientation(file: File): Promise<ExifOrientation> {
  if (!file.type.includes('jpeg') && !file.name.toLowerCase().match(/\.(jpe?g)$/)) {
    return 1;
  }
  try {
    const slice = await file.slice(0, 64 * 1024).arrayBuffer();
    const view = new DataView(slice);

    // JPEG empieza con FFD8
    if (view.getUint16(0) !== 0xffd8) return 1;

    let offset = 2;
    const length = view.byteLength;

    while (offset < length) {
      if (view.getUint16(offset) === 0xffe1) {
        // APP1 marker (EXIF)
        // Saltar 2 bytes (marker) + 2 bytes (size) = 4
        const exifStart = offset + 4;
        // 'Exif\0\0' = 6 bytes
        if (view.getUint32(exifStart) !== 0x45786966) return 1;
        const tiffStart = exifStart + 6;
        const little = view.getUint16(tiffStart) === 0x4949;
        const ifdOffset = view.getUint32(tiffStart + 4, little);
        const ifdStart = tiffStart + ifdOffset;
        const tagCount = view.getUint16(ifdStart, little);

        for (let i = 0; i < tagCount; i += 1) {
          const entry = ifdStart + 2 + i * 12;
          if (view.getUint16(entry, little) === 0x0112) {
            // Orientation tag
            const value = view.getUint16(entry + 8, little);
            if (value >= 1 && value <= 8) return value as ExifOrientation;
            return 1;
          }
        }
        return 1;
      }
      // Saltar al siguiente marker
      offset += 2 + view.getUint16(offset + 2);
    }
  } catch {
    /* silent — devolver 1 */
  }
  return 1;
}

/**
 * Aplica una rotación EXIF a un canvas. Útil cuando vas a re-codificar.
 *
 * Pasa el bitmap original; la función crea un canvas del tamaño correcto
 * (intercambiando width/height si la orientación es 6/8) y dibuja rotado.
 */
export function rotateForOrientation(
  bitmap: ImageBitmap | HTMLImageElement,
  orientation: ExifOrientation,
  ctx2d: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  switch (orientation) {
    case 2:
      ctx2d.translate(width, 0);
      ctx2d.scale(-1, 1);
      break;
    case 3:
      ctx2d.translate(width, height);
      ctx2d.rotate(Math.PI);
      break;
    case 4:
      ctx2d.translate(0, height);
      ctx2d.scale(1, -1);
      break;
    case 5:
      ctx2d.rotate(0.5 * Math.PI);
      ctx2d.scale(1, -1);
      break;
    case 6:
      ctx2d.rotate(0.5 * Math.PI);
      ctx2d.translate(0, -height);
      break;
    case 7:
      ctx2d.rotate(0.5 * Math.PI);
      ctx2d.translate(width, -height);
      ctx2d.scale(-1, 1);
      break;
    case 8:
      ctx2d.rotate(-0.5 * Math.PI);
      ctx2d.translate(-width, 0);
      break;
    default:
      break; // 1 = no-op
  }
  ctx2d.drawImage(bitmap as CanvasImageSource, 0, 0, width, height);
}

/**
 * Helper: ¿esta orientación implica intercambiar width/height al renderizar?
 */
export function isOrientationSwapped(orientation: ExifOrientation): boolean {
  return orientation >= 5 && orientation <= 8;
}
