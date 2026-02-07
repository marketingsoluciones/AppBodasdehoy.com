# 🧪 Cómo Probar el Fix del Error 502

**Fecha**: 2026-01-25  
**Fix**: Detección automática de chat-test y fallback a chat producción

---

## ✅ Scripts de Prueba Disponibles

### 1. Test Scraper (Verificación DNS/HTTP)

**Script**: `scripts/test-chat-test-scraper.mjs`

**Qué hace**:
- Verifica DNS resolution de chat-test y chat producción
- Hace requests HTTP para verificar estado
- Compara resultados y genera reporte

**Ejecutar**:
```bash
node scripts/test-chat-test-scraper.mjs
```

**Nota**: Si tienes VPN activa, puede mostrar "DNS NO resuelto" desde terminal, pero el navegador sí puede resolverlo.

---

### 2. Test Fix CopilotIframe (Verificación de Código)

**Script**: `scripts/test-fix-copilot-iframe.mjs`

**Qué hace**:
- Verifica que el código del componente tiene el fix implementado
- Simula el comportamiento del fix
- Prueba diferentes escenarios (chat-test, chat producción, localhost)

**Ejecutar**:
```bash
node scripts/test-fix-copilot-iframe.mjs
```

---

## 🌐 Prueba en el Navegador (Recomendado)

### Paso 1: Verificar Configuración Actual

```bash
# Ver qué URL está configurada
cat apps/web/.env.production | grep NEXT_PUBLIC_CHAT
```

**Debería mostrar**:
```
NEXT_PUBLIC_CHAT=https://chat-test.bodasdehoy.com
```

---

### Paso 2: Levantar la Aplicación

```bash
cd apps/web
npm run dev
# O
pnpm dev
```

**Abrir en navegador**: `http://localhost:8080` (o el puerto configurado)

---

### Paso 3: Abrir Consola del Navegador

1. **Presionar F12** (o Cmd+Option+I en Mac)
2. **Ir a la pestaña "Console"**
3. **Buscar logs que empiecen con**: `[CopilotIframe]`

---

### Paso 4: Verificar el Fix

**Lo que deberías ver en la consola**:

```
[CopilotIframe] ⚠️ chat-test detectado, usando chat producción como fallback inmediato
[CopilotIframe] URL construida: https://chat.bodasdehoy.com/bodasdehoy/chat?userId=...
```

**✅ Si ves esto**: El fix está funcionando correctamente

**❌ Si NO ves esto**: Verificar que el código esté actualizado

---

### Paso 5: Verificar que el Iframe Carga

1. **Navegar a una página que tenga el Copilot** (ej: `/copilot`)
2. **Verificar que el iframe carga sin error 502**
3. **Si hay error 502**: El componente debería cambiar automáticamente a chat producción

---

## 🔍 Verificación Manual del Código

### Verificar que el Fix Está Implementado

```bash
# Buscar la función getInitialUrl
grep -n "getInitialUrl" apps/web/components/Copilot/CopilotIframe.tsx

# Buscar detección de chat-test
grep -n "chat-test.bodasdehoy.com" apps/web/components/Copilot/CopilotIframe.tsx

# Buscar fallback a chat producción
grep -n "chat.bodasdehoy.com" apps/web/components/Copilot/CopilotIframe.tsx | grep replace
```

**Deberías ver**:
- Línea con `getInitialUrl` (función que implementa el fix)
- Línea con `chat-test.bodasdehoy.com` (detección)
- Línea con `.replace('chat-test.bodasdehoy.com', 'chat.bodasdehoy.com')` (fallback)

---

## 📊 Escenarios de Prueba

### Escenario 1: chat-test Configurado (Estado Actual)

**Configuración**:
```env
NEXT_PUBLIC_CHAT=https://chat-test.bodasdehoy.com
```

**Comportamiento Esperado**:
- ✅ Detecta que es chat-test
- ✅ Usa chat producción como URL inicial
- ✅ No muestra error 502
- ✅ Iframe carga correctamente

**Verificar en consola**:
```
[CopilotIframe] ⚠️ chat-test detectado, usando chat producción como fallback inmediato
```

---

### Escenario 2: chat Producción Configurado

**Configuración**:
```env
NEXT_PUBLIC_CHAT=https://chat.bodasdehoy.com
```

**Comportamiento Esperado**:
- ✅ Usa chat producción directamente
- ✅ No hay cambio de URL
- ✅ Funciona normalmente

**Verificar en consola**:
```
[CopilotIframe] URL construida: https://chat.bodasdehoy.com/bodasdehoy/chat?...
```

---

### Escenario 3: Error 502 Durante Carga

**Simulación**: Si chat-test responde con 502

**Comportamiento Esperado**:
- ✅ Detecta error 502
- ✅ Cambia automáticamente a chat producción
- ✅ No muestra error al usuario
- ✅ Iframe carga correctamente

**Verificar en consola**:
```
[CopilotIframe] ⚠️ Error 502 con chat-test, cambiando a chat producción inmediatamente
```

---

## 🐛 Troubleshooting

### Problema: El Fix No Funciona

**Verificar**:
1. ¿El código está actualizado?
   ```bash
   git diff apps/web/components/Copilot/CopilotIframe.tsx
   ```

2. ¿La aplicación se recompiló?
   ```bash
   # Detener y reiniciar
   npm run dev
   ```

3. ¿Hay errores en la consola?
   - Abrir DevTools → Console
   - Buscar errores relacionados con CopilotIframe

---

### Problema: DNS No Resuelve (Desde Terminal)

**Causa**: VPN activa o configuración DNS local

**Solución**: 
- El navegador puede resolver DNS aunque la terminal no pueda
- El fix funciona en el navegador, no depende de la terminal
- Probar directamente en el navegador

---

### Problema: Sigue Mostrando Error 502

**Verificar**:
1. ¿chat producción funciona?
   ```bash
   curl -I https://chat.bodasdehoy.com
   ```

2. ¿El código tiene el fix?
   ```bash
   grep "getInitialUrl" apps/web/components/Copilot/CopilotIframe.tsx
   ```

3. ¿Hay caché del navegador?
   - Hard refresh: Cmd+Shift+R (Mac) o Ctrl+Shift+R (Windows)

---

## ✅ Checklist de Verificación

- [ ] Scripts de prueba ejecutados
- [ ] Código del componente verificado
- [ ] Aplicación levantada y funcionando
- [ ] Consola del navegador revisada
- [ ] Logs de `[CopilotIframe]` verificados
- [ ] Iframe carga sin error 502
- [ ] Fallback automático funciona

---

## 📝 Resultados Esperados

### ✅ Fix Funcionando Correctamente

**Consola del navegador**:
```
[CopilotIframe] ⚠️ chat-test detectado, usando chat producción como fallback inmediato
[CopilotIframe] URL construida: https://chat.bodasdehoy.com/bodasdehoy/chat?userId=...
[CopilotIframe] ✅ Marcando iframe como cargado y visible
```

**UI**:
- ✅ Iframe carga correctamente
- ✅ No muestra error 502
- ✅ Chat funciona normalmente

---

### ❌ Fix NO Funcionando

**Consola del navegador**:
```
[CopilotIframe] Error loading: https://chat-test.bodasdehoy.com/... 502 Bad Gateway
```

**UI**:
- ❌ Muestra error 502
- ❌ Iframe no carga

**Acción**: Verificar que el código esté actualizado y la aplicación recompilada

---

**Estado**: ✅ Fix implementado - Probar en navegador para verificar funcionamiento
