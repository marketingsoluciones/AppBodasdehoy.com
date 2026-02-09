# 🤖 Integración con API de IA para el Copilot

**Objetivo**: Conectar el chat del copilot con una API de IA real (OpenAI, Claude, etc.)

---

## 📋 Qué Necesitas

### 1. API Key de un Proveedor de IA

**Opciones disponibles**:

#### Opción A: OpenAI (GPT-4, GPT-3.5)
- **Website**: https://platform.openai.com
- **Precio**: ~$0.03 por 1K tokens (GPT-4), ~$0.001 por 1K tokens (GPT-3.5)
- **Ventajas**: Muy popular, buena documentación
- **API Key**: Obtener en https://platform.openai.com/api-keys

#### Opción B: Anthropic Claude (Sonnet, Haiku)
- **Website**: https://console.anthropic.com
- **Precio**: ~$0.003 por 1K tokens (Haiku), ~$0.015 por 1K tokens (Sonnet)
- **Ventajas**: Mejor contexto largo, más seguro
- **API Key**: Obtener en https://console.anthropic.com/settings/keys

#### Opción C: Google Gemini
- **Website**: https://ai.google.dev
- **Precio**: Gratis hasta cierto límite, luego pago
- **Ventajas**: Gratis para desarrollo
- **API Key**: Obtener en https://aistudio.google.com/app/apikey

### 2. Archivos a Crear/Modificar

```
apps/web/
├── .env.local                        ← Agregar API keys
├── pages/api/copilot/
│   └── chat.ts                       ← Nuevo endpoint API
└── pages/copilot.tsx                 ← Actualizar handleSendMessage
```

---

## 🔧 Implementación Paso a Paso

### Paso 1: Agregar Variables de Entorno

**Archivo**: `apps/web/.env.local`

```bash
# API de IA - Elige UNA de estas opciones:

# Opción A: OpenAI
OPENAI_API_KEY=sk-...tu-api-key-aqui...

# Opción B: Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...tu-api-key-aqui...

# Opción C: Google Gemini
GOOGLE_API_KEY=...tu-api-key-aqui...

# Configuración del Copilot
NEXT_PUBLIC_CHAT=http://localhost:3210
```

### Paso 2: Instalar Dependencias

**Elige según el proveedor**:

```bash
# Para OpenAI
cd apps/web
pnpm add openai

# O para Anthropic Claude
pnpm add @anthropic-ai/sdk

# O para Google Gemini
pnpm add @google/generative-ai
```

### Paso 3: Crear Endpoint API

**Archivo**: `apps/web/pages/api/copilot/chat.ts`

#### Opción A: Con OpenAI
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, userId, eventId, eventName, context } = req.body;

    // Validaciones
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Llamada a OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4', // O 'gpt-3.5-turbo' para más económico
      messages: [
        {
          role: 'system',
          content: `Eres un asistente inteligente para planificación de eventos.
El usuario está trabajando en el evento "${eventName || 'sin nombre'}".
Ayúdalo con invitados, presupuesto, itinerario y todo lo relacionado con su evento.
Sé amable, profesional y conciso.`
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content ||
                     'Lo siento, no pude generar una respuesta.';

    // Log para debugging
    console.log('[Copilot API] Mensaje procesado:', {
      userId,
      eventId,
      messageLength: message.length,
      responseLength: response.length,
    });

    return res.status(200).json({
      response,
      usage: completion.usage,
    });

  } catch (error: any) {
    console.error('[Copilot API] Error:', error);

    return res.status(500).json({
      error: 'Error al procesar el mensaje',
      details: error.message,
    });
  }
}
```

#### Opción B: Con Anthropic Claude
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, userId, eventId, eventName } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const completion = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // O 'claude-3-5-sonnet-20241022'
      max_tokens: 1024,
      system: `Eres un asistente inteligente para planificación de eventos.
El usuario está trabajando en el evento "${eventName || 'sin nombre'}".
Ayúdalo con invitados, presupuesto, itinerario y todo lo relacionado con su evento.
Sé amable, profesional y conciso.`,
      messages: [
        {
          role: 'user',
          content: message
        }
      ],
    });

    const response = completion.content[0]?.type === 'text'
      ? completion.content[0].text
      : 'Lo siento, no pude generar una respuesta.';

    console.log('[Copilot API] Mensaje procesado:', {
      userId,
      eventId,
      messageLength: message.length,
      responseLength: response.length,
    });

    return res.status(200).json({
      response,
      usage: completion.usage,
    });

  } catch (error: any) {
    console.error('[Copilot API] Error:', error);

    return res.status(500).json({
      error: 'Error al procesar el mensaje',
      details: error.message,
    });
  }
}
```

#### Opción C: Con Google Gemini
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, userId, eventId, eventName } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Eres un asistente inteligente para planificación de eventos.
El usuario está trabajando en el evento "${eventName || 'sin nombre'}".
Ayúdalo con invitados, presupuesto, itinerario y todo lo relacionado con su evento.
Sé amable, profesional y conciso.

Usuario: ${message}
Asistente:`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    console.log('[Copilot API] Mensaje procesado:', {
      userId,
      eventId,
      messageLength: message.length,
      responseLength: response.length,
    });

    return res.status(200).json({
      response,
    });

  } catch (error: any) {
    console.error('[Copilot API] Error:', error);

    return res.status(500).json({
      error: 'Error al procesar el mensaje',
      details: error.message,
    });
  }
}
```

### Paso 4: Actualizar handleSendMessage

**Archivo**: `apps/web/pages/copilot.tsx`

**Reemplazar** (líneas ~106-145):

```tsx
const handleSendMessage = useCallback(async (message: string) => {
  if (!message.trim()) return;

  // Agregar mensaje del usuario
  const userMessage: Message = {
    id: `user-${Date.now()}`,
    role: 'user',
    content: message.trim(),
    timestamp: Date.now(),
  };

  setMessages(prev => [...prev, userMessage]);
  setIsLoading(true);

  try {
    // Llamada a la API real
    const response = await fetch('/api/copilot/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message.trim(),
        userId,
        eventId,
        eventName,
        context: {
          // Puedes agregar más contexto aquí
          previousMessages: messages.slice(-5), // Últimos 5 mensajes
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: data.response,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, assistantMessage]);

  } catch (error) {
    console.error('[Copilot] Error al enviar mensaje:', error);

    // Mensaje de error para el usuario
    const errorMessage: Message = {
      id: `error-${Date.now()}`,
      role: 'assistant',
      content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, errorMessage]);
  } finally {
    setIsLoading(false);
  }
}, [userId, eventId, eventName, messages]);
```

---

## 🚀 Cómo Usar

### 1. Configurar API Key

```bash
# 1. Obtener API key del proveedor elegido
# 2. Agregar a .env.local
echo "OPENAI_API_KEY=sk-..." >> apps/web/.env.local

# O para Claude
echo "ANTHROPIC_API_KEY=sk-ant-..." >> apps/web/.env.local
```

### 2. Instalar Dependencia

```bash
cd apps/web
pnpm add openai
# O
pnpm add @anthropic-ai/sdk
# O
pnpm add @google/generative-ai
```

### 3. Crear Endpoint API

```bash
# Crear directorio
mkdir -p apps/web/pages/api/copilot

# Crear archivo (usa uno de los ejemplos de arriba)
# Copiar código correspondiente al proveedor elegido
```

### 4. Actualizar copilot.tsx

```bash
# Reemplazar handleSendMessage con la versión que usa fetch
# Ver código en "Paso 4" arriba
```

### 5. Reiniciar Servidor

```bash
# Detener servidor actual (Ctrl+C)
# Iniciar de nuevo para cargar .env.local
npm run dev
```

### 6. Probar

1. Abrir http://localhost:8080/copilot
2. Escribir mensaje: "Ayúdame a organizar mi evento de boda"
3. Verificar que la IA responde correctamente

---

## 💡 Funcionalidades Adicionales

### A. Historial de Conversación

Para que la IA recuerde mensajes anteriores:

```typescript
// En el endpoint API
const messages = [
  {
    role: 'system',
    content: 'Eres un asistente...'
  },
  // Agregar historial
  ...previousMessages.map(msg => ({
    role: msg.role,
    content: msg.content
  })),
  {
    role: 'user',
    content: message
  }
];
```

### B. Streaming de Respuestas

Para mostrar la respuesta mientras se genera:

```typescript
// Endpoint con streaming (OpenAI)
const stream = await openai.chat.completions.create({
  model: 'gpt-4',
  messages,
  stream: true,
});

res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  res.write(`data: ${JSON.stringify({ content })}\n\n`);
}

res.end();
```

### C. Contexto del Evento

Agregar información del evento al prompt:

```typescript
const systemPrompt = `Eres un asistente para planificación de eventos.

Información del evento:
- Nombre: ${eventName}
- Tipo: ${eventType}
- Fecha: ${eventDate}
- Número de invitados: ${guestCount}
- Presupuesto: ${budget}

Ayuda al usuario basándote en esta información.`;
```

### D. Funciones/Tools (OpenAI)

Permitir que la IA ejecute acciones:

```typescript
const tools = [
  {
    type: 'function',
    function: {
      name: 'add_guest',
      description: 'Agregar un invitado al evento',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
        },
        required: ['name', 'email'],
      },
    },
  },
];

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages,
  tools,
  tool_choice: 'auto',
});

// Manejar llamadas a funciones
if (completion.choices[0].message.tool_calls) {
  // Ejecutar función y devolver resultado
}
```

---

## 📊 Costos Estimados

### Por 1,000 Mensajes (promedio 100 tokens por mensaje)

| Proveedor | Modelo | Costo Aprox. |
|-----------|--------|--------------|
| OpenAI | GPT-3.5 Turbo | $0.10 - $0.20 |
| OpenAI | GPT-4 | $3.00 - $6.00 |
| Anthropic | Claude Haiku | $0.30 - $0.60 |
| Anthropic | Claude Sonnet | $1.50 - $3.00 |
| Google | Gemini Pro | Gratis (límite) |

**Recomendación para desarrollo**: Usar GPT-3.5 Turbo o Claude Haiku (económicos y rápidos)

**Recomendación para producción**: GPT-4 o Claude Sonnet (mejores respuestas)

---

## 🔒 Seguridad

### 1. Nunca Exponer API Keys en Cliente

```typescript
// ❌ MAL - No hacer esto
const OPENAI_KEY = 'sk-...'; // En código cliente

// ✅ BIEN - Usar en servidor
const key = process.env.OPENAI_API_KEY; // En API route
```

### 2. Validar Autenticación

```typescript
// En el endpoint API
import { getServerSession } from 'next-auth';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // Continuar con lógica...
}
```

### 3. Rate Limiting

```typescript
// Limitar llamadas por usuario
const rateLimiter = new Map();

export default async function handler(req, res) {
  const userId = req.body.userId;
  const now = Date.now();
  const limit = 10; // 10 mensajes por minuto

  const userRequests = rateLimiter.get(userId) || [];
  const recentRequests = userRequests.filter(time => now - time < 60000);

  if (recentRequests.length >= limit) {
    return res.status(429).json({ error: 'Demasiadas solicitudes' });
  }

  rateLimiter.set(userId, [...recentRequests, now]);

  // Continuar...
}
```

---

## ✅ Checklist de Implementación

- [ ] Obtener API key del proveedor elegido
- [ ] Agregar API key a `.env.local`
- [ ] Instalar dependencia del proveedor (openai/anthropic/gemini)
- [ ] Crear endpoint `/api/copilot/chat.ts`
- [ ] Actualizar `handleSendMessage` en `copilot.tsx`
- [ ] Reiniciar servidor para cargar variables de entorno
- [ ] Probar enviando mensaje en http://localhost:8080/copilot
- [ ] Verificar que la IA responde correctamente
- [ ] Agregar manejo de errores
- [ ] (Opcional) Implementar historial de conversación
- [ ] (Opcional) Agregar streaming de respuestas
- [ ] (Opcional) Configurar rate limiting

---

## 🎯 Próximos Pasos Recomendados

1. **Empezar simple**: Usar GPT-3.5 Turbo o Claude Haiku
2. **Probar**: Verificar que funciona básicamente
3. **Mejorar prompt**: Ajustar el system message para mejores respuestas
4. **Agregar contexto**: Incluir información del evento en el prompt
5. **Historial**: Permitir conversaciones más naturales
6. **Funciones**: Agregar tools para acciones (agregar invitado, etc.)
7. **UI**: Mejorar con markdown rendering, code highlighting, etc.

---

**Última actualización**: 2026-02-08
**Desarrollado con**: Claude Sonnet 4.5
