# 📋 INFORME — Pendientes y de quién depende cada uno

**Fecha:** 2026-06-12 · **Branch:** tj/refactor/adelgazar-chat-ia (pusheada) · **Build chat-ia:** WCpEQXy_Z7KdiPoVDR1eg

---

## 🟢 ESTADO GENERAL: el FRONT está al día. Lo pendiente es de BACKEND.

| Frente | Pendientes | DRI |
|---|---|---|
| **FRONT-AppEventos (nosotros)** | 0 ejecutables ahora | — (todo hecho/verificado) |
| **api-ia** | 3 abiertos | equipo api-ia |
| **api-mcp** | 3 abiertos (1 con causa raíz hallada) | equipo api-mcp |
| **CRM** | 1 (no es nuestro) | equipo Suite-CRM |

---

## ✅ YA RESUELTO Y SIRVIÉNDOSE (front — verificado en vivo)

| # | Qué | Verificación |
|---|---|---|
| 1 | **Render del chat** (los mensajes se pintan) | userBubble=true en vivo |
| 2 | **WhatsApp send** (era URL inventada del front → 404) | success+wamid real (envía de verdad) |
| 3 | `<title>` truncado (topicTitle + agentTitle) | 92 chars (antes 184+) |
| 4 | sessionId/userId vacío (4 servicios con guard) | 0 requests basura (salvo inbox legítimo) |
| 5 | FOUC i18n (parseMissingKeyHandler) | traducciones ES completas |
| 6 | Logo `https://https//` saneado (normalizeMediaUrl) | doubleHttps=0 |
| 7 | Features reactivadas (knowledge, image, marketplace, files) | rutas 200 |
| 8 | RAG migrado a api-ia · deuda técnica TS 0 · deleteGeneration | tests verde |

**4 apps del monorepo operativas:** chat-ia, appEventos, editor-web, memories-web (todas 200).

---

## 🔴 PENDIENTE DE API-IA (3) — DRI: equipo api-ia

| # | Pendiente | Sev | Estado |
|---|---|---|---|
| **IA-6** | branding: `/chat/config` devuelve URLs con `https://https://` duplicado (origen) | 🟠 | front ya sanea; el origen está en api-ia |
| **IA-7** | `/api/messages/send` (genérico) → `storage_unavailable` (Redis no disponible) | 🟡 | front ya NO lo usa (WhatsApp va por otra ruta) — pero conviene arreglar Redis |
| **IA-8** | `GET /api/messages/conversations/{id}` → `[]` aunque la lista dice "3 mensajes" | 🟠 | hilo de conversación vacío — mapeo de id |

**Ya CERRADOS por api-ia hoy:** IA-2 (structured 502 ✅), IA-3 (billing ✅), IA-5 (image síncrono ✅).
**Acordados:** IA-1 (file_url funciona; file_id puro cuando le demos uno), IA-4 (api-ia implementa register-metadata).

---

## 🔴 PENDIENTE DE API-MCP (3) — DRI: equipo api-mcp

| # | Pendiente | Sev | Estado |
|---|---|---|---|
| **MCP-1** | **P0 MongoDB flapping — CAUSA RAÍZ HALLADA** | 🔴 | config de pool: `maxPoolSize:2 + minPoolSize:0 + maxIdleTimeMS:10000` en src/index-simple.ts → pool vacío tras 10s → MongoNotConnectedError. **FIX: subir a min2/max10** (ya existe en conector-fix.ts). PM2 ↺30 reinicios. |
| **MCP-3** | updateTasksOrder | 🟡 | ETA api-mcp: 13-jun (merge prod) |
| **MCP-4** | "pagos boda" Cat C — ¿cuál falta? | 🟡 | nombres dados (borraPago/nuevoPago/editPago); esperan que digan cuál falta |

**Cerrado desde front:** MCP-2 removerInvitado (usamos removerInvitadosBatch que funciona).

---

## 🟡 NO ES NUESTRO — solo vigilar — DRI: equipo CRM

- `/crm/knowledge-base` con 3 bugs de auth (development con .com, x-user-role hardcoded, proxy headers).
  Es del repo Suite-CRM Pro. AppBodas ya está limpio de esos bugs (no aplica).

---

## ⚠️ SEGURIDAD (acción de backend)

- api-mcp compartió credenciales de producción MongoDB en texto plano (Atlas + leadscrap + SSH root)
  por el chat. NO las guardamos en el repo. **Recomendación: rotar esas credenciales** y usar gestor
  de secretos. Quedan en el historial del chat.

---

## ➡️ QUÉ DESBLOQUEA QUÉ

```
api-mcp arregla pool MongoDB (MCP-1) ──→ E2E reales + queries eventos estables (era el bloqueador #1)
api-ia arregla register-metadata (IA-4) ──→ front cablea createFile 100%
api-ia arregla IA-8 (hilo vacío) ──→ el inbox muestra los mensajes del hilo
api-mcp updateTasksOrder (13-jun) ──→ front cablea reordenar tareas
```

## RESUMEN EN 1 LÍNEA
**Front: 0 pendientes (todo arreglado y desplegado). Backend: api-ia 3 (branding, Redis, hilo) +
api-mcp 3 (pool MongoDB con fix dado, updateTasksOrder 13-jun, cuál pago Cat C). Todo reportado en Slack con copias en docs/backend-asks/slack-ready/.**
