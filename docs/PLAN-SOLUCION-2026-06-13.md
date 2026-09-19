# 🗺️ PLAN DE SOLUCIÓN — cómo se arregla cada cosa y en qué orden

**Fecha:** 2026-06-13 · Estado verificado en vivo. Ordenado por DEPENDENCIAS (qué desbloquea qué).

---

## 🎯 OBJETIVO
Mensajería omnicanal funcionando (WhatsApp completo + Meta), KB usable, eventos estables.
Hoy: arquitectura correcta, pero bloqueada por **3 cosas de backend** y **2 cableos de front**.

---

## FASE 1 — DESBLOQUEAR MENSAJERÍA (lo de mayor impacto)

### 1A. 🔴 Redis para mensajería — **CADENA api-ia ↔ api-mcp** [BLOQUEADOR #1]
- **Problema:** `/api/messages/send` → "storage_unavailable" (Redis no disponible) + `development:null`.
- **Síntoma que causa:** hilos de WhatsApp salen vacíos `[]` (no se leen/guardan mensajes).
- **CAUSA REAL (confirmada por api-ia 13-jun):** api-ia pide las credenciales de Redis del whitelabel
  vía la query GraphQL `whitelabel(development){...}` de **api-mcp**, que NO responde (va por fallback).
- **Solución (cadena):**
  1. **api-mcp:** exponer las credenciales de Redis del tenant en la query `whitelabel(development)`.
  2. **api-ia:** ya parcheó `development` (no null); su storage levantará cuando api-mcp dé las creds.
- **Verifica:** `/send` deja de dar storage_unavailable + el hilo `/conversations/{id}/messages` devuelve mensajes.
- **Estado:** ❌ sigue caído (verificado hoy). api-ia + api-mcp coordinando. Es el bloqueador principal.

### 1B. ✅ WhatsApp envío — YA RESUELTO (front)
- La ruta real `/api/whatsapp/messages/send {phone_number,content}` ENVÍA (wamid real, verificado).
- El front ya la usa. **Nada que hacer.** (El envío funciona; lo que falta es VER el hilo = depende de 1A).

---

## FASE 2 — ESTABILIDAD DE DATOS (eventos)

### 2A. 🔴 Pool MongoDB (P0 flapping) — **DRI: api-mcp**
- **Causa raíz (auditada en su código):** src/index-simple.ts → maxPoolSize:2 + minPoolSize:0 +
  maxIdleTimeMS:10000 → pool vacío tras 10s → MongoNotConnectedError intermitente.
- **Solución (backend):** subir a minPoolSize:2 / maxPoolSize:10 (ya existe en conector-fix.ts; unificar).
  + la migración de EVENTOS a saqnro0 ayuda. ⚠️ OJO: que eventos ya no use dhikg NO significa que
    dhikg se pueda apagar — apagarlo NO es neutro. Hay que verificar QUÉ más cuelga de cluster0.dhikg
    (directorio/api.bodasdehoy/etc.) ANTES de apagar. Decisión del usuario, no del front. NO afirmar
    "dhikg deprecado/apagable" sin esa verificación.
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

---

## 🔄 RE-VERIFICACIÓN (13-jun 07:55, batería nueva tras actividad backend)

Backend estuvo muy activo (cerraron RAG, rotaron credenciales, coordinaron MongoDB). Re-probado:

| Punto | Antes | AHORA (verificado curl) | Cambio |
|---|---|---|---|
| **P1 Redis /send** | storage_unavailable | ✅ **success:true + msg_id real** (`msg_1781337358...`) | 🟢 **RESUELTO** — Redis levantó |
| **P1 leer hilo** | [] (Redis caído) | ⚠️ total:0 + error **`'NoneType' object has no attribute 'encode'`** | 🟠 bug NUEVO de código api-ia (ya no es Redis) |
| **P2 MongoDB** | flapping | ✅ 5/5 queries 200 (estable) | 🟢 estable ahora (confirmar pool con logs) |
| **P3 OAuth Meta** | 405 | ⚠️ sigue 405 | sin cambio — api-ia pendiente |
| **P4 register-metadata** | 422 (faltan campos) | campos = `url`+`filename` obligatorios; con ellos → **502** | 🟠 campos conocidos pero da 502 |

### NUEVOS hallazgos para backend (api-ia):
- **N1 🟢 RESUELTO EN FRONT (13-jun, commit 969a3cb5) — NO era de api-ia.** El `'NoneType...encode'`
  salía porque el front (a) leía por `/api/messages/whatsapp/conversations/{dev}/{jid}/messages`
  → 404 en api-ia, y (b) mandaba `development` solo por header `X-Development`, que api-ia NO usa
  para la LECTURA del hilo. Verificado en vivo: `/messages/conversations/{id}/messages` CON
  `?development=` en query → devuelve los 3 mensajes reales; con header solo → `[]`.
  Fix: `useMessages.ts` usa el endpoint genérico + `?development=`; `useSendMessage.ts` añade
  `?development=` a `/send`. Backend api-ia estaba correcto.
- **N2 🟠 register-metadata:** campos confirmados (`url`, `filename` obligatorios) pero POST con
  ellos → 502 (Bad Gateway, el servicio crashea en ese endpoint). DRI api-ia. Revisar el handler.
  Cuando responda 200, el front cablea createFile. **Es el ÚNICO pendiente real de api-ia.**

### ✅ DESBLOQUEADO desde la última versión del plan:
- **P1 envío WhatsApp por /send** ahora funciona (Redis arriba). El envío está 100% operativo
  (tanto por /whatsapp/messages/send como por /messages/send).
- **P2 MongoDB** estable en pruebas (5/5). Falta que api-mcp confirme el fix de pool en logs.

## EN UNA FRASE
**El plan es: backend levanta Redis (1) → WhatsApp completo. api-mcp sube el pool (2) → eventos
estables. api-ia implementa OAuth Meta (3) → FB/IG. El front YA está listo para todo eso; solo
cablea register-metadata (4) cuando api-ia dé los campos. Nada del front bloquea hoy.**
