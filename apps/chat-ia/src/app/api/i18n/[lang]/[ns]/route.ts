import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string; ns: string }> }
) {
  const { lang, ns } = await params;

  // Validar que solo contiene caracteres seguros
  if (!/^[\w-]+$/.test(lang) || !/^[\w-]+$/.test(ns)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  try {
    const localesDir = path.join(process.cwd(), 'locales', lang);
    const filePath = path.join(localesDir, ns + '.json');
    const content = await readFile(filePath, 'utf-8');
    return new Response(content, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    // Namespace not found for this language - return empty object
    return NextResponse.json({});
  }
}
