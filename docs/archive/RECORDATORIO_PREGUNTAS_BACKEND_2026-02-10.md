# ❓ Recordatorio: Preguntas Pendientes Backend

**Para**: Equipos Backend (api-ia + API2)
**De**: Equipo Frontend PLANNER AI
**Fecha**: 2026-02-10
**Asunto**: Consolidación de preguntas pendientes para integración completa

---

## 📋 Resumen

Este documento consolida **todas las preguntas pendientes** de los equipos backend que están bloqueando la integración completa entre frontend y backend.

### Documentos Fuente

1. [`docs/PREGUNTAS-BACKEND-COPILOT.md`](docs/PREGUNTAS-BACKEND-COPILOT.md) - 6 bloques de preguntas
2. [`docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md`](docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md) - Contratos y testing
3. [`docs/AVANCE-INTEGRACION-BACKEND.md`](docs/AVANCE-INTEGRACION-BACKEND.md) - Checklist sin completar

### Estado

| Área | Preguntas | Estado | Prioridad |
|------|-----------|--------|-----------|
| Historial de chat | 4 | ❌ Sin respuesta | P0 |
| SessionId | 2 | ❌ Sin respuesta | P0 |
| API2 GraphQL | 3 | ❌ Sin respuesta | P0 |
| Eventos SSE | 3 | ❌ Sin respuesta | P1 |
| Métricas | 3 | ❌ Sin respuesta | P2 |
| Auth / Usuario | 2 | ❌ Sin respuesta | P1 |
| Contratos API | 5 | ❌ Sin respuesta | P0 |
| Testing | 3 | ❌ Sin respuesta | P1 |

**Total**: **25 preguntas sin respuesta**

---

## 🔴 Bloque 1: Historial de Chat (P0 - CRÍTICO)

### Contexto

En la app web tenemos un panel del Copilot (embed) que envía mensajes a `/api/copilot/chat` (proxy a api-ia). Queremos mostrar historial al reabrir el panel.

### Preguntas

#### 1.1 ¿Backend persiste mensajes de chat?

**Pregunta**:
- ¿El backend de **api-ia** (Python) ya persiste los mensajes de chat por `sessionId` o por `userId`?

**Opciones**:
- [ ] **SÍ** - api-ia persiste los mensajes
- [ ] **NO** - api-ia no persiste (frontend debe persistir)

**Si SÍ**, continuar con preguntas 1.2-1.4

---

#### 1.2 ¿Cómo obtener historial?

**Pregunta**:
- ¿Qué endpoint debemos usar para **obtener** el historial?

**Ejemplos posibles**:
- `GET /api/chat/history?sessionId=xxx`
- `GET /webapi/messages?userId=xxx&sessionId=xxx`
- Otro: `___________________________`

**Formato de respuesta esperado**:
```json
{
  "messages": [
    {
      "id": "msg_123",
      "role": "user" | "assistant" | "system",
      "content": "Hola",
      "createdAt": "2026-02-10T00:00:00Z"
    }
  ]
}
```

**Por favor especificar**:
- Endpoint: `___________________________`
- Método: `___________________________`
- Query params: `___________________________`
- Formato de respuesta (JSON structure): `___________________________`

---

#### 1.3 ¿Cómo guardar mensajes?

**Pregunta**:
- ¿Hay que **enviar** cada mensaje a algún endpoint para guardarlo, o el backend ya los guarda al procesar la petición a `/webapi/chat/auto`?

**Opciones**:
- [ ] **Auto-save** - Backend guarda automáticamente al procesar chat
- [ ] **Endpoint separado** - Hay que llamar a endpoint específico (especificar: `___________________________`)

---

#### 1.4 ¿Plan de persistencia?

**Si NO persiste actualmente**:
- ¿Tenéis previsto exponer persistencia de historial?
- ¿Timeline estimado? `___________________________`

**Mientras tanto**:
- El frontend persiste en memoria en `GET/POST /api/chat/messages` (Next.js)
- ¿Debemos mantener esta implementación o la reemplazamos cuando backend esté listo?

**Respuesta**: `___________________________`

---

## 🔴 Bloque 2: SessionId (P0 - CRÍTICO)

### Contexto

En el front enviamos `sessionId` en el metadata (ej. `user_<uid>` para usuario logueado o `guest_<id>` para invitado).

### Preguntas

#### 2.1 ¿Backend usa sessionId?

**Pregunta**:
- ¿El backend de api-ia **usa** ya el `sessionId` (o un campo equivalente) para agrupar mensajes o para contexto de conversación?

**Opciones**:
- [ ] **SÍ** - Se usa para agrupar mensajes/contexto
- [ ] **NO** - No se usa actualmente
- [ ] **OTRO** - Se usa un campo diferente: `___________________________`

---

#### 2.2 ¿Formato y ubicación?

**Pregunta**:
- ¿Hay que enviar el `sessionId` en algún header o campo concreto (nombre y formato)?

**Actualmente enviamos**:
```json
{
  "messages": [...],
  "stream": true,
  "metadata": {
    "sessionId": "user_abc123",
    "userId": "user@test.com",
    "development": "bodasdehoy"
  }
}
```

**¿Es correcto? Si no, especificar formato correcto**:
```
Ubicación (metadata/header/body): ___________________________
Campo name: ___________________________
Formato esperado: ___________________________
```

---

## 🔴 Bloque 3: API2 / GraphQL (P0 - CRÍTICO)

### Contexto

La app web usa API2 (GraphQL, api2.eventosorganizador.com) para eventos, usuarios, etc. Según api-ia, el historial de mensajes se guarda en API2.

### Preguntas

#### 3.1 ¿Existe query para historial de chat?

**Pregunta**:
- ¿Existe en **API2** alguna **query** para leer historial de mensajes del Copilot por usuario o por sesión?

**Opciones**:
- [ ] **SÍ** - Existe query
- [ ] **NO** - No existe

**Si SÍ, especificar**:
```graphql
query GetChatMessages {
  # Nombre de la query: ___________________________
  # Argumentos: ___________________________
  # Campos de respuesta: ___________________________
}
```

**Ejemplo que creemos es correcto (confirmar o corregir)**:
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

**¿Es correcto?**:
- [ ] SÍ - Usar este formato
- [ ] NO - Usar este en su lugar: `___________________________`

---

#### 3.2 ¿Existe mutation para guardar mensajes?

**Pregunta**:
- ¿Existe en **API2** alguna **mutation** para guardar mensajes del Copilot (user/assistant)?

**Opciones**:
- [ ] **NO NECESARIO** - api-ia guarda automáticamente
- [ ] **SÍ** - Frontend debe llamar mutation (especificar: `___________________________`)

---

#### 3.3 ¿Formato de respuesta de getChatMessages?

**Pregunta**:
- ¿Podéis confirmar la forma exacta de la respuesta de `getChatMessages`?

**Necesitamos saber**:
- ¿Campos siempre presentes? `id`, `role`, `content`, `createdAt`, `metadata`
- ¿Formato de `createdAt`? ISO string? Timestamp?
- ¿Estructura de `metadata`?

**Ejemplo esperado**:
```json
{
  "data": {
    "getChatMessages": [
      {
        "id": "msg_123",
        "role": "user",
        "content": "Hola",
        "createdAt": "2026-02-10T00:00:00Z",
        "metadata": {
          "sessionId": "user_abc",
          "userId": "user@test.com"
        }
      }
    ]
  }
}
```

**Por favor confirmar o corregir**: `___________________________`

---

## 🟡 Bloque 4: Eventos SSE (P1 - ALTA)

### Contexto

El front parsea eventos SSE con `event:` (tool_result, progress, tool_start, ui_action, confirm_required, etc.) y los muestra en la UI del embed.

### Preguntas

#### 4.1 ¿Backend envía eventos enriquecidos?

**Pregunta**:
- ¿El backend de api-ia **envía** ya estos eventos en el stream (con `event: tool_result` etc.)?

**Opciones**:
- [ ] **SÍ** - Ya se envían
- [ ] **NO** - No se envían aún
- [ ] **PARCIALMENTE** - Solo algunos (especificar: `___________________________`)

---

#### 4.2 ¿Documentación de eventos?

**Si SÍ se envían**:
- ¿Hay documentación o lista de los tipos de evento y el formato de `data`?

**Tipos que parseamos actualmente**:
- `tool_result` - Resultado de herramienta
- `ui_action` - Acción de UI
- `confirm_required` - Requiere confirmación
- `progress` - Progreso de operación
- `code_output` - Output de código
- `tool_start` - Inicio de herramienta
- `event_card` - Tarjeta de evento
- `usage` - Métricas de uso
- `reasoning` - Razonamiento del modelo

**Por favor especificar para cada tipo**:
```
event: tool_result
data: {
  "tool": "___________________________",
  "result": {
    "type": "___________________________",
    "message": "___________________________",
    "url": "___________________________"
  }
}
```

**Documentación disponible**: `___________________________`

---

#### 4.3 ¿Ejemplos reales de SSE?

**Pregunta**:
- ¿Podéis enviarnos 1–2 ejemplos **reales** (anonimizados) de líneas SSE para cada uno de estos tipos?
  - `event_card` (con `event`, `actions`, `message` si los tenéis)
  - `usage` (con `tokens`, `cost` o los campos que realmente enviáis)
  - `reasoning`
  - `tool_result` (por ejemplo tipo `ui_action` o `data_table` con la estructura real)

**Por favor pegar ejemplos aquí**:
```
___________________________
```

---

## 🟢 Bloque 5: Métricas y Uso (P2 - MEDIA)

### Contexto

En el front hacemos un log básico por mensaje (tiempo de respuesta). Queremos saber si ya hay algo en backend para no duplicar.

### Preguntas

#### 5.1 ¿Backend registra métricas?

**Pregunta**:
- ¿El backend de api-ia **registra** ya métricas de uso del chat (mensajes enviados, errores, latencia, por usuario o por desarrollo)?

**Opciones**:
- [ ] **SÍ** - Se registran métricas
- [ ] **NO** - No se registran
- [ ] **PARCIALMENTE** - Solo algunas (especificar: `___________________________`)

---

#### 5.2 ¿Frontend debe reportar eventos?

**Pregunta**:
- ¿Hay que llamar a algún endpoint desde el front para reportar eventos (ej. "mensaje enviado", "error"), o todo se deriva de las propias peticiones al chat?

**Opciones**:
- [ ] **AUTO** - Backend deriva métricas de las peticiones
- [ ] **ENDPOINT** - Frontend debe reportar a endpoint (especificar: `___________________________`)
- [ ] **NO NECESARIO** - Por ahora no

---

#### 5.3 ¿Dashboard o visualización?

**Pregunta**:
- ¿Existe dashboard o herramienta para ver métricas de uso del Copilot?
- ¿Podemos tener acceso?

**Respuesta**: `___________________________`

---

## 🟡 Bloque 6: Auth / Identificación de Usuario (P1 - ALTA)

### Contexto

Usamos `/api/auth/identify-user` (api-ia) para identificar usuario; en algunos entornos ha habido 404 si el usuario no existe en la BD de api-ia.

### Preguntas

#### 6.1 ¿Sincronización de usuarios?

**Pregunta**:
- ¿Los usuarios de **Firebase** (o el IdP que use la web) se sincronizan automáticamente con la BD de api-ia, o hay que crearlos/actualizarlos manualmente o por otro proceso?

**Opciones**:
- [ ] **AUTO** - Sincronización automática
- [ ] **MANUAL** - Hay que crear/actualizar manualmente
- [ ] **WEBHOOK** - Webhook de Firebase a api-ia
- [ ] **OTRO**: `___________________________`

**Si es manual/webhook, especificar proceso**: `___________________________`

---

#### 6.2 ¿Token y headers suficientes?

**Pregunta**:
- Para el Copilot embed: ¿basta con enviar el token (Bearer) y los headers que ya enviamos (`X-Development`, etc.) para que api-ia identifique al usuario y asocie la conversación?

**Headers que enviamos actualmente**:
```
Authorization: Bearer <JWT>
X-Development: bodasdehoy
X-User-Id: user@test.com (opcional)
X-Event-Id: evt_123 (opcional)
```

**¿Es suficiente?**:
- [ ] **SÍ** - Suficiente
- [ ] **NO** - Faltan headers (especificar: `___________________________`)

---

## 🔴 Bloque 7: Contratos de API (P0 - CRÍTICO)

### Contexto

Necesitamos confirmar los contratos actuales de las APIs para asegurar que el frontend envía/recibe datos en el formato correcto.

### Preguntas

#### 7.1 ¿Contrato del body de chat?

**Actualmente enviamos**:
```json
POST /webapi/chat/auto
Content-Type: application/json
Authorization: Bearer <JWT>
X-Development: bodasdehoy

{
  "messages": [
    {
      "role": "user" | "assistant" | "system",
      "content": "string"
    }
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

**¿Es correcto? Si no, especificar formato correcto**:
```
___________________________
```

---

#### 7.2 ¿Campos obligatorios vs opcionales?

**Por favor marcar**:
- `messages`: [ ] Obligatorio [ ] Opcional
- `stream`: [ ] Obligatorio [ ] Opcional
- `metadata.userId`: [ ] Obligatorio [ ] Opcional
- `metadata.development`: [ ] Obligatorio [ ] Opcional
- `metadata.sessionId`: [ ] Obligatorio [ ] Opcional
- `metadata.eventId`: [ ] Obligatorio [ ] Opcional
- `model`: [ ] Obligatorio [ ] Opcional

**Campos adicionales requeridos**: `___________________________`

---

#### 7.3 ¿Headers obligatorios?

**Por favor marcar**:
- `Authorization`: [ ] Obligatorio [ ] Opcional
- `X-Development`: [ ] Obligatorio [ ] Opcional
- `X-User-Id`: [ ] Obligatorio [ ] Opcional
- `X-Event-Id`: [ ] Obligatorio [ ] Opcional
- `X-Page-Name`: [ ] Obligatorio [ ] Opcional
- `X-Request-Id`: [ ] Obligatorio [ ] Opcional

**Headers adicionales requeridos**: `___________________________`

---

#### 7.4 ¿Formato de respuesta streaming?

**Respuesta SSE actual que parseamos**:
```
event: text
data: {"choices": [{"delta": {"content": "Hola"}}]}

event: done
data: {"choices": [{"message": {"content": "Hola mundo"}}]}
```

**¿Es correcto? Si no, especificar**:
```
___________________________
```

---

#### 7.5 ¿Formato de respuesta no-streaming?

**Si `stream: false`, ¿qué formato de respuesta?**:
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

**¿Es correcto? Si no, especificar**:
```
___________________________
```

---

## 🟡 Bloque 8: Testing con Datos Reales (P1 - ALTA)

### Contexto

Para poder ejecutar tests contra servicios reales (o al menos validar contra respuestas reales).

### Preguntas

#### 8.1 ¿Existe entorno de testing?

**Pregunta**:
- ¿Existe una URL de api-ia solo para pruebas (staging/test) que podamos usar desde nuestro CI o desde máquinas de desarrollo?

**Opciones**:
- [ ] **SÍ** - Existe entorno de test
  - URL: `___________________________`
  - Credenciales: `___________________________`
- [ ] **NO** - Solo producción

---

#### 8.2 ¿SessionId de prueba?

**Pregunta**:
- ¿Podéis facilitar un `sessionId` de prueba (por ejemplo `test_session_xxx`) para el que ya haya mensajes guardados (api-ia los guarda en API2 al finalizar el stream)?

**Objetivo**: Probar la lectura de historial (nuestro proxy a `getChatMessages` en API2) y comprobar que el front muestra el historial correcto.

**SessionId de prueba**: `___________________________`

---

#### 8.3 ¿Usuario/JWT de test?

**Pregunta**:
- ¿Hay un usuario/JWT de test que podamos usar en automatización (por ejemplo para health o un único mensaje de chat) sin tocar producción?

**Opciones**:
- [ ] **SÍ** - Usuario de test disponible
  - Email: `___________________________`
  - JWT: `___________________________`
  - Password (si aplica): `___________________________`
- [ ] **NO** - No disponible

---

## 🔄 Bloque 9: Arquitectura y Decisiones (P2 - MEDIA)

### Contexto

Hoy el front usa **dos URLs**: api-ia para chat y API2 para historial. Queremos simplificar si es posible.

### Pregunta

#### 9.1 ¿Endpoint de historial en api-ia?

**Contexto actual**:
- Chat en vivo: `POST https://api-ia.bodasdehoy.com/webapi/chat/auto`
- Historial: `POST https://api2.eventosorganizador.com/graphql` → query `getChatMessages`

**Pregunta**:
- ¿Preferís que el front **solo** apunte a api-ia? En ese caso, si api-ia expusiera un endpoint "dame historial" (p. ej. `GET /webapi/chat/history?sessionId=...`) que internamente llame a API2, nosotros solo necesitaríamos `PYTHON_BACKEND_URL` y dejaríamos de llamar a API2 desde el front.

**Opciones**:
- [ ] **MANTENER ACTUAL** - Frontend llama a api-ia (chat) y API2 (historial)
- [ ] **UNIFICAR** - api-ia expondrá endpoint de historial (especificar timeline: `___________________________`)

**Ventajas de unificar**:
- ✅ Frontend solo necesita una URL
- ✅ Simplifica configuración
- ✅ api-ia tiene control total sobre la integración

**Decisión**: `___________________________`

---

## 📊 Resumen de Estado

### Checklist de Respuestas Pendientes

**Bloque 1: Historial de Chat**
- [ ] 1.1 - ¿Backend persiste mensajes?
- [ ] 1.2 - ¿Endpoint para obtener historial?
- [ ] 1.3 - ¿Cómo guardar mensajes?
- [ ] 1.4 - ¿Plan de persistencia?

**Bloque 2: SessionId**
- [ ] 2.1 - ¿Backend usa sessionId?
- [ ] 2.2 - ¿Formato y ubicación?

**Bloque 3: API2 / GraphQL**
- [ ] 3.1 - ¿Query para historial?
- [ ] 3.2 - ¿Mutation para guardar?
- [ ] 3.3 - ¿Formato de respuesta getChatMessages?

**Bloque 4: Eventos SSE**
- [ ] 4.1 - ¿Backend envía eventos enriquecidos?
- [ ] 4.2 - ¿Documentación de eventos?
- [ ] 4.3 - ¿Ejemplos reales de SSE?

**Bloque 5: Métricas**
- [ ] 5.1 - ¿Backend registra métricas?
- [ ] 5.2 - ¿Frontend debe reportar?
- [ ] 5.3 - ¿Dashboard disponible?

**Bloque 6: Auth**
- [ ] 6.1 - ¿Sincronización de usuarios?
- [ ] 6.2 - ¿Token y headers suficientes?

**Bloque 7: Contratos**
- [ ] 7.1 - ¿Contrato del body de chat?
- [ ] 7.2 - ¿Campos obligatorios vs opcionales?
- [ ] 7.3 - ¿Headers obligatorios?
- [ ] 7.4 - ¿Formato respuesta streaming?
- [ ] 7.5 - ¿Formato respuesta no-streaming?

**Bloque 8: Testing**
- [ ] 8.1 - ¿Entorno de testing?
- [ ] 8.2 - ¿SessionId de prueba?
- [ ] 8.3 - ¿Usuario/JWT de test?

**Bloque 9: Arquitectura**
- [ ] 9.1 - ¿Endpoint de historial en api-ia?

**Total**: **25 preguntas** pendientes

---

## 🎯 Acción Requerida

### Solicitamos

**Por favor, responder estas preguntas lo antes posible** para poder:
1. ✅ Completar integración frontend-backend
2. ✅ Eliminar persistencia temporal en memoria
3. ✅ Implementar tests con datos reales
4. ✅ Optimizar flujos de autenticación
5. ✅ Validar parseo de eventos SSE

### Formato de Respuesta

**Opción 1: Llenar este documento**
- Copiar este archivo
- Llenar todas las respuestas en las secciones `___________________________`
- Marcar checkboxes `[ ]` → `[x]`
- Enviar de vuelta

**Opción 2: Reunión de 1 hora**
- Agendar reunión con equipos api-ia + API2
- Revisar preguntas una por una
- Documentar respuestas en acta de reunión

**Opción 3: Documento de respuestas**
- Crear nuevo documento: `RESPUESTAS_BACKEND_2026-02-XX.md`
- Responder cada bloque/pregunta
- Referencias a documentación existente

---

## 📞 Contacto

### Equipos Involucrados

| Equipo | Responsable | Email | Preguntas |
|--------|-------------|-------|-----------|
| **api-ia Backend** | TBD | backend@bodasdehoy.com | Bloques 1, 2, 4, 5, 6, 7, 8, 9 |
| **API2 GraphQL** | TBD | api2@eventosorganizador.com | Bloque 3 |
| **DevOps** | TBD | devops@bodasdehoy.com | Bloque 8 (entornos) |

### Siguiente Acción

**Por favor, confirmar dentro de 48 horas**:
1. ✅ Recepción de este documento
2. ✅ Formato de respuesta preferido (Opción 1, 2 o 3)
3. ✅ Timeline estimado para responder
4. ✅ Responsables de cada bloque

---

## 📚 Contexto Adicional

### Documentos de Referencia

- [`docs/PREGUNTAS-BACKEND-COPILOT.md`](docs/PREGUNTAS-BACKEND-COPILOT.md) - Preguntas originales sobre integración Copilot
- [`docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md`](docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md) - Preguntas sobre testing
- [`docs/AVANCE-INTEGRACION-BACKEND.md`](docs/AVANCE-INTEGRACION-BACKEND.md) - Checklist de integración
- [`docs/PLAN-COPILOT-MONOREPO.md`](docs/PLAN-COPILOT-MONOREPO.md) - Plan general de integración

### Estado Actual del Frontend

**Lo que funciona hoy**:
- ✅ Chat en vivo (POST a `/api/copilot/chat` → proxy a api-ia)
- ✅ Historial temporal en memoria (Next.js)
- ✅ SessionId (formato `user_<uid>` / `guest_<id>`)
- ✅ Parseo básico de SSE (sin validar con datos reales)

**Lo que queremos mejorar**:
- ⏳ Usar historial de backend (eliminar persistencia en memoria)
- ⏳ Validar parseo SSE con ejemplos reales
- ⏳ Implementar tests de integración con datos reales
- ⏳ Optimizar flujo de autenticación
- ⏳ Agregar métricas si backend las expone

---

## 🏁 Conclusión

Estas **25 preguntas** representan los puntos de integración pendientes entre frontend y backend.

Responderlas nos permitirá:
- ✅ Completar la integración
- ✅ Eliminar workarounds temporales
- ✅ Implementar tests robustos
- ✅ Optimizar la arquitectura

**Agradecemos su pronta respuesta** para poder avanzar.

---

**Preparado por**: Equipo Frontend PLANNER AI
**Fecha**: 2026-02-10
**Versión**: 1.0
**Estado**: ⏳ **ESPERANDO RESPUESTAS BACKEND**

---

## 📧 Respuesta Esperada

**Por favor llenar y responder**:

### ✅ Confirmación

**Responsable api-ia**: `___________________________`
**Responsable API2**: `___________________________`
**Fecha de respuesta**: `___________________________`

**Formato elegido**:
- [ ] Opción 1 - Llenar este documento
- [ ] Opción 2 - Reunión de 1 hora
- [ ] Opción 3 - Documento nuevo de respuestas

**Timeline estimado**: `___________________________`

**Comentarios**: `___________________________`

---

**FIN DEL RECORDATORIO**
