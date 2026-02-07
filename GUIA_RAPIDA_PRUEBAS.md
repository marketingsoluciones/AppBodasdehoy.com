# 🚀 Guía Rápida - Probar el Editor del Copilot

**Tiempo estimado**: 5-10 minutos
**URL**: http://localhost:8080

---

## ✅ Pre-requisitos

```bash
# Verificar que el servidor está corriendo
./scripts/verify-copilot-editor.sh

# Si no está corriendo:
pnpm dev:web
```

---

## 🎯 Pruebas Rápidas (5 minutos)

### 1. Abrir la Aplicación 🌐

```
1. Navegar a: http://localhost:8080
2. Hacer login con tus credenciales
3. Ir a cualquier sección (Invitados, Presupuesto, etc.)
4. Buscar el botón del Copilot en el sidebar derecho
5. Click para abrir el Copilot
```

---

### 2. Verificar el Editor Completo ✨

**Lo que debes ver**:

```
┌─────────────────────────────────────┐
│ 😊  📎  </>  •                     │ ← Barra de acciones (4 botones)
├─────────────────────────────────────┤
│                                     │
│ Escribe tu mensaje. Presione...    │ ← Textarea con placeholder
│                                [✉️] │ ← Botón enviar
│                                     │
└─────────────────────────────────────┘
```

**Verificar**:
- ✅ Ves 4 botones en la parte superior
- ✅ El placeholder es completo (no dice solo "Escribe...")
- ✅ El botón de enviar está visible

---

### 3. Probar Emojis 😊

```
1. Click en el botón 😊 (primer botón)
2. Debe aparecer un popup con emojis
3. Click en un emoji (ej: ❤️)
4. Debe insertarse en el textarea
```

**Resultado esperado**:
```
Popup con 16 emojis:
😊 👍 ❤️ 🎉 🤔 👏 🙏 💕
✨ 🔥 💐 🎊 💍 🎂 🥂 💒
```

---

### 4. Probar Insertar Código 💻

```
1. Click en el botón </> (tercer botón)
2. Debe insertarse un bloque de código:
   ```

   ```
3. Escribir dentro: "console.log('test')"
```

**Resultado esperado**:
- ✅ Se inserta el bloque de código markdown
- ✅ El cursor se posiciona dentro del bloque
- ✅ Puedes escribir código

---

### 5. Probar Insertar Lista 📝

```
1. Click en el botón • (cuarto botón)
2. Debe insertarse: "- "
3. Escribir: "Item de prueba"
```

**Resultado esperado**:
- ✅ Se inserta "- " en una nueva línea
- ✅ Cursor se posiciona después del guión
- ✅ Puedes escribir el item

---

### 6. Probar Envío de Mensaje 📨

```
1. Escribir: "Hola, ¿cómo puedo agregar invitados?"
2. Presionar Enter (o click en botón enviar)
3. Observar la respuesta
```

**Resultado esperado**:
- ✅ Mensaje se envía
- ✅ Aparece en el historial
- ✅ Textarea se limpia
- ✅ Copilot responde con información útil
- ✅ Posiblemente muestra botones de acción o tarjetas

---

### 7. Probar Estados Visuales 🎨

#### Focus
```
1. Click en el textarea
2. Observar el border
```
**Debe**: Cambiar a rosa (#F7628C) con shadow suave

#### Hover
```
1. Pasar mouse sobre los botones de acción
2. Observar el cambio
```
**Debe**: Background gris claro, ícono rosa

---

### 8. Probar Shift+Enter ⏎

```
1. Escribir algo en el textarea
2. Presionar Shift+Enter
3. Debe agregar nueva línea (NO enviar)
```

**Resultado esperado**:
- ✅ Nueva línea agregada
- ✅ Mensaje NO se envía
- ✅ Textarea crece

---

### 9. Probar Auto-resize 📏

```
1. Escribir varias líneas presionando Shift+Enter
2. Observar cómo crece el textarea
```

**Resultado esperado**:
- ✅ Textarea crece automáticamente
- ✅ Máximo: 200px de altura
- ✅ Scroll aparece si excede

---

### 10. Prueba Completa: Mensaje con Todo 🎯

```
1. Click en emoji → Seleccionar 💍
2. Escribir: " Mi boda es el 15 de junio"
3. Presionar Shift+Enter
4. Click en botón código
5. Dentro escribir: "Invitados: 150"
6. Presionar Enter para enviar
```

**Mensaje final debe ser**:
```
💍 Mi boda es el 15 de junio
```
Invitados: 150
```
```

**Resultado esperado**:
- ✅ Todo se combina correctamente
- ✅ Se envía completo
- ✅ Copilot responde apropiadamente

---

## 🐛 ¿Qué hacer si algo falla?

### El servidor no carga
```bash
# Detener y reiniciar
pkill -f "next dev"
pnpm dev:web
```

### No veo los botones
```bash
# Limpiar cache y rebuild
rm -rf apps/web/.next
pnpm --filter @bodasdehoy/web build
pnpm dev:web
```

### Errores en consola
```
1. Abrir DevTools (F12)
2. Ir a Console tab
3. Copiar los errores
4. Revisar si son críticos o solo warnings
```

### El Copilot no responde
```
# Verificar que el backend está disponible
# Esto es normal en desarrollo local
# El componente nativo debe funcionar igual
```

---

## 📊 Checklist Rápido

Marca lo que funciona:

- [ ] ✅ Editor se ve completo (4 botones visibles)
- [ ] ✅ Selector de emojis funciona
- [ ] ✅ Insertar código funciona
- [ ] ✅ Insertar lista funciona
- [ ] ✅ Enviar mensaje funciona (Enter)
- [ ] ✅ Shift+Enter agrega nueva línea
- [ ] ✅ Auto-resize del textarea funciona
- [ ] ✅ Estados visuales (focus, hover) funcionan
- [ ] ✅ Respuestas del Copilot llegan
- [ ] ✅ Sin errores críticos en consola

---

## 🎥 Captura de Pantalla

**Toma screenshot de**:
1. Editor completo con los 4 botones
2. Popup de emojis abierto
3. Mensaje completo enviado
4. Respuesta del Copilot

---

## 📝 Reporte

Si todo funciona:
```
✅ Editor del Copilot funcionando al 100%
✅ Todas las funcionalidades operativas
✅ Listo para producción
```

Si hay problemas:
```
Crear issue en GitHub con:
- Descripción del problema
- Pasos para reproducir
- Screenshot
- Errores de consola
```

---

## 🚀 Siguiente Paso

Una vez verificado todo:

```bash
# Crear Pull Request
git push origin feature/nextjs-15-migration

# O deployar directamente si todo está OK
```

---

**Tiempo total**: ~5-10 minutos
**Creado**: 2026-02-07
**Autor**: Claude Code
