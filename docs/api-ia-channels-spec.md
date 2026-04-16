# Especificación: Endpoints de Canales para api-ia

## Contexto
El frontend de chat-ia necesita endpoints unificados en api-ia para gestionar canales de mensajería: Instagram, Telegram, Email y Web Chat. WhatsApp ya funciona via api2 pero eventualmente migrará a api-ia también.

## Arquitectura
```
Frontend (chat-ia) --> /api/messages/[channel]/* (proxy) --> api-ia /api/messages/[channel]/*
```

El proxy en chat-ia rutea por prefijo de path:
- `whatsapp/*` → api2 (temporal)
- `instagram/*`, `telegram/*`, `email/*`, `web/*` → api-ia

---

## Endpoints Requeridos

### 1. Gestión de Canales (todos los tipos)

```
GET    /api/channels?development={dev}
       → Lista todos los canales configurados del desarrollo
       → Response: { channels: [{ id, type, name, status, config, createdAt }] }

POST   /api/channels/{type}/connect
       → Conecta un nuevo canal
       → Body varía por tipo (ver abajo)
       → Response: { channel: { id, type, name, status } }

DELETE /api/channels/{channelId}
       → Desconecta/elimina un canal
       → Response: { success: true }

GET    /api/channels/{channelId}/status
       → Estado de conexión del canal
       → Response: { status: 'active' | 'connecting' | 'disconnected' | 'error', details?: string }
```

### 2. Conversaciones (unificado)

```
GET    /api/messages/{channel}/conversations/{development}
       → Lista conversaciones del canal
       → Response: { conversations: [{
           conversationId, displayName, lastMessage, lastMessageAt,
           unreadCount, channel, metadata
         }] }

GET    /api/messages/{channel}/conversations/{development}/{conversationId}/messages
       → Mensajes de una conversación
       → Query: ?limit=50&before={messageId}
       → Response: { messages: [{
           id, role, content, timestamp, channel,
           metadata: { pageUrl?, senderName? }
         }] }

POST   /api/messages/{channel}/conversations/{development}/{conversationId}/send
       → Enviar respuesta
       → Body: { text: string, attachments?: [] }
       → Response: { messageId, timestamp }
```

### 3. Webhooks (recepción de mensajes entrantes)

```
POST   /api/webhooks/instagram
       → Recibe DMs de Instagram (Facebook Graph API webhook)
       → Verificación: GET con hub.verify_token

POST   /api/webhooks/telegram
       → Recibe updates de Telegram Bot API
       → Se configura con setWebhook al conectar el bot

POST   /api/webhooks/email
       → Recibe emails entrantes (via Mailgun/SendGrid inbound parse, o polling IMAP)

POST   /api/webhooks/web-chat
       → Recibe mensajes del widget de chat web
       → Body: { visitorId, development, text, pageContext: { url, title, referrer } }
```

---

## Detalle por Canal

### Instagram
- **Conexión:** OAuth con Facebook Graph API
  - POST `/api/channels/instagram/connect` con `{ accessToken, pageId }`
  - El backend debe suscribirse a webhooks de Instagram Messaging
- **Envío:** POST a `https://graph.facebook.com/v18.0/me/messages`
- **Recepción:** Webhook en `/api/webhooks/instagram`

### Telegram
- **Conexión:** Bot Token de @BotFather
  - POST `/api/channels/telegram/connect` con `{ botToken, development }`
  - El backend llama `https://api.telegram.org/bot{token}/setWebhook?url=https://api-ia.bodasdehoy.com/api/webhooks/telegram/{development}`
- **Envío:** POST a `https://api.telegram.org/bot{token}/sendMessage`
- **Recepción:** Webhook en `/api/webhooks/telegram`

### Email
- **Conexión:** Credenciales SMTP/IMAP o OAuth Gmail
  - POST `/api/channels/email/connect` con `{ provider: 'gmail'|'smtp', credentials: {...} }`
- **Envío:** SMTP directo o API de Gmail/Outlook
- **Recepción:** IMAP polling o inbound parse webhook
- **Threading:** Agrupar por In-Reply-To / References headers

### Web Chat
- **Conexión:** Auto-configurado por development
  - GET `/api/channels/web/embed-code?development={dev}` → Retorna snippet HTML
- **Envío:** El agente responde via SSE al widget
- **Recepción:** POST `/api/webhooks/web-chat` con visitorId + pageContext
- **Sesiones:** Generar visitorId en localStorage del navegador del visitante

---

## Headers de Autenticación (enviados por el proxy)
```
Authorization: Bearer {token}
X-Development: {development}
X-User-ID: {userId}
X-Role: {role}
Content-Type: application/json
```

## Prioridad de Implementación
1. **Web Chat** (más simple, sin OAuth, sin API externa)
2. **Telegram** (simple, solo bot token)
3. **Instagram** (requiere Facebook App + OAuth)
4. **Email** (más complejo, IMAP/SMTP + threading)
