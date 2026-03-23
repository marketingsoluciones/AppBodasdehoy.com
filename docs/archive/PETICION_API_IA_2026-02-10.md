# 🚨 Petición Formal: Backend api-ia (Python)

**Para**: Equipo Backend api-ia.bodasdehoy.com
**De**: Equipo Frontend PLANNER AI
**Fecha**: 2026-02-10
**Prioridad**: ⚠️ **P0 - CRÍTICA - BLOQUEANTE**

---

## 📋 Resumen Ejecutivo

Este documento consolida **TODAS las peticiones y preguntas** dirigidas específicamente al backend **api-ia** (Python).

### Alcance

**Backend Responsable**: `https://api-ia.bodasdehoy.com`

**Servicios que maneja**:
- 🔴 **Memories API** - Álbumes, fotos, miembros (CRÍTICO: 30s timeout)
- 💬 **Chat Copilot** - Streaming SSE en vivo
- 🔐 **Auth** - Identificación de usuarios
- 📊 **Health** - Health checks

### Estado

| Área | Estado | Urgencia |
|------|--------|----------|
| **Memories API** | ❌ 30s timeout | 🔴 P0 - CRÍTICA |
| **Chat - Historial** | ❓ Sin confirmar | 🔴 P0 - BLOQUEANTE |
| **Chat - SessionId** | ❓ Sin confirmar | 🔴 P0 - BLOQUEANTE |
| **Chat - SSE** | ❓ Sin validar | 🟡 P1 - ALTA |
| **Auth - Usuarios** | ⚠️ A veces 404 | 🟡 P1 - ALTA |
| **Testing** | ❌ No disponible | 🟡 P1 - ALTA |

---

## 🔴 PARTE 1: OPTIMIZACIÓN MEMORIES API (P0 - CRÍTICA)

### Problema Crítico

**Endpoint**: `GET /api/memories/albums`

**Síntomas**:
```bash
Test 1: 30.595722s ❌
Test 2: 30.549180s ❌
Test 3: 30.548239s ❌

Promedio: 30.6 segundos
Desviación: 0.024s (muy consistente - timeout configurado)
```

**Comparativa**:
- `/health` → 0.437s ✅ (69x más rápido)
- `/graphql` proxy → 0.252s ✅ (121x más rápido)
- `/api/memories/albums` → 30.596s ❌

### Impacto

- ⚠️ **100% de usuarios nuevos** esperan 30s
- ⚠️ **Funcionalidad inutilizable** sin workarounds frontend
- ⚠️ **NO LANZABLE a producción**

### Solución Requerida

**4 acciones técnicas**:

#### 1. Crear Índices en Base de Datos (30 min)

**MongoDB**:
```javascript
db.albums.createIndex({ "user_id": 1, "development": 1 });
db.albums.createIndex({ "created_at": -1 });
db.albums.createIndex({ "event_id": 1 });
db.albums.createIndex({ "itinerary_id": 1 });
db.albums.createIndex({ "parent_album_id": 1 });

db.album_media.createIndex({ "album_id": 1, "created_at": -1 });
db.album_media.createIndex({ "uploaded_by": 1 });

db.album_members.createIndex({ "album_id": 1 });
db.album_members.createIndex({ "user_id": 1 });

db.share_tokens.createIndex({ "token": 1 }, { unique: true });
db.share_tokens.createIndex({ "expires_at": 1 });
```

**PostgreSQL**:
```sql
CREATE INDEX idx_albums_user_dev ON albums(user_id, development);
CREATE INDEX idx_albums_created ON albums(created_at DESC);
CREATE INDEX idx_albums_event ON albums(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_albums_itinerary ON albums(itinerary_id) WHERE itinerary_id IS NOT NULL;
CREATE INDEX idx_albums_parent ON albums(parent_album_id) WHERE parent_album_id IS NOT NULL;

CREATE INDEX idx_media_album_created ON album_media(album_id, created_at DESC);
CREATE INDEX idx_media_uploader ON album_media(uploaded_by);

CREATE INDEX idx_members_album ON album_members(album_id);
CREATE INDEX idx_members_user ON album_members(user_id);

CREATE UNIQUE INDEX idx_share_token ON share_tokens(token);
CREATE INDEX idx_share_expires ON share_tokens(expires_at);
```

**Impacto esperado**: 30s → 1-2s

---

#### 2. Implementar Paginación (2 horas)

**Request esperado**:
```bash
GET /api/memories/albums?user_id=X&development=Y&page=1&limit=20&sort=-created_at
```

**Response esperada**:
```json
{
  "success": true,
  "albums": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "pages": 6,
    "has_next": true,
    "has_prev": false
  }
}
```

**Impacto esperado**: Reducción proporcional

---

#### 3. Implementar Caché con Redis (3 horas)

**Configuración**:
```python
from redis import Redis

redis_client = Redis(host='localhost', port=6379, db=0, decode_responses=True)

CACHE_TTL = {
    'albums_list': 300,      # 5 minutos
    'album_detail': 300,
    'album_media': 300,
    'album_members': 300,
}

def cached(ttl_key: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            key = f"memories:{ttl_key}:{cache_key(*args, **kwargs)}"

            cached_data = redis_client.get(key)
            if cached_data:
                return json.loads(cached_data)

            result = await func(*args, **kwargs)

            redis_client.setex(key, CACHE_TTL[ttl_key], json.dumps(result))

            return result
        return wrapper
    return decorator

@cached('albums_list')
async def get_albums(user_id, development, page):
    # ... query database
    return albums
```

**Impacto esperado**: 1-2s → 50-100ms

---

#### 4. Optimizar Queries - Eliminar N+1 (2 horas)

**Problema actual (estimado)**:
```python
# ❌ N+1 Problem
albums = await db.albums.find({'user_id': user_id}).to_list()

for album in albums:
    photo_count = await db.album_media.count_documents({'album_id': album['_id']})
    member_count = await db.album_members.count_documents({'album_id': album['_id']})
```
**Resultado**: 1 + (N × 2) queries → 201 queries para 100 albums

**Solución**:
```python
# ✅ Optimizado
albums = await db.albums.find({'user_id': user_id}).to_list()
album_ids = [album['_id'] for album in albums]

# 1 query para todos los photo_count
photo_counts = await db.album_media.aggregate([
    {'$match': {'album_id': {'$in': album_ids}}},
    {'$group': {'_id': '$album_id', 'count': {'$sum': 1}}}
]).to_list()

# 1 query para todos los member_count
member_counts = await db.album_members.aggregate([
    {'$match': {'album_id': {'$in': album_ids}}},
    {'$group': {'_id': '$album_id', 'count': {'$sum': 1}}}
]).to_list()

# Mapear
photo_map = {item['_id']: item['count'] for item in photo_counts}
member_map = {item['_id']: item['count'] for item in member_counts}

for album in albums:
    album['photo_count'] = photo_map.get(album['_id'], 0)
    album['member_count'] = member_map.get(album['_id'], 0)
```
**Resultado**: 3 queries fijas

**Impacto esperado**: O(N) → O(1)

---

### Estimado Total - Memories

| Tarea | Tiempo | Prioridad |
|-------|--------|-----------|
| Crear índices | 30 min | P0 |
| Implementar paginación | 2 horas | P0 |
| Setup Redis + caché | 3 horas | P0 |
| Optimizar queries (N+1) | 2 horas | P0 |
| Testing y deploy | 1 hora | P0 |

**Total**: **8-9 horas** (1 día de trabajo)

**Resultado esperado**: **30s → 200-500ms**

---

## 🔴 PARTE 2: PREGUNTAS CRÍTICAS - HISTORIAL DE CHAT (P0)

### Contexto

Según documentación, **api-ia guarda mensajes en API2** al finalizar cada stream de chat. Frontend necesita confirmar este flujo.

### Pregunta 1: ¿api-ia persiste historial?

**Opciones**:
- [ ] **SÍ** - api-ia guarda en su propia BD (MongoDB/PostgreSQL)
- [ ] **SÍ** - api-ia guarda en API2 (GraphQL)
- [ ] **NO** - api-ia NO persiste (frontend debe persistir)

**Si guarda, especificar**:
- ¿Dónde? `___________________________`
- ¿Cuándo? ¿Al finalizar stream? ¿Por cada mensaje? `___________________________`

---

### Pregunta 2: ¿Endpoint para obtener historial en api-ia?

**Actualmente**, frontend lee historial desde **API2** con `getChatMessages` porque así nos indicó el equipo api-ia.

**¿Existe (o podría existir) endpoint en api-ia para leer historial?**

**Opciones**:
- [ ] **SÍ existe** - Endpoint: `___________________________`
- [ ] **NO existe, pero PODRÍA implementarse** - Propuesta: `GET /webapi/chat/history?sessionId=xxx`
- [ ] **NO - Seguir usando API2** (mantener actual)

**Ventajas de tener endpoint en api-ia**:
- ✅ Frontend solo apunta a 1 URL (api-ia)
- ✅ api-ia maneja toda la lógica de chat
- ✅ Simplifica configuración frontend

**Si se implementa, sugerencia**:
```python
@app.get("/webapi/chat/history")
async def get_chat_history(
    session_id: str,
    limit: int = 50,
    offset: int = 0
):
    """
    Obtener historial de mensajes para una sesión.
    Internamente puede llamar a API2 o a su propia BD.
    """
    # Opción 1: Llamar a API2 internamente
    response = await api2_client.query(
        "getChatMessages",
        variables={"sessionId": session_id, "limit": limit}
    )
    return response["data"]["getChatMessages"]

    # Opción 2: Query a BD propia de api-ia
    messages = await db.chat_messages.find({
        'session_id': session_id
    }).sort('created_at', -1).limit(limit).to_list()
    return messages
```

**Decisión**: `___________________________`

---

### Pregunta 3: ¿Cómo guardar mensajes?

**Pregunta**: ¿api-ia guarda automáticamente al procesar `/webapi/chat/auto`, o hay que llamar a endpoint separado?

**Opciones**:
- [ ] **AUTO-SAVE** - Se guarda automáticamente al finalizar stream
- [ ] **ENDPOINT SEPARADO** - Frontend debe llamar a: `___________________________`

**Respuesta**: `___________________________`

---

## 🔴 PARTE 3: PREGUNTAS CRÍTICAS - SESSIONID (P0)

### Pregunta 4: ¿api-ia usa sessionId?

**Actualmente enviamos**:
```json
POST /webapi/chat/auto
{
  "messages": [...],
  "metadata": {
    "sessionId": "user_abc123",
    "userId": "user@test.com",
    "development": "bodasdehoy"
  }
}
```

**¿api-ia usa el campo `metadata.sessionId` para algo?**

**Opciones**:
- [ ] **SÍ** - Se usa para agrupar mensajes/contexto
- [ ] **SÍ** - Se usa pero con otro nombre: `___________________________`
- [ ] **NO** - No se usa actualmente

**Respuesta**: `___________________________`

---

### Pregunta 5: ¿Formato correcto de sessionId?

**Formato actual que enviamos**: `user_<uid>` o `guest_<id>`

**¿Es correcto?**
- [ ] **SÍ** - Formato correcto
- [ ] **NO** - Usar este formato: `___________________________`

**Ubicación correcta**:
- [ ] `metadata.sessionId` (actual)
- [ ] `metadata.session_id`
- [ ] Header `X-Session-Id`
- [ ] Otro: `___________________________`

**Respuesta**: `___________________________`

---

## 🟡 PARTE 4: PREGUNTAS ALTAS - EVENTOS SSE (P1)

### Contexto

Frontend parsea eventos SSE con tipos enriquecidos: `tool_result`, `ui_action`, `event_card`, `usage`, `reasoning`, etc.

### Pregunta 6: ¿api-ia envía eventos enriquecidos?

**Tipos que parseamos**:
- `tool_result` - Resultado de herramienta
- `ui_action` - Acción de UI
- `confirm_required` - Requiere confirmación
- `progress` - Progreso de operación
- `code_output` - Output de código
- `tool_start` - Inicio de herramienta
- `event_card` - Tarjeta de evento
- `usage` - Métricas de uso
- `reasoning` - Razonamiento del modelo

**¿Cuáles se envían actualmente?**
- [ ] `tool_result`
- [ ] `ui_action`
- [ ] `confirm_required`
- [ ] `progress`
- [ ] `code_output`
- [ ] `tool_start`
- [ ] `event_card`
- [ ] `usage`
- [ ] `reasoning`
- [ ] **Ninguno** - Solo `text`, `error`, `done`
- [ ] **Otros**: `___________________________`

**Respuesta**: `___________________________`

---

### Pregunta 7: Ejemplos reales de SSE

**Por favor proporcionar 1-2 ejemplos REALES (anonimizados) de líneas SSE para**:

**Ejemplo 1: `event_card`**
```
event: event_card
data: ___________________________
```

**Ejemplo 2: `usage`**
```
event: usage
data: ___________________________
```

**Ejemplo 3: `reasoning`**
```
event: reasoning
data: ___________________________
```

**Ejemplo 4: `tool_result`**
```
event: tool_result
data: ___________________________
```

**Objetivo**: Validar que nuestro parseo frontend es correcto.

---

### Pregunta 8: ¿Documentación de eventos SSE?

**¿Existe documentación que liste**:
- Todos los tipos de evento que se pueden enviar
- Formato de `data` para cada tipo
- Ejemplos reales

**Respuesta**:
- [ ] **SÍ** - URL: `___________________________`
- [ ] **NO** - No existe
- [ ] **PARCIAL** - Ver: `___________________________`

---

## 🟡 PARTE 5: PREGUNTAS ALTAS - AUTH (P1)

### Pregunta 9: ¿Sincronización usuarios Firebase?

**Problema observado**: A veces `/api/auth/identify-user` devuelve 404 si usuario no existe en BD de api-ia.

**¿Cómo se sincronizan usuarios?**

**Opciones**:
- [ ] **AUTO** - Sincronización automática Firebase → api-ia
- [ ] **WEBHOOK** - Webhook de Firebase → api-ia
- [ ] **MANUAL** - Hay que crear usuarios manualmente
- [ ] **ON-DEMAND** - Se crean al primer request
- [ ] **Otro**: `___________________________`

**Si es webhook/manual, especificar proceso**: `___________________________`

**Respuesta**: `___________________________`

---

### Pregunta 10: ¿Token y headers suficientes?

**Headers actuales que enviamos**:
```
Authorization: Bearer <JWT from Firebase>
X-Development: bodasdehoy
X-User-Id: user@test.com (opcional)
X-Event-Id: evt_123 (opcional)
X-Page-Name: /wedding-creator (opcional)
X-Request-Id: req_abc123 (opcional)
```

**¿Son suficientes para**:
- Identificar usuario
- Asociar conversación
- Autorizar operaciones

**Respuesta**:
- [ ] **SÍ** - Suficiente
- [ ] **NO** - Faltan headers: `___________________________`

---

## 🔴 PARTE 6: PREGUNTAS CRÍTICAS - CONTRATOS API (P0)

### Pregunta 11: Contrato de body de chat

**Actualmente enviamos**:
```json
POST /webapi/chat/auto
Content-Type: application/json
Authorization: Bearer <JWT>

{
  "messages": [
    {"role": "user" | "assistant" | "system", "content": "string"}
  ],
  "stream": true,
  "metadata": {
    "userId": "string",
    "development": "string",
    "eventId": "string",
    "eventName": "string",
    "sessionId": "string",
    "pageContext": "string"
  },
  "model": "string" (opcional)
}
```

**¿Es correcto?**
- [ ] **SÍ** - Correcto
- [ ] **NO** - Formato correcto: `___________________________`

---

### Pregunta 12: Campos obligatorios vs opcionales

**Por favor marcar**:

| Campo | Obligatorio | Opcional |
|-------|-------------|----------|
| `messages` | [ ] | [ ] |
| `stream` | [ ] | [ ] |
| `metadata` | [ ] | [ ] |
| `metadata.userId` | [ ] | [ ] |
| `metadata.development` | [ ] | [ ] |
| `metadata.sessionId` | [ ] | [ ] |
| `metadata.eventId` | [ ] | [ ] |
| `metadata.eventName` | [ ] | [ ] |
| `metadata.pageContext` | [ ] | [ ] |
| `model` | [ ] | [ ] |

**Campos adicionales requeridos**: `___________________________`

---

### Pregunta 13: Headers obligatorios

**Por favor marcar**:

| Header | Obligatorio | Opcional |
|--------|-------------|----------|
| `Authorization` | [ ] | [ ] |
| `X-Development` | [ ] | [ ] |
| `X-User-Id` | [ ] | [ ] |
| `X-Event-Id` | [ ] | [ ] |
| `X-Page-Name` | [ ] | [ ] |
| `X-Request-Id` | [ ] | [ ] |

**Headers adicionales requeridos**: `___________________________`

---

### Pregunta 14: Formato de respuesta streaming

**Respuesta SSE actual que parseamos**:
```
event: text
data: {"choices": [{"delta": {"content": "Hola"}}]}

event: done
data: {"choices": [{"message": {"content": "Hola mundo"}}]}
```

**¿Es correcto?**
- [ ] **SÍ** - Correcto
- [ ] **NO** - Formato correcto: `___________________________`

---

### Pregunta 15: Formato de respuesta no-streaming

**Si `stream: false`, formato esperado**:
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Respuesta"
      }
    }
  ]
}
```

**¿Es correcto?**
- [ ] **SÍ** - Correcto
- [ ] **NO** - Formato correcto: `___________________________`

---

## 🟡 PARTE 7: PREGUNTAS ALTAS - TESTING (P1)

### Pregunta 16: ¿Entorno de testing?

**¿Existe URL de api-ia para testing/staging?**

**Opciones**:
- [ ] **SÍ** - URL: `___________________________`
- [ ] **NO** - Solo producción

**Si SÍ, credenciales**:
- API Key: `___________________________`
- JWT de test: `___________________________`
- Usuario de test: `___________________________`

---

### Pregunta 17: SessionId de prueba

**¿Existe sessionId de prueba con mensajes ya guardados?**

**Objetivo**: Probar lectura de historial de punta a punta.

**Respuesta**:
- [ ] **SÍ** - SessionId: `___________________________`
- [ ] **NO** - No disponible

---

### Pregunta 18: Usuario/JWT de test

**¿Existe usuario de test para automatización?**

**Respuesta**:
- [ ] **SÍ**
  - Email: `___________________________`
  - JWT: `___________________________`
  - Password: `___________________________`
- [ ] **NO** - No disponible

---

## 🟢 PARTE 8: PREGUNTAS MEDIA - MÉTRICAS (P2)

### Pregunta 19: ¿api-ia registra métricas?

**¿api-ia registra métricas de uso del chat?**
- Mensajes enviados
- Errores
- Latencia
- Por usuario/desarrollo

**Respuesta**:
- [ ] **SÍ** - Se registran
- [ ] **NO** - No se registran
- [ ] **PARCIALMENTE** - Solo: `___________________________`

---

### Pregunta 20: ¿Frontend debe reportar eventos?

**¿Frontend debe llamar a algún endpoint para reportar eventos?**

**Opciones**:
- [ ] **NO** - Backend deriva métricas de peticiones
- [ ] **SÍ** - Llamar a: `___________________________`

---

### Pregunta 21: ¿Dashboard de métricas?

**¿Existe dashboard para ver métricas de Copilot?**

**Respuesta**:
- [ ] **SÍ** - URL: `___________________________`
- [ ] **NO** - No existe

---

## ⏱️ RESUMEN DE ESTIMADOS

### Fase 1: CRÍTICA (Día 1)

| Tarea | Tiempo | Impacto |
|-------|--------|---------|
| **Optimización Memories** | 8-9 horas | 30s → 500ms |
| Responder preguntas P0 | 1-2 horas | Desbloquear integración |

**Total Día 1**: **10-11 horas**

### Fase 2: ALTA (Día 2-3)

| Tarea | Tiempo | Impacto |
|-------|--------|---------|
| Responder preguntas P1 | 1-2 horas | Completar integración |
| Proporcionar entorno test | 1 hora | Habilitar tests |
| Completar endpoints Memories | 8-12 horas | Feature 100% |

**Total Día 2-3**: **10-15 horas**

### Total Estimado

**Tiempo total**: **20-26 horas** (2-3 días laborables)

**Resultado**:
- ✅ Memories API funcionando (30s → 500ms)
- ✅ Integración chat completa y validada
- ✅ Tests con datos reales posibles
- ✅ Feature lista para producción

---

## 📊 CHECKLIST DE RESPUESTAS

### Parte 1: Memories (P0)
- [ ] Índices creados en BD
- [ ] Paginación implementada
- [ ] Caché con Redis funcionando
- [ ] Queries optimizados
- [ ] Deploy a staging
- [ ] Performance < 500ms confirmado

### Parte 2: Historial (P0)
- [ ] P1: ¿api-ia persiste historial?
- [ ] P2: ¿Endpoint de historial en api-ia?
- [ ] P3: ¿Cómo guardar mensajes?

### Parte 3: SessionId (P0)
- [ ] P4: ¿api-ia usa sessionId?
- [ ] P5: ¿Formato correcto?

### Parte 4: SSE (P1)
- [ ] P6: ¿Eventos enriquecidos enviados?
- [ ] P7: Ejemplos reales proporcionados
- [ ] P8: Documentación disponible

### Parte 5: Auth (P1)
- [ ] P9: ¿Sincronización usuarios?
- [ ] P10: ¿Headers suficientes?

### Parte 6: Contratos (P0)
- [ ] P11: Contrato body confirmado
- [ ] P12: Campos obligatorios marcados
- [ ] P13: Headers obligatorios marcados
- [ ] P14: Formato streaming confirmado
- [ ] P15: Formato no-streaming confirmado

### Parte 7: Testing (P1)
- [ ] P16: Entorno de testing disponible
- [ ] P17: SessionId de prueba proporcionado
- [ ] P18: Usuario/JWT de test proporcionado

### Parte 8: Métricas (P2)
- [ ] P19: Métricas registradas confirmado
- [ ] P20: Reporteo frontend aclarado
- [ ] P21: Dashboard disponible

**Total**: **1 optimización crítica + 21 preguntas**

---

## 📞 ACCIÓN REQUERIDA

### Solicitamos

1. **Asignación de recursos**: 1 Backend Developer Senior
2. **Priorización**: P0 - Crítica - Bloqueante
3. **Fecha de inicio**: Lo antes posible (hoy si es posible)
4. **Formato de respuesta**: Llenar este documento directamente

### Timeline Solicitado

- **Confirmación de recursos**: 24 horas
- **Inicio optimización Memories**: Inmediato
- **Entrega Fase 1** (Memories + P0): 1 día
- **Entrega Fase 2** (P1 + features): 2-3 días

---

## 📧 RESPUESTA - Por favor llenar

### ✅ Confirmación api-ia Backend

**Responsable**: `___________________________`
**Email**: `___________________________`
**Fecha de respuesta**: `___________________________`

#### Asignación de Recursos

- **Backend Developer**: `___________________________`
- **Horas asignadas**: `___________________________`

#### Fechas Comprometidas

- **Inicio**: `___________________________`
- **Entrega Fase 1** (Memories crítica): `___________________________`
- **Entrega Fase 2** (Completar features): `___________________________`

#### Comentarios

`___________________________`

---

## 📚 DOCUMENTACIÓN DE REFERENCIA

- [`REQUERIMIENTOS_BACKEND_MEMORIES_2026-02-10.md`](REQUERIMIENTOS_BACKEND_MEMORIES_2026-02-10.md) - 70 páginas, 21 endpoints, código Python completo
- [`INFORME_BACKEND_OPTIMIZACIONES_2026-02-10.md`](INFORME_BACKEND_OPTIMIZACIONES_2026-02-10.md) - Estado actual frontend
- [`ARQUITECTURA_APIS_BACKEND_2026-02-10.md`](ARQUITECTURA_APIS_BACKEND_2026-02-10.md) - Diagrama de arquitectura

---

**Preparado por**: Equipo Frontend PLANNER AI
**Fecha**: 2026-02-10
**Versión**: 1.0
**Estado**: ⏳ **ESPERANDO RESPUESTA api-ia**

---

**FIN DEL DOCUMENTO**
