import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { SignJWT } from 'jose';

export const runtime = 'nodejs';

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const VERIFY_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

const JWT_SECRET =
  process.env.MCP_JWT_SECRET ||
  process.env.API2_JWT_SECRET ||
  process.env.JWT_SECRET ||
  'bodasdehoy-secret-key';
// TTL del token: 7 días (igual que el resto de tokens del sistema)
const JWT_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * POST /api/auth/whatsapp-otp-verify
 * Body: { phone: string, code: string, development?: string }
 *
 * Verifica el OTP con Twilio y devuelve un JWT compatible con MCP/api-ia.
 * Mismo formato de respuesta que /api/auth/firebase-login para que el cliente
 * pueda usar saveSession() sin cambios.
 */
export async function POST(request: NextRequest) {
  if (!ACCOUNT_SID || !AUTH_TOKEN || !VERIFY_SID) {
    return NextResponse.json(
      { detail: 'Servicio OTP no configurado.' },
      { status: 503 },
    );
  }

  let phone: string;
  let code: string;
  let development: string;

  try {
    const body = await request.json();
    phone = (body.phone || '').trim();
    code = (body.code || '').trim().replaceAll(/\s/g, '');
    development = (body.development || 'bodasdehoy').trim();
  } catch {
    return NextResponse.json({ detail: 'Body inválido.' }, { status: 400 });
  }

  if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
    return NextResponse.json({ detail: 'Número de teléfono inválido.' }, { status: 400 });
  }

  if (!code || !/^\d{4,8}$/.test(code)) {
    return NextResponse.json({ detail: 'Código inválido.' }, { status: 400 });
  }

  try {
    const client = twilio(ACCOUNT_SID, AUTH_TOKEN);
    const check = await client.verify.v2
      .services(VERIFY_SID)
      .verificationChecks.create({ code, to: phone });

    console.log(`[whatsapp-otp-verify] status=${check.status} phone=${phone.slice(0, 6)}***`);

    if (check.status !== 'approved') {
      return NextResponse.json(
        { detail: 'Código incorrecto o expirado.', success: false },
        { status: 401 },
      );
    }

    // ── Identidad: usamos el número normalizado como user_id ──────────────────
    // Formato: wa:{e164} — distingue de emails en el sistema
    const userId = `wa:${phone}`;

    // ── JWT compatible con MCP (mismo secret y estructura que api-ia) ────────
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({
      development,
      phone,
      user_id: userId,
      user_type: 'registered',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${JWT_TTL_SECONDS}s`)
      .setSubject(userId)
      .sign(secret);

    return NextResponse.json({
      development,
      email: null,          // sin email — auth por teléfono
      phone,
      success: true,
      token,
      user_id: userId,
      user_type: 'registered',
    });
  } catch (err: any) {
    const code = err?.code;
    const message = err?.message || 'Error al verificar el código.';
    console.error(`[whatsapp-otp-verify] Twilio error code=${code}:`, message);

    if (code === 60_202) {
      return NextResponse.json(
        { detail: 'Demasiados intentos incorrectos. Solicita un nuevo código.', success: false },
        { status: 429 },
      );
    }

    return NextResponse.json({ detail: message, success: false }, { status: 502 });
  }
}
