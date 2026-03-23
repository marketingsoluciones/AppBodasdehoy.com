# Manual: Estructura de subida de fotos a R2

Este documento describe **cómo se suben fotos a Cloudflare R2** en el proyecto y **qué backend se usa** (api-ia vs api2), para poder comprobarlo y mantenerlo.

---

## Resumen rápido

| Pregunta | Respuesta |
|----------|-----------|
| **¿Quién sube a R2?** | El backend **api-ia** (Python). |
| **¿Usamos api2 para subir fotos?** | **No.** api2 se usa para GraphQL (eventos, usuarios, facturación, etc.), no para storage. |
| **Flujo** | Cliente (chat-ia) → Next.js `/api/storage/*` (proxy) → **api-ia** → R2. |

---

## 1. Flujo completo de subida

```
[Cliente / chat-ia]
       │
       │ 1. uploadFileToS3() con eventId
       │    (solo si NEXT_PUBLIC_USE_STORAGE_R2 === 'true')
       ▼
[Next.js - chat-ia]
       │ POST /api/storage/upload (FormData: file, event_id, access_level)
       │
       │ 2. Proxy con BACKEND_URL / NEXT_PUBLIC_BACKEND_URL
       ▼
[api-ia - backend Python]
       │ POST /api/storage/events/{eventId}/upload?access_level=shared
       │ Headers: X-Development, X-User-ID, X-User-Email
       │
       │ 3. Backend escribe en Cloudflare R2
       ▼
[R2]
```

- **Cliente:** `apps/chat-ia/src/services/upload.ts` → `uploadToStorageR2()` llama a `fetch('/api/storage/upload', …)`.
- **Proxy:** `apps/chat-ia/src/app/(backend)/api/storage/upload/route.ts` reenvía a `backendUrl + /api/storage/events/${eventId}/upload`.
- **Backend URL:** `process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api-ia.bodasdehoy.com'` → siempre **api-ia**, no api2.

---

## 2. Condiciones para usar R2

En el cliente (upload):

- `NEXT_PUBLIC_USE_STORAGE_R2 === 'true'`.
- Se pasa `eventId` en las opciones de `uploadFileToS3`.

Si no se cumple, se usa el flujo S3 tradicional (Lambda/client S3, etc.).

Código relevante:

- `apps/chat-ia/src/services/upload.ts`: líneas 91–116 (detección `useStorageR2` y llamada a `uploadToStorageR2`).
- `apps/chat-ia/src/store/file/slices/upload/action.ts`: obtiene `eventId` de `localStorage` (`dev-user-config`) y lo pasa a `uploadFileToS3`.

---

## 3. API de storage en chat-ia (proxy a api-ia)

Todas estas rutas son **proxies** al backend **api-ia**. No llaman a api2.

| Método | Ruta (Next.js) | Destino en api-ia |
|--------|----------------|--------------------|
| POST   | `/api/storage/upload` | `POST /api/storage/events/{eventId}/upload?access_level=...` |
| GET    | `/api/storage/upload?event_id=...&file_type=...` | `GET /api/storage/events/{eventId}/files?...` |
| GET    | `/api/storage/files/[fileId]?version=...&event_id=...` | `GET /api/storage/files/{fileId}?...` |
| DELETE | `/api/storage/files/[fileId]?event_id=...` | `DELETE /api/storage/files/{fileId}?...` |

Archivos en el repo:

- `apps/chat-ia/src/app/(backend)/api/storage/upload/route.ts` (POST y GET listado).
- `apps/chat-ia/src/app/(backend)/api/storage/files/[fileId]/route.ts` (GET y DELETE).

En todos ellos, `backendUrl` es `BACKEND_URL` / `NEXT_PUBLIC_BACKEND_URL` con fallback `https://api-ia.bodasdehoy.com`.

---

## 4. Formato de la subida (POST)

### Cliente → Next.js (`/api/storage/upload`)

- **Content-Type:** `multipart/form-data` (FormData).
- **Body (FormData):**
  - `file`: `File` (obligatorio).
  - `event_id`: string (opcional; por defecto `"default"`).
  - `access_level`: `"original"` | `"shared"` | `"public"` (por defecto `"shared"`).
- **Headers opcionales (desde localStorage `dev-user-config`):**
  - `X-User-ID`
  - `X-Development`

### Next.js → api-ia

- **URL:** `{BACKEND_URL}/api/storage/events/{eventId}/upload?access_level={accessLevel}`  
  Ejemplo: `https://api-ia.bodasdehoy.com/api/storage/events/abc123/upload?access_level=shared`
- **Body:** mismo FormData (`file` + `access_level`; el proxy no reenvía `event_id` en el body, va en la URL).
- **Headers:** `X-Development`, `X-User-Email`, `X-User-ID` (sin `Content-Type`; FormData genera el boundary).

### Respuesta esperada de api-ia (éxito)

- JSON con `success: true` y algo como:
  - `data.public_urls.original`
  - `data.public_urls.optimized_800w`
  - `data.public_urls.thumbnail`
- El cliente en `upload.ts` mapea eso a `FileMetadata` con `path` = una de esas URLs.

### Respuesta de captación (usuario guest)

- Si el backend detecta usuario no registrado: `is_guest: true`, `action_required: 'register'`, más `message`, `cta`, etc.
- El cliente muestra el flujo de captación y no considera la subida “exitosa”.

---

## 5. Listar archivos y obtener URL / eliminar

- **Listar:** `GET /api/storage/upload?event_id=...&file_type=photos|documents|videos|audio`  
  Implementado en `storage-r2.ts` → `listEventFiles(eventId, fileType)`.
- **URL de un archivo:** `GET /api/storage/files/{fileId}?version=original|optimized_800w|optimized_400w|thumbnail&event_id=...`  
  → `getFileUrl(fileId, version, eventId)`.
- **Eliminar:** `DELETE /api/storage/files/{fileId}?event_id=...`  
  → `deleteFile(fileId, eventId)`.

Todos estos llaman a las rutas Next.js anteriores, que hacen proxy a **api-ia**, no a api2.

---

## 6. Comprobar en api2 y api-ia

### En api2 (GraphQL)

- api2 **no** tiene endpoints de subida de archivos a R2 en este flujo.
- En api2 se consultan eventos, usuarios, facturación, notificaciones, etc. (`api2.eventosorganizador.com/graphql`).
- Para “comprobar en api2” la subida de fotos: no hay nada que comprobar ahí; la subida no pasa por api2.

### En api-ia (Python)

- **Subida:**  
  `POST https://api-ia.bodasdehoy.com/api/storage/events/{eventId}/upload?access_level=shared`  
  con FormData (`file`, `access_level`) y headers `X-Development`, `X-User-ID`, `X-User-Email`.
- **Listado:**  
  `GET https://api-ia.bodasdehoy.com/api/storage/events/{eventId}/files?file_type=...`
- **URL de archivo:**  
  `GET https://api-ia.bodasdehoy.com/api/storage/files/{fileId}?version=...&event_id=...`
- **Eliminar:**  
  `DELETE https://api-ia.bodasdehoy.com/api/storage/files/{fileId}?event_id=...`

Para comprobar la subida a R2 hay que verificar que **api-ia** exponga estos endpoints y que escriba/lea en R2 (configuración y código del backend Python, fuera de este repo).

---

## 7. Variables de entorno relevantes

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_USE_STORAGE_R2` | `'true'` para que el cliente use R2 (vía api-ia) en lugar de S3. |
| `BACKEND_URL` / `NEXT_PUBLIC_BACKEND_URL` | Base URL del backend; en producción suele ser `https://api-ia.bodasdehoy.com`. Usado por las rutas `/api/storage/*` para hacer proxy a api-ia. |

---

## 8. Referencia rápida de archivos

| Qué | Dónde |
|-----|--------|
| Lógica de subida (R2 vs S3, llamada a `/api/storage/upload`) | `apps/chat-ia/src/services/upload.ts` |
| Proxy POST/GET listado | `apps/chat-ia/src/app/(backend)/api/storage/upload/route.ts` |
| Proxy GET/DELETE por fileId | `apps/chat-ia/src/app/(backend)/api/storage/files/[fileId]/route.ts` |
| Cliente listado/URL/delete R2 | `apps/chat-ia/src/services/storage-r2.ts` |
| Uso en store (eventId, uploadFileToS3) | `apps/chat-ia/src/store/file/slices/upload/action.ts` |
| UI que usa R2 (lista de archivos) | `apps/chat-ia/src/features/Portal/Home/Body/Files/` |

---

**Conclusión:** La subida de fotos a R2 está implementada usando **api-ia** (backend Python) como único backend de storage. **api2 no se usa para subir fotos**; solo para datos de negocio (GraphQL). Para comprobar la subida a R2 hay que revisar y probar los endpoints de **api-ia** indicados arriba.
