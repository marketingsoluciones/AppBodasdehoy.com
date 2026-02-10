# 🏗️ Arquitectura: APIs Backend y Responsabilidades

**Fecha**: 2026-02-10
**Propósito**: Clarificar qué API maneja qué funcionalidad

---

## 📊 Resumen Ejecutivo

El proyecto usa **DOS backends diferentes**:

1. **api-ia.bodasdehoy.com** - Backend Python (FastAPI) - IA, Chat, Memories
2. **api2.eventosorganizador.com** - Backend GraphQL - Datos de negocio, Persistencia

---

## 🔄 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (PLANNER AI - Puerto 3210)                        │
│  apps/copilot + apps/web                                    │
│  Next.js 15 + React 19                                      │
└─────────────┬───────────────────────────┬───────────────────┘
              │                           │
              │ HTTPS                     │ HTTPS
              ▼                           ▼
┌──────────────────────────────┐  ┌──────────────────────────┐
│  API-IA (Python Backend)     │  │  API2 (GraphQL)          │
│  api-ia.bodasdehoy.com       │  │  api2.eventosorganizador │
│                              │  │         .com/graphql     │
│  Servicios:                  │  │                          │
│  • Chat Copilot (/webapi)    │  │  Servicios:              │
│  • Memories API (/api)       │  │  • Eventos               │
│  • Auth (/api/auth)          │  │  • Usuarios              │
│  • Streaming SSE             │  │  • Historial Chat (read) │
│                              │  │  • Invitados             │
│                              │──┼─>│ • Persistencia         │
│  (api-ia ESCRIBE aquí) ──────┘  │                          │
└──────────────────────────────┘  └──────────────────────────┘
         ↓                                  ↓
         ▼                                  ▼
┌──────────────────────────────┐  ┌──────────────────────────┐
│  Base de Datos api-ia        │  │  Base de Datos API2      │
│  (MongoDB/PostgreSQL?)       │  │  (PostgreSQL?)           │
│  • Albums                    │  │  • chat_messages         │
│  • Media                     │  │  • events                │
│  • Temp data                 │  │  • users                 │
└──────────────────────────────┘  └──────────────────────────┘
```

---

## 🎯 API-IA (api-ia.bodasdehoy.com)

### ¿Qué es?

Backend **Python** (probablemente FastAPI) desplegado en Digital Ocean que maneja:
- 🤖 **Inteligencia Artificial** - Procesamiento de chat con LLMs
- 💬 **Chat del Copilot** - Streaming SSE, herramientas, contexto
- 📸 **Memories API** - Álbumes, fotos, miembros
- 🔐 **Auth básico** - Identificación de usuarios

### URLs Configuradas

```bash
BACKEND_URL=https://api-ia.bodasdehoy.com
PYTHON_BACKEND_URL=https://api-ia.bodasdehoy.com
USE_PYTHON_BACKEND=true
```

### Endpoints Principales

#### 1. Chat del Copilot

```bash
# Chat en vivo con streaming
POST https://api-ia.bodasdehoy.com/webapi/chat/auto

Headers:
  Authorization: Bearer <JWT>
  Content-Type: application/json
  X-Development: bodasdehoy
  X-User-Id: user@test.com (opcional)
  X-Event-Id: evt_123 (opcional)

Body:
{
  "messages": [
    {"role": "user", "content": "Hola"}
  ],
  "stream": true,
  "metadata": {
    "userId": "user@test.com",
    "sessionId": "user_abc123",
    "development": "bodasdehoy"
  }
}

Response: Server-Sent Events (SSE)
event: text
data: {"choices": [{"delta": {"content": "Hola"}}]}

event: done
data: {"choices": [{"message": {"content": "Hola mundo"}}]}
```

**IMPORTANTE**: Al finalizar la respuesta, **api-ia guarda los mensajes en API2** automáticamente.

---

#### 2. Memories API (⚠️ PROBLEMA CRÍTICO)

```bash
# Listar álbumes del usuario
GET https://api-ia.bodasdehoy.com/api/memories/albums
    ?user_id=user@test.com
    &development=bodasdehoy

# ❌ PROBLEMA: Tarda 30.6 segundos
# ✅ SOLUCIÓN REQUERIDA: Índices + caché + paginación
```

**Todos los endpoints de Memories**:

| Endpoint | Método | Propósito | Tiempo Actual |
|----------|--------|-----------|---------------|
| `/api/memories/albums` | GET | Listar álbumes | ❌ 30.6s |
| `/api/memories/albums` | POST | Crear álbum | ⏳ Lento |
| `/api/memories/albums/{id}` | GET | Detalle álbum | ❌ ~30s |
| `/api/memories/albums/{id}` | PUT | Actualizar álbum | ⏳ Lento |
| `/api/memories/albums/{id}` | DELETE | Eliminar álbum | ⏳ Lento |
| `/api/memories/albums/{id}/media` | GET | Listar fotos | ❌ ~30s |
| `/api/memories/albums/{id}/media` | POST | Agregar foto | ⏳ Lento |
| `/api/memories/albums/{id}/media/{mediaId}` | DELETE | Eliminar foto | ⏳ Lento |
| `/api/memories/albums/{id}/members` | GET | Listar miembros | ❌ ~30s |
| `/api/memories/albums/{id}/members/invite` | POST | Invitar miembro | ⏳ Lento |
| `/api/memories/albums/{id}/share` | POST | Generar link | ⏳ Lento |
| `/api/memories/share/{token}` | GET | Acceder compartido | ⏳ Lento |

**Total**: 21 endpoints documentados en [`REQUERIMIENTOS_BACKEND_MEMORIES_2026-02-10.md`](REQUERIMIENTOS_BACKEND_MEMORIES_2026-02-10.md)

---

#### 3. Auth

```bash
# Identificar usuario
POST https://api-ia.bodasdehoy.com/api/auth/identify-user

# ⚠️ PROBLEMA: A veces 404 si usuario no existe
# ❓ PREGUNTA: ¿Usuarios Firebase se sincronizan automáticamente?
```

---

#### 4. Health Check

```bash
GET https://api-ia.bodasdehoy.com/health

# ✅ Responde en 0.437s (correcto)
```

---

## 🔷 API2 (api2.eventosorganizador.com)

### ¿Qué es?

Backend **GraphQL** separado que maneja la **persistencia de datos de negocio**:
- 📅 Eventos (bodas, XV años, etc.)
- 👤 Usuarios
- 👥 Invitados
- 💬 **Historial de mensajes del chat** (api-ia escribe aquí)
- 📊 Datos de negocio en general

### URL Configurada

```bash
GRAPHQL_ENDPOINT=https://api2.eventosorganizador.com/graphql
API2_GRAPHQL_URL=https://api2.eventosorganizador.com/graphql
```

### Endpoints Principales

#### 1. Historial de Chat (⚠️ ARQUITECTURA COMPLEJA)

```graphql
# Leer historial de mensajes
POST https://api2.eventosorganizador.com/graphql

query GetChatMessages($sessionId: String!, $limit: Int) {
  getChatMessages(sessionId: $sessionId, limit: $limit) {
    id
    role
    content
    createdAt
    metadata
  }
}
```

**IMPORTANTE - Flujo completo**:

```
1. Usuario envía mensaje → Frontend
2. Frontend → api-ia (POST /webapi/chat/auto)
3. api-ia procesa con LLM y responde por SSE
4. ✅ api-ia GUARDA mensaje en API2 (internamente)
5. Frontend lee historial desde API2 (query getChatMessages)
```

**⚠️ PROBLEMA**: Frontend tiene que apuntar a DOS URLs diferentes:
- `api-ia.bodasdehoy.com` para chat en vivo
- `api2.eventosorganizador.com` para historial

**💡 PROPUESTA**: api-ia podría exponer endpoint de historial (ej. `GET /webapi/chat/history`) que internamente llame a API2, así frontend solo apunta a una URL.

---

#### 2. Otros Datos de Negocio

```graphql
# Eventos
query GetEvent($id: ID!) {
  event(id: $id) {
    id
    name
    date
    type
    guests { id, name, email }
  }
}

# Invitados
query GetGuests($eventId: ID!) {
  guests(eventId: $eventId) {
    id
    name
    email
    confirmed
  }
}
```

**Nota**: Frontend usa API2 para datos de eventos, pero usa api-ia para todo lo relacionado con IA y Memories.

---

## 🔀 Flujos de Integración

### Flujo 1: Chat del Copilot (Chat en Vivo)

```
1. Usuario escribe mensaje en UI
   └─> Frontend (apps/copilot)

2. Frontend hace proxy
   └─> POST apps/web/app/api/copilot/chat/route.ts
       └─> proxy a api-ia.bodasdehoy.com/webapi/chat/auto

3. api-ia procesa
   ├─> Llama a LLM (OpenAI/Anthropic/etc)
   ├─> Ejecuta herramientas si necesario
   └─> Responde por SSE (streaming)

4. api-ia guarda en API2
   └─> Mutation interna a api2.eventosorganizador.com
       └─> Guarda user message + assistant response

5. Frontend muestra respuesta
   └─> Parsea SSE y actualiza UI
```

**APIs involucradas**:
- ✅ api-ia: Chat en vivo
- ✅ API2: Persistencia (api-ia escribe)

---

### Flujo 2: Historial de Chat (Al Reabrir Panel)

```
1. Usuario reabre panel de Copilot
   └─> Frontend necesita mostrar historial

2. Frontend hace proxy
   └─> GET apps/web/app/api/copilot/chat-history/route.ts
       └─> query a api2.eventosorganizador.com/graphql
           └─> getChatMessages(sessionId: "user_abc", limit: 50)

3. API2 devuelve mensajes
   └─> Frontend muestra historial en UI
```

**APIs involucradas**:
- ✅ API2: Lectura de historial

**⚠️ PROBLEMA ACTUAL**:
- Si API2 falla, frontend usa fallback a memoria local
- Ver [`apps/web/app/api/chat/messages/route.ts`](apps/web/app/api/chat/messages/route.ts)

**❓ PREGUNTA PENDIENTE**:
- ¿api-ia podría exponer GET /webapi/chat/history para unificar?

---

### Flujo 3: Memories (Álbumes de Fotos)

```
1. Usuario navía a /memories
   └─> Frontend (apps/copilot)

2. Frontend llama directamente
   └─> GET api-ia.bodasdehoy.com/api/memories/albums
       ?user_id=user@test.com&development=bodasdehoy

3. api-ia consulta su propia DB
   └─> Query a MongoDB/PostgreSQL (api-ia DB)
   └─> ❌ PROBLEMA: Tarda 30.6 segundos

4. Frontend muestra álbumes
   └─> Con caché local de 5 min (workaround)
```

**APIs involucradas**:
- ✅ api-ia: Memories API (CRUD de albums/fotos)
- ❌ API2: NO se usa para Memories

**🔴 CRÍTICO**: Solo api-ia puede resolver el problema de 30s.

---

## 📋 Tabla Resumen: ¿Qué API Usa Cada Funcionalidad?

| Funcionalidad | API Responsable | Endpoint | Estado |
|---------------|-----------------|----------|--------|
| **Chat en vivo** | api-ia | `POST /webapi/chat/auto` | ✅ Funciona (0.5-1s) |
| **Historial chat (write)** | api-ia → API2 | Interno (mutation) | ✅ Automático |
| **Historial chat (read)** | API2 | `query getChatMessages` | ⏳ Funciona pero con preguntas |
| **Memories - Álbumes** | api-ia | `GET/POST /api/memories/albums` | ❌ **30s timeout** |
| **Memories - Fotos** | api-ia | `GET/POST /api/memories/.../media` | ❌ **30s timeout** |
| **Memories - Miembros** | api-ia | `GET/POST /api/memories/.../members` | ❌ **30s timeout** |
| **Auth - Identify** | api-ia | `POST /api/auth/identify-user` | ⚠️ A veces 404 |
| **Eventos** | API2 | `query event(id)` | ✅ Funciona |
| **Invitados** | API2 | `query guests(eventId)` | ✅ Funciona |
| **Health check** | api-ia | `GET /health` | ✅ Funciona (0.4s) |

---

## 🎯 Peticiones a Backend: ¿A Quién van Dirigidas?

### Para el Equipo **api-ia** (Python Backend)

**Responsable de**:
- 🔴 **CRÍTICO**: Optimizar Memories API (30s → < 500ms)
  - Crear índices en base de datos
  - Implementar paginación
  - Implementar caché con Redis
  - Optimizar queries (N+1)

- ❓ **Preguntas sobre Chat**:
  - ¿Cómo se usa sessionId?
  - ¿Formato de eventos SSE?
  - ¿Sincronización de usuarios Firebase?
  - ¿Entorno de testing disponible?

**Documentos**:
- [`PETICION_FORMAL_BACKEND_MEMORIES_2026-02-10.md`](PETICION_FORMAL_BACKEND_MEMORIES_2026-02-10.md)
- [`RECORDATORIO_PREGUNTAS_BACKEND_2026-02-10.md`](RECORDATORIO_PREGUNTAS_BACKEND_2026-02-10.md) (Bloques 1, 2, 4, 5, 6, 7, 8, 9)

---

### Para el Equipo **API2** (GraphQL)

**Responsable de**:
- ❓ **Preguntas sobre Historial de Chat**:
  - ¿Formato exacto de `getChatMessages`?
  - ¿Hay mutation para guardar mensajes? (o solo api-ia escribe)
  - ¿Campos de respuesta confirmados?

**Documentos**:
- [`RECORDATORIO_PREGUNTAS_BACKEND_2026-02-10.md`](RECORDATORIO_PREGUNTAS_BACKEND_2026-02-10.md) (Bloque 3)

---

## 🔍 Variables de Entorno (Frontend)

```bash
# apps/copilot/.env.local
BACKEND_URL=https://api-ia.bodasdehoy.com
PYTHON_BACKEND_URL=https://api-ia.bodasdehoy.com
USE_PYTHON_BACKEND=true

GRAPHQL_ENDPOINT=https://api2.eventosorganizador.com/graphql
API2_GRAPHQL_URL=https://api2.eventosorganizador.com/graphql
```

```bash
# apps/web/.env.local
NEXT_PUBLIC_PYTHON_BACKEND_URL=https://api-ia.bodasdehoy.com
NEXT_PUBLIC_API_URL=https://api2.eventosorganizador.com/graphql
```

---

## 💡 Recomendaciones de Arquitectura

### Problema Actual

Frontend tiene que mantener conexión a **DOS backends diferentes**:

```
Frontend
├─> api-ia (chat, memories)
└─> API2 (historial, eventos)
```

### Propuesta de Mejora

**Opción A: Unificar en api-ia** (Recomendado)

```
Frontend
└─> api-ia (todo)
    ├─> Procesa chat, memories, auth
    └─> Proxy interno a API2 para historial/eventos
```

**Ventajas**:
- ✅ Frontend solo mantiene 1 conexión
- ✅ Simplifica configuración
- ✅ api-ia tiene control total
- ✅ Mejor para caché y optimización

**Cambios necesarios**:
```python
# Nuevo endpoint en api-ia
@app.get("/webapi/chat/history")
async def get_chat_history(session_id: str, limit: int = 50):
    # Internamente llama a API2 GraphQL
    response = await api2_client.query(
        "getChatMessages",
        variables={"sessionId": session_id, "limit": limit}
    )
    return response["data"]["getChatMessages"]
```

---

**Opción B: Mantener separado** (Actual)

Ventajas:
- ✅ Separación de responsabilidades
- ✅ API2 puede ser usado por otros clientes

Desventajas:
- ❌ Frontend más complejo
- ❌ 2 URLs, 2 configuraciones
- ❌ 2 puntos de fallo

---

## 🏁 Conclusión

### Resumen

| Backend | URL | Responsabilidad | Estado |
|---------|-----|-----------------|--------|
| **api-ia** | api-ia.bodasdehoy.com | Chat, Memories, Auth | ⚠️ Memories con timeout de 30s |
| **API2** | api2.eventosorganizador.com | Persistencia, Eventos | ✅ Funciona |

### Peticiones Dirigidas

**api-ia** (CRÍTICO):
- 🔴 Optimizar Memories API (30s → 500ms)
- ❓ Responder preguntas de integración

**API2**:
- ❓ Confirmar formato de getChatMessages
- ❓ Aclarar flujo de escritura de mensajes

---

**Preparado por**: Claude Code
**Fecha**: 2026-02-10
**Versión**: 1.0
