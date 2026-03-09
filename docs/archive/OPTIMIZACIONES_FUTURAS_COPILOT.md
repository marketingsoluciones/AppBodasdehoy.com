# 🚀 Optimizaciones Futuras para Copilot

**Fecha**: 2026-02-03
**Estado**: Ideas y Recomendaciones
**Prioridad**: Baja-Media (post-MVP)

---

## 🎯 Objetivo

Este documento contiene ideas de optimización y mejoras para el copilot, una vez que la implementación actual esté funcionando correctamente en producción.

---

## 1. 🔍 Búsqueda Inteligente de Eventos

### Problema Actual
El backend busca eventos por nombre exacto. Si el usuario escribe "Ana" y el evento se llama "Boda de Ana y Carlos", podría no encontrarlo.

### Solución: Búsqueda Fuzzy

**Backend (Python)**:
```python
from difflib import SequenceMatcher

def fuzzy_search_event(query: str, user_events: list) -> dict | None:
    """
    Busca eventos usando similitud de texto (fuzzy matching)

    Ejemplo:
    - Query: "Ana" → Encuentra "Boda de Ana y Carlos"
    - Query: "cumple juan" → Encuentra "Cumpleaños de Juan"
    """
    best_match = None
    best_score = 0.0

    query_lower = query.lower()

    for event in user_events:
        event_name = event.get("nombre", "").lower()

        # Calcular similitud
        score = SequenceMatcher(None, query_lower, event_name).ratio()

        # Si contiene el query, bonus
        if query_lower in event_name:
            score += 0.3

        if score > best_score and score > 0.5:  # Umbral mínimo 50%
            best_score = score
            best_match = event

    return best_match
```

**Beneficio**: Encuentra eventos con mayor tolerancia a variaciones en el nombre.

---

## 2. 📊 Métricas y Analytics

### Trackear Uso de EventCard

**Frontend (TypeScript)**:
```typescript
// apps/web/components/Copilot/EventCard.tsx

const trackEventCardView = (eventId: string, eventName: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'event_card_view', {
      event_category: 'Copilot',
      event_label: eventName,
      event_id: eventId
    });
  }
};

const trackEventCardAction = (action: string, eventId: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'event_card_action', {
      event_category: 'Copilot',
      event_label: action,
      event_id: eventId
    });
  }
};

// En el componente:
useEffect(() => {
  trackEventCardView(event.id, event.name);
}, []);

const handleAction = (action: ActionItem) => {
  trackEventCardAction(action.label, event.id);
  router.push(action.url);
};
```

**Métricas a trackear**:
- ✅ Cuántas event_cards se muestran por día
- ✅ Qué botones se clickean más (Ver invitados vs Pendientes)
- ✅ Tiempo promedio hasta el click
- ✅ Tasa de conversión (vistas → clicks)

---

## 3. 🎨 Variantes de EventCard

### EventCard Compacta vs Completa

Actualmente solo existe una versión. Se podría implementar dos variantes:

#### Versión Compacta (180px)
- Solo: invitados (total, confirmados, pendientes)
- Máximo 2-3 botones
- Perfecta para sidebar angosto

#### Versión Completa (400px)
- Incluye: presupuesto, mesas, tareas
- Progress bars
- Hasta 5-6 botones
- Para sidebar ancho o modal

**Implementación**:
```typescript
export interface EventCardProps {
  data: EventCardData;
  variant?: 'compact' | 'full'; // Nueva prop
}

export const EventCard: FC<EventCardProps> = ({ data, variant = 'compact' }) => {
  if (variant === 'compact') {
    return <EventCardCompact data={data} />;
  }
  return <EventCardFull data={data} />;
};
```

**Backend decide qué variante enviar** según contexto.

---

## 4. 🔄 Cache de Eventos Frecuentes

### Problema
Cada consulta al copilot hace fetch a MongoDB para obtener eventos del usuario.

### Solución: Cache en Memoria

**Backend (Python)**:
```python
from functools import lru_cache
from datetime import datetime, timedelta

# Cache simple en memoria
event_cache = {}

def get_user_events_cached(user_id: str) -> list:
    """
    Obtiene eventos del usuario con cache de 5 minutos
    """
    cache_key = f"events_{user_id}"

    # Verificar si existe en cache y no ha expirado
    if cache_key in event_cache:
        cached_data, timestamp = event_cache[cache_key]
        if datetime.now() - timestamp < timedelta(minutes=5):
            return cached_data

    # Fetch desde DB
    events = fetch_events_from_db(user_id)

    # Guardar en cache
    event_cache[cache_key] = (events, datetime.now())

    return events
```

**Beneficio**: Reduce latencia de respuesta en ~100-200ms.

**⚠️ Consideración**: Invalidar cache cuando usuario edita eventos.

---

## 5. 🧠 Contexto Conversacional Mejorado

### Problema
Si el usuario pregunta:
1. "¿Cuántos invitados tiene mi boda?"
2. "¿Y cuántos han confirmado?"

El copilot pierde contexto de que "han confirmado" se refiere a "mi boda".

### Solución: Context Window

**Frontend**:
```typescript
// Mantener últimas N interacciones con contexto
const conversationContext = useRef<{
  lastEvent?: string;  // ID del último evento mencionado
  lastTopic?: string;  // "invitados" | "presupuesto" | "mesas"
  lastTimestamp: number;
}>({
  lastTimestamp: Date.now()
});

// Al enviar mensaje, incluir contexto
const sendMessage = (text: string) => {
  const metadata = {
    ...pageContext,
    conversationContext: conversationContext.current
  };

  chatService.sendMessage(text, metadata);
};
```

**Backend**:
```python
# Usar contexto para resolver ambigüedades
def resolve_implicit_reference(query: str, context: dict) -> str:
    """
    Si el usuario dice "¿Y cuántos confirmados?" sin mencionar evento,
    usar el evento del contexto previo
    """
    if not mentions_event_explicitly(query) and context.get("lastEvent"):
        query = f"{query} del evento {context['lastEvent']}"

    return query
```

**Beneficio**: Conversación más natural, menos repetitiva.

---

## 6. 🎤 Sugerencias Proactivas

### Idea
El copilot puede sugerir acciones basado en el estado del evento.

**Ejemplo**:
```
Usuario: ¿Cuántos invitados tiene mi boda?

Copilot: Tu boda tiene 150 invitados: 120 confirmados y 30 pendientes.

[EventCard visual]

💡 Notaste que tienes 30 invitados pendientes. ¿Quieres que te ayude a:
- Enviar recordatorios automáticos
- Ver quiénes son los pendientes
- Establecer fecha límite de confirmación
```

**Implementación**:
```python
def generate_proactive_suggestions(event_data: dict) -> list[str]:
    """
    Genera sugerencias basadas en el estado del evento
    """
    suggestions = []

    # Si hay muchos pendientes
    pending_ratio = event_data['pending'] / event_data['guests']
    if pending_ratio > 0.2:  # Más del 20%
        suggestions.append("Enviar recordatorios a pendientes")

    # Si falta menos de 1 mes y hay mesas sin configurar
    days_until_event = calculate_days_until(event_data['date'])
    if days_until_event < 30 and not event_data.get('tables'):
        suggestions.append("Configurar distribución de mesas")

    # Si presupuesto excedido
    if event_data['spent'] > event_data['budget']:
        suggestions.append("Revisar gastos excedidos")

    return suggestions
```

---

## 7. 📱 Notificaciones Push

### Idea
Cuando el copilot detecta algo importante, enviar notificación.

**Casos de uso**:
- "10 invitados acaban de confirmar asistencia"
- "Has superado tu presupuesto en 500 EUR"
- "Faltan 7 días para tu evento"

**Implementación**:
```typescript
// Frontend: Service Worker
if ('Notification' in window && Notification.permission === 'granted') {
  const registration = await navigator.serviceWorker.register('/sw.js');

  registration.showNotification('Copilot', {
    body: '10 nuevos invitados confirmados en "Boda de Ana"',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: {
      url: '/invitados?eventId=123&status=confirmed',
      eventId: '123'
    }
  });
}
```

---

## 8. 🌐 Multi-idioma

### Problema
Actualmente el copilot responde en español porque el prompt está en español.

### Solución: Detección de Idioma

**Frontend**:
```typescript
// Detectar idioma del navegador
const userLanguage = navigator.language.split('-')[0]; // 'es', 'en', 'fr'

// Incluir en metadata
const metadata = {
  ...pageContext,
  language: userLanguage
};
```

**Backend**:
```python
# Cargar prompt en idioma correcto
prompts = {
    "es": "Eres Copilot, el asistente personal...",
    "en": "You are Copilot, the personal assistant...",
    "fr": "Tu es Copilot, l'assistant personnel..."
}

system_prompt = prompts.get(user_language, prompts["es"])
```

**EventCard también debe traducirse**:
```typescript
const translations = {
  es: {
    guests: 'Invitados',
    confirmed: 'Confirmados',
    pending: 'Pendientes',
    viewGuests: 'Ver invitados'
  },
  en: {
    guests: 'Guests',
    confirmed: 'Confirmed',
    pending: 'Pending',
    viewGuests: 'View guests'
  }
};
```

---

## 9. 🎨 Temas Personalizables

### Idea
Permitir al usuario personalizar colores del EventCard según su evento.

**Ejemplo**:
```typescript
// Usuario configura tema para su boda
const eventTheme = {
  primary: '#8B7355',    // Marrón elegante
  secondary: '#F5E6D3',  // Beige
  accent: '#D4AF37'      // Dorado
};

// EventCard usa esos colores
<div style={{
  borderTop: `4px solid ${eventTheme.primary}`,
  background: `linear-gradient(135deg, ${eventTheme.secondary}, white)`
}}>
```

---

## 10. 🤖 Auto-completado Inteligente

### Idea
Sugerir preguntas comunes mientras el usuario escribe.

**Frontend**:
```typescript
const commonQueries = [
  "¿Cuántos invitados tiene mi [evento]?",
  "¿Cuánto he gastado en [categoría]?",
  "Muéstrame los pendientes de confirmar",
  "¿En qué mesa está [invitado]?",
  "¿Cuándo es mi próximo evento?"
];

// Mostrar sugerencias filtradas
<Autocomplete
  suggestions={commonQueries.filter(q =>
    q.toLowerCase().includes(input.toLowerCase())
  )}
  onSelect={(query) => sendMessage(query)}
/>
```

---

## 11. 📤 Exportar EventCard como Imagen

### Idea
Permitir descargar el EventCard como imagen para compartir.

**Implementación**:
```typescript
import html2canvas from 'html2canvas';

const exportAsImage = async (elementId: string) => {
  const element = document.getElementById(elementId);
  const canvas = await html2canvas(element);

  const link = document.createElement('a');
  link.download = 'resumen-evento.png';
  link.href = canvas.toDataURL();
  link.click();
};

// En EventCard
<button onClick={() => exportAsImage('event-card-123')}>
  📥 Descargar resumen
</button>
```

---

## 12. 🔔 Webhooks de Copilot

### Idea
Permitir integraciones externas que reaccionen a eventos del copilot.

**Ejemplo**:
- Usuario pregunta por presupuesto → Trigger en Zapier → Email a contador
- Usuario consulta invitados → Guardar en Google Sheets
- EventCard mostrado → Incrementar contador en Analytics

**Backend**:
```python
async def trigger_webhooks(event_type: str, data: dict, user_id: str):
    """
    Dispara webhooks configurados por el usuario
    """
    webhooks = get_user_webhooks(user_id)

    for webhook in webhooks:
        if event_type in webhook.subscribed_events:
            await httpx.post(
                webhook.url,
                json={
                    "event": event_type,
                    "data": data,
                    "timestamp": datetime.utcnow().isoformat()
                },
                headers={"X-Webhook-Secret": webhook.secret}
            )
```

---

## 13. 🧪 A/B Testing de Respuestas

### Idea
Probar diferentes estilos de respuesta y medir cuál funciona mejor.

**Ejemplo**:
- **Versión A**: Respuesta formal ("El evento cuenta con...")
- **Versión B**: Respuesta casual ("Tu boda tiene...")

**Implementación**:
```python
import random

def get_response_style(user_id: str) -> str:
    """
    Asignar aleatoriamente un estilo de respuesta
    (50% formal, 50% casual)
    """
    bucket = hash(user_id) % 2
    return "formal" if bucket == 0 else "casual"

# Usar en prompt
style = get_response_style(user_id)
if style == "formal":
    tone_instruction = "Usa lenguaje formal y profesional"
else:
    tone_instruction = "Usa lenguaje casual y amigable"
```

**Medir**: ¿Qué versión genera más engagement (clicks en EventCard)?

---

## 📊 Priorización de Optimizaciones

| Optimización | Impacto | Esfuerzo | Prioridad |
|--------------|---------|----------|-----------|
| **Búsqueda Fuzzy** | 🔥 Alto | 🛠️ Bajo | ⭐⭐⭐⭐⭐ |
| **Métricas/Analytics** | 🔥 Alto | 🛠️ Medio | ⭐⭐⭐⭐⭐ |
| **Cache de Eventos** | 🔥 Alto | 🛠️ Bajo | ⭐⭐⭐⭐ |
| **Contexto Conversacional** | 🔥 Alto | 🛠️ Alto | ⭐⭐⭐⭐ |
| **Variantes de Card** | 🔥 Medio | 🛠️ Medio | ⭐⭐⭐ |
| **Sugerencias Proactivas** | 🔥 Medio | 🛠️ Alto | ⭐⭐⭐ |
| **Multi-idioma** | 🔥 Medio | 🛠️ Alto | ⭐⭐ |
| **Notificaciones Push** | 🔥 Bajo | 🛠️ Alto | ⭐⭐ |
| **Temas Personalizables** | 🔥 Bajo | 🛠️ Medio | ⭐ |
| **Auto-completado** | 🔥 Bajo | 🛠️ Bajo | ⭐⭐ |
| **Exportar como Imagen** | 🔥 Bajo | 🛠️ Bajo | ⭐ |
| **Webhooks** | 🔥 Bajo | 🛠️ Alto | ⭐ |
| **A/B Testing** | 🔥 Medio | 🛠️ Alto | ⭐⭐⭐ |

---

## 🎯 Roadmap Recomendado

### Fase 1: Quick Wins (1-2 semanas)
1. ✅ Búsqueda Fuzzy de eventos
2. ✅ Métricas básicas (Google Analytics)
3. ✅ Cache de eventos

### Fase 2: UX Improvements (1 mes)
4. ✅ Contexto conversacional
5. ✅ Variantes de EventCard (compacta/completa)
6. ✅ Auto-completado

### Fase 3: Advanced Features (2-3 meses)
7. ✅ Sugerencias proactivas
8. ✅ Multi-idioma
9. ✅ A/B Testing

### Fase 4: Integrations (opcional)
10. ✅ Notificaciones Push
11. ✅ Webhooks
12. ✅ Temas personalizables

---

## 📝 Notas Finales

Estas optimizaciones son **opcionales** y deben implementarse **solo después** de que la versión actual esté funcionando correctamente en producción y se hayan validado las métricas de uso.

**Prioriza** las optimizaciones que:
- ✅ Resuelven pain points reales de usuarios
- ✅ Tienen alto impacto con bajo esfuerzo
- ✅ Son medibles (puedes trackear el éxito)

**Evita**:
- ❌ Optimizar prematuramente
- ❌ Añadir features que nadie pide
- ❌ Complejidad innecesaria

---

**Fecha**: 2026-02-03
**Autor**: Claude Code
**Estado**: Ideas para futuro (post-MVP)
