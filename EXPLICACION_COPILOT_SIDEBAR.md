# 📋 Explicación: Copilot Sidebar vs Página /chat

## 🚨 PROBLEMA IDENTIFICADO

Estás confundiendo **DOS cosas diferentes**:

### ❌ Página `/chat` (VIEJA, NO ES EL COPILOT)
- URL: `http://localhost:8080/chat`
- Es una página vieja de debug/prueba
- Muestra:
  - "eventos, largo array: invitadosSelect: false"
  - "No hay invitado seleccionado"
  - Múltiples "aqui el mensaje"
  - "Grupos"
- **NO ES EL COPILOT**
- Archivo: `apps/web/pages/chat.js`

### ✅ Copilot Sidebar (NUEVO, USA LOBECHAT REAL)
- Se abre desde el botón "Copilot" en la esquina superior derecha
- Muestra un **panel lateral** (sidebar)
- Contiene un **iframe** que carga `/copilot-chat`
- `/copilot-chat` apunta a `localhost:3210` (apps/copilot)
- Muestra el **LobeChat REAL** con TODOS los plugins
- Archivos:
  - `apps/web/components/ChatSidebar/ChatSidebar.tsx`
  - `apps/web/components/Copilot/CopilotChatNative.tsx`
  - `packages/copilot-ui/src/ChatInput/index.tsx`

---

## 🔍 Cómo Identificar Cuál Estás Viendo

### Si ves `/chat` (PÁGINA VIEJA):
```
URL en navegador: http://localhost:8080/chat
                                        ^^^^

Contenido:
- Header completo de bodasdehoy.com
- "eventos, largo array..."
- Input "aqui el mensaje"
- "Grupos"
```

### Si ves el Copilot Sidebar (CORRECTO):
```
URL en navegador: http://localhost:8080/[cualquier-página]
                  (NO cambia cuando abres el sidebar)

Contenido:
- Panel lateral a la izquierda (sidebar)
- Header pequeño que dice "Copilot"
- Botón "Expandir" (IoExpand)
- Iframe que muestra LobeChat
- Interfaz de LobeChat con:
  - Editor contenteditable
  - Botones de formato (si se configuran en LobeChat)
  - Mensaje "¡Bienvenido!"
```

---

## 📁 Arquitectura Actual

```
apps/web (Puerto 8080)
│
├── pages/
│   ├── chat.js            ❌ PÁGINA VIEJA (NO USAR)
│   └── copilot.tsx        ✅ Página completa del Copilot
│
├── components/
│   ├── ChatSidebar/
│   │   └── ChatSidebar.tsx    ✅ Sidebar que contiene el Copilot
│   │
│   └── Copilot/
│       └── CopilotChatNative.tsx  ✅ Componente simplificado con iframe
│
└── Configuración:
    - next.config.js: Proxy `/copilot-chat` → `localhost:3210`
    - .env.local: NEXT_PUBLIC_CHAT=http://localhost:3210
```

```
apps/copilot (Puerto 3210)
└── LobeChat COMPLETO
    - TODOS los plugins
    - TODOS los botones
    - Interfaz oficial
```

---

## 🎯 Cómo Funciona el Copilot Sidebar

### 1. Usuario hace click en botón "Copilot"
- Ubicado en la esquina superior derecha de apps/web
- Abre el ChatSidebar

### 2. ChatSidebar renderiza CopilotChatNative
```tsx
// apps/web/components/ChatSidebar/ChatSidebar.tsx (línea 393)
<CopilotChatNative
  userId={userId}
  development={development}
  eventId={eventId}
  eventName={event?.nombre}
  pageContext={pageContext}
  onNavigate={handleNavigate}
  onExpand={handleOpenInNewTab}
  className="h-full w-full"
/>
```

### 3. CopilotChatNative renderiza iframe
```tsx
// apps/web/components/Copilot/CopilotChatNative.tsx (línea 135)
<CopilotChatIframe
  height="100%"
  width="100%"
  baseUrl="/copilot-chat"   // ← Proxy a localhost:3210
  contextData={{
    userId,
    development,
    eventId,
    eventName,
    pageContext,
  }}
/>
```

### 4. CopilotChatIframe crea el iframe
```tsx
// packages/copilot-ui/src/ChatInput/index.tsx (línea 69)
<iframe
  ref={iframeRef}
  src={baseUrl}  // ← /copilot-chat
  style={{ width: '100%', height: '100%', border: 'none' }}
  title="LobeChat Copilot"
  allow="clipboard-read; clipboard-write"
/>
```

### 5. Next.js proxy redirige `/copilot-chat` → `localhost:3210`
```javascript
// apps/web/next.config.js (línea 85)
async rewrites() {
  const copilotBase = process.env.NEXT_PUBLIC_CHAT || 'http://localhost:3210';
  return [
    {
      source: '/copilot-chat/:path*',
      destination: `${copilotBase}/:path*`,
    },
  ];
}
```

### 6. Se muestra el LobeChat REAL
- Con TODOS los plugins
- Con TODA la funcionalidad
- Desde apps/copilot (puerto 3210)

---

## ✅ Verificación

### Paso 1: Verificar servidores corriendo
```bash
# Terminal 1
cd apps/web
pnpm dev
# Debe mostrar: http://127.0.0.1:8080

# Terminal 2
cd apps/copilot
pnpm dev
# Debe mostrar: http://localhost:3210
```

### Paso 2: Abrir la app correctamente
1. Ir a http://localhost:8080 (NO a /chat)
2. Hacer click en el botón "Copilot" (esquina superior derecha)
3. Se debe abrir un **panel lateral izquierdo**
4. Dentro del panel debe haber un **iframe**
5. El iframe debe mostrar **LobeChat** con:
   - Mensaje "¡Bienvenido!"
   - Editor de texto
   - Interfaz de LobeChat

### Paso 3: Verificar que NO es la página /chat
- La URL NO debe cambiar a `/chat`
- NO debe decir "eventos, largo array..."
- NO debe decir "aqui el mensaje" múltiples veces
- NO debe tener el layout completo de bodasdehoy.com

---

## 🐛 Si Todavía Ves la Página /chat

Significa que estás navegando manualmente a `/chat` en lugar de abrir el sidebar:

```bash
# ❌ INCORRECTO:
http://localhost:8080/chat
                      ^^^^

# ✅ CORRECTO:
http://localhost:8080/
                      ^ (cualquier página)
# Luego click en botón "Copilot"
```

---

## 📸 Imágenes de Referencia

### ❌ Imagen 2 que mostraste = Página `/chat` (VIEJA)
- Header completo de bodasdehoy.com
- "Prueba eventos, largo array..."
- "No hay invitado seleccionado"
- Múltiples "aqui el mensaje"
- "Grupos"

### ✅ Imagen 1 y 3 que mostraste = LobeChat CORRECTO
- Interfaz de LobeChat
- Mensaje "¡Bienvenido!"
- Editor de LobeChat
- Sidebar con iconos (en imagen 3)

---

## 🔧 Solución si el Sidebar No Muestra LobeChat

Si abres el sidebar y NO ves LobeChat, verifica:

1. **Ambos servidores corriendo:**
   ```bash
   lsof -ti:8080 # apps/web
   lsof -ti:3210 # apps/copilot
   ```

2. **Proxy configurado:**
   ```bash
   # Verificar que /copilot-chat redirige a localhost:3210
   curl -I http://localhost:8080/copilot-chat
   # Debe retornar HTML del apps/copilot
   ```

3. **Iframe en el DOM:**
   - Abrir DevTools (F12)
   - Buscar `<iframe>` en Elements
   - Verificar que `src="/copilot-chat"`

4. **Sin errores en consola:**
   - Abrir DevTools (F12)
   - Ver pestaña Console
   - NO debe haber errores de red o CORS

---

## 📝 Resumen

| Aspecto | Página `/chat` (❌ VIEJA) | Copilot Sidebar (✅ NUEVO) |
|---------|--------------------------|---------------------------|
| URL | `/chat` | Cualquier página + botón Copilot |
| Ubicación | Página completa | Sidebar lateral |
| Header | Header completo app | Header pequeño "Copilot" |
| Contenido | Debug: "aqui el mensaje" | LobeChat REAL via iframe |
| Tecnología | Componente React custom | Iframe a localhost:3210 |
| Estado | Obsoleto, para debug | Implementación NUEVA |
| Usar | ❌ NO | ✅ SÍ |

---

**Fecha**: 2026-02-09
**Estado**: ✅ COPILOT SIDEBAR IMPLEMENTADO CON IFRAME
**Acción**: NO usar página `/chat`, usar botón "Copilot" en app
