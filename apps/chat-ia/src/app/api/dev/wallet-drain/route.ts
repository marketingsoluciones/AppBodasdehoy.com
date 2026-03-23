/**
 * Dev-only proxy: POST /api/dev/wallet-drain
 *
 * Ajusta el saldo de un usuario via api-ia (admin endpoint).
 * Solo disponible en development. En producción devuelve 404.
 *
 * Body: { user_id: string; amount: number; description?: string }
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    return NextResponse.json({ error: 'ADMIN_API_KEY not configured' }, { status: 500 });
  }

  const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.PYTHON_BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json({ error: 'BACKEND_INTERNAL_URL not configured' }, { status: 500 });
  }

  let body: { amount?: number; description?: string, user_id?: string; };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { user_id, amount, description } = body;
  if (!user_id || amount === undefined) {
    return NextResponse.json({ error: 'user_id and amount are required' }, { status: 400 });
  }

  const upstream = `${backendUrl}/api/wallet/adjustment`;

  try {
    const response = await fetch(upstream, {
      body: JSON.stringify({
        amount,
        description: description ?? '[DEV] Ajuste manual desde DevTools',
        user_id,
      }),
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey,
      },
      method: 'POST',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.detail ?? `api-ia returned ${response.status}`, raw: data },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}
