# 🔷 Petición: Backend API2 (GraphQL)

**Para**: Equipo Backend API2 (api2.eventosorganizador.com)
**De**: Equipo Frontend PLANNER AI
**Fecha**: 2026-02-10
**Prioridad**: 🟡 **P1 - MEDIA** (puede delegarse a api-ia)

---

## 📋 Resumen Ejecutivo

Este documento contiene las preguntas específicas para **API2 GraphQL**, relacionadas con el historial de mensajes del chat.

### ⚠️ NOTA IMPORTANTE: Posible Redirección a api-ia

**Análisis**:
- Actualmente, **api-ia ESCRIBE** mensajes en API2
- Frontend **LEE** historial desde API2 con `getChatMessages`
- Esto requiere que frontend apunte a **2 URLs diferentes**

**Propuesta alternativa**:
- api-ia podría exponer endpoint `GET /webapi/chat/history`
- api-ia llamaría a API2 internamente
- Frontend solo apuntaría a api-ia

**Ventajas**:
- ✅ Frontend simplificado (1 URL en vez de 2)
- ✅ api-ia maneja toda la lógica de chat
- ✅ Mejor para caché y optimización

**Decisión**: Ver respuesta de api-ia primero (Pregunta 2 en [`PETICION_API_IA_2026-02-10.md`](PETICION_API_IA_2026-02-10.md))

---

## 🔷 Alcance

**Backend Responsable**: `https://api2.eventosorganizador.com/graphql`

**Servicios que maneja**:
- ✅ **Historial de chat** - Lectura de mensajes (api-ia escribe aquí)
- ✅ **Eventos** - Bodas, XV años, etc.
- ✅ **Invitados** - Gestión de invitados
- ✅ **Usuarios** - Datos de usuarios

**Este documento cubre**: Solo historial de chat

---

## ❓ PREGUNTAS SOBRE HISTORIAL DE CHAT

### Contexto

Según el equipo api-ia, cuando se procesa un mensaje de chat:
1. api-ia procesa el chat y responde por SSE
2. **api-ia guarda** los mensajes (user + assistant) en API2
3. Frontend **lee** historial desde API2 con query `getChatMessages`

### Pregunta 1: Query getChatMessages - Formato exacto

**Query que usamos actualmente**:
```graphql
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

**Variables**:
```json
{
  "sessionId": "user_abc123",
  "limit": 50
}
```

**¿Es correcto?**
- [ ] **SÍ** - Correcto
- [ ] **NO** - Formato correcto: `___________________________`

---

### Pregunta 2: Campos de respuesta

**Campos que esperamos**:
```json
{
  "data": {
    "getChatMessages": [
      {
        "id": "msg_123",
        "role": "user" | "assistant" | "system",
        "content": "texto del mensaje",
        "createdAt": "2026-02-10T00:00:00Z",
        "metadata": {
          "sessionId": "user_abc",
          "userId": "user@test.com",
          "development": "bodasdehoy"
        }
      }
    ]
  }
}
```

**Por favor confirmar**:
- [ ] Campos `id`, `role`, `content` siempre presentes
- [ ] Campo `createdAt` es ISO string (formato: `___________________________`)
- [ ] Campo `metadata` estructura: `___________________________`
- [ ] Otros campos disponibles: `___________________________`

**Respuesta**: `___________________________`

---

### Pregunta 3: ¿Paginación disponible?

**¿La query soporta paginación?**

**Opciones**:
- [ ] **SÍ - Offset/Limit** - Argumentos: `offset`, `limit`
- [ ] **SÍ - Cursor** - Argumentos: `cursor`, `limit`
- [ ] **NO** - Solo `limit`

**Si soporta paginación, formato de respuesta**:
```graphql
query GetChatMessages($sessionId: String!, $limit: Int, $offset: Int) {
  getChatMessages(sessionId: $sessionId, limit: $limit, offset: $offset) {
    messages { ... }
    pagination {
      total
      hasMore
      nextOffset  # o nextCursor
    }
  }
}
```

**¿Es así? Si no, especificar**: `___________________________`

---

### Pregunta 4: ¿Ordenamiento?

**¿Cómo se ordenan los mensajes?**

**Opciones**:
- [ ] **Ascendente** - Mensaje más antiguo primero
- [ ] **Descendente** - Mensaje más reciente primero
- [ ] **Configurable** - Argumento `sort` o similar

**Respuesta**: `___________________________`

---

### Pregunta 5: ¿Mutation para guardar mensajes?

**Según entendemos**, api-ia guarda los mensajes automáticamente en API2.

**¿Frontend debe/puede llamar a alguna mutation para guardar mensajes?**

**Opciones**:
- [ ] **NO** - Solo api-ia escribe (frontend solo lee)
- [ ] **SÍ** - Frontend puede usar: `___________________________`

**Si existe mutation, especificar**:
```graphql
mutation SaveChatMessage($input: ChatMessageInput!) {
  saveChatMessage(input: $input) {
    id
    # ...
  }
}
```

**Respuesta**: `___________________________`

---

### Pregunta 6: ¿Filtros adicionales?

**¿La query soporta filtros adicionales además de sessionId?**

**Ejemplos**:
- Por `userId`
- Por `development`
- Por rango de fechas (`startDate`, `endDate`)
- Por `role` (solo user, solo assistant)

**Respuesta**:
- [ ] **NO** - Solo sessionId
- [ ] **SÍ** - Filtros disponibles: `___________________________`

---

### Pregunta 7: ¿Límites de rate limiting?

**¿Hay límites de requests para getChatMessages?**

**Respuesta**:
- [ ] **NO** - Sin límite
- [ ] **SÍ** - Límite: `___________________________` requests por minuto/hora

---

## 🔄 PROPUESTA: Migrar a api-ia

### Situación Actual

```
Frontend
├─> api-ia.bodasdehoy.com (chat en vivo)
└─> api2.eventosorganizador.com (historial)
```

**Problemas**:
- ❌ Frontend mantiene 2 conexiones
- ❌ 2 URLs, 2 configuraciones
- ❌ Más complejo para caché y optimización

---

### Situación Propuesta

```
Frontend
└─> api-ia.bodasdehoy.com (chat + historial)
    ├─> Procesa chat en vivo
    └─> Proxy interno a API2 para historial
```

**Ventajas**:
- ✅ Frontend simplificado (1 URL)
- ✅ api-ia controla toda la lógica de chat
- ✅ Mejor para caché
- ✅ Más fácil de mantener

---

### Implementación Propuesta en api-ia

```python
# Nuevo endpoint en api-ia
@app.get("/webapi/chat/history")
async def get_chat_history(
    session_id: str,
    limit: int = 50,
    offset: int = 0
):
    """
    Obtener historial de mensajes.
    Internamente llama a API2 GraphQL.
    """
    # Llamar a API2 internamente
    query = """
        query GetChatMessages($sessionId: String!, $limit: Int) {
          getChatMessages(sessionId: $sessionId, limit: $limit) {
            id
            role
            content
            createdAt
            metadata
          }
        }
    """

    response = await api2_client.post(
        "https://api2.eventosorganizador.com/graphql",
        json={
            "query": query,
            "variables": {
                "sessionId": session_id,
                "limit": limit
            }
        }
    )

    return response["data"]["getChatMessages"]
```

**Frontend simplificado**:
```typescript
// ANTES: 2 URLs
const chatResponse = await fetch('https://api-ia.bodasdehoy.com/webapi/chat/auto');
const historyResponse = await fetch('https://api2.eventosorganizador.com/graphql');

// DESPUÉS: 1 URL
const chatResponse = await fetch('https://api-ia.bodasdehoy.com/webapi/chat/auto');
const historyResponse = await fetch('https://api-ia.bodasdehoy.com/webapi/chat/history');
```

---

### Pregunta 8: ¿Opinión de API2 sobre esta propuesta?

**¿El equipo API2 está de acuerdo con que api-ia sea el único punto de entrada para chat?**

**Opciones**:
- [ ] **SÍ** - De acuerdo, api-ia puede hacer proxy
- [ ] **NO** - Preferimos que frontend llame directamente a API2
- [ ] **INDIFERENTE** - Ambas opciones funcionan

**Comentarios**: `___________________________`

---

## ⏱️ ESTIMADO

### Si API2 responde preguntas

**Tiempo**: 30 minutos - 1 hora

**Resultado**: Frontend valida que usa getChatMessages correctamente

---

### Si se implementa proxy en api-ia

**Tiempo API2**: 0 horas (api-ia hace el trabajo)

**Tiempo api-ia**: 2-3 horas

**Resultado**: Frontend simplificado a 1 URL

---

## 📊 CHECKLIST DE RESPUESTAS

- [ ] P1: Formato de query getChatMessages confirmado
- [ ] P2: Campos de respuesta confirmados
- [ ] P3: Paginación (si aplica) confirmada
- [ ] P4: Ordenamiento confirmado
- [ ] P5: Mutation para guardar (si existe) especificada
- [ ] P6: Filtros adicionales listados
- [ ] P7: Rate limiting especificado
- [ ] P8: Opinión sobre propuesta de proxy

**Total**: **8 preguntas**

---

## 📞 ACCIÓN REQUERIDA

### Opción A: Responder Preguntas (Recomendado si se mantiene actual)

**Timeline**: 24-48 horas

**Formato**: Llenar este documento

---

### Opción B: Coordinar con api-ia (Recomendado)

**Pasos**:
1. Equipo API2 coordina con equipo api-ia
2. Se decide implementar proxy en api-ia
3. API2 solo necesita confirmar que api-ia puede llamar a getChatMessages
4. Frontend migra a usar solo api-ia

**Timeline**: 1 semana (incluye implementación en api-ia)

---

## 📧 RESPUESTA - Por favor llenar

### ✅ Confirmación API2

**Responsable**: `___________________________`
**Email**: `___________________________`
**Fecha de respuesta**: `___________________________`

### Decisión

**Opción elegida**:
- [ ] **Opción A** - Responder preguntas (mantener actual)
- [ ] **Opción B** - Coordinar con api-ia (implementar proxy)

### Si Opción A - Respuestas

**Por favor llenar Preguntas 1-8 arriba**

### Si Opción B - Coordinación

**Contacto api-ia**: `___________________________`
**Timeline coordinación**: `___________________________`
**Comentarios**: `___________________________`

---

## 📚 DOCUMENTACIÓN DE REFERENCIA

- [`PETICION_API_IA_2026-02-10.md`](PETICION_API_IA_2026-02-10.md) - Preguntas a api-ia (incluye propuesta de proxy)
- [`ARQUITECTURA_APIS_BACKEND_2026-02-10.md`](ARQUITECTURA_APIS_BACKEND_2026-02-10.md) - Diagrama completo
- [`docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md`](docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md) - Contexto original

---

**Preparado por**: Equipo Frontend PLANNER AI
**Fecha**: 2026-02-10
**Versión**: 1.0
**Estado**: ⏳ **ESPERANDO DECISIÓN API2**

---

**NOTA FINAL**: Este documento es **dependiente** de la respuesta de api-ia. Si api-ia decide implementar proxy, este documento puede ser **ignorado** o simplificado a solo confirmar que api-ia puede llamar a getChatMessages.

---

**FIN DEL DOCUMENTO**
