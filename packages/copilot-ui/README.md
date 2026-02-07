# @bodasdehoy/copilot-ui

Componentes del Copilot para la app web del monorepo (AppBodasdehoy + LobeChat).

## Componentes

### CopilotEmbed (recomendado, sin iframe)

Chat integrado como componentes React. La app web inyecta `sendMessage` (llama a `/api/copilot/chat`) y opcionalmente `onLoadHistory` y `sessionId`. Una sola ventana, mismo DOM.

```tsx
import { CopilotEmbed } from '@bodasdehoy/copilot-ui';
import { sendChatMessage, getChatHistory } from '../services/copilotChat';

<CopilotEmbed
  userId={userId}
  development="bodasdehoy"
  eventId={eventId}
  eventName={event?.nombre}
  sessionId={guestSessionId}
  onLoadHistory={async (sid) => {
    const list = await getChatHistory(sid, development);
    return list.filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ id: m.id, role: m.role, content: m.content || '' }));
  }}
  sendMessage={async (params, onChunk, signal, onEnrichedEvent) => {
    const res = await sendChatMessage(params, onChunk, signal, onEnrichedEvent);
    return { content: res.content };
  }}
  eventsList={eventsGroup}
  userData={userData}
  event={event}
/>
```

**Props principales**: `sendMessage` (requerido), `sessionId`, `onLoadHistory`, `eventsList`, `minHeight`, `inputPlaceholder`. El resto igual que `CopilotChatProps`.

### CopilotDirect (opcional, iframe)

Carga la app completa del copilot (LobeChat) en un iframe (chat-test o localhost:3210). Útil si se quiere la UI completa de LobeChat.

```tsx
import { CopilotDirect } from '@bodasdehoy/copilot-ui';

<CopilotDirect
  userId={userId}
  development="bodasdehoy"
  eventId={eventId}
  eventName={event?.nombre}
  userData={userData}
  event={event}
  eventsList={eventsGroup}
  onNavigate={(path) => router.push(path)}
  onAction={(action, payload) => {}}
/>
```

### CopilotChat

Placeholder / contenedor de contexto. Para el chat integrado usar **CopilotEmbed**.

## Instalación

Paquete interno del monorepo:

```bash
pnpm install
```

## Documentación

- **Monorepo e integración**: `docs/MONOREPO-INTEGRACION-COPILOT.md` en la raíz del repo.
