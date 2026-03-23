/**
 * POST /api/admin/seed-wedding-kb
 *
 * Crea automáticamente la Base de Conocimiento "Presupuesto de Boda" para un
 * usuario (wedding planner / developer) cuando se da de alta en la plataforma.
 *
 * Esta ruta es llamada desde api2 durante el onboarding de un nuevo developer
 * del sector bodas, o puede ejecutarse manualmente con el script de seed.
 *
 * Seguridad: requiere header X-Admin-Key igual a ADMIN_API_KEY del entorno.
 *
 * Body: { userId: string }
 * Response: { kbId: string; created: boolean; message: string }
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';

import { serverDB } from '@/database/server';
import { KnowledgeBaseModel } from '@/database/models/knowledgeBase';
import { FileModel } from '@/database/models/file';

export const runtime = 'nodejs';

const KB_NAME = 'Presupuesto de Boda — Plantilla';
const KB_DESCRIPTION =
  'Distribución porcentual por categoría, multiplicadores por país y partidas habituales para generar presupuestos de boda adaptados.';

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Autenticación admin ──────────────────────────────────────────────────
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    return NextResponse.json({ error: 'ADMIN_API_KEY not configured' }, { status: 500 });
  }
  const providedKey = req.headers.get('x-admin-key');
  if (providedKey !== adminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Validar body ─────────────────────────────────────────────────────────
  let userId: string;
  try {
    const body = await req.json();
    if (!body?.userId) throw new Error('missing userId');
    userId = body.userId as string;
  } catch {
    return NextResponse.json({ error: 'Body must be { userId: string }' }, { status: 400 });
  }

  try {
    const db = serverDB;
    const kbModel = new KnowledgeBaseModel(db, userId);
    const fileModel = new FileModel(db, userId);

    // ── ¿Ya existe la KB? (idempotente) ─────────────────────────────────
    const existing = await kbModel.query();
    const alreadyExists = existing.some((kb) => kb.name === KB_NAME);
    if (alreadyExists) {
      return NextResponse.json({ created: false, message: 'KB already exists for this user' });
    }

    // ── Leer plantilla markdown ──────────────────────────────────────────
    const templatePath = path.join(
      process.cwd(),
      'src/scripts/kb-seed/wedding-budget-template.md',
    );
    let templateContent: string;
    try {
      templateContent = await readFile(templatePath, 'utf-8');
    } catch {
      // Fallback inline si el archivo no está disponible (e.g. build de producción)
      templateContent = WEDDING_BUDGET_TEMPLATE_INLINE;
    }

    // ── Crear KB ────────────────────────────────────────────────────────
    const kb = await kbModel.create({
      avatar: '💍',
      description: KB_DESCRIPTION,
      name: KB_NAME,
    });

    if (!kb?.id) {
      return NextResponse.json({ error: 'Failed to create KB' }, { status: 500 });
    }

    // ── Crear file record con el contenido de la plantilla ───────────────
    // El contenido se almacena como texto plano; el pipeline de embeddings
    // lo procesará en background la primera vez que sea necesario para RAG.
    const fileName = 'wedding-budget-template.md';
    const fileSize = Buffer.byteLength(templateContent, 'utf-8');

    const fileRecord = await fileModel.create({
      fileType: 'text/markdown',
      // archivo interno, sin URL pública
// El contenido se guarda en el campo de metadata para que el chunk service lo procese
metadata: { content: templateContent, source: 'system-seed' },
      

name: fileName,
      

size: fileSize, 
      
      url: '',
    });

    if (fileRecord?.id) {
      // Asociar el file a la KB
      await kbModel.addFilesToKnowledgeBase(kb.id, [fileRecord.id]);
    }

    return NextResponse.json({
      created: true,
      fileId: fileRecord?.id,
      kbId: kb.id,
      message: `KB "${KB_NAME}" creada para el usuario ${userId}`,
    });
  } catch (err: any) {
    console.error('[seed-wedding-kb] Error:', err);
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}

// ── Fallback inline (producción sin acceso a src/scripts/) ─────────────────
const WEDDING_BUDGET_TEMPLATE_INLINE = `
# Plantilla de Presupuesto de Boda

## Distribución porcentual por categoría

| Categoría | % del presupuesto |
|---|---|
| Venue / Finca | 20 – 25 % |
| Catering (comida y bebida) | 25 – 30 % |
| Fotografía y vídeo | 10 – 12 % |
| Música y entretenimiento | 6 – 8 % |
| Flores y decoración | 8 – 10 % |
| Vestuario y belleza | 8 – 10 % |
| Papelería e invitaciones | 2 – 3 % |
| Transporte | 2 – 3 % |
| Banquete de ensayo / post-boda | 2 – 3 % |
| Imprevistos y extras | 3 – 5 % |

## Multiplicadores por país

| País | Multiplicador |
|---|---|
| España | 1.0 |
| México | 0.55 |
| Colombia | 0.45 |
| Argentina | 0.40 |
| Chile | 0.65 |
| Perú | 0.50 |
| Estados Unidos | 1.8 – 2.2 |
| Reino Unido | 1.7 |
| Francia | 1.5 |
| Italia | 1.3 |
| Portugal | 0.85 |

## Lógica de generación

Cuando el planner indica el presupuesto total:
1. Calcular importe de cada categoría: presupuesto_total × porcentaje
2. Ajustar por país usando el multiplicador (referencia orientativa)
3. Número de invitados: catering y transporte escalan directamente
4. Reservar siempre un 3-5 % para imprevistos
`.trim();
