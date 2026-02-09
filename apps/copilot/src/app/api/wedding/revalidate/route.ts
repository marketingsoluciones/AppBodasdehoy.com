import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Revalidate Wedding Page
 * ==================================
 * Trigger ISR revalidation for a specific wedding page
 *
 * POST /api/wedding/revalidate
 * Body: { subdomain: string, secret: string }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subdomain, secret } = body;

    // Validate secret
    const revalidateSecret = process.env.REVALIDATE_SECRET || 'wedding-revalidate-secret';
    if (secret !== revalidateSecret) {
      return NextResponse.json(
        { error: 'Invalid secret', revalidated: false },
        { status: 401 }
      );
    }

    // Validate subdomain
    if (!subdomain || typeof subdomain !== 'string') {
      return NextResponse.json(
        { error: 'Subdomain is required', revalidated: false },
        { status: 400 }
      );
    }

    // Revalidate the wedding page
    revalidatePath(`/wedding/${subdomain}`);

    // Also revalidate the /w/ route if it exists
    revalidatePath(`/w/${subdomain}`);

    console.log(`[Revalidate] Successfully revalidated /wedding/${subdomain}`);

    return NextResponse.json({
      revalidated: true,
      subdomain,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Revalidate] Error:', error);
    return NextResponse.json(
      { error: 'Failed to revalidate', revalidated: false },
      { status: 500 }
    );
  }
}

/**
 * GET /api/wedding/revalidate
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    body: '{ subdomain: string, secret: string }',
    endpoint: 'wedding-revalidate',
    method: 'POST',
    status: 'ok',
  });
}
