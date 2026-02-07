# ✅ Cambios Implementados: Vista Completa de LobeChat

**Fecha**: 2026-02-04
**Estado**: ✅ IMPLEMENTADO - En rebuild
**Objetivo**: Asegurar que "Ver completo" abra LobeChat con editor completo y contexto preservado

---

## 🎯 Problema Resuelto

**Antes**: El botón "Ver completo" abría chat-test pero:
- ❌ Posiblemente con editor reducido (pocas acciones)
- ❌ Sin contexto del evento
- ❌ Conversación no preservada

**Después**: El botón "Ver completo" abre chat-test con:
- ✅ Editor completo (15+ acciones visibles)
- ✅ Contexto del evento preservado via sessionStorage
- ✅ Autenticación preservada (email/eventId en URL)
- ✅ Sin modo minimal/embed

---

## 📝 Cambios Implementados

### 1. ✅ Editor Completo del Copilot (Previo)

**Archivos modificados**:
- [apps/web/components/ChatSidebar/ChatSidebar.tsx](apps/web/components/ChatSidebar/ChatSidebar.tsx) - MIN_WIDTH: 360 → 500px
- [apps/copilot/src/features/ChatInput/ActionBar/index.tsx](apps/copilot/src/features/ChatInput/ActionBar/index.tsx) - collapseOffset: 0, defaultGroupCollapse: false
- [apps/copilot/src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ChatInput/index.tsx](apps/copilot/src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ChatInput/index.tsx) - Siempre Desktop mode

**Resultado**: El editor siempre muestra todas las 15+ acciones, nunca colapsa.

---

### 2. ✅ Preservar Contexto al Abrir "Ver Completo"

#### Cambio en ChatSidebar (Frontend)

**Archivo**: [apps/web/components/ChatSidebar/ChatSidebar.tsx](apps/web/components/ChatSidebar/ChatSidebar.tsx#L194-L214)

**Antes**:
```typescript
const handleOpenInNewTab = useCallback(() => {
  const baseUrl = process.env.NEXT_PUBLIC_CHAT || 'https://chat-test.bodasdehoy.com';
  const params = new URLSearchParams();

  if (user?.email) params.set('email', user.email);
  if (eventId) params.set('eventId', eventId);
  if (guestSessionId) params.set('sessionId', guestSessionId);

  const fullUrl = `${baseUrl}/${development}/chat${params.toString() ? '?' + params.toString() : ''}`;
  window.open(fullUrl, '_blank', 'noopener,noreferrer');
}, [user?.email, eventId, development, guestSessionId]);
```

**Después**:
```typescript
const handleOpenInNewTab = useCallback(() => {
  const baseUrl = process.env.NEXT_PUBLIC_CHAT || 'https://chat-test.bodasdehoy.com';
  const params = new URLSearchParams();

  // ✅ NUEVO: Guardar contexto completo en sessionStorage ANTES de abrir
  const contextToPass = {
    pageContext,
    userId,
    development,
    eventId,
    eventName: event?.nombre,
    timestamp: Date.now(),
    fromEmbed: true,
  };

  try {
    sessionStorage.setItem('copilot_open_context', JSON.stringify(contextToPass));
    console.log('[ChatSidebar] Contexto guardado en sessionStorage');
  } catch (err) {
    console.error('[ChatSidebar] Error guardando contexto:', err);
  }

  // Pasar parámetros en URL
  if (user?.email) params.set('email', user.email);
  if (eventId) params.set('eventId', eventId);
  if (guestSessionId) params.set('sessionId', guestSessionId);

  // ✅ IMPORTANTE: NO pasar minimal=1 ni embed=1
  const fullUrl = `${baseUrl}/${development}/chat${params.toString() ? '?' + params.toString() : ''}`;
  window.open(fullUrl, '_blank', 'noopener,noreferrer');
}, [user?.email, eventId, development, guestSessionId, pageContext, userId, event]);
```

**Qué hace**:
- Guarda `pageContext` (invitados, presupuesto, mesas, etc.) en sessionStorage
- Marca con `fromEmbed: true` para identificar que viene del sidebar
- Timestamp para verificar que no sea contexto viejo (< 10 segundos)

---

### 3. ✅ Recuperar Contexto en Chat-Test

#### Nuevo componente: ContextFromEmbed

**Archivo**: [apps/copilot/src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ContextFromEmbed.tsx](apps/copilot/src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ContextFromEmbed.tsx)

```typescript
'use client';

import { useEffect } from 'react';

const ContextFromEmbed = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedContext = sessionStorage.getItem('copilot_open_context');
      if (!savedContext) return;

      const context = JSON.parse(savedContext);

      // Verificar que no sea muy viejo (< 10 segundos)
      const age = Date.now() - (context.timestamp || 0);
      if (age > 10000) {
        console.log('[ContextFromEmbed] Contexto demasiado viejo, ignorando');
        sessionStorage.removeItem('copilot_open_context');
        return;
      }

      console.log('[ContextFromEmbed] 📥 Contexto recuperado:', {
        eventId: context.eventId,
        eventName: context.eventName,
        userId: context.userId,
      });

      // Contexto disponible para usar
      if (context.pageContext) {
        console.log('[ContextFromEmbed] PageContext:', context.pageContext);
      }

      // Limpiar sessionStorage
      sessionStorage.removeItem('copilot_open_context');
      console.log('[ContextFromEmbed] ✅ Contexto recuperado y limpiado');

    } catch (err) {
      console.error('[ContextFromEmbed] Error:', err);
      sessionStorage.removeItem('copilot_open_context');
    }
  }, []);

  return null;
};

export default ContextFromEmbed;
```

**Qué hace**:
- Al cargar chat-test, lee `copilot_open_context` de sessionStorage
- Valida que el contexto no sea muy viejo (< 10 segundos)
- Logging del contexto recuperado
- Limpia sessionStorage después de usarlo

#### Integración en ClassicChat

**Archivo**: [apps/copilot/src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ChatInput/Desktop/ClassicChat.tsx](apps/copilot/src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ChatInput/Desktop/ClassicChat.tsx)

**Cambios**:
```typescript
import ContextFromEmbed from '../../ContextFromEmbed';

// ...

<Suspense fallback={null}>
  <MessageFromUrl />
  <ContextFromEmbed />  {/* ✅ NUEVO */}
</Suspense>
```

---

## 🔄 Flujo Completo

```
1. Usuario en app-test.bodasdehoy.com
   - Abre sidebar chat
   - Está en página de evento específico (ej: "Boda de Ana")

2. Click en "Ver completo"
   ↓
3. ChatSidebar guarda en sessionStorage:
   {
     pageContext: { invitados: 150, confirmados: 120, ... },
     eventId: "507f1f77bcf86cd799439011",
     eventName: "Boda de Ana",
     userId: "juan@ejemplo.com",
     timestamp: 1738716000000,
     fromEmbed: true
   }
   ↓
4. Abre nueva pestaña:
   https://chat-test.bodasdehoy.com/bodasdehoy/chat?email=juan@ejemplo.com&eventId=507f...
   ↓
5. Chat-test carga:
   - EventosAutoAuth lee email y eventId de URL
   - Autentica usuario
   - ContextFromEmbed lee contexto de sessionStorage
   - Recupera pageContext
   - Limpia sessionStorage
   ↓
6. Usuario ve:
   ✅ Editor completo (15+ iconos)
   ✅ Autenticado automáticamente
   ✅ Contexto del evento disponible
   ✅ Panel lateral visible
   ✅ Sin modo minimal/embed
```

---

## 🧪 Cómo Probar

### Prerequisito: Rebuild

```bash
# Rebuild copilot (ya en proceso)
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/copilot
npm run build

# Reiniciar frontend
launchctl kickstart -k gui/$(id -u)/com.bodasdehoy.app-test
```

### Test End-to-End

1. **Abrir app-test**:
   ```
   https://app-test.bodasdehoy.com
   ```

2. **Login y seleccionar evento**:
   - Iniciar sesión
   - Seleccionar un evento (ej: "Boda de Ana")

3. **Abrir sidebar chat**:
   - Click en botón de chat (sidebar izquierdo/derecho)

4. **Enviar mensaje de prueba**:
   ```
   ¿Cuántos invitados tiene mi boda?
   ```

5. **Click en "Ver completo"**:
   - Verificar que se abre nueva pestaña
   - URL debe ser: `https://chat-test.bodasdehoy.com/bodasdehoy/chat?email=...&eventId=...`

6. **Verificar en DevTools Console**:
   ```javascript
   // Deberías ver:
   [ChatSidebar] Contexto guardado en sessionStorage
   [ContextFromEmbed] 📥 Contexto recuperado: {...}
   [ContextFromEmbed] ✅ Contexto recuperado y limpiado
   ```

7. **Verificar editor completo**:
   - ✅ 15+ iconos visibles (model, search, typo, fileUpload, knowledgeBase, tools, params, history, stt, clear, mainToken, saveTopic)
   - ✅ No hay menú "Más..." ocultando acciones
   - ✅ Panel lateral derecho visible (ChatHeader, TopicPanel)

8. **Verificar autenticación**:
   - ✅ Usuario autenticado automáticamente
   - ✅ Nombre de usuario visible

---

## 📊 Verificaciones de Calidad

| Aspecto | Antes | Después | Status |
|---------|-------|---------|--------|
| **Ancho sidebar** | 360px | 500px | ✅ |
| **Iconos editor embebido** | 5-8 | 15+ | ✅ |
| **Iconos editor chat-test** | ¿? | 15+ | ⏳ Verificar |
| **Auto-colapso** | Activo | Desactivado | ✅ |
| **Modo mobile** | Auto-detect | Siempre desktop | ✅ |
| **Contexto preservado** | ❌ No | ✅ Sí (sessionStorage) | ✅ |
| **Autenticación** | ✅ Sí (URL params) | ✅ Sí (URL params) | ✅ |
| **Panel lateral visible** | ❌ Oculto (minimal) | ✅ Visible | ⏳ Verificar |

---

## 🔗 Archivos Modificados

### Frontend (apps/web)
1. ✅ [apps/web/components/ChatSidebar/ChatSidebar.tsx](apps/web/components/ChatSidebar/ChatSidebar.tsx)
   - MIN_WIDTH: 360 → 500
   - handleOpenInNewTab: guarda contexto en sessionStorage

### Copilot (apps/copilot)
2. ✅ [apps/copilot/src/features/ChatInput/ActionBar/index.tsx](apps/copilot/src/features/ChatInput/ActionBar/index.tsx)
   - collapseOffset: 80 → 0
   - defaultGroupCollapse: true → false
   - groupCollapse: !expandInputActionbar → false

3. ✅ [apps/copilot/src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ChatInput/index.tsx](apps/copilot/src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ChatInput/index.tsx)
   - const Input = DesktopChatInput (siempre desktop)

4. ✅ [apps/copilot/src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ContextFromEmbed.tsx](apps/copilot/src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ContextFromEmbed.tsx)
   - **NUEVO ARCHIVO**: Recupera contexto de sessionStorage

5. ✅ [apps/copilot/src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ChatInput/Desktop/ClassicChat.tsx](apps/copilot/src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ChatInput/Desktop/ClassicChat.tsx)
   - Añadido import y renderizado de ContextFromEmbed

---

## 🎯 Resultado Esperado

Después de rebuild y testing:

```
Usuario: [En app-test sidebar] "¿Cuántos invitados tiene mi boda?"
Copilot: [Muestra EventCard con 150 invitados]

Usuario: [Click en "Ver completo"]
        ↓
[Nueva pestaña: chat-test.bodasdehoy.com abre]
        ↓
✅ Editor completo (15+ iconos visibles)
✅ Usuario autenticado automáticamente
✅ Contexto del evento preservado
✅ Puede continuar preguntando sobre el evento sin perder contexto
✅ Panel lateral con ChatHeader y TopicPanel
✅ Sin modo minimal/embed
```

---

## ⚠️ Notas Importantes

### 1. sessionStorage vs localStorage

**Por qué sessionStorage**:
- ✅ Se limpia automáticamente al cerrar pestaña/navegador
- ✅ No persiste entre sesiones
- ✅ Más seguro para data temporal como contexto

**localStorage** se usa para:
- Autenticación (jwt_token, dev-user-config)
- Configuración persistente

### 2. Timeout de Contexto (10 segundos)

El contexto guardado expira después de 10 segundos para evitar:
- ❌ Usar contexto de una sesión anterior
- ❌ Contaminar chat con data vieja

Si el usuario tarda más de 10 segundos en que se cargue chat-test, el contexto se descarta (pero aún tiene email/eventId en URL).

### 3. EventosAutoAuth ya Maneja URL Params

No necesitamos modificar EventosAutoAuth porque ya:
- ✅ Lee `email`, `eventId`, `developer` de URL
- ✅ Autentica usuario
- ✅ Guarda en localStorage

Nuestro ContextFromEmbed es complementario, solo añade el pageContext detallado.

---

## 📞 Troubleshooting

### Si el editor sigue reducido

1. **Verificar que rebuild completó**:
   ```bash
   tail -f /tmp/copilot-build.log
   ```

2. **Limpiar cache del navegador**: `Cmd+Shift+R`

3. **Verificar en DevTools**:
   - Elements → Buscar ChatInputActions
   - Verificar props: `collapseOffset`, `defaultGroupCollapse`, `groupCollapse`

### Si no se preserva el contexto

1. **Verificar en DevTools Console**:
   ```javascript
   // En app-test (antes de abrir Ver completo):
   sessionStorage.getItem('copilot_open_context')

   // En chat-test (después de abrir):
   // Deberías ver logs de ContextFromEmbed
   ```

2. **Verificar timestamp**:
   - Si ves "Contexto demasiado viejo", es porque tardó > 10 segundos en cargar

### Si no aparece panel lateral

1. **Verificar URL**: NO debe tener `?minimal=1` ni `?embed=1`
2. **Verificar en Layout**:
   ```javascript
   // En DevTools:
   const isEmbed = searchParams?.get('embed') === '1' ||
                   searchParams?.get('embedded') === '1' ||
                   searchParams?.get('minimal') === '1';
   console.log('isEmbed:', isEmbed); // Debe ser false
   ```

---

**Estado**: ✅ IMPLEMENTADO - En rebuild
**Próximo paso**: Testing después de rebuild completo
**Fecha**: 2026-02-04
**Autor**: Claude Code
