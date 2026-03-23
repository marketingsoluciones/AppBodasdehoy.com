# Especificacion: Tool Execution CRM/ERP para api-ia

**Fecha**: 2026-03-22
**De**: Equipo Frontend (chat-ia / Copilot IA)
**Para**: Equipo api-ia (Python/FastAPI)
**Prioridad**: Alta

---

## Contexto

El Copilot IA (chat-ia) ha implementado 3 nuevos grupos de tools CRM/ERP que reemplazan las tools de bodas (`lobe-eventos`, `lobe-venue-visualizer`). Cuando el LLM invoca una tool, api-ia recibe el tool_call y debe ejecutarlo.

**Flujo actual (ya funciona para `filter_view`)**:
```
LLM genera tool_call → api-ia recibe { function: { name: "list_leads", arguments: {...} } }
→ api-ia ejecuta la logica (query a API2 o logica propia)
→ api-ia devuelve el resultado al LLM via SSE event "tool_calls"
```

Las 3 nuevas tools son:
- **lobe-crm** (8 funciones) — Consulta de datos
- **lobe-crm-actions** (6 funciones) — Acciones/mutaciones
- **lobe-crm-analytics** (5 funciones) — Reportes y metricas

**Total: 19 funciones nuevas a implementar.**

---

## Tool 1: lobe-crm — Consulta de datos CRM

### 1.1 `list_leads`

**Descripcion**: Lista leads con filtros opcionales.

**Parametros recibidos**:
```json
{
  "status": "new|contacted|qualified|converted|lost",  // opcional
  "search": "texto libre",                              // opcional
  "limit": 20                                            // opcional, default 20
}
```

**Implementacion sugerida**: Ya existe `GET /api/leads/list` en api-ia. Reutilizar ese endpoint interno, pasando los filtros como query params.

**Respuesta esperada al LLM**:
```json
{
  "leads": [
    {
      "id": "abc123",
      "name": "Juan Perez",
      "email": "juan@empresa.com",
      "phone": "+52 555 1234567",
      "status": "new",
      "source": "web",
      "createdAt": "2026-03-15T10:00:00Z",
      "company": "Empresa SA"
    }
  ],
  "total": 45,
  "filtered": 12
}
```

---

### 1.2 `get_lead`

**Descripcion**: Detalle completo de un lead.

**Parametros recibidos**:
```json
{
  "leadId": "abc123"
}
```

**Implementacion sugerida**: Ya existe `GET /api/leads/{leadId}` en api-ia.

**Respuesta esperada al LLM**:
```json
{
  "id": "abc123",
  "name": "Juan Perez",
  "email": "juan@empresa.com",
  "phone": "+52 555 1234567",
  "status": "qualified",
  "source": "referido",
  "company": "Empresa SA",
  "notes": [
    { "text": "Interesado en plan premium", "date": "2026-03-18", "author": "Maria" }
  ],
  "tasks": [
    { "id": "t1", "title": "Llamar para seguimiento", "dueDate": "2026-03-25", "done": false }
  ],
  "opportunities": [
    { "id": "opp1", "title": "Licencia Enterprise", "value": 5000, "stage": "proposal" }
  ],
  "interactions": [
    { "type": "email", "date": "2026-03-16", "summary": "Envio de cotizacion" }
  ],
  "createdAt": "2026-03-10T08:00:00Z",
  "updatedAt": "2026-03-18T14:30:00Z"
}
```

---

### 1.3 `list_contacts`

**Descripcion**: Lista contactos del CRM.

**Parametros recibidos**:
```json
{
  "search": "texto libre",   // opcional
  "segment": "premium",      // opcional
  "limit": 20                // opcional
}
```

**Implementacion**: Query GraphQL a API2 → `getContacts` (ver SPEC-API2).

**Respuesta esperada**:
```json
{
  "contacts": [
    {
      "id": "ct001",
      "name": "Ana Lopez",
      "email": "ana@corp.com",
      "phone": "+52 555 9876543",
      "company": "Corp SA",
      "segments": ["premium", "tech"],
      "lastContact": "2026-03-20"
    }
  ],
  "total": 120,
  "filtered": 15
}
```

---

### 1.4 `get_contact`

**Descripcion**: Detalle completo de un contacto.

**Parametros recibidos**:
```json
{
  "contactId": "ct001"
}
```

**Implementacion**: Query GraphQL a API2 → `getContact`.

**Respuesta esperada**:
```json
{
  "id": "ct001",
  "name": "Ana Lopez",
  "email": "ana@corp.com",
  "phone": "+52 555 9876543",
  "company": "Corp SA",
  "position": "Directora Comercial",
  "segments": ["premium", "tech"],
  "notes": [],
  "opportunities": [],
  "campaigns": ["camp01"],
  "lastContact": "2026-03-20",
  "createdAt": "2025-11-05T10:00:00Z"
}
```

---

### 1.5 `list_opportunities`

**Descripcion**: Lista oportunidades de venta.

**Parametros recibidos**:
```json
{
  "stage": "proposal",   // opcional
  "minValue": 1000,      // opcional
  "limit": 20            // opcional
}
```

**Implementacion**: Query GraphQL a API2 → `getOpportunities`.

**Respuesta esperada**:
```json
{
  "opportunities": [
    {
      "id": "opp1",
      "title": "Licencia Enterprise - Corp SA",
      "value": 15000,
      "stage": "negotiation",
      "probability": 70,
      "contact": { "id": "ct001", "name": "Ana Lopez" },
      "expectedCloseDate": "2026-04-15",
      "createdAt": "2026-02-10"
    }
  ],
  "total": 23,
  "totalValue": 345000
}
```

---

### 1.6 `get_opportunity`

**Descripcion**: Detalle de una oportunidad.

**Parametros recibidos**:
```json
{
  "opportunityId": "opp1"
}
```

**Implementacion**: Query GraphQL a API2 → `getOpportunity`.

**Respuesta esperada**:
```json
{
  "id": "opp1",
  "title": "Licencia Enterprise - Corp SA",
  "value": 15000,
  "stage": "negotiation",
  "probability": 70,
  "contact": { "id": "ct001", "name": "Ana Lopez", "email": "ana@corp.com" },
  "lead": { "id": "abc123", "name": "Juan Perez" },
  "expectedCloseDate": "2026-04-15",
  "activities": [
    { "type": "call", "date": "2026-03-18", "summary": "Presentacion de propuesta" },
    { "type": "email", "date": "2026-03-20", "summary": "Envio de contrato draft" }
  ],
  "notes": [],
  "createdAt": "2026-02-10",
  "updatedAt": "2026-03-20"
}
```

---

### 1.7 `list_campaigns`

**Descripcion**: Lista campanas de marketing.

**Parametros recibidos**:
```json
{
  "status": "active",     // opcional: draft, active, paused, completed
  "channel": "email",     // opcional: email, whatsapp, social, ads
  "limit": 20             // opcional
}
```

**Implementacion**: Query GraphQL a API2 → `getCampaigns`.

**Respuesta esperada**:
```json
{
  "campaigns": [
    {
      "id": "camp01",
      "name": "Promo Q1 2026",
      "status": "active",
      "channel": "email",
      "audienceSize": 500,
      "sent": 480,
      "opened": 210,
      "clicked": 85,
      "startDate": "2026-03-01",
      "endDate": "2026-03-31"
    }
  ],
  "total": 8
}
```

---

### 1.8 `search_crm`

**Descripcion**: Busqueda full-text en todas las entidades CRM.

**Parametros recibidos**:
```json
{
  "query": "Juan Perez",                          // requerido
  "entity": "leads|contacts|opportunities|campaigns"  // opcional, si no se indica busca en todas
}
```

**Implementacion**: Query GraphQL a API2 → `searchCRM` o multiples queries en paralelo a las entidades correspondientes.

**Respuesta esperada**:
```json
{
  "results": [
    { "entity": "lead", "id": "abc123", "name": "Juan Perez", "match": "name", "snippet": "Lead nuevo desde web" },
    { "entity": "contact", "id": "ct045", "name": "Juan Perez Garcia", "match": "name", "snippet": "Segmento: enterprise" },
    { "entity": "opportunity", "id": "opp12", "name": "Deal con Juan Perez", "match": "title", "snippet": "$8,000 - negotiation" }
  ],
  "totalResults": 3
}
```

---

## Tool 2: lobe-crm-actions — Acciones CRM

### 2.1 `create_lead`

**Parametros recibidos**:
```json
{
  "name": "Pedro Martinez",       // requerido
  "email": "pedro@empresa.com",   // opcional
  "phone": "+52 555 1111111",     // opcional
  "source": "web",                // opcional
  "notes": "Interesado en plan basico"  // opcional
}
```

**Implementacion**: Ya existe `POST /api/leads/save` en api-ia. Reutilizar.

**Respuesta esperada**:
```json
{
  "success": true,
  "lead": {
    "id": "new123",
    "name": "Pedro Martinez",
    "status": "new",
    "createdAt": "2026-03-22T15:00:00Z"
  },
  "message": "Lead creado exitosamente"
}
```

---

### 2.2 `update_lead_status`

**Parametros recibidos**:
```json
{
  "leadId": "abc123",                                    // requerido
  "status": "new|contacted|qualified|converted|lost"     // requerido
}
```

**Implementacion**: Ya existe `PUT /api/leads/{id}/status` en api-ia. Reutilizar.

**Respuesta esperada**:
```json
{
  "success": true,
  "lead": { "id": "abc123", "status": "contacted", "updatedAt": "2026-03-22T15:30:00Z" },
  "message": "Estado actualizado a 'contacted'"
}
```

---

### 2.3 `add_note`

**Parametros recibidos**:
```json
{
  "entityType": "lead|contact|opportunity",  // requerido
  "entityId": "abc123",                      // requerido
  "text": "Contenido de la nota"             // requerido
}
```

**Implementacion**:
- Para `lead`: Ya existe `PUT /api/leads/{id}/notes` en api-ia.
- Para `contact` y `opportunity`: GraphQL mutation a API2 → `addNote` (ver SPEC-API2).

**Respuesta esperada**:
```json
{
  "success": true,
  "note": { "id": "note001", "text": "Contenido de la nota", "createdAt": "2026-03-22T16:00:00Z" },
  "message": "Nota agregada al lead abc123"
}
```

---

### 2.4 `create_task`

**Parametros recibidos**:
```json
{
  "title": "Llamar a Juan Perez",         // requerido
  "description": "Seguimiento de propuesta",  // opcional
  "dueDate": "2026-03-25",                // opcional (ISO 8601)
  "assignee": "Maria",                    // opcional
  "relatedTo": "lead:abc123"              // opcional, formato "tipo:id"
}
```

**Implementacion**: GraphQL mutation a API2 → `createTask` (ver SPEC-API2).

**Respuesta esperada**:
```json
{
  "success": true,
  "task": {
    "id": "task001",
    "title": "Llamar a Juan Perez",
    "dueDate": "2026-03-25",
    "assignee": "Maria",
    "relatedTo": { "type": "lead", "id": "abc123", "name": "Juan Perez" }
  },
  "message": "Tarea creada para el 25 de marzo"
}
```

---

### 2.5 `update_opportunity_stage`

**Parametros recibidos**:
```json
{
  "opportunityId": "opp1",         // requerido
  "stage": "closed_won",           // requerido
  "value": 18000                   // opcional
}
```

**Implementacion**: GraphQL mutation a API2 → `updateOpportunity` (ver SPEC-API2).

**Respuesta esperada**:
```json
{
  "success": true,
  "opportunity": {
    "id": "opp1",
    "title": "Licencia Enterprise - Corp SA",
    "stage": "closed_won",
    "value": 18000,
    "updatedAt": "2026-03-22T17:00:00Z"
  },
  "message": "Oportunidad movida a 'closed_won' con valor $18,000"
}
```

---

### 2.6 `send_message`

**Parametros recibidos**:
```json
{
  "channel": "email|whatsapp",          // requerido
  "to": "juan@empresa.com",            // requerido (email o telefono)
  "subject": "Seguimiento propuesta",  // opcional (solo email)
  "body": "Hola Juan, ..."             // requerido
}
```

**Implementacion**: Endpoint nuevo en api-ia o integracion con servicio de mensajeria existente.
- **Email**: Integrar con el servicio de email que ya usan (SendGrid, SES, etc.)
- **WhatsApp**: Integrar con WhatsApp Business API si existe, o devolver error indicando que no esta configurado.

**Respuesta esperada**:
```json
{
  "success": true,
  "message": "Email enviado a juan@empresa.com",
  "messageId": "msg001",
  "channel": "email",
  "sentAt": "2026-03-22T17:30:00Z"
}
```

---

## Tool 3: lobe-crm-analytics — Reportes y Metricas

### 3.1 `get_pipeline_summary`

**Parametros recibidos**:
```json
{
  "period": "week|month|quarter"  // opcional, default "month"
}
```

**Implementacion**: Aggregation query a API2 sobre oportunidades, agrupado por stage.

**Respuesta esperada**:
```json
{
  "period": "month",
  "stages": [
    { "stage": "prospecting", "count": 15, "value": 45000 },
    { "stage": "qualification", "count": 8, "value": 32000 },
    { "stage": "proposal", "count": 5, "value": 75000 },
    { "stage": "negotiation", "count": 3, "value": 54000 },
    { "stage": "closed_won", "count": 2, "value": 28000 },
    { "stage": "closed_lost", "count": 1, "value": 12000 }
  ],
  "totalOpportunities": 34,
  "totalValue": 246000,
  "weightedValue": 128000,
  "avgDealSize": 7235
}
```

---

### 3.2 `get_revenue_report`

**Parametros recibidos**:
```json
{
  "dateFrom": "2026-01-01",       // opcional
  "dateTo": "2026-03-22",         // opcional
  "groupBy": "day|week|month"     // opcional, default "month"
}
```

**Implementacion**: Aggregation query a API2 sobre ventas/facturas cerradas.

**Respuesta esperada**:
```json
{
  "dateFrom": "2026-01-01",
  "dateTo": "2026-03-22",
  "groupBy": "month",
  "data": [
    { "period": "2026-01", "revenue": 45000, "deals": 5 },
    { "period": "2026-02", "revenue": 62000, "deals": 7 },
    { "period": "2026-03", "revenue": 38000, "deals": 4 }
  ],
  "totalRevenue": 145000,
  "totalDeals": 16,
  "avgRevenuePerDeal": 9062
}
```

---

### 3.3 `get_lead_funnel`

**Parametros recibidos**:
```json
{
  "period": "month",    // opcional
  "source": "web"       // opcional
}
```

**Implementacion**: Aggregation query a API2 sobre leads agrupados por status.

**Respuesta esperada**:
```json
{
  "period": "month",
  "source": null,
  "funnel": [
    { "stage": "new", "count": 50, "percentage": 100 },
    { "stage": "contacted", "count": 35, "percentage": 70 },
    { "stage": "qualified", "count": 18, "percentage": 36 },
    { "stage": "converted", "count": 8, "percentage": 16 },
    { "stage": "lost", "count": 12, "percentage": 24 }
  ],
  "conversionRate": 16.0,
  "topSources": [
    { "source": "web", "count": 20, "conversionRate": 20 },
    { "source": "referido", "count": 15, "conversionRate": 25 },
    { "source": "feria", "count": 10, "conversionRate": 10 }
  ]
}
```

---

### 3.4 `get_kpis`

**Parametros recibidos**:
```json
{
  "metrics": ["conversion_rate", "avg_deal_size", "revenue", "active_leads", "lead_response_time"]
}
```

**Metricas disponibles**:
| Metrica | Calculo |
|---------|---------|
| `conversion_rate` | leads converted / total leads * 100 |
| `avg_deal_size` | sum(opportunity.value where closed_won) / count(closed_won) |
| `lead_response_time` | avg(first_contact_date - lead_created_date) en horas |
| `revenue` | sum(closed_won opportunities value) del periodo actual |
| `active_leads` | count(leads where status != converted && status != lost) |

**Respuesta esperada**:
```json
{
  "metrics": {
    "conversion_rate": { "value": 16.0, "unit": "%", "trend": "+2.3% vs mes anterior" },
    "avg_deal_size": { "value": 9062, "unit": "USD", "trend": "+5% vs mes anterior" },
    "revenue": { "value": 145000, "unit": "USD", "trend": "+12% vs trimestre anterior" },
    "active_leads": { "value": 103, "unit": "leads", "trend": "+8 esta semana" },
    "lead_response_time": { "value": 4.2, "unit": "horas", "trend": "-1.5h vs mes anterior" }
  },
  "period": "current_month"
}
```

---

### 3.5 `get_campaign_performance`

**Parametros recibidos**:
```json
{
  "campaignId": "camp01",   // opcional, si no se indica muestra resumen general
  "period": "month"          // opcional
}
```

**Implementacion**: Query a API2 sobre metricas de campanas.

**Respuesta esperada (campana especifica)**:
```json
{
  "campaign": {
    "id": "camp01",
    "name": "Promo Q1 2026",
    "channel": "email",
    "status": "active",
    "metrics": {
      "sent": 480,
      "delivered": 465,
      "opened": 210,
      "clicked": 85,
      "converted": 12,
      "unsubscribed": 3,
      "openRate": 45.2,
      "clickRate": 18.3,
      "conversionRate": 2.6,
      "roi": 340
    },
    "startDate": "2026-03-01",
    "endDate": "2026-03-31"
  }
}
```

**Respuesta esperada (resumen general)**:
```json
{
  "summary": {
    "totalCampaigns": 8,
    "activeCampaigns": 3,
    "avgOpenRate": 38.5,
    "avgClickRate": 12.1,
    "avgConversionRate": 2.1,
    "topCampaign": { "id": "camp01", "name": "Promo Q1 2026", "openRate": 45.2 }
  },
  "campaigns": [
    { "id": "camp01", "name": "Promo Q1 2026", "status": "active", "openRate": 45.2, "clickRate": 18.3 },
    { "id": "camp02", "name": "Newsletter Marzo", "status": "completed", "openRate": 32.1, "clickRate": 8.5 }
  ]
}
```

---

## Endpoints adicionales pendientes (de workstreams anteriores)

Estos endpoints fueron planificados en WS2 y WS4 y aun no estan implementados:

### E1: Memory Recall — Embedding de query

```
POST /api/lobechat-kb/query-embedding
Content-Type: application/json
Authorization: Bearer {jwt}

{
  "query": "texto de la consulta del usuario",
  "userId": "user123"
}

Response:
{
  "embedding": [0.123, -0.456, ...],   // vector 1024-dim (Cohere embed)
  "model": "embed-multilingual-v3.0"
}
```

**Uso**: El frontend envia la query del usuario para generar un embedding, luego busca memorias similares en la base vectorial local.

---

### E2: Memory Extractor — Extraer preferencias

```
POST /api/memory/extract
Content-Type: application/json
Authorization: Bearer {jwt}

{
  "messages": [
    { "role": "user", "content": "Siempre prefiero reuniones por la manana" },
    { "role": "assistant", "content": "Entendido, agendare tus reuniones en horario matutino" }
  ],
  "userId": "user123"
}

Response:
{
  "memories": [
    {
      "type": "preference",
      "content": "Prefiere reuniones por la manana",
      "confidence": 0.92
    }
  ]
}
```

**Uso**: Al finalizar una conversacion, el frontend envia los mensajes para extraer preferencias/hechos que se guardan como memoria del usuario.

---

### E3: Feedback Loop — Guardar rating

```
POST /api/feedback
Content-Type: application/json
Authorization: Bearer {jwt}

{
  "messageId": "msg_abc123",
  "sessionId": "sess_xyz789",
  "rating": "positive|negative",
  "comment": "Muy util la recomendacion",     // opcional
  "userId": "user123",
  "agentId": "budget-expert",                 // opcional
  "toolsUsed": ["list_leads", "get_lead"],    // opcional
  "metadata": {}                               // opcional
}

Response:
{
  "success": true,
  "feedbackId": "fb_001"
}
```

**Uso**: Cuando el usuario da thumbs up/down en un mensaje, el frontend envia el feedback para analytics y mejora continua.

---

## Headers requeridos en todas las llamadas a API2

```
Authorization: Bearer {jwt_del_usuario}
X-Development: {tenant_id}    // ej: "bodasdehoy", viene del header Development del frontend
Content-Type: application/json
```

---

## Notas de implementacion

1. **Autenticacion**: Todas las funciones requieren el JWT del usuario. api-ia ya lo recibe en el header Authorization del request original del chat.

2. **Multi-tenant**: El header `X-Development` (o `Development`) debe propagarse a API2. El tenant viene del frontend.

3. **Error handling**: Si una tool falla, devolver al LLM un JSON con `{ "error": true, "message": "descripcion del error" }` para que pueda informar al usuario.

4. **Funciones existentes reutilizables**:
   - `list_leads` → `GET /api/leads/list` (ya existe)
   - `get_lead` → `GET /api/leads/{id}` (ya existe)
   - `create_lead` → `POST /api/leads/save` (ya existe)
   - `update_lead_status` → `PUT /api/leads/{id}/status` (ya existe)
   - `add_note` (para leads) → `PUT /api/leads/{id}/notes` (ya existe)

5. **Funciones nuevas que requieren API2**:
   - Contacts (list, get)
   - Opportunities (list, get, update)
   - Campaigns (list, search, performance)
   - Tasks (create)
   - Analytics (pipeline, revenue, funnel, kpis)
   - Search CRM (full-text)
   - add_note (para contacts y opportunities)
   - send_message (email/whatsapp)

---

## Orden de prioridad sugerido

1. **Alta**: Funciones que ya tienen endpoint (leads) — solo conectar al tool system
2. **Alta**: `search_crm`, `list_contacts`, `list_opportunities` — las mas usadas por los agentes
3. **Media**: `create_task`, `add_note`, `update_opportunity_stage` — acciones frecuentes
4. **Media**: Analytics (pipeline, kpis, funnel) — los agentes de finanzas las necesitan
5. **Baja**: `send_message` — requiere integracion con servicio externo
6. **Baja**: Endpoints de Memory y Feedback — funcionan independiente de las tools
