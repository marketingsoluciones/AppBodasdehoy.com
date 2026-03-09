# 📋 Plan: Vista Completa abre LobeChat

**Fecha**: 2026-02-04
**Objetivo**: Asegurar que el botón "Ver completo" abra LobeChat completo con toda la funcionalidad y contexto preservado

---

## 🎯 Situación Actual

### ✅ Lo que YA está implementado

1. **Botón "Ver completo"** existe en ChatSidebar
   - Ubicación: [apps/web/components/ChatSidebar/ChatSidebar.tsx:258-266](apps/web/components/ChatSidebar/ChatSidebar.tsx#L258-L266)
   - Label: "Ver completo" con icono IoOpenOutline
   - Handler: `handleOpenInNewTab()`

2. **Función handleOpenInNewTab**
   - Ubicación: [apps/web/components/ChatSidebar/ChatSidebar.tsx:195-214](apps/web/components/ChatSidebar/ChatSidebar.tsx#L195-L214)
   - Abre: `https://chat-test.bodasdehoy.com/{development}/chat`
   - Parámetros que pasa:
     - `email` - Email del usuario (si logged in)
     - `eventId` - ID del evento actual
     - `sessionId` - Session ID del guest (si guest)

3. **Variable de entorno**
   - `NEXT_PUBLIC_CHAT=https://chat-test.bodasdehoy.com`
   - Configurado en `.env.local` y `.env.production`

---

## 🔍 Análisis del Flujo

### Paso 1: Usuario hace click en "Ver completo"
```
[ChatSidebar] Usuario click en botón "Ver completo"
     ↓
handleOpenInNewTab() se ejecuta
     ↓
Construye URL: https://chat-test.bodasdehoy.com/bodasdehoy/chat?email=...&eventId=...
     ↓
window.open(url, '_blank', 'noopener,noreferrer')
     ↓
Nueva pestaña con LobeChat completo
```

### Paso 2: LobeChat recibe parámetros

LobeChat en chat-test debe:
1. ✅ Leer `email` de query params
2. ✅ Leer `eventId` de query params
3. ✅ Leer `sessionId` de query params (para guests)
4. ✅ Cargar conversación existente (si hay)
5. ✅ Mantener contexto del evento

---

## ⚠️ Problemas Potenciales a Verificar

### 1. ¿Chat-test está configurado para recibir estos parámetros?

**Verificar**: ¿El código de LobeChat en `/apps/copilot` lee estos query params?

**Archivos a revisar**:
- `/apps/copilot/src/app/[variants]/(main)/chat/(workspace)/_layout/Desktop/index.tsx`
- `/apps/copilot/src/app/[variants]/(main)/page.tsx`
- Cualquier archivo que maneje la inicialización del chat

**Lo que debe hacer**:
```typescript
// En chat-test, al cargar:
const searchParams = useSearchParams();
const email = searchParams.get('email');
const eventId = searchParams.get('eventId');
const sessionId = searchParams.get('sessionId');

// Si hay email, auto-login o cargar usuario
// Si hay eventId, cargar contexto del evento
// Si hay sessionId, recuperar conversación guest
```

### 2. ¿Se preserva la conversación?

**Problema**: Si el usuario tiene una conversación en el sidebar embebido, al abrir "Ver completo" debería ver la misma conversación, NO empezar de cero.

**Solución**: Pasar `conversationId` o `sessionId` para que LobeChat cargue el historial.

**Modificación necesaria**:
```typescript
// En handleOpenInNewTab (ChatSidebar.tsx:195)
const params = new URLSearchParams();
// ... parámetros actuales ...

// AÑADIR: conversationId para preservar historial
const conversationId = getCurrentConversationId(); // Obtener del estado del chat
if (conversationId) {
  params.set('conversationId', conversationId);
}
```

### 3. ¿Se pasa el pageContext completo?

**Problema**: El sidebar tiene `pageContext` con info del evento (invitados, presupuesto, etc.). ¿Se pasa a LobeChat completo?

**Solución**: Pasar `pageContext` serializado en query params o usar API.

**Opciones**:
- **A) Query params** (limitado por tamaño de URL)
- **B) localStorage/sessionStorage** (mejor opción)
- **C) API call** (más robusto)

**Implementación recomendada (opción B)**:
```typescript
// En handleOpenInNewTab
const handleOpenInNewTab = useCallback(() => {
  // Guardar contexto en sessionStorage antes de abrir
  sessionStorage.setItem('copilot_context', JSON.stringify({
    pageContext,
    userId,
    development,
    eventId,
    eventName: event?.nombre,
  }));

  // ... resto del código actual ...
}, [pageContext, userId, development, eventId, event]);

// En chat-test, al cargar:
const savedContext = sessionStorage.getItem('copilot_context');
if (savedContext) {
  const context = JSON.parse(savedContext);
  // Usar context para inicializar
  sessionStorage.removeItem('copilot_context'); // Limpiar
}
```

### 4. ¿Chat-test tiene TODAS las funcionalidades?

**Verificar**: ¿El chat-test.bodasdehoy.com tiene:
- ✅ Todas las 15+ acciones del editor (model, search, typo, etc.)
- ✅ Panel lateral derecho (ChatHeader, TopicPanel)
- ✅ Sin modo `minimal=1` ni `embed=1`
- ✅ Contexto conversacional preservado

**Si NO tiene**, aplicar los mismos fixes del sidebar:
1. Desactivar auto-colapso en ActionBar
2. Forzar modo Desktop
3. NO pasar `minimal=1` en la URL

---

## ✅ Plan de Implementación

### Fase 1: Verificación (15 minutos)

1. **Probar flujo actual**:
```bash
# Abrir app-test
open https://app-test.bodasdehoy.com

# Hacer login
# Abrir sidebar chat
# Click en "Ver completo"
# Verificar:
# - ¿Abre chat-test en nueva pestaña? ✅/❌
# - ¿Tiene editor completo (15+ iconos)? ✅/❌
# - ¿Se pierde la conversación? ✅/❌
# - ¿Se mantiene el contexto del evento? ✅/❌
```

2. **Verificar URL generada**:
```javascript
// En DevTools Console del sidebar:
console.log(process.env.NEXT_PUBLIC_CHAT);
// Debería ser: https://chat-test.bodasdehoy.com

// Copiar URL que se abre al hacer click
// Ejemplo: https://chat-test.bodasdehoy.com/bodasdehoy/chat?email=juan@ejemplo.com&eventId=123
```

3. **Verificar que chat-test recibe params**:
```javascript
// En DevTools Console de la nueva pestaña (chat-test):
const params = new URLSearchParams(window.location.search);
console.log('Email:', params.get('email'));
console.log('EventId:', params.get('eventId'));
console.log('SessionId:', params.get('sessionId'));
```

---

### Fase 2: Fixes Necesarios (según hallazgos)

#### Fix A: Chat-test no lee parámetros de URL

**Problema**: LobeChat no inicializa con los params de la URL.

**Solución**: Añadir lógica de inicialización en chat-test.

**Archivo**: `/apps/copilot/src/app/[variants]/(main)/page.tsx` o similar

```typescript
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function ChatPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const email = searchParams?.get('email');
    const eventId = searchParams?.get('eventId');
    const sessionId = searchParams?.get('sessionId');

    if (email) {
      // Auto-login o cargar usuario
      console.log('Inicializando con usuario:', email);
    }

    if (eventId) {
      // Cargar contexto del evento
      console.log('Cargando evento:', eventId);
    }

    if (sessionId) {
      // Recuperar sesión guest
      console.log('Recuperando sesión:', sessionId);
    }
  }, [searchParams]);

  return <ChatLayout />;
}
```

---

#### Fix B: Preservar conversación al abrir en nueva pestaña

**Problema**: La conversación se pierde al abrir chat-test.

**Solución**: Pasar conversationId y cargar historial.

**Archivo**: `/apps/web/components/ChatSidebar/ChatSidebar.tsx`

```typescript
// Añadir conversationId a los params
const handleOpenInNewTab = useCallback(() => {
  const baseUrl = process.env.NEXT_PUBLIC_CHAT || 'https://chat-test.bodasdehoy.com';
  const params = new URLSearchParams();

  // ... parámetros actuales ...

  // NUEVO: Obtener conversationId del estado del chat
  // (Esto requiere exponer conversationId desde CopilotChatNative)
  const conversationId = window.sessionStorage.getItem('current_conversation_id');
  if (conversationId) {
    params.set('conversationId', conversationId);
  }

  // ... resto del código ...
}, [/* deps */]);
```

**En CopilotChatNative**, guardar conversationId:
```typescript
// Cuando se crea o cambia la conversación
useEffect(() => {
  if (conversationId) {
    window.sessionStorage.setItem('current_conversation_id', conversationId);
  }
}, [conversationId]);
```

**En chat-test**, cargar conversación:
```typescript
useEffect(() => {
  const conversationId = searchParams?.get('conversationId');
  if (conversationId) {
    // Cargar historial de la conversación
    loadConversation(conversationId);
  }
}, [searchParams]);
```

---

#### Fix C: Pasar pageContext completo

**Problema**: Chat-test no tiene el contexto del evento.

**Solución**: Usar sessionStorage para pasar contexto.

**Archivo**: `/apps/web/components/ChatSidebar/ChatSidebar.tsx`

```typescript
const handleOpenInNewTab = useCallback(() => {
  // Guardar contexto en sessionStorage ANTES de abrir
  const contextToPass = {
    pageContext,
    userId,
    development,
    eventId,
    eventName: event?.nombre,
    timestamp: Date.now(),
  };

  sessionStorage.setItem('copilot_open_context', JSON.stringify(contextToPass));

  // ... resto del código actual ...

  const fullUrl = `${baseUrl}/${development}/chat${params.toString() ? '?' + params.toString() : ''}`;
  window.open(fullUrl, '_blank', 'noopener,noreferrer');
}, [pageContext, userId, development, eventId, event]);
```

**En chat-test** (recuperar contexto):
```typescript
useEffect(() => {
  const savedContext = sessionStorage.getItem('copilot_open_context');
  if (savedContext) {
    try {
      const context = JSON.parse(savedContext);
      // Verificar que no sea muy viejo (< 5 segundos)
      if (Date.now() - context.timestamp < 5000) {
        console.log('Contexto recuperado:', context);
        // Inicializar con este contexto
        initializeWithContext(context);
      }
      // Limpiar
      sessionStorage.removeItem('copilot_open_context');
    } catch (err) {
      console.error('Error recuperando contexto:', err);
    }
  }
}, []);
```

---

#### Fix D: Asegurar que chat-test NO esté en minimal mode

**Problema**: Chat-test podría tener `minimal=1` o `embed=1` en su configuración.

**Solución**: NO pasar estos parámetros en la URL.

**Verificar en ChatSidebar.tsx** (línea 211):
```typescript
const fullUrl = `${baseUrl}/${development}/chat${params.toString() ? '?' + params.toString() : ''}`;
// ✅ NO incluir &minimal=1 ni &embed=1
```

**Si chat-test tiene configuración interna**, verificar:
```typescript
// En /apps/copilot/src/app/[variants]/(main)/chat/(workspace)/_layout/Desktop/index.tsx
const isEmbed =
  isInIframe ||
  searchParams?.get('embed') === '1' ||
  searchParams?.get('embedded') === '1' ||
  searchParams?.get('minimal') === '1';  // ❌ Esto NO debe activarse para chat-test completo
```

---

### Fase 3: Testing Final (10 minutos)

1. **Rebuild y reiniciar** (si hubo cambios en copilot):
```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/copilot
npm run build

launchctl kickstart -k gui/$(id -u)/com.bodasdehoy.app-test
```

2. **Probar flujo completo**:
```
1. Abrir app-test.bodasdehoy.com
2. Login
3. Seleccionar un evento
4. Abrir sidebar chat
5. Escribir mensaje: "¿Cuántos invitados tiene mi boda?"
6. Ver respuesta (debería mostrar EventCard)
7. Click en "Ver completo"
8. Verificar en nueva pestaña:
   ✅ Editor completo (15+ iconos)
   ✅ Conversación preservada (mensajes anteriores visibles)
   ✅ Contexto del evento mantenido
   ✅ Sin modo minimal/embed
   ✅ Panel lateral visible
```

---

## 📊 Checklist de Verificación

### Pre-implementación
- [ ] Probar flujo actual (qué funciona y qué no)
- [ ] Verificar URL generada por handleOpenInNewTab
- [ ] Verificar que chat-test recibe params
- [ ] Verificar si conversación se pierde
- [ ] Verificar si contexto se pierde

### Implementación
- [ ] Fix A: Chat-test lee parámetros de URL
- [ ] Fix B: Preservar conversación (conversationId)
- [ ] Fix C: Pasar pageContext via sessionStorage
- [ ] Fix D: Asegurar NO minimal mode en chat-test
- [ ] Fix E: Aplicar los mismos fixes de editor (collapseOffset=0, etc.)

### Post-implementación
- [ ] Rebuild copilot si fue necesario
- [ ] Reiniciar frontend
- [ ] Probar flujo completo end-to-end
- [ ] Verificar editor completo en nueva pestaña
- [ ] Verificar conversación preservada
- [ ] Verificar contexto preservado

---

## 🎯 Resultado Esperado

Después de implementar todos los fixes:

```
Usuario: [En app-test] "¿Cuántos invitados tiene mi boda?"
Copilot: [Muestra EventCard con 150 invitados]

Usuario: [Click en "Ver completo"]
        ↓
[Nueva pestaña: chat-test.bodasdehoy.com]
        ↓
✅ Editor completo (15+ iconos visibles)
✅ Conversación anterior visible (pregunta + EventCard)
✅ Contexto del evento preservado
✅ Puede continuar la conversación sin perder contexto
✅ Panel lateral con ChatHeader y TopicPanel
```

---

## 🔗 Archivos Clave

1. `/apps/web/components/ChatSidebar/ChatSidebar.tsx` - Botón "Ver completo" y handleOpenInNewTab
2. `/apps/copilot/src/app/[variants]/(main)/page.tsx` - Página principal de chat-test
3. `/apps/copilot/src/app/[variants]/(main)/chat/(workspace)/_layout/Desktop/index.tsx` - Layout de chat-test
4. `/apps/web/.env.local` - Variable NEXT_PUBLIC_CHAT
5. `/apps/copilot/src/features/ChatInput/ActionBar/index.tsx` - Configuración del editor (ya fixed)

---

**Estado**: 📋 PLAN CREADO - Esperando ejecución
**Prioridad**: Alta (funcionalidad clave para UX)
**Tiempo estimado**: 30-45 minutos (verificación + fixes + testing)
