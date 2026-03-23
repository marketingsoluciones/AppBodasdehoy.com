import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const getApiIaUrl = (): string =>
  process.env.PYTHON_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://api-ia.bodasdehoy.com';

/**
 * POST /api/widget-chat
 *
 * Endpoint local para el widget de chat web.
 * Intenta reenviar a api-ia /api/messages/web/send.
 * Si api-ia no tiene el endpoint aún (404/5xx), devuelve una respuesta
 * automática temporal para que el widget funcione como demo.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { development, visitorId, text, pageContext } = body;

    if (!text || !development) {
      return NextResponse.json(
        { error: 'text y development son requeridos' },
        { status: 400 },
      );
    }

    // Intentar reenviar a api-ia
    try {
      const apiUrl = `${getApiIaUrl()}/api/messages/web/send`;
      const res = await fetch(apiUrl, {
        body: JSON.stringify({ development, pageContext, text, visitorId }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        signal: AbortSignal.timeout(10_000),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // api-ia no disponible — usar respuesta temporal
    }

    // Respuesta temporal automática (demo mode)
    const pagina = pageContext?.title || pageContext?.url || '';
    const reply = generarRespuestaDemo(text, pagina, development);

    return NextResponse.json({
      messageId: `demo_${Date.now()}`,
      reply,
      source: 'local-demo',
    });
  } catch {
    return NextResponse.json(
      { error: 'Error procesando mensaje' },
      { status: 500 },
    );
  }
}

function generarRespuestaDemo(texto: string, pagina: string, development: string): string {
  const lower = texto.toLowerCase();

  if (lower.includes('hola') || lower.includes('buenos') || lower.includes('buenas')) {
    return `Hola! Gracias por contactarnos${pagina ? ` desde "${pagina}"` : ''}. ¿En qué podemos ayudarte?`;
  }

  if (lower.includes('precio') || lower.includes('costo') || lower.includes('cuánto')) {
    return 'Para información sobre precios y paquetes, un asesor se pondrá en contacto contigo pronto. ¿Puedes dejarnos tu email o número de teléfono?';
  }

  if (lower.includes('horario') || lower.includes('hora') || lower.includes('disponib')) {
    return 'Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00, y sábados de 10:00 a 14:00.';
  }

  if (lower.includes('gracias') || lower.includes('thanks')) {
    return 'De nada! Si necesitas algo más, aquí estamos.';
  }

  return `Gracias por tu mensaje. Un asesor revisará tu consulta y te responderá pronto${pagina ? ` (vemos que escribes desde "${pagina}")` : ''}. ¿Hay algo más en lo que podamos ayudarte?`;
}
