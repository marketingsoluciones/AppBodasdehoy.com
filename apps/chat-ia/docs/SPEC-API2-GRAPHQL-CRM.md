# Especificacion: Queries y Mutations GraphQL para CRM/ERP

**Fecha**: 2026-03-22
**De**: Equipo Frontend (chat-ia / Copilot IA)
**Para**: Equipo API2 (GraphQL — api2.eventosorganizador.com)
**Prioridad**: Alta

---

## Contexto

El Copilot IA necesita acceder a datos CRM/ERP desde api-ia. api-ia se conecta a API2 via GraphQL para obtener/modificar datos. Se necesitan los siguientes queries y mutations nuevos.

**Endpoint**: `https://api2.eventosorganizador.com/graphql`

**Headers requeridos en cada request**:
```
Authorization: Bearer {jwt}
X-Development: {tenant_id}
Content-Type: application/json
```

---

## Queries nuevos requeridos

### Q1: getContacts

Lista contactos del CRM con filtros opcionales.

```graphql
query getContacts(
  $development: String!
  $pagination: CRM_PaginationInput
  $search: String
  $segment: String
) {
  getContacts(
    development: $development
    pagination: $pagination
    search: $search
    segment: $segment
  ) {
    contacts {
      _id
      name
      email
      phone
      company
      position
      segments
      lastContact
      status
      createdAt
      updatedAt
    }
    total
    page
    limit
  }
}
```

**Input type (si no existe)**:
```graphql
input CRM_PaginationInput {
  page: Int      # default 1
  limit: Int     # default 20
}
```

---

### Q2: getContact

Detalle completo de un contacto.

```graphql
query getContact(
  $contactId: ID!
  $development: String!
) {
  getContact(
    contactId: $contactId
    development: $development
  ) {
    _id
    name
    email
    phone
    company
    position
    segments
    notes {
      _id
      text
      author
      createdAt
    }
    opportunities {
      _id
      title
      value
      stage
    }
    campaigns {
      _id
      name
    }
    lastContact
    status
    createdAt
    updatedAt
  }
}
```

---

### Q3: getOpportunities

Lista oportunidades de venta con filtros.

```graphql
query getOpportunities(
  $development: String!
  $stage: String
  $minValue: Float
  $pagination: CRM_PaginationInput
) {
  getOpportunities(
    development: $development
    stage: $stage
    minValue: $minValue
    pagination: $pagination
  ) {
    opportunities {
      _id
      title
      value
      stage
      probability
      contact {
        _id
        name
        email
      }
      lead {
        _id
        name
      }
      expectedCloseDate
      createdAt
      updatedAt
    }
    total
    totalValue
  }
}
```

---

### Q4: getOpportunity

Detalle completo de una oportunidad.

```graphql
query getOpportunity(
  $opportunityId: ID!
  $development: String!
) {
  getOpportunity(
    opportunityId: $opportunityId
    development: $development
  ) {
    _id
    title
    value
    stage
    probability
    contact {
      _id
      name
      email
      phone
      company
    }
    lead {
      _id
      name
    }
    activities {
      type
      date
      summary
      author
    }
    notes {
      _id
      text
      author
      createdAt
    }
    expectedCloseDate
    createdAt
    updatedAt
  }
}
```

---

### Q5: getCampaigns

Lista campanas de marketing.

```graphql
query getCampaigns(
  $development: String!
  $status: String
  $channel: String
  $pagination: CRM_PaginationInput
) {
  getCampaigns(
    development: $development
    status: $status
    channel: $channel
    pagination: $pagination
  ) {
    campaigns {
      _id
      name
      status
      channel
      audienceSize
      sent
      opened
      clicked
      converted
      startDate
      endDate
      createdAt
    }
    total
  }
}
```

---

### Q6: searchCRM

Busqueda full-text en entidades CRM.

```graphql
query searchCRM(
  $development: String!
  $query: String!
  $entity: String
) {
  searchCRM(
    development: $development
    query: $query
    entity: $entity
  ) {
    results {
      entity
      entityId
      name
      matchField
      snippet
      score
    }
    totalResults
  }
}
```

**Notas de implementacion**:
- Si `entity` es null, buscar en leads, contacts, opportunities y campaigns.
- Buscar en campos: name, email, company, title, notes.text.
- Usar MongoDB text index o regex para la busqueda.
- Devolver max 20 resultados ordenados por relevancia.

---

### Q7: getPipelineSummary

Resumen del pipeline de ventas.

```graphql
query getPipelineSummary(
  $development: String!
  $period: String
) {
  getPipelineSummary(
    development: $development
    period: $period
  ) {
    period
    stages {
      stage
      count
      value
    }
    totalOpportunities
    totalValue
    weightedValue
    avgDealSize
  }
}
```

**Logica**: Aggregation sobre oportunidades, agrupando por `stage`. El `period` filtra por `createdAt` (week = ultimos 7 dias, month = ultimo mes, quarter = ultimos 3 meses).

---

### Q8: getRevenueReport

Reporte de ingresos por periodo.

```graphql
query getRevenueReport(
  $development: String!
  $dateFrom: String
  $dateTo: String
  $groupBy: String
) {
  getRevenueReport(
    development: $development
    dateFrom: $dateFrom
    dateTo: $dateTo
    groupBy: $groupBy
  ) {
    dateFrom
    dateTo
    groupBy
    data {
      period
      revenue
      deals
    }
    totalRevenue
    totalDeals
    avgRevenuePerDeal
  }
}
```

**Logica**: Aggregation sobre oportunidades con `stage = "closed_won"`, agrupando por el campo `groupBy` (day/week/month) basado en la fecha de cierre.

---

### Q9: getLeadFunnel

Embudo de conversion de leads.

```graphql
query getLeadFunnel(
  $development: String!
  $period: String
  $source: String
) {
  getLeadFunnel(
    development: $development
    period: $period
    source: $source
  ) {
    period
    source
    funnel {
      stage
      count
      percentage
    }
    conversionRate
    topSources {
      source
      count
      conversionRate
    }
  }
}
```

**Logica**: Aggregation sobre leads agrupando por `status`. El `percentage` es relativo al total de leads del periodo. `topSources` agrupa por campo `source` y calcula conversion para cada una.

---

### Q10: getKPIs

Metricas clave del negocio.

```graphql
query getKPIs(
  $development: String!
  $metrics: [String!]!
) {
  getKPIs(
    development: $development
    metrics: $metrics
  ) {
    metrics {
      key
      value
      unit
      trend
    }
    period
  }
}
```

**Metricas a calcular**:

| key | Calculo | unit |
|-----|---------|------|
| `conversion_rate` | (leads con status=converted / total leads) * 100 | % |
| `avg_deal_size` | avg(value) de opportunities con stage=closed_won | USD |
| `lead_response_time` | avg(primera interaccion - createdAt) de leads | horas |
| `revenue` | sum(value) de opportunities con stage=closed_won del mes actual | USD |
| `active_leads` | count(leads) donde status NOT IN (converted, lost) | leads |

**trend**: Comparar con el periodo anterior (mes anterior) y devolver string como "+5% vs mes anterior" o "-2 vs semana anterior".

---

### Q11: getCampaignPerformance

Rendimiento de una campana o resumen general.

```graphql
query getCampaignPerformance(
  $campaignId: ID
  $development: String!
  $period: String
) {
  getCampaignPerformance(
    campaignId: $campaignId
    development: $development
    period: $period
  ) {
    # Si campaignId presente: datos de esa campana
    campaign {
      _id
      name
      channel
      status
      metrics {
        sent
        delivered
        opened
        clicked
        converted
        unsubscribed
        openRate
        clickRate
        conversionRate
        roi
      }
      startDate
      endDate
    }
    # Si campaignId null: resumen general
    summary {
      totalCampaigns
      activeCampaigns
      avgOpenRate
      avgClickRate
      avgConversionRate
    }
  }
}
```

---

## Mutations nuevas requeridas

### M1: updateOpportunity

Actualiza etapa y/o valor de una oportunidad.

```graphql
mutation updateOpportunity(
  $opportunityId: ID!
  $input: OpportunityUpdateInput!
  $development: String!
) {
  updateOpportunity(
    opportunityId: $opportunityId
    input: $input
    development: $development
  ) {
    _id
    title
    stage
    value
    updatedAt
  }
}

input OpportunityUpdateInput {
  stage: String
  value: Float
  probability: Int
  expectedCloseDate: String
}
```

---

### M2: createTask

Crea una tarea de seguimiento.

```graphql
mutation createTask(
  $input: TaskCreateInput!
  $development: String!
) {
  createTask(
    input: $input
    development: $development
  ) {
    _id
    title
    description
    dueDate
    assignee
    relatedEntity
    relatedEntityId
    status
    createdAt
  }
}

input TaskCreateInput {
  title: String!
  description: String
  dueDate: String
  assignee: String
  relatedEntity: String    # "lead", "contact", "opportunity"
  relatedEntityId: ID
}
```

---

### M3: addNote

Agrega una nota a un contacto u oportunidad. (Para leads ya existe endpoint REST en api-ia.)

```graphql
mutation addNote(
  $entityType: String!
  $entityId: ID!
  $text: String!
  $development: String!
) {
  addNote(
    entityType: $entityType
    entityId: $entityId
    text: $text
    development: $development
  ) {
    _id
    text
    author
    createdAt
  }
}
```

`entityType` puede ser `"contact"` o `"opportunity"`.

---

## Modelos de datos sugeridos (MongoDB collections)

Si no existen estas colecciones, se sugiere crearlas:

### contacts
```json
{
  "_id": ObjectId,
  "development": "tenant_id",
  "name": String,
  "email": String,
  "phone": String,
  "company": String,
  "position": String,
  "segments": [String],
  "notes": [{ "text": String, "author": String, "createdAt": Date }],
  "status": String,
  "lastContact": Date,
  "createdAt": Date,
  "updatedAt": Date
}
```

### opportunities
```json
{
  "_id": ObjectId,
  "development": "tenant_id",
  "title": String,
  "value": Number,
  "stage": String,       // prospecting, qualification, proposal, negotiation, closed_won, closed_lost
  "probability": Number,  // 0-100
  "contactId": ObjectId,
  "leadId": ObjectId,
  "expectedCloseDate": Date,
  "activities": [{ "type": String, "date": Date, "summary": String, "author": String }],
  "notes": [{ "text": String, "author": String, "createdAt": Date }],
  "createdAt": Date,
  "updatedAt": Date
}
```

### campaigns
```json
{
  "_id": ObjectId,
  "development": "tenant_id",
  "name": String,
  "status": String,       // draft, active, paused, completed
  "channel": String,      // email, whatsapp, social, ads
  "audienceSize": Number,
  "sent": Number,
  "delivered": Number,
  "opened": Number,
  "clicked": Number,
  "converted": Number,
  "unsubscribed": Number,
  "startDate": Date,
  "endDate": Date,
  "createdAt": Date,
  "updatedAt": Date
}
```

### tasks
```json
{
  "_id": ObjectId,
  "development": "tenant_id",
  "title": String,
  "description": String,
  "dueDate": Date,
  "assignee": String,
  "relatedEntity": String,    // "lead", "contact", "opportunity"
  "relatedEntityId": ObjectId,
  "status": String,           // pending, in_progress, completed
  "createdAt": Date,
  "updatedAt": Date
}
```

---

## Indices requeridos

Para que las queries de busqueda y analytics sean performantes:

```javascript
// Text search
db.contacts.createIndex({ name: "text", email: "text", company: "text" });
db.opportunities.createIndex({ title: "text" });
db.campaigns.createIndex({ name: "text" });

// Filtros comunes
db.contacts.createIndex({ development: 1, segments: 1 });
db.opportunities.createIndex({ development: 1, stage: 1 });
db.opportunities.createIndex({ development: 1, stage: 1, createdAt: -1 });
db.campaigns.createIndex({ development: 1, status: 1, channel: 1 });
db.tasks.createIndex({ development: 1, relatedEntity: 1, relatedEntityId: 1 });
db.tasks.createIndex({ development: 1, dueDate: 1, status: 1 });
```

---

## Orden de prioridad sugerido

### Prioridad ALTA (bloquean funcionalidad core):
1. `getContacts` + `getContact` — Los agentes de contactos y ventas dependen de esto
2. `getOpportunities` + `getOpportunity` + `updateOpportunity` — Pipeline es la funcion principal
3. `searchCRM` — Busqueda es critica para el Copilot

### Prioridad MEDIA (analytics y acciones):
4. `createTask` — Agentes de ventas y seguimiento lo necesitan
5. `addNote` — Todas las acciones de registro de notas
6. `getPipelineSummary` + `getLeadFunnel` — Agentes de finanzas y analytics
7. `getKPIs` — Dashboard del Copilot

### Prioridad BAJA (complementarios):
8. `getCampaigns` + `getCampaignPerformance` — Marketing analytics
9. `getRevenueReport` — Reportes financieros avanzados

---

## Notas

- Todos los queries deben filtrar por `development` (multi-tenant).
- Los IDs pueden ser strings (MongoDB ObjectId como string) — api-ia los pasa tal cual.
- Si una coleccion no existe todavia, retornar arrays vacios en vez de error.
- Paginacion default: page=1, limit=20.
- Fechas en formato ISO 8601 (strings). API2 las convierte a Date internamente.
