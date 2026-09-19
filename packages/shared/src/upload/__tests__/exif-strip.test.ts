/**
 * IMG-03 — el EXIF (y con él el GPS) no puede sobrevivir a la subida.
 *
 * La limpieza de metadatos en este paquete era un efecto colateral de
 * re-codificar en canvas, y `compressImage` se saltaba el canvas para ficheros
 * de menos de 500 KB. Resultado: las fotos pequeñas llegaban al bucket con sus
 * coordenadas dentro. Estos tests fijan las tres salidas por las que se
 * escapaban.
 */

import { describe, expect, it, vi } from 'vitest';

import { compressImage } from '../compression';
import { hasExifMetadata } from '../exif';

/** JPEG mínimo con un segmento APP1/Exif — como el que escribe un móvil. */
function jpegConExif(sizeBytes = 1024): File {
  const head = [
    0xff, 0xd8, // SOI
    0xff, 0xe1, // APP1
    0x00, 0x20, // longitud del segmento
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // 'Exif\0\0'
  ];
  const bytes = new Uint8Array(sizeBytes);
  bytes.set(head, 0);
  return new File([bytes], 'foto-del-movil.jpg', { type: 'image/jpeg' });
}

/** JPEG sin metadatos — pasa directo a datos de imagen. */
function jpegSinExif(sizeBytes = 1024): File {
  const head = [
    0xff, 0xd8, // SOI
    0xff, 0xda, // SOS — a partir de aquí ya son datos
    0x00, 0x0c,
  ];
  const bytes = new Uint8Array(sizeBytes);
  bytes.set(head, 0);
  return new File([bytes], 'captura.jpg', { type: 'image/jpeg' });
}

describe('hasExifMetadata', () => {
  it('detecta el bloque EXIF de una foto de móvil', async () => {
    await expect(hasExifMetadata(jpegConExif())).resolves.toBe(true);
  });

  it('no lo detecta cuando no lo hay', async () => {
    await expect(hasExifMetadata(jpegSinExif())).resolves.toBe(false);
  });

  it('no mira ficheros que no son JPEG', async () => {
    const png = new File([new Uint8Array(1024)], 'x.png', { type: 'image/png' });
    await expect(hasExifMetadata(png)).resolves.toBe(false);
  });

  it('ante un fichero corrupto devuelve false en vez de reventar', async () => {
    const basura = new File([new Uint8Array([1, 2, 3])], 'x.jpg', { type: 'image/jpeg' });
    await expect(hasExifMetadata(basura)).resolves.toBe(false);
  });
});

describe('compressImage — IMG-03', () => {
  /**
   * El canvas no existe en el entorno de test. Se simula lo justo para poder
   * observar SI se re-codifica o no, que es lo que decide si el EXIF muere.
   */
  function mockCanvas(anchoOriginal: number, tamanoSalida: number) {
    const convertToBlob = vi.fn(async () => new Blob([new Uint8Array(tamanoSalida)]));
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ close: vi.fn(), height: 1200, width: anchoOriginal })),
    );
    vi.stubGlobal(
      'OffscreenCanvas',
      class {
        convertToBlob = convertToBlob;
        getContext = () => ({ drawImage: vi.fn(), rotate: vi.fn(), scale: vi.fn(), translate: vi.fn() });
      },
    );
    return convertToBlob;
  }

  it('una foto pequeña CON EXIF se re-codifica — ahí muere el GPS', async () => {
    const recodificar = mockCanvas(800, 900);
    const original = jpegConExif(1024); // muy por debajo del umbral de 500 KB

    const resultado = await compressImage(original);

    expect(recodificar, 'debe pasar por canvas aunque sea pequeña').toHaveBeenCalled();
    expect(resultado).not.toBe(original);
  });

  it('una foto pequeña SIN EXIF se devuelve tal cual — no se malgasta calidad', async () => {
    const recodificar = mockCanvas(800, 900);
    const original = jpegSinExif(1024);

    const resultado = await compressImage(original);

    expect(recodificar, 'sin metadatos no hay nada que sanear').not.toHaveBeenCalled();
    expect(resultado).toBe(original);
  });

  it('si el saneado engorda el fichero, gana el saneado', async () => {
    // Re-codificar una foto pequeña casi siempre da algo MÁS grande. Antes eso
    // disparaba `blob.size >= file.size → return file`, devolviendo el EXIF.
    mockCanvas(800, 99_999);
    const original = jpegConExif(1024);

    const resultado = await compressImage(original);

    expect(resultado, 'unos KB de más valen menos que las coordenadas').not.toBe(original);
  });

  it('con stripMetadata:false se respeta el atajo de tamaño', async () => {
    const recodificar = mockCanvas(800, 900);
    const original = jpegConExif(1024);

    const resultado = await compressImage(original, { stripMetadata: false });

    expect(recodificar).not.toHaveBeenCalled();
    expect(resultado).toBe(original);
  });

  it('no toca lo que no es imagen', async () => {
    const pdf = new File([new Uint8Array(1024)], 'contrato.pdf', { type: 'application/pdf' });
    await expect(compressImage(pdf)).resolves.toBe(pdf);
  });

  it('no intenta rasterizar un SVG', async () => {
    const svg = new File([new Uint8Array(1024)], 'logo.svg', { type: 'image/svg+xml' });
    await expect(compressImage(svg)).resolves.toBe(svg);
  });
});
