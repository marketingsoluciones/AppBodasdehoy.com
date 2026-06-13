# 🗺️ PLAN DE SOLUCIÓN — cómo se arregla cada cosa y en qué orden

**Fecha:** 2026-06-13 · Estado verificado en vivo. Ordenado por DEPENDENCIAS (qué desbloquea qué).

---

## 🎯 OBJETIVO
Mensajería omnicanal funcionando (WhatsApp completo + Meta), KB usable, eventos estables.
Hoy: arquitectura correcta, pero bloqueada por **3 cosas de backend** y **2 cableos de front**.

---

## FASE 1 — DESBLOQUEAR MENSAJERÍA (lo de mayor impacto)

### 1A. 🔴 Redis para mensajería — **DRI: api-ia** [BLOQUEADOR #1]
- **Problema:** `/api/messages/send` → "storage_unavailable" (Redis no disponible) + `development:null`.
- **Síntoma que causa:** hilos de WhatsApp salen vacíos `[]` (no se leen/guardan mensajes).
- **Solución (backend):**
  1. Provisionar/conectar Redis para el whitelabel `bodasdehoy`.
  2. Propagar `development` (que NO llegue null) en la ruta de envío.
- **Verifica:** `/send` deja de dar storage_unavailable + el hilo `/conversations/{id}/messages` devuelve mensajes.
- **Estado:** ❌ sigue caído (verificado hoy). Es el bloqueador principal del módulo.

### 1B. ✅ WhatsApp envío — YA RESUELTO (front)
- La ruta real `/api/whatsapp/messages/send {phone_number,content}` ENVÍA (wamid real, verificado).
- El front ya la usa. **Nada que hacer.** (El envío funciona; lo que falta es VER el hilo = depende de 1A).

---

## FASE 2 — ESTABILIDAD DE DATOS (eventos)

### 2A. 🔴 Pool MongoDB (P0 flapping) — **DRI: api-mcp**
- **Causa raíz (auditada en su código):** src/index-simple.ts → maxPoolSize:2 + minPoolSize:0 +
  maxIdleTimeMS:10000 → pool vacío tras 10s → MongoNotConnectedError intermitente.
- **Solución (backend):** subir a minPoolSize:2 / maxPoolSize:10 (ya existe en conector-fix.ts; unificar).
  + migración a saqnro0 (dhikg deprecado, ya hecha 8-jun) ayuda.
- **Verifica:** 0 MongoNotConnectedError en 7 días + PM2 sin crash-loop (hoy ↺30 reinicios).
- **Estado:** ping GraphQL OK ahora, pero el fix de pool aún no confirmado por api-mcp.

### 2B. 🟡 conversationId fragmentado — **DRI: api-mcp**
- 1 número (+34622440213) aparece en 3 conversaciones con IDs distintos. Normalizar el mapeo de id.

---

## FASE 3 — OMNICANAL META (Facebook/Instagram)

### 3A. 🔴 OAuth Meta — **DRI: api-ia** (backend)
- **Problema:** el front (FacebookSetup/InstagramSetup) YA tiene el botón + handler, pero
  `/api/messages/facebook/oauth-url` da 405/404 → no hay endpoint OAuth en backend.
- **Solución (backend):** implementar `…/facebook/oauth-url`, `…/facebook/disconnect`,
  `…/instagram/oauth-url`, `…/instagram/disconnect` (flujo OAuth de Meta).
- **Front:** YA listo — en cuanto el endpoint exista, el botón funcionará sin cambios.

### 3B. 🟢 Vista unificada multicanal — **DRI: front** (cuando 3A esté)
- Verificar que conversaciones de FB/IG se muestren en la misma bandeja con el selector de canal.

---

## FASE 4 — KB / BASE DE CONOCIMIENTO

### 4A. 🟡 register-metadata — **DRI: api-ia → luego front**
- **Estado:** el endpoint `/storage/register-metadata` YA EXISTE (da 422 = falta el body, no 404).
- **Acción api-ia:** confirmar campos exactos del body + qué devuelve (file_id canónico).
- **Acción front (cuando tengamos campos):** cablear `createFile` → ya no será passthrough frágil.

### 4B. 🟢 Bugs UX del KB — **DRI: front** (cuando 4A + RAG estén)
- Modal no cierra tras crear · skeleton del nombre permanente · falta selector de evento ·
  "Recargar para subir" sin acción. Son reales pero PREMATUROS hasta que el backend del KB esté completo.

---

## 📋 RESUMEN — ORDEN Y RESPONSABLE

| Orden | Acción | DRI | Desbloquea |
|---|---|---|---|
| 1 | **Redis mensajería** (storage_unavailable) | api-ia | WhatsApp completo (envío YA ok, faltan hilos) |
| 2 | **Pool MongoDB** (min2/max10) | api-mcp | eventos estables + E2E |
| 3 | **OAuth Meta** (oauth-url FB/IG) | api-ia | conectar Facebook/Instagram |
| 4 | **register-metadata campos** | api-ia → front | KB poblar archivos |
| 5 | conversationId fragmentado | api-mcp | inbox sin duplicados |
| 6 | Vista unificada + KB UX | front | pulido final |

## 🟢 LO QUE EL FRONT YA TIENE LISTO (0 trabajo pendiente hasta que backend entregue)
- WhatsApp envío ✅ · render chat ✅ · botones FB/IG con handler ✅ · branding saneado ✅ ·
  features reactivadas ✅ · sessionId guards ✅ · title ✅.

## EN UNA FRASE
**El plan es: backend levanta Redis (1) → WhatsApp completo. api-mcp sube el pool (2) → eventos
estables. api-ia implementa OAuth Meta (3) → FB/IG. El front YA está listo para todo eso; solo
cablea register-metadata (4) cuando api-ia dé los campos. Nada del front bloquea hoy.**
