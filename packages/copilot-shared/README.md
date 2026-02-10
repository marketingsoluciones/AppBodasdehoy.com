# @bodasdehoy/copilot-shared

Componentes compartidos de chat para el monorepo de BodasdeHoy.

## 📦 Paquetes

Este paquete contiene componentes React reutilizables para construir interfaces de chat. Todos los componentes son **prop-based** (controlados) y no dependen de stores específicos, lo que los hace fácilmente integrables en diferentes aplicaciones.

## 🏗️ Componentes

### ChatItem ✅ (Fase 2 - Completada)
Componente completo para renderizar mensajes individuales del chat con avatar, contenido y acciones.

**Características**:
- Prop-based (no depende de Zustand stores)
- Soporta placement (left/right)
- Variantes: bubble y docs
- Edición inline de mensajes
- Avatar personalizable
- Actions bar
- Error handling
- Loading states

**Componentes incluidos**:
- `ChatItem` - Componente principal
- `MessageContent` - Contenido del mensaje (refactorizado para ser prop-based)
- `Avatar` - Avatar del usuario/asistente
- `Actions` - Barra de acciones
- `Title` - Título con timestamp
- `ErrorContent` - Manejo de errores
- `Loading` - Indicador de carga
- `BorderSpacing` - Espaciado en mobile

### InputEditor ✅ (Fase 3 - Completada)
Editor de texto simple para input de chat con soporte para shortcuts de teclado.

**Características**:
- Prop-based (controlled component)
- Auto-resize basado en contenido
- Keyboard shortcuts:
  - Enter: enviar mensaje
  - Shift+Enter: nueva línea
- Estados: loading, disabled
- Auto-focus opcional
- Altura configurable (minRows, maxRows)

**Componentes incluidos**:
- `InputEditor` - Input principal con auto-resize
- `Placeholder` - Placeholder con hint de shortcuts

**Uso**:
```typescript
const [content, setContent] = useState('');

<InputEditor
  content={content}
  placeholder="Type a message..."
  onChange={setContent}
  onSend={(message) => {
    sendMessage(message);
    setContent('');
  }}
/>
```

### MessageList ✅ (Fase 4 - Completada)
Lista de mensajes de chat con auto-scroll automático cuando llegan nuevos mensajes.

**Características**:
- Prop-based (array de mensajes)
- Auto-scroll al final cuando llegan nuevos mensajes
- Scroll suave (smooth) para mejor UX
- Empty state personalizable
- Loading indicator
- Custom scrollbar styling
- Usa ChatItem para renderizar cada mensaje
- Responsive (max-width: 800px centrado)

**Props principales**:
```typescript
interface MessageListProps {
  messages: MessageItem[];
  autoScroll?: boolean;      // default: true
  loading?: boolean;          // default: false
  showAvatars?: boolean;      // default: true
  onAction?: (action: string, messageId: string) => void;
  emptyState?: React.ReactNode;
}
```

**Uso**:
```typescript
const messages = [
  {
    id: '1',
    role: 'user',
    message: 'Hello!',
    avatar: { title: 'User' },
  },
  {
    id: '2',
    role: 'assistant',
    message: 'Hi! How can I help?',
    avatar: { title: 'Assistant' },
  },
];

<MessageList
  messages={messages}
  autoScroll
  onAction={(action, messageId) => {
    if (action === 'copy') {
      // Handle copy action
    }
  }}
/>
```

## 🎯 Uso

### En apps/web

```typescript
import { CopilotEmbed } from '../Copilot/CopilotEmbed';

<CopilotEmbed
  userId={userId}
  sessionId={sessionId}
  development={development}
  eventId={eventId}
/>
```

### En apps/copilot

Los componentes se re-exportan automáticamente desde `@bodasdehoy/copilot-shared` con wrappers que conectan los stores de Zustand.

## 🔧 Desarrollo

```bash
# Type checking
pnpm type-check
```

## 📋 Principios de Diseño

1. **Prop-based**: Todos los componentes reciben datos vía props, no usan stores directamente
2. **Controlled components**: El estado se maneja externamente
3. **Sin dependencias circulares**: No importa de apps/copilot o apps/web
4. **Peer dependencies**: React, Ant Design, etc. como peerDependencies

## 🚀 Roadmap

- [x] Fase 1: Setup (estructura básica)
- [x] Fase 2: ChatItem - ✅ COMPLETADA
  - Migrado ChatItem y componentes a packages/copilot-shared
  - Refactorizado MessageContent para ser prop-based
  - Eliminadas dependencias de Zustand stores
  - apps/copilot mantiene funcionamiento original
- [x] Fase 3: InputEditor - ✅ COMPLETADA
  - Creado InputEditor simple prop-based
  - Auto-resize basado en contenido
  - Keyboard shortcuts (Enter/Shift+Enter)
  - Placeholder component con hint de shortcuts
- [x] Fase 4: MessageList - ✅ COMPLETADA
  - Creado MessageList con auto-scroll
  - Renderiza mensajes usando ChatItem
  - Empty state personalizable
  - Loading indicator
  - Scroll suave y automático
- [x] Fase 5: Integración en apps/web - ✅ COMPLETADA
  - Creado CopilotEmbed.tsx usando componentes compartidos
  - Integrado en ChatSidebarDirect.tsx
  - Streaming SSE funcionando
  - Historial desde API2
  - TypeScript sin errores
- [x] Fase 6: Botón "Ver Completo" - ✅ COMPLETADA
  - Botón implementado en apps/web
  - URL con params (sessionId, eventId, email)
  - Captura de params en apps/copilot
  - Mensaje de contexto con info del evento
- [x] Fase 7: i18n y Styling - ✅ COMPLETADA
  - Sistema i18n simple (es-ES, en-US)
  - Tema Ant Design compartido
  - Brand colors de BodasdeHoy
  - Exports organizados
- [ ] Fase 8: Testing y Docs

## 🎨 Tema y Estilos

### Tema Compartido de Ant Design

```typescript
import { ConfigProvider } from 'antd';
import { copilotTheme } from '@bodasdehoy/copilot-shared';

function MyApp() {
  return (
    <ConfigProvider theme={copilotTheme}>
      {/* Tu app aquí */}
    </ConfigProvider>
  );
}
```

### Brand Colors

```typescript
import { brandColors } from '@bodasdehoy/copilot-shared';

// Usar en estilos
<button style={{ backgroundColor: brandColors.primary }}>
  Click me
</button>
```

## 🌍 Internacionalización (i18n)

### Uso Básico

```typescript
import { t, getTranslations } from '@bodasdehoy/copilot-shared';

// Opción 1: Función t()
const placeholder = t('chat.input.placeholder', 'es-ES');
// => "Escribe un mensaje..."

// Opción 2: getTranslations()
const translations = getTranslations('en-US');
const { chat } = translations;
// => chat.input.placeholder = "Type a message..."
```

### Idiomas Disponibles

- `es-ES`: Español (por defecto)
- `en-US`: Inglés

### Traducciones Disponibles

- `chat.input.placeholder`
- `chat.input.placeholderWithShortcut`
- `chat.message.copy`
- `chat.message.user`
- `chat.message.assistant`
- `chat.list.empty`
- `chat.actions.viewComplete`
- Y más...

