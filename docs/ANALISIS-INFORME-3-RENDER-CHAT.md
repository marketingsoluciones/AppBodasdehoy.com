# Análisis — 3er informe (Claude cowork) sobre chat-dev. Render en blanco del chat

**Fecha:** 2026-06-12 · **Verificado en vivo** sobre build H8eO46tRWxCMK93WZtSOn (con fixes previos).

## Verificación hallazgo por hallazgo

| # | Hallazgo informe | Verificación | Estado |
|---|---|---|---|
| 2.1 | Chat no renderiza mensajes (transcript en blanco) | 🔴 `userBubbleRendered: false` reproducido en vivo | **REAL — bug raíz identificado** |
| 2.1 | `<title>` cambia a la respuesta completa | ⚠️ title cambia pero ya TRUNCADO a 34 chars (fix 918ac6c3) | **PARCIAL — síntoma mitigado** |
| 2.2 | "No hay proveedores habilitados" pero el modelo responde | ⏳ 2 fuentes de verdad — no verificado a fondo | plausible |
| 2.3 | FOUC i18n (claves crudas: searchAgentPlaceholder, inbox.title…) | ⏳ no reproducido aún | plausible (conocido) |
| 2.4 | Mezcla EN/ES en misma vista | ⏳ no reproducido | plausible (i18n incompleto) |
| 2.5 | Plugins deshabilitados visitante ("modelo no admite function calling") | comportamiento esperado visitante | by design |
| 2.6 | Menú lateral intermitente / texto "boda/comunión" rotativo | ⏳ no verificado | menor |
| 3 | Persistencia sesión app-dev↔chat-dev NO se cumple (Visitante + "Sesión expirada") | ⏳ requiere login real | **ALTO — SSO/cookies** |

## 🔴 BUG RAÍZ del render en blanco (2.1) — causa identificada

**Flujo del fallo:**
1. Usuario (visitante) envía mensaje → se añade al store local (optimistic update) en
   `messagesMap[messageMapKey(activeId, topicId)]`.
2. `useFetchMessages` (store/chat/slices/message/action.ts:280) corre vía SWR.
3. `getMessages(sessionId, topicId)` devuelve `[]` (visitante sin sesión válida; mi guard de
   sessionId vacío también devuelve [] en message/apiIa.ts:65).
4. **onSuccess (action.ts:289-302) SOBREESCRIBE `messagesMap[key] = []`** → borra el mensaje
   optimista que el usuario acababa de enviar. → **transcript en blanco.**

**El `<title>` SÍ cambia** porque la respuesta del modelo llega por el stream (otro flujo, no
depende del messagesMap), pero el transcript visual se vació al pisar el map con [].

**Relación con mis fixes:** mi guard de sessionId vacío (que retorna [] rápido) puede ADELANTAR
el onSuccess que borra el optimistic. Pero la causa raíz es el onSuccess que pisa el map sin
preservar mensajes optimistas/locales no persistidos.

## Fix propuesto (NO aplicado — requiere autorización, toca el core del render)

Opción A (mínima): en onSuccess, NO sobreescribir si `messages` viene vacío Y el map local ya
tiene mensajes (preservar optimistic):
```
onSuccess: (messages, key) => {
  const existing = get().messagesMap[messageMapKey(sessionId, activeTopicId)] || [];
  // No pisar mensajes locales/optimistas con un fetch vacío (visitante / sin persistencia).
  if (messages.length === 0 && existing.length > 0) return;
  ...
}
```
Opción B (visitante): no llamar useFetchMessages (enable=false) cuando no hay sesión válida,
para que el optimistic update nunca se pise. Más limpio pero hay que ubicar el `enable`.

**Riesgo:** es el corazón del render del chat. Requiere test + verificación en vivo + probar
que NO rompe el caso autenticado (donde getMessages [] legítimo = topic vacío real).

## Pendiente de verificar (requieren login real — el user)
- Persistencia SSO app-dev↔chat-dev (cookies .bodasdehoy.com, SameSite/Secure).
- Si el render en blanco ocurre TAMBIÉN autenticado o solo visitante.
- FOUC i18n + mezcla EN/ES (auditoría de claves namespace ES).
