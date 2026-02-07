# Análisis Completo de Preguntas en Tests del Copilot

**Fecha**: 6 de febrero de 2026
**Total de archivos de test analizados**: 64
**Total de preguntas únicas identificadas**: 11 principales + variaciones

---

## 1. PREGUNTAS PRINCIPALES DEL TEST BATTERY (11 casos)

### **Archivo**: `apps/web/scripts/test-copilot-battery.js`
**Estado**: ⭐⭐⭐⭐⭐ Production-ready
**Evento de prueba**: Boda de Paco y Pico (ID: 695e98c1e4c78d86fe107f71)

| ID | Pregunta | Tipo | Módulo | Esperado |
|----|----------|------|--------|----------|
| **T01** | "Hola" | General | Chat | Saludo cordial sin errores técnicos |
| **T02** | "¿Cuántos invitados tengo?" | Específico | Invitados | Debe responder "25" usando contexto |
| **T03** | "¿Cuánto llevo pagado del presupuesto?" | Específico | Presupuesto | Debe mencionar "5000" o "5.000" de 15000 total |
| **T04** | "Quiero ver mis invitados" | General | Navegación | Debe incluir link `/invitados` |
| **T05** | "Llévame al presupuesto" | General | Navegación | Debe incluir link `/presupuesto` |
| **T06** | "¿Cómo se llama mi evento?" | Específico | Evento | Debe mencionar "Paco" y "Pico" |
| **T07** | "¿Cuántas mesas tengo?" | Específico | Mesas | Debe responder "5 mesas" |
| **T08** | "¿Cuántos invitados tengo?" (sin contexto) | Edge Case | Testing | Sin metadata, debe responder genéricamente |
| **T09** | "Dime 3 consejos para organizar una boda" | General | Consejos | Streaming SSE, mínimo 5 chunks |
| **T10** | "Dame un resumen completo de mi evento" | Específico | Resumen | Datos de múltiples módulos, NO ejecutar funciones |
| **T11** | "Agrega a Jose Garcia y Jose Morales como invitados a mi evento" | Específico | Function Calling | Debe usar tool para agregar invitados |

---

## 2. PREGUNTAS EN TEST E2E (test-copilot-e2e.js)

### Pregunta 1: Eventos del próximo año
```
"Cuales son todos mis eventos para el próximo año?"
```
- **Tipo**: Específico - Lista de eventos
- **Módulo**: Eventos
- **Esperado**: Lista con "Boda de Paco y Pico" y fecha 2026-06-15

### Pregunta 2: Alergias alimentarias
```
"Hay algún invitado con celiaquia o alergia alimentaria?"
```
- **Tipo**: Específico - Búsqueda en invitados
- **Módulo**: Invitados
- **Esperado**: Debe buscar en campo de notas/alergias

### Pregunta 3: Agregar invitado con alergia
```
"Agrega un nuevo invitado a la Boda de Paco y Pico.
 Se llama Carlos Garcia Test, email carlos.test@example.com,
 mesa 2, con celiaquia."
```
- **Tipo**: Específico - Function calling complejo
- **Módulo**: Invitados
- **Esperado**: Ejecutar `create_guest` con todos los parámetros

### Pregunta 4: Confirmar creación
```
"Puedes confirmar si Carlos Garcia Test aparece en la lista?"
```
- **Tipo**: Específico - Verificación
- **Módulo**: Invitados
- **Esperado**: Buscar en lista actualizada y confirmar

---

## 3. CATEGORIZACIÓN DE PREGUNTAS

### 3.1 Preguntas GENERALES (no requieren contexto específico)

```javascript
// Saludo
"Hola"
"Buenos días"
"Hola, ¿cómo estás?"

// Consejos generales
"Dime 3 consejos para organizar una boda"
"Dame ideas de decoración para una boda"
"¿Qué debo hacer un mes antes de la boda?"
"Consejos para elegir el lugar de la boda"

// Navegación
"Quiero ver mis invitados"
"Llévame al presupuesto"
"Muéstrame el itinerario"
"Navega a las mesas"

// Ayuda general
"¿Qué puedes hacer?"
"Ayúdame a planificar mi boda"
"¿Cómo funciona la app?"
```

### 3.2 Preguntas ESPECÍFICAS (requieren contexto del evento)

```javascript
// Datos del evento
"¿Cómo se llama mi evento?"
"¿Cuándo es mi boda?"
"¿Qué tipo de evento tengo?"

// Invitados
"¿Cuántos invitados tengo?"
"¿Cuántos confirmaron?"
"¿Cuántos están pendientes?"
"Hay algún invitado con celiaquia o alergia alimentaria?"
"Lista de invitados que no han respondido"

// Presupuesto
"¿Cuánto llevo pagado del presupuesto?"
"¿Cuánto me falta por pagar?"
"¿Cuál es mi presupuesto total?"
"¿En qué categoría he gastado más?"

// Mesas
"¿Cuántas mesas tengo?"
"¿Cuántos asientos hay en la mesa 1?"
"¿Dónde está sentado Juan García?"

// Resumen multi-módulo
"Dame un resumen completo de mi evento"
"Dame un resumen de la Boda de Paco y Pico"
"¿Cómo va mi planificación?"

// Eventos múltiples
"Cuales son todos mis eventos para el próximo año?"
"¿Cuántos eventos tengo?"
```

### 3.3 Preguntas ACCIÓN (function calling)

```javascript
// Crear invitado
"Agrega a Jose Garcia como invitado"
"Agrega a Jose Garcia y Jose Morales como invitados a mi evento"
"Agrega un nuevo invitado a la Boda de Paco y Pico.
 Se llama Carlos Garcia Test, email carlos.test@example.com,
 mesa 2, con celiaquia."

// Modificar invitado
"Cambia la mesa de Juan García a la mesa 3"
"Confirma la asistencia de María López"

// Crear tarea
"Agrega una tarea para llamar al fotógrafo"
"Recuérdame revisar el menú mañana"
```

---

## 4. METADATA DE CONTEXTO USADO EN TESTS

```javascript
const REAL_METADATA = {
  userId: 'bodasdehoy.com@gmail.com',
  development: 'bodasdehoy',
  eventId: '695e98c1e4c78d86fe107f71',
  eventName: 'Boda de Paco y Pico',
  pageContext: {
    pageName: 'resumen-evento',
    eventName: 'Boda de Paco y Pico',
    screenData: {
      totalInvitados: 25,
      confirmados: 12,
      pendientes: 13,
      presupuestoTotal: 15000,
      pagado: 5000,
      currency: 'EUR',
      totalMesas: 5,
      totalItinerarios: 2,
      tipoEvento: 'Boda',
      fechaEvento: '2026-06-15',
    },
    eventsList: [
      {
        name: 'Boda de Paco y Pico',
        type: 'Boda',
        date: '2026-06-15',
        id: '695e98c1e4c78d86fe107f71'
      },
    ],
  },
};
```

---

## 5. EXPECTATIVAS DE RESPUESTA POR TIPO

### Preguntas Generales
```javascript
{
  hasContent: true,
  minLength: 10-50,
  shouldContain: [], // Opcional según contexto
  shouldNotContain: [
    'error',
    'RequestId',
    'herramienta',
    'ejecutar',
    'get_user_events',
    'función'
  ],
  tone: {
    spanish: true,
    friendly: true,
    professional: true
  }
}
```

### Preguntas Específicas
```javascript
{
  hasContent: true,
  minLength: 20+,
  shouldContain: [
    // Datos específicos del evento
    '25', 'invitado', 'Paco', 'Pico', etc.
  ],
  shouldNotContain: [
    'no tengo acceso',
    'no puedo ver',
    'ejecutar herramienta',
    'función get_'
  ],
  expectedData: {
    usesEventContext: true,
    accurateNumbers: true,
    referencesEventName: true
  },
  expectedLinks: [
    '/invitados',
    '/presupuesto',
    '/mesas',
    '/resumen-evento'
  ]
}
```

### Preguntas de Acción
```javascript
{
  hasContent: true,
  minLength: 20+,
  shouldContain: [
    // Confirmación de acción
    'agregado', 'creado', 'actualizado',
    // Nombre del invitado/item
    'Jose Garcia', 'Jose Morales'
  ],
  shouldNotContain: [
    'error',
    'no puedo',
    'herramienta', // No debe MOSTRAR que ejecutó tool
    'ejecutar',
    'función'
  ],
  expectedBehavior: {
    executesTool: true,
    showsConfirmation: true,
    providesNextSteps: true,
    offersNavigationLink: true
  }
}
```

---

## 6. PATRONES DE HALLUCINATION DETECTADOS

### ❌ Hallucinations a EVITAR

1. **Mencionar ejecución de herramientas**
```
BAD: "Voy a ejecutar la herramienta get_user_events para..."
GOOD: "Tienes 1 evento registrado: Boda de Paco y Pico..."
```

2. **Inventar datos no disponibles**
```
BAD: "Tienes 30 invitados confirmados" (cuando son 12)
GOOD: "Tienes 12 invitados confirmados de 25 totales"
```

3. **Pedir ejecutar funciones que no existen**
```
BAD: "Voy a usar la función delete_all_guests..."
GOOD: (No debe ofrecer funciones destructivas)
```

4. **Mostrar RequestIds o errores internos**
```
BAD: "RequestId: abc123... error al procesar"
GOOD: "No pude completar esa acción. ¿Puedo ayudarte con otra cosa?"
```

### ✅ Comportamientos CORRECTOS

1. **Usar datos del contexto directamente**
```
PREGUNTA: "¿Cuántos invitados tengo?"
RESPUESTA: "Tienes 25 invitados registrados para la Boda de Paco y Pico.
            De ellos, 12 han confirmado y 13 están pendientes."
```

2. **Ofrecer navegación útil**
```
PREGUNTA: "Quiero ver mis invitados"
RESPUESTA: "Claro, [aquí puedes ver tu lista de invitados](/invitados).
            Actualmente tienes 25 invitados registrados."
```

3. **Confirmar acciones ejecutadas**
```
PREGUNTA: "Agrega a Jose Garcia"
RESPUESTA: "✅ He agregado a Jose Garcia a tu lista de invitados.
            [Ver todos los invitados](/invitados)"
```

---

## 7. SISTEMA DE SCORING RECOMENDADO

```javascript
const evaluateResponse = (response, test) => {
  const scores = {
    // 1. PRECISIÓN DE DATOS (40 puntos)
    dataAccuracy: calculateDataAccuracy(response, test.expectedData),

    // 2. NAVEGACIÓN Y LINKS (30 puntos)
    navigationLinks: calculateLinksScore(response, test.expectedLinks),

    // 3. EJECUCIÓN DE ACCIONES (20 puntos)
    toolExecution: calculateToolScore(response, test.expectedTools),

    // 4. TONO Y UX (10 puntos)
    tone: calculateToneScore(response, {
      spanish: true,
      friendly: true,
      concise: true,
      noTechnicalJargon: true
    })
  };

  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  return {
    pass: total >= 70, // 70/100 para aprobar
    score: total,
    breakdown: scores,
    category: categorizeQuestion(test.message)
  };
};
```

---

## 8. PREGUNTAS FALTANTES (Gap Analysis)

### Casos NO cubiertos actualmente

```javascript
// ITINERARIO
"¿Qué eventos tengo en mi itinerario?"
"¿A qué hora es la ceremonia?"
"¿Cuánto dura el cóctel?"

// PROVEEDORES
"¿Qué proveedores tengo contratados?"
"¿Cuánto cuesta el fotógrafo?"
"Dame el contacto del DJ"

// TAREAS
"¿Qué tareas tengo pendientes?"
"¿Cuántas tareas he completado?"
"Muéstrame las tareas de esta semana"

// LISTA DE REGALOS
"¿Cuántos regalos hay en mi lista?"
"¿Alguien ha comprado regalos?"

// COMUNICACIÓN
"¿Cuántas invitaciones he enviado?"
"¿Quién no ha visto su invitación?"
"Envía recordatorio a los pendientes"

// EDGE CASES
"" // Mensaje vacío
"asdfasdf" // Gibberish
"12345" // Solo números
"😀🎉" // Solo emojis
"<script>alert('xss')</script>" // Intento XSS
```

---

## 9. ESTADÍSTICAS DE TESTS ACTUALES

### Por Tipo de Pregunta

| Tipo | Cantidad | % |
|------|----------|---|
| Específico (con contexto) | 7 | 64% |
| General (sin contexto) | 3 | 27% |
| Edge Cases | 1 | 9% |

### Por Módulo

| Módulo | Cantidad | Cobertura |
|--------|----------|-----------|
| Invitados | 3 | ✅ Alta |
| Presupuesto | 2 | ✅ Media |
| Navegación | 2 | ✅ Media |
| Evento | 2 | ✅ Media |
| Mesas | 1 | ⚠️ Baja |
| Chat/Saludo | 1 | ✅ Alta |
| Itinerario | 0 | ❌ Ninguna |
| Proveedores | 0 | ❌ Ninguna |
| Tareas | 0 | ❌ Ninguna |

---

## 10. RECOMENDACIONES

### Tests a Agregar (Priority)

**Alta prioridad:**
```javascript
T12: "¿Qué tareas tengo pendientes para esta semana?"
T13: "¿Cuántos días faltan para mi boda?" // Cálculo de fecha
T14: "¿Cuánto dinero me falta por pagar?" // Cálculo presupuesto
T15: "Lista de invitados que no han confirmado" // Filtro específico
```

**Media prioridad:**
```javascript
T16: "Dame el contacto de mi fotógrafo"
T17: "¿A qué hora es la ceremonia?"
T18: "¿Cuántos regalos hay en mi lista?"
```

**Baja prioridad:**
```javascript
T19: "Envía recordatorio a Juan García"
T20: "Cambia la fecha del evento"
```

---

## 11. FORMATO DE EXPORTACIÓN PARA BACKEND

```json
{
  "questions": [
    {
      "id": "T01",
      "question": "Hola",
      "category": "general",
      "difficulty": "easy",
      "expectedResponse": "Saludo cordial sin errores técnicos",
      "keywords": ["hola", "saludo", "bienvenido"],
      "shouldContain": [],
      "shouldNotContain": ["error", "RequestId", "herramienta"],
      "requiresEventContext": false,
      "requiresAuth": false,
      "testMetadata": {
        "userId": "bodasdehoy.com@gmail.com",
        "eventId": null
      }
    },
    {
      "id": "T02",
      "question": "¿Cuántos invitados tengo?",
      "category": "invitados",
      "difficulty": "medium",
      "expectedResponse": "25 invitados en la Boda de Paco y Pico",
      "keywords": ["25", "invitados", "total"],
      "shouldContain": ["25", "invitado"],
      "shouldNotContain": ["ejecutar", "get_event_guests"],
      "requiresEventContext": true,
      "requiresAuth": true,
      "testMetadata": {
        "userId": "bodasdehoy.com@gmail.com",
        "eventId": "695e98c1e4c78d86fe107f71",
        "pageContext": {
          "pageName": "resumen-evento",
          "screenData": {
            "totalInvitados": 25,
            "confirmados": 12,
            "pendientes": 13
          }
        }
      }
    }
  ]
}
```

Este formato puede ser usado por:
- Backend Python para poblar `/api/admin/tests/questions`
- Frontend Playground para cargar y ejecutar tests
- CI/CD para tests automatizados

---

## 12. PRÓXIMOS PASOS

1. ✅ Exportar estas preguntas a formato JSON
2. ⏳ Subir al backend Python en `/api/admin/tests/questions`
3. ⏳ Verificar que el Playground carga correctamente
4. ⏳ Ejecutar batería completa en Playground
5. ⏳ Generar reporte de resultados
6. ⏳ Iterar y mejorar según resultados
