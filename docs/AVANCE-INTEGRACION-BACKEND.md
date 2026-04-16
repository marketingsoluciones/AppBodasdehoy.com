# Avance – Integración Backend (api-ia + API2)

Documento de avance que une **PREGUNTAS-BACKEND-COPILOT.md** y **PREGUNTAS-API-IA-TEST-DATOS-REALES.md** con próximos pasos concretos.

---

## Resumen de estado

| Área | Estado | Acción |
|------|--------|--------|
| Chat en vivo | ✅ Contrato definido (POST /webapi/chat/auto, metadata, headers) | Solo validar con ejemplos reales SSE |
| Historial | ⏳ Leemos desde API2 `getChatMessages` (api-ia guarda ahí) | Confirmar forma exacta de respuesta |
| SessionId | ✅ Usamos `user_<uid>` / `guest_<id>` | Confirmar si api-ia lo usa y en qué campo |
| SSE enriquecido | ⏳ Parseamos event_card, usage, reasoning, tool_result, etc. | Pedir 1–2 ejemplos reales por tipo |
| Métricas | ❓ Desconocido | Definir si backend registra o front debe reportar |
| Auth / identify-user | ❓ 404 si usuario no existe en BD api-ia | Aclarar sincronización Firebase ↔ api-ia |
| Tests con datos reales | ❌ Sin URL/credenciales de test | Pedir entorno test + sessionId de prueba |

---

## Próximos pasos (orden sugerido)

### 1. Confirmar contratos actuales (sin cambiar código)

- [ ] **api-ia**: Confirmar que el body de chat (messages, metadata, stream) y headers son los correctos; si hay campo obligatorio adicional (ej. `metadata.sessionId` con otro nombre), documentarlo.
- [ ] **api-ia**: Confirmar que el historial se lee solo desde API2 con `getChatMessages` y que api-ia es quien escribe ahí al finalizar el stream.
- [ ] **API2**: Obtener forma exacta de la respuesta de `getChatMessages` (id, role, content, createdAt, metadata; formato de createdAt).

### 2. Alinear parseo SSE con datos reales

- [ ] **api-ia**: Solicitar 1–2 ejemplos reales (anonimizados) de líneas SSE para: `event_card`, `usage`, `reasoning`, `tool_result` (y si aplica `tool_start`, `progress`).
- [ ] Actualizar fixtures y tests de parseo en el front con esos ejemplos para no depender de suposiciones.

### 3. Entorno de pruebas

- [ ] **api-ia**: URL de api-ia para pruebas (staging/test) y credenciales (JWT de test, API key, etc.).
- [ ] **api-ia**: Un `sessionId` de prueba con mensajes ya guardados en API2 para probar `getChatMessages` de punta a punta.
- [ ] Opcional: Usuario/JWT de test para automatización (health, un mensaje de chat) sin tocar producción.

### 4. Decisión de arquitectura (opcional)

- [ ] **api-ia**: Valorar si prefieren que el front **solo** hable con api-ia. Si api-ia expusiera algo tipo `GET /webapi/chat/history?sessionId=...` (llamando a API2 por detrás), el front podría dejar de llamar a API2 para historial.

### 5. Otros (PREGUNTAS-BACKEND-COPILOT)

- [ ] Historial: ¿api-ia persiste por sessionId/userId? ¿Endpoint para obtener historial o se deriva de las propias peticiones?
- [ ] SessionId: ¿Se usa en api-ia? ¿Header o campo concreto?
- [ ] API2: ¿Query/mutation para leer/guardar mensajes Copilot? Nombre, argumentos, formato.
- [ ] SSE: ¿api-ia envía ya event_card, usage, reasoning, tool_result? ¿Documentación o lista de tipos y formato de `data`?
- [ ] Métricas: ¿api-ia registra uso (mensajes, errores, latencia)? ¿Front debe reportar a algún endpoint?
- [ ] Auth: ¿Usuarios Firebase se sincronizan con BD api-ia? ¿Token + headers actuales bastan para asociar conversación?

---

## Checklist integración front (cuando tengamos respuestas)

- [ ] Ajustar body/headers de chat si api-ia indica cambios.
- [ ] Reemplazar persistencia en memoria por API2 `getChatMessages` (o por endpoint de historial de api-ia si lo ofrecen).
- [ ] Validar parseo SSE con ejemplos reales; actualizar tipos y tests.
- [ ] Configurar variables de entorno para entorno de test (api-ia + API2 si aplica).
- [ ] Añadir test de integración opcional (ej. `pnpm test:web:integration`) que use datos reales cuando la config esté disponible.

---

## Respuestas (rellenar cuando backend responda)

<!-- Cuando api-ia/API2 respondan, pegar aquí resumen y actualizar checklist -->

---

## Referencias

- **Preguntas al backend (copilot e integración):** `docs/PREGUNTAS-BACKEND-COPILOT.md`
- **Trabajar con datos reales – api-ia:** `docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md`

**Estado del front:** El proxy `/api/copilot/chat` ya envía `metadata.sessionId`, `metadata.userId`, `metadata.pageContext`; el historial se obtiene vía `/api/copilot/chat-history` (API2 `getChatMessages`). Solo falta confirmar contratos y ejemplos SSE reales.
