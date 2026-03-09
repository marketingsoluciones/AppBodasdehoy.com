# Respuesta al Equipo Backend API-IA - Debug Request Fallido

**Fecha:** 28 de Enero 2026
**De:** Equipo Frontend (app-test.bodasdehoy.com)
**Para:** Equipo Backend IA (api-ia.bodasdehoy.com)
**Asunto:** RE: Ejemplo de request fallido + Confirmación de links

---

## 1. Links de Navegación

**Confirmado:** Preferimos **rutas relativas** (`/presupuesto`) en lugar de URLs absolutas, ya que la app puede correr en diferentes subdominios:
- `app-test.bodasdehoy.com` (testing)
- `organizador.bodasdehoy.com` (producción)
- `app.vivetuboda.com` (whitelabel)

---

## 2. Request Fallido Capturado

### Request Completo

```
POST https://api-ia.bodasdehoy.com/webapi/chat/auto
```

### Headers Enviados:
```json
{
  "Content-Type": "application/json",
  "X-Development": "bodasdehoy",
  "X-User-Id": "bodasdehoy.com@gmail.com",
  "X-Event-Id": "test-event-123",
  "X-Request-Id": "debug_1769584882373_3exrsz"
}
```

### Body Enviado:
```json
{
  "messages": [
    {
      "role": "system",
      "content": "Eres Copilot, el asistente personal de Bodas de Hoy..."
    },
    {
      "role": "user",
      "content": "¿Cuánto tengo gastado en mi presupuesto?"
    }
  ],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 2000,
  "metadata": {
    "userId": "bodasdehoy.com@gmail.com",
    "development": "bodasdehoy",
    "eventId": "test-event-123",
    "eventName": "Boda Luis y Carla",
    "sessionId": "test_1769584882373"
  }
}
```

---

## 3. Respuesta del Backend (PROBLEMA IDENTIFICADO)

### Response Headers:
```json
{
  "content-type": "text/event-stream; charset=utf-8",
  "x-model": "unknown",
  "x-provider": "groq"
}
```

### Response Body (SSE):
```
event: text
data: "<function "

event: text
data: "name=\"get_budget\" "

event: text
data: "parameters=\"{&quot;development&quot;: "

event: text
data: "&quot;bodasdehoy&quot;, "

event: text
data: "&quot;event_id&quot;: "

event: text
data: "&quot;507f1f77bcf86cd799439011&quot;}\" "

event: text
data: "/>"

event: done
data: {}
```

---

## 4. Problema Identificado

El backend está **devolviendo sintaxis de function calls cruda** al cliente:

```xml
<function name="get_budget" parameters="{&quot;development&quot;: &quot;bodasdehoy&quot;, &quot;event_id&quot;: &quot;507f1f77bcf86cd799439011&quot;}" />
```

**Lo esperado sería:**
1. El modelo decide llamar a `get_budget()`
2. El backend **ejecuta la función internamente** y obtiene los datos
3. El backend **envía al cliente solo la respuesta natural** con los datos

**Ejemplo de respuesta esperada:**
```
event: text
data: "Tu presupuesto total es de €15,000. "

event: text
data: "Hasta ahora has gastado €8,500 (57%). "

event: text
data: "Puedes ver el desglose completo en [Ver presupuesto](/presupuesto)."

event: done
data: {}
```

---

## 5. Notas Adicionales

### Observaciones:
- El `X-User-Id` se está enviando correctamente (probamos con email y con Firebase UID)
- El `metadata.userId` también se incluye en el body
- El backend responde con `x-provider: groq` - ¿es el proveedor correcto para tool calling?
- El `x-model: unknown` sugiere que no se está determinando el modelo usado

### Segunda prueba con Firebase UID:
Mismo resultado - devuelve función cruda:
```
<function name="get_budget" parms={"development":"bodasdehoy","event_id":"507f1f77bcf86cd799439011"}/>
```

---

## 6. Archivos de Referencia

- Request completo en JSON: `apps/web/docs/DEBUG_REQUEST_API_IA.json`
- Script de captura: `apps/web/scripts/capture-failed-request.js`

---

## Resumen

| Item | Estado | Acción |
|------|--------|--------|
| Links relativos | ✅ Confirmado | Usar `/presupuesto` en vez de URL absoluta |
| Function calls crudas | ❌ Bug | El backend devuelve `<function>` en vez de ejecutar y responder |
| Ocultar funciones | ⏳ Pendiente | Depende de fix anterior |
| Acceso a datos | ⏳ Pendiente | Depende de fix anterior |

**El problema principal es que el modelo genera function calls pero el backend las está pasando directamente al cliente en lugar de ejecutarlas.**

---

Saludos,
Equipo Frontend
