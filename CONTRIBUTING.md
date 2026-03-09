# Guía de Contribución

Gracias por tu interés en contribuir al monorepo de BodasdeHoy. Esta guía te ayudará a comenzar.

---

## 📋 Tabla de Contenidos

1. [Configuración del Entorno](#-configuración-del-entorno)
2. [Estructura del Código](#-estructura-del-código)
3. [Convenciones de Código](#-convenciones-de-código)
4. [Agregar Nuevos Componentes](#-agregar-nuevos-componentes)
5. [Sistema de Traducciones](#-sistema-de-traducciones)
6. [Testing](#-testing)
7. [Git Workflow](#-git-workflow)
8. [Pull Requests](#-pull-requests)
9. [Code Review](#-code-review)

---

## 🛠️ Configuración del Entorno

### Requisitos Previos

- **Node.js**: v18.17+ o v20+
- **pnpm**: v8+ (gestor de paquetes)
- **Git**: Para control de versiones

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/bodasdehoy/monorepo.git
cd monorepo

# 2. Instalar dependencias
pnpm install

# 3. Crear archivos de configuración (si no existen)
cp apps/web/.env.example apps/web/.env.local
cp apps/copilot/.env.example apps/copilot/.env

# 4. Iniciar apps en modo desarrollo
pnpm dev:local  # Inicia web (8080) y copilot (3210)
```

### Verificar Instalación

```bash
# Verificar apps/web
curl http://localhost:8080

# Verificar apps/copilot
curl http://localhost:3210

# Verificar TypeScript
pnpm --filter @bodasdehoy/copilot-shared type-check
```

---

## 📂 Estructura del Código

### Monorepo Layout

```
├── apps/
│   ├── web/                  # Organizador de eventos (Next.js Pages Router)
│   └── copilot/              # Chat IA standalone (Next.js App Router)
│
├── packages/
│   ├── copilot-shared/       # Componentes compartidos prop-based
│   └── shared/               # Utilidades compartidas
│
├── docs/                     # Documentación
├── scripts/                  # Scripts útiles
└── ecosystem.config.js       # PM2 config
```

### packages/copilot-shared

```
packages/copilot-shared/
├── src/
│   ├── ChatItem/             # Componente de mensaje individual
│   ├── InputEditor/          # Editor de texto
│   ├── MessageList/          # Lista de mensajes
│   ├── i18n/                 # Sistema de traducciones
│   ├── theme/                # Tema Ant Design
│   └── index.ts              # Exports principales
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📏 Convenciones de Código

### TypeScript

**Tipos explícitos en interfaces públicas**:
```typescript
// ✅ BIEN: Props con tipos explícitos
export interface ChatItemProps {
  id: string;
  role: 'user' | 'assistant' | 'system';
  message: string;
  avatar?: {
    src?: string;
    title?: string;
  };
  onAction?: (action: string, messageId: string) => void;
}

// ❌ MAL: any o tipos implícitos
export interface ChatItemProps {
  data: any;  // ❌
  onAction?: Function;  // ❌
}
```

**Usar type inferencia internamente**:
```typescript
// ✅ BIEN: Inferir tipo de retorno
const formatDate = (date: Date) => {
  return date.toISOString();  // string inferido
};

// ❌ MAL: Redundante
const formatDate = (date: Date): string => {
  return date.toISOString();
};
```

### React Components

**Componentes funcionales con FC**:
```typescript
// ✅ BIEN
export const ChatItem: React.FC<ChatItemProps> = ({ id, message, onAction }) => {
  return <div>{message}</div>;
};

// ❌ MAL: No usar FC
export const ChatItem = (props: ChatItemProps) => {
  return <div>{props.message}</div>;
};
```

**Prop-based (controlados)**:
```typescript
// ✅ BIEN: Recibe datos vía props
export const InputEditor: React.FC<InputEditorProps> = ({ content, onChange }) => {
  return (
    <textarea
      value={content}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

// ❌ MAL: Estado interno
export const InputEditor = () => {
  const [content, setContent] = useState('');  // ❌ Estado interno
  return <textarea value={content} />;
};
```

**Destructuring de props**:
```typescript
// ✅ BIEN
export const ChatItem: React.FC<ChatItemProps> = ({
  id,
  message,
  avatar,
  onAction
}) => {
  return <div>{message}</div>;
};

// ❌ MAL
export const ChatItem: React.FC<ChatItemProps> = (props) => {
  return <div>{props.message}</div>;
};
```

### Naming Conventions

**Componentes**: PascalCase
```typescript
// ✅ BIEN
ChatItem.tsx
InputEditor.tsx
MessageList.tsx

// ❌ MAL
chatItem.tsx
input-editor.tsx
message_list.tsx
```

**Archivos de utilidades**: camelCase
```typescript
// ✅ BIEN
formatDate.ts
sendChatMessage.ts

// ❌ MAL
FormatDate.ts
send-chat-message.ts
```

**Constantes**: UPPER_SNAKE_CASE
```typescript
// ✅ BIEN
export const MAX_MESSAGE_LENGTH = 1000;
export const DEFAULT_LOCALE = 'es-ES';

// ❌ MAL
export const maxMessageLength = 1000;
export const defaultLocale = 'es-ES';
```

**Hooks**: camelCase con prefijo `use`
```typescript
// ✅ BIEN
useChatMessages.ts
useMessageActions.ts

// ❌ MAL
ChatMessages.ts
messageActions.ts
```

### Imports

**Orden de imports**:
```typescript
// 1. React y frameworks
import { FC, useState, useEffect } from 'react';
import { ConfigProvider } from 'antd';

// 2. Paquetes externos
import clsx from 'clsx';

// 3. Paquetes internos del monorepo
import { ChatItem } from '@bodasdehoy/copilot-shared';

// 4. Imports relativos
import { formatDate } from '../../utils/formatDate';
import { sendChatMessage } from '../../services/copilotChat';

// 5. Types
import type { ChatItemProps } from './types';

// 6. Estilos
import styles from './ChatItem.module.css';
```

**Usar imports nombrados** (no default exports en paquetes compartidos):
```typescript
// ✅ BIEN
export { ChatItem } from './ChatItem';
import { ChatItem } from '@bodasdehoy/copilot-shared';

// ❌ MAL
export default ChatItem;
import ChatItem from '@bodasdehoy/copilot-shared';
```

### Comentarios

**JSDoc para componentes públicos**:
```typescript
/**
 * ChatItem component for rendering individual chat messages.
 *
 * @example
 * ```tsx
 * <ChatItem
 *   id="msg_123"
 *   role="assistant"
 *   message="Hello world"
 *   onAction={(action, id) => console.log(action, id)}
 * />
 * ```
 */
export const ChatItem: React.FC<ChatItemProps> = ({ ... }) => {
  // ...
};
```

**Comentarios inline para lógica compleja**:
```typescript
// Calcular posición del scroll considerando el padding del contenedor
const scrollPosition = containerHeight - (paddingTop + paddingBottom);
```

**Evitar comentarios obvios**:
```typescript
// ❌ MAL: Comentario obvio
// Set loading to true
setLoading(true);

// ✅ BIEN: Sin comentario (obvio)
setLoading(true);
```

---

## ➕ Agregar Nuevos Componentes

### 1. Crear Estructura de Archivos

```bash
# Ejemplo: Agregar componente Toolbar
cd packages/copilot-shared/src
mkdir Toolbar
cd Toolbar

# Crear archivos
touch Toolbar.tsx
touch types.ts
touch style.ts  # (opcional)
touch index.ts
```

### 2. Definir Interface (types.ts)

```typescript
// packages/copilot-shared/src/Toolbar/types.ts
export interface ToolbarProps {
  /**
   * Callback cuando se ejecuta una acción
   */
  onAction: (action: string) => void;

  /**
   * Deshabilitar toolbar
   */
  disabled?: boolean;

  /**
   * Acciones disponibles
   */
  actions?: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
  }>;
}
```

### 3. Implementar Componente (Toolbar.tsx)

```typescript
// packages/copilot-shared/src/Toolbar/Toolbar.tsx
import { FC } from 'react';
import type { ToolbarProps } from './types';

/**
 * Toolbar component for chat actions.
 *
 * @example
 * ```tsx
 * <Toolbar
 *   onAction={(action) => console.log(action)}
 *   actions={[
 *     { id: 'bold', label: 'Bold' },
 *     { id: 'italic', label: 'Italic' },
 *   ]}
 * />
 * ```
 */
export const Toolbar: FC<ToolbarProps> = ({
  onAction,
  disabled = false,
  actions = [],
}) => {
  return (
    <div className="toolbar">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.id)}
          disabled={disabled}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
};
```

### 4. Crear Index (index.ts)

```typescript
// packages/copilot-shared/src/Toolbar/index.ts
export { Toolbar } from './Toolbar';
export type { ToolbarProps } from './types';
```

### 5. Exportar en packages/copilot-shared/src/index.ts

```typescript
// packages/copilot-shared/src/index.ts
// ...

// Export Toolbar component and types
export { Toolbar } from './Toolbar';
export type { ToolbarProps } from './Toolbar';
```

### 6. Verificar TypeScript

```bash
cd packages/copilot-shared
pnpm type-check
```

### 7. Documentar en README

Agregar sección en `packages/copilot-shared/README.md`:

```markdown
### Toolbar ✅

Componente para acciones de toolbar.

**Características**:
- Prop-based (controlado)
- Acciones configurables
- Soporte para disabled
- Icons opcionales

**Uso**:
\`\`\`typescript
<Toolbar
  onAction={(action) => console.log(action)}
  actions={[
    { id: 'bold', label: 'Bold' },
    { id: 'italic', label: 'Italic' },
  ]}
/>
\`\`\`
```

---

## 🌍 Sistema de Traducciones

### Agregar Nuevo Idioma

**Ejemplo**: Agregar francés (fr-FR)

#### 1. Crear Archivo de Traducciones

```bash
mkdir -p packages/copilot-shared/src/i18n/locales/fr-FR
touch packages/copilot-shared/src/i18n/locales/fr-FR/common.json
```

```json
// packages/copilot-shared/src/i18n/locales/fr-FR/common.json
{
  "chat": {
    "input": {
      "placeholder": "Écrivez un message...",
      "placeholderWithShortcut": "Écrivez un message... (Enter pour envoyer, Shift+Enter pour nouvelle ligne)",
      "send": "Envoyer",
      "sending": "Envoi..."
    },
    "message": {
      "copy": "Copier",
      "copied": "Copié",
      "user": "Vous",
      "assistant": "Assistant",
      "system": "Système",
      "error": "Erreur lors de l'envoi du message"
    },
    "list": {
      "empty": "Aucun message pour le moment",
      "loading": "Chargement des messages..."
    },
    "actions": {
      "viewComplete": "Voir complet",
      "openInNewTab": "Ouvrir dans un nouvel onglet"
    }
  },
  "common": {
    "loading": "Chargement...",
    "error": "Erreur",
    "retry": "Réessayer",
    "cancel": "Annuler",
    "close": "Fermer"
  }
}
```

#### 2. Actualizar config.ts

```typescript
// packages/copilot-shared/src/i18n/config.ts
import esES from './locales/es-ES/common.json';
import enUS from './locales/en-US/common.json';
import frFR from './locales/fr-FR/common.json';  // ✅ Importar

export type Locale = 'es-ES' | 'en-US' | 'fr-FR';  // ✅ Agregar tipo

export const translations: Record<Locale, Translations> = {
  'es-ES': esES,
  'en-US': enUS,
  'fr-FR': frFR,  // ✅ Agregar
};

export const defaultLocale: Locale = 'es-ES';

// Exports nombrados para cada locale
export { esES, enUS, frFR };  // ✅ Exportar
```

#### 3. Actualizar index.ts

```typescript
// packages/copilot-shared/src/i18n/index.ts
export {
  translations,
  defaultLocale,
  getTranslations,
  t,
  esES,
  enUS,
  frFR,  // ✅ Exportar
} from './config';
export type { Translations, Locale } from './config';
```

#### 4. Verificar TypeScript

```bash
cd packages/copilot-shared
pnpm type-check
```

### Agregar Nueva Clave de Traducción

**Ejemplo**: Agregar traducción para "Delete"

#### 1. Actualizar todos los archivos de idiomas

```json
// packages/copilot-shared/src/i18n/locales/es-ES/common.json
{
  "chat": {
    "message": {
      "copy": "Copiar",
      "delete": "Eliminar"  // ✅ Agregar
    }
  }
}
```

```json
// packages/copilot-shared/src/i18n/locales/en-US/common.json
{
  "chat": {
    "message": {
      "copy": "Copy",
      "delete": "Delete"  // ✅ Agregar
    }
  }
}
```

```json
// packages/copilot-shared/src/i18n/locales/fr-FR/common.json (si existe)
{
  "chat": {
    "message": {
      "copy": "Copier",
      "delete": "Supprimer"  // ✅ Agregar
    }
  }
}
```

#### 2. Usar en componente

```typescript
import { t } from '@bodasdehoy/copilot-shared';

const deleteLabel = t('chat.message.delete', 'es-ES');
// => "Eliminar"
```

---

## 🧪 Testing

### Estructura de Tests

```
packages/copilot-shared/
├── src/
│   ├── ChatItem/
│   │   ├── ChatItem.tsx
│   │   ├── __tests__/
│   │   │   └── ChatItem.test.tsx
│   │   └── index.ts
│   └── InputEditor/
│       ├── InputEditor.tsx
│       ├── __tests__/
│       │   └── InputEditor.test.tsx
│       └── index.ts
└── package.json
```

### Test Unitario - Ejemplo

```typescript
// packages/copilot-shared/src/ChatItem/__tests__/ChatItem.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatItem } from '../ChatItem';

describe('ChatItem', () => {
  it('renders message content', () => {
    render(
      <ChatItem
        id="msg_1"
        role="user"
        message="Hello world"
      />
    );

    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('calls onAction when copy is clicked', () => {
    const onAction = jest.fn();

    render(
      <ChatItem
        id="msg_1"
        role="user"
        message="Test message"
        onAction={onAction}
      />
    );

    const copyButton = screen.getByLabelText('Copiar');
    fireEvent.click(copyButton);

    expect(onAction).toHaveBeenCalledWith('copy', 'msg_1');
  });

  it('shows loading state', () => {
    render(
      <ChatItem
        id="msg_1"
        role="assistant"
        message=""
        loading
      />
    );

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(
      <ChatItem
        id="msg_1"
        role="assistant"
        message="Failed"
        error={{ message: 'Error sending message' }}
      />
    );

    expect(screen.getByText('Error sending message')).toBeInTheDocument();
  });
});
```

### Test de Integración - Ejemplo

```typescript
// apps/web/components/Copilot/__tests__/CopilotEmbed.integration.test.tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CopilotEmbed } from '../CopilotEmbed';
import * as copilotChat from '../../../services/copilotChat';

jest.mock('../../../services/copilotChat');

describe('CopilotEmbed Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads chat history on mount', async () => {
    const mockHistory = [
      { id: 'msg_1', role: 'user', content: 'Hello', createdAt: new Date() },
      { id: 'msg_2', role: 'assistant', content: 'Hi!', createdAt: new Date() },
    ];

    (copilotChat.getChatHistory as jest.Mock).mockResolvedValue(mockHistory);

    render(
      <CopilotEmbed
        userId="user_1"
        sessionId="session_1"
        development="bodasdehoy"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi!')).toBeInTheDocument();
    });
  });

  it('sends message with streaming', async () => {
    (copilotChat.getChatHistory as jest.Mock).mockResolvedValue([]);
    (copilotChat.sendChatMessage as jest.Mock).mockImplementation(
      async (params, onChunk) => {
        onChunk('Hello ');
        onChunk('world');
      }
    );

    render(
      <CopilotEmbed
        userId="user_1"
        sessionId="session_1"
        development="bodasdehoy"
      />
    );

    const input = screen.getByPlaceholderText('Escribe un mensaje...');
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByText(/Hello world/)).toBeInTheDocument();
    });
  });
});
```

### Ejecutar Tests

```bash
# Todos los tests
pnpm test

# Tests de un paquete específico
pnpm --filter @bodasdehoy/copilot-shared test

# Tests con coverage
pnpm test -- --coverage

# Tests en watch mode
pnpm test -- --watch
```

---

## 🌿 Git Workflow

### Branches

**Main branches**:
- `master`: Rama principal de producción
- `develop`: Rama de desarrollo (si aplica)

**Feature branches**:
```bash
# Formato: feature/descripcion-corta
git checkout -b feature/add-toolbar-component

# Formato: fix/descripcion-corta
git checkout -b fix/input-editor-autofocus
```

### Commits

**Formato**: Conventional Commits

```bash
# Formato general
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: Nueva feature
- `fix`: Bug fix
- `docs`: Documentación
- `style`: Formato (no afecta código)
- `refactor`: Refactorización
- `test`: Tests
- `chore`: Mantenimiento

**Ejemplos**:
```bash
# Feature
git commit -m "feat(copilot-shared): add Toolbar component"

# Bug fix
git commit -m "fix(InputEditor): auto-focus not working on mount"

# Documentation
git commit -m "docs(README): update installation instructions"

# Refactor
git commit -m "refactor(ChatItem): extract Avatar to separate component"

# Multiple lines
git commit -m "feat(copilot-shared): add i18n system

- Add translations for es-ES, en-US
- Add t() function for translation
- Add getTranslations() helper
- Update exports in index.ts"
```

### Pull from Remote

```bash
# Antes de empezar a trabajar, actualizar master
git checkout master
git pull origin master

# Crear feature branch desde master actualizado
git checkout -b feature/new-component
```

### Push Changes

```bash
# Verificar cambios
git status
git diff

# Agregar archivos
git add packages/copilot-shared/src/Toolbar/

# Commit con mensaje descriptivo
git commit -m "feat(copilot-shared): add Toolbar component"

# Push a remote
git push origin feature/new-component
```

---

## 📝 Pull Requests

### Crear Pull Request

1. **Push tu branch** al repositorio remoto
```bash
git push origin feature/new-component
```

2. **Crear PR en GitHub/GitLab**
   - Título descriptivo (mismo que commit principal)
   - Descripción detallada de cambios
   - Referencias a issues (si aplica)

### Template de PR

```markdown
## Descripción

Breve descripción de los cambios realizados.

## Tipo de Cambio

- [ ] Bug fix
- [ ] Nueva feature
- [ ] Breaking change
- [ ] Documentación

## ¿Cómo se ha Testeado?

Describe los tests que ejecutaste para verificar tus cambios.

- [ ] Tests unitarios pasando
- [ ] Tests de integración pasando
- [ ] TypeScript sin errores
- [ ] Verificación manual en apps/web
- [ ] Verificación manual en apps/copilot

## Checklist

- [ ] Mi código sigue las convenciones del proyecto
- [ ] He realizado self-review de mi código
- [ ] He comentado áreas complejas del código
- [ ] He actualizado la documentación correspondiente
- [ ] Mis cambios no generan nuevos warnings
- [ ] He agregado tests que prueban mi fix/feature
- [ ] Tests unitarios y de integración pasan localmente
- [ ] Cambios dependientes han sido mergeados

## Screenshots (si aplica)

Agregar screenshots de cambios visuales.

## Notas Adicionales

Cualquier información adicional relevante para el reviewer.
```

### Ejemplo de PR

```markdown
## Descripción

Agrega componente Toolbar para acciones de formato en el chat.

Este componente permite ejecutar acciones como:
- Bold
- Italic
- Code block
- Link

## Tipo de Cambio

- [x] Nueva feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentación

## ¿Cómo se ha Testeado?

- [x] Tests unitarios: `Toolbar.test.tsx` (100% coverage)
- [x] TypeScript: Sin errores de compilación
- [x] Verificación manual en apps/web:
  - Toolbar renderiza correctamente
  - Acciones funcionan
  - Disabled state funciona
- [x] Verificación manual en apps/copilot:
  - Re-export funciona correctamente

## Checklist

- [x] Mi código sigue las convenciones del proyecto
- [x] He realizado self-review de mi código
- [x] He comentado áreas complejas del código
- [x] He actualizado la documentación correspondiente
- [x] Mis cambios no generan nuevos warnings
- [x] He agregado tests que prueban mi feature
- [x] Tests unitarios y de integración pasan localmente

## Screenshots

[Agregar screenshots del Toolbar en acción]

## Notas Adicionales

Este componente sigue el patrón prop-based establecido en copilot-shared.
Se puede extender fácilmente agregando nuevas acciones al array `actions`.
```

---

## 👀 Code Review

### Checklist para Reviewers

#### Funcionalidad
- [ ] El código hace lo que dice hacer
- [ ] Los casos edge están cubiertos
- [ ] No hay bugs obvios
- [ ] La lógica es clara y correcta

#### Código
- [ ] Sigue convenciones del proyecto
- [ ] Nombres descriptivos (variables, funciones, componentes)
- [ ] Código DRY (no repetición)
- [ ] Funciones pequeñas y enfocadas
- [ ] Comentarios donde son necesarios

#### TypeScript
- [ ] Tipos explícitos en interfaces públicas
- [ ] No usa `any` (sin justificación)
- [ ] Props correctamente tipadas
- [ ] Sin errores de TypeScript

#### Testing
- [ ] Tests unitarios presentes
- [ ] Tests cubren casos principales
- [ ] Tests cubren casos edge
- [ ] Tests pasan correctamente

#### Performance
- [ ] No hay renders innecesarios
- [ ] Usa `useCallback`/`useMemo` apropiadamente
- [ ] No hay memory leaks
- [ ] Imágenes/assets optimizados

#### Seguridad
- [ ] No hay XSS vulnerabilities
- [ ] No hay SQL injection (si aplica)
- [ ] No hay secrets en código
- [ ] Input validation apropiado

#### Documentación
- [ ] README actualizado (si aplica)
- [ ] JSDoc en componentes públicos
- [ ] Comentarios en lógica compleja
- [ ] CHANGELOG actualizado (si aplica)

### Proceso de Review

1. **Leer descripción del PR** completa
2. **Verificar que pasan CI/CD** (tests, lint, type-check)
3. **Revisar archivos cambiados** uno por uno
4. **Dejar comentarios** inline donde sea necesario
5. **Probar localmente** (si es feature visual o compleja)
6. **Aprobar o pedir cambios** con comentario de resumen

### Tipos de Comentarios

**Pregunta**:
```markdown
❓ ¿Por qué usaste `useEffect` aquí en lugar de `useLayoutEffect`?
```

**Sugerencia**:
```markdown
💡 Considera usar `useCallback` para esta función que se pasa como prop:

\`\`\`typescript
const handleAction = useCallback((action: string) => {
  // ...
}, [dependency]);
\`\`\`
```

**Blocker** (debe cambiarse antes de merge):
```markdown
🚫 Este código tiene un memory leak. El `useEffect` debe limpiar el event listener:

\`\`\`typescript
useEffect(() => {
  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
\`\`\`
```

**Elogio**:
```markdown
✅ Excelente uso de TypeScript generics aquí. Muy limpio.
```

### Ejemplo de Review Comment

```markdown
## General

Excelente trabajo con el componente Toolbar. El código es limpio y sigue las convenciones. Solo algunos comentarios menores.

## Comentarios Específicos

### packages/copilot-shared/src/Toolbar/Toolbar.tsx:15

💡 **Sugerencia**: Considera usar `useCallback` para `handleClick`:

\`\`\`typescript
const handleClick = useCallback((actionId: string) => {
  onAction(actionId);
}, [onAction]);
\`\`\`

Esto evitará re-renders innecesarios de los botones.

### packages/copilot-shared/src/Toolbar/Toolbar.tsx:25

❓ **Pregunta**: ¿Es necesario el `disabled` en cada botón individual? Pensé que el prop `disabled` del Toolbar ya los deshabilitaba todos.

### packages/copilot-shared/src/Toolbar/__tests__/Toolbar.test.tsx

✅ Excelente coverage de tests. 100% de líneas cubiertas.

## Aprobación

Aprobado con comentarios menores. No es necesario re-review después de cambios sugeridos.
```

---

## 📚 Recursos Adicionales

### Documentación

- [ARQUITECTURA_MONOREPO.md](ARQUITECTURA_MONOREPO.md) - Arquitectura completa
- [packages/copilot-shared/README.md](packages/copilot-shared/README.md) - Docs de componentes compartidos
- [README.md](README.md) - Documentación principal

### Guías de Estilo

- [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [Conventional Commits](https://www.conventionalcommits.org/)

### Tools

- **TypeScript**: Type checking
- **ESLint**: Linting
- **Prettier**: Code formatting
- **Jest**: Testing
- **React Testing Library**: Component testing

---

## 🤝 Comunidad

### Canales de Comunicación

- **GitHub Issues**: Para bugs y feature requests
- **GitHub Discussions**: Para preguntas y discusiones
- **Slack**: Para comunicación en tiempo real (si aplica)

### Reportar Bugs

Al reportar un bug, incluye:

1. **Descripción clara** del problema
2. **Pasos para reproducir**
3. **Comportamiento esperado**
4. **Comportamiento actual**
5. **Screenshots** (si aplica)
6. **Entorno** (OS, Node version, browser)

### Sugerir Features

Al sugerir una feature, incluye:

1. **Descripción clara** de la feature
2. **Problema que resuelve**
3. **Propuesta de solución**
4. **Alternativas consideradas**
5. **Ejemplos de uso**

---

## 📄 Licencia

Este proyecto es privado y propietario de BodasdeHoy.

---

**¡Gracias por contribuir!** 🎉

Si tienes preguntas, no dudes en abrir un issue o contactar al equipo.
