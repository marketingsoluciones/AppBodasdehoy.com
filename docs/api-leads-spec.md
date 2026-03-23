# API Leads — Especificación para api-ia (Python/FastAPI)

> **Fecha:** Marzo 2026
> **Prioridad:** Alta
> **Contexto:** El frontend chat-ia necesita endpoints para capturar y gestionar leads permanentes de visitantes no registrados que interactúan con el chatbot.

---

## Modelo de datos (MongoDB collection: `leads`)

```json
{
  "_id": "ObjectId / UUID",
  "development": "bodasdehoy",
  "session_id": "abc123",
  "status": "new",
  "source": "chatbot",
  "contact": {
    "name": "",
    "email": "",
    "phone": ""
  },
  "qualifying_data": {
    "event_type": "",
    "event_date": "",
    "guest_count": 0,
    "budget": "",
    "location": "",
    "services_needed": []
  },
  "notes": [
    {
      "text": "",
      "created_at": "ISO datetime",
      "author": "ai|admin"
    }
  ],
  "created_at": "ISO datetime",
  "updated_at": "ISO datetime"
}
```

**Diferencia con visitor-data:** Los leads NO tienen TTL/expiración. Son permanentes.

---

## Endpoints requeridos

### 1. `POST /api/leads/save` — Upsert lead

**Upsert por:** `session_id` + `development`

**Headers:**
```
Content-Type: application/json
X-Development: bodasdehoy
```

**Body:**
```json
{
  "session_id": "abc123",
  "development": "bodasdehoy",
  "source": "chatbot",
  "contact": { "name": "Juan", "email": "juan@email.com", "phone": "+34666123456" },
  "qualifying_data": { "event_type": "boda", "guest_count": 150 }
}
```

**Comportamiento:**
- Si NO existe lead con ese `session_id` + `development`: crear nuevo con status `"new"`
- Si YA existe: mergear `contact` y `qualifying_data` (no sobreescribir campos existentes con vacíos)
- Actualizar `updated_at`

**Response:**
```json
{
  "success": true,
  "lead": { ... },
  "message": "Lead guardado"
}
```

---

### 2. `GET /api/leads/list` — Lista paginada con filtros

**Query params:**
- `development` (required): string
- `status` (optional): "new" | "contacted" | "qualified" | "converted" | "lost"
- `search` (optional): busca en contact.name, contact.email, contact.phone
- `page` (optional, default 1): int
- `limit` (optional, default 20): int

**Response:**
```json
{
  "success": true,
  "leads": [...],
  "total": 42,
  "page": 1,
  "total_pages": 3
}
```

---

### 3. `GET /api/leads/{lead_id}` — Detalle de un lead

**Response:**
```json
{
  "success": true,
  "lead": { ... }
}
```

---

### 4. `PUT /api/leads/{lead_id}/notes` — Agregar nota

**Body:**
```json
{
  "text": "Cliente contactado por WhatsApp",
  "author": "admin"
}
```

**Comportamiento:** Push a array `notes` con `created_at` auto-generado.

---

### 5. `PUT /api/leads/{lead_id}/status` — Cambiar status

**Body:**
```json
{
  "status": "contacted"
}
```

**Validar:** status debe ser uno de: `new`, `contacted`, `qualified`, `converted`, `lost`

---

### 6. `DELETE /api/leads/{lead_id}` — Eliminar lead

**Response:**
```json
{
  "success": true,
  "message": "Lead eliminado"
}
```

---

## Patrón a seguir

Seguir la misma estructura que `/api/visitor-data/`:
- Router en archivo separado (ej: `api/leads_router.py`)
- Registrar con `app.include_router(leads_router, prefix="/api/leads", tags=["leads"])`
- Usar MongoDB directamente (misma conexión que visitor-data)
- Sin autenticación requerida para `POST /api/leads/save` (lo llama el frontend del chatbot para visitantes)
- Los endpoints de listado/admin pueden requerir header `Authorization` si se desea

---

## Ejemplo de implementación (referencia)

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

router = APIRouter()

class LeadContact(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class LeadQualifyingData(BaseModel):
    event_type: Optional[str] = None
    event_date: Optional[str] = None
    guest_count: Optional[int] = None
    budget: Optional[str] = None
    location: Optional[str] = None
    services_needed: Optional[List[str]] = None

class SaveLeadRequest(BaseModel):
    session_id: str
    development: Optional[str] = "bodasdehoy"
    source: Optional[str] = "chatbot"
    contact: Optional[LeadContact] = None
    qualifying_data: Optional[LeadQualifyingData] = None

@router.post("/save")
async def save_lead(req: SaveLeadRequest):
    now = datetime.utcnow().isoformat()
    existing = await db.leads.find_one({
        "session_id": req.session_id,
        "development": req.development
    })

    if existing:
        # Merge: only update non-empty fields
        update = {"updated_at": now}
        if req.contact:
            for k, v in req.contact.dict(exclude_none=True).items():
                update[f"contact.{k}"] = v
        if req.qualifying_data:
            for k, v in req.qualifying_data.dict(exclude_none=True).items():
                update[f"qualifying_data.{k}"] = v

        await db.leads.update_one({"_id": existing["_id"]}, {"$set": update})
        updated = await db.leads.find_one({"_id": existing["_id"]})
        return {"success": True, "lead": serialize(updated), "message": "Lead actualizado"}
    else:
        lead = {
            "_id": str(uuid.uuid4()),
            "development": req.development,
            "session_id": req.session_id,
            "status": "new",
            "source": req.source,
            "contact": req.contact.dict() if req.contact else {},
            "qualifying_data": req.qualifying_data.dict() if req.qualifying_data else {},
            "notes": [],
            "created_at": now,
            "updated_at": now,
        }
        await db.leads.insert_one(lead)
        return {"success": True, "lead": serialize(lead), "message": "Lead creado"}
```
