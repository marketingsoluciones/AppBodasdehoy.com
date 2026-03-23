# Pendientes con api-ia / API2 (según `#copilot-api-ia`, última lectura 2026-03-20)

**Claro “nosotros vs ellos”:** ver `scripts/PENDIENTES-NOSOTROS-VS-ELLOS.txt` o ejecutar `pnpm pendientes`.

El canal mezcla mensajes **Front ↔ api-ia** y algunos **Front → API2** (cuando piden intervención de `api2.eventosorganizador.com`).

---

## Cerrado recientemente (no reabrir este hilo)

| Tema | Estado |
|------|--------|
| **lobechat-kb** — contrato de error + evidencia (`trace_id`, request/response, UTC) | **CERRADO** por api-ia: ciclo de coordinación cerrado; `trace_id` OK. HTTP 500 = capa embeddings → *otro ticket* si queréis 200. |
| Checklist X-User-ID / X-User-Role / 402·503 UI | Front **confirmó implementado** (mensaje 12 mar en canal). |

---

## Pendiente con **api-ia** (ellos deben responder / corregir)

| # | Tema | Origen canal |
|---|------|----------------|
| 1 | **Bugs 24 feb** (clave Anthropic mal slot, router desconectado, `/webapi/chat/auto` → NO_PROVIDERS, test endpoint falso positivo) | Sigue reclamando respuesta; **prioridad alta** en su lado. |
| 2 | **Leads** — revisión de `docs/api-leads-spec.md` y endpoints `/api/leads/*` | Ellos dijeron "lo revisamos" (11 mar); falta confirmar si ya existen en prod. |
| 3 | **embeddings / Ollama** — `lobechat-kb` devuelve 500 hasta que arreglen infra | Opcional: abrir **ticket nuevo** con ETA si queréis RAG 200. |

**Nada crítico nuevo que *entregar* vosotros** salvo que os pidan otra evidencia concreta.

---

## Pendiente con **API2** (backend `api2.eventosorganizador.com`)

| # | Tema | Nota |
|---|------|------|
| 1 | **R2 / `uploadCRMEntityFile`** — `Storage no configurado para este development` (**bodasdehoy**) | Mensaje ~19 mar: pedís confirmar que **fallback whitelabel** está en **producción** real. **No es api-ia**; es API2 / storage. |
| 2 | Resto coordinación API2 | *OK sin bloqueos* o incidencia con **4 datos** si hay fallo (ver `REFERENCIA-CHECKLIST-API2-Y-NUESTRA-RESPUESTA.md`). |

---

## Pendiente **nuestro** (Front / deploy)

- [ ] **Deploy prod** si aún no está: `X-Request-ID` RAG, `X-User-Role` vía `AUTH_CONFIG`, etc.
- [ ] **Smoke** Copilot tras deploy.
- [ ] Si **API2** contesta sobre R2: re-probar upload y cerrar o escalar con **4 datos**.

---

## Resumen una línea

- **api-ia:** lobechat-kb *evidencia* cerrada; lo que **sigue vivo** es sobre todo **providers / Leads / embeddings 200**.
- **API2:** lo que **sigue vivo** en el canal es **R2 CRM upload** para `bodasdehoy`, no el hilo lobechat-kb.

---

## Próxima acción sugerida (2026-03-20+)

1. **Deploy** chat-ia + appEventos con últimos merges (RAG + `userRole`).
2. **Slack:** recordatorio único a api-ia — bugs 24 feb + Leads; a API2 — R2 bodasdehoy (`scripts/slack-mensaje-pendientes-sintesis.txt`).
3. Tras respuesta API2: re-probar upload CRM o mandar **4 datos** si sigue fallando.
