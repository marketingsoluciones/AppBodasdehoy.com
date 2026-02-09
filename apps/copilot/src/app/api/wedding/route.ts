/**
 * Wedding API - Main CRUD Endpoint
 * =================================
 * Handles wedding data persistence
 *
 * IMPORTANTE: Esta API solo trabaja con datos reales del backend.
 * Si el backend no está disponible, retorna un error claro.
 * NO usa datos locales/falsos como fallback.
 *
 * POST /api/wedding - Create new wedding
 * GET /api/wedding?id=xxx - Get wedding by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import type { WeddingWebData } from '@/components/wedding-site/types';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8030';

/**
 * GET /api/wedding?id=xxx - Get wedding by ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Wedding ID is required', success: false },
        { status: 400 }
      );
    }

    // Get from backend - NO fallback
    try {
      const backendResponse = await fetch(`${BACKEND_URL}/api/wedding/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
        signal: AbortSignal.timeout(10_000), // 10 segundos
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        if (data.success && data.wedding) {
          return NextResponse.json({
            source: 'backend',
            success: true,
            wedding: data.wedding,
          });
        }
      }

      // Backend responded but with an error
      if (!backendResponse.ok) {
        const errorData = await backendResponse.json().catch(() => ({}));
        return NextResponse.json(
          {
            error: errorData.detail || errorData.error || 'Wedding not found',
            source: 'backend',
            success: false
          },
          { status: backendResponse.status }
        );
      }
    } catch (error) {
      console.error('Backend not available:', error);
      return NextResponse.json(
        {
          error: 'El servicio no está disponible. Por favor, intenta más tarde.',
          success: false,
          unavailable: true
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Wedding not found', success: false },
      { status: 404 }
    );

  } catch (error) {
    console.error('Error getting wedding:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wedding - Create or update wedding
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const wedding: WeddingWebData = body.wedding;

    if (!wedding || !wedding.id) {
      return NextResponse.json(
        { error: 'Wedding data with ID is required', success: false },
        { status: 400 }
      );
    }

    // Update timestamps
    const now = new Date().toISOString();
    if (!wedding.createdAt) {
      wedding.createdAt = now;
    }
    wedding.updatedAt = now;

    // Save to backend - NO fallback
    try {
      const backendResponse = await fetch(`${BACKEND_URL}/api/wedding`, {
        body: JSON.stringify({ wedding }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        signal: AbortSignal.timeout(10_000), // 10 segundos
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        if (data.success) {
          return NextResponse.json({
            source: 'backend',
            success: true,
            wedding: data.wedding || wedding,
          });
        }
      }

      // Backend responded but with an error
      if (!backendResponse.ok) {
        const errorData = await backendResponse.json().catch(() => ({}));
        return NextResponse.json(
          {
            error: errorData.detail || errorData.error || 'Error saving wedding',
            source: 'backend',
            success: false
          },
          { status: backendResponse.status }
        );
      }
    } catch (error) {
      console.error('Backend not available:', error);
      return NextResponse.json(
        {
          error: 'El servicio no está disponible. Por favor, intenta más tarde.',
          success: false,
          unavailable: true
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Error saving wedding', success: false },
      { status: 500 }
    );

  } catch (error) {
    console.error('Error saving wedding:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/wedding - Update existing wedding
 */
export async function PUT(request: NextRequest) {
  // Delegate to POST for upsert behavior
  return POST(request);
}

/**
 * DELETE /api/wedding?id=xxx - Delete wedding
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Wedding ID is required', success: false },
        { status: 400 }
      );
    }

    // Delete from backend - NO fallback
    try {
      const backendResponse = await fetch(`${BACKEND_URL}/api/wedding/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'DELETE',
        signal: AbortSignal.timeout(10_000), // 10 segundos
      });

      if (backendResponse.ok) {
        return NextResponse.json({
          message: 'Wedding deleted successfully',
          source: 'backend',
          success: true,
        });
      }

      // Backend responded but with an error
      if (!backendResponse.ok) {
        const errorData = await backendResponse.json().catch(() => ({}));
        return NextResponse.json(
          {
            error: errorData.detail || errorData.error || 'Error deleting wedding',
            source: 'backend',
            success: false
          },
          { status: backendResponse.status }
        );
      }
    } catch (error) {
      console.error('Backend not available:', error);
      return NextResponse.json(
        {
          error: 'El servicio no está disponible. Por favor, intenta más tarde.',
          success: false,
          unavailable: true
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Error deleting wedding', success: false },
      { status: 500 }
    );

  } catch (error) {
    console.error('Error deleting wedding:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
