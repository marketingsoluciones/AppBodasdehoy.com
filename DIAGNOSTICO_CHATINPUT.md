# Diagnóstico del Problema del ChatInput

## Problema Reportado
El usuario ve un editor MUY SIMPLE sin botones de formato, cuando debería ver el editor completo de @lobehub/editor con 8 botones.

## Capturas del Usuario
1. **Sidebar izquierdo**: Muestra un input simple con texto "Escribe tu mensaje..."
2. **No hay botones visibles**: Sin toolbar de formato (Bold, Italic, Code, etc.)
3. **Al click en "Ver completo"**: NO navega correctamente

## ¿Qué DEBERÍA Ver el Usuario?

El editor completo de LobeChat con:
- Toolbar con 8+ botones (Bold, Italic, Code, List, Table, Math, Codeblock, etc.)
- Editor contenteditable rico
- Botones de la izquierda para formato
- Botón de enviar a la derecha

## Componentes Involucrados

### 1. ChatInput Compartido (packages/copilot-ui/src/ChatInput/index.tsx)
```tsx
- Usa LobeChatInput de @lobehub/editor/react
- Tiene leftActions con 8 botones
- Tiene showActions = true por defecto
- Renderiza ChatInputActionBar con ChatInputActions
```

### 2. CopilotChatNative (apps/web/components/Copilot/CopilotChatNative.tsx:588)
```tsx
<ChatInput
  value={inputValue}
  onChange={setInputValue}
  onSend={handleSend}
  onStop={handleStop}
  isLoading={isLoading}
  showActions={true}  // ✅ Ahora explícito
/>
```

### 3. ChatSidebar (apps/web/components/ChatSidebar/ChatSidebar.tsx:306)
```tsx
<CopilotChatNative
  userId={userId}
  development={development}
  eventId={eventId}
  eventName={event?.nombre}
  pageContext={pageContext}
  onNavigate={handleNavigate}
  onExpand={handleOpenInNewTab}  // ✅ Navega a /copilot
/>
```

## Posibles Causas

### 1. ❌ Error de Runtime en el Navegador
El componente ChatInput puede estar lanzando un error que hace que se renderice un fallback simple.

**Verificación**:
- Abrir DevTools Console en el navegador
- Buscar errores de React, @lobehub/editor, o ChatInput
- Ver si hay warnings de "Failed to load module"

### 2. ❌ Paquete @lobehub/editor No Instalado en apps/web
El componente compartido depende de @lobehub/editor pero este solo está en peerDependencies.

**Verificación**:
```bash
pnpm --filter @bodasdehoy/web ls @lobehub/editor
```

Si no está instalado, apps/web no puede cargar el componente.

### 3. ❌ CSS de @lobehub/editor No Se Carga
Los botones se renderizan pero están ocultos por falta de estilos.

**Verificación**:
- Buscar en el HTML si los botones están presentes pero ocultos
- Verificar que se carguen los CSS de @lobehub/editor

### 4. ❌ Cache del Navegador
El navegador está sirviendo una versión antigua del código.

**Solución**:
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
- Limpiar cache del navegador
- Cerrar y abrir el navegador

## Plan de Acción

### Paso 1: Verificar Instalación de @lobehub/editor en apps/web
```bash
cd apps/web
pnpm add @lobehub/editor@^1.20.2 @lobehub/ui@^2.13.2
```

### Paso 2: Verificar que el Componente Se Compila
```bash
pnpm --filter @bodasdehoy/copilot-ui typecheck src/ChatInput/index.tsx
```

### Paso 3: Reiniciar Servidor y Limpiar Cache
```bash
# Matar servidor
pkill -f "next dev"

# Limpiar cache de Next.js
rm -rf apps/web/.next

# Reiniciar
cd apps/web && pnpm dev
```

### Paso 4: Verificar en el Navegador
1. Abrir http://localhost:8080
2. Abrir DevTools Console (Cmd+Option+J / F12)
3. Click en "Copilot" en sidebar
4. Buscar errores en Console
5. Inspeccionar el DOM para ver si los botones se renderizan

## Solución Temporal: Verificar que el Editor Funciona en /copilot

Si el problema persiste en el sidebar, verificar que el botón "Abrir Copilot Completo" funcione correctamente:

1. Click en "Abrir Copilot Completo"
2. Debería navegar a /copilot (no abrir nueva pestaña)
3. En /copilot debería ver el LobeChat completo con todos los botones

## Archivos Modificados en Esta Sesión

1. ✅ packages/copilot-ui/src/ChatInput/index.tsx - Componente compartido creado
2. ✅ apps/web/components/Copilot/CopilotChatNative.tsx - Botón "Ver completo" arreglado, showActions explícito
3. ✅ apps/web/pages/copilot.tsx - Usando componente compartido
4. ✅ apps/web/components/ChatSidebar/ChatSidebar.tsx - onExpand configurado correctamente

