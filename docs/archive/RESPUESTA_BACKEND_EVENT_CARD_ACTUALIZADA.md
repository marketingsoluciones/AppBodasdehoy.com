# ✅ Respuesta ACTUALIZADA: Aclarando EventInfoModal vs event_card

**De**: Frontend Team
**Para**: Backend Team
**Fecha**: 2026-02-03 (Actualizado)
**Re**: Clarificación sobre necesidad de `event_card` y EventInfoModal

---

## 🎯 Corrección Importante

Tras revisar el código con más detalle, confirmo que:

### ✅ SÍ existe un componente que muestra info del evento: `EventInfoModal`

**Ubicación**: `apps/web/components/Presupuesto/PresupuestoV2/modals/EventInfoModal.tsx`

**Qué muestra**:
- Invitados confirmados vs estimados
- Detalles del evento (nombre, moneda, categorías)
- Progreso del presupuesto (% pagado, pendiente)

### ⚠️ PERO es un MODAL temporal, NO un viewer lateral permanente

**Diferencias clave**:

| Característica | EventInfoModal | Event Viewer Lateral (NO existe) | event_card (propuesto) |
|----------------|----------------|----------------------------------|------------------------|
| **Tipo** | Modal temporal | Panel lateral fijo | Inline en chat |
| **Visibilidad** | Solo cuando se abre manualmente | Siempre visible | Automático en respuestas |
| **Ubicación** | Overlay sobre la página | Lado derecho fijo | Dentro del chat |
| **Páginas** | Solo presupuesto | Todas (hipotético) | Donde esté el chat |
| **Interacción** | Click botón para abrir | Siempre visible | Automático al preguntar |
| **Cierre** | Manual (botón X) | No aplica | No se cierra |

---

## 📐 Visualización de la Arquitectura Real

### 1️⃣ Página de Presupuesto (donde existe EventInfoModal)

```
┌─────────────────────────────────────────────────────────┐
│ Presupuesto                                             │
│ [Info 📋] [Filtros] [Columnas]                         │
│                                                          │
│  ┌─────────────────┐                                    │
│  │ EventInfoModal  │ ← Solo aparece al hacer click     │
│  │ (modal flotante)│                                    │
│  │                 │                                    │
│  │ 👥 150 invitados│                                    │
│  │ 💰 25k EUR      │                                    │
│  │ ✅ 80% pagado   │                                    │
│  │ [X Cerrar]      │                                    │
│  └─────────────────┘                                    │
│                                                          │
│ Tabla de gastos...                                      │
└─────────────────────────────────────────────────────────┘
```

### 2️⃣ Chat con Copilot (donde iría event_card)

```
┌────────────────────────────────────────────────┐
│ 🤖 Copilot                                     │
│                                                │
│ Usuario: ¿Cómo va mi evento?                   │
│                                                │
│ Asistente: Aquí está el resumen:              │
│                                                │
│ ┌────────────────────────────────────────────┐│
│ │ 💍 Boda de Ana                             ││  ← event_card
│ │ boda · 11 sep 2024                         ││     (inline en chat)
│ ├────────────────────────────────────────────┤│
│ │ 👥 150  ✅ 120  ⏳ 30                      ││
│ ├────────────────────────────────────────────┤│
│ │ [👥 Ver invitados] [⏳ Pendientes (30)]   ││
│ └────────────────────────────────────────────┘│
│                                                │
│ Usuario: ...                                   │
└────────────────────────────────────────────────┘
```

---

## 🤔 ¿Son Redundantes?

### ❌ NO, no son redundantes porque:

1. **Contextos diferentes**:
   - EventInfoModal: Solo en página de presupuesto
   - event_card: En chat copilot (múltiples páginas)

2. **Trigger diferente**:
   - EventInfoModal: Requiere click manual en botón
   - event_card: Automático cuando usuario pregunta

3. **Propósito diferente**:
   - EventInfoModal: Vista detallada para editar invitados estimados
   - event_card: Preview rápido en conversación

4. **No coexisten**:
   - EventInfoModal aparece SOBRE la página
   - event_card aparece DENTRO del chat

---

## 💡 Respuesta a las Preguntas del Backend

### 1. ¿Cuál es el caso de uso específico?

✅ **Preview rápido en contexto conversacional sin salir del chat**

El usuario puede:
- Hacer una pregunta al copilot ("¿Cómo va la boda de Ana?")
- Ver información estructurada inmediatamente en el chat
- Hacer click en un botón para ir a la página específica con filtros

**vs** EventInfoModal que requiere:
- Navegar a la página de presupuesto
- Hacer click en el botón "info"
- Ver el modal flotante
- Cerrar manualmente

### 2. ¿En qué contextos se muestra?

✅ **Solo cuando el usuario pregunta por un evento específico al copilot**

EventInfoModal se muestra: Solo en presupuesto, solo con click manual
event_card se mostraría: En cualquier página con chat, automáticamente

### 3. ¿El viewer lateral está siempre visible?

❌ **NO hay viewer lateral permanente**

Solo hay:
- EventInfoModal (temporal, presupuesto, manual)
- Chat copilot (opcional, muchas páginas, automático)

---

## 📊 Comparativa Actualizada

| Escenario | EventInfoModal | event_card | ¿Necesario? |
|-----------|----------------|------------|-------------|
| Usuario en presupuesto | ✅ Disponible (manual) | ✅ Útil (auto) | SÍ (diferente trigger) |
| Usuario en invitados | ❌ No existe | ✅ Útil (auto) | **SÍ** |
| Usuario en itinerario | ❌ No existe | ✅ Útil (auto) | **SÍ** |
| Usuario pregunta en chat | ❌ No aplica | ✅ Útil (auto) | **SÍ** |
| Usuario edita datos | ✅ Modal interactivo | ❌ Solo lectura | Ambos (diferentes propósitos) |

---

## 🎯 Decisión Final Actualizada

### ✅ Backend DEBE implementar event_card

**Razones**:
1. ✅ EventInfoModal solo existe en presupuesto (1 página)
2. ✅ EventInfoModal requiere acción manual (click)
3. ✅ event_card funciona en cualquier página con chat
4. ✅ event_card es automático (respuesta a pregunta)
5. ✅ NO son redundantes - casos de uso distintos

### 📏 Versión Recomendada: Compacta

Dado que:
- Chat sidebar es angosto (360-600px)
- EventInfoModal muestra mucha información (es más grande)
- event_card debe ser más ligero para no saturar el chat

**Implementar versión compacta**:
- Solo guests, confirmed, pending
- Máximo 2-3 botones de acción
- Altura ~180px (vs ~400px de EventInfoModal)

---

## 📝 Actualización de Instrucciones

Ya actualizamos [`INSTRUCCIONES_BACKEND_EVENT_CARD.md`](INSTRUCCIONES_BACKEND_EVENT_CARD.md) con:
- ⭐ Versión compacta como prioritaria
- 📦 Versión completa como opcional
- 🔧 Código Python para ambas versiones
- 📋 Checklist dividido en fases

---

## 🔗 Archivos de Referencia

- **EventInfoModal existente**: `apps/web/components/Presupuesto/PresupuestoV2/modals/EventInfoModal.tsx`
- **Container layout**: `apps/web/components/DefaultLayout/Container.tsx`
- **ChatSidebar**: `apps/web/components/ChatSidebar/ChatSidebar.tsx`
- **event_card frontend**: `apps/web/components/Copilot/EventCard.tsx` (ya implementado)

---

## ✅ Conclusión

**EventInfoModal vs event_card**:
- ❌ NO son el mismo componente
- ❌ NO están en el mismo lugar
- ❌ NO tienen el mismo propósito
- ✅ Pueden coexistir sin redundancia
- ✅ event_card SÍ es necesario

**Frontend Team confirma**: Por favor procedan con la implementación de `event_card` (versión compacta).

---

**Estado actual**:
- Frontend ✅ Listo (EventCard component implementado)
- Backend ⏳ Pendiente (implementar emit_event_card_compact)
- Clarificación ✅ Completa

---

**Frontend Team**
Fecha: 2026-02-03 (Actualizado tras análisis de EventInfoModal)
