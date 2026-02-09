import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Publish Wedding Web
 * ==============================
 * Publish or unpublish a wedding web usando GraphQL
 *
 * POST /api/wedding/publish
 * Body: { weddingWebId: string, action?: 'publish' }
 * 
 * NOTA: Este endpoint hace proxy a la mutation GraphQL PUBLISH_WEDDING_WEB
 */

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 
  process.env.NEXT_PUBLIC_BACKEND_URL 
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/graphql`
    : 'http://localhost:8030/graphql';

const PUBLISH_WEDDING_WEB_MUTATION = `
  mutation PublishWeddingWeb($weddingWebId: String!) {
    publishWeddingWeb(weddingWebId: $weddingWebId) {
      success
      weddingWeb {
        status
        subdomain
        publishedAt
      }
      publicUrl
      errors {
        field
        message
        code
      }
    }
  }
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weddingWebId, action = 'publish' } = body;

    // Validate inputs
    if (!weddingWebId) {
      return NextResponse.json(
        { error: 'Wedding Web ID is required', success: false },
        { status: 400 }
      );
    }

    if (action === 'publish') {
      // Obtener development y token de headers
      const development = request.headers.get('x-development') || 'bodasdehoy';
      const authToken = request.headers.get('authorization') || 
        request.cookies.get('jwt_token')?.value;

      // Llamar a GraphQL mutation
      const response = await fetch(GRAPHQL_ENDPOINT, {
        body: JSON.stringify({
          query: PUBLISH_WEDDING_WEB_MUTATION,
          variables: { weddingWebId },
        }),
        headers: {
          'Content-Type': 'application/json',
          'X-Development': development,
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
        method: 'POST',
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Error calling GraphQL API', success: false },
          { status: response.status }
        );
      }

      const data = await response.json();

      if (data.errors) {
        return NextResponse.json(
          { 
            error: data.errors[0]?.message || 'GraphQL error', 
            errors: data.errors,
            success: false,
          },
          { status: 400 }
        );
      }

      const result = data.data?.publishWeddingWeb;

      if (!result?.success) {
        return NextResponse.json(
          { 
            error: result?.errors?.[0]?.message || 'Failed to publish', 
            errors: result?.errors,
            success: false,
          },
          { status: 400 }
        );
      }

      const publicUrl = result.publicUrl || 
        (result.weddingWeb?.subdomain 
          ? `https://${result.weddingWeb.subdomain}.bodasdehoy.com`
          : undefined);

      return NextResponse.json({
        publishedAt: result.weddingWeb?.publishedAt || new Date().toISOString(),
        status: result.weddingWeb?.status,
        subdomain: result.weddingWeb?.subdomain,
        success: true,
        url: publicUrl,
      });
    }

    // Unpublish no está en la documentación GraphQL, pero podemos retornar error
    return NextResponse.json(
      { error: 'Unpublish action not supported via GraphQL. Use mutation directly.', success: false },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Publish] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

/**
 * GET /api/wedding/publish?eventId=xxx
 * Check publish status usando GraphQL
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  if (!eventId) {
    return NextResponse.json(
      { error: 'Event ID is required' },
      { status: 400 }
    );
  }

  const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 
    process.env.NEXT_PUBLIC_BACKEND_URL 
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/graphql`
      : 'http://localhost:8030/graphql';

  const GET_WEDDING_WEB_QUERY = `
    query GetWeddingWeb($eventId: String!) {
      getWeddingWeb(eventId: $eventId) {
        success
        weddingWeb {
          weddingWebId
          status
          subdomain
          publishedAt
        }
        errors {
          field
          message
          code
        }
      }
    }
  `;

  try {
    const development = request.headers.get('x-development') || 'bodasdehoy';
    const authToken = request.headers.get('authorization') || 
      request.cookies.get('jwt_token')?.value;

    const response = await fetch(GRAPHQL_ENDPOINT, {
      body: JSON.stringify({
        query: GET_WEDDING_WEB_QUERY,
        variables: { eventId },
      }),
      headers: {
        'Content-Type': 'application/json',
        'X-Development': development,
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
      method: 'POST',
    });

    if (!response.ok) {
      return NextResponse.json({
        eventId,
        published: false,
      });
    }

    const data = await response.json();
    const weddingWeb = data.data?.getWeddingWeb?.weddingWeb;

    if (!weddingWeb || weddingWeb.status !== 'PUBLISHED') {
      return NextResponse.json({
        eventId,
        published: false,
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bodasdehoy.com';
    const url = weddingWeb.subdomain 
      ? `https://${weddingWeb.subdomain}.bodasdehoy.com`
      : `${baseUrl}/wedding/${weddingWeb.subdomain}`;

    return NextResponse.json({
      eventId,
      published: true,
      publishedAt: weddingWeb.publishedAt,
      subdomain: weddingWeb.subdomain,
      url,
    });
  } catch (error) {
    console.error('[Get Publish Status] Error:', error);
    return NextResponse.json({
      eventId,
      published: false,
    });
  }
}
