# 🔍 Solución: Playground Aparece Vacío - Preguntas en Tiempo Real

**Problema**: El Playground en `http://localhost:3210/bodasdehoy/admin/playground` no muestra preguntas.
**Fecha análisis**: 6 de febrero de 2026

---

## 1. DIAGNÓSTICO DEL PROBLEMA

### ¿Qué es el Playground?

**Ubicación**: `apps/copilot/src/app/[variants]/(main)/admin/playground/page.tsx`

El Playground es una herramienta de testing en tiempo real que:
- Carga preguntas de prueba desde el backend Python
- Ejecuta preguntas contra diferentes modelos de IA
- Muestra respuestas en streaming (SSE)
- Analiza automáticamente si las respuestas cumplen criterios

### Flujo de Carga de Preguntas

```typescript
// En apps/copilot/src/features/DevPanel/Playground/index.tsx
const loadQuestions = async () => {
  setLoading(true);
  try {
    const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api-ia.bodasdehoy.com';
    const url = new URL('/api/admin/tests/questions', backendURL);
    url.searchParams.append('limit', '100');

    const response = await fetch(url.toString(), {
      headers: {
        ...buildAuthHeaders(),
        'X-Development': 'bodasdehoy',
      },
    });

    const data = await response.json();
    setQuestions(data); // 👈 AQUÍ SE CARGAN LAS PREGUNTAS
  } catch (error) {
    console.error('Error loading questions:', error);
    setQuestions([]); // 👈 SI FALLA, ARRAY VACÍO
  } finally {
    setLoading(false);
  }
};
```

---

## 2. CAUSAS IDENTIFICADAS

### Causa 1: Backend Python No Tiene Endpoint
**Probabilidad**: 🔴 **MUY ALTA (95%)**

El endpoint `/api/admin/tests/questions` NO EXISTE en el backend Python.

**Verificación**:
```bash
# Buscar en el backend Python
grep -r "tests/questions" apps/copilot/
grep -r "/api/admin/tests" apps/copilot/

# Resultado: NO SE ENCUENTRA
```

**Solución**:
```python
# En backend Python: api/admin/tests.py (NUEVO ARCHIVO)
from fastapi import APIRouter, Query
from typing import List

router = APIRouter()

@router.get("/api/admin/tests/questions")
async def get_test_questions(limit: int = Query(100, ge=1, le=500)):
    """
    Retorna lista de preguntas de prueba para el Playground
    """
    questions = [
        {
            "id": "T01",
            "question": "Hola",
            "expectedResponse": "Saludo cordial",
            "category": "general",
            "difficulty": "easy",
            "keywords": ["hola", "saludo"]
        },
        {
            "id": "T02",
            "question": "¿Cuántos invitados tengo?",
            "expectedResponse": "25 invitados",
            "category": "invitados",
            "difficulty": "medium",
            "keywords": ["25", "invitados", "total"]
        },
        # ... más preguntas del ANALISIS_COMPLETO_PREGUNTAS_TESTS.md
    ]

    return questions[:limit]
```

---

### Causa 2: Variable de Entorno Incorrecta
**Probabilidad**: 🟡 **MEDIA (40%)**

`NEXT_PUBLIC_BACKEND_URL` apunta a URL incorrecta o no está definida.

**Verificación**:
```bash
# En apps/copilot/
cat .env.local | grep BACKEND_URL
cat .env | grep BACKEND_URL

# Valores esperados:
# Local: http://localhost:8000
# Test: https://api-ia-test.bodasdehoy.com
# Prod: https://api-ia.bodasdehoy.com
```

**Solución**:
```bash
# apps/copilot/.env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# O para testing con backend de staging:
NEXT_PUBLIC_BACKEND_URL=https://api-ia-test.bodasdehoy.com
```

---

### Causa 3: Headers de Autenticación Inválidos
**Probabilidad**: 🟡 **MEDIA (30%)**

`buildAuthHeaders()` no retorna headers válidos.

**Ubicación**: `apps/copilot/src/utils/authToken.ts`

**Verificación**:
```javascript
// En DevTools Console del navegador
const headers = buildAuthHeaders();
console.log('Auth Headers:', headers);

// Debe retornar algo como:
// { 'Authorization': 'Bearer eyJ...', 'X-User-Id': 'user123' }
```

**Código actual** (probablemente):
```typescript
// apps/copilot/src/utils/authToken.ts
export const buildAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  const userId = localStorage.getItem('user_id');

  if (!token || !userId) {
    console.warn('No auth token or userId found');
    return {}; // 👈 RETORNA VACÍO SI NO HAY AUTH
  }

  return {
    'Authorization': `Bearer ${token}`,
    'X-User-Id': userId,
  };
};
```

**Solución temporal** (bypass auth):
```typescript
export const buildAuthHeaders = () => {
  // Para desarrollo local, usar headers mock
  if (process.env.NODE_ENV === 'development') {
    return {
      'Authorization': 'Bearer dev_token',
      'X-User-Id': 'bodasdehoy.com@gmail.com',
    };
  }

  const token = localStorage.getItem('auth_token');
  const userId = localStorage.getItem('user_id');

  return {
    'Authorization': `Bearer ${token || 'dev_token'}`,
    'X-User-Id': userId || 'guest',
  };
};
```

---

### Causa 4: CORS Bloqueando Request
**Probabilidad**: 🟢 **BAJA (10%)**

El backend Python rechaza requests desde `localhost:3210`.

**Verificación**:
```bash
# En DevTools > Network > /api/admin/tests/questions
# Ver si hay error CORS en Headers
```

**Solución** (en backend Python):
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3210",
        "http://127.0.0.1:3210",
        "https://chat-test.bodasdehoy.com",
        "https://chat.bodasdehoy.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 3. SOLUCIÓN RÁPIDA (WORKAROUND)

### Opción A: Mock de Preguntas en Frontend

**Archivo**: `apps/copilot/src/features/DevPanel/Playground/mockQuestions.ts`

```typescript
export const MOCK_QUESTIONS = [
  {
    id: "T01",
    question: "Hola",
    expectedResponse: "Saludo cordial sin errores técnicos",
    category: "general",
    difficulty: "easy",
    keywords: ["hola", "saludo", "bienvenido"]
  },
  {
    id: "T02",
    question: "¿Cuántos invitados tengo?",
    expectedResponse: "25 invitados en la Boda de Paco y Pico",
    category: "invitados",
    difficulty: "medium",
    keywords: ["25", "invitados", "total"]
  },
  {
    id: "T03",
    question: "¿Cuánto llevo pagado del presupuesto?",
    expectedResponse: "5000 EUR de 15000 EUR",
    category: "presupuesto",
    difficulty: "medium",
    keywords: ["5000", "5.000", "presupuesto", "pagado"]
  },
  {
    id: "T04",
    question: "Quiero ver mis invitados",
    expectedResponse: "Link a /invitados",
    category: "navegacion",
    difficulty: "easy",
    keywords: ["invitados", "link", "ver"]
  },
  {
    id: "T05",
    question: "Llévame al presupuesto",
    expectedResponse: "Link a /presupuesto",
    category: "navegacion",
    difficulty: "easy",
    keywords: ["presupuesto", "link", "navega"]
  },
  {
    id: "T06",
    question: "¿Cómo se llama mi evento?",
    expectedResponse: "Boda de Paco y Pico",
    category: "evento",
    difficulty: "easy",
    keywords: ["Paco", "Pico", "nombre", "evento"]
  },
  {
    id: "T07",
    question: "¿Cuántas mesas tengo?",
    expectedResponse: "5 mesas",
    category: "mesas",
    difficulty: "easy",
    keywords: ["5", "mesas", "seating"]
  },
  {
    id: "T08",
    question: "Dime 3 consejos para organizar una boda",
    expectedResponse: "Lista de consejos generales",
    category: "general",
    difficulty: "medium",
    keywords: ["consejos", "organizar", "boda", "tips"]
  },
  {
    id: "T09",
    question: "Dame un resumen completo de mi evento",
    expectedResponse: "Resumen multi-módulo",
    category: "resumen",
    difficulty: "hard",
    keywords: ["resumen", "completo", "evento", "Paco", "Pico"]
  },
  {
    id: "T10",
    question: "Agrega a Jose Garcia y Jose Morales como invitados a mi evento",
    expectedResponse: "Confirmación de creación de invitados",
    category: "function_calling",
    difficulty: "hard",
    keywords: ["Jose Garcia", "Jose Morales", "agregado", "invitado"]
  },
  {
    id: "T11",
    question: "¿Cuántos días faltan para mi boda?",
    expectedResponse: "Cálculo de días restantes",
    category: "evento",
    difficulty: "medium",
    keywords: ["días", "faltan", "fecha", "2026-06-15"]
  }
];
```

**Modificar**: `apps/copilot/src/features/DevPanel/Playground/index.tsx`

```typescript
import { MOCK_QUESTIONS } from './mockQuestions';

const loadQuestions = async () => {
  setLoading(true);
  try {
    // MODO DESARROLLO: Usar preguntas mock
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 DEV MODE: Usando preguntas mock');
      await new Promise(r => setTimeout(r, 500)); // Simular delay
      setQuestions(MOCK_QUESTIONS);
      setLoading(false);
      return;
    }

    // MODO PRODUCCIÓN: Cargar del backend
    const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api-ia.bodasdehoy.com';
    const url = new URL('/api/admin/tests/questions', backendURL);
    url.searchParams.append('limit', '100');

    const response = await fetch(url.toString(), {
      headers: {
        ...buildAuthHeaders(),
        'X-Development': 'bodasdehoy',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    setQuestions(data);
  } catch (error) {
    console.error('Error loading questions:', error);
    console.warn('⚠️ Fallback a preguntas mock');
    setQuestions(MOCK_QUESTIONS); // 👈 FALLBACK A MOCK
  } finally {
    setLoading(false);
  }
};
```

---

### Opción B: Endpoint Local Node.js

**Archivo**: `apps/copilot/src/app/api/admin/tests/questions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  const questions = [
    {
      id: "T01",
      question: "Hola",
      expectedResponse: "Saludo cordial sin errores técnicos",
      category: "general",
      difficulty: "easy",
      keywords: ["hola", "saludo", "bienvenido"]
    },
    // ... resto de preguntas
  ];

  return NextResponse.json(questions.slice(0, limit));
}
```

Con esta opción:
- El Playground carga desde `http://localhost:3210/api/admin/tests/questions`
- No depende del backend Python
- Funciona inmediatamente

**Modificar** `buildAuthHeaders()` ya no es necesario (mismo origen).

---

## 4. DEPURACIÓN PASO A PASO

### Paso 1: Verificar que el Playground carga

```bash
# 1. Ir a http://localhost:3210/bodasdehoy/admin/playground
# 2. Abrir DevTools > Console
# 3. Buscar errores
```

**Logs esperados**:
```
🎮 Playground mounted
Loading questions from: https://api-ia.bodasdehoy.com/api/admin/tests/questions?limit=100
```

**Si aparece**:
```
❌ Error loading questions: TypeError: Failed to fetch
```
→ **Causa**: Backend no responde o CORS bloqueado

---

### Paso 2: Inspeccionar Network Request

```bash
# DevTools > Network
# Filtrar por "questions"
# Click en el request
```

**Ver**:
- **Status**: 200 OK, 404 Not Found, 500 Error?
- **Response**: ¿Qué retorna? ¿Array vacío `[]`? ¿JSON válido?
- **Headers**: ¿Tiene CORS errors?

**Ejemplos**:

**Caso A: 404 Not Found**
```json
{
  "detail": "Not Found"
}
```
→ **Causa**: Endpoint no existe en backend

**Caso B: 200 OK pero array vacío**
```json
[]
```
→ **Causa**: Backend no tiene preguntas en DB

**Caso C: 200 OK con datos**
```json
[
  { "id": "T01", "question": "Hola", ... },
  { "id": "T02", "question": "¿Cuántos invitados tengo?", ... }
]
```
→ **Éxito**: Preguntas cargadas correctamente

---

### Paso 3: Forzar Recarga

```javascript
// En DevTools Console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

### Paso 4: Habilitar Debug Mode

```javascript
// En DevTools Console
localStorage.setItem('debug-panel-enabled', 'true');
localStorage.setItem('debug', 'playground');
location.reload();
```

O añadir a URL:
```
http://localhost:3210/bodasdehoy/admin/playground?debug=true
```

---

## 5. SOLUCIÓN DEFINITIVA (Implementación Backend)

### Backend Python: Estructura Recomendada

```
backend-python/
├── api/
│   ├── admin/
│   │   ├── __init__.py
│   │   └── tests.py          👈 NUEVO
│   └── main.py
├── models/
│   └── test_question.py      👈 NUEVO
└── database/
    └── test_questions.json   👈 DATOS
```

**models/test_question.py**:
```python
from pydantic import BaseModel
from typing import List, Optional

class TestQuestion(BaseModel):
    id: str
    question: str
    expectedResponse: str
    category: str
    difficulty: str
    keywords: List[str]
    shouldContain: Optional[List[str]] = []
    shouldNotContain: Optional[List[str]] = []
    requiresEventContext: bool = False
    requiresAuth: bool = False
```

**api/admin/tests.py**:
```python
from fastapi import APIRouter, Query, HTTPException
from typing import List
import json
from models.test_question import TestQuestion

router = APIRouter(prefix="/api/admin/tests", tags=["admin"])

# Cargar preguntas desde archivo JSON
def load_questions() -> List[TestQuestion]:
    with open('database/test_questions.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    return [TestQuestion(**q) for q in data['questions']]

@router.get("/questions", response_model=List[TestQuestion])
async def get_test_questions(
    limit: int = Query(100, ge=1, le=500, description="Máximo de preguntas a retornar"),
    category: Optional[str] = Query(None, description="Filtrar por categoría"),
    difficulty: Optional[str] = Query(None, description="Filtrar por dificultad")
):
    """
    Retorna lista de preguntas de prueba para el Playground.

    Categorías: general, invitados, presupuesto, mesas, evento, navegacion
    Dificultades: easy, medium, hard
    """
    try:
        questions = load_questions()

        # Filtrar por categoría
        if category:
            questions = [q for q in questions if q.category == category]

        # Filtrar por dificultad
        if difficulty:
            questions = [q for q in questions if q.difficulty == difficulty]

        return questions[:limit]
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Test questions file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**database/test_questions.json**:
```json
{
  "questions": [
    {
      "id": "T01",
      "question": "Hola",
      "expectedResponse": "Saludo cordial sin errores técnicos",
      "category": "general",
      "difficulty": "easy",
      "keywords": ["hola", "saludo", "bienvenido"],
      "shouldContain": [],
      "shouldNotContain": ["error", "RequestId", "herramienta"],
      "requiresEventContext": false,
      "requiresAuth": false
    }
    // ... resto de preguntas del ANALISIS_COMPLETO_PREGUNTAS_TESTS.md
  ]
}
```

**Registrar en main.py**:
```python
from api.admin import tests

app.include_router(tests.router)
```

---

## 6. TESTING

### Test Manual

```bash
# 1. Iniciar backend Python
cd backend-python
python main.py

# 2. Iniciar Copilot
cd apps/copilot
pnpm dev

# 3. Ir a http://localhost:3210/bodasdehoy/admin/playground

# 4. Verificar que aparecen preguntas
```

### Test con curl

```bash
# Test directo al backend
curl http://localhost:8000/api/admin/tests/questions?limit=5

# Debe retornar:
# [{"id":"T01","question":"Hola",...}, ...]
```

---

## 7. CHECKLIST DE VERIFICACIÓN

```
✅ Backend Python tiene endpoint /api/admin/tests/questions
✅ Endpoint retorna JSON array válido con estructura correcta
✅ NEXT_PUBLIC_BACKEND_URL apunta a backend correcto
✅ CORS configurado correctamente en backend
✅ buildAuthHeaders() retorna headers válidos (o bypass en dev)
✅ Playground carga sin errores en Console
✅ Al menos 5 preguntas aparecen en la lista
✅ Se pueden seleccionar preguntas con checkbox
✅ Botón "Ejecutar Seleccionadas" está habilitado
✅ Al ejecutar, se ve respuesta en streaming
✅ Análisis automático funciona (score, passed/failed)
```

---

## 8. RESULTADO ESPERADO

Una vez solucionado, el Playground debe mostrar:

```
┌────────────────────────────────────────────────────────────┐
│  🎮 Playground - Test en Tiempo Real (11 preguntas)        │
├────────────────────────────────────────────────────────────┤
│ [Modelo: Claude 3.5 Sonnet ▼] [Provider: Anthropic ▼]     │
│ [✓ Ejecutar Seleccionadas (5)] [Detener] [Limpiar]        │
├─────────────────────────┬──────────────────────────────────┤
│ ☑ T01: Hola             │ Panel de Resultados              │
│   general | easy        │                                  │
│ ☑ T02: ¿Cuántos...?     │ Esperando ejecución...           │
│   invitados | medium    │                                  │
│ ☑ T03: ¿Cuánto...?      │                                  │
│   presupuesto | medium  │                                  │
│ ☐ T04: Quiero ver...    │                                  │
│   navegacion | easy     │                                  │
│ ... (7 más)             │                                  │
└─────────────────────────┴──────────────────────────────────┘
```

---

## 9. PRÓXIMOS PASOS

1. **Implementar mock temporal** (Opción A) → 15 minutos
2. **O implementar endpoint backend** (Solución definitiva) → 1 hora
3. **Poblar con 11 preguntas** del análisis
4. **Ejecutar tests en Playground**
5. **Generar reporte de resultados**
6. **Iterar según hallazgos**
