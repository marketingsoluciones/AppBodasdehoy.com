# Análisis — Copilot: resolución del contexto de evento

Fecha: 2026-07-03 (re-aplicado 2026-07-06) · Autor: COORD-AppEventos
Scope: apps/appEventos (CopilotEmbed / ChatSidebarDirect / copilotChat) + contrato con api-ia.
Motivo: bug "get_event_guests falla en multi-turn" + pregunta de diseño: ¿de qué
evento habla el usuario según DÓNDE está el Copilot, y cuándo asumir vs. preguntar?

## 0. TL;DR — el problema en una frase
El Copilot SÍ manda `eventId` en `metadata` en cada turno, pero ese `eventId`
depende de un estado implícito (el evento seleccionado en `EventContextProvider`)
que NO siempre coincide con lo que el usuario está mirando ni con lo que quiere
decir. El fallo no es "el eventId no viaja"; es que NO había una política clara de
qué evento es el "activo" para la conversación según el contexto de UI, ni una
regla de cuándo asumirlo y cuándo preguntar. Además la tool `get_event_guests` no
recibe ese `eventId` como parámetro autoritativo → el LLM intenta adivinarlo del
historial en texto plano y falla.

## 1. Cómo viaja el contexto (código real)
EventContextProvider.event  → evento "activo" (localStorage + ?event= URL)
  → ChatSidebarDirect.tsx  eventId = event?._id ; eventName = event?.nombre
  → pageContext = { userRole, permissions, activeEventId, eventScope, availableEvents }
  → CopilotEmbed → copilotChat.sendChatMessage
  → metadata = { userId, development, eventId, eventName, sessionId, pageContext, isAnonymous }
  → POST /api/copilot/chat (cada turno reenvía metadata + messageHistory[-20]) → api-ia

Verificado:
- eventId = evento seleccionado (event._id). Si no hay evento → eventId undefined.
- Se reenvía en CADA turno (no solo el primero) → el canal estructural existe.
- messageHistory = últimos 20 mensajes en texto plano; el eventId NO está en ese texto.

## 2. Los 3 contextos de UI — y qué significa "el evento" en cada uno
- CTX-A · Sidebar CON evento abierto (/resumen-evento, /invitados, /presupuesto):
  event seteado → eventId = event._id. Señal FUERTE. Regla: asumir el evento abierto. No preguntar.
- CTX-B · Sidebar en la LISTA de eventos ("Mis eventos", "/"):
  event puede ser residual o null; el usuario ve TODOS. Señal DÉBIL/ambigua.
  Riesgo: arrastrar el eventId residual → responde sobre un evento que ya no mira.
  Regla: NO asumir. O scope "todos", o PREGUNTAR. Nunca usar el residual en silencio.
- CTX-C · Pantalla completa chat-ia (chat.bodasdehoy.com, "Abrir completo"):
  eventId llega UNA vez por URL param. Conversación larga; el usuario puede saltar de evento.
  Riesgo: eventId inicial stale. Regla: mantener activeEventId mutable + confirmar el cambio.

## 3. Root cause del bug get_event_guests (3 capas)
1. Resolución de evento: el eventId SÍ viaja en metadata, pero la tool/orquestador NO lo
   usa como parámetro autoritativo; el LLM lo infiere del texto y falla. En CTX-B además
   puede ser undefined/residual.
2. Firma de la tool: get_event_guests no tiene parámetro status → no filtra pending.
3. Loop de reintentos: sin límite y sin propagar el error GraphQL → 2-5 tool_start sin
   tool_result, HTTP 200 con fallo silencioso.
Evidencia: [fetchApiBodas] GraphQL errors x3 + múltiples event: tool_start sin tool_result.

## 4. Mejores prácticas — ¿asumir o preguntar?
¿El mensaje nombra un evento explícito?
- SÍ → resolver por nombre. match único → usar ese eventId (si difiere del activo, cambiar
  contexto + avisar). match múltiple/0 → PREGUNTAR cuál.
- NO → según contexto de UI:
    CTX-A → asumir el evento abierto (activeEventId). NO preguntar.
    CTX-B → no hay activo fiable: si es agregable ("¿cuántos invitados en total?") → scope TODOS;
            si requiere un evento ("lista de pendientes") → PREGUNTAR cuál.
    CTX-C → usar activeEventId de la conversación; si el usuario cambió de evento, re-confirmar.
Principios:
1. El evento seleccionado a la derecha ES contexto autoritativo en CTX-A (default silencioso).
2. Nunca arrastrar un eventId residual en silencio en CTX-B.
3. Preguntar solo ante ambigüedad real (CTX-B no agregable, o nombre con varios matches).
4. Confirmar el cambio de evento en CTX-C, no solo asumirlo.
5. Coherencia UI ↔ contexto: mostrar en el header del Copilot de qué evento se habla.

## 5. Recomendaciones accionables
FRONT (appEventos / copilotChat)  [APLICADO 2026-07-06]:
- [x] activeEventId + eventScope ('active'|'all') + availableEvents como campos ESTRUCTURADOS
      en PageContext/metadata (copilotChat.ts, ChatSidebarDirect.tsx).
- [x] En CTX-B (ruta "/") NO se envía el eventId residual: eventId undefined + eventScope 'all'
      + availableEvents [{id,name}] (<=20).
- [x] Header del sidebar muestra el evento en contexto ("Contexto: X" / "todos tus eventos").
- [ ] CTX-C (pantalla completa chat-ia): activeEventId mutable por conversación (cross-app).
BACKEND (api-ia) — coordinar con dev-copilot / dev-backend  [PENDIENTE, otro repo]:
- [ ] get_event_guests (y tools de evento) deben tomar metadata.activeEventId como default.
- [ ] Añadir status (all | confirmed | pending | rejected) a get_event_guests.
- [ ] Limitar reintentos de tool a 1 y propagar el error GraphQL al LLM.
- [ ] Si eventScope='all' y la petición requiere un evento → preguntar con availableEvents.

### 5.1 Más recomendaciones (best practices ampliadas)
Seguridad / integridad (lo más crítico):
- [ ] Read vs Write asimétrico: lecturas pueden agregar varios eventos; las escrituras deben
      apuntar a UN evento confirmado. Nunca mutar sobre un evento adivinado.
- [ ] Write-guard: si una tool de mutación se invoca sin activeEventId resuelto → bloquear y
      pedir confirmación del evento (además del confirm_required para destructivas/bulk).
- [ ] Filtrar availableEvents por permisos (respetar compartido_array). No ofrecer eventos sin acceso.
Robustez multi-turn:
- [ ] Evento resuelto STICKY por conversación (persistir a nivel sesión) para follow-ups.
- [ ] Normalización de nombres (acentos/mayúsculas/parcial); si ambigüedad → preguntar candidatos.
- [ ] TTL / re-confirmación de contexto al navegar o tras mucho tiempo, antes de una escritura.
UX de desambiguación:
- [ ] Quick-replies con nombres de availableEvents (botones).
- [ ] Chip de contexto editable en el input ("Hablando de: Boda X ▾").
- [ ] Confirmar el cambio, no asumirlo, cuando el usuario salta de evento.
Cross-app (appEventos ↔ chat-ia fullscreen):
- [ ] Propagar activeEventId por postMessage al "Abrir completo" y al cambiar de evento.
Observabilidad:
- [ ] Telemetría de ambigüedad (cuándo pregunta, cuándo usa scope 'all', cuándo falla por evento no resuelto).
- [ ] Mensajes de error accionables ("no sé de qué evento; elige uno").

Workaround usuario (temporal): pedir en un solo mensaje nombre del evento + filtro.

## 6. Qué NO es este problema
2 bugs de LAYOUT independientes, corregidos en front (index.tsx grid auto-fill/minmax + guardas
de overflow en Card.tsx; BlockPrincipal.tsx quitado w-1 h-1 → shrink-0). Son CSS, no contexto IA.
