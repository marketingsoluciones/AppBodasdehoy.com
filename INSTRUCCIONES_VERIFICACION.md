# ✅ Servidores Iniciados - Guía de Verificación

**Fecha**: 2026-02-09 20:00
**Estado**: Ambos servidores corriendo

---

## 🚀 Estado de Servidores

| Servidor | Puerto | URL | Estado |
|----------|--------|-----|--------|
| apps/copilot | 3210 | http://localhost:3210 | ✅ Corriendo |
| apps/web | 8080 | http://localhost:8080 | ✅ Corriendo |

---

## 🧪 Checklist de Verificación

### 1️⃣ Verificar apps/copilot Independiente

**URL**: http://localhost:3210

**Abrir en navegador y verificar**:
- ✅ Debe mostrar LobeChat completo
- ✅ Editor completo con toolbar visible
- ✅ Botones de plugins funcionando
- ✅ **SIN elementos de bodasdehoy.com**
- ✅ **SIN menú de navegación de bodasdehoy**
- ✅ **SIN header de bodasdehoy**

**Capturas esperadas**:
```
┌─────────────────────────────────┐
│ LobeChat                        │
│ ┌─────────────────────────────┐ │
│ │ Editor de chat              │ │
│ │ [Toolbar con plugins]       │ │
│ │ - Slash commands            │ │
│ │ - @mentions                 │ │
│ │ - File upload               │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

### 2️⃣ Verificar apps/web con Copilot Sidebar

**URL**: http://localhost:8080

**Pasos**:
1. Abrir http://localhost:8080 en navegador
2. Hacer login si es necesario
3. **Buscar botón "Copilot"** en esquina superior derecha
4. Click en el botón
5. Se abre sidebar a la izquierda

**Verificaciones CRÍTICAS**:

#### ✅ Verificaciones Positivas (debe tener):
- ✅ Sidebar abierto en el lado izquierdo
- ✅ Dentro del sidebar: LobeChat en iframe
- ✅ Editor de LobeChat visible
- ✅ Funcionalidad de chat funcionando

#### ❌ Verificaciones Negativas (NO debe tener):
- ❌ **Menú de bodasdehoy duplicado** (si aparece 2 veces = PROBLEMA)
- ❌ **Menú de usuario duplicado** (nombre/avatar aparece 2 veces = PROBLEMA)
- ❌ **Contenido viejo de `/chat`** (mensajes como "Prueba eventos, largo array" = PROBLEMA)
- ❌ **Elementos en bucle** (componentes cargando infinitamente = PROBLEMA)
- ❌ **Interfaz mezclada** (iconos de bodasdehoy dentro del chat = PROBLEMA)

---

### 3️⃣ Verificar Botón "Ver completo"

**Con el sidebar abierto**:
1. Buscar botón "Ver completo" o icono de expandir
2. Click en el botón
3. **Debe abrir nueva pestaña** con http://localhost:3210
4. La nueva pestaña muestra LobeChat completo independiente

**Resultado esperado**:
```
[Sidebar en web] → [Click "Ver completo"] → [Nueva pestaña: localhost:3210]
```

---

### 4️⃣ Inspeccionar DOM (DevTools)

**Abrir DevTools** (F12 o Click derecho → Inspeccionar)

**Pestaña Elements**:
1. Buscar el elemento del sidebar
2. **Verificar que hay UN SOLO iframe**:
   ```html
   <iframe src="http://localhost:3210?..." title="...">
   ```
3. **NO debe haber**:
   - Múltiples iframes cargando el mismo contenido
   - Componentes `CopilotChatNative`
   - Componentes `CopilotInputEditor`
   - Elementos duplicados

**Pestaña Console**:
- ✅ **Puede haber**: Logs de `[CopilotIframe]` (normal)
- ❌ **NO debe haber**:
  - Errores "Cannot find module"
  - Errores "Failed to import"
  - Errores de postMessage
  - Errores de CORS

**Pestaña Network**:
- ✅ Request a `localhost:3210` debe ser exitoso (status 200)
- ✅ Iframe debe cargar correctamente

---

## 🔍 Casos de Uso Reales

### Caso 1: Usuario Autenticado
```
1. Login en localhost:8080
2. Abrir Copilot (sidebar izquierdo)
3. Escribir mensaje: "Hola"
4. ✅ LobeChat responde dentro del sidebar
5. ✅ NO hay duplicación de menús
```

### Caso 2: Crear Evento y Usar Copilot
```
1. Login en localhost:8080
2. Crear nuevo evento
3. Abrir Copilot
4. ✅ Copilot debe tener contexto del evento
5. ✅ Puede ayudar con tareas del evento
```

### Caso 3: Abrir en Nueva Pestaña
```
1. Copilot abierto en sidebar
2. Click "Ver completo"
3. ✅ Se abre localhost:3210 en nueva pestaña
4. ✅ Misma conversación continúa
5. ✅ Todas las funciones de LobeChat disponibles
```

---

## 🐛 Detección de Problemas

### ❌ PROBLEMA: Menú Duplicado
**Síntoma**: Ves el header de bodasdehoy 2 veces
**Causa**: JavaScript viejo en caché
**Solución**:
```bash
# Hard refresh del navegador
Cmd + Shift + R (Mac)
Ctrl + Shift + R (Windows/Linux)

# O usar ventana de incógnito
Cmd + Shift + N (Chrome)
Cmd + Shift + P (Firefox)
```

### ❌ PROBLEMA: Contenido Viejo de `/chat`
**Síntoma**: Ves "Prueba eventos, largo array" u otros mensajes viejos
**Causa**: Caché del navegador
**Solución**:
```bash
# Limpiar caché y hard refresh
1. Cmd + Shift + Delete
2. Seleccionar "Caché"
3. Borrar
4. Cmd + Shift + R
```

### ❌ PROBLEMA: Iframe No Carga
**Síntoma**: Sidebar en blanco o error "Failed to load"
**Causa**: apps/copilot no está corriendo
**Solución**:
```bash
# Verificar proceso
lsof -ti:3210

# Si no hay salida, reiniciar
cd apps/copilot
pnpm dev
```

---

## 📊 Arquitectura Verificada

Si todo está correcto, debes ver esta arquitectura funcionando:

```
┌─────────────────────────────────────────────┐
│ Navegador: localhost:8080                   │
│ ┌─────────────────────────────────────────┐ │
│ │ AppBodasdehoy                           │ │
│ │ - Header (1 vez)                        │ │
│ │ - Menú usuario (1 vez)                  │ │
│ │ - Contenido principal                   │ │
│ │                                         │ │
│ │ Sidebar izquierdo:                      │ │
│ │ ┌─────────────────────────────────────┐ │ │
│ │ │ <iframe src="localhost:3210">       │ │ │
│ │ │   LobeChat completo                 │ │ │
│ │ │   - Editor                          │ │ │
│ │ │   - Plugins                         │ │ │
│ │ │   - NO elementos de bodasdehoy      │ │ │
│ │ └─────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 📝 Registro de Verificación

**Completa este checklist y reporta resultados**:

### apps/copilot independiente (localhost:3210)
- [ ] LobeChat se muestra completo
- [ ] Editor visible con toolbar
- [ ] SIN elementos de bodasdehoy
- [ ] Puede escribir mensajes
- [ ] Plugins funcionando

### apps/web con sidebar (localhost:8080)
- [ ] Login funciona
- [ ] Botón Copilot visible
- [ ] Sidebar se abre al hacer click
- [ ] iframe de LobeChat visible dentro
- [ ] NO hay menú duplicado
- [ ] NO hay menú de usuario duplicado
- [ ] Chat funciona dentro del sidebar

### Botón "Ver completo"
- [ ] Botón visible en sidebar
- [ ] Click abre nueva pestaña
- [ ] Nueva pestaña: localhost:3210
- [ ] Conversación continúa

### DevTools
- [ ] UN SOLO iframe en Elements
- [ ] Console SIN errores críticos
- [ ] Network: request a 3210 exitoso

---

## 🎯 Resultado Esperado

Si **TODO está ✅**, la reversión fue exitosa y la arquitectura está restaurada correctamente.

Si **ALGO está ❌**, reporta exactamente qué está fallando con:
1. Captura de pantalla
2. Mensajes de error en Console
3. Descripción del comportamiento incorrecto

---

## 🛑 Detener Servidores

**Cuando termines las pruebas**:

```bash
# Detener ambos servidores
lsof -ti:3210 -ti:8080 | xargs kill -9
```

O simplemente cerrar las terminales donde están corriendo.

---

**Última actualización**: 2026-02-09 20:00
**Servidores**: ✅ Ambos corriendo
**Próximo paso**: Verificación manual por usuario
