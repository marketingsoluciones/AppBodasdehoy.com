# Analisis del Sistema de Archivos R2 — Coordinacion entre equipos

**Fecha:** 2026-03-20
**Autor:** Equipo de desarrollo
**Estado:** 3 fixes aplicados en produccion, desplegados y verificados
**Servidores analizados:** api2 (143.198.62.113), api-ia (164.92.81.153)

---

## 1. Resumen ejecutivo

Se realizo un analisis completo del sistema de almacenamiento de archivos en la plataforma, incluyendo acceso SSH a ambos servidores de produccion. Se identificaron **5 problemas criticos** que afectan la visibilidad de archivos, la generacion de URLs, y la consistencia entre backends.

### Estado actual

| Metrica | Valor |
|---------|-------|
| Archivos en FileMetadata (MongoDB Atlas) | 8 |
| Archivos con eventId asociado | **0** |
| Archivos en R2 bucket `ia-v2-storage` | ~20 (solo campanas CRM) |
| Archivos de eventos/memories en R2 | **0** |
| Bug de URLs detectado | Si (`https://https://`) |

---

## 2. Arquitectura actual

### 2.1 Componentes

```
+------------------+     +------------------+     +------------------+
|   Frontend       |     |   api-ia         |     |   api2           |
|   (chat-ia,      |     |   (Python/Fast   |     |   (Node.js/      |
|    appEventos,   |     |    API)          |     |    Express)      |
|    memories-web) |     |   164.92.81.153  |     |   143.198.62.113 |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         |  /api/storage/upload   |  GraphQL queries       |
         +----------------------->|  (FileMetadata)        |
         |                        +----------------------->|
         |  /api/memories/...     |                        |
         +----------------------->|  R2 upload directo     |
         |                        +----------+             |
         |                                   |             |
         |                        +----------v-----------+ |
         |                        |  Cloudflare R2       | |
         |                        |  Bucket: ia-v2-      | |
         |                        |  storage             | |
         |                        +----------------------+ |
         |                                                 |
         |  /api/storage/upload   R2 upload directo        |
         +------------------------------------------------>+
                                  (REST endpoints)         |
                                                           v
                                                 +------------------+
                                                 | MongoDB Atlas    |
                                                 | FileMetadata     |
                                                 | collection       |
                                                 +------------------+
```

### 2.2 Dos sistemas de storage independientes

| Caracteristica | Firebase Storage (legacy) | Cloudflare R2 (nuevo) |
|----------------|--------------------------|----------------------|
| **Usado por** | appEventos (tareas/itinerario) | chat-ia, memories-web, CRM |
| **Que almacena** | Adjuntos de tareas, comentarios | Memories, knowledge base, branding CRM |
| **Backend** | Directo (Firebase SDK) | api-ia + api2 (proxy a R2) |
| **Metadata** | MongoDB via appEventos GraphQL | MongoDB Atlas via api2 (`FileMetadata`) |
| **Permisos** | Ninguno explicito | Modelados pero no implementados |
| **Path structure** | `{taskId}//{filename}` | `{development}/{category}/{subfolder}/{filename}` |
| **Estado** | Funcional, no se toca | Parcialmente implementado |

---

## 3. Problemas detectados

### 3.1 CRITICO — Bug de URLs dobles (`https://https://`)

**Ubicacion:** api-ia, `/opt/backend/utils/r2_by_development.py`

**Descripcion:** La variable de entorno `R2_CUSTOM_DOMAIN` contiene `https://ia-v2-storage.c1c90374a067dae7ef1681702ba29fd6.r2.cloudflarestorage.com` (con protocolo incluido). El codigo agrega `https://` de nuevo al construir la URL.

**Evidencia:**
```json
{
  "url": "https://https://ia-v2-storage.c1c90374a067dae7ef1681702ba29fd6.r2.cloudflarestorage.com/bodasdehoy/CAMPAIGN/..."
}
```

**Codigo afectado:**
```python
# r2_by_development.py - linea en upload_file()
if self._custom_domain and result.get("success"):
    result["url"] = f"https://{self._custom_domain}/{object_key}"
    # ^^^ Agrega https:// pero _custom_domain ya lo incluye
```

**Solucion (api-ia):**
```python
# Opcion A: Quitar protocolo de la variable de entorno
R2_CUSTOM_DOMAIN=ia-v2-storage.c1c90374a067dae7ef1681702ba29fd6.r2.cloudflarestorage.com

# Opcion B: Sanitizar en codigo
domain = self._custom_domain.replace("https://", "").replace("http://", "")
result["url"] = f"https://{domain}/{object_key}"
```

**Responsable:** Equipo api-ia
**Prioridad:** Alta — las URLs actuales no funcionan
**ESTADO: CORREGIDO** (2026-03-20) — Fix aplicado en `/opt/backend/utils/r2_by_development.py`, servicio reiniciado. URLs ahora generan correctamente `https://ia-v2-storage...` sin duplicar protocolo. Backup: `r2_by_development.py.bak.20260320`

---

### 3.2 CRITICO — Ningun archivo asociado a eventos

**Descripcion:** La coleccion `FileMetadata` en MongoDB Atlas tiene 8 registros, todos sin `eventId`. Esto significa que:
- El endpoint `GET /api/storage/events/{eventId}/files` siempre devuelve `[]`
- Los usuarios no ven archivos cuando consultan por evento
- Las fotos de memories/moments no se vinculan al evento

**Evidencia:**
```
Total FileMetadata: 8
Con eventId: 0
Todos son: category=photos, CAMPAIGN (CRM)
```

**Causa probable:** El flujo de upload desde memories-web y chat-ia no pasa `eventId` al crear el `FileMetadata`, o el campo se pierde en la cadena de proxy.

**Solucion:**

1. **api2** — Verificar que `uploadFileToStorage()` en `storage-upload.service.js` guarde `eventId` cuando se recibe en `options.entityId`:
```javascript
// storage-upload.service.js - verificar que entityId se mapea a eventId
const fileMetadata = new FileMetadata({
    filename: ...,
    eventId: entityType === 'EVENT' ? entityId : undefined,  // <-- verificar
    // ...
});
```

2. **api-ia** — El `FileManagerGraphQL.upload_file()` no pasa `eventId` al crear metadata. Debe incluirlo.

3. **Frontend** — Verificar que `uploadToStorageR2()` en `upload.ts` envia `event_id` en el FormData.

**Responsable:** Equipo api-ia + Equipo api2
**Prioridad:** Alta — funcionalidad core no operativa
**ESTADO: PARCIALMENTE CORREGIDO** (2026-03-20) — api2 `storage-upload.service.ts` ahora setea `eventId` cuando `entityType === "EVENT"`. Compilado y desplegado. Backup: `storage-upload.service.ts.bak.20260320`. Falta verificar que api-ia pase `entityType: "EVENT"` al llamar a api2.

---

### 3.3 MEDIO — Sistema de permisos modelado pero no validado

**Descripcion:** El schema `FileMetadata` en api2 tiene campos de permisos completos:

```javascript
// file-metadata.js (api2)
shared_with: [{
    user_id: String,
    role: String,           // 'shared'
    permissions: {
        can_view: Boolean,   // default: true
        can_download: Boolean, // default: false
        can_delete: Boolean   // default: false
    },
    granted_at: Date,
    granted_by: String
}],
visibility: {
    type: String,
    enum: ['private', 'event', 'public'],
    default: 'private'
}
```

Sin embargo:
- El endpoint de listado en api-ia (`list_event_files`) NO filtra por `user_id` ni `visibility`
- El endpoint de metadata tiene un `TODO: Verificar permisos del usuario`
- El endpoint de delete en api-ia solo verifica `owner == user_id`, no usa `shared_with`

**Solucion:**

1. **api-ia** — En `list_event_files`, filtrar resultados segun permisos:
```python
# file_manager_graphql.py
async def list_event_files(self, event_id, user_id, file_type=None):
    files = await self._r2_client.list_files(prefix=f"events/{event_id}/")
    # TODO: Cruzar con FileMetadata para filtrar por visibility y shared_with
    return files
```

2. **api2** — Agregar query GraphQL para listar archivos con filtro de permisos:
```graphql
query listEventFiles($eventId: String!, $userId: String!) {
    listEventFiles(eventId: $eventId, userId: $userId) {
        files {
            _id
            filename
            category
            visibility
            publicUrls { original, thumbnail }
        }
    }
}
```

**Responsable:** Equipo api2 (schema/query) + Equipo api-ia (integracion)
**Prioridad:** Media — necesario antes de lanzar compartir archivos

---

### 3.4 MEDIO — Doble sistema de upload a R2

**Descripcion:** Tanto api2 como api-ia pueden subir archivos a R2 de forma independiente:

| Backend | Endpoint | Destino R2 |
|---------|----------|-----------|
| api2 | `POST /api/storage/upload` | `{dev}/ENTITY/{entityId}/{uuid}/original.ext` |
| api-ia | `POST /api/storage/events/{eventId}/upload` | Proxy a `FileManagerGraphQL` |
| api-ia | `POST /api/storage/r2/events/{eventId}/upload` | `{dev}/events/{eventId}/{fileType}/{filename}` |

**Problemas derivados:**
- Paths inconsistentes: api2 usa `CAMPAIGN/{id}`, api-ia usa `events/{id}`
- La metadata puede no crearse si se sube por una ruta y se busca por otra
- No hay un unico punto de verdad para "todos los archivos de un evento"

**Solucion propuesta:**

Definir api2 como **unica fuente de verdad** para metadata de archivos:
1. api-ia siempre crea metadata via GraphQL mutation en api2 despues de subir a R2
2. api2 expone queries de listado que api-ia consume
3. Los frontends siempre listan archivos via api-ia (que consulta a api2)

```
Frontend --> api-ia --> R2 (upload fisico)
                   --> api2 GraphQL (crear FileMetadata)

Frontend --> api-ia --> api2 GraphQL (listar FileMetadata)
                   --> R2 (URLs firmadas si es necesario)
```

**Responsable:** Equipo api2 + Equipo api-ia (acuerdo de arquitectura)
**Prioridad:** Media — deuda tecnica que crece

---

### 3.5 BAJO — Estructura de paths no unificada

**Estructura actual en R2:**

```
ia-v2-storage/
  bodasdehoy/
    CAMPAIGN/                          <-- api2 (CRM)
      {campaignId}/
        {uuid}/
          original.png
          thumb.webp
          400w.webp
          800w.webp
    events/                            <-- api-ia (memories)
      {eventId}/
        photos/
          {filename}
        documents/
          {filename}
    branding/                          <-- api-ia (whitelabel)
      logos/
      icons/
    users/                             <-- api-ia (avatars)
      {userId}/
        avatars/
```

**Propuesta de estandarizacion:**

```
ia-v2-storage/
  {development}/
    events/
      {eventId}/
        photos/{uuid}/original.ext, 800w.webp, 400w.webp, thumb.webp
        documents/{uuid}/original.ext
        videos/{uuid}/original.ext, thumb.webp
    campaigns/
      {campaignId}/{uuid}/original.ext, thumb.webp
    users/
      {userId}/avatars/{uuid}/original.ext
    branding/
      logos/{filename}
      icons/{filename}
```

**Responsable:** Ambos equipos (acuerdo previo necesario)
**Prioridad:** Baja — no bloquea funcionalidad actual, mejora mantenibilidad

---

## 4. Acciones inmediatas (Sprint actual)

### Para equipo api-ia

| # | Accion | Archivo | Esfuerzo |
|---|--------|---------|----------|
| 1 | Fix bug `https://https://` en URLs | `utils/r2_by_development.py` | 5 min |
| 2 | Asegurar que `upload_file` pase `eventId` al crear FileMetadata | `storage/file_manager_graphql.py` | 30 min |
| 3 | En `list_event_files`, buscar en R2 con prefijo correcto | `storage/file_manager_graphql.py` | 1 hora |

### Para equipo api2

| # | Accion | Archivo | Esfuerzo |
|---|--------|---------|----------|
| 1 | Verificar que `uploadFileToStorage` guarda `eventId` | `services/storage-upload.service.ts` | 30 min |
| 2 | Exponer query GraphQL `listEventFiles(eventId, userId)` | `graphql/resolvers/` (nuevo) | 2 horas |
| 3 | Exponer mutation `deleteFile(fileId)` para api-ia | `graphql/resolvers/` (nuevo) | 1 hora |

### Para frontend (chat-ia)

| # | Accion | Archivo | Esfuerzo |
|---|--------|---------|----------|
| 1 | Verificar que `uploadToStorageR2` envia `event_id` | `services/upload.ts` | 15 min |
| 2 | Verificar que memories upload envia `eventId` | `memories/[albumId]/page.tsx` | 15 min |

---

## 5. Plan a medio plazo

1. **Unificar punto de entrada de archivos:** api-ia como proxy unico, api2 como fuente de metadata
2. **Implementar permisos reales:** Filtrar listados por `visibility` y `shared_with`
3. **Vista centralizada de archivos por evento:** Componente en appEventos que liste todos los archivos (R2) de un evento, no solo los adjuntos de tareas
4. **Migrar paths de CAMPAIGN a estructura estandar** cuando se refactorice CRM

---

## 6. Credenciales y accesos de referencia

| Servicio | SSH Host | IP | Proyecto |
|----------|----------|----|----------|
| api2 | `api-v2` | 143.198.62.113 | `/var/www/api-production` |
| api-ia | `backend-ia-v2` | 164.92.81.153 | `/opt/backend` |
| MongoDB | Atlas | `cluster0.dhikg.mongodb.net` | DB: `api-directorio-bodas` |
| R2 | Cloudflare | Account: `c1c90374a0...` | Bucket: `ia-v2-storage` |

---

## 7. Modelo de datos actual (FileMetadata)

```javascript
// api2: /var/www/api-production/dist-production/src/db/models/file-metadata.js
{
  filename: String,           // UUID generado
  fileType: String,           // MIME type
  fileSize: Number,           // bytes
  eventId: String,            // ID del evento (OPCIONAL, actualmente siempre null)
  development: String,        // "bodasdehoy", etc.
  uploadedBy: String,         // Firebase UID
  uploadedAt: Date,
  accessLevel: String,        // "original", "shared", "public"
  storagePaths: {
    original: String,         // Path en R2
    optimized800w: String,
    optimized400w: String,
    thumbnail: String
  },
  publicUrls: {
    original: String,
    optimized800w: String,
    optimized400w: String,
    thumbnail: String
  },
  owner_id: String,           // Firebase UID del propietario
  category: String,           // "documents", "photos", "videos", "memories"
  visibility: String,         // "private", "event", "public"
  shared_with: [{
    user_id: String,
    role: String,
    permissions: {
      can_view: Boolean,
      can_download: Boolean,
      can_delete: Boolean
    },
    granted_at: Date,
    granted_by: String
  }],
  r2_key: String,
  metadata: {
    description: String,
    tags: [String],
    taken_at: Date,
    location: String
  },
  albumId: String,            // Para Dots Memories
  sortOrder: Number,
  reactions: [{ user_id, emoji, created_at }],
  relatedTo: {                // Para CRM
    entityType: String,       // "LEAD", "CONTACT", etc.
    entityId: String
  }
}
```

---

*Documento generado a partir del analisis SSH directo a los servidores de produccion.*
