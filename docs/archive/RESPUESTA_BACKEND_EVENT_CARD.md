# ✅ Respuesta: Aclarando el contexto de event_card

**De**: Frontend Team
**Para**: Backend Team
**Fecha**: 2026-02-03
**Re**: Clarificación sobre necesidad de `event_card`

---

## 🎯 Resumen Ejecutivo

**El backend tiene razón en cuestionar**, pero hay un **malentendido sobre la arquitectura actual**.

**❌ Lo que Backend asume**: Existe un "Event Viewer" lateral que muestra detalles del evento
**✅ Realidad**: NO existe ese componente - el sidebar ES solo el chat conversacional

Por lo tanto: **`event_card` NO es redundante** porque actualmente **no hay visualización estructurada** del evento.

---

## 📐 Arquitectura Actual del Sidebar

### Lo que realmente tenemos:

```
┌─────────────────────────────────────┐
│  App Principal (Invitados, etc.)    │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ ChatSidebar (360-600px ancho) │ │
│  │ ───────────────────────────── │ │
│  │ 🤖 Copilot                    │ │
│  │                               │ │
│  │ Usuario: ¿Cuántos invitados?  │ │
│  │                               │ │
│  │ Asistente: Tu evento tiene    │ │  ← SOLO TEXTO
│  │ 150 invitados: 120            │ │
│  │ confirmados y 30 pendientes.  │ │
│  │                               │ │
│  │ [Ver invitados →]             │ │
│  │                               │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**NO hay Event Viewer lateral** - Solo existe:
1. ✅ Chat conversacional (texto)
2. ✅ Links clickeables
3. ❌ NO hay panel mostrando métricas del evento
4. ❌ NO hay vista estructurada de datos

---

## 🤔 Respondiendo las Preguntas del Backend

### 1. ¿Cuál es el caso de uso específico?

✅ **Preview rápido en contexto conversacional**

Cuando el usuario pregunta sobre un evento:
- Actualmente: Solo recibe texto plano
- Con event_card: Vería datos estructurados + acciones

**Ejemplo real**:

**SIN event_card** (actual):
```
Usuario: ¿Cómo va la boda de Ana?

Copilot: Tu evento "Boda de Ana" tiene 150 invitados,
de los cuales 120 están confirmados y 30 pendientes.
El presupuesto es de 25,000 EUR, has gastado 18,000 EUR
y pagado 15,000 EUR. Tienes 15 mesas configuradas y
45 tareas pendientes.

¿Quieres ver los invitados pendientes?
```

**CON event_card** (propuesto):
```
Usuario: ¿Cómo va la boda de Ana?

Copilot: Aquí está el resumen de tu evento:

┌─────────────────────────────────┐
│ 💍 Boda de Ana                  │
│ 📅 11 Sep 2024                  │
├─────────────────────────────────┤
│ 👥 150    ✅ 120    ⏳ 30      │
│ 💰 25k €  📊 18k €  ✓ 15k €   │
├─────────────────────────────────┤
│ [Ver invitados] [Pendientes 30] │
│ [Presupuesto]   [Itinerario]    │
└─────────────────────────────────┘
```

### 2. ¿En qué contextos se muestra?

✅ **Solo cuando el usuario pregunta por un evento específico**

- ✅ "¿Cómo va la boda de Ana?" → event_card
- ✅ "¿Cuántos invitados tiene X?" → event_card
- ❌ "¿Qué eventos tengo?" → Lista de texto (NO event_card)
- ❌ "¿Cómo funciona la app?" → Respuesta normal

**Frecuencia estimada**: 20-30% de las conversaciones

### 3. ¿El viewer lateral está siempre visible?

❌ **NO existe un viewer lateral de eventos**

El sidebar que existe es el CHAT, no un Event Viewer.

---

## 💡 Nuestra Recomendación Actualizada

### ✅ SÍ implementar event_card, PERO con ajustes:

#### Opción Recomendada: Event Card Compacta

Dado que el sidebar es angosto (360-600px), usar versión **compacta**:

```typescript
// Versión COMPACTA para sidebar angosto
{
  "event": {
    "id": "abc123",
    "name": "Boda de Ana",
    "type": "boda",
    "date": "2024-09-11",
    "guests": 150,
    "confirmed": 120,
    "pending": 30
  },
  "actions": [
    {
      "label": "Ver invitados",
      "url": "/invitados?eventId=abc123",
      "icon": "👥",
      "variant": "primary"
    },
    {
      "label": "Pendientes",
      "url": "/invitados?eventId=abc123&status=pending",
      "icon": "⏳",
      "badge": 30,
      "variant": "warning"
    }
  ]
}
```

**NO incluir** todos los campos opcionales (budget, spent, paid, tables, tasks) para mantener el card compacto.

#### Campos a Incluir (mínimos):

| Campo | ¿Incluir? | Razón |
|-------|-----------|-------|
| `id`, `name`, `type`, `date` | ✅ Sí | Esenciales |
| `guests`, `confirmed`, `pending` | ✅ Sí | Más solicitados |
| `budget`, `spent`, `paid` | ⚠️ Solo si el usuario pregunta | Ocupan mucho espacio |
| `tables`, `tasks` | ⚠️ Solo si el usuario pregunta | Menos prioritarios |
| `actions` | ✅ Sí (máximo 3-4) | Útiles para navegación |

---

## 🎨 Diseño Visual Propuesto

### Versión Compacta (Recomendada para sidebar):

```
┌────────────────────────────────┐
│ 💍 Boda de Ana                 │
│ boda · 11 sep 2024             │
├────────────────────────────────┤
│ 👥 150  ✅ 120  ⏳ 30         │
├────────────────────────────────┤
│ [👥 Ver invitados]             │
│ [⏳ Pendientes (30)]           │
└────────────────────────────────┘
```

**Altura estimada**: ~180px (compacta, no satura el chat)

### Versión Completa (Solo si backend quiere implementarla):

```
┌────────────────────────────────┐
│ 💍 Boda de Ana                 │
│ boda · 11 septiembre 2024      │
├────────────────────────────────┤
│ Invitados                      │
│ 👥 150 total                   │
│ ✅ 120 confirmados             │
│ ⏳ 30 pendientes               │
│                                │
│ Presupuesto                    │
│ 💰 25,000 EUR presupuesto      │
│ 📊 18,000 EUR gastado          │
│ ✅ 15,000 EUR pagado           │
├────────────────────────────────┤
│ [👥 Invitados] [⏳ Pendientes] │
│ [💰 Presupuesto] [📅 Itinerario│
└────────────────────────────────┘
```

**Altura estimada**: ~400px (puede saturar el chat)

---

## 🚀 Decisión Final

### ✅ Backend DEBE implementar event_card

**Por qué**:
1. NO existe componente visual de eventos actualmente
2. Mejora significativa en UX (datos estructurados vs texto)
3. Facilita navegación con botones de acción
4. NO es redundante - es la única visualización estructurada

### 📏 Con estas condiciones:

1. **Versión compacta por defecto**
   - Solo campos esenciales (guests, confirmed, pending)
   - Máximo 3-4 botones de acción
   - Altura objetivo: ~180px

2. **Opcional: Versión completa**
   - Incluir budget, spent, paid, tables, tasks
   - Solo si el usuario pregunta específicamente por presupuesto
   - Altura: ~400px

3. **Frecuencia controlada**
   - Solo cuando usuario pregunta por evento específico
   - NO en listas de eventos
   - NO repetir si ya hay un event_card visible en las últimas 3 respuestas

---

## 📝 Especificación Actualizada

### Versión Compacta (Implementar ESTA):

```python
def emit_event_card_compact(event_data: Dict, stream_response):
    """
    Versión COMPACTA de event_card para sidebar angosto
    Solo incluye: nombre, fecha, invitados, y 2-3 acciones principales
    """
    guests = event_data.get("invitados_array", [])
    confirmed = sum(1 for g in guests if g.get("asistencia") in ["confirmado", "si"])
    pending = sum(1 for g in guests if g.get("asistencia") in ["pendiente", None])

    card_data = {
        "event": {
            "id": event_data.get("_id"),
            "name": event_data.get("nombre"),
            "type": event_data.get("tipo"),
            "date": event_data.get("fecha"),
            "guests": len(guests),
            "confirmed": confirmed,
            "pending": pending
        },
        "actions": [
            {
                "label": "Ver invitados",
                "url": f"/invitados?eventId={event_data.get('_id')}",
                "icon": "👥",
                "variant": "primary"
            }
        ]
    }

    # Agregar acción de pendientes solo si hay
    if pending > 0:
        card_data["actions"].append({
            "label": "Pendientes",
            "url": f"/invitados?eventId={event_data.get('_id')}&status=pending",
            "icon": "⏳",
            "badge": pending,
            "variant": "warning"
        })

    # Emitir evento SSE
    stream_response.write(f"event: event_card\n")
    stream_response.write(f"data: {json.dumps(card_data)}\n\n")
    stream_response.flush()
```

### Cuándo emitir:

```python
# Detectar si el usuario pregunta por un evento específico
if user_mentions_specific_event(user_message):
    event = find_event_by_name(user_message, context["userId"])

    if event:
        # 1. Emitir respuesta de texto
        text = f"Aquí está el resumen de tu evento \"{event['nombre']}\"."
        stream_text(text, stream_response)

        # 2. Emitir event_card COMPACTO
        emit_event_card_compact(event, stream_response)
```

---

## ✅ Resumen para Backend

| Pregunta | Respuesta |
|----------|-----------|
| **¿Es necesario?** | ✅ SÍ - NO existe Event Viewer lateral |
| **¿Cuándo mostrar?** | Solo cuando usuario pregunta por evento específico |
| **¿Qué versión?** | Compacta (guests, confirmed, pending) |
| **¿Frecuencia?** | 20-30% de conversaciones |
| **¿Saturará el chat?** | No si usamos versión compacta (~180px) |
| **¿Mantenimiento?** | Solo 1 componente (no hay viewer separado) |

---

## 🔄 Próximo Paso

✅ **Backend puede proceder con implementación de event_card compacto**

Usemos la especificación de `emit_event_card_compact()` arriba como guía.

Si tienen más dudas, podemos agendar una llamada, pero con esta clarificación deberían poder avanzar.

---

**Frontend Team**
Fecha: 2026-02-03

---

## 📎 Anexo: Screenshots del Sidebar Actual

Ver archivo: `apps/web/components/ChatSidebar/ChatSidebar.tsx`

- Líneas 19-20: `MIN_WIDTH = 360`, `MAX_WIDTH = 600`
- Líneas 228-290: Vista mínima (por defecto) - SOLO chat
- Líneas 316-400: Vista completa (modal) - SOLO chat expandido
- **NO hay Event Viewer** en ninguna parte del código
