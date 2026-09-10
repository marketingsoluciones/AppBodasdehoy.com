import { NextRequest, NextResponse } from 'next/server';
import { resolveServerBackendOrigin } from '@/const/backendEndpoints';
import { genOtp, setOtp } from '../_otpStore';

export const runtime = 'nodejs';

// api-ia es el orquestador de WhatsApp (envío real por el gateway QR conectado del
// whitelabel / WAB). Antes esto iba por Twilio Verify; ahora usamos NUESTRO WhatsApp.
const API_IA_ORIGIN = resolveServerBackendOrigin();

/**
 * POST /api/auth/whatsapp-otp-send
 * Body: { phone: string, development?: string }
 *
 * Genera un código de 6 dígitos, lo guarda (TTL 10 min) y lo envía por WhatsApp
 * usando el WhatsApp del whitelabel (gateway conectado) vía api-ia:
 *   POST {api-ia}/api/whatsapp/messages/send?development={dev}  { phone_number, content }
 * Sin emisor explícito → sale por el número por defecto del whitelabel.
 */
export async function POST(request: NextRequest) {
  let phone: string;
  let development: string;

  try {
    const body = await request.json();
    phone = (body.phone || '').trim();
    development = (body.development || 'bodasdehoy').trim();
  } catch {
    return NextResponse.json({ detail: 'Body inválido.' }, { status: 400 });
  }

  // Validación E.164 (+34612345678, mínimo 8 dígitos)
  if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
    return NextResponse.json(
      { detail: 'Número de teléfono inválido. Usa formato internacional: +34612345678' },
      { status: 400 },
    );
  }

  const code = genOtp();
  setOtp(phone, code);

  const content =
    `🔐 Tu código de acceso a Bodas de Hoy es: *${code}*\n\n` +
    `Caduca en 10 minutos. No lo compartas con nadie.`;

  try {
    const res = await fetch(
      `${API_IA_ORIGIN}/api/whatsapp/messages/send?development=${encodeURIComponent(development)}`,
      {
        body: JSON.stringify({ content, phone_number: phone }),
        headers: { 'Content-Type': 'application/json', 'X-Development': development },
        method: 'POST',
        signal: AbortSignal.timeout(15_000),
      },
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.success === false) {
      console.error(
        `[whatsapp-otp-send] api-ia send falló status=${res.status}:`,
        JSON.stringify(data).slice(0, 200),
      );
      return NextResponse.json(
        { detail: data?.detail || data?.error || 'No se pudo enviar el código por WhatsApp.' },
        { status: 502 },
      );
    }

    console.log(`[whatsapp-otp-send] enviado phone=${phone.slice(0, 6)}*** dev=${development}`);

    return NextResponse.json({
      channel: 'whatsapp',
      development,
      expiresIn: 600, // 10 minutos
      phone,          // normalizado
      success: true,
    });
  } catch (err: any) {
    console.error('[whatsapp-otp-send] error de red al enviar:', err?.message || err);
    return NextResponse.json(
      { detail: 'Error al enviar el código por WhatsApp.' },
      { status: 502 },
    );
  }
}
