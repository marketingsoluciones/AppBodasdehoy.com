import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

export const runtime = 'nodejs';

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const VERIFY_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

// Canal: 'whatsapp' si está configurado, 'sms' como fallback
const OTP_CHANNEL = process.env.TWILIO_OTP_CHANNEL || 'whatsapp';

/**
 * POST /api/auth/whatsapp-otp-send
 * Body: { phone: string, development?: string }
 *
 * Envía un OTP al número vía WhatsApp (o SMS como fallback).
 * Twilio Verify gestiona la generación, almacenamiento y expiración del código.
 * TTL por defecto: 10 minutos.
 */
export async function POST(request: NextRequest) {
  if (!ACCOUNT_SID || !AUTH_TOKEN || !VERIFY_SID) {
    console.error('[whatsapp-otp-send] Twilio env vars missing');
    return NextResponse.json(
      { detail: 'Servicio OTP no configurado.' },
      { status: 503 },
    );
  }

  let phone: string;
  let development: string;

  try {
    const body = await request.json();
    phone = (body.phone || '').trim();
    development = (body.development || 'bodasdehoy').trim();
  } catch {
    return NextResponse.json({ detail: 'Body inválido.' }, { status: 400 });
  }

  // Validación básica E.164 (+34612345678, mínimo 8 dígitos)
  if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
    return NextResponse.json(
      { detail: 'Número de teléfono inválido. Usa formato internacional: +34612345678' },
      { status: 400 },
    );
  }

  try {
    const client = twilio(ACCOUNT_SID, AUTH_TOKEN);
    const verification = await client.verify.v2
      .services(VERIFY_SID)
      .verifications.create({
        channel: OTP_CHANNEL as 'whatsapp' | 'sms',
        to: phone,
      });

    console.log(
      `[whatsapp-otp-send] sid=${verification.sid} status=${verification.status} channel=${OTP_CHANNEL} phone=${phone.slice(0, 6)}***`,
    );

    return NextResponse.json({
      channel: OTP_CHANNEL,
      development,
      expiresIn: 600, // 10 minutos
      phone,          // devolver normalizado
      status: verification.status,
      success: true,
    });
  } catch (err: any) {
    const code = err?.code;
    const message = err?.message || 'Error al enviar el código.';
    console.error(`[whatsapp-otp-send] Twilio error code=${code}:`, message);

    // Errores conocidos de Twilio
    if (code === 60_200) {
      return NextResponse.json(
        { detail: 'Número de teléfono inválido.' },
        { status: 400 },
      );
    }
    if (code === 60_203) {
      return NextResponse.json(
        { detail: 'Demasiados intentos. Espera unos minutos.' },
        { status: 429 },
      );
    }

    return NextResponse.json({ detail: message }, { status: 502 });
  }
}
