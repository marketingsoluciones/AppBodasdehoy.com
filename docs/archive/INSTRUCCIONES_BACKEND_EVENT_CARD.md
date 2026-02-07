# 📋 Instrucciones para Backend: Soporte de event_card

**Destinatario**: Equipo de Backend Python (api-ia)
**Fecha**: 2025-02-03
**Prioridad**: Media (Frontend ya está listo)
**Actualización**: 2026-02-03 - Clarificado contexto y versión compacta

---

## 🎯 Objetivo

Permitir que el backend Python emita eventos enriquecidos tipo `event_card` durante el streaming SSE para mostrar información de eventos de forma visual y estructurada en el frontend.

**IMPORTANTE**: El sidebar del chat es angosto (360-600px), por lo que recomendamos implementar la **versión compacta** primero.

---

## ⭐ Versión Recomendada: Event Card Compacta

Dado que el sidebar es angosto, implementar PRIMERO esta versión:

```
event: event_card
data: {
  "event": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Boda de Ana",
    "type": "boda",
    "date": "2024-09-11T18:00:00Z",
    "guests": 150,
    "confirmed": 120,
    "pending": 30
  },
  "actions": [
    {
      "label": "Ver invitados",
      "url": "/invitados?eventId=507f1f77bcf86cd799439011",
      "icon": "👥",
      "variant": "primary"
    },
    {
      "label": "Pendientes",
      "url": "/invitados?eventId=507f1f77bcf86cd799439011&status=pending",
      "icon": "⏳",
      "badge": 30,
      "variant": "warning"
    }
  ]
}

```

**Altura visual**: ~180px (compacta, no satura el chat)

---

## 📦 Formato Completo (Opcional)

Si quieren implementar la versión completa con todos los campos:

```
event: event_card
data: {
  "event": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Boda de Ana y Carlos",
    "type": "boda",
    "date": "2024-09-11T18:00:00Z",
    "guests": 150,
    "confirmed": 120,
    "pending": 30,
    "budget": 25000,
    "spent": 18000,
    "paid": 15000,
    "currency": "EUR",
    "tables": 15,
    "tasks": 45
  },
  "actions": [
    {
      "label": "Ver invitados",
      "url": "/invitados?eventId=507f1f77bcf86cd799439011",
      "icon": "👥",
      "variant": "primary"
    },
    {
      "label": "Ver pendientes",
      "url": "/invitados?eventId=507f1f77bcf86cd799439011&status=pending",
      "icon": "⏳",
      "badge": 30,
      "variant": "warning"
    },
    {
      "label": "Ver presupuesto",
      "url": "/presupuesto?eventId=507f1f77bcf86cd799439011",
      "icon": "💰",
      "variant": "secondary"
    },
    {
      "label": "Ver itinerario",
      "url": "/itinerario?eventId=507f1f77bcf86cd799439011",
      "icon": "📅",
      "variant": "secondary"
    }
  ],
  "message": "Encontré el evento \"Boda de Ana y Carlos\" con 150 invitados."
}

```

---

## 📝 Especificación Detallada

### Campo `event` (requerido)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | string | ✅ Sí | ID único del evento (MongoDB ObjectId) |
| `name` | string | ✅ Sí | Nombre del evento |
| `type` | string | ✅ Sí | Tipo: "boda", "cumpleaños", "bautizo", etc. |
| `date` | string | ⚠️ Opcional | Fecha ISO 8601 del evento |
| `guests` | number | ⚠️ Opcional | Total de invitados |
| `confirmed` | number | ⚠️ Opcional | Invitados confirmados |
| `pending` | number | ⚠️ Opcional | Invitados pendientes de confirmar |
| `budget` | number | ⚠️ Opcional | Presupuesto total |
| `spent` | number | ⚠️ Opcional | Monto gastado |
| `paid` | number | ⚠️ Opcional | Monto pagado |
| `currency` | string | ⚠️ Opcional | Moneda: "EUR", "USD", "MXN", etc. |
| `tables` | number | ⚠️ Opcional | Número de mesas configuradas |
| `tasks` | number | ⚠️ Opcional | Número de tareas/servicios |

### Campo `actions` (opcional)

Array de acciones disponibles para el usuario:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `label` | string | ✅ Sí | Texto del botón |
| `url` | string | ✅ Sí | URL de navegación (con eventId incluido) |
| `icon` | string | ⚠️ Opcional | Emoji o icono |
| `badge` | number | ⚠️ Opcional | Número a mostrar (ej: 30 pendientes) |
| `variant` | string | ⚠️ Opcional | Estilo: "primary", "secondary", "success", "warning" |

### Campo `message` (opcional)

Mensaje contextual a mostrar junto con la tarjeta.

---

## 🔄 Cuándo Emitir event_card

### ✅ SÍ emitir cuando:

1. **Usuario pregunta por un evento específico**:
   - "¿Cuántos invitados tiene la boda de Ana?"
   - "¿Cuál es el presupuesto de mi evento X?"
   - "Muéstrame el estado de la boda de Carlos"

2. **Usuario pide ver detalles de un evento**:
   - "Dame información del evento X"
   - "Quiero ver mi boda"

3. **Usuario busca un evento por nombre**:
   - "Busca mi evento llamado X"
   - "¿Existe el evento X?"

### ❌ NO emitir cuando:

1. **Usuario pide lista de eventos**:
   - "Muéstrame todos mis eventos"
   - "¿Qué eventos tengo?"
   - → Aquí usar texto simple o lista

2. **Pregunta no relacionada con eventos**:
   - "¿Cómo funciona la app?"
   - "Ayúdame con X"

3. **Contexto donde ya hay un evento activo**:
   - Usuario ya está viendo un evento específico
   - → Mejor usar respuesta de texto simple

---

## 🔧 Implementación Recomendada: Versión Compacta

```python
import json
from typing import Dict

def emit_event_card_compact(event_data: Dict, stream_response):
    """
    Versión COMPACTA de event_card para sidebar angosto (360-600px).
    Solo incluye: nombre, fecha, invitados, y 2-3 acciones principales.

    Args:
        event_data: Datos del evento desde MongoDB
        stream_response: Objeto de respuesta streaming
    """
    # Extraer invitados
    guests = event_data.get("invitados_array", [])
    confirmed = sum(
        1 for g in guests
        if g.get("asistencia") in ["confirmado", "si"]
    )
    pending = sum(
        1 for g in guests
        if g.get("asistencia") in ["pendiente", None]
    )

    # Construir estructura compacta
    card_data = {
        "event": {
            "id": str(event_data.get("_id")),
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


# Ejemplo de uso
def handle_event_query(user_message: str, context: Dict, stream_response):
    """
    Detecta si el usuario pregunta por un evento específico
    y emite event_card compacto si es apropiado
    """
    # Buscar evento en la BD
    event = find_event_by_name(user_message, context["userId"])

    if event:
        # Primero emitir respuesta de texto
        text = f"Aquí está el resumen de tu evento \"{event['nombre']}\"."
        stream_response.write(f"data: {json.dumps({'choices': [{'delta': {'content': text}}]})}\n\n")

        # Luego emitir la tarjeta visual COMPACTA
        emit_event_card_compact(event, stream_response)
```

---

## 🔧 Implementación Completa (Opcional)

Si quieren la versión completa con presupuesto, mesas, etc:

```python
import json
from typing import Dict, List, Optional

def emit_event_card_full(
    event_data: Dict,
    stream_response,
    actions: Optional[List[Dict]] = None,
    message: Optional[str] = None
):
    """
    Emite un evento SSE de tipo event_card - VERSIÓN COMPLETA
    Incluye presupuesto, mesas, tareas, etc.

    ⚠️ ADVERTENCIA: Ocupa ~400px de altura, puede saturar el chat

    Args:
        event_data: Datos del evento (id, name, type, etc.)
        stream_response: Objeto de respuesta streaming
        actions: Lista de acciones disponibles
        message: Mensaje contextual opcional
    """
    # Construir estructura
    card_data = {
        "event": {
            "id": event_data.get("_id"),
            "name": event_data.get("nombre"),
            "type": event_data.get("tipo"),
        }
    }

    # Agregar campos opcionales si existen
    if event_data.get("fecha"):
        card_data["event"]["date"] = event_data["fecha"]

    if "invitados_array" in event_data:
        guests = event_data["invitados_array"]
        card_data["event"]["guests"] = len(guests)
        card_data["event"]["confirmed"] = sum(
            1 for g in guests
            if g.get("asistencia") in ["confirmado", "si"]
        )
        card_data["event"]["pending"] = sum(
            1 for g in guests
            if g.get("asistencia") in ["pendiente", None]
        )

    # Presupuesto
    if "presupuesto" in event_data:
        card_data["event"]["budget"] = event_data["presupuesto"].get("coste_final")
        card_data["event"]["spent"] = event_data["presupuesto"].get("coste_estimado")
        card_data["event"]["paid"] = event_data["presupuesto"].get("pagado")

    # Agregar acciones
    if actions:
        card_data["actions"] = actions
    else:
        # Generar acciones por defecto
        event_id = event_data.get("_id")
        card_data["actions"] = [
            {
                "label": "Ver invitados",
                "url": f"/invitados?eventId={event_id}",
                "icon": "👥",
                "variant": "primary"
            }
        ]

        # Agregar acción de pendientes si hay
        pending = card_data["event"].get("pending", 0)
        if pending > 0:
            card_data["actions"].append({
                "label": "Ver pendientes",
                "url": f"/invitados?eventId={event_id}&status=pending",
                "icon": "⏳",
                "badge": pending,
                "variant": "warning"
            })

    # Agregar mensaje si existe
    if message:
        card_data["message"] = message

    # Emitir evento SSE
    stream_response.write(f"event: event_card\n")
    stream_response.write(f"data: {json.dumps(card_data)}\n\n")
    stream_response.flush()
```

---

## 🧪 Testing

### Test 1: Consulta sobre evento específico

**Request**:
```json
{
  "messages": [{"role": "user", "content": "¿Cuántos invitados tiene la boda de Ana?"}],
  "stream": true,
  "metadata": {
    "userId": "user123",
    "eventId": null
  }
}
```

**Expected SSE Response**:
```
data: {"choices": [{"delta": {"content": "El evento \"Boda de Ana\" tiene 150 invitados: 120 confirmados y 30 pendientes."}}]}

event: event_card
data: {"event": {"id": "abc123", "name": "Boda de Ana", "type": "boda", "guests": 150, "confirmed": 120, "pending": 30}, "actions": [...]}

data: [DONE]
```

### Test 2: Lista de eventos (NO emitir event_card)

**Request**:
```json
{
  "messages": [{"role": "user", "content": "Muéstrame todos mis eventos"}]
}
```

**Expected**: Solo texto, NO event_card

---

## 📋 Checklist de Implementación

### Fase 1: Versión Compacta (Prioritaria)
- [ ] Crear función `emit_event_card_compact()` en el módulo de streaming
- [ ] Detectar consultas sobre eventos específicos en el orchestrator
- [ ] Integrar con la BD para obtener datos básicos del evento
- [ ] Generar acciones por defecto (Ver invitados + Pendientes si hay)
- [ ] Testing con diferentes tipos de consultas
- [ ] Verificar que la altura visual no satura el chat (~180px)

### Fase 2: Versión Completa (Opcional)
- [ ] Crear función `emit_event_card_full()` con todos los campos
- [ ] Agregar lógica para decidir cuándo usar versión completa vs compacta
- [ ] Testing de altura visual (~400px)
- [ ] Documentar en API docs del backend

---

## 🔗 Referencias

- **Frontend implementación**: `/apps/web/components/Copilot/EventCard.tsx`
- **Type definitions**: `/apps/web/services/copilotChat.ts` (líneas 47-54)
- **Renderer**: `/apps/web/components/Copilot/EnrichedEventRenderer.tsx`
- **SSE parsing**: `/apps/web/services/copilotChat.ts` (líneas 252-259)

---

## 📞 Contacto

Si tienen dudas sobre el formato o necesitan más información del frontend:
- Ver documentación: `/MEJORAS_COPILOT_RESPUESTAS_CONCISAS.md`
- Probar el componente: `apps/web/components/Copilot/EventCard.tsx`

---

**Nota importante**: El frontend YA está listo para recibir estos eventos. Una vez que el backend los emita correctamente, se renderizarán automáticamente como tarjetas visuales en el chat.

**Estado actual**:
- Frontend ✅ Listo (soporta versión compacta y completa)
- Backend ⏳ Pendiente

---

## 📢 Actualización 2026-02-03: Aclaración de Contexto

El backend preguntó si `event_card` era necesario o redundante con un "Event Viewer lateral".

**Aclaración**: NO existe Event Viewer lateral. El sidebar ES el chat, no hay visualización estructurada del evento en ningún otro lugar.

Por lo tanto: **`event_card` NO es redundante** y SÍ es necesario implementarlo.

**Ver respuesta completa**: [`RESPUESTA_BACKEND_EVENT_CARD.md`](RESPUESTA_BACKEND_EVENT_CARD.md)
