# Usar Cursor para detectar errores TIBCO (error del frontal + flujo + traza)

Tienes **tres cosas**: el error que devuelve el frontal, el flujo (definición) y la traza/petición. Con eso Cursor puede ayudarte a **detectar** dónde falló y si es vuestro error o de un backend.

---

## 1. Qué necesitas tener a mano

| Dato | Descripción | Dónde guardarlo |
|------|-------------|------------------|
| **Error del frontal** | Respuesta HTTP o mensaje que ve el frontal (status, body, headers de error). | `tibco-debug/error.json` o texto en un `.md` |
| **Flujo** | Definición del flujo (ej. `flogo.json`, fragmento del flow con actividades y links). | `tibco-debug/flujo.json` o pegado en un `.md` |
| **Traza / petición** | Request completo (URL, method, headers, body) y si hay traza TIBCO (logs, activity IDs, timestamps). | `tibco-debug/traza.md` o `traza.json` |

Ideal: los tres en archivos en tu proyecto para poder **referenciarlos en Cursor** con `@archivo`.

---

## 2. Estructura recomendada en el proyecto

Crea una carpeta (por ejemplo `tibco-debug/` o `docs/tibco-debug/`) y guarda ahí cada caso de error:

```
tibco-debug/
├── error.json          # Respuesta de error que recibió el frontal
├── flujo.json          # Definición del flujo (o flogo.json)
├── traza.md            # Petición + traza (request, logs, IDs de actividad)
└── README.md           # Opcional: una línea describiendo el caso
```

Así, cuando abres Cursor Chat puedes escribir algo como:

- “Analiza el error con @tibco-debug/error.json, el flujo @tibco-debug/flujo.json y la traza @tibco-debug/traza.md y dime dónde falló y si es nuestro error o de un backend.”

Cursor tendrá contexto de los tres y podrá cruzar error ↔ flujo ↔ traza.

---

## 3. Plantillas para rellenar

### 3.1 Error del frontal (`error.json`)

Pega la respuesta de error tal como la recibe el frontal (o exportada de Postman/DevTools):

```json
{
  "error": true,
  "source": "backend_b",
  "message": "Timeout after 5000ms",
  "statusCode": 504,
  "ourStep": "call_backend_b",
  "timestamp": "2026-02-25T10:30:00Z",
  "requestId": "req-abc-123",
  "details": {}
}
```

Si el frontal solo tiene texto o HTML, créate un `error.md` y pega el mensaje completo (y el status code si lo sabes).

### 3.2 Flujo (`flujo.json` o fragmento)

Pega el JSON del flujo (o la parte relevante: triggers, resources, tasks, links). Si usas `flogo.json`, puedes copiar todo el archivo o solo el `flow` que se ejecutó.

### 3.3 Traza / petición (`traza.md`)

Un Markdown con:

- **Request:** método, URL, headers importantes, body (o “vacío”).
- **Traza TIBCO:** logs en orden, IDs de actividad si los tienes, timestamps.
- **Otro:** correlation ID, request ID, entorno (dev/pre/pro).

Ejemplo:

```markdown
## Request
- Method: POST
- URL: https://integracion.ejemplo.com/api/orden
- Headers: Content-Type: application/json, X-Request-Id: req-abc-123
- Body: { "orderId": "ORD-001" }

## Traza / logs TIBCO
- 10:30:00.100 - Trigger received
- 10:30:00.150 - validate_request OK
- 10:30:00.200 - call_backend_a OK
- 10:30:05.250 - call_backend_b FAILED: Timeout 5000ms

## Notas
- Entorno: pre. RequestId: req-abc-123
```

Con esto Cursor puede relacionar el paso `call_backend_b` del flujo con la traza y el `ourStep` del error.

---

## 4. Cómo usar Cursor para detectar el error

### Paso 1: Guardar los tres (error, flujo, traza)

- Crea o usa la carpeta `tibco-debug/`.
- Pega el error en `error.json` (o `error.md`).
- Pega el flujo en `flujo.json`.
- Escribe la traza/petición en `traza.md`.

### Paso 2: Abrir Cursor Chat y dar contexto

En Cursor Chat (Ctrl+L / Cmd+L), **referencia los archivos** con `@`:

- `@tibco-debug/error.json`
- `@tibco-debug/flujo.json`
- `@tibco-debug/traza.md`

Y opcionalmente el doc de patrones:

- `@docs/ejemplo-tibco-flujo-errores-backends.md`

### Paso 3: Hacer la pregunta concreta

Ejemplos de prompts que puedes usar:

1. **Análisis directo**  
   “Tengo el error del frontal, el flujo y la traza en los archivos que te he adjuntado. ¿Dónde falló exactamente el flujo y el error es nuestro o de algún backend? Indica el paso (ourStep/activity) y la causa más probable.”

2. **Cruzar con el patrón de backends**  
   “Usando el patrón de @docs/ejemplo-tibco-flujo-errores-backends.md, con @tibco-debug/error.json, @tibco-debug/flujo.json y @tibco-debug/traza.md: clasifica el error (ours vs backend_*) y sugiere qué revisar en el flujo o en el backend.”

3. **Solo con error + traza**  
   “Solo tengo el error y la traza (no el flujo completo). Con @tibco-debug/error.json y @tibco-debug/traza.md: ¿qué paso del flujo falló y qué causa es más probable (timeout, 5xx, validación, mapper)?”

4. **Siguiente paso**  
   “Dado este error y traza, ¿qué debería revisar en TIBCO (configuración, timeout, mapeo) y qué debería pedir al equipo del backend si el source es backend_*?”

Cursor usará el contenido de los archivos que referencies para responder y “detectar” el error en función de:
- el `source` y `ourStep` del error,
- la definición del flujo (tasks/links),
- y la secuencia de la traza.

---

## 5. Resumen

- **Tres inputs:** error del frontal, flujo, traza/petición.
- **Guárdalos en archivos** en una carpeta tipo `tibco-debug/`.
- **En Cursor Chat:** referencia esos archivos con `@` y pregunta explícitamente “¿dónde falló y es nuestro o de un backend?”.
- Así Cursor te ayuda a **detectar** el error de forma repetible en cada caso.

Si quieres, el siguiente paso puede ser crear la carpeta `tibco-debug/` con las plantillas vacías listas para rellenar y pegar en tu repo.
