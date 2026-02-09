# 🎨 Guía de Verificación Visual del Chat

**Objetivo**: Verificar que el chat funciona correctamente en el navegador

---

## ✅ Checklist de Verificación

### 1. Acceso Básico

- [ ] Abrir http://localhost:8080/copilot
- [ ] La página carga sin errores 404 o 500
- [ ] No hay errores en la consola del navegador (F12)
- [ ] Si no estás logueado, redirige al login

### 2. UI Inicial (Empty State)

- [ ] Se muestra el emoji 💬 grande
- [ ] Aparece el mensaje "¡Hola! Soy tu asistente Copilot"
- [ ] Hay un texto descriptivo debajo
- [ ] El input de chat está visible en la parte inferior
- [ ] Aparece el texto "Enter para enviar"

### 3. Envío de Primer Mensaje

**Escribe**: "Hola, ¿cómo estás?"

- [ ] El mensaje se envía al presionar Enter
- [ ] Aparece burbuja ROSA con tu mensaje (lado derecho)
- [ ] Aparece indicador de loading (3 puntos animados)
- [ ] Desaparece el empty state
- [ ] Después de ~1-3 segundos aparece respuesta del Copilot
- [ ] Burbuja BLANCA con respuesta (lado izquierdo)
- [ ] Cada mensaje tiene timestamp (HH:MM)

### 4. Múltiples Mensajes

**Escribe varios mensajes**:
1. "¿Qué puedes hacer?"
2. "Ayúdame con mi evento"
3. "Quiero agregar invitados"

- [ ] Todos los mensajes aparecen correctamente
- [ ] Las burbujas alternan rosa/blanco
- [ ] Auto-scroll funciona (va al último mensaje)
- [ ] Loading indicator aparece en cada envío
- [ ] Timestamps diferentes en cada mensaje

### 5. Formato de Respuestas

- [ ] Las respuestas tienen saltos de línea correctos
- [ ] Si hay **negritas** se muestran correctamente
- [ ] Si hay emojis 😊 se muestran correctamente
- [ ] Si hay links [Ver invitados](/invitados) se muestran
  - [ ] ⚠️ Por ahora como texto plano (markdown pendiente)

### 6. Estados de Error

**Detén el servidor** (Ctrl+C en la terminal) y luego:

**Escribe**: "Hola"

- [ ] Aparece mensaje de error
- [ ] El error es amigable al usuario
- [ ] No muestra detalles técnicos sensibles

**Reinicia el servidor** y verifica que vuelve a funcionar.

### 7. Responsive Design

**Redimensiona la ventana**:

- [ ] En pantalla grande: burbujas ocupan max 80% del ancho
- [ ] En pantalla pequeña: burbujas se adaptan
- [ ] Input siempre visible en la parte inferior
- [ ] Auto-scroll funciona en cualquier tamaño

### 8. Performance

- [ ] La página no se congela al enviar mensajes
- [ ] Las animaciones son suaves (loading, auto-scroll)
- [ ] No hay lag al escribir en el input
- [ ] Las respuestas llegan en tiempo razonable (< 5s)

---

## 🐛 Problemas Comunes y Soluciones

### Problema: "La página no carga"

**Verificar**:
```bash
# ¿Está el servidor corriendo?
curl http://localhost:8080/copilot

# Si da error, iniciar servidor:
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com
npm run dev
```

### Problema: "Redirige al login infinitamente"

**Causa**: No hay sesión activa

**Solución**:
1. Ir a http://localhost:8080/login
2. Iniciar sesión con credenciales válidas
3. Volver a /copilot

### Problema: "Los mensajes no se envían"

**Verificar en DevTools**:
1. F12 → Tab "Console"
2. Buscar errores en rojo
3. Tab "Network" → Filtrar por "chat"
4. Ver si hay requests fallidos

**Posibles causas**:
- Backend IA no responde (api-ia.bodasdehoy.com)
- Error en el código del handler
- Variables de entorno mal configuradas

### Problema: "Loading infinito"

**Causa**: Request a la API falla pero no se maneja el error

**Solución**:
1. Ver consola del navegador (F12)
2. Ver logs del servidor en terminal
3. Verificar que handleSendMessage tiene try/catch

### Problema: "Las burbujas se ven mal"

**Verificar**:
- Que Tailwind CSS esté cargando
- En DevTools → Elements → Ver clases aplicadas
- Si faltan clases, revisar configuración de Tailwind

---

## 📸 Screenshots Esperados

### Estado Inicial (Empty State)
```
┌─────────────────────────────────────┐
│                                     │
│               💬                    │
│                                     │
│   ¡Hola! Soy tu asistente Copilot  │
│                                     │
│  Pregúntame lo que necesites...    │
│                                     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Escribe un mensaje...  Enter ▶     │
└─────────────────────────────────────┘
```

### Con Mensajes
```
┌─────────────────────────────────────┐
│                                     │
│              ┌──────────────┐       │
│              │ Hola, ¿cómo │  Rosa  │
│              │ estás?      │  (Tú)  │
│              │ 18:50       │       │
│              └──────────────┘       │
│                                     │
│  ┌────────────────────┐            │
│  │ ¡Hola! Soy Copilot│ Blanco     │
│  │ ¿En qué puedo     │ (Asistente)│
│  │ ayudarte?         │            │
│  │ 18:50             │            │
│  └────────────────────┘            │
│                                     │
│         ┌────────────────┐         │
│         │ • • •          │ Loading │
│         └────────────────┘         │
│                                     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Escribe un mensaje...  Enter ▶     │
└─────────────────────────────────────┘
```

---

## ✅ Resultado Esperado

Al final de esta verificación deberías tener:

✅ **UI funcionando**
- Empty state correcto
- Burbujas de chat visibles
- Colores diferenciados (rosa/blanco)
- Timestamps en cada mensaje

✅ **Interacción fluida**
- Envío con Enter funciona
- Loading indicator aparece
- Respuestas llegan correctamente
- Auto-scroll automático

✅ **Sin errores**
- Consola del navegador limpia
- Sin requests fallidos en Network
- Sin errores 500 en el servidor

✅ **Performance aceptable**
- Respuestas en < 5 segundos
- UI no se congela
- Animaciones suaves

---

## 🚀 Próximas Mejoras Visuales

Una vez verificado todo lo anterior, estas mejoras harían el chat aún mejor:

### 1. Renderizado de Markdown ⭐ PRÓXIMO PASO
```tsx
// Instalar: pnpm add react-markdown remark-gfm
import ReactMarkdown from 'react-markdown';

// En el mensaje:
<ReactMarkdown>{msg.content}</ReactMarkdown>
```

**Beneficio**: Links clickeables, negritas, listas, etc.

### 2. Syntax Highlighting
```tsx
// Para bloques de código
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
```

**Beneficio**: Código con colores cuando el Copilot responda con ejemplos

### 3. Typing Indicator Animado
```tsx
// Más profesional que los 3 puntos
<div className="typing-indicator">
  <span></span><span></span><span></span>
</div>
```

### 4. Botones de Acción
```tsx
// Debajo de respuestas del Copilot
<button>Ver invitados</button>
<button>Agregar gasto</button>
```

**Beneficio**: Acciones rápidas sin escribir

---

**Última actualización**: 2026-02-08 19:00
**Tiempo estimado**: 10 minutos de verificación
