# Arquitectura del Monorepo BodasdeHoy

**Última actualización**: 2026-02-10
**Estado**: ✅ Completada Fase 7 (i18n y Styling)

---

## 📋 Tabla de Contenidos

1. [Visión General](#-visión-general)
2. [Estructura del Monorepo](#-estructura-del-monorepo)
3. [Aplicaciones](#-aplicaciones)
4. [Paquetes Compartidos](#-paquetes-compartidos)
5. [Flujo de Integración](#-flujo-de-integración)
6. [Arquitectura de Componentes](#-arquitectura-de-componentes)
7. [Sistema de i18n](#-sistema-de-i18n)
8. [Sistema de Temas](#-sistema-de-temas)
9. [Decisiones de Diseño](#-decisiones-de-diseño)
10. [Flujo de Datos](#-flujo-de-datos)
11. [Comunicación Entre Apps](#-comunicación-entre-apps)
12. [Extensibilidad](#-extensibilidad)

---

## 🎯 Visión General

El monorepo de BodasdeHoy implementa una arquitectura de componentes compartidos que permite:

1. **apps/copilot** funciona standalone completo (LobeChat)
2. **apps/web** integra componentes de chat nativos (NO iframe)
3. **packages/copilot-shared** contiene componentes reutilizables prop-based
4. **Futuros proyectos** pueden reutilizar los mismos componentes

### Principios Fundamentales

- ✅ **Separation of Concerns**: Cada app es independiente y funcional por sí misma
- ✅ **Prop-based Components**: Componentes controlados sin dependencias de stores específicos
- ✅ **Single Source of Truth**: Backend Python (api-ia) como única fuente de datos
- ✅ **Progressive Enhancement**: apps/copilot tiene funcionalidad completa, apps/web tiene subset optimizado
- ✅ **Zero Breaking Changes**: Re-exports y wrappers mantienen compatibilidad

---

## 🏗️ Estructura del Monorepo

```
/Users/juancarlosparra/Projects/AppBodasdehoy.com/
│
├── apps/                           # Aplicaciones del monorepo
│   ├── web/                        # Organizador de eventos (puerto 8080)
│   │   ├── components/
│   │   │   ├── ChatSidebar/        # Sidebar del chat
│   │   │   │   ├── ChatSidebar.tsx
│   │   │   │   ├── ChatSidebarDirect.tsx
│   │   │   │   └── index.tsx
│   │   │   └── Copilot/
│   │   │       ├── CopilotEmbed.tsx      # ✅ Integración nativa usando copilot-shared
│   │   │       ├── CopilotIframe.tsx     # Fallback iframe (legacy)
│   │   │       └── CopilotPrewarmer.tsx  # Precarga del iframe
│   │   ├── pages/                  # Rutas de Next.js
│   │   ├── services/
│   │   │   └── copilotChat.ts      # Servicio SSE streaming
│   │   └── context/                # Contextos React (Auth, Event)
│   │
│   └── copilot/                    # Chat IA - LobeChat standalone (puerto 3210)
│       ├── src/
│       │   ├── app/                # Next.js App Router
│       │   ├── features/           # Features de LobeChat
│       │   │   ├── ChatItem/       # Re-exports de copilot-shared
│       │   │   ├── ChatInput/      # Wrappers que conectan stores
│       │   │   └── Conversation/   # Lógica específica de copilot
│       │   └── store/              # Zustand stores
│       │       ├── chat/           # Store principal de chat
│       │       ├── user/           # Store de usuario
│       │       └── global/         # Store global
│       └── .env*                   # Configuración
│
├── packages/                       # Paquetes compartidos
│   ├── copilot-shared/             # ✅ Componentes compartidos prop-based
│   │   ├── src/
│   │   │   ├── ChatItem/           # Componente de mensaje individual
│   │   │   │   ├── ChatItem.tsx
│   │   │   │   ├── components/     # Avatar, Actions, MessageContent
│   │   │   │   ├── style.ts
│   │   │   │   ├── type.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── InputEditor/        # Editor de texto con shortcuts
│   │   │   │   ├── InputEditor.tsx
│   │   │   │   ├── Placeholder.tsx
│   │   │   │   ├── types.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── MessageList/        # Lista de mensajes con auto-scroll
│   │   │   │   ├── MessageList.tsx
│   │   │   │   ├── types.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── i18n/               # Sistema de traducciones
│   │   │   │   ├── locales/
│   │   │   │   │   ├── es-ES/
│   │   │   │   │   │   └── common.json
│   │   │   │   │   └── en-US/
│   │   │   │   │       └── common.json
│   │   │   │   ├── config.ts       # Función t() y getTranslations()
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── theme/              # Tema Ant Design
│   │   │   │   └── index.ts        # copilotTheme + brandColors
│   │   │   │
│   │   │   └── index.ts            # Exports principales
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   └── shared/                     # Utilities compartidas
│       └── auth/
│
├── docs/                           # Documentación
│   ├── FASE_*.md                   # Documentación de cada fase
│   └── archive/                    # Docs archivadas
│
├── scripts/                        # Scripts útiles
│   └── reiniciar-servicios-test.sh
│
├── ecosystem.config.js             # PM2 config
├── pnpm-workspace.yaml             # Configuración del workspace
├── package.json                    # Root package.json
└── tsconfig.json                   # TypeScript config base
```

---

## 🚀 Aplicaciones

### apps/web - Organizador de Eventos

**Puerto**: 8080
**Framework**: Next.js 15 (Pages Router)
**Estado**: ✅ Producción

#### Características

- Gestión de invitados, presupuesto, mesas, itinerario
- Integración de chat nativo con **CopilotEmbed**
- Sidebar colapsable con Cmd+Shift+C
- Botón "Ver Completo" abre apps/copilot en nueva pestaña

#### Integración del Chat

**Antes (Fase 1-4)**:
```tsx
// CopilotIframe.tsx - comunicación vía postMessage
<iframe src="http://localhost:3210" />
```

**Después (Fase 5+)**:
```tsx
// CopilotEmbed.tsx - componentes nativos
import { MessageList, InputEditor } from '@bodasdehoy/copilot-shared';

<div>
  <MessageList messages={messages} onAction={handleAction} />
  <InputEditor content={input} onChange={setInput} onSend={handleSend} />
</div>
```

#### Ventajas de CopilotEmbed

- ✅ **Mejor Performance**: Componentes nativos sin overhead de iframe
- ✅ **Integración Directa**: No requiere postMessage
- ✅ **Streaming SSE**: Respuestas en tiempo real
- ✅ **Historial Compartido**: Usa getChatHistory() desde API2
- ✅ **Extensible**: Fácil agregar nuevas features

#### Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| [components/ChatSidebar/ChatSidebarDirect.tsx](apps/web/components/ChatSidebar/ChatSidebarDirect.tsx:14) | Sidebar con CopilotEmbed |
| [components/Copilot/CopilotEmbed.tsx](apps/web/components/Copilot/CopilotEmbed.tsx:69) | Componente principal de integración |
| [services/copilotChat.ts](apps/web/services/copilotChat.ts) | Servicio SSE streaming |

---

### apps/copilot - Chat IA Standalone

**Puerto**: 3210
**Framework**: Next.js 15 (App Router)
**Base**: LobeChat
**Estado**: ✅ Producción

#### Características

- Chat conversacional completo con todas las features de LobeChat
- Memory System, Artifacts, Plugins
- Editor avanzado con toolbar completo
- MCP Tools integrados
- Historial de conversaciones en PostgreSQL (Neon)
- Storage en Cloudflare R2

#### Estrategia de Migración: Re-exports Sin Romper

Para mantener apps/copilot funcionando sin cambios durante la migración:

**1. Re-exports de componentes compartidos**:
```typescript
// apps/copilot/src/features/ChatItem/index.ts
// ✅ Re-export para compatibilidad (mantiene imports existentes)
export { ChatItem } from '@bodasdehoy/copilot-shared/ChatItem';
export type * from '@bodasdehoy/copilot-shared/ChatItem';
```

**2. Wrappers que conectan stores → componentes compartidos**:
```typescript
// apps/copilot/src/features/ChatItem/AssistantMessage.tsx
import { ChatItem } from '@bodasdehoy/copilot-shared/ChatItem';
import { useChatStore } from '@/store/chat';

export const AssistantMessage = ({ id }: { id: string }) => {
  const message = useChatStore(s => s.messages[id]);
  const updateMessage = useChatStore(s => s.updateMessage);

  const handleAction = (action: string, messageId: string) => {
    if (action === 'copy') {
      navigator.clipboard.writeText(message.content);
    } else if (action === 'delete') {
      updateMessage(messageId, { deleted: true });
    }
  };

  return (
    <ChatItem
      id={message.id}
      role={message.role}
      content={message.content}
      avatar={{ src: message.meta?.avatar }}
      createdAt={message.createdAt}
      loading={message.loading}
      error={message.error}
      onAction={handleAction}
    />
  );
};
```

**Resultado**: ✅ apps/copilot funciona sin cambios, usando los mismos componentes compartidos.

#### Captura de URL Params (Botón "Ver Completo")

Cuando apps/web abre apps/copilot en nueva pestaña:

```typescript
// apps/copilot/src/app/.../ChatHydration/index.tsx
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('sessionId');
  const eventName = params.get('eventName');
  const email = params.get('email');

  if (sessionId) {
    // Guardar contexto en localStorage
    localStorage.setItem('copilot-context', JSON.stringify({
      sessionId,
      eventName,
      email,
      timestamp: Date.now(),
    }));

    // Mostrar mensaje de contexto
    if (eventName) {
      store.internal_createMessage({
        content: `Continuando conversación del evento "${eventName}"${email ? ` para ${email}` : ''}.`,
        role: 'assistant',
        sessionId: activeId,
      });
    }

    // Limpiar URL params
    window.history.replaceState({}, '', window.location.pathname);
  }
}, []);
```

---

## 📦 Paquetes Compartidos

### packages/copilot-shared

**Versión**: 1.0.0
**Estado**: ✅ Fase 7 completada
**Principio**: Prop-based components (controlados)

#### Componentes Disponibles

##### 1. ChatItem

Componente para renderizar mensajes individuales del chat.

**Props**:
```typescript
interface ChatItemProps {
  id: string;
  role: 'user' | 'assistant' | 'system';
  message: string;                    // Contenido del mensaje
  avatar?: {
    src?: string;
    title?: string;
    backgroundColor?: string;
  };
  createdAt?: Date;
  loading?: boolean;                  // Estado de carga
  error?: { message: string };        // Error si aplica
  onAction?: (action: string, messageId: string) => void;
}
```

**Subcomponentes**:
- `Avatar`: Avatar del usuario/asistente
- `MessageContent`: Renderizado de contenido con markdown
- `Actions`: Barra de acciones (copy, delete, etc.)
- `Title`: Título con timestamp
- `ErrorContent`: Manejo de errores
- `Loading`: Indicador de carga

**Uso**:
```typescript
<ChatItem
  id="msg_123"
  role="assistant"
  message="Hola, ¿en qué puedo ayudarte?"
  avatar={{ title: 'Copilot', backgroundColor: '#FF1493' }}
  createdAt={new Date()}
  onAction={(action, id) => {
    if (action === 'copy') {
      navigator.clipboard.writeText(message);
    }
  }}
/>
```

##### 2. InputEditor

Editor de texto simple para input de chat con shortcuts de teclado.

**Props**:
```typescript
interface InputEditorProps {
  content: string;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  minRows?: number;                   // Altura mínima (default: 2)
  maxRows?: number;                   // Altura máxima (default: 8)
  onChange: (content: string) => void;
  onSend: (content: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}
```

**Shortcuts**:
- **Enter**: Enviar mensaje
- **Shift+Enter**: Nueva línea
- **Auto-resize**: Basado en contenido (minRows → maxRows)

**Uso**:
```typescript
const [content, setContent] = useState('');

<InputEditor
  content={content}
  placeholder="Escribe un mensaje..."
  onChange={setContent}
  onSend={(message) => {
    sendMessage(message);
    setContent('');
  }}
  minRows={2}
  maxRows={6}
/>
```

##### 3. MessageList

Lista de mensajes de chat con auto-scroll automático.

**Props**:
```typescript
interface MessageItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  message: string;
  avatar?: {
    src?: string;
    title?: string;
    backgroundColor?: string;
  };
  createdAt?: Date;
  loading?: boolean;
  error?: { message: string };
}

interface MessageListProps {
  messages: MessageItem[];
  autoScroll?: boolean;               // default: true
  loading?: boolean;                  // Indicador de carga inicial
  showAvatars?: boolean;              // default: true
  onAction?: (action: string, messageId: string) => void;
  emptyState?: React.ReactNode;       // Estado vacío personalizable
}
```

**Características**:
- Auto-scroll suave al final cuando llegan nuevos mensajes
- Max-width: 800px centrado para mejor lectura
- Custom scrollbar styling
- Empty state personalizable

**Uso**:
```typescript
<MessageList
  messages={messages}
  autoScroll
  loading={loadingHistory}
  onAction={(action, messageId) => {
    if (action === 'copy') {
      // Handle copy
    }
  }}
  emptyState={
    <div style={{ textAlign: 'center', padding: '48px' }}>
      <p>Bienvenido a Copilot</p>
      <p>¿En qué puedo ayudarte hoy?</p>
    </div>
  }
/>
```

---

## 🔄 Flujo de Integración

### Fase 5: Integración en apps/web

**Objetivo**: Integrar componentes compartidos en apps/web mediante CopilotEmbed.

```
┌─────────────────────────────────────────────┐
│       apps/web (puerto 8080)                │
│  ┌──────────────────────────────────────┐   │
│  │  ChatSidebarDirect.tsx               │   │
│  │  ┌────────────────────────────────┐  │   │
│  │  │  CopilotEmbed.tsx              │  │   │
│  │  │  ┌──────────────────────────┐  │  │   │
│  │  │  │  MessageList             │  │  │   │
│  │  │  │  (de copilot-shared)     │  │  │   │
│  │  │  └──────────────────────────┘  │  │   │
│  │  │  ┌──────────────────────────┐  │  │   │
│  │  │  │  InputEditor             │  │  │   │
│  │  │  │  (de copilot-shared)     │  │  │   │
│  │  │  └──────────────────────────┘  │  │   │
│  │  └────────────────────────────────┘  │   │
│  └──────────────────────────────────────┘   │
└───────────┬─────────────────────────────────┘
            │
            │ sendChatMessage() - SSE streaming
            ▼
┌───────────────────────────────┐
│  Backend Python (api-ia)      │
│  api-ia.bodasdehoy.com        │
│                               │
│  POST /api/ai/chat            │
│  GET  /api/ai/getChatMessages │
└───────────────────────────────┘
```

**Flujo**:
1. Usuario escribe mensaje en InputEditor
2. CopilotEmbed llama `sendChatMessage()` (SSE streaming)
3. Backend Python responde con stream
4. CopilotEmbed actualiza MessageList en tiempo real
5. Auto-scroll al final cuando termina

---

### Fase 6: Botón "Ver Completo"

**Objetivo**: Abrir apps/copilot en nueva pestaña con contexto de conversación.

```
┌─────────────────────────────────────────────┐
│       apps/web (puerto 8080)                │
│  ┌──────────────────────────────────────┐   │
│  │  ChatSidebarDirect.tsx               │   │
│  │                                      │   │
│  │  [Ver Completo] ───────────────┐    │   │
│  │  onClick: handleOpenInNewTab() │    │   │
│  │                                 │    │   │
│  └─────────────────────────────────┼────┘   │
└────────────────────────────────────┼────────┘
                                     │
                                     │ window.open()
                                     │ http://localhost:3210?sessionId=xxx&eventName=xxx
                                     ▼
┌─────────────────────────────────────────────┐
│     apps/copilot (puerto 3210)              │
│  ┌──────────────────────────────────────┐   │
│  │  ChatHydration/index.tsx             │   │
│  │                                      │   │
│  │  useEffect(() => {                   │   │
│  │    const params = new URLSearchParams│   │
│  │    const sessionId = params.get(...) │   │
│  │                                      │   │
│  │    // Guardar en localStorage        │   │
│  │    localStorage.setItem(...)         │   │
│  │                                      │   │
│  │    // Mostrar mensaje de contexto    │   │
│  │    store.internal_createMessage(...) │   │
│  │                                      │   │
│  │    // Limpiar URL params             │   │
│  │    window.history.replaceState(...)  │   │
│  │  })                                  │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**URL Params Pasados**:
- `sessionId`: ID de sesión para cargar historial
- `userId`: ID del usuario
- `development`: Ambiente (bodasdehoy, etc.)
- `email`: Email del usuario (opcional)
- `eventId`: ID del evento (opcional)
- `eventName`: Nombre del evento (opcional)

**Flujo**:
1. Usuario click en "Ver Completo"
2. handleOpenInNewTab() construye URL con params
3. window.open() abre nueva pestaña
4. apps/copilot captura params en ChatHydration
5. Guarda contexto en localStorage
6. Muestra mensaje: "Continuando conversación del evento..."
7. Limpia URL params por seguridad

---

## 🧩 Arquitectura de Componentes

### Principio: Prop-Based Components

Todos los componentes compartidos son **controlados** (controlled components):

```typescript
// ❌ MAL: Acoplado a store
const ChatItem = () => {
  const message = useChatStore(state => state.message);  // ❌ Dependencia directa
  return <div>{message.content}</div>;
};

// ✅ BIEN: Prop-based (controlado)
interface ChatItemProps {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  avatar?: { title: string };
  onAction?: (action: string, messageId: string) => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ id, role, message, avatar, onAction }) => {
  return (
    <div>
      <Avatar {...avatar} />
      <div>{message}</div>
      <Actions onAction={(action) => onAction?.(action, id)} />
    </div>
  );
};
```

### Ventajas de Prop-Based

1. ✅ **Reutilizable**: Funciona con cualquier store (Zustand, Redux, Context)
2. ✅ **Testeable**: Fácil de testear sin mocks de stores
3. ✅ **Flexible**: Puede usarse standalone sin stores
4. ✅ **Type-safe**: Props claramente definidas con TypeScript
5. ✅ **Sin dependencias circulares**: No importa de apps/copilot o apps/web

### Jerarquía de Componentes

```
packages/copilot-shared/
│
├── ChatItem                      # Tier 1: Componente base
│   ├── ChatItem.tsx              # Componente principal
│   └── components/
│       ├── Avatar.tsx            # Avatar del usuario/asistente
│       ├── Actions.tsx           # Barra de acciones
│       ├── MessageContent.tsx    # Contenido del mensaje
│       ├── Title.tsx             # Título con timestamp
│       ├── ErrorContent.tsx      # Manejo de errores
│       └── Loading.tsx           # Indicador de carga
│
├── InputEditor                   # Tier 1: Input sin stores
│   ├── InputEditor.tsx           # Input principal con auto-resize
│   └── Placeholder.tsx           # Placeholder con hint
│
└── MessageList                   # Tier 2: Lista de mensajes
    └── MessageList.tsx           # Lista con auto-scroll
```

---

## 🌍 Sistema de i18n

### Estructura

```
packages/copilot-shared/src/i18n/
├── locales/
│   ├── es-ES/
│   │   └── common.json           # Traducciones en español
│   └── en-US/
│       └── common.json           # Traducciones en inglés
├── config.ts                     # Función t() y getTranslations()
└── index.ts                      # Exports
```

### Uso Básico

**Opción 1: Función `t()`**
```typescript
import { t } from '@bodasdehoy/copilot-shared';

const placeholder = t('chat.input.placeholder', 'es-ES');
// => "Escribe un mensaje..."
```

**Opción 2: `getTranslations()`**
```typescript
import { getTranslations } from '@bodasdehoy/copilot-shared';

const translations = getTranslations('en-US');
const { chat } = translations;
// => chat.input.placeholder = "Type a message..."
```

### Traducciones Disponibles

```typescript
{
  "chat": {
    "input": {
      "placeholder": "Escribe un mensaje...",
      "placeholderWithShortcut": "Escribe un mensaje... (Enter para enviar...)",
      "send": "Enviar",
      "sending": "Enviando..."
    },
    "message": {
      "copy": "Copiar",
      "copied": "Copiado",
      "user": "Tú",
      "assistant": "Asistente",
      "system": "Sistema",
      "error": "Error al enviar mensaje"
    },
    "list": {
      "empty": "No hay mensajes todavía",
      "loading": "Cargando mensajes..."
    },
    "actions": {
      "viewComplete": "Ver completo",
      "openInNewTab": "Abrir en nueva pestaña"
    }
  },
  "common": {
    "loading": "Cargando...",
    "error": "Error",
    "retry": "Reintentar",
    "cancel": "Cancelar",
    "close": "Cerrar"
  }
}
```

### Extender con Nuevos Idiomas

```typescript
// 1. Crear archivo de traducción
// packages/copilot-shared/src/i18n/locales/fr-FR/common.json
{
  "chat": {
    "input": {
      "placeholder": "Écrivez un message..."
    }
  }
}

// 2. Importar en config.ts
import frFR from './locales/fr-FR/common.json';

export const translations = {
  'es-ES': esES,
  'en-US': enUS,
  'fr-FR': frFR,  // ✅ Nuevo idioma
};

export type Locale = 'es-ES' | 'en-US' | 'fr-FR';
```

---

## 🎨 Sistema de Temas

### Brand Colors

```typescript
import { brandColors } from '@bodasdehoy/copilot-shared';

export const brandColors = {
  // Primary brand color (BodasdeHoy pink)
  primary: '#FF1493',              // Deep Pink
  primaryHover: '#FF69B4',         // Hot Pink
  primaryActive: '#C71585',        // Medium Violet Red

  // Secondary colors
  secondary: '#FFC0CB',            // Pink (light)

  // Status colors
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff',

  // Neutral colors
  textPrimary: '#262626',
  textSecondary: '#8c8c8c',
  textDisabled: '#bfbfbf',
  border: '#d9d9d9',
  background: '#ffffff',
  backgroundGray: '#f5f5f5',
};
```

### Ant Design Theme

```typescript
import { copilotTheme } from '@bodasdehoy/copilot-shared';
import { ConfigProvider } from 'antd';

export const copilotTheme: ThemeConfig = {
  token: {
    colorPrimary: '#FF1493',       // Brand color
    fontFamily: '"HarmonyOS Sans", "Segoe UI", -apple-system, sans-serif',
    fontSize: 14,
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 36,
      fontWeight: 500,
    },
    Input: {
      borderRadius: 8,
      controlHeight: 36,
    },
    Message: {
      contentBg: '#ffffff',
      contentPadding: '12px 16px',
    },
    // ... más componentes
  },
};
```

### Uso en Apps

**Global (toda la app)**:
```typescript
// apps/web/pages/_app.tsx
import { ConfigProvider } from 'antd';
import { copilotTheme } from '@bodasdehoy/copilot-shared';

function MyApp({ Component, pageProps }) {
  return (
    <ConfigProvider theme={copilotTheme}>
      <Component {...pageProps} />
    </ConfigProvider>
  );
}
```

**Local (componente específico)**:
```typescript
import { ConfigProvider } from 'antd';
import { copilotTheme } from '@bodasdehoy/copilot-shared';

export const MyComponent = () => {
  return (
    <ConfigProvider theme={copilotTheme}>
      <div>Componente con tema BodasdeHoy</div>
    </ConfigProvider>
  );
};
```

**Solo colores (sin Ant Design)**:
```typescript
import { brandColors } from '@bodasdehoy/copilot-shared';

<button style={{ backgroundColor: brandColors.primary }}>
  Click me
</button>
```

---

## 🧠 Decisiones de Diseño

### 1. ¿Por qué Prop-Based Components?

**Problema**: Componentes acoplados a Zustand stores no reutilizables.

**Solución**: Componentes controlados que reciben datos vía props.

**Ventajas**:
- ✅ Funciona con cualquier state management (Zustand, Redux, Context, useState)
- ✅ Testeable sin mocks
- ✅ Sin dependencias circulares
- ✅ Type-safe con TypeScript

**Ejemplo**:
```typescript
// ❌ Acoplado a store
const ChatItem = ({ id }) => {
  const message = useChatStore(s => s.getMessageById(id));  // ❌
  return <div>{message.content}</div>;
};

// ✅ Prop-based
const ChatItem = ({ id, message, avatar, onAction }) => {
  return <div>{message}</div>;
};
```

---

### 2. ¿Por qué Re-exports en apps/copilot?

**Problema**: Mover componentes de apps/copilot a packages/copilot-shared rompería imports existentes.

**Solución**: Re-exports y wrappers mantienen compatibilidad.

**Implementación**:
```typescript
// apps/copilot/src/features/ChatItem/index.ts
// Re-export para compatibilidad
export { ChatItem } from '@bodasdehoy/copilot-shared/ChatItem';
export type * from '@bodasdehoy/copilot-shared/ChatItem';

// Wrapper que conecta store → componente compartido
export const AssistantMessage = ({ id }) => {
  const message = useChatStore(s => s.messages[id]);  // ✅ Store local

  return (
    <ChatItem
      id={message.id}
      role={message.role}
      message={message.content}
      // ... props desde store
    />
  );
};
```

**Resultado**:
- ✅ apps/copilot funciona sin cambios
- ✅ Componentes compartidos disponibles para apps/web
- ✅ Migración gradual sin romper nada

---

### 3. ¿Por qué i18n Propio en lugar de react-i18next?

**Problema**: Agregar react-i18next como peerDependency aumenta bundle y complejidad.

**Solución**: Sistema i18n simple con JSON + función `t()`.

**Ventajas**:
- ✅ Zero dependencies (solo JSON)
- ✅ Type-safe con TypeScript
- ✅ Fácil extender con nuevos idiomas
- ✅ Compatible con sistemas i18n existentes en apps

**Implementación**:
```typescript
export const t = (key: string, locale: Locale = 'es-ES'): string => {
  const trans = getTranslations(locale);
  const keys = key.split('.');
  let value: any = trans;

  for (const k of keys) {
    value = value?.[k];
  }

  return typeof value === 'string' ? value : key;
};
```

---

### 4. ¿Por qué SSE Streaming en apps/web?

**Problema**: Respuestas lentas y sin feedback en tiempo real.

**Solución**: Server-Sent Events (SSE) para streaming de respuestas.

**Ventajas**:
- ✅ Respuestas en tiempo real (palabra por palabra)
- ✅ Mejor UX que esperar respuesta completa
- ✅ Compatible con API existente (backend Python)
- ✅ Fácil de implementar en navegador (EventSource)

**Implementación**:
```typescript
// apps/web/services/copilotChat.ts
export const sendChatMessage = async (
  params: SendMessageParams,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
) => {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal,
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    onChunk(chunk);  // ✅ Actualizar UI en tiempo real
  }
};
```

---

### 5. ¿Por qué Backend Único (api-ia)?

**Problema**: Duplicar lógica de chat en apps/web y apps/copilot.

**Solución**: Backend Python único (api-ia.bodasdehoy.com) como Single Source of Truth.

**Ventajas**:
- ✅ Historial compartido entre apps/web y apps/copilot
- ✅ Sin duplicación de lógica
- ✅ Un solo lugar para debuggear y mejorar
- ✅ Sincronización automática de conversaciones

**API Endpoints**:
```typescript
POST /api/ai/chat              // Enviar mensaje con SSE streaming
GET  /api/ai/getChatMessages   // Obtener historial de chat
```

---

## 📊 Flujo de Datos

### Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Monorepo)                          │
│  ┌──────────────────────────┐  ┌──────────────────────────┐   │
│  │  apps/web (puerto 8080)  │  │ apps/copilot (3210)      │   │
│  │                          │  │                          │   │
│  │  ┌────────────────────┐  │  │  ┌────────────────────┐  │   │
│  │  │  CopilotEmbed      │  │  │  │  LobeChat UI       │  │   │
│  │  │  ┌──────────────┐  │  │  │  │  ┌──────────────┐  │  │   │
│  │  │  │ MessageList  │  │  │  │  │  │  Wrappers    │  │  │   │
│  │  │  │ InputEditor  │  │  │  │  │  │  (stores →   │  │  │   │
│  │  │  │              │  │  │  │  │  │   shared)    │  │  │   │
│  │  │  └──────────────┘  │  │  │  │  └──────────────┘  │  │   │
│  │  │         │          │  │  │  │         │          │  │   │
│  │  │         │ props    │  │  │  │         │ props    │  │   │
│  │  │         ▼          │  │  │  │         ▼          │  │   │
│  │  │  ┌──────────────┐  │  │  │  │  ┌──────────────┐  │  │   │
│  │  │  │@bodasdehoy/  │  │  │  │  │  │@bodasdehoy/  │  │  │   │
│  │  │  │copilot-shared│◀─┼──┼──┼──┼──│copilot-shared│  │  │   │
│  │  │  │              │  │  │  │  │  │              │  │  │   │
│  │  │  │ ChatItem     │  │  │  │  │  │ ChatItem     │  │  │   │
│  │  │  │ InputEditor  │  │  │  │  │  │ InputEditor  │  │  │   │
│  │  │  │ MessageList  │  │  │  │  │  │ MessageList  │  │  │   │
│  │  │  └──────────────┘  │  │  │  │  └──────────────┘  │  │   │
│  │  └────────────────────┘  │  │  └────────────────────┘  │   │
│  └──────────┬───────────────┘  └──────────┬───────────────┘   │
└─────────────┼──────────────────────────────┼──────────────────┘
              │                              │
              │ SSE streaming                │ SSE streaming
              │                              │
              └──────────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  Backend Python (api-ia)     │
              │  api-ia.bodasdehoy.com       │
              │                              │
              │  POST /api/ai/chat           │
              │  GET  /api/ai/getChatMessages│
              │                              │
              │  ┌────────────────────────┐  │
              │  │  PostgreSQL (API2)     │  │
              │  │  - Historial de chats  │  │
              │  │  - Sesiones            │  │
              │  └────────────────────────┘  │
              └──────────────────────────────┘
```

### Flujo de Envío de Mensaje

```
1. Usuario escribe mensaje en InputEditor
   │
   ▼
2. onChange() actualiza state local
   │
   ▼
3. Usuario presiona Enter
   │
   ▼
4. onSend() callback ejecutado
   │
   ▼
5. CopilotEmbed.handleSend()
   │
   ├─ Crea mensaje de usuario (MessageItem)
   │  setMessages([...messages, userMessage])
   │
   ├─ Crea mensaje de asistente vacío con loading: true
   │  setMessages([...messages, assistantMessage])
   │
   ▼
6. sendChatMessage() (SSE streaming)
   │
   ├─ POST /api/ai/chat con params
   │  {
   │    message: "...",
   │    sessionId: "...",
   │    userId: "...",
   │    development: "bodasdehoy",
   │    eventId: "...",
   │    eventName: "..."
   │  }
   │
   ▼
7. Backend Python procesa y envía stream
   │
   ├─ onChunk() ejecutado por cada fragmento
   │  │
   │  ▼
   │  setMessages((prev) => {
   │    // Actualizar mensaje de asistente
   │    assistantMessage.message += chunk;
   │  })
   │
   ▼
8. Stream completo
   │
   ├─ assistantMessage.loading = false
   │
   ▼
9. MessageList auto-scroll al final
   │
   ▼
10. Historial guardado automáticamente en PostgreSQL (API2)
```

### Flujo de Botón "Ver Completo"

```
1. Usuario click en "Ver Completo" en apps/web
   │
   ▼
2. handleOpenInNewTab() ejecutado
   │
   ├─ Construye URL con params:
   │  http://localhost:3210?sessionId=xxx&eventName=xxx&email=xxx
   │
   ▼
3. window.open() abre nueva pestaña
   │
   ▼
4. apps/copilot carga con URL params
   │
   ▼
5. ChatHydration useEffect captura params
   │
   ├─ URLSearchParams extrae:
   │  - sessionId
   │  - eventName
   │  - email
   │  - eventId
   │  - development
   │
   ▼
6. Guardar contexto en localStorage
   │
   localStorage.setItem('copilot-context', JSON.stringify({
     sessionId,
     eventName,
     email,
     timestamp: Date.now()
   }))
   │
   ▼
7. Crear mensaje de contexto
   │
   store.internal_createMessage({
     content: `Continuando conversación del evento "${eventName}"${email ? ` para ${email}` : ''}.`,
     role: 'assistant',
     sessionId: activeId
   })
   │
   ▼
8. Limpiar URL params (seguridad)
   │
   window.history.replaceState({}, '', window.location.pathname)
   │
   ▼
9. Usuario ve conversación completa en apps/copilot
```

---

## 🔗 Comunicación Entre Apps

### apps/web ↔ Backend

**Método**: Fetch API con SSE streaming

**Endpoints**:
```typescript
// Enviar mensaje
POST /api/ai/chat
Body: {
  message: string;
  sessionId: string;
  userId: string;
  development: string;
  eventId?: string;
  eventName?: string;
  pageContext?: PageContext;
}
Response: SSE stream (text/event-stream)

// Obtener historial
GET /api/ai/getChatMessages?sessionId=xxx&development=xxx
Response: {
  data: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
    error?: string;
  }>
}
```

### apps/web → apps/copilot

**Método**: URL params via window.open()

**Flow**:
```typescript
// apps/web/components/ChatSidebar/ChatSidebarDirect.tsx
const handleOpenInNewTab = () => {
  const params = new URLSearchParams({
    sessionId: sessionId || guestSessionId,
    userId: userId,
    development,
    email: user?.email || '',
    eventId: eventId || '',
    eventName: event?.nombre || '',
  });

  const fullUrl = `${copilotUrl}?${params.toString()}`;
  window.open(fullUrl, '_blank', 'noopener,noreferrer');
};

// apps/copilot/.../ChatHydration/index.tsx
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('sessionId');
  // ... capturar y procesar
}, []);
```

### apps/copilot ↔ Backend

**Método**: Fetch API (mismo que apps/web)

**Diferencia**: apps/copilot también usa:
- WebSocket para actualizaciones en tiempo real
- PostgreSQL directo para algunas features (Memories, Artifacts)
- Cloudflare R2 para storage de archivos

---

## 🚀 Extensibilidad

### Agregar Nuevo Componente Compartido

**Ejemplo**: Agregar componente `Toolbar`

```bash
# 1. Crear estructura
mkdir -p packages/copilot-shared/src/Toolbar
cd packages/copilot-shared/src/Toolbar

# 2. Crear archivos
touch Toolbar.tsx types.ts index.ts
```

```typescript
// Toolbar.tsx
export interface ToolbarProps {
  onAction: (action: string) => void;
  disabled?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onAction, disabled }) => {
  return (
    <div className="toolbar">
      <button onClick={() => onAction('bold')} disabled={disabled}>
        Bold
      </button>
      {/* ... más botones */}
    </div>
  );
};

// index.ts
export { Toolbar } from './Toolbar';
export type { ToolbarProps } from './types';
```

```typescript
// packages/copilot-shared/src/index.ts
export { Toolbar } from './Toolbar';
export type { ToolbarProps } from './Toolbar';
```

### Agregar Nuevo Idioma

```bash
# 1. Crear archivo de traducción
mkdir -p packages/copilot-shared/src/i18n/locales/pt-BR
touch packages/copilot-shared/src/i18n/locales/pt-BR/common.json
```

```json
// common.json
{
  "chat": {
    "input": {
      "placeholder": "Digite uma mensagem..."
    }
  }
}
```

```typescript
// config.ts
import ptBR from './locales/pt-BR/common.json';

export const translations = {
  'es-ES': esES,
  'en-US': enUS,
  'pt-BR': ptBR,  // ✅
};

export type Locale = 'es-ES' | 'en-US' | 'pt-BR';
```

### Integrar en Nuevo Proyecto

```typescript
// nuevo-proyecto/src/App.tsx
import { MessageList, InputEditor, copilotTheme } from '@bodasdehoy/copilot-shared';
import { ConfigProvider } from 'antd';
import { useState } from 'react';

export const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSend = (content: string) => {
    // Tu lógica de envío
  };

  return (
    <ConfigProvider theme={copilotTheme}>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <MessageList messages={messages} />
        <InputEditor
          content={input}
          onChange={setInput}
          onSend={handleSend}
        />
      </div>
    </ConfigProvider>
  );
};
```

---

## 📚 Referencias

### Documentación de Fases

- [FASE_1_SETUP_COMPLETADA.md](FASE_1_SETUP_COMPLETADA.md) - Setup inicial del paquete
- [FASE_2_CHATITEM_COMPLETADA.md](FASE_2_CHATITEM_COMPLETADA.md) - Migración de ChatItem
- [FASE_3_INPUTEDITOR_COMPLETADA.md](FASE_3_INPUTEDITOR_COMPLETADA.md) - Creación de InputEditor
- [FASE_4_MESSAGELIST_COMPLETADA.md](FASE_4_MESSAGELIST_COMPLETADA.md) - Creación de MessageList
- [FASE_5_INTEGRACION_WEB_COMPLETADA.md](FASE_5_INTEGRACION_WEB_COMPLETADA.md) - Integración en apps/web
- [FASE_6_BOTON_VER_COMPLETO_COMPLETADA.md](FASE_6_BOTON_VER_COMPLETO_COMPLETADA.md) - Botón "Ver Completo"
- [FASE_7_I18N_STYLING_COMPLETADA.md](FASE_7_I18N_STYLING_COMPLETADA.md) - i18n y Styling

### Archivos Clave

- [packages/copilot-shared/README.md](packages/copilot-shared/README.md) - Documentación del paquete
- [packages/copilot-shared/src/index.ts](packages/copilot-shared/src/index.ts:1) - Exports principales
- [apps/web/components/Copilot/CopilotEmbed.tsx](apps/web/components/Copilot/CopilotEmbed.tsx:69) - Integración en apps/web
- [apps/copilot/src/app/.../ChatHydration/index.tsx](apps/copilot/src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ChatHydration/index.tsx:1) - Captura de URL params

### Enlaces Útiles

- [README.md](README.md) - Documentación principal del monorepo
- [pnpm-workspace.yaml](pnpm-workspace.yaml) - Configuración del workspace
- [ecosystem.config.js](ecosystem.config.js) - PM2 config para despliegue

---

## ✅ Estado del Proyecto

### Fases Completadas

- [x] **Fase 1: Setup** - Estructura de packages/copilot-shared
- [x] **Fase 2: ChatItem** - Componente de mensaje individual
- [x] **Fase 3: InputEditor** - Editor de texto con shortcuts
- [x] **Fase 4: MessageList** - Lista de mensajes con auto-scroll
- [x] **Fase 5: Integración en apps/web** - CopilotEmbed usando componentes compartidos
- [x] **Fase 6: Botón "Ver Completo"** - Abrir apps/copilot en nueva pestaña
- [x] **Fase 7: i18n y Styling** - Sistema de traducciones y tema

### Próximos Pasos

- [ ] **Fase 8: Testing y Docs** (en progreso)
  - [x] Crear documentación de arquitectura (este documento)
  - [ ] Crear guía de contribución
  - [ ] Crear resumen ejecutivo final
  - [ ] Actualizar README principal
  - [ ] Tests unitarios de componentes
  - [ ] Tests de integración end-to-end

---

## 📝 Notas Finales

Esta arquitectura permite:

1. ✅ **apps/copilot standalone**: Funciona independientemente con todas las features de LobeChat
2. ✅ **apps/web con componentes nativos**: Mejor performance que iframe
3. ✅ **Componentes reutilizables**: Futuros proyectos pueden usar copilot-shared
4. ✅ **Prop-based**: Componentes flexibles y testeables
5. ✅ **Backend único**: Single Source of Truth para historial
6. ✅ **Migración gradual**: Re-exports y wrappers evitan breaking changes
7. ✅ **Extensible**: Fácil agregar nuevos componentes, idiomas, y features

**Contacto**: Juan Carlos Parra
**Fecha**: 2026-02-10
