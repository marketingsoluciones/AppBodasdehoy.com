# 🔧 Solución: Problema de Caché en Iframe del Copilot

## 📅 Fecha: 2026-02-09

## 🔍 Problema Identificado

El iframe del Copilot estaba mostrando **contenido en caché antiguo** (la página `/chat` vieja con interfaz de bodasdehoy.com mezclada) en lugar del **LobeChat puro** desde `localhost:3210`.

### Verificación realizada:
✅ `localhost:3210` → Sirve LobeChat puro correctamente
✅ `localhost:8080/copilot-chat` → Proxy funciona, sirve LobeChat puro
✅ Código de componentes → Correcto
❌ **Navegador mostrando contenido en caché viejo**

## ✅ Solución Aplicada

### 1. Cache-Busting en el Iframe
**Archivo modificado**: `packages/copilot-ui/src/ChatInput/index.tsx`

**Cambio realizado**:
```typescript
// Antes:
const effectiveUrl = ... ? 'http://localhost:3210' : baseUrl;

// Después:
const baseEffectiveUrl = ... ? 'http://localhost:3210' : baseUrl;
const effectiveUrl = `${baseEffectiveUrl}?t=${Date.now()}`;  // ← Cache-busting
```

**Efecto**: Cada vez que se monta el componente, se agrega un timestamp único a la URL del iframe, forzando al navegador a cargar contenido fresco.

### 2. Logging para Debug
Agregado console.log para verificar qué URL está usando el iframe:
```typescript
console.log('[CopilotChatIframe] URL del iframe:', effectiveUrl);
console.log('[CopilotChatIframe] window.location.hostname:', window.location.hostname);
```

## 🧪 Pasos para Verificar la Solución

### Paso 1: Reiniciar apps/web
```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web
rm -rf .next
pnpm dev
```

### Paso 2: Limpiar Caché del Navegador (IMPORTANTE)

**Opción A: Hard Refresh (Recomendado)**
1. Abrir http://localhost:8080
2. Presionar `Cmd + Shift + R` (Mac) o `Ctrl + Shift + R` (Windows/Linux)
3. O hacer click derecho en el botón de recarga → "Vaciar caché y forzar recarga"

**Opción B: Borrar todo el caché**
1. Abrir DevTools (F12)
2. Click en "Application" (Chrome) o "Storage" (Firefox)
3. Sección "Storage" → Click derecho → "Clear site data"
4. Recargar la página

**Opción C: Modo Incógnito (Prueba Rápida)**
1. Abrir ventana de incógnito/privada
2. Ir a http://localhost:8080
3. Abrir Copilot sidebar

### Paso 3: Verificar el Iframe

1. Abrir http://localhost:8080
2. Abrir DevTools (F12) → Pestaña "Console"
3. Click en botón "Copilot" para abrir el sidebar
4. En la consola deberías ver:
   ```
   [CopilotChatIframe] URL del iframe: http://localhost:3210?t=1707523456789
   [CopilotChatIframe] window.location.hostname: localhost
   ```
5. En la pestaña "Elements", buscar el `<iframe>` y verificar:
   ```html
   <iframe src="http://localhost:3210?t=1707523456789" ...>
   ```

### Paso 4: Verificar que Muestra LobeChat Puro

Dentro del sidebar del Copilot, debes ver:
- ✅ **Solo** interfaz de LobeChat
- ✅ **NO** header de bodasdehoy.com
- ✅ **NO** iconos de navegación de bodasdehoy.com
- ✅ **NO** contenido "Prueba eventos, largo array..."
- ✅ **NO** mensajes "aqui el mensaje" repetidos
- ✅ Editor de LobeChat con funcionalidad completa
- ✅ Mensaje de bienvenida de LobeChat

## 🚨 Si Todavía Ves Contenido Viejo

### Service Workers
Algunos navegadores usan Service Workers que pueden cachear contenido:

```javascript
// En la consola del navegador:
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
  console.log('Service workers eliminados');
  location.reload();
});
```

### Verificar qué está cargando el iframe

```javascript
// En la consola del navegador:
const iframe = document.querySelector('iframe[title="LobeChat Copilot"]');
console.log('Iframe src:', iframe?.src);
console.log('Iframe contentWindow location:', iframe?.contentWindow?.location.href);
```

Si el `src` del iframe NO es `http://localhost:3210?t=...`, entonces:
1. El navegador está sirviendo código viejo (hacer hard refresh)
2. Hay un problema con el build (borrar `.next` y reiniciar)

### Borrar TODO el estado del navegador

```bash
# Script para abrir en ventana completamente limpia
node << 'EOF'
const { execSync } = require('child_process');
const url = 'http://localhost:8080';

// Chrome
try {
  execSync(`open -na "Google Chrome" --args --incognito "${url}"`, { stdio: 'inherit' });
  console.log('✅ Chrome incógnito abierto');
} catch (e) {
  console.log('Chrome no disponible, intentando Firefox...');
  // Firefox
  try {
    execSync(`open -na "Firefox" --args -private-window "${url}"`, { stdio: 'inherit' });
    console.log('✅ Firefox privado abierto');
  } catch (e2) {
    console.log('Abrir manualmente en modo incógnito:', url);
  }
}
EOF
```

## 📊 Resumen de Archivos Modificados

| Archivo | Cambio | Propósito |
|---------|--------|-----------|
| `packages/copilot-ui/src/ChatInput/index.tsx` | Agregado cache-busting con timestamp | Forzar recarga del iframe |
| `packages/copilot-ui/src/ChatInput/index.tsx` | Agregado logging de debug | Verificar URL usada por iframe |

## 🎯 Resultado Esperado

Después de aplicar la solución y limpiar el caché:

1. ✅ Iframe muestra `http://localhost:3210?t=[timestamp]`
2. ✅ Contenido del iframe es **LobeChat puro** sin elementos de bodasdehoy.com
3. ✅ Editor funcional con todos los plugins de LobeChat
4. ✅ Sin errores en consola
5. ✅ Sin contenido de la página `/chat` vieja

## 🔄 Próximos Pasos

1. **Reiniciar apps/web**: `cd apps/web && rm -rf .next && pnpm dev`
2. **Hard refresh del navegador**: `Cmd + Shift + R`
3. **Abrir Copilot sidebar** y verificar que muestra LobeChat puro
4. **Revisar consola** para ver los logs de debug
5. **Tomar screenshot** si el problema persiste

---

**Estado**: ✅ SOLUCIÓN APLICADA - Esperando verificación
**Última actualización**: 2026-02-09 18:00
**Acción requerida**: Reiniciar servidor y hacer hard refresh en navegador
