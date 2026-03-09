# Ejemplo TIBCO: identificar si el error es nuestro o de un backend

Objetivo: en un flujo que llama a varios backends, cuando hay un error saber si viene **de nuestro flujo** (lógica, timeout, transformación) o **de un backend concreto** (API externa).

---

## 1. Esquema del flujo

```
[Trigger REST] → [Validar request] → [Llamar Backend A] → [Llamar Backend B] → [Llamar Backend C] → [Respuesta]
                       ↓                     ↓                    ↓                    ↓
                    Error nuestro         Error A              Error B             Error C
                       ↓                     ↓                    ↓                    ↓
                       └─────────────────────┴────────────────────┴────────────────────┘
                                                      ↓
                                            [Clasificar y responder error]
                                            - source: "ours" | "backend_a" | "backend_b" | "backend_c"
                                            - statusCode, message, details
```

---

## 2. Patrón de respuesta de error unificado

Definir un formato común para que el consumidor sepa **quién** falló:

```json
{
  "error": true,
  "source": "backend_b",
  "sourceLabel": "Servicio de Pedidos",
  "message": "Timeout after 5000ms",
  "statusCode": 504,
  "ourStep": "call_backend_b",
  "timestamp": "2026-02-25T10:30:00Z",
  "requestId": "req-abc-123"
}
```

- **source**: `ours` (validación, lógica, timeout nuestro) o `backend_a`, `backend_b`, `backend_c`.
- **ourStep**: paso del flujo donde ocurrió (útil para logs).
- **statusCode**: HTTP que devolvimos; si viene de un backend, puedes guardar también el statusCode original.

---

## 3. Ejemplo de flujo en estilo Flogo (conceptual)

En TIBCO Flogo cada actividad puede devolver éxito o error. La idea es **no fallar el flujo entero** en la primera excepción, sino capturar, marcar el origen y responder.

### Paso 1 – Validar request (error “nuestro”)

- Actividad: validar body, headers, parámetros.
- Si falla → respuesta con `source: "ours"`, `ourStep: "validate_request"`, `message`: "Invalid payload", `statusCode`: 400.

### Paso 2 – Llamar Backend A

- Actividad: HTTP Request (REST) a Backend A.
- **Éxito**: seguir al siguiente paso.
- **Error** (timeout, 4xx, 5xx, conexión):
  - Guardar en el flujo: `errorSource = "backend_a"`, `errorMessage`, `errorStatusCode`.
  - Ir a la rama “Responder error” (ver abajo).

### Paso 3 – Llamar Backend B

- Igual que A: HTTP a Backend B.
- Si falla → `errorSource = "backend_b"`, etc., y rama “Responder error”.

### Paso 4 – Llamar Backend C

- Mismo patrón → `errorSource = "backend_c"` si falla.

### Paso 5 – Responder error (una sola rama)

- Entrada: `errorSource`, `errorMessage`, `errorStatusCode`, `ourStep`.
- Salida: JSON con el formato unificado de arriba y HTTP status (por ejemplo 502 si es backend, 400/500 si es “ours”).

Así, **cualquier** error (nuestro o de un backend) se clasifica en un solo lugar y siempre devuelves `source` y `ourStep`.

---

## 4. Cómo distinguir “nuestro” vs “backend”

| Situación | source | Ejemplo |
|-----------|--------|--------|
| Validación de input fallida | `ours` | "Missing required field: orderId" |
| Timeout o error de red nuestro | `ours` | "Timeout connecting to backend" (si el timeout es del flujo, no del backend) |
| Backend devuelve 4xx/5xx | `backend_a` / `backend_b` / `backend_c` | "Backend B returned 503" |
| Timeout configurado en la llamada al backend | `backend_a` / etc. | "Backend A did not respond in 5s" |
| Error en transformación (mapper) después de recibir respuesta | `ours` | "Failed to map Backend B response" |

Regla práctica:

- **Error en actividad “nuestra”** (validación, lógica, mapper, conexión desde nuestro flujo) → `source: "ours"`.
- **Error que devuelve el servicio externo** (status HTTP de error o timeout de la llamada a ese backend) → `source: "backend_*"` según qué llamada falló.

---

## 5. Ejemplo de `flogo.json` (estructura simplificada)

Fragmento de recursos/triggers para ver cómo se vería la atribución en un flujo real (los IDs y detalles dependen de tu TIBCO/Flogo):

```json
{
  "name": "flow-errores-backends",
  "resources": [
    {
      "id": "flow:main",
      "data": {
        "metadata": { "input": [], "output": [] },
        "tasks": [
          { "id": "validate", "activityRef": "validate_request", "name": "Validar" },
          { "id": "call_a", "activityRef": "rest", "name": "Llamar Backend A", "settings": { "uri": "{{$env.BACKEND_A_URL}}" } },
          { "id": "call_b", "activityRef": "rest", "name": "Llamar Backend B", "settings": { "uri": "{{$env.BACKEND_B_URL}}" } },
          { "id": "call_c", "activityRef": "rest", "name": "Llamar Backend C", "settings": { "uri": "{{$env.BACKEND_C_URL}}" } },
          { "id": "respond_ok", "activityRef": "respond_success", "name": "Respuesta OK" }
        ],
        "links": [
          { "from": "validate", "to": "call_a", "type": "success" },
          { "from": "validate", "to": "respond_error", "type": "error", "value": "ours" },
          { "from": "call_a", "to": "call_b", "type": "success" },
          { "from": "call_a", "to": "respond_error", "type": "error", "value": "backend_a" },
          { "from": "call_b", "to": "call_c", "type": "success" },
          { "from": "call_b", "to": "respond_error", "type": "error", "value": "backend_b" },
          { "from": "call_c", "to": "respond_ok", "type": "success" },
          { "from": "call_c", "to": "respond_error", "type": "error", "value": "backend_c" }
        ]
      }
    }
  ]
}
```

En cada rama `error` debes pasar el `value` (`ours`, `backend_a`, etc.) a la actividad “Responder error” para rellenar `source` en la respuesta.

---

## 6. Respuesta unificada en la actividad “Responder error”

La actividad que construye la respuesta de error puede usar algo así (adaptado a tu motor de expresiones TIBCO):

- **source**: el valor que viene del link (ours / backend_a / backend_b / backend_c).
- **sourceLabel**: mapeo legible, ej. `backend_a` → "Catálogo", `backend_b` → "Pedidos", `backend_c` → "Pagos".
- **message**: mensaje del error (de la actividad que falló o “Validation failed”, “Timeout”, etc.).
- **statusCode**: 400 si `ours` por validación, 502/504 si es backend.
- **ourStep**: ID del task que falló (validate, call_a, call_b, call_c).

Con esto, quien consuma tu flujo puede leer `source` y saber si el fallo es **vuestro** (integración TIBCO) o **de uno de los backends** por nombre.

---

## 7. Resumen

- **Un solo formato de error** con `source` y `ourStep`.
- **Errores en validación/lógica/mapper** → `source: "ours"`.
- **Errores en llamada HTTP a cada backend** → `source: "backend_a"` (o b/c) y opcionalmente el statusCode del backend.
- Flujo: validar → llamar A → B → C; en cualquier fallo ir a “Responder error” con el origen correcto.

Si quieres, el siguiente paso puede ser bajar esto a **un solo backend** (por ejemplo solo Backend B) con un ejemplo de payload de request/response real para pegar en TIBCO.
