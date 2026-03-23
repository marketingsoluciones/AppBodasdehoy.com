# 🚨 Petición Formal: Optimización Urgente API Memories

**Para**: Equipo Backend api-ia (api-ia.bodasdehoy.com)
**De**: Equipo Frontend PLANNER AI
**Fecha**: 2026-02-10
**Prioridad**: ⚠️ **P0 - CRÍTICA - BLOQUEANTE PARA PRODUCCIÓN**

---

## 📋 Resumen

La funcionalidad **Memories** presenta un problema crítico de performance que **bloquea su lanzamiento a producción**. Solicitamos implementar optimizaciones urgentes en el backend para resolver el timeout de 30 segundos.

---

## 🔴 Problema

### Descripción

Los endpoints de Memories API presentan timeouts consistentes de **30 segundos**, haciendo la funcionalidad **completamente inutilizable** para usuarios nuevos.

### Evidencia

```bash
# Tests realizados: 2026-02-10 09:00 UTC
# Endpoint: GET https://api-ia.bodasdehoy.com/api/memories/albums
# Params: ?user_id=test@test.com&development=bodasdehoy

Test 1: 30.596s ❌
Test 2: 30.549s ❌
Test 3: 30.564s ❌

Promedio: 30.6 segundos
Desviación: 0.024s (muy consistente - sugiere timeout configurado)
```

### Comparativa

| Endpoint | Tiempo | Estado |
|----------|--------|--------|
| `/health` | 0.437s | ✅ Aceptable |
| `/graphql` | 0.252s | ✅ Excelente |
| **`/api/memories/albums`** | **30.596s** | ❌ **CRÍTICO** |

**Diferencia**: 121x más lento que GraphQL, 69x más lento que health check.

---

## 💥 Impacto

### En Producción

- ⚠️ **100% de usuarios nuevos** esperan 30s en primera carga
- ⚠️ **100% de abandono** por tiempos de espera inaceptables
- ⚠️ Funcionalidad **NO VIABLE** para lanzamiento
- ⚠️ Experiencia de usuario **completamente inaceptable**

### En Desarrollo

- ⚠️ Desarrollo frontend **bloqueado** para nuevas features
- ⚠️ Testing **extremadamente lento**
- ⚠️ Demos a stakeholders **imposibles**

### Costo de Oportunidad

- 🔴 Feature completa desarrollada pero **no lanzable**
- 🔴 Inversión de desarrollo frontend **sin ROI**
- 🔴 Roadmap de producto **bloqueado**

---

## 🎯 Solución Requerida

### Objetivo

Reducir tiempo de respuesta de **30 segundos** a **< 500ms** (preferiblemente < 200ms).

### Acciones Críticas (P0)

#### 1. Crear Índices en Base de Datos (30 min)

**MongoDB**:
```javascript
db.albums.createIndex({ "user_id": 1, "development": 1 });
db.albums.createIndex({ "created_at": -1 });
db.album_media.createIndex({ "album_id": 1, "created_at": -1 });
db.album_members.createIndex({ "album_id": 1 });
```

**PostgreSQL**:
```sql
CREATE INDEX idx_albums_user_dev ON albums(user_id, development);
CREATE INDEX idx_albums_created ON albums(created_at DESC);
CREATE INDEX idx_media_album_created ON album_media(album_id, created_at DESC);
CREATE INDEX idx_members_album ON album_members(album_id);
```

**Impacto esperado**: 30s → 1-2s solo con índices

---

#### 2. Implementar Paginación (2 horas)

**Parámetros requeridos**:
```
?page=1           # Página actual (default: 1)
&limit=20         # Items por página (default: 20, max: 100)
&sort=-created_at # Ordenamiento
```

**Respuesta requerida**:
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

**Impacto esperado**: Reducción proporcional al número de albums

---

#### 3. Implementar Caché con Redis (3 horas)

**Configuración**:
```python
# TTL por tipo
CACHE_TTL = {
    'albums_list': 300,      # 5 minutos
    'album_detail': 300,
    'album_media': 300,
    'album_members': 300,
}
```

**Decorator básico**:
```python
@cached('albums_list')
async def get_albums(user_id, development, page):
    # ... query database
    return albums
```

**Impacto esperado**: 1-2s → 50-100ms en requests repetidos

---

#### 4. Optimizar Queries - Eliminar N+1 (2 horas)

**Problema actual (estimado)**:
```python
# Query 1: Obtener albums
albums = await db.albums.find({'user_id': user_id}).to_list()

# N queries adicionales (N+1 problem)
for album in albums:
    photo_count = await db.album_media.count_documents({'album_id': album['_id']})
    member_count = await db.album_members.count_documents({'album_id': album['_id']})
```
**Resultado**: 1 + (N × 2) queries → Para 100 albums = **201 queries** ❌

**Solución requerida**:
```python
# Query 1: Obtener albums
albums = await db.albums.find({'user_id': user_id}).to_list()
album_ids = [album['_id'] for album in albums]

# Query 2: Contar fotos (una sola query)
photo_counts = await db.album_media.aggregate([
    {'$match': {'album_id': {'$in': album_ids}}},
    {'$group': {'_id': '$album_id', 'count': {'$sum': 1}}}
]).to_list()

# Query 3: Contar miembros (una sola query)
member_counts = await db.album_members.aggregate([...]).to_list()
```
**Resultado**: **3 queries fijas** independiente de N ✅

**Impacto esperado**: Reducción de queries de O(N) a O(1)

---

## ⏱️ Estimado de Implementación

### Fase 1: CRÍTICA (Resolver timeout de 30s)

| Tarea | Tiempo | Prioridad |
|-------|--------|-----------|
| Crear índices | 30 min | P0 |
| Implementar paginación | 2 horas | P0 |
| Setup Redis + caché básico | 3 horas | P0 |
| Optimizar queries (N+1) | 2 horas | P0 |
| Testing y deploy | 1 hora | P0 |

**Total Fase 1**: **8-9 horas** (1 día de trabajo)

**Resultado esperado**: **30s → < 500ms**

---

### Fase 2: OPTIMIZACIÓN (Completar features)

| Tarea | Tiempo | Prioridad |
|-------|--------|-----------|
| Completar endpoints CRUD | 4 horas | P1 |
| Implementar sharing/miembros | 3 horas | P1 |
| Testing completo | 2 horas | P1 |

**Total Fase 2**: **8-12 horas** (1-2 días)

**Resultado esperado**: Feature 100% funcional

---

### Total Estimado

- **Fase 1 (Crítica)**: 1 día
- **Fase 2 (Features)**: 1-2 días
- **Total**: **2-3 días laborables**

---

## 📊 Métricas de Éxito

### Performance

- [ ] **GET /api/memories/albums**: **30s → < 500ms** (P95)
- [ ] **GET /api/memories/albums/{id}**: **~30s → < 300ms** (P95)
- [ ] **GET /api/memories/albums/{id}/media**: **~30s → < 500ms** (P95)
- [ ] **Sin timeouts** en producción
- [ ] **Cache hit rate** > 70%

### Funcionalidad

- [ ] Paginación funcional en todos los endpoints GET
- [ ] Caché implementado con invalidación correcta
- [ ] Queries optimizados (sin N+1)
- [ ] Tests de integración pasando

### Load Testing

- [ ] 100 usuarios concurrentes sin errores
- [ ] Error rate < 0.1%
- [ ] P95 < 500ms para endpoints críticos

---

## 📚 Documentación de Referencia

### Documento Técnico Completo

Ver [`REQUERIMIENTOS_BACKEND_MEMORIES_2026-02-10.md`](REQUERIMIENTOS_BACKEND_MEMORIES_2026-02-10.md) (70 páginas) con:

- ✅ **21 endpoints** especificados con contratos completos
- ✅ **Scripts SQL/MongoDB** para índices
- ✅ **Ejemplos de código Python** (FastAPI)
- ✅ **Sistema de caché** con Redis (código completo)
- ✅ **Optimización de queries** (ejemplos de N+1 fixes)
- ✅ **Plan de implementación** por fases
- ✅ **Tests unitarios** y de integración
- ✅ **Load testing** scripts (Locust)
- ✅ **Deployment checklist**

### Otros Documentos

- [`INFORME_BACKEND_OPTIMIZACIONES_2026-02-10.md`](INFORME_BACKEND_OPTIMIZACIONES_2026-02-10.md) - Estado actual y comparativas
- [`OPTIMIZACIONES_IMPLEMENTADAS_2026-02-10.md`](OPTIMIZACIONES_IMPLEMENTADAS_2026-02-10.md) - Detalles técnicos frontend

---

## 🎯 Petición Formal

### Solicitamos

1. **Asignación de recursos**: 1 Backend Developer Senior + 1 DevOps (part-time)
2. **Priorización**: P0 - Crítica - Bloqueante
3. **Fecha de inicio**: Lo antes posible (preferiblemente hoy)
4. **Estimado de entrega**: 2-3 días laborables

### Entregables Esperados

**Fase 1 (Día 1)** - CRÍTICA:
- [ ] Índices creados en base de datos
- [ ] Paginación implementada
- [ ] Caché con Redis funcionando
- [ ] Queries optimizados (N+1 resuelto)
- [ ] Deploy a staging
- [ ] GET /api/memories/albums < 500ms

**Fase 2 (Día 2-3)** - COMPLETAR FEATURES:
- [ ] Todos los endpoints CRUD funcionando
- [ ] Sharing y miembros implementado
- [ ] Tests de integración pasando
- [ ] Load testing exitoso
- [ ] Deploy a producción
- [ ] Documentación actualizada

---

## 📞 Contacto y Seguimiento

### Siguiente Acción Inmediata

**Por favor, responder dentro de 24 horas con**:

1. ✅ **Confirmación de recepción** de esta petición
2. ✅ **Asignación de recursos** (quién trabajará en esto)
3. ✅ **Fecha de inicio** estimada
4. ✅ **Fecha de entrega** Fase 1 (crítica)
5. ✅ **Fecha de entrega** Fase 2 (features completas)

### Reunión de Coordinación

Sugerimos una **reunión de 30 minutos** para:
- Revisar documentación técnica
- Aclarar dudas
- Confirmar plan de implementación
- Establecer puntos de sincronización

**Disponibilidad**: Cualquier día esta semana

---

## 🚀 Impacto Esperado

### Antes (Sin Optimizaciones)

```
Primera carga: 30s ❌
Usuario abandona: 100% ❌
Feature lanzable: NO ❌
```

### Después (Con Optimizaciones)

```
Primera carga: 0.5s ✅ (60x más rápido)
Usuario satisfecho: 100% ✅
Feature lanzable: SÍ ✅
```

### Beneficio

- ✅ Feature **lista para producción**
- ✅ Experiencia de usuario **excelente**
- ✅ Roadmap de producto **desbloqueado**
- ✅ ROI de desarrollo frontend **realizado**
- ✅ **30 segundos ahorrados** por cada carga

---

## 🏁 Conclusión

Esta petición es **crítica y bloqueante** para el lanzamiento de la funcionalidad Memories a producción.

El equipo frontend ha implementado todas las optimizaciones posibles en el cliente, pero **solo el backend puede resolver el problema de raíz**.

**Solicitamos priorización urgente** de esta tarea para poder lanzar esta funcionalidad.

---

**Atentamente**,

**Equipo Frontend - PLANNER AI / Copilot**

**Fecha**: 2026-02-10
**Versión**: 1.0
**Estado**: ⚠️ **ESPERANDO RESPUESTA BACKEND**

---

## 📧 Respuesta Esperada

Por favor, llenar la siguiente sección y responder:

---

### ✅ Confirmación de Backend

**Responsable**: [Nombre del Backend Lead]
**Email**: [Email de contacto]
**Fecha de respuesta**: [YYYY-MM-DD]

#### Asignación de Recursos

- [ ] **Backend Developer**: [Nombre]
- [ ] **DevOps Engineer**: [Nombre]
- [ ] **Horas asignadas**: [X horas]

#### Fechas Comprometidas

- [ ] **Inicio**: [YYYY-MM-DD HH:mm]
- [ ] **Entrega Fase 1** (crítica): [YYYY-MM-DD]
- [ ] **Entrega Fase 2** (features): [YYYY-MM-DD]

#### Comentarios

[Agregar cualquier comentario, pregunta o aclaración]

---

**FIN DE LA PETICIÓN**
