# 🧪 Plan de Pruebas del Copilot - Editor Completo

**Fecha**: 2026-02-07
**Rama**: feature/nextjs-15-migration
**URL Local**: http://localhost:8080

---

## 📋 Checklist de Pruebas

### 1. ✅ Verificación del Servidor

- [x] Servidor corriendo en localhost:8080
- [x] Respuesta HTTP 200
- [x] Tiempo de respuesta < 0.1s (actual: 0.024s)

### 2. 🎨 Verificación Visual del Editor

#### Abrir la Aplicación
```
1. Navegar a: http://localhost:8080
2. Hacer login con credenciales de prueba
3. Ir a cualquier página del organizador
4. Abrir el Copilot (sidebar derecho)
```

#### Verificar Elementos Visuales
- [ ] **Barra de acciones** visible con 4 botones
  - [ ] Botón 😊 (Emojis)
  - [ ] Botón 📎 (Adjuntar)
  - [ ] Botón `</>` (Código)
  - [ ] Botón `•` (Lista)

- [ ] **Campo de entrada**
  - [ ] Placeholder visible: "Escribe tu mensaje. Presione la tecla ⌘ ↵..."
  - [ ] Textarea responsive
  - [ ] Border rosa al hacer focus

- [ ] **Botón de enviar**
  - [ ] Visible en la esquina inferior derecha
  - [ ] Color rosa (#F7628C) cuando hay texto
  - [ ] Gris cuando está vacío

---

## 🧪 Pruebas Funcionales

### Test 1: Escribir y Enviar Mensaje Básico

**Pasos**:
1. Click en el textarea del Copilot
2. Escribir: "Hola, ¿cómo funciona el organizador?"
3. Presionar Enter o click en botón enviar

**Resultado esperado**:
- ✅ Mensaje se envía
- ✅ Aparece en el historial de chat
- ✅ Copilot responde con información del organizador
- ✅ Textarea se limpia después de enviar

---

### Test 2: Selector de Emojis

**Pasos**:
1. Click en el botón 😊 (Emojis)
2. Verificar que aparece el popup con 16 emojis
3. Click en un emoji (ej: ❤️)
4. Verificar que se inserta en el textarea

**Resultado esperado**:
- ✅ Popup de emojis aparece
- ✅ Muestra 16 emojis: 😊 👍 ❤️ 🎉 🤔 👏 🙏 💕 ✨ 🔥 💐 🎊 💍 🎂 🥂 💒
- ✅ Emoji se inserta en la posición del cursor
- ✅ Popup se cierra después de seleccionar
- ✅ Focus regresa al textarea

---

### Test 3: Insertar Bloque de Código

**Pasos**:
1. Click en el botón `</>` (Código)
2. Verificar que se inserta el bloque de código markdown

**Resultado esperado**:
- ✅ Se inserta:
```
```
(cursor aquí)
```
```
- ✅ Cursor se posiciona dentro del bloque
- ✅ Se puede escribir código

---

### Test 4: Insertar Lista

**Pasos**:
1. Click en el botón `•` (Lista)
2. Verificar que se inserta item de lista

**Resultado esperado**:
- ✅ Se inserta: `\n- `
- ✅ Cursor se posiciona después del guión
- ✅ Se puede escribir el item

---

### Test 5: Auto-resize del Textarea

**Pasos**:
1. Escribir texto largo (varias líneas)
2. Presionar Shift+Enter varias veces
3. Observar el crecimiento del textarea

**Resultado esperado**:
- ✅ Textarea crece automáticamente
- ✅ Máximo de altura: 200px
- ✅ Scroll aparece si excede 200px
- ✅ Se mantiene responsive

---

### Test 6: Estados Visuales

#### Focus
**Pasos**: Click en el textarea

**Resultado esperado**:
- ✅ Border cambia a rosa (#F7628C)
- ✅ Shadow rosa suave aparece
- ✅ Transición suave (0.2s)

#### Hover en Botones
**Pasos**: Pasar mouse sobre botones de acción

**Resultado esperado**:
- ✅ Background cambia a gris claro
- ✅ Color del ícono cambia a rosa
- ✅ Transición suave

---

### Test 7: Envío con Enter

**Pasos**:
1. Escribir mensaje
2. Presionar Enter (sin Shift)

**Resultado esperado**:
- ✅ Mensaje se envía
- ✅ NO se agrega nueva línea

**Pasos**:
1. Escribir mensaje
2. Presionar Shift+Enter

**Resultado esperado**:
- ✅ NO se envía mensaje
- ✅ Se agrega nueva línea

---

### Test 8: Botón de Detener

**Pasos**:
1. Enviar mensaje largo que requiere procesamiento
2. Observar que aparece botón "Detener" (rojo)
3. Click en botón detener

**Resultado esperado**:
- ✅ Botón enviar cambia a botón detener
- ✅ Color rojo (#ef4444)
- ✅ Click detiene la generación
- ✅ Mensaje parcial se muestra

---

### Test 9: Deshabilitar Input Durante Carga

**Pasos**:
1. Enviar mensaje
2. Mientras está cargando, intentar escribir

**Resultado esperado**:
- ✅ Textarea está deshabilitado
- ✅ Botones de acción deshabilitados
- ✅ Solo botón "Detener" activo

---

### Test 10: Integración Completa - Flujo Real

**Pasos**:
1. Abrir Copilot
2. Click en botón emojis
3. Seleccionar emoji 💍
4. Escribir: " Quiero agregar invitados a mi boda"
5. Click en botón código
6. Dentro del bloque escribir: "Juan Pérez, María García"
7. Presionar Enter para enviar

**Resultado esperado**:
- ✅ Mensaje completo se envía: "💍 Quiero agregar invitados a mi boda\n```\nJuan Pérez, María García\n```"
- ✅ Copilot responde con información sobre cómo agregar invitados
- ✅ Posiblemente muestra botones de acción o tarjetas enriquecidas
- ✅ Conversación fluida

---

## 🔄 Pruebas de Regresión

### Funcionalidades Existentes

- [ ] **Mensajes anteriores** se mantienen en el historial
- [ ] **Scroll automático** al fondo cuando llega nuevo mensaje
- [ ] **Botón "Abrir en pantalla completa"** funciona
- [ ] **Botón expandir** abre el chat en nueva pestaña
- [ ] **Context del evento** se pasa correctamente al Copilot
- [ ] **Errores del backend** se muestran correctamente
- [ ] **Botón "Copiar reporte"** funciona en errores

---

## 🎯 Pruebas de Rendimiento

### Métricas a Verificar

| Métrica | Esperado | Cómo verificar |
|---------|----------|----------------|
| **Tiempo de carga inicial** | < 2s | Abrir DevTools > Network |
| **Tiempo de envío** | < 100ms | Network tab al enviar |
| **Tiempo de respuesta** | Variable | Depende del backend |
| **Memory usage** | Estable | DevTools > Memory |
| **Re-renders** | Mínimos | React DevTools |

---

## 📱 Pruebas Responsive

### Desktop (> 1024px)
- [ ] Sidebar derecho con ancho 500-600px
- [ ] Todos los botones visibles
- [ ] Texto legible

### Tablet (768px - 1024px)
- [ ] Sidebar adaptado
- [ ] Botones en tamaño adecuado

### Mobile (< 768px)
- [ ] Chat ocupa pantalla completa
- [ ] Botones táctiles (mínimo 44px)
- [ ] Fácil de usar con el pulgar

---

## 🌐 Pruebas Cross-Browser

### Navegadores a Probar
- [ ] **Chrome** (versión actual)
- [ ] **Firefox** (versión actual)
- [ ] **Safari** (versión actual)
- [ ] **Edge** (versión actual)

### Funcionalidades Críticas
- [ ] Auto-resize del textarea
- [ ] Selector de emojis (posicionamiento del popup)
- [ ] Estilos (border rosa, shadows)
- [ ] Inserción de texto en posición del cursor

---

## 🐛 Pruebas de Edge Cases

### Test 1: Texto Muy Largo
**Input**: Texto de 5000 caracteres

**Resultado esperado**:
- ✅ Se maneja correctamente
- ✅ Textarea alcanza máximo de 200px
- ✅ Scroll funciona
- ✅ Se envía sin problemas

### Test 2: Caracteres Especiales
**Input**: `<script>alert('test')</script>`

**Resultado esperado**:
- ✅ NO se ejecuta como código
- ✅ Se muestra como texto plano
- ✅ Se escapa correctamente

### Test 3: Emojis en el Texto
**Input**: "🎉🎊💒💍🥂"

**Resultado esperado**:
- ✅ Se renderizan correctamente
- ✅ No rompen el layout
- ✅ Se envían correctamente

### Test 4: Rápida Sucesión de Mensajes
**Pasos**: Enviar 5 mensajes muy rápido

**Resultado esperado**:
- ✅ Todos se envían en orden
- ✅ No se pierde ninguno
- ✅ UI no se bloquea

### Test 5: Sin Conexión a Internet
**Pasos**: Desconectar internet, enviar mensaje

**Resultado esperado**:
- ✅ Muestra error de conexión
- ✅ Permite reintentar
- ✅ No pierde el mensaje

---

## 📊 Resultados Esperados

### Criterios de Aceptación

#### Funcionalidad ✅
- [ ] Todos los botones funcionan
- [ ] Envío de mensajes correcto
- [ ] Respuestas del Copilot llegan
- [ ] Auto-resize funciona
- [ ] Estados visuales correctos

#### UX ✅
- [ ] Interfaz intuitiva
- [ ] Feedback visual claro
- [ ] Transiciones suaves
- [ ] Responsive en todos los dispositivos

#### Performance ✅
- [ ] Sin lag al escribir
- [ ] Respuesta inmediata del UI
- [ ] Memory usage estable
- [ ] Sin re-renders innecesarios

#### Estabilidad ✅
- [ ] Sin crashes
- [ ] Sin errores en consola (excepto warnings conocidos)
- [ ] Manejo de errores correcto

---

## 🔍 Debugging y Logs

### Herramientas de Desarrollo

#### Console Logs a Verificar
```javascript
// Al enviar mensaje
[Copilot] Message sent X ms

// Al recibir respuesta
[Copilot API] Response received

// En caso de error
[Copilot API] Backend error, status: XXX
```

#### Network Tab
- Verificar llamadas a `/api/copilot/chat`
- Status: 200 OK
- Response type: `text/event-stream` (SSE)
- Headers correctos

#### React DevTools
- Verificar props del CopilotInputEditor
- Verificar re-renders
- Verificar estado del componente

---

## 📝 Reporte de Bugs

### Formato
```markdown
**Bug**: [Descripción breve]
**Pasos para reproducir**:
1. ...
2. ...

**Resultado esperado**: ...
**Resultado actual**: ...
**Navegador**: Chrome 120
**Screenshot**: [si aplica]
```

### Categorías de Severidad
- 🔴 **Crítico**: Impide usar la funcionalidad
- 🟡 **Alto**: Funcionalidad limitada
- 🟢 **Medio**: UX afectada
- 🔵 **Bajo**: Cosmético

---

## ✅ Checklist Final

### Antes de Marcar como Completo
- [ ] Todas las pruebas funcionales pasaron
- [ ] Sin errores críticos en consola
- [ ] Performance aceptable
- [ ] Responsive en desktop y mobile
- [ ] Cross-browser verificado
- [ ] Edge cases manejados
- [ ] Documentación actualizada

---

## 🎬 Video de Demostración

### Grabar Demostración
**Duración**: 2-3 minutos

**Contenido**:
1. Abrir aplicación (0:00-0:10)
2. Mostrar editor completo (0:10-0:30)
3. Probar botón de emojis (0:30-0:45)
4. Insertar código (0:45-1:00)
5. Enviar mensaje completo (1:00-1:30)
6. Mostrar respuesta del Copilot (1:30-2:00)
7. Mostrar estados visuales (2:00-2:30)
8. Resumen final (2:30-3:00)

---

## 📞 Contacto para Reporte

**Issues**: https://github.com/marketingsoluciones/AppBodasdehoy.com/issues
**Rama**: feature/nextjs-15-migration

---

**Creado**: 2026-02-07
**Autor**: Claude Code
**Versión**: 1.0
