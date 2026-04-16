import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

const WIDGET_MSG_LIMIT = 10;

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
    // Rate limit via cookie
    const widMc = parseInt(request.cookies.get('wid_mc')?.value || '0', 10);
    if (widMc >= WIDGET_MSG_LIMIT) {
      return NextResponse.json(
        { error: 'Has alcanzado el límite de mensajes. Regístrate para continuar.', limitReached: true },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { development, visitorId, text, pageContext, leadData } = body;

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
        body: JSON.stringify({ development, leadData, pageContext, text, visitorId }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        signal: AbortSignal.timeout(30_000),
      });

      if (res.ok) {
        const data = await res.json();
        const resp = NextResponse.json(data);
        resp.cookies.set('wid_mc', String(widMc + 1), { maxAge: 86_400, path: '/', sameSite: 'lax' });
        return resp;
      }
    } catch {
      // api-ia no disponible — usar respuesta temporal
    }

    // Respuesta temporal automática (demo mode)
    const pagina = pageContext?.title || pageContext?.url || '';
    const visitorName = leadData?.name && leadData.name !== 'Visitante' ? leadData.name : '';
    const reply = generarRespuestaDemo(text, pagina, development, visitorName);

    const demoResp = NextResponse.json({
      messageId: `demo_${Date.now()}`,
      reply,
      source: 'local-demo',
    });
    demoResp.cookies.set('wid_mc', String(widMc + 1), { maxAge: 86_400, path: '/', sameSite: 'lax' });
    return demoResp;
  } catch {
    return NextResponse.json(
      { error: 'Error procesando mensaje' },
      { status: 500 },
    );
  }
}

function generarRespuestaDemo(texto: string, pagina: string, development: string, nombre?: string): string {
  const lower = texto.toLowerCase();
  const saludo = nombre ? `, ${nombre}` : '';

  if (lower.includes('hola') || lower.includes('buenos') || lower.includes('buenas')) {
    return `¡Hola${saludo}! 👋 Gracias por contactarnos${pagina ? ` desde "${pagina}"` : ''}. Estoy aquí para ayudarte a organizar el día perfecto. ¿En qué puedo ayudarte?`;
  }

  if (lower.includes('precio') || lower.includes('costo') || lower.includes('cuánto') || lower.includes('tarifa')) {
    return `¡Claro${saludo}! Tenemos diferentes paquetes adaptados a cada tipo de evento. Un asesor personalizado revisará tu consulta y te enviará un presupuesto detallado muy pronto. ¿Tienes ya una fecha aproximada en mente?`;
  }

  if (lower.includes('disponib') || lower.includes('fecha') || lower.includes('horario') || lower.includes('hora')) {
    return `Para consultar disponibilidad${saludo ? ' ' + saludo : ''}, necesito que nos indiques la fecha aproximada de tu evento. Nuestro horario de atención es **lunes a viernes de 9:00 a 18:00** y **sábados de 10:00 a 14:00**.`;
  }

  if (lower.includes('foto') || lower.includes('espacio') || lower.includes('sala') || lower.includes('instalacion')) {
    return `¡Tenemos espacios preciosos${saludo}! 📸 Puedes ver fotos y videos de todos nuestros salones en nuestra web. ¿Te gustaría concertar una visita presencial para conocer el espacio en persona?`;
  }

  if (lower.includes('boda') || lower.includes('matrimonio') || lower.includes('casam')) {
    return `¡Felicidades${saludo}! 💒 Será un placer acompañarte en este día tan especial. Ofrecemos paquetes integrales para bodas de todos los estilos. ¿Cuántos invitados estás pensando?`;
  }

  if (lower.includes('gracias') || lower.includes('thanks')) {
    return `¡De nada${saludo}! 😊 Si necesitas algo más, aquí estoy para ayudarte. ¡Que tengas un día maravilloso!`;
  }

  return `Gracias por tu mensaje${saludo}. 🌸 Un asesor especializado revisará tu consulta y te responderá a la mayor brevedad${pagina ? ` (te escribes desde "${pagina}")` : ''}. ¿Hay algo más en lo que pueda ayudarte mientras tanto?`;
}
