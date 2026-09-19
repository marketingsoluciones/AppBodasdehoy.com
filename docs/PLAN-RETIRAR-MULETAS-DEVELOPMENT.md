# Plan: retirar las muletas `?development=` del front (código perfecto, cero muletas)

**Objetivo (decisión producto 14-jun):** que api-ia resuelva el `development` SIEMPRE del
JWT claim → Origin/Referer, en TODOS los endpoints. Entonces el front no manda `?development=`
en ninguna llamada. Hasta entonces, las muletas se mantienen (retirarlas rompería).

## Estado api-ia (verificado en vivo 14-jun 13:00)
- ✅ `/api/auth/get-user-config` → resuelve dev del Origin (commit b5aedba). MULETA RETIRABLE.
- ✅ `/api/providers/{dev}` → resuelve.
- 🟠 `/api/messages/conversations/{id}/messages` → Origin solo = 0 msgs; con ?dev= = 6. NO resuelve aún.
- 🟠 `POST /api/messages/send` → sin ?dev= = 400 development_required. NO resuelve aún.
- ⚠️ `/chat/sessions`, `/chat/topics`, `/api/files/list` → indeterminado (usuario sin datos). Pedir confirmación api-ia.

Requisito escalado a api-ia: Slack ts 1781436484 (completar en /api/messages/* y resto).

## Muletas en el front (a retirar CUANDO api-ia confirme cada endpoint)

### Grupo CONFIG (api-ia get-user-config YA resuelve → RETIRABLE YA, pero esperar a tener TODO
para un solo commit limpio):
- src/services/knowledgeBase.ts (loadKBs, saveKBs)  — commit d761b571
- src/services/aiProvider/apiIa.ts                  — commit d761b571
- src/services/plugin/apiIa.ts                       — commit d761b571
- src/services/aiModel/server.ts                     — commit d761b571
- src/services/chatGroup/apiIa.ts                    — commit d761b571
- src/services/user/apiIa.ts                          — commit d761b571

### Grupo MENSAJERÍA (api-ia AÚN exige ?dev= → NO retirar hasta que api-ia lo resuelva):
- src/app/[variants]/(main)/messages/hooks/useMessages.ts      — commit 969a3cb5
- src/app/[variants]/(main)/messages/hooks/useSendMessage.ts   — commit 969a3cb5
- src/app/[variants]/(main)/messages/components/FacebookSetup.tsx / InstagramSetup.tsx — commit 101dcc11
- src/app/[variants]/(main)/messages/hooks/useUnifiedFeed.ts / useRecentConversations.ts / useConversations.ts

### Grupo ADMIN (verificar si dependen de dev en query):
- src/app/[variants]/(main)/admin/audit/page.tsx
- src/app/[variants]/(main)/admin/billing/hooks/useStorageData.ts / useBillingData.ts

## Procedimiento de retirada (cuando api-ia confirme)
1. Por cada endpoint que api-ia confirme resuelve dev del Origin/JWT: quitar `?development=`/`&development=`
   de la URL (dejar el header X-Development que es informativo, NO la muleta de query).
2. Verificar en vivo que el endpoint sigue devolviendo datos SIN el query param.
3. Build en portátil 24GB + verificar.
4. Un commit limpio: "♻️ refactor(chat-ia): retirar muletas ?development= — api-ia resuelve del Origin".

NOTA: tras retirar, NO debe quedar ningún `?development=` ni `&development=` en llamadas a api-ia.
El development viaja por JWT/Origin (api-ia) y, si acaso, header X-Development (informativo).
