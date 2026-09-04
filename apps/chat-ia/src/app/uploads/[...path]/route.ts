/**
 * Servidor de imágenes subidas — /uploads/<...>
 * ==============================================
 * `next start` NO sirve ficheros añadidos a `public/` en runtime (el set de estáticos
 * se fija en build). El endpoint /api/upload escribe en `public/uploads/wedding/` pero
 * esas URLs devolvían HTML (no se servían). Esta ruta pública las lee de disco y las
 * sirve con el content-type correcto.
 *
 * Va FUERA de /api a propósito: el middleware (allow-list) no matchea /uploads, así que
 * estas imágenes NO pasan por el gate de auth (son públicas, como cualquier estático).
 */
import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import { NextRequest, NextResponse } from 'next/server';

const ROOT = path.join(process.cwd(), 'public', 'uploads');

const CONTENT_TYPES: Record<string, string> = {
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

export async function GET(_req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await ctx.params;
  // Anti path-traversal: nos quedamos solo con el basename de cada segmento.
  const rel = (parts || []).map((p) => path.basename(p)).join('/');
  const filepath = path.join(ROOT, rel);

  if (!filepath.startsWith(ROOT + path.sep) || !existsSync(filepath)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const info = await stat(filepath);
  if (!info.isFile()) {
    return new NextResponse('Not found', { status: 404 });
  }

  const ext = path.extname(filepath).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
  const buffer = await readFile(filepath);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Type': contentType,
    },
  });
}
