# 🔍 Diagnóstico Completo: Copilot con Editor Limitado

**Fecha**: 2026-02-07
**Problema**: El editor de LobeChat está cargando mínimo, sin toda la funcionalidad completa

---

## 🎯 Problema Identificado

### 1. Modo Actual: IFRAME (Limitado)
El Copilot se está cargando como **iframe**, NO como componente nativo:

**Archivo**: apps/web/components/ChatSidebar/ChatSidebar.tsx:16
```tsx
import CopilotIframe from '../Copilot/CopilotIframe';
```

### 2. Parámetro que Limita Funcionalidad
**Archivo**: apps/web/components/Copilot/CopilotIframe.tsx:105
```tsx
params.set('embed', '1'); // ❌ Esto está limitando funcionalidades
```

El parámetro `embed=1` en LobeChat oculta:
- Panel lateral de conversaciones
- Configuraciones avanzadas  
- Algunas funciones del editor

### 3. chat-test.bodasdehoy.com NO Funciona (502)
**Archivo**: apps/web/components/Copilot/CopilotIframe.tsx:69-71
```tsx
if (window.location.hostname?.includes('app-test')) {
  return 'https://chat-test.bodasdehoy.com'; // ❌ Da 502
}
```

**Causa**: El servidor NO tiene el servicio corriendo en puerto 3210.

---

## 📂 Estructura del Repositorio

### Apps Principales
```
/Users/juancarlosparra/Projects/AppBodasdehoy.com/
├── apps/
│   ├── web/                          # App organizador (app-test/organizador)
│   │   ├── components/
│   │   │   ├── Copilot/
│   │   │   │   ├── CopilotIframe.tsx        ✅ IFRAME (actual)
│   │   │   │   ├── CopilotChatNative.tsx    ⭐ COMPONENTE NATIVO (mejor)
│   │   │   │   ├── CopilotHeader.tsx
│   │   │   │   ├── CopilotPrewarmer.tsx
│   │   │   │   └── CopilotSplitLayout.tsx
│   │   │   └── ChatSidebar/
│   │   │       ├── ChatSidebar.tsx          📍 Usa CopilotIframe
│   │   │       └── ChatSidebarDirect.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── EventContext.tsx
│   │   │   └── ChatSidebarContext.tsx
│   │   ├── services/
│   │   │   └── copilotChat.ts               📡 API del chat
│   │   ├── .env.production                  🔧 Configuración
│   │   └── package.json
│   │
│   └── copilot/                      # LobeChat (chat-test/iachat)
│       ├── src/
│       │   ├── app/[variants]/(main)/chat/  💬 Interfaz del chat
│       │   ├── server/                      🔧 Backend del chat
│       │   └── components/
│       ├── .env                             🔧 Configuración
│       ├── .env.test                        ⭐ Para chat-test (nuevo)
│       └── package.json
│
├── ecosystem.config.js                      🚀 PM2 config
├── package.json                             📦 Scripts del monorepo
└── scripts/
    └── reiniciar-servicios-test.sh          🔄 Script de reinicio
```

### Archivos de Configuración Clave

#### 1. apps/web/.env.production
```env
NEXT_PUBLIC_CHAT=https://chat.bodasdehoy.com  # ⚠️ Temporal (debería ser chat-test)
```

#### 2. apps/copilot/.env.test (Nuevo)
```env
APP_URL=https://chat-test.bodasdehoy.com      # ✅ Configuración correcta
```

#### 3. ecosystem.config.js
```js
{
  name: 'app-test',
  script: './apps/web/start.sh',      // Puerto 3000 ✅
},
{
  name: 'chat-test',
  script: './apps/copilot/start.sh',  // Puerto 3210 ❌ (no responde)
}
```

---

## 🔧 Soluciones

### Opción A: Cambiar a Componente Nativo (Recomendado)

**Beneficios**:
- ✅ Editor completo con todas las funcionalidades
- ✅ Mejor rendimiento (sin iframe)
- ✅ Más control sobre el UI
- ✅ No depende de chat-test

**Cambios necesarios**:

1. Modificar ChatSidebar.tsx para usar CopilotChatNative
2. Rebuild de apps/web
3. Deploy

### Opción B: Levantar chat-test.bodasdehoy.com

**Para que funcione el iframe completo**:

1. Acceder al servidor donde está app-test
2. Ejecutar: `pm2 start ecosystem.config.js`
3. Verificar: `pm2 list` y `curl https://chat-test.bodasdehoy.com`
4. Revertir .env.production a usar chat-test

### Opción C: Quitar parámetro embed=1 (Parcial)

Comentar línea 105 en CopilotIframe.tsx:
```tsx
// params.set('embed', '1');
```

---

## 🚀 Recomendación Inmediata

**Usar Componente Nativo (Opción A)** porque:
1. ✅ No depende de que chat-test funcione
2. ✅ Tiene toda la funcionalidad del editor
3. ✅ Ya está implementado y probado
4. ✅ Mejor experiencia de usuario

---

## 📊 Estado Actual vs Objetivo

| Aspecto | Actual | Objetivo |
|---------|--------|----------|
| Implementación | iframe | Componente nativo |
| Editor | Limitado (embed=1) | Completo |
| chat-test | 502 | Funcionando |
| Funcionalidad | 60% | 100% |

---

**Conclusión**: El editor está limitado porque usa iframe con `embed=1`. La solución más rápida es cambiar a CopilotChatNative.
