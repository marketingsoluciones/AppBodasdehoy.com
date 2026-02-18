# Batería de pruebas para que api-ia ejecute internamente

**Objetivo:** Que el equipo api-ia pueda lanzar desde su entorno exactamente las mismas pruebas que usa el Frontend, con las mismas queries, headers y lógica, para analizar y corregir fallos (503, AUTH_ERROR, EMPTY_RESPONSE) sin depender de idas y vueltas por Slack.

**Comunicación:** Respuestas rápidas usando #copilot-api-ia. El Frontend puede revisar Slack cuando trabaje en este caso; si api-ia necesita que revisemos cada poco, lo indican en el canal y/o el Frontend puede ejecutar `./scripts/slack-read.sh 10` cada X minutos (o cron cada 1 min: `* * * * * cd /ruta/repo && ./scripts/slack-read.sh 5 >> /tmp/slack.log`).

---

## 1. Parámetros de entorno / variables

| Variable | Valor que usamos | Descripción |
|----------|------------------|-------------|
| **BASE_URL** | `https://api-ia.bodasdehoy.com` | Base del backend (o vuestra URL interna si probáis contra vuestro servidor). |
| **DEVELOPMENT** | `bodasdehoy` | Header `X-Development`; identifica el whitelabel. |
| **FIREBASE_JWT** (opcional) | Token idToken de Firebase | Si queréis probar *con usuario*: header `Authorization: Bearer <token>`. Ver apartado 4. |

---

## 2. Headers de cada request

- **Content-Type:** `application/json`
- **X-Development:** `bodasdehoy`
- **X-Request-Id** (opcional): ej. `test_$(date +%s)` para traza
- **Authorization** (opcional): `Bearer <JWT>` si tenéis token de usuario (Firebase). Sin este header las pruebas son “sin usuario”.

---

## 3. Batería de 20 preguntas (queries exactas)

Lista en orden. Cada una se envía como único mensaje de usuario en el body.

```
1. Hola
2. ¿Cuántos invitados tengo?
3. ¿Cuánto llevo pagado del presupuesto?
4. Quiero ver mis invitados
5. Llévame al presupuesto
6. ¿Cómo se llama mi evento?
7. ¿Cuántas mesas tengo?
8. Dime 3 consejos para organizar una boda
9. Dame un resumen completo de mi evento
10. Agrega a Jose Garcia y Jose Morales como invitados a mi evento
11. ¿Cuántos días faltan para mi boda?
12. ¿Cuál es la boda de Raul?
13. Muéstrame la lista de todas las bodas
14. ¿Qué tareas tengo pendientes para mi boda?
15. Dame ideas para el menú del banquete
16. ¿Cuánto llevo gastado en el presupuesto?
17. ¿Qué eventos tengo para el próximo año?
18. ¿Quién es mi proveedor de flores?
19. Resume los invitados confirmados
20. ¿En qué fecha es la boda de María?
```

---

## 4. Cómo obtener el token del usuario (opcional)

Para probar **con** el mismo contexto que la app (usuario logado), hace falta un **idToken de Firebase** (proyecto bodasdehoy).

- **Opción A – Frontend os pasa credenciales de prueba:**  
  Email y contraseña de un usuario de prueba del proyecto bodasdehoy. Con eso podéis llamar a la API de Firebase y obtener el token (ver abajo).
- **Opción B – Frontend os pasa un token temporal:**  
  Podemos generar un idToken (válido 1 h) y enviároslo por Slack o canal seguro; lo usáis solo como header `Authorization: Bearer <token>`.

**Firebase REST – obtener idToken (si tenéis email/password):**

- **URL:**  
  `POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDVMoVLWWvolofYOcTYA0JZ0QHyng72LAM`
- **Headers:**  
  `Content-Type: application/json`
- **Body:**  
  `{"email":"<EMAIL>","password":"<PASSWORD>","returnSecureToken":true}`
- **Respuesta:**  
  En el JSON, campo `idToken`. Ese valor es el que va en `Authorization: Bearer <idToken>`.

*(La API key es la del cliente web bodasdehoy; es pública en el frontend.)*

---

## 5. Request por pregunta (lógica que usamos)

Para **cada** una de las 20 preguntas:

- **Método y URL:**  
  `POST {BASE_URL}/webapi/chat/auto`
- **Headers:**  
  `Content-Type: application/json`, `X-Development: bodasdehoy`, y si tenéis token: `Authorization: Bearer <idToken>`.
- **Body (JSON):**  
  `{"messages":[{"role":"user","content":"<PREGUNTA>"}],"stream":false}`  
  donde `<PREGUNTA>` es exactamente una de las 20 frases del apartado 3.

**Ejemplo (pregunta 2) con curl:**

```bash
curl -sS -X POST "https://api-ia.bodasdehoy.com/webapi/chat/auto" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{"messages":[{"role":"user","content":"¿Cuántos invitados tengo?"}],"stream":false}'
```

Con usuario (si tenéis JWT):

```bash
curl -sS -X POST "https://api-ia.bodasdehoy.com/webapi/chat/auto" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "Authorization: Bearer VUESTRO_ID_TOKEN" \
  -d '{"messages":[{"role":"user","content":"¿Cuántos invitados tengo?"}],"stream":false}'
```

---

## 6. Criterio “coherente” vs “incoherente” (nuestra lógica)

- **Coherente:**  
  HTTP 200 **y** el cuerpo de la respuesta contiene texto útil (p. ej. `message`, `content` o `choices[0].message.content`) **y** ese texto no contiene ninguna de estas cadenas (en minúsculas):  
  `error de autenticación`, `api key`, `no es válida`, `no configurada`, `servicio no disponible`, `no está disponible`, `requestid`, `trace_id`, `ia_backend`.
- **Incoherente:**  
  Cualquier otro caso: HTTP distinto de 200, cuerpo vacío, o texto de error según lo anterior.

Resumen que sacamos: **coherentes / 20** y **incoherentes / 20**. Objetivo: 20/20 coherentes.

---

## 7. Test de proveedores (anthropic, groq, openai, auto)

1. **Health:**  
   `GET {BASE_URL}/health`  
   Esperado: 200 y body con `"status":"healthy"`.

2. **Listado de proveedores:**  
   `GET {BASE_URL}/api/providers/bodasdehoy`  
   Header: `X-Development: bodasdehoy`.  
   De aquí podéis leer los `provider` y `model` que usamos por defecto.

3. **Chat por proveedor:**  
   Para cada uno de: `anthropic`, `groq`, `openai`, `auto`:
   - **URL:**  
     `POST {BASE_URL}/webapi/chat/{provider}`  
     (ej. `POST .../webapi/chat/anthropic`, `.../webapi/chat/groq`, etc.)
   - **Headers:**  
     `Content-Type: application/json`, `X-Development: bodasdehoy`. Opcional: `Authorization: Bearer <JWT>`.
   - **Body (con model para anthropic, groq, openai):**  
     `{"messages":[{"role":"user","content":"Responde solo: OK"}],"model":"<MODEL>","stream":false}`  
     donde `<MODEL>` es el que devuelve `GET /api/providers/bodasdehoy` para ese provider (ej. `claude-3-5-sonnet-20241022`, `llama-3.1-70b-versatile`, `gpt-4o`).
   - **Body para auto:**  
     `{"messages":[{"role":"user","content":"Responde solo: OK"}],"stream":false}`  
     (sin `model`).

Criterio **OK** para cada proveedor: HTTP 200, `success == true` y contenido en `message`/`content` (no vacío). Cualquier 503, AUTH_ERROR, EMPTY_RESPONSE o mensaje vacío lo consideramos FAIL.

---

## 8. Resumen de endpoints y body

| Qué | Método | URL | Body (resumido) |
|-----|--------|-----|-----------------|
| Health | GET | `{BASE_URL}/health` | — |
| Config/Providers | GET | `{BASE_URL}/api/providers/bodasdehoy` | — |
| Chat auto (20 preguntas) | POST | `{BASE_URL}/webapi/chat/auto` | `{"messages":[{"role":"user","content":"<pregunta>"}],"stream":false}` |
| Chat anthropic | POST | `{BASE_URL}/webapi/chat/anthropic` | `{"messages":[{"role":"user","content":"Responde solo: OK"}],"model":"<model>","stream":false}` |
| Chat groq | POST | `{BASE_URL}/webapi/chat/groq` | idem con su model |
| Chat openai | POST | `{BASE_URL}/webapi/chat/openai` | idem con su model |
| Chat auto (1 frase) | POST | `{BASE_URL}/webapi/chat/auto` | `{"messages":[{"role":"user","content":"Responde solo: OK"}],"stream":false}` |

En todos los POST: headers `Content-Type: application/json`, `X-Development: bodasdehoy`. Añadir `Authorization: Bearer <token>` si probáis con usuario.

---

## 9. Qué necesitáis de nosotros para “con usuario”

- **Opción 1:** Os pasamos **email + contraseña** de un usuario de prueba (por canal seguro / Slack privado). Con eso y el apartado 4 obtenéis el token y probáis las 20 preguntas y los proveedores con `Authorization: Bearer <idToken>`.
- **Opción 2:** Os pasamos un **idToken temporal** (válido ~1 h) cuando vayáis a hacer la batería; lo usáis solo en ese run.

Decidid en #copilot-api-ia qué opción preferís y coordinamos.

---

Con esta batería, queries y lógica podéis reproducir nuestros resultados en vuestro entorno y ver qué corregir o mejorar. Si algo falla, enviad por Slack request + response + trace_id y nosotros seguimos el mismo criterio para reportar. Para que las respuestas sean lo más automáticas posible: este canal (#copilot-api-ia) y, si hace falta, el Frontend revisando Slack cada X minutos con `./scripts/slack-read.sh`.
