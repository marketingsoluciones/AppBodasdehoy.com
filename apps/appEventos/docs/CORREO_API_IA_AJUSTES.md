# Solicitud de Ajustes: Backend api-ia.bodasdehoy.com

**Fecha:** 28 de Enero 2026
**De:** Equipo Frontend (app-test.bodasdehoy.com)
**Para:** Equipo Backend IA (api-ia.bodasdehoy.com)
**Asunto:** Ajustes necesarios para integración Copilot con datos de usuario

---

## Resumen Ejecutivo

El Copilot del frontend está funcionando correctamente pero las respuestas del backend muestran contenido técnico que no debería verse por el usuario final. Además, el backend responde "No tengo acceso a tus datos" cuando debería poder consultar los eventos y presupuestos del usuario.

---

## Problema 1: Respuestas con contenido técnico visible

### Evidencia del Test

Cuando un usuario pregunta **"¿Cuánto tengo gastado en mi presupuesto?"**, el backend responde:

```
Para saber cuánto has gastado en tu presupuesto, necesito consultar tu presupuesto actual.
Primero, voy a verificar qué eventos tienes y luego obtener el presupuesto detallado de cada uno.

📊 Voy a ejecutar `get_user_events()` para encontrar tus eventos...

Una vez que tenga la lista de eventos, puedo buscar el presupuesto para cada uno.

💸 Luego, voy a usar `search_budgets_by_category()` para obtener el resumen de gastos...

Y finalmente, voy a calcular el total gastado.

📊 Esto tomará solo un momento... (Ejecutando `get_user_events()`...)

No tengo acceso a tus datos en este momento.
```

### También se observaron chunks con contenido XML técnico:

```
params="{'development': 'bodasdehoy', 'user_id': '1234567890'}"></function>
```

### Lo que el usuario debería ver:

```
¡Claro! Déjame revisar tu presupuesto...

Tienes un presupuesto total de €15,000 con €8,500 gastados (57%).
Puedes ver el desglose completo en [Ver presupuesto](/presupuesto).
```

---

## Problema 2: "No tengo acceso a tus datos"

El backend responde que no tiene acceso a los datos del usuario aunque estamos enviando:

### Headers que enviamos:
```
X-User-Id: bodasdehoy.com@gmail.com (o el uid del usuario)
X-Event-Id: [id del evento seleccionado]
X-Development: bodasdehoy
Authorization: Bearer [jwt_token]
```

### Metadata en el body:
```json
{
  "messages": [...],
  "metadata": {
    "userId": "bodasdehoy.com@gmail.com",
    "development": "bodasdehoy",
    "eventId": "abc123",
    "eventName": "Boda Luis y Carla",
    "sessionId": "guest_1234567890"
  }
}
```

---

## Ajustes Solicitados

### 1. Ocultar nombres de funciones/herramientas al usuario

El modelo NO debería mostrar al usuario:
- Nombres de funciones: `get_user_events()`, `search_budgets_by_category()`, etc.
- Tags XML: `<function>`, `</function>`, `params=`
- Explicaciones técnicas: "Voy a ejecutar...", "Ejecutando..."

**Sugerencia:** Agregar al system prompt del backend:
```
NUNCA menciones nombres de funciones, herramientas, APIs o parámetros técnicos al usuario.
Responde de forma natural sin explicar los procesos internos.
```

### 2. Implementar acceso a datos del usuario

El backend necesita:

1. **Usar el `X-User-Id` o `metadata.userId`** para identificar al usuario
2. **Conectarse a la base de datos** de eventos (misma que usa app-test)
3. **Implementar las funciones MCP** para consultar datos reales:
   - `get_user_events(user_id)` → Lista de eventos del usuario
   - `get_budget(event_id)` → Presupuesto del evento
   - `get_guests(event_id)` → Lista de invitados
   - `get_itinerary(event_id)` → Itinerario del evento

### 3. Incluir links de navegación en respuestas

Cuando el backend mencione secciones de la app, incluir links markdown:
- `[Ver presupuesto](/presupuesto)`
- `[Ver invitados](/invitados)`
- `[Ver itinerario](/itinerario)`
- `[Ver mesas](/mesas)`

---

## Datos de Conexión

### Endpoint del Backend:
```
POST https://api-ia.bodasdehoy.com/webapi/chat/auto
```

### Base de datos de eventos:
```
[Incluir aquí la conexión a MongoDB/Firebase que usa app-test]
```

### Usuario de prueba:
```
Email: bodasdehoy.com@gmail.com
User ID (Firebase): qDhAGOktSbOJzYflxb_ATv5-yqQ3
Evento de ejemplo: "Boda Luis y Carla"
```

---

## Pruebas Realizadas

### Test 1: API directa (test-api-response.js)
- **Resultado:** Respuestas técnicas con nombres de funciones
- **Puntuación:** 2/5 en amigabilidad

### Test 2: Usuario real (test-copilot-real-user.js)
- **Resultado:** "No tengo acceso a tus datos"
- **Headers enviados correctamente:** ✓
- **Metadata enviada correctamente:** ✓

---

## Acciones del Frontend (Ya Implementadas)

Mientras tanto, hemos implementado filtros en el frontend para limpiar contenido técnico:

1. **Filtro en API route** (`/api/copilot/chat.ts`):
   - Elimina tags `<function>`, `params=`
   - Elimina nombres de funciones como `get_user_events()`
   - Limpia frases técnicas en español

2. **Filtro en cliente** (`CopilotChatNative.tsx`):
   - Aplica filtros adicionales a los chunks de streaming

**Nota:** Estos filtros son un parche temporal. La solución correcta es que el backend no genere este contenido técnico.

---

## Prioridad

**Alta** - El Copilot es una funcionalidad clave y actualmente no puede responder preguntas sobre datos del usuario.

---

## Contacto

Para dudas técnicas sobre la integración:
- Revisar código en: `apps/web/pages/api/copilot/chat.ts`
- Revisar contexto enviado en: `apps/web/services/copilotChat.ts`

---

**Gracias por su atención a estos ajustes.**
