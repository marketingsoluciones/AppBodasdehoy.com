/**
 * Cliente Slack para Frontend - Comunicación con api-ia
 * Canal: #copilot-api-ia (C0AEV0GCLM7)
 * Uso: React, Next.js, API Routes, Server Actions
 */

const SLACK_API = 'https://slack.com/api';

export type SlackMessage = {
  type: string;
  user?: string;
  bot_id?: string;
  text: string;
  ts: string;
  [key: string]: unknown;
};

export type SlackHistoryResponse = {
  ok: boolean;
  messages?: SlackMessage[];
  error?: string;
};

export type SlackPostMessageResponse = {
  ok: boolean;
  channel?: string;
  ts?: string;
  error?: string;
};

/**
 * Enviar mensaje a #copilot-api-ia vía webhook (no requiere bot token)
 */
export async function enviarMensajeWebhook(
  texto: string,
  webhookUrl?: string
): Promise<boolean> {
  const url = webhookUrl ?? process.env.SLACK_WEBHOOK_FRONTEND ?? process.env.SLACK_WEBHOOK;
  if (!url) throw new Error('SLACK_WEBHOOK_FRONTEND no configurado');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: texto })
  });
  return res.ok;
}

/**
 * Enviar mensaje vía API (chat.postMessage) - requiere bot token con chat:write
 */
export async function enviarMensaje(
  texto: string,
  options?: { token?: string; channel?: string }
): Promise<SlackPostMessageResponse> {
  const token = options?.token ?? process.env.SLACK_BOT_TOKEN;
  const channel = options?.channel ?? process.env.SLACK_CHANNEL_FRONTEND ?? process.env.SLACK_CHANNEL_ID ?? 'C0AEV0GCLM7';
  if (!token) throw new Error('SLACK_BOT_TOKEN no configurado');

  const res = await fetch(`${SLACK_API}/chat.postMessage`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ channel, text: texto })
  });
  return res.json() as Promise<SlackPostMessageResponse>;
}

/**
 * Leer historial del canal #copilot-api-ia
 */
export async function leerMensajes(
  limit = 20,
  options?: { token?: string; channel?: string }
): Promise<SlackMessage[]> {
  const token = options?.token ?? process.env.SLACK_BOT_TOKEN;
  const channel = options?.channel ?? process.env.SLACK_CHANNEL_FRONTEND ?? process.env.SLACK_CHANNEL_ID ?? 'C0AEV0GCLM7';
  if (!token) throw new Error('SLACK_BOT_TOKEN no configurado');

  const params = new URLSearchParams({ channel, limit: String(limit) });
  const res = await fetch(`${SLACK_API}/conversations.history?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = (await res.json()) as SlackHistoryResponse;
  if (!data.ok) throw new Error(data.error ?? 'Error al leer Slack');
  return data.messages ?? [];
}

// --- Ejemplos de uso ---
/*
// Next.js API Route (app/api/slack/route.ts)
import { enviarMensajeWebhook, leerMensajes } from '@/PARA_FRONTEND_slackClient';

export async function POST(req: Request) {
  const { text } = await req.json();
  await enviarMensajeWebhook(`[Frontend] ${text}`);
  return Response.json({ ok: true });
}
export async function GET() {
  const messages = await leerMensajes(15);
  return Response.json(messages);
}

// React component / Server Action
import { leerMensajes } from '@/PARA_FRONTEND_slackClient';
const mensajes = await leerMensajes(10);
*/
