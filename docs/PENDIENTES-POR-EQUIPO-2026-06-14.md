# PENDIENTES POR EQUIPO — 14/06/2026

> Verificado en vivo (curl prod) a las 13:28. Front al día y desplegado (build chat-dev MQuDtqoF con 13 fixes).
> Copia el bloque de cada equipo y pégaselo tal cual.

---

## 🔴 PARA: API-IA (api_ia_oncall) — BLOQUEADOR PRINCIPAL

```
ASUNTO: Completar resolución de `development` en TODOS los endpoints (cero muletas en el front)

OBJETIVO (decisión producto): el front NO debe mandar ?development= en ninguna llamada. api-ia
debe resolver el whitelabel SIEMPRE del JWT claim → Origin/Referer. Mientras un endpoint exija el
query param, el front lleva una muleta que hay que eliminar.

ESTADO (verificado en vivo 14-jun 13:28, con Origin chat-dev SIN ?development=):
  ✅ /api/auth/get-user-config  → dev=bodasdehoy  (RESUELTO, commit b5aedba — gracias)
  ✅ /api/providers/{dev}        → dev=bodasdehoy
  🟠 /api/messages/conversations/{id}/messages → con Origin solo devuelve 0 msgs; con ?development= → 6 msgs
       (NO resuelve el dev del Origin → sigue exigiendo el query param)
  🟠 POST /api/messages/send     → sin ?development= devuelve 400 development_required (Origin no basta)
  ⚠️ /chat/sessions, /chat/topics, /api/files/list → no determinable (usuario sin datos):
       ¿confirmáis que resuelven dev del Origin/JWT, o también exigen el query param?

PETICIÓN:
  1. Aplicar el MISMO middleware de resolución de development (JWT claim → Origin/Referer) a la ruta
     /api/messages/* (leer hilo + send) y confirmar chat/sessions, chat/topics, files/list.
  2. Cuando TODOS resuelvan sin query param, avisad → el front retira las muletas ?development= y queda limpio.

¿ETA para extenderlo a /api/messages/* y resto?
DRI: api_ia_oncall
```

---

## 🟡 PARA: API-MCP (api_mcp_oncall) — MENORES, sin prisa

```
ASUNTO: 2 pendientes menores (no bloquean)

1. conversationId fragmentado: el nº +34622440213 aparece en 3 conversaciones con IDs en formatos
   distintos (conv_177... x2 + bodasdehoy:34...@s.whatsapp.net) → duplicado del mismo contacto en el
   inbox. Normalizar el mapeo de conversationId.

2. cluster0.dhikg: ANTES de apagarlo, auditar qué servicios siguen conectados (directorio/api.bodasdehoy).
   Apagar un backend NO es neutro — que eventos ya use saqnro0 no implica que dhikg sea apagable.
   La decisión de apagar es del usuario, informada con esa auditoría.

DRI: api_mcp_oncall
```

---

## 🟢 PARA: QA / AUDITOR — re-probar el build NUEVO

```
ASUNTO: Re-probar sobre el build con fixes (el informe anterior probó un build viejo)

IMPORTANTE: chat-dev sirvió hasta hoy un build ESTÁTICO del 12-jun (sin los fixes). YA está
rebuildeado: BUILD_ID nuevo = MQuDtqoFd6o3H_7cdrDHY (14-jun 11:53). Hacer HARD REFRESH (Cmd+Shift+R)
o incógnito antes de probar.

DEBERÍAN ESTAR RESUELTOS (re-verificar):
  • B2 carga infinita del chat (esqueletos)   → fix sessionId vacío
  • B5/B6 WhatsApp enviar/leer                  → el front ya manda development
  • B7 borrado accidental de sesión (Cmd+A+Supr)→ el hotkey ya no se dispara en el input
  • B8 /messages redirige a login autenticado   → ventana de gracia
  • B11 botones Conectar Facebook/Instagram     → ahora abren el popup OAuth de Meta
  • B13 favicon https://https → 503             → saneado

SIGUE ABIERTO (de api-ia, no del front):
  • B1 whitelabel: get-user-config YA resuelve; falta que /api/messages/* lo haga (en curso).

PENDIENTE FRONT (cuando aplique): B10 KB selector de evento.
NO PROBADO: app-dev (SSO 2 usuarios) — requiere habilitar app-dev.bodasdehoy.com en la extensión.
```

---

## ⚪ PARA: TI (Owner) — desbloqueo de infraestructura

```
- Habilitar app-dev.bodasdehoy.com (o *.bodasdehoy.com) en claude.ai → Settings → Admin →
  Capabilities (acceso a la red), para poder auditar el SSO entre app-dev↔chat-dev y el realtime
  entre 2 usuarios (campana/socket). Hoy está bloqueado por política de la organización.
```

---

## ✅ RESUMEN — quién bloquea qué

| Pendiente | Dueño | ¿Bloquea? |
|---|---|---|
| development en /api/messages/* (completar B1) | **api-ia** | Bloquea retirar muletas del front (objetivo "código perfecto") |
| conversationId fragmentado | api-mcp | No (cosmético inbox) |
| Auditar dhikg antes de apagar | api-mcp | No |
| Re-probar build nuevo | QA/auditor | No (validación) |
| Habilitar app-dev en extensión | Owner (tú) | Bloquea auditar SSO/realtime |
| B10 KB selector de evento | front | No (cuando KB completo) |

**Front: cerrado y desplegado.** El único pendiente que mantiene "muletas" en el código es de **api-ia**
(completar la resolución de development en mensajería). En cuanto lo entreguen, el front queda perfecto.
