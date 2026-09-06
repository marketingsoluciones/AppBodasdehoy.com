# 📩 PARA api-ia — solicitud de COORD-AppEventos

> Pegar este bloque en el hilo Slack `1779046688.849779` o canal `#coordinacion`.
> El front asume contrato actual: `Authorization: Bearer <JWT>` + `X-Development: <tenant>`.

```
DE: COORD-AppEventos
PARA: API-IA
DRI: api_ia_oncall
ASUNTO: CAPA 2 PASO C — 2 endpoints nuevos + 5 confirmaciones de shape

═══════════════════════════════════════════════════════════
📊 CONTEXTO
═══════════════════════════════════════════════════════════

Auditamos vuestro openapi.json (https://api-ia.bodasdehoy.com/openapi.json,
347 endpoints). La mayoría de servicios de CAPA 2 PASO C ya tienen cobertura
en api-ia (image, upload, user, file, aiProvider, global, chatGroup, plugin,
tool, generation, rag, knowledgeBase, memories). El front empieza a integrar
contra esos endpoints ya — no necesitamos nada nuevo ahí.

Lo que SÍ os pedimos:


═══════════════════════════════════════════════════════════
1) 🟡 ENDPOINTS NUEVOS — servicio `thread`
═══════════════════════════════════════════════════════════

`thread` es el único servicio chat-ia sin cobertura en vuestro openapi.json
(0 endpoints). Sigue el patrón de /chat/topics y /chat/messages que ya existen.

Modelo de dato (tomado del schema actual drizzle del front):

  Thread {
    id:              string  (pk)
    title:           string | null
    type:            'continuation' | 'standalone'        // NOT NULL
    status:          'active' | 'deprecated' | 'archived' // default 'active'
    topicId:         string  (FK → topics.id, cascade)    // NOT NULL
    sourceMessageId: string                                // NOT NULL
    parentThreadId:  string | null  (FK → threads.id, set null)
    userId:          string  (resolver del JWT)
    createdAt:       datetime
    updatedAt:       datetime
  }

Endpoints solicitados (4):

  GET    /chat/topics/{topic_id}/threads
         → 200 application/json [ Thread, ... ]
         Lista threads de un topic. Filtrar por userId del JWT.

  POST   /chat/topics/{topic_id}/threads
         body { title?: string, type: 'continuation'|'standalone',
                sourceMessageId: string, parentThreadId?: string }
         → 200 application/json Thread
         Crea thread bajo el topic.

  PATCH  /chat/threads/{thread_id}
         body partial Thread (title, type, status, parentThreadId)
         → 200 application/json Thread

  DELETE /chat/threads/{thread_id}?removeChildren=true|false
         → 204 No Content
         Si removeChildren=true, borra recursivo. Default false.

Extra (usados en CAPA 1 ya implementada para session/topic, replicar patrón):

  POST   /chat/topics/{topic_id}/threads/with-message
         body { title?, type, sourceMessageId, parentThreadId?,
                message: CreateMessageParams }
         → 200 { threadId: string, messageId: string }
         Crea thread + primer mensaje atómicamente (transacción).

  DELETE /chat/topics/{topic_id}/threads
         → 204 No Content
         Borra TODOS los threads de un topic (usado al borrar topic).

Auth: idéntica a /chat/topics existente.


═══════════════════════════════════════════════════════════
2) 🟢 DECISIÓN — servicio `ragEval`
═══════════════════════════════════════════════════════════

`services/ragEval.ts` (71 líneas, 13 refs tRPC) no tiene cobertura en
openapi.json. Pregunta:

  (a) ¿Está en roadmap exponer endpoints REST para eval datasets?
  (b) ¿O lo eliminamos del front (deprecar funcionalidad)?

Si (a), proponemos:
  GET/POST   /chat/eval-datasets
  GET/PATCH/DELETE  /chat/eval-datasets/{id}
  POST       /chat/eval-runs            body { datasetId, modelId, ... }
  GET        /chat/eval-runs/{id}       → status + resultados

Si (b), borramos el servicio del front en el siguiente sprint.


═══════════════════════════════════════════════════════════
3) 🟢 CONFIRMACIONES DE SHAPE (no requieren código nuevo)
═══════════════════════════════════════════════════════════

Para que el front integre vuestros endpoints existentes sin sorpresas,
necesitamos confirmar 5 puntos:

  3.1) chatGroup members
       Tenéis /chat/session-groups [GET, POST] y
       /chat/session-groups/{id} [PATCH, DELETE].

       El front necesita gestionar `members` del group (addMember,
       removeMember, updateMemberRole, listMembers).

       ¿Los members se gestionan dentro del PATCH del group (en un campo
       `members: [...]` del body) o necesitáis exponer endpoints dedicados?

         Opción A (PATCH inline):
           PATCH /chat/session-groups/{id} body { members: [{userId, role}] }

         Opción B (endpoints dedicados):
           GET    /chat/session-groups/{id}/members
           POST   /chat/session-groups/{id}/members        body { userId, role }
           PATCH  /chat/session-groups/{id}/members/{user_id}  body { role }
           DELETE /chat/session-groups/{id}/members/{user_id}

       Confirmad cuál + shape de un ChatGroupMember.


  3.2) Duplicación user-config
       Ambos endpoints existen:
         GET  /api/auth/get-user-config
         POST /api/auth/save-user-config

       Pero `services/global.ts` también espera config global y
       `services/user/server.ts` config de usuario. ¿Es la MISMA tabla / mismo
       endpoint, o son fuentes distintas?

       Confirmad:
         - ¿`global` y `user` consumen el mismo `/api/auth/*-user-config`?
         - O ¿hay otro endpoint específico para `globalConfig` (preferences
           UI globales) vs `userConfig` (perfil)?


  3.3) plugin vs tool
       Ambos servicios (`services/plugin/server.ts`, `services/tool.ts`)
       apuntan al mismo `POST /webapi/plugin/gateway`.

       ¿Cómo se discrimina internamente?
         - tool = manifest + state de tool builtin (lobe-venue-visualizer, etc.)
         - plugin = plugin instalado (registry de terceros)

       Body actual front:
         { identifier: string, action: string, params: any }

       ¿Hay un campo `kind: 'tool' | 'plugin'` esperado? ¿O lo deduces por
       identifier?


  3.4) image — endpoint canonical para CRUD
       Tenéis 28 endpoints `/api/ai/images/*` (generación) + `/api/storage/r2/*`
       (storage). El front quiere CRUD básico tipo:

         createImage({ fileId, url, prompt? }) → Image
         getImageItem({ id }) → Image | null
         removeImage({ id }) → void

       ¿Cuál es el canonical para esto?
         - ¿/api/storage/r2/files (GET con filter por id)?
         - ¿O hay un /api/images dedicado que no aparece en openapi?
         - ¿O lo construimos sobre /api/storage/files/{file_id}?


  3.5) upload — flujo recomendado para drag&drop / file picker
       Tenéis 9 endpoints de upload. ¿Cuál es el camino recomendado para:
         - Upload de archivo arrastrado al chat (attachment de un mensaje)
         - Upload de archivo a knowledge base
         - Upload de avatar/imagen de usuario

       Especificad si necesitamos hacer presign + put + complete (3 pasos)
       o si POST multipart en un solo paso es suficiente.

       Adjuntad ejemplo curl si podéis.


═══════════════════════════════════════════════════════════
📅 PLAN FRONT
═══════════════════════════════════════════════════════════

Iteración bloque a bloque por servicio, sin esperar a que todo esté listo:

  Fase 1 (1-2 días): upload + image + user + global   (alto impacto /chat)
  Fase 2 (1 día):    file + chatGroup + aiProvider
  Fase 3 (1 día):    plugin/tool + generation + rag + knowledgeBase
  Fase 4:            thread (esperando vuestro endpoint) + decisión ragEval
  Fase 5:            borrar deps drizzle + pglite + @trpc/* del package.json
                     (-25k módulos, build chat-ia 10min → 3-4min)

Para Fase 1-3 NO os bloqueamos. Empezamos hoy si las 5 confirmaciones de
shape están claras.


═══════════════════════════════════════════════════════════
🎯 RESPUESTA QUE NECESITAMOS
═══════════════════════════════════════════════════════════

1. ¿Plan + fecha para los 6 endpoints `thread`?
2. ¿Decisión sobre `ragEval` (implementar vs deprecar)?
3. Las 5 confirmaciones 3.1 a 3.5.

DRI: api_ia → responder en este hilo.
```

---

## Referencias para api-ia

- OpenAPI público: https://api-ia.bodasdehoy.com/openapi.json
- Schema actual front del Thread: `apps/chat-ia/packages/database/src/schemas/topic.ts` líneas con `export const threads = pgTable(`
- Service del front a migrar: `apps/chat-ia/src/services/thread/server.ts` + `type.ts`
- Patrón ya implementado (CAPA 1): `apps/chat-ia/src/services/session/apiIa.ts`, `topic/apiIa.ts`, `message/apiIa.ts`
