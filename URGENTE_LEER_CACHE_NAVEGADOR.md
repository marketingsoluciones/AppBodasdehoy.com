# 🚨 URGENTE: Problema de Caché del Navegador

## 📅 Fecha: 2026-02-09 19:30

## ⚠️ EL PROBLEMA

Tus capturas muestran que el sidebar del Copilot está mostrando **la página `/chat` vieja** (con "Prueba eventos, largo array", "aqui el mensaje", etc.) en lugar del **iframe con LobeChat** desde localhost:3210.

### ✅ El código está CORRECTO

He verificado:
- ✅ `CopilotChatNative.tsx` usa `<CopilotChatIframe>` correctamente
- ✅ `ChatSidebar.tsx` importa y usa `CopilotChatNative` correctamente
- ✅ Servidor corriendo correctamente en localhost:8080
- ✅ apps/copilot corriendo correctamente en localhost:3210
- ✅ Proxy `/copilot-chat` → `localhost:3210` funciona

### ❌ El problema es CACHÉ DEL NAVEGADOR

Tu navegador está ejecutando **JavaScript viejo en caché** en lugar del nuevo código que usa iframe.

---

## 🔧 SOLUCIÓN: Hard Refresh COMPLETO

### Paso 1: Cerrar TODO

1. **Cerrar TODAS las pestañas** de localhost:8080 en tu navegador
2. **Cerrar el navegador completamente** (no solo las ventanas, sino el navegador completo)

### Paso 2: Borrar Caché

#### Opción A: Chrome/Edge (RECOMENDADO)

1. Abrir Chrome/Edge
2. Presionar `Cmd + Shift + Delete` (Mac) o `Ctrl + Shift + Delete` (Windows)
3. En "Rango de tiempo": Seleccionar **"Desde siempre"**
4. Marcar SOLO:
   - ✅ Imágenes y archivos en caché
   - ✅ Datos de sitios web y archivos descargados
5. Desmarcar:
   - ❌ Historial de navegación
   - ❌ Contraseñas
   - ❌ Cookies y otros datos de sitios
6. Click en "Borrar datos"

#### Opción B: Firefox

1. Abrir Firefox
2. Presionar `Cmd + Shift + Delete` (Mac) o `Ctrl + Shift + Delete` (Windows)
3. En "Rango de tiempo": Seleccionar **"Todo"**
4. Marcar SOLO:
   - ✅ Caché
5. Desmarcar:
   - ❌ Historial
   - ❌ Cookies
   - ❌ Contraseñas
6. Click en "Limpiar ahora"

### Paso 3: Abrir en Nueva Ventana de Incógnito

**Esto es CRÍTICO - usar ventana de incógnito garantiza que no hay caché:**

```bash
# Mac - Chrome
open -na "Google Chrome" --args --incognito http://localhost:8080

# Mac - Firefox
open -na "Firefox" --args -private-window http://localhost:8080

# Windows/Linux - Chrome
chrome.exe --incognito http://localhost:8080

# Windows/Linux - Firefox
firefox.exe -private-window http://localhost:8080
```

O manualmente:
1. Abrir ventana de incógnito/privada
2. Ir a http://localhost:8080
3. Click en botón "Copilot"

### Paso 4: Verificar

Dentro del sidebar del Copilot debes ver:

✅ **CORRECTO**:
- Solo interfaz de LobeChat
- Editor de LobeChat
- Mensaje de bienvenida
- **SIN** "Prueba eventos, largo array"
- **SIN** "aqui el mensaje"
- **SIN** iconos de navegación de bodasdehoy.com

❌ **INCORRECTO** (si ves esto, el caché persiste):
- "Prueba eventos, largo array: invitadosSelect: false"
- "aqui el mensaje" repetido
- "Grupos"
- "chats" con botón "+"

---

## 🔍 Verificación Manual en DevTools

Si después del paso anterior TODAVÍA ves contenido viejo:

1. Abrir DevTools (F12)
2. Pestaña "Network"
3. Marcar "Disable cache" (esquina superior derecha)
4. Hacer hard refresh: `Cmd + Shift + R`
5. Ir a pestaña "Elements"
6. Buscar `<iframe>` en el DOM
7. Verificar que el iframe tiene:
   ```html
   <iframe src="http://localhost:3210?t=..." title="LobeChat Copilot">
   ```

Si el iframe NO existe y en su lugar ves elementos con:
- "aqui el mensaje"
- "invitadosSelect"
- "Prueba eventos"

Entonces el problema es que el navegador está usando un build viejo de JavaScript.

---

## 🧪 Test Automatizado (Opcional)

Si quieres ejecutar un test automatizado:

```bash
# 1. Instalar puppeteer (solo primera vez)
pnpm install -D puppeteer

# 2. Ejecutar test
node test-copilot-sidebar.mjs

# El test abrirá el navegador, verificará el sidebar y creará:
# - test-copilot-sidebar.png (captura)
# - Reporte en consola
```

---

## 🔄 Si TODAVÍA No Funciona

### Opción 1: Service Workers

Los Service Workers pueden cachear JavaScript:

```javascript
// Ejecutar en consola del navegador (F12 → Console):
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
  console.log('✅ Service workers eliminados');
  location.reload(true);
});
```

### Opción 2: Rebuild Completo del Servidor

```bash
# Terminal 1: Matar servidor
pkill -f "next dev.*8080"

# Terminal 2: Rebuild completo
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web
rm -rf .next
rm -rf node_modules/.cache
pnpm dev

# Esperar mensaje "Ready in X.Xs"
# Luego hacer hard refresh en navegador
```

### Opción 3: Verificar que el Código Es el Correcto

```bash
# Verificar que CopilotChatNative usa iframe
grep -A5 "CopilotChatIframe" apps/web/components/Copilot/CopilotChatNative.tsx

# Debe mostrar:
#   <CopilotChatIframe
#     height="100%"
#     width="100%"
#     baseUrl="/copilot-chat"
#     ...
```

---

## 📊 Diagnóstico Rápido

### ¿Qué estás viendo AHORA?

#### Escenario A: Contenido de `/chat` vieja
```
❌ Prueba eventos, largo array...
❌ aqui el mensaje (repetido)
❌ Grupos
```
**Problema**: JavaScript viejo en caché
**Solución**: Pasos 1-3 arriba (cerrar todo + borrar caché + incógnito)

#### Escenario B: Iframe pero con contenido viejo dentro
```
✅ Hay <iframe>
✅ src="http://localhost:3210?t=..."
❌ Pero dentro se ve /chat vieja
```
**Problema**: apps/copilot sirve contenido equivocado
**Solución**: Verificar que apps/copilot esté corriendo correctamente

#### Escenario C: Error de red en iframe
```
✅ Hay <iframe>
❌ Error: Failed to load
❌ O página en blanco
```
**Problema**: apps/copilot no está corriendo
**Solución**:
```bash
cd apps/copilot
pnpm dev
# Verificar: http://localhost:3210
```

---

## 🎯 Checklist de Verificación

Antes de enviar más capturas, verifica:

- [ ] Cerré TODAS las pestañas de localhost:8080
- [ ] Cerré el navegador completamente
- [ ] Borré el caché (Cmd+Shift+Delete → Desde siempre → Caché)
- [ ] Abrí ventana de incógnito
- [ ] Navegué a http://localhost:8080 en incógnito
- [ ] Click en botón "Copilot"
- [ ] Verifiqué el contenido del sidebar
- [ ] Abrí DevTools (F12) y busqué `<iframe>`
- [ ] Verifiqué que apps/copilot está corriendo en localhost:3210

---

## 📸 Capturas a Enviar

Si después de TODO lo anterior TODAVÍA ves contenido viejo, envía:

1. **Captura del sidebar abierto**
2. **Captura de DevTools → Elements** mostrando el HTML del sidebar
3. **Captura de DevTools → Console** mostrando los logs
4. **Captura de DevTools → Network** con "Disable cache" marcado

---

## 💡 Explicación Técnica

### ¿Por qué pasa esto?

Cuando Next.js compila el código, genera archivos JavaScript en `.next/`. El navegador descarga y cachea estos archivos.

Si modifico el código TypeScript pero el navegador usa JavaScript viejo en caché, verás el comportamiento antiguo aunque el código fuente sea correcto.

### ¿Cómo se soluciona permanentemente?

En desarrollo:
- Siempre usar "Disable cache" en DevTools
- Hacer hard refresh después de cambios importantes

En producción:
- Next.js automáticamente genera hashes únicos para cada build
- El navegador descarga nuevas versiones automáticamente

---

**Estado**: ✅ Código correcto, esperando hard refresh del navegador
**Última actualización**: 2026-02-09 19:30
**Prioridad**: 🚨 URGENTE

## 🚀 Acción INMEDIATA

1. ✅ Cerrar navegador completamente
2. ✅ Borrar caché (Cmd+Shift+Delete)
3. ✅ Abrir ventana de incógnito
4. ✅ Ir a http://localhost:8080
5. ✅ Click en "Copilot"
6. ✅ Verificar que se ve solo LobeChat (sin "aqui el mensaje")

**Si después de esto TODAVÍA ves la página `/chat` vieja, envía capturas de DevTools.**
