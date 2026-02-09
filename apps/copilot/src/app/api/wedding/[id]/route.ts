/**
 * Wedding API - Dynamic ID Endpoint
 * ==================================
 * Handles individual wedding operations
 *
 * IMPORTANTE: Esta API solo trabaja con datos reales del backend.
 * Si el backend no está disponible, retorna un error claro.
 * NO usa datos locales/falsos como fallback.
 *
 * GET /api/wedding/[id] - Get wedding by ID
 * PUT /api/wedding/[id] - Update wedding
 * DELETE /api/wedding/[id] - Delete wedding
 */

import { NextRequest, NextResponse } from 'next/server';
import type { WeddingWebData } from '@/components/wedding-site/types';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8030';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/wedding/[id] - Get wedding by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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
 * PUT /api/wedding/[id] - Update wedding
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const weddingData: Partial<WeddingWebData> = body.wedding || body;

    if (!id) {
      return NextResponse.json(
        { error: 'Wedding ID is required', success: false },
        { status: 400 }
      );
    }

    // Prepare wedding data
    const updatedWedding: WeddingWebData = {
      ...weddingData,
      id, // Ensure ID matches route param
      updatedAt: new Date().toISOString(),
    } as WeddingWebData;

    if (!updatedWedding.createdAt) {
      updatedWedding.createdAt = new Date().toISOString();
    }

    // Save to backend - NO fallback
    try {
      const backendResponse = await fetch(`${BACKEND_URL}/api/wedding/${id}`, {
        body: JSON.stringify({ wedding: updatedWedding }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PUT',
        signal: AbortSignal.timeout(10_000), // 10 segundos
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        if (data.success) {
          return NextResponse.json({
            source: 'backend',
            success: true,
            wedding: data.wedding || updatedWedding,
          });
        }
      }

      // Backend responded but with an error
      if (!backendResponse.ok) {
        const errorData = await backendResponse.json().catch(() => ({}));
        return NextResponse.json(
          {
            error: errorData.detail || errorData.error || 'Error updating wedding',
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
      { error: 'Error updating wedding', success: false },
      { status: 500 }
    );

  } catch (error) {
    console.error('Error updating wedding:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/wedding/[id] - Delete wedding
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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
