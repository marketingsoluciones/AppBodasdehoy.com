import { randomInt } from 'node:crypto';

/**
 * Store en memoria de OTPs de WhatsApp (login por teléfono).
 *
 * chat-dev corre como UN proceso `next start`, así que un Map a nivel de módulo
 * se comparte entre `whatsapp-otp-send` y `whatsapp-otp-verify` (mismo runtime).
 * Reemplaza a Twilio Verify (que gestionaba código+expiración) ahora que el envío
 * va por nuestro WhatsApp (gateway QR / api-ia), no por un proveedor externo.
 *
 * NOTA producción multi-instancia: si algún día chat-ia se despliega con varias
 * réplicas, mover este store a Redis/Mongo (el TTL + attempts ya está modelado).
 */
interface OtpEntry {
  attempts: number;
  code: string;
  expiresAt: number;
}

const store = new Map<string, OtpEntry>();
const TTL_MS = 10 * 60 * 1000; // 10 minutos
const MAX_ATTEMPTS = 5;

/** Código numérico de 6 dígitos, con aleatoriedad criptográfica. */
export function genOtp(): string {
  return String(randomInt(100_000, 1_000_000));
}

/** Guarda (o reemplaza) el OTP de un teléfono con TTL de 10 min. */
export function setOtp(phone: string, code: string): void {
  store.set(phone, { attempts: 0, code, expiresAt: Date.now() + TTL_MS });
}

export type OtpCheck = 'ok' | 'invalid' | 'expired' | 'too_many';

/** Verifica el código. Consume el OTP si acierta o si se agotan los intentos. */
export function checkOtp(phone: string, code: string): OtpCheck {
  const entry = store.get(phone);
  if (!entry) return 'expired';
  if (Date.now() > entry.expiresAt) {
    store.delete(phone);
    return 'expired';
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    store.delete(phone);
    return 'too_many';
  }
  entry.attempts += 1;
  if (entry.code !== code) return 'invalid';
  store.delete(phone); // un OTP válido se usa una sola vez
  return 'ok';
}
