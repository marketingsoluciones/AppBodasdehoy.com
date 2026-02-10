# 🚨 REQUERIMIENTOS TÉCNICOS BACKEND - MEMORIES API

**Para**: Equipo Backend (api-ia.bodasdehoy.com)
**De**: Equipo Frontend (PLANNER AI)
**Fecha**: 2026-02-10
**Prioridad**: ⚠️ **CRÍTICA - BLOQUEANTE**
**Estimado**: 8-16 horas de trabajo

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Problema Crítico Detectado](#problema-crítico-detectado)
3. [Arquitectura Actual](#arquitectura-actual)
4. [Requerimientos por Endpoint](#requerimientos-por-endpoint)
5. [Especificaciones Técnicas](#especificaciones-técnicas)
6. [Ejemplos de Implementación](#ejemplos-de-implementación)
7. [Criterios de Aceptación](#criterios-de-aceptación)
8. [Plan de Implementación](#plan-de-implementación)
9. [Testing Requerido](#testing-requerido)
10. [Anexos](#anexos)

---

## 📊 RESUMEN EJECUTIVO

### Problema

La API de Memories (`/api/memories/albums`) en **api-ia.bodasdehoy.com** tiene un **timeout de 30 segundos**, haciendo la funcionalidad **completamente inutilizable** en producción.

### Impacto

```
⚠️  CRÍTICO: Usuarios no pueden usar la funcionalidad de Albums
⚠️  100% de abandono por tiempos de espera
⚠️  Experiencia de usuario inaceptable
⚠️  Funcionalidad bloqueada para producción
```

### Comparativa

| Endpoint | Tiempo Actual | Estado |
|----------|---------------|--------|
| `/health` | 0.437s | ✅ Aceptable |
| `/graphql` | 0.252s | ✅ Excelente |
| **`/api/memories/albums`** | **30.596s** | ❌ **CRÍTICO** |

**Diferencia**: 121x más lento que GraphQL, 69x más lento que health check.

### Objetivo

Reducir el tiempo de respuesta de **30.6s** a **< 500ms** (preferiblemente < 200ms).

---

## 🔴 PROBLEMA CRÍTICO DETECTADO

### Evidencia del Problema

**Tests realizados** (2026-02-10 09:00 UTC):

```bash
# Endpoint: GET https://api-ia.bodasdehoy.com/api/memories/albums
# Params: ?user_id=test@test.com&development=bodasdehoy

Test 1: 30.595722s ❌
Test 2: 30.549180s ❌
Test 3: 30.548239s ❌

Promedio: 30.564 segundos
Desviación estándar: 0.024s (muy consistente)

Análisis: El timeout de ~30s es extremadamente consistente,
sugiere un TIMEOUT CONFIGURADO en el backend, no solo lentitud.
```

### Síntomas Observados

1. ✅ **Health check** responde en **0.4s**
2. ✅ **GraphQL proxy** responde en **0.25s**
3. ❌ **Memories endpoints** tardan **30+ segundos**
4. ⚠️ Frontend implementó timeout de 30s como workaround (ver línea 256)

### Causas Probables

Basado en el análisis técnico, las causas más probables son:

1. ❌ **Falta de índices en base de datos**
   - Queries de `user_id` + `development` sin index
   - Full table scan en cada request

2. ❌ **N+1 Query Problem**
   - Múltiples queries por cada album
   - Joins sin optimizar
   - Carga eager de relaciones

3. ❌ **Cold Start del Backend**
   - Primera petición muy lenta
   - Sin keepalive de conexiones

4. ❌ **Sin Sistema de Caché**
   - Cada request golpea la base de datos
   - Sin Redis, Memcached o caché en memoria

5. ❌ **Procesamiento Síncrono Pesado**
   - Posible procesamiento de imágenes
   - Cálculos estadísticos sin pre-computar

6. ❌ **Sin Paginación**
   - Carga todos los albums del usuario
   - Sin límite de resultados

---

## 🏗️ ARQUITECTURA ACTUAL

### Stack Backend

```
┌─────────────────────────────────────────┐
│  Frontend (PLANNER AI - Puerto 3210)    │
│  apps/copilot                            │
└────────────────┬────────────────────────┘
                 │
                 │ HTTPS
                 ▼
┌─────────────────────────────────────────┐
│  Backend API (api-ia.bodasdehoy.com)    │
│  Python Backend (Digital Ocean)          │
│                                          │
│  Servicios:                              │
│  - graphql_proxy    ✅ (0.25s)          │
│  - websockets       ✅                   │
│  - /api/memories/*  ❌ (30s timeout)     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Base de Datos                           │
│  (MongoDB/PostgreSQL?)                   │
│  ⚠️ Sin índices en albums               │
└─────────────────────────────────────────┘
```

### URLs Configuradas

**Backend Principal**:
```bash
BACKEND_URL=https://api-ia.bodasdehoy.com
PYTHON_BACKEND_URL=https://api-ia.bodasdehoy.com
USE_PYTHON_BACKEND=true
```

**GraphQL (Separado)**:
```bash
GRAPHQL_ENDPOINT=https://api2.eventosorganizador.com/graphql
API2_GRAPHQL_URL=https://api2.eventosorganizador.com/graphql
```

**Notas**:
- GraphQL está en **api2.eventosorganizador.com** (diferente servidor)
- Memories está en **api-ia.bodasdehoy.com** (Python Backend)
- El problema está específicamente en el Python Backend

---

## 📍 REQUERIMIENTOS POR ENDPOINT

### Listado Completo de Endpoints de Memories

Basado en análisis del código frontend ([apps/copilot/src/store/memories/action.ts](apps/copilot/src/store/memories/action.ts)):

#### 1. **GET /api/memories/albums** ⚠️ CRÍTICO

**Descripción**: Listar todos los albums de un usuario

**Request**:
```http
GET /api/memories/albums?user_id={userId}&development={development}
```

**Problema Actual**: ❌ 30.6 segundos de timeout

**Requerimientos**:
- ✅ Implementar **paginación obligatoria**
- ✅ Agregar **índice** en `(user_id, development)`
- ✅ Implementar **caché** de 5 minutos
- ✅ Límite por defecto: **20 albums**
- ✅ Incluir **metadata de paginación**

**Respuesta Esperada**:
```json
{
  "success": true,
  "albums": [
    {
      "_id": "album_123",
      "name": "Mi Boda",
      "description": "Album principal",
      "visibility": "private",
      "created_at": "2026-02-10T00:00:00Z",
      "user_id": "usuario@test.com",
      "development": "bodasdehoy",
      "photo_count": 45,
      "member_count": 3,
      "cover_image_url": "https://..."
    }
  ],
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

**Prioridad**: 🚨 **P0 - CRÍTICA**
**Estimado**: 4-6 horas

---

#### 2. **POST /api/memories/albums**

**Descripción**: Crear nuevo album

**Request**:
```http
POST /api/memories/albums?user_id={userId}&development={development}
Content-Type: application/json

{
  "name": "Mi Boda",
  "description": "Album principal",
  "visibility": "private",
  "event_id": "evt_123",
  "cover_image_url": "https://..."
}
```

**Requerimientos**:
- ✅ Validar campos obligatorios
- ✅ Respuesta en < 500ms
- ✅ Invalidar caché de listado
- ✅ Retornar album completo creado

**Prioridad**: 🔴 **P1 - ALTA**
**Estimado**: 1 hora

---

#### 3. **GET /api/memories/albums/{albumId}** ⚠️ CRÍTICO

**Descripción**: Obtener detalles de un album específico

**Request**:
```http
GET /api/memories/albums/{albumId}?user_id={userId}&development={development}
```

**Problema Actual**: ⚠️ Implementado timeout de 30s en frontend (línea 256)

**Requerimientos**:
- ✅ Agregar **índice** en `_id`
- ✅ Implementar **caché** de 5 minutos
- ✅ Validar permisos de acceso
- ✅ Respuesta en < 300ms

**Prioridad**: 🚨 **P0 - CRÍTICA**
**Estimado**: 2 horas

---

#### 4. **PUT /api/memories/albums/{albumId}**

**Descripción**: Actualizar datos de un album

**Request**:
```http
PUT /api/memories/albums/{albumId}?user_id={userId}&development={development}
Content-Type: application/json

{
  "name": "Nuevo Nombre",
  "description": "Nueva descripción",
  "visibility": "members"
}
```

**Requerimientos**:
- ✅ Validar permisos (solo owner)
- ✅ Invalidar caché del album
- ✅ Respuesta en < 500ms

**Prioridad**: 🟡 **P2 - MEDIA**
**Estimado**: 1 hora

---

#### 5. **DELETE /api/memories/albums/{albumId}**

**Descripción**: Eliminar un album

**Request**:
```http
DELETE /api/memories/albums/{albumId}?user_id={userId}&development={development}
```

**Requerimientos**:
- ✅ Validar permisos (solo owner)
- ✅ Soft delete (no eliminar físicamente)
- ✅ Invalidar caché
- ✅ Respuesta en < 500ms

**Prioridad**: 🟡 **P2 - MEDIA**
**Estimado**: 1 hora

---

#### 6. **GET /api/memories/albums/{albumId}/media** ⚠️ CRÍTICO

**Descripción**: Listar fotos de un album

**Request**:
```http
GET /api/memories/albums/{albumId}/media?user_id={userId}&development={development}
```

**Problema Actual**: ⚠️ Implementado timeout de 30s en frontend (línea 301)

**Requerimientos**:
- ✅ **Paginación obligatoria**
- ✅ Agregar **índice** en `(album_id, created_at)`
- ✅ Implementar **caché** de 5 minutos
- ✅ Límite por defecto: **50 fotos**
- ✅ Lazy loading compatible
- ✅ Respuesta en < 500ms

**Respuesta Esperada**:
```json
{
  "success": true,
  "media": [
    {
      "_id": "media_123",
      "album_id": "album_123",
      "url": "https://pub-bodasdehoy.r2.dev/...",
      "thumbnail_url": "https://...",
      "caption": "Foto hermosa",
      "uploaded_by": "usuario@test.com",
      "created_at": "2026-02-10T00:00:00Z",
      "mime_type": "image/jpeg",
      "size": 1024000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 245,
    "pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

**Prioridad**: 🚨 **P0 - CRÍTICA**
**Estimado**: 3-4 horas

---

#### 7. **POST /api/memories/albums/{albumId}/media**

**Descripción**: Agregar foto a un album

**Request**:
```http
POST /api/memories/albums/{albumId}/media?user_id={userId}&development={development}
Content-Type: application/json

{
  "url": "https://pub-bodasdehoy.r2.dev/...",
  "thumbnail_url": "https://...",
  "caption": "Foto hermosa",
  "mime_type": "image/jpeg",
  "size": 1024000
}
```

**Requerimientos**:
- ✅ Validar permisos (owner o members)
- ✅ Invalidar caché de media
- ✅ Incrementar `photo_count` del album
- ✅ Respuesta en < 500ms

**Prioridad**: 🔴 **P1 - ALTA**
**Estimado**: 1-2 horas

---

#### 8. **DELETE /api/memories/albums/{albumId}/media/{mediaId}**

**Descripción**: Eliminar foto de un album

**Request**:
```http
DELETE /api/memories/albums/{albumId}/media/{mediaId}?user_id={userId}&development={development}
```

**Requerimientos**:
- ✅ Validar permisos
- ✅ Soft delete
- ✅ Invalidar caché
- ✅ Decrementar `photo_count`
- ✅ Respuesta en < 500ms

**Prioridad**: 🟡 **P2 - MEDIA**
**Estimado**: 1 hora

---

#### 9. **GET /api/memories/albums/{albumId}/members** ⚠️ CRÍTICO

**Descripción**: Listar miembros de un album

**Request**:
```http
GET /api/memories/albums/{albumId}/members?development={development}
```

**Problema Actual**: ⚠️ Implementado timeout de 30s en frontend (línea 346)

**Requerimientos**:
- ✅ Agregar **índice** en `album_id`
- ✅ Implementar **caché** de 5 minutos
- ✅ Respuesta en < 300ms

**Prioridad**: 🚨 **P0 - CRÍTICA**
**Estimado**: 2 horas

---

#### 10. **POST /api/memories/albums/{albumId}/members/invite**

**Descripción**: Invitar miembro a un album

**Request**:
```http
POST /api/memories/albums/{albumId}/members/invite?user_id={userId}&development={development}
Content-Type: application/json

{
  "email": "invitado@test.com",
  "role": "member"
}
```

**Requerimientos**:
- ✅ Validar permisos (solo owner)
- ✅ Enviar email de invitación
- ✅ Generar token de invitación
- ✅ Invalidar caché de miembros
- ✅ Respuesta en < 1s

**Prioridad**: 🔴 **P1 - ALTA**
**Estimado**: 2-3 horas

---

#### 11. **DELETE /api/memories/albums/{albumId}/members/{targetUserId}**

**Descripción**: Remover miembro de un album

**Request**:
```http
DELETE /api/memories/albums/{albumId}/members/{targetUserId}?user_id={userId}&development={development}
```

**Requerimientos**:
- ✅ Validar permisos (solo owner)
- ✅ Invalidar caché
- ✅ Decrementar `member_count`
- ✅ Respuesta en < 500ms

**Prioridad**: 🟡 **P2 - MEDIA**
**Estimado**: 1 hora

---

#### 12. **PUT /api/memories/albums/{albumId}/members/{targetUserId}/role**

**Descripción**: Cambiar rol de un miembro

**Request**:
```http
PUT /api/memories/albums/{albumId}/members/{targetUserId}/role?user_id={userId}&development={development}
Content-Type: application/json

{
  "role": "admin"
}
```

**Requerimientos**:
- ✅ Validar permisos (solo owner)
- ✅ Validar roles válidos
- ✅ Invalidar caché
- ✅ Respuesta en < 500ms

**Prioridad**: 🟡 **P2 - MEDIA**
**Estimado**: 1 hora

---

#### 13. **POST /api/memories/albums/{albumId}/share**

**Descripción**: Generar link compartible

**Request**:
```http
POST /api/memories/albums/{albumId}/share?user_id={userId}&development={development}
Content-Type: application/json

{
  "expires_in_days": 30
}
```

**Requerimientos**:
- ✅ Generar token único
- ✅ Establecer expiración
- ✅ Respuesta en < 500ms

**Respuesta Esperada**:
```json
{
  "success": true,
  "share_token": "abc123def456",
  "share_url": "https://chat-test.bodasdehoy.com/memories/shared/abc123def456",
  "expires_at": "2026-03-12T00:00:00Z"
}
```

**Prioridad**: 🔴 **P1 - ALTA**
**Estimado**: 2 horas

---

#### 14. **GET /api/memories/share/{shareToken}**

**Descripción**: Acceder album compartido públicamente

**Request**:
```http
GET /api/memories/share/{shareToken}?development={development}
```

**Requerimientos**:
- ✅ Validar token no expirado
- ✅ No requiere autenticación
- ✅ Implementar caché
- ✅ Respuesta en < 500ms

**Prioridad**: 🔴 **P1 - ALTA**
**Estimado**: 2 horas

---

#### 15. **POST /api/memories/create-event-structure**

**Descripción**: Crear estructura de albums para un evento

**Request**:
```http
POST /api/memories/create-event-structure?user_id={userId}&development={development}
Content-Type: application/json

{
  "event_id": "evt_123",
  "event_name": "Boda Juan y María",
  "itinerary_items": [
    { "id": "item_1", "name": "Ceremonia", "time": "16:00" },
    { "id": "item_2", "name": "Recepción", "time": "19:00" }
  ]
}
```

**Requerimientos**:
- ✅ Crear album principal
- ✅ Crear sub-albums por cada item
- ✅ Operación en transacción
- ✅ Respuesta en < 2s

**Prioridad**: 🟡 **P2 - MEDIA**
**Estimado**: 3-4 horas

---

#### 16. **GET /api/memories/albums/by-event/{eventId}**

**Descripción**: Listar albums de un evento

**Request**:
```http
GET /api/memories/albums/by-event/{eventId}?development={development}
```

**Requerimientos**:
- ✅ Agregar índice en `event_id`
- ✅ Implementar caché
- ✅ Respuesta en < 500ms

**Prioridad**: 🟡 **P2 - MEDIA**
**Estimado**: 1-2 horas

---

#### 17. **GET /api/memories/albums/by-itinerary/{itineraryId}**

**Descripción**: Obtener album de un item de itinerario

**Request**:
```http
GET /api/memories/albums/by-itinerary/{itineraryId}?development={development}
```

**Requerimientos**:
- ✅ Agregar índice en `itinerary_id`
- ✅ Implementar caché
- ✅ Respuesta en < 300ms

**Prioridad**: 🟡 **P2 - MEDIA**
**Estimado**: 1 hora

---

#### 18. **POST /api/memories/albums/{albumId}/qr/send**

**Descripción**: Enviar QR a invitados

**Request**:
```http
POST /api/memories/albums/{albumId}/qr/send?user_id={userId}&development={development}
Content-Type: application/json

{
  "guest_ids": ["guest_1", "guest_2"],
  "method": "email"
}
```

**Requerimientos**:
- ✅ Validar permisos
- ✅ Generar QR code
- ✅ Enviar por email o WhatsApp
- ✅ Operación asíncrona
- ✅ Respuesta en < 1s

**Prioridad**: 🟡 **P2 - MEDIA**
**Estimado**: 3-4 horas

---

#### 19. **GET /api/memories/events/{eventId}/guests**

**Descripción**: Listar invitados de un evento

**Request**:
```http
GET /api/memories/events/{eventId}/guests?development={development}
```

**Requerimientos**:
- ✅ Integración con api2 (GraphQL)
- ✅ Implementar caché
- ✅ Respuesta en < 500ms

**Prioridad**: 🟡 **P2 - MEDIA**
**Estimado**: 2 horas

---

#### 20. **GET /api/memories/albums/{albumId}/sub-albums**

**Descripción**: Listar sub-albums de un album principal

**Request**:
```http
GET /api/memories/albums/{albumId}/sub-albums
```

**Requerimientos**:
- ✅ Agregar índice en `parent_album_id`
- ✅ Implementar caché
- ✅ Respuesta en < 300ms

**Prioridad**: 🟡 **P2 - MEDIA**
**Estimado**: 1 hora

---

#### 21. **POST /api/memories/albums/{albumId}/media/upload**

**Descripción**: Upload directo de imagen

**Request**:
```http
POST /api/memories/albums/{albumId}/media/upload?user_id={userId}&development={development}
Content-Type: multipart/form-data

file: [binary data]
caption: "Foto hermosa"
```

**Requerimientos**:
- ✅ Validar permisos
- ✅ Upload a Cloudflare R2
- ✅ Generar thumbnail
- ✅ Crear registro en DB
- ✅ Operación asíncrona
- ✅ Respuesta en < 2s

**Prioridad**: 🔴 **P1 - ALTA**
**Estimado**: 4-6 horas

---

## 🔧 ESPECIFICACIONES TÉCNICAS

### Base de Datos

#### Índices Requeridos (CRÍTICO)

**MongoDB**:
```javascript
// ⚠️ PRIORIDAD MÁXIMA - Implementar YA
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
-- ⚠️ PRIORIDAD MÁXIMA - Implementar YA
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

**Tiempo estimado**: 15-30 minutos
**Impacto esperado**: Reducción de 30s a 1-2s solo con índices

---

### Sistema de Caché

#### Implementación con Redis (RECOMENDADO)

```python
from redis import Redis
from functools import wraps
import json
import hashlib

# Configuración
redis_client = Redis(
    host='localhost',
    port=6379,
    db=0,
    decode_responses=True
)

# TTL por tipo de dato
CACHE_TTL = {
    'albums_list': 300,      # 5 minutos
    'album_detail': 300,     # 5 minutos
    'album_media': 300,      # 5 minutos
    'album_members': 300,    # 5 minutos
    'share_token': 1800,     # 30 minutos
}

def cache_key(*args, **kwargs):
    """Generar key de caché consistente"""
    key_data = json.dumps({'args': args, 'kwargs': kwargs}, sort_keys=True)
    return hashlib.md5(key_data.encode()).hexdigest()

def cached(ttl_key: str):
    """Decorator para cachear respuestas"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generar cache key
            key = f"memories:{ttl_key}:{cache_key(*args, **kwargs)}"

            # Intentar leer de caché
            cached_data = redis_client.get(key)
            if cached_data:
                print(f"✅ Cache HIT: {key}")
                return json.loads(cached_data)

            # Ejecutar función
            result = await func(*args, **kwargs)

            # Guardar en caché
            redis_client.setex(
                key,
                CACHE_TTL[ttl_key],
                json.dumps(result)
            )
            print(f"💾 Cache MISS: {key}")

            return result

        return wrapper
    return decorator

def invalidate_cache(pattern: str):
    """Invalidar caché por patrón"""
    keys = redis_client.keys(f"memories:{pattern}:*")
    if keys:
        redis_client.delete(*keys)
        print(f"🗑️  Invalidated {len(keys)} cache entries")
```

**Uso**:
```python
@cached('albums_list')
async def get_user_albums(user_id: str, development: str, page: int = 1):
    # ... query database
    return albums

# Invalidar al crear/actualizar/eliminar
def create_album(data):
    album = db.albums.insert_one(data)
    invalidate_cache(f"albums_list:*{user_id}*")
    return album
```

**Alternativa Sin Redis** (Caché en memoria):

```python
from cachetools import TTLCache
from datetime import timedelta

# Caché simple en memoria
albums_cache = TTLCache(maxsize=1000, ttl=300)  # 5 minutos

def get_user_albums_cached(user_id: str, development: str):
    cache_key = f"{user_id}-{development}"

    if cache_key in albums_cache:
        return albums_cache[cache_key]

    # Query database
    albums = db.albums.find({'user_id': user_id, 'development': development})
    albums_cache[cache_key] = albums

    return albums
```

**Tiempo estimado**: 2-4 horas
**Impacto esperado**: Reducción de 1-2s a 50-100ms en requests repetidos

---

### Paginación

#### Especificación

**Parámetros de Query**:
```
?page=1           # Página actual (default: 1)
&limit=20         # Items por página (default: 20, max: 100)
&sort=-created_at # Ordenamiento (default: -created_at)
```

**Implementación**:

```python
from typing import Optional, List, TypedDict

class PaginationMeta(TypedDict):
    page: int
    limit: int
    total: int
    pages: int
    has_next: bool
    has_prev: bool

async def get_albums_paginated(
    user_id: str,
    development: str,
    page: int = 1,
    limit: int = 20,
    sort: str = "-created_at"
) -> dict:
    # Validar límites
    page = max(1, page)
    limit = min(100, max(1, limit))

    # Parsear sort
    sort_field = sort.lstrip('-')
    sort_direction = -1 if sort.startswith('-') else 1

    # Calcular offset
    skip = (page - 1) * limit

    # Query con paginación
    query = {
        'user_id': user_id,
        'development': development,
        'deleted_at': None  # Excluir eliminados
    }

    # Contar total (usar countDocuments con índice)
    total = await db.albums.count_documents(query)

    # Obtener albums
    albums = await db.albums.find(query) \
        .sort(sort_field, sort_direction) \
        .skip(skip) \
        .limit(limit) \
        .to_list()

    # Calcular metadata
    pages = (total + limit - 1) // limit  # ceiling division

    return {
        'success': True,
        'albums': albums,
        'pagination': {
            'page': page,
            'limit': limit,
            'total': total,
            'pages': pages,
            'has_next': page < pages,
            'has_prev': page > 1
        }
    }
```

**Tiempo estimado**: 1-2 horas
**Impacto esperado**: Reducción proporcional al número de albums

---

### Optimización de Queries

#### Problema N+1

**❌ ANTES (N+1 Problem)**:
```python
# Query 1: Obtener albums
albums = await db.albums.find({'user_id': user_id}).to_list()

# N queries adicionales
for album in albums:
    # Query 2...N+1: Contar fotos de cada album
    photo_count = await db.album_media.count_documents({'album_id': album['_id']})
    album['photo_count'] = photo_count

    # Otra query por album
    member_count = await db.album_members.count_documents({'album_id': album['_id']})
    album['member_count'] = member_count
```
**Resultado**: 1 + (N × 2) queries → Para 100 albums = 201 queries ❌

**✅ DESPUÉS (Optimizado)**:
```python
# Query 1: Obtener albums
albums = await db.albums.find({'user_id': user_id}).to_list()
album_ids = [album['_id'] for album in albums]

# Query 2: Contar fotos de todos los albums
photo_counts = await db.album_media.aggregate([
    {'$match': {'album_id': {'$in': album_ids}}},
    {'$group': {'_id': '$album_id', 'count': {'$sum': 1}}}
]).to_list()

# Query 3: Contar miembros de todos los albums
member_counts = await db.album_members.aggregate([
    {'$match': {'album_id': {'$in': album_ids}}},
    {'$group': {'_id': '$album_id', 'count': {'$sum': 1}}}
]).to_list()

# Mapear contadores
photo_map = {item['_id']: item['count'] for item in photo_counts}
member_map = {item['_id']: item['count'] for item in member_counts}

# Asignar a albums
for album in albums:
    album['photo_count'] = photo_map.get(album['_id'], 0)
    album['member_count'] = member_map.get(album['_id'], 0)
```
**Resultado**: 3 queries fijas → Independiente del número de albums ✅

**Alternativa: Pre-computar en DB**:
```python
# Agregar campos al documento
{
  "_id": "album_123",
  "name": "Mi Boda",
  "photo_count": 45,     # ✅ Pre-computado
  "member_count": 3,     # ✅ Pre-computado
  # ...
}

# Actualizar al agregar/eliminar
async def add_media(album_id, media_data):
    # Insertar media
    await db.album_media.insert_one(media_data)

    # Incrementar contador (operación atómica)
    await db.albums.update_one(
        {'_id': album_id},
        {'$inc': {'photo_count': 1}}
    )
```

**Tiempo estimado**: 2-3 horas
**Impacto esperado**: Reducción de queries de O(N) a O(1)

---

### Headers de Respuesta

#### Caché Headers

Agregar headers para optimizar caché del navegador:

```python
from fastapi import Response

@app.get("/api/memories/albums")
async def get_albums(response: Response):
    # ... query

    # Headers de caché
    response.headers["Cache-Control"] = "private, max-age=300"  # 5 min
    response.headers["ETag"] = generate_etag(albums)
    response.headers["Last-Modified"] = albums[0]['updated_at']

    return albums
```

#### Compresión

Habilitar compresión gzip/brotli:

```python
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

#### CORS

Asegurar headers CORS correctos:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3210",
        "http://localhost:8080",
        "https://chat-test.bodasdehoy.com",
        "https://bodasdehoy.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600
)
```

---

## 💻 EJEMPLOS DE IMPLEMENTACIÓN

### Ejemplo Completo: GET /api/memories/albums

```python
from fastapi import APIRouter, Query, HTTPException, Response
from typing import Optional
import logging

router = APIRouter(prefix="/api/memories")
logger = logging.getLogger(__name__)

@router.get("/albums")
@cached('albums_list')  # ✅ Caché de 5 minutos
async def get_albums(
    user_id: str = Query(..., description="ID del usuario"),
    development: str = Query(..., description="Desarrollo"),
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(20, ge=1, le=100, description="Items por página"),
    sort: str = Query("-created_at", description="Campo de ordenamiento"),
    response: Response = None
):
    """
    Obtener albums del usuario con paginación.

    **Performance Target**: < 500ms
    **Cache**: 5 minutos
    """
    try:
        # ✅ Validar parámetros
        page = max(1, page)
        limit = min(100, limit)

        # ✅ Calcular offset
        skip = (page - 1) * limit

        # ✅ Parsear sort
        sort_field = sort.lstrip('-')
        sort_direction = -1 if sort.startswith('-') else 1

        # ✅ Query optimizado con índices
        query = {
            'user_id': user_id,
            'development': development,
            'deleted_at': None  # Soft delete
        }

        # ✅ Contar total (usa índice)
        total = await db.albums.count_documents(query)

        if total == 0:
            return {
                'success': True,
                'albums': [],
                'pagination': {
                    'page': 1,
                    'limit': limit,
                    'total': 0,
                    'pages': 0,
                    'has_next': False,
                    'has_prev': False
                }
            }

        # ✅ Obtener albums (usa índice + sort + limit)
        albums = await db.albums.find(query) \
            .sort(sort_field, sort_direction) \
            .skip(skip) \
            .limit(limit) \
            .to_list()

        # ✅ Obtener album IDs
        album_ids = [album['_id'] for album in albums]

        # ✅ Optimización: Obtener contadores en paralelo (evitar N+1)
        photo_counts_task = db.album_media.aggregate([
            {'$match': {'album_id': {'$in': album_ids}}},
            {'$group': {'_id': '$album_id', 'count': {'$sum': 1}}}
        ]).to_list()

        member_counts_task = db.album_members.aggregate([
            {'$match': {'album_id': {'$in': album_ids}}},
            {'$group': {'_id': '$album_id', 'count': {'$sum': 1}}}
        ]).to_list()

        # Ejecutar en paralelo
        import asyncio
        photo_counts, member_counts = await asyncio.gather(
            photo_counts_task,
            member_counts_task
        )

        # ✅ Mapear contadores
        photo_map = {item['_id']: item['count'] for item in photo_counts}
        member_map = {item['_id']: item['count'] for item in member_counts}

        # ✅ Asignar contadores a albums
        for album in albums:
            album['photo_count'] = photo_map.get(album['_id'], 0)
            album['member_count'] = member_map.get(album['_id'], 0)

            # Limpiar campos internos
            if '_id' in album:
                album['_id'] = str(album['_id'])

        # ✅ Calcular metadata de paginación
        pages = (total + limit - 1) // limit

        # ✅ Headers de caché
        if response:
            response.headers["Cache-Control"] = "private, max-age=300"
            response.headers["X-Total-Count"] = str(total)

        # ✅ Respuesta
        result = {
            'success': True,
            'albums': albums,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': pages,
                'has_next': page < pages,
                'has_prev': page > 1
            }
        }

        logger.info(f"✅ Albums retrieved: {len(albums)}/{total} (page {page}/{pages})")

        return result

    except Exception as e:
        logger.error(f"❌ Error getting albums: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error al obtener albums: {str(e)}")

```

**Tiempo estimado**: 2-3 horas
**Impacto esperado**: 30s → 200-500ms

---

### Ejemplo: POST /api/memories/albums

```python
from pydantic import BaseModel, Field
from datetime import datetime

class AlbumCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    visibility: str = Field("private", regex="^(private|members|public)$")
    event_id: Optional[str] = None
    itinerary_id: Optional[str] = None
    cover_image_url: Optional[str] = None

@router.post("/albums")
async def create_album(
    data: AlbumCreate,
    user_id: str = Query(...),
    development: str = Query(...)
):
    """
    Crear nuevo album.

    **Performance Target**: < 500ms
    """
    try:
        # ✅ Preparar documento
        now = datetime.utcnow()
        album_doc = {
            'name': data.name,
            'description': data.description,
            'visibility': data.visibility,
            'user_id': user_id,
            'development': development,
            'event_id': data.event_id,
            'itinerary_id': data.itinerary_id,
            'cover_image_url': data.cover_image_url,
            'photo_count': 0,
            'member_count': 1,  # El creador
            'created_at': now,
            'updated_at': now,
            'deleted_at': None
        }

        # ✅ Insertar en DB
        result = await db.albums.insert_one(album_doc)
        album_doc['_id'] = str(result.inserted_id)

        # ✅ Crear registro de miembro (creador como owner)
        await db.album_members.insert_one({
            'album_id': result.inserted_id,
            'user_id': user_id,
            'role': 'owner',
            'created_at': now
        })

        # ✅ Invalidar caché
        invalidate_cache(f"albums_list:*{user_id}*")

        logger.info(f"✅ Album created: {album_doc['_id']} by {user_id}")

        return {
            'success': True,
            'album': album_doc
        }

    except Exception as e:
        logger.error(f"❌ Error creating album: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
```

---

## ✅ CRITERIOS DE ACEPTACIÓN

### Endpoint: GET /api/memories/albums

#### Performance

- [ ] Tiempo de respuesta **< 500ms** (P95)
- [ ] Tiempo de respuesta **< 200ms** (P50)
- [ ] Maneja **10 requests/segundo** sin degradación
- [ ] Caché funciona correctamente (hit rate > 70%)

#### Funcionalidad

- [ ] Paginación funcional (page, limit, sort)
- [ ] Respeta límite máximo de 100 items
- [ ] Retorna metadata de paginación correcta
- [ ] Filtra correctamente por user_id + development
- [ ] Excluye albums eliminados (soft delete)
- [ ] Contadores (photo_count, member_count) correctos

#### Caché

- [ ] Respuesta cacheada por 5 minutos
- [ ] Cache invalidado al crear/actualizar/eliminar album
- [ ] Headers Cache-Control presentes
- [ ] Hit/Miss logging implementado

#### Seguridad

- [ ] Valida autenticación del usuario
- [ ] Solo retorna albums del usuario autenticado
- [ ] No expone datos sensibles
- [ ] SQL/NoSQL injection protegido

#### Monitoring

- [ ] Logs de errores implementados
- [ ] Métricas de performance registradas
- [ ] Alertas configuradas para tiempos > 1s
- [ ] Dashboard de monitoring actualizado

---

### Todos los Endpoints

#### Performance General

- [ ] **P0 (Críticos)**: < 500ms (P95)
- [ ] **P1 (Altos)**: < 1s (P95)
- [ ] **P2 (Medios)**: < 2s (P95)
- [ ] Sin timeouts en producción
- [ ] Maneja 50 requests/segundo concurrentes

#### Base de Datos

- [ ] Todos los índices creados y funcionales
- [ ] Queries optimizados (sin N+1)
- [ ] Connection pooling configurado
- [ ] Timeouts de query configurados (< 5s)

#### Caché

- [ ] Redis instalado y configurado
- [ ] Caché implementado en endpoints críticos
- [ ] TTL correctamente configurados
- [ ] Invalidación funcional

#### Testing

- [ ] Tests unitarios > 80% coverage
- [ ] Tests de integración para endpoints críticos
- [ ] Load testing realizado (100 concurrent users)
- [ ] Stress testing realizado

#### Documentación

- [ ] OpenAPI/Swagger actualizado
- [ ] README con setup instructions
- [ ] Changelog actualizado
- [ ] Runbook de troubleshooting

---

## 📅 PLAN DE IMPLEMENTACIÓN

### Fase 1: CRÍTICA (Día 1-2) - 8-12 horas

**Objetivo**: Resolver el timeout de 30s

#### Sprint 1.1: Índices y Optimización Base (4 horas)

- [ ] **Hora 1**: Crear índices en base de datos
  ```bash
  # MongoDB
  mongo api-ia-db
  > use memories_db
  > db.albums.createIndex({ "user_id": 1, "development": 1 })
  > db.albums.createIndex({ "created_at": -1 })
  > db.album_media.createIndex({ "album_id": 1, "created_at": -1 })
  > db.album_members.createIndex({ "album_id": 1 })
  ```

- [ ] **Hora 2-3**: Implementar paginación en GET /api/memories/albums
  - Agregar parámetros page/limit
  - Implementar query con skip/limit
  - Agregar metadata de paginación
  - Testing básico

- [ ] **Hora 4**: Deploy y testing en staging
  - Medir nuevos tiempos de respuesta
  - Validar funcionalidad
  - Ajustar según resultados

**Entregable**: GET /api/memories/albums respondiendo en < 2s

---

#### Sprint 1.2: Caché (4 horas)

- [ ] **Hora 1**: Setup de Redis
  ```bash
  # Instalar Redis
  apt-get install redis-server
  systemctl enable redis-server
  systemctl start redis-server

  # Configurar
  redis-cli config set maxmemory 256mb
  redis-cli config set maxmemory-policy allkeys-lru
  ```

- [ ] **Hora 2-3**: Implementar caché en endpoints críticos
  - Decorador @cached
  - Función invalidate_cache
  - Implementar en GET /albums
  - Implementar en GET /albums/{id}
  - Implementar en GET /albums/{id}/media

- [ ] **Hora 4**: Testing y ajustes
  - Validar hit rate
  - Ajustar TTL si necesario
  - Testing de invalidación

**Entregable**: Caché funcional con hit rate > 50%

---

#### Sprint 1.3: Optimización de Queries (4 horas)

- [ ] **Hora 1-2**: Resolver N+1 queries en GET /albums
  - Implementar aggregation para contadores
  - Queries en paralelo con asyncio.gather
  - Testing

- [ ] **Hora 3**: Optimizar GET /albums/{id}/media
  - Implementar paginación
  - Agregar índices
  - Testing

- [ ] **Hora 4**: Deploy y validación final
  - Medir performance
  - Load testing básico
  - Ajustar según necesidad

**Entregable**: GET /api/memories/albums < 500ms (P95)

---

### Fase 2: ALTA (Día 3-4) - 8-12 horas

**Objetivo**: Completar endpoints prioritarios

#### Sprint 2.1: Endpoints de Creación/Modificación (6 horas)

- [ ] POST /api/memories/albums
- [ ] PUT /api/memories/albums/{id}
- [ ] DELETE /api/memories/albums/{id}
- [ ] POST /api/memories/albums/{id}/media
- [ ] POST /api/memories/albums/{id}/share
- [ ] GET /api/memories/share/{token}

#### Sprint 2.2: Endpoints de Miembros (3 horas)

- [ ] POST /api/memories/albums/{id}/members/invite
- [ ] DELETE /api/memories/albums/{id}/members/{userId}

#### Sprint 2.3: Testing y Documentación (3 horas)

- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Actualizar Swagger/OpenAPI
- [ ] Actualizar README

---

### Fase 3: MEDIA (Día 5-7) - 12-16 horas

**Objetivo**: Completar funcionalidades secundarias

#### Sprint 3.1: Upload de Imágenes (6 horas)

- [ ] POST /api/memories/albums/{id}/media/upload
- [ ] Integración con Cloudflare R2
- [ ] Generación de thumbnails
- [ ] Validación de archivos

#### Sprint 3.2: Estructura de Eventos (6 horas)

- [ ] POST /api/memories/create-event-structure
- [ ] GET /api/memories/albums/by-event/{id}
- [ ] GET /api/memories/albums/by-itinerary/{id}
- [ ] GET /api/memories/albums/{id}/sub-albums

#### Sprint 3.3: QR y Notificaciones (4 horas)

- [ ] POST /api/memories/albums/{id}/qr/send
- [ ] Generación de QR codes
- [ ] Envío por email
- [ ] Integración con WhatsApp (opcional)

---

### Fase 4: POLISH (Día 8-10) - 8-12 horas

**Objetivo**: Pulir, optimizar y preparar para producción

#### Sprint 4.1: Optimización Final (4 horas)

- [ ] Optimizar queries lentos restantes
- [ ] Ajustar configuración de caché
- [ ] Configurar connection pooling
- [ ] Implementar rate limiting

#### Sprint 4.2: Monitoring y Alertas (4 horas)

- [ ] Configurar APM (New Relic/Datadog)
- [ ] Crear dashboard de metrics
- [ ] Configurar alertas
- [ ] Implementar health checks

#### Sprint 4.3: Load Testing (4 horas)

- [ ] Scripts de load testing
- [ ] Ejecutar tests con 100 concurrent users
- [ ] Identificar bottlenecks
- [ ] Aplicar fixes necesarios

---

## 🧪 TESTING REQUERIDO

### Tests Unitarios

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_get_albums_success(client: AsyncClient):
    """Test obtener albums con éxito"""
    response = await client.get(
        "/api/memories/albums",
        params={
            "user_id": "test@test.com",
            "development": "bodasdehoy",
            "page": 1,
            "limit": 20
        }
    )

    assert response.status_code == 200
    data = response.json()

    assert data["success"] == True
    assert "albums" in data
    assert "pagination" in data
    assert data["pagination"]["page"] == 1
    assert data["pagination"]["limit"] == 20

@pytest.mark.asyncio
async def test_get_albums_pagination(client: AsyncClient):
    """Test paginación funciona correctamente"""
    # Crear 50 albums de prueba
    for i in range(50):
        await create_test_album(f"Album {i}")

    # Obtener página 1
    response = await client.get(
        "/api/memories/albums",
        params={"user_id": "test@test.com", "development": "bodasdehoy", "page": 1, "limit": 20}
    )

    data = response.json()
    assert len(data["albums"]) == 20
    assert data["pagination"]["total"] == 50
    assert data["pagination"]["pages"] == 3
    assert data["pagination"]["has_next"] == True
    assert data["pagination"]["has_prev"] == False

@pytest.mark.asyncio
async def test_get_albums_performance(client: AsyncClient):
    """Test tiempo de respuesta < 500ms"""
    import time

    start = time.time()
    response = await client.get(
        "/api/memories/albums",
        params={"user_id": "test@test.com", "development": "bodasdehoy"}
    )
    elapsed = time.time() - start

    assert response.status_code == 200
    assert elapsed < 0.5  # < 500ms
```

---

### Tests de Integración

```python
@pytest.mark.asyncio
async def test_create_and_retrieve_album(client: AsyncClient):
    """Test crear album y recuperarlo"""
    # Crear album
    create_response = await client.post(
        "/api/memories/albums",
        params={"user_id": "test@test.com", "development": "bodasdehoy"},
        json={
            "name": "Test Album",
            "description": "Test description",
            "visibility": "private"
        }
    )

    assert create_response.status_code == 200
    album_id = create_response.json()["album"]["_id"]

    # Recuperar album
    get_response = await client.get(
        f"/api/memories/albums/{album_id}",
        params={"user_id": "test@test.com", "development": "bodasdehoy"}
    )

    assert get_response.status_code == 200
    album = get_response.json()["album"]
    assert album["name"] == "Test Album"
    assert album["visibility"] == "private"
```

---

### Load Testing (Locust)

```python
from locust import HttpUser, task, between

class MemoriesAPIUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        """Setup"""
        self.user_id = "test@test.com"
        self.development = "bodasdehoy"

    @task(10)
    def get_albums(self):
        """Test GET /albums (más frecuente)"""
        self.client.get(
            "/api/memories/albums",
            params={
                "user_id": self.user_id,
                "development": self.development,
                "page": 1,
                "limit": 20
            }
        )

    @task(5)
    def get_album_detail(self):
        """Test GET /albums/{id}"""
        # Obtener albums primero
        response = self.client.get(
            "/api/memories/albums",
            params={"user_id": self.user_id, "development": self.development}
        )

        if response.status_code == 200:
            albums = response.json()["albums"]
            if albums:
                album_id = albums[0]["_id"]
                self.client.get(
                    f"/api/memories/albums/{album_id}",
                    params={"user_id": self.user_id, "development": self.development}
                )

    @task(3)
    def get_album_media(self):
        """Test GET /albums/{id}/media"""
        # Similar a get_album_detail
        pass

    @task(1)
    def create_album(self):
        """Test POST /albums (menos frecuente)"""
        self.client.post(
            "/api/memories/albums",
            params={"user_id": self.user_id, "development": self.development},
            json={
                "name": f"Test Album {self.environment.runner.stats.num_requests}",
                "description": "Load test album",
                "visibility": "private"
            }
        )
```

**Ejecutar**:
```bash
# Instalar
pip install locust

# Ejecutar con 100 usuarios
locust -f load_test.py --host=https://api-ia.bodasdehoy.com --users=100 --spawn-rate=10 --run-time=5m

# Abrir UI
open http://localhost:8089
```

**Criterios de Aceptación**:
- [ ] 100 usuarios concurrentes sin errores
- [ ] P95 < 500ms para endpoints críticos
- [ ] Error rate < 0.1%
- [ ] Throughput > 50 requests/segundo

---

## 📎 ANEXOS

### Anexo A: Configuración de Servidor

#### requirements.txt

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
motor==3.3.2  # MongoDB async driver
redis==5.0.1
pydantic==2.6.0
python-multipart==0.0.6
cachetools==5.3.2
```

#### Configuración de Uvicorn

```python
# main.py
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        workers=4,  # Número de workers
        loop="uvloop",  # Loop más rápido
        log_level="info",
        access_log=True,
        reload=False  # En producción
    )
```

---

### Anexo B: Scripts de Migración

#### create_indexes.py

```python
"""
Script para crear índices en MongoDB
Ejecutar: python create_indexes.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def create_indexes():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.memories_db

    print("🔨 Creando índices...")

    # Albums
    await db.albums.create_index([("user_id", 1), ("development", 1)])
    print("✅ Índice creado: albums (user_id, development)")

    await db.albums.create_index([("created_at", -1)])
    print("✅ Índice creado: albums (created_at)")

    await db.albums.create_index([("event_id", 1)])
    print("✅ Índice creado: albums (event_id)")

    # Album Media
    await db.album_media.create_index([("album_id", 1), ("created_at", -1)])
    print("✅ Índice creado: album_media (album_id, created_at)")

    # Album Members
    await db.album_members.create_index([("album_id", 1)])
    print("✅ Índice creado: album_members (album_id)")

    print("\n✨ Todos los índices creados exitosamente")

    client.close()

if __name__ == "__main__":
    asyncio.run(create_indexes())
```

---

### Anexo C: Checklist de Deployment

#### Pre-Deployment

- [ ] Todos los tests pasan
- [ ] Load testing completado
- [ ] Documentación actualizada
- [ ] Variables de entorno configuradas
- [ ] Backups de base de datos creados
- [ ] Rollback plan definido

#### Deployment

- [ ] Crear índices en base de datos (producción)
- [ ] Instalar Redis (si no está)
- [ ] Desplegar código nuevo
- [ ] Verificar health checks
- [ ] Smoke testing manual
- [ ] Validar logs

#### Post-Deployment

- [ ] Monitorear métricas por 24 horas
- [ ] Revisar logs de errores
- [ ] Validar caché funciona
- [ ] Validar performance mejorado
- [ ] Actualizar status page
- [ ] Comunicar a frontend team

---

### Anexo D: Contactos

| Rol | Nombre | Email | Responsabilidad |
|-----|--------|-------|-----------------|
| **Backend Lead** | TBD | backend@bodasdehoy.com | Implementación y review |
| **DevOps** | TBD | devops@bodasdehoy.com | Deployment y monitoring |
| **Frontend Lead** | TBD | frontend@bodasdehoy.com | Testing e integración |
| **QA** | TBD | qa@bodasdehoy.com | Testing y validación |

---

### Anexo E: Recursos

**Documentación**:
- [FastAPI Performance](https://fastapi.tiangolo.com/deployment/concepts/)
- [MongoDB Indexing](https://docs.mongodb.com/manual/indexes/)
- [Redis Caching](https://redis.io/docs/manual/patterns/)

**Tools**:
- MongoDB Compass: Visualizar índices
- Redis Insight: Monitorear caché
- Postman: Testing manual de API
- Locust: Load testing

---

## 🏁 CONCLUSIÓN

Este documento especifica **todos los requerimientos técnicos** necesarios para resolver el problema crítico de performance en la API de Memories.

### Resumen de Prioridades

**🚨 CRÍTICO (Día 1-2)**:
1. Crear índices en base de datos
2. Implementar paginación
3. Implementar caché con Redis
4. Optimizar queries (N+1)

**Target**: 30s → < 500ms

**🔴 ALTO (Día 3-4)**:
- Completar endpoints de creación/modificación
- Implementar sharing y miembros

**🟡 MEDIO (Día 5-7)**:
- Upload de imágenes
- Estructura de eventos
- QR codes

### Estimado Total

- **Desarrollo**: 32-48 horas (4-6 días)
- **Testing**: 8-12 horas (1-2 días)
- **Deployment**: 4 horas
- **Total**: **44-64 horas** (6-8 días laborables)

### Equipo Recomendado

- 1 Backend Developer (Senior)
- 1 Backend Developer (Mid)
- 1 DevOps Engineer (part-time)
- 1 QA Engineer (part-time)

---

**Documento preparado por**: Equipo Frontend (PLANNER AI)
**Fecha**: 2026-02-10
**Versión**: 1.0
**Estado**: ✅ LISTO PARA IMPLEMENTACIÓN

---

## 📧 Siguiente Paso

**Por favor, confirmar**:
1. ✅ Requerimientos entendidos
2. ✅ Estimados aceptables
3. ✅ Asignación de recursos
4. ✅ Fecha de inicio

**Contacto**: frontend@bodasdehoy.com

---

**FIN DEL DOCUMENTO**
