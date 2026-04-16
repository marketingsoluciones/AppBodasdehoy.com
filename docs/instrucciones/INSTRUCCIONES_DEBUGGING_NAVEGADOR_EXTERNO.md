# 🌐 Instrucciones: Debugging con Navegador Externo

**Fecha**: 2026-02-07
**Estado**: Bypass desactivado - Usando Firebase Auth real

---

## 🎯 Cambios Aplicados

### ✅ 1. Bypass de Desarrollo DESACTIVADO para localhost
- **Antes**: Login automático en localhost (no necesitaba Firebase)
- **Ahora**: Autenticación real de Firebase en localhost
- **Beneficio**: Trabajas con datos reales, usuarios reales, eventos reales

### ✅ 2. Página de Debugging Creada
- **URL**: http://localhost:8080/debug-front
- **Función**: Muestra estado del frontend en tiempo real
- **Actualización**: Automática cada 2 segundos

---

## 🚀 Pasos para Debugging

### Paso 1: Esperar a que Compile

```bash
# Esperar a ver este mensaje:
✓ Compiled in X.Xs (XXXX modules)
```

### Paso 2: Abrir Navegador Externo

**Opciones** (usa el que prefieras):
- 🔵 **Google Chrome**: Mejor para debugging (DevTools potentes)
- 🟠 **Safari**: Integración nativa con macOS
- 🦊 **Firefox**: Buenas herramientas de desarrollo

**NO uses**:
- ❌ Navegador interno de Cursor IDE (tiene problemas)

### Paso 3: Ir a la Página de Debugging

```
URL: http://localhost:8080/debug-front
```

**Deberías ver**:
```
┌─────────────────────────────────────────┐
│ 🔍 Debug Frontend - Bodas de Hoy       │
├─────────────────────────────────────────┤
│                                         │
│ 🔐 Autenticación                        │
│ verificationDone: true/false            │
│ Usuario: email o "No logueado"          │
│ UID: xxxxx                              │
│                                         │
│ 📅 Eventos                              │
│ eventsGroupDone: true/false             │
│ Eventos cargados: N                     │
│ Evento seleccionado: Nombre o "Ninguno"│
│                                         │
│ 📝 Console Logs (últimos 20)           │
│ [tiempo] [tipo] mensaje...              │
│                                         │
│ 🌐 Network Logs                         │
│ GET/POST url - Status XXX               │
│                                         │
│ ⚡ Acciones Rápidas                     │
│ [🏠 Home] [🔑 Login] [🗑️ Limpiar]     │
└─────────────────────────────────────────┘
```

---

## 🔑 Paso 4: Hacer Login Real

### Opción A: Login con Email/Password

1. Click en **[🔑 Ir a Login]** en debug-front
2. Ingresar email y contraseña de Firebase
3. Hacer login

### Opción B: Login desde Home

1. Ir a http://localhost:8080
2. Si no estás logueado, verás el botón de Login
3. Click en Login
4. Ingresar credenciales

### ¿Qué credenciales usar?

**Usuarios de Firebase** que ya tienes:
- Email: bodasdehoy.com@gmail.com
- Contraseña: [tu contraseña]

O cualquier otro usuario que tengas registrado en Firebase.

---

## 📊 Paso 5: Verificar Estado en Debug

Una vez logueado, volver a:
```
http://localhost:8080/debug-front
```

**Verificar**:
- ✅ `verificationDone: true`
- ✅ `Usuario: tu@email.com`
- ✅ `UID: xxxxxxxxxxxx`
- ✅ `eventsGroupDone: true`
- ✅ `Eventos cargados: N` (donde N > 0)

---

## 🧪 Paso 6: Probar el Copilot

1. **Desde debug-front**: Click en **[🏠 Ir a Home]**
2. **Seleccionar un evento** de la lista
3. **Ir a cualquier sección** (Invitados, Presupuesto, etc.)
4. **Buscar el botón del Copilot** en el sidebar derecho
5. **Abrir el Copilot**
6. **Verificar**: Debes ver los 4 botones: 😊 📎 </> •

---

## 🔍 Debugging Avanzado con DevTools

### Abrir DevTools en Chrome/Firefox/Safari

**Teclas**:
- Windows/Linux: `F12` o `Ctrl+Shift+I`
- macOS: `Cmd+Option+I`

### Pestañas Útiles

#### 1. **Console**
- Ver errores de JavaScript
- Ver logs (console.log, console.error)
- Ejecutar código JavaScript

```javascript
// Ejemplos de comandos útiles:
// Ver usuario actual
console.log(window.__NEXT_DATA__)

// Ver eventos cargados
console.log(localStorage.getItem('eventsGroup'))

// Forzar reload
location.reload()
```

#### 2. **Network**
- Ver todas las peticiones HTTP
- Ver respuestas de APIs
- Ver tiempos de carga

**Filtrar**:
- `XHR/Fetch`: Solo peticiones AJAX
- `JS`: Solo archivos JavaScript
- `All`: Todo

#### 3. **Application** (o Storage)
- Ver cookies
- Ver localStorage
- Ver sessionStorage

**Elementos importantes**:
- Cookies → `sessionBodas`
- LocalStorage → eventos, usuario
- SessionStorage → auth_redirect_pending

---

## 🐛 Problemas Comunes y Soluciones

### Problema 1: No puedo hacer login

**Verificar**:
1. ¿Firebase está configurado? (archivo firebase.js)
2. ¿Las credenciales son correctas?
3. ¿Hay errores en Console (F12)?

**Solución**:
```bash
# Ver errores específicos en /debug-front
# Sección: 📝 Console Logs
```

### Problema 2: No carga eventos después de login

**Verificar**:
1. En `/debug-front` → `eventsGroupDone: true`?
2. En `/debug-front` → `Eventos cargados: N` (N > 0)?

**Solución**:
- Si `eventsGroupDone: false` → Esperar 2-3 segundos
- Si `Eventos cargados: 0` → El usuario no tiene eventos, crear uno nuevo

### Problema 3: No veo el Copilot

**Verificar**:
1. ¿Estás en una sección válida? (Invitados, Presupuesto, etc.)
2. ¿No estás en una ruta excluida? (login, info-app, etc.)

**Solución**:
```javascript
// En Console (F12):
document.querySelector('[data-copilot]') // Debe retornar un elemento
```

### Problema 4: Sidebar no aparece

**Verificar archivo**: `components/DefaultLayout/Container.tsx`

Líneas 48-56 tienen rutas excluidas:
```tsx
const excludeChatSidebar = [
  "info-app",
  "confirmar-asistencia",
  "RelacionesPublicas",
  "public-card",
  "public-itinerary",
  "copilot",
  "login"
];
```

Si estás en alguna de estas rutas, el Copilot NO aparecerá.

---

## 📸 Screenshots Recomendados

Tomar capturas de pantalla de:

### 1. Debug Page
```
http://localhost:8080/debug-front
```
- Después de login exitoso
- Mostrando eventos cargados

### 2. Console (DevTools)
- Presionar F12
- Pestaña Console
- Capturar cualquier error en rojo

### 3. Network (DevTools)
- Presionar F12
- Pestaña Network
- Filtrar por XHR/Fetch
- Capturar peticiones a `/api/copilot/chat`

### 4. Copilot Abierto
- Sidebar con el editor visible
- Los 4 botones visibles: 😊 📎 </> •

---

## 🎯 Checklist de Verificación

Antes de decir "está funcionando", verificar:

### Autenticación
- [ ] Usuario logueado (email visible en /debug-front)
- [ ] UID presente
- [ ] verificationDone: true

### Eventos
- [ ] eventsGroupDone: true
- [ ] Al menos 1 evento cargado
- [ ] Evento seleccionado activo

### Copilot
- [ ] Sidebar del Copilot visible
- [ ] Editor con 4 botones visibles: 😊 📎 </> •
- [ ] Textarea responde al input
- [ ] Botón de enviar funciona

### Frontend
- [ ] Sin errores en Console (F12)
- [ ] Clicks funcionan
- [ ] Navegación funciona

---

## 🚨 Si Nada Funciona

### Reset Completo

```bash
# 1. Limpiar todo el estado del navegador
# En Chrome: Cmd+Shift+Delete → Limpiar todo de localhost

# 2. Reiniciar el servidor
pkill -f "next dev"
cd apps/web
pnpm dev -H 127.0.0.1 -p 8080 > /tmp/nextjs-dev.log 2>&1 &

# 3. Esperar a compilación completa
tail -f /tmp/nextjs-dev.log
# Ver mensaje: ✓ Ready in Xs

# 4. Abrir navegador en modo incógnito
# Chrome: Cmd+Shift+N (Mac) o Ctrl+Shift+N (Windows)

# 5. Ir a debug-front
http://localhost:8080/debug-front
```

---

## 📞 Información para Reportar Problemas

Si encuentras un problema, reporta:

### 1. URL donde ocurrió
```
Ejemplo: http://localhost:8080/invitados
```

### 2. Qué hiciste
```
Ejemplo: Hice click en el botón "Crear evento"
```

### 3. Qué esperabas
```
Ejemplo: Esperaba que se abriera un modal
```

### 4. Qué pasó
```
Ejemplo: No pasó nada / Se mostró un error
```

### 5. Logs de Console (si hay)
```
Copiar errores en rojo de F12 → Console
```

### 6. Estado de /debug-front
```
Captura de pantalla de http://localhost:8080/debug-front
```

---

## 🔗 URLs Importantes

| Página | URL | Propósito |
|--------|-----|-----------|
| **Debug** | http://localhost:8080/debug-front | Debugging en tiempo real |
| **Home** | http://localhost:8080/ | Página principal |
| **Login** | http://localhost:8080/login | Autenticación |
| **Test Simple** | http://localhost:8080/test-simple | Verificar que servidor funciona |

---

**Última actualización**: 2026-02-07
**Autor**: Claude Code
**Estado**: ✅ Listo para usar con navegador externo

---

## 🎓 Próximos Pasos

1. ✅ Esperar a que compile
2. ✅ Abrir navegador externo (Chrome/Safari/Firefox)
3. ✅ Ir a http://localhost:8080/debug-front
4. ✅ Hacer login con Firebase
5. ✅ Verificar estado en debug-front
6. ✅ Ir a Home y seleccionar evento
7. ✅ Abrir Copilot y verificar los 4 botones

**¡Éxito!** 🎉
