# Configuración Frontend - Slack con api-ia

**Canal:** #copilot-api-ia  
**Objetivo:** Enviar y leer mensajes para coordinación con api-ia.

---

## 1. Credenciales

Añade a **`.env.local`** (Next.js) o **`.env`**:

```env
# Bot Token (compartido por todos)
SLACK_BOT_TOKEN=xoxb-10503704691745-10487778333445-wrCA9l4vPDj84uyDVoRWN9lJ
# Para Frontend
SLACK_WEBHOOK_FRONTEND=https://hooks.slack.com/services/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
SLACK_CHANNEL_FRONTEND=C0AEV0GCLM7
# Opcional: nombre que aparece como remitente en Slack (default: "Frontend Bodasdehoy · Copilot LobeChat")
# SLACK_SENDER_NAME=Frontend Bodasdehoy · Copilot LobeChat
```

- **SLACK_BOT_TOKEN:** Leer mensajes (compartido; solo servidor).
- **SLACK_WEBHOOK_FRONTEND:** Enviar mensajes a #copilot-api-ia (solo servidor).
- **SLACK_CHANNEL_FRONTEND:** #copilot-api-ia (C0AEV0GCLM7).
- **SLACK_SENDER_NAME:** (opcional) Nombre del remitente visible en Slack; si no se define, los scripts usan "Frontend Bodasdehoy · Copilot LobeChat".
- **Identificar equipo/repo:** usar `--copilot` o `--web` en los scripts para que quede claro quién envía:
  - `./scripts/slack-send.sh --copilot "mensaje"` → Front Copilot LobeChat · Repo: apps/copilot
  - `./scripts/slack-send.sh --web "mensaje"` → Front App Bodasdehoy · Repo: apps/web
  - Opcional en .env: `SLACK_REPO=copilot` o `SLACK_REPO=web` para el valor por defecto.

---

## 2. Uso rápido

### Enviar mensaje (webhook)

```typescript
const res = await fetch(process.env.SLACK_WEBHOOK!, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
  text: 'Hola api-ia',
  username: process.env.SLACK_SENDER_NAME || 'Frontend Bodasdehoy · Copilot LobeChat'
})
});
```

### Leer mensajes (bot token)

```typescript
const res = await fetch(
  `https://slack.com/api/conversations.history?channel=${process.env.SLACK_CHANNEL_ID}&limit=20`,
  { headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` } }
);
const { messages } = await res.json();
```

---

## 3. Next.js - API Routes

**`app/api/slack/enviar/route.ts`**

```typescript
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { text } = await req.json();
  const webhook = process.env.SLACK_WEBHOOK_FRONTEND ?? process.env.SLACK_WEBHOOK;
  if (!webhook) return NextResponse.json({ error: 'No config' }, { status: 500 });
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: `[Frontend] ${text}` })
  });
  return NextResponse.json({ ok: res.ok });
}
```

**`app/api/slack/historial/route.ts`**

```typescript
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get('limit') ?? '20';
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL_FRONTEND ?? process.env.SLACK_CHANNEL_ID;
  if (!token) return NextResponse.json({ error: 'No config' }, { status: 500 });
  const res = await fetch(
    `https://slack.com/api/conversations.history?channel=${channel}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (!data.ok) return NextResponse.json({ error: data.error }, { status: 400 });
  return NextResponse.json(data.messages ?? []);
}
```

Uso desde el cliente: `fetch('/api/slack/enviar', { method: 'POST', body: JSON.stringify({ text: 'Hola' }) })` y `fetch('/api/slack/historial?limit=10')`.

---

## 4. Server Actions (Next.js)

```typescript
'use server';

export async function enviarAMensajeSlack(texto: string) {
  const webhook = process.env.SLACK_WEBHOOK_FRONTEND ?? process.env.SLACK_WEBHOOK;
  if (!webhook) throw new Error('SLACK_WEBHOOK_FRONTEND no configurado');
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: `[Frontend] ${texto}` })
  });
}

export async function obtenerMensajesSlack(limit = 20) {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL_FRONTEND ?? process.env.SLACK_CHANNEL_ID;
  if (!token) throw new Error('SLACK_BOT_TOKEN no configurado');
  const res = await fetch(
    `https://slack.com/api/conversations.history?channel=${channel}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? 'Error Slack');
  return data.messages ?? [];
}
```

---

## 5. Cliente TypeScript completo

Usa el archivo **`PARA_FRONTEND_slackClient.ts`**:

- `enviarMensajeWebhook(texto)` – enviar vía webhook
- `enviarMensaje(texto)` – enviar vía API (requiere scope `chat:write`)
- `leerMensajes(limit)` – leer historial

Import en API Route o Server Action:

```typescript
import { enviarMensajeWebhook, leerMensajes } from './PARA_FRONTEND_slackClient';
```

---

## 6. Troubleshooting

| Error | Causa | Solución |
|-------|--------|----------|
| `account_inactive` | Bot token revocado o app desinstalada | Reinstalar app en Slack, copiar nuevo token a .env |
| `missing_scope` | Falta permiso (ej. channels:history, chat:write) | Añadir scope en api.slack.com → OAuth & Permissions |
| `no_service` (webhook) | Webhook deshabilitado o app desinstalada | Revisar Incoming Webhooks en la app, reinstalar si hace falta |
| Variables undefined | .env no cargado o nombre distinto | Usar SLACK_WEBHOOK, SLACK_BOT_TOKEN, SLACK_CHANNEL_ID en .env.local |

**Seguridad:** No expongas SLACK_BOT_TOKEN ni SLACK_WEBHOOK en el cliente. Úsalos solo en API Routes, Server Actions o backend.

---

## 7. Resumen

- **Escribir:** Webhook (SLACK_WEBHOOK) o chat.postMessage (SLACK_BOT_TOKEN + chat:write).
- **Leer:** conversations.history con SLACK_BOT_TOKEN (scopes channels:history, channels:read).
- **Canal:** C0AEV0GCLM7 (#copilot-api-ia).

Archivos en este repo: **PARA_FRONTEND_RESUMEN.txt**, **PARA_FRONTEND_slackClient.ts**, **CONFIGURACION_FRONTEND.md** (este documento).
