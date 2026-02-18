# Pendientes y batería de 20 preguntas para probar Copilot y api-ia

**Objetivo:** Tener claro qué está pendiente, mostrar las 20 preguntas y cómo ejecutar las pruebas que simulan al usuario para comprobar que las peticiones llegan a api-ia y el proveedor responde con lógica (sin errores, aportando valor).

---

## 1. Pendientes (resumen)

### En Slack / con api-ia

- **503 en POST /webapi/chat/auto:** api-ia debe revisar API key del proveedor. Mientras siga 503, ninguna pregunta recibe respuesta coherente desde el backend.
- **Cloudflare (app-test y chat-test):** Configurar Public Hostnames del túnel para HTTPS sin puerto (login Firebase).
- **Credenciales whitelabel bodasdehoy:** Cuando API2/api-ia tengan listas, avisar para volver a ejecutar tests.

### Nuestros (Frontend)

- Responder a api-ia sobre Sistema de Keys (más detalle si lo piden), Balance en UI, Notificaciones keys deshabilitadas.

**Referencia:** `docs/PENDIENTES-Y-SLACK-ESTADO.md`, `TAREAS-PENDIENTES-SLACK.md`.

---

## 2. Las 20 preguntas de la batería

Son las que usamos para probar: saludos, contexto de evento (invitados, presupuesto, mesas), navegación, resumen, acciones (agregar invitados), eventos próximo año, etc.

| # | Pregunta |
|---|----------|
| 1 | Hola |
| 2 | ¿Cuántos invitados tengo? |
| 3 | ¿Cuánto llevo pagado del presupuesto? |
| 4 | Quiero ver mis invitados |
| 5 | Llévame al presupuesto |
| 6 | ¿Cómo se llama mi evento? |
| 7 | ¿Cuántas mesas tengo? |
| 8 | Dime 3 consejos para organizar una boda |
| 9 | Dame un resumen completo de mi evento |
| 10 | Agrega a Jose Garcia y Jose Morales como invitados a mi evento |
| 11 | ¿Cuántos días faltan para mi boda? |
| 12 | ¿Cuál es la boda de Raul? |
| 13 | Muéstrame la lista de todas las bodas |
| 14 | ¿Qué tareas tengo pendientes para mi boda? |
| 15 | Dame ideas para el menú del banquete |
| 16 | ¿Cuánto llevo gastado en el presupuesto? |
| 17 | ¿Qué eventos tengo para el próximo año? |
| 18 | ¿Quién es mi proveedor de flores? |
| 19 | Resume los invitados confirmados |
| 20 | ¿En qué fecha es la boda de María? |

---

## 3. Pruebas que tenemos (simulando usuario y validando respuestas con lógica)

### A) Directo contra api-ia (sin pasar por el front)

- **Script:** `node scripts/run-20-preguntas-api-ia.mjs`
- **Qué hace:** Envía cada pregunta a `POST https://api-ia.bodasdehoy.com/webapi/chat/auto` con `X-Development: bodasdehoy`.
- **Qué valida:** Que api-ia y el proveedor respondan (HTTP 200 y texto útil = coherente). No valida nuestro proxy ni el código del front.

```bash
node scripts/run-20-preguntas-api-ia.mjs
node scripts/run-20-preguntas-api-ia.mjs --json --output docs/resultados-20-api-ia.json
```

### B) Batería vía proxy del front (simulando usuario a nivel HTTP)

- **Script:** `apps/web/scripts/test-copilot-battery.js`
- **Qué hace:** Envía varias preguntas a `POST BASE/api/copilot/chat` (BASE = localhost:3000 por defecto) con metadata de evento (Boda de Paco y Pico, invitados, presupuesto, etc.). El proxy del front reenvía a api-ia.
- **Qué valida:** Que el front reciba la petición, la reenvíe a api-ia, y que la respuesta sea coherente (contenido, sin errores, cumple expectativas por prueba).
- **Requisito:** App web en marcha (`pnpm dev` en apps/web, puerto 3000 o 8080 según config).

```bash
cd apps/web && node scripts/test-copilot-battery.js
# O con BASE explícito:
BASE=http://localhost:8080 node apps/web/scripts/test-copilot-battery.js
```

La batería incluye expectativas por prueba (p. ej. "25 invitados", "/invitados", "Paco", "Pico"). Si api-ia devuelve 503, las pruebas fallan; cuando api-ia responda bien, validamos que todo el código del front y las respuestas aporten valor al usuario.

### C) E2E con Playwright (simulando usuario en el navegador)

- **Script:** `apps/web/scripts/test-copilot-questions.js`
- **Qué hace:** Abre navegador, login en app-test, abre el Copilot (iframe), escribe cada pregunta en el input y envía. Espera respuesta.
- **Qué valida:** Flujo completo de usuario: login, apertura del Copilot, envío de mensajes y recepción de respuestas en la UI.
- **Requisito:** App corriendo, Playwright instalado, y en el script BASE/credenciales según entorno.

```bash
cd apps/web && node scripts/test-copilot-questions.js
```

---

## 4. Qué hacer para probar que todo esté correcto

1. **Cuando api-ia siga con 503:** Ejecutar (A) o (B) sirve para confirmar que las peticiones llegan y que el fallo es el 503 (todas incoherentes). El front está preparado para cuando api-ia responda bien.
2. **Cuando api-ia ya responda 200:**  
   - Ejecutar **`node scripts/run-20-preguntas-api-ia.mjs`** para ver cuántas de 20 son coherentes contra api-ia directo.  
   - Ejecutar **`node apps/web/scripts/test-copilot-battery.js`** con la app en marcha para validar front + api-ia y que las respuestas cumplan el objetivo de cada pregunta (valor al usuario).
3. Opcional: usar **test-copilot-questions.js** para un flujo E2E real (login + Copilot + preguntas).

---

## 5. Criterio "respuesta con lógica"

- **Coherente / con lógica:** HTTP 200 y el cuerpo de la respuesta es texto útil del asistente (saludo, datos de evento, consejos, enlaces, confirmaciones), no mensaje de error ni vacío.
- **Incoherente:** HTTP 503 (u otro error), o 200 con mensaje de error del backend ("API key no válida", "servicio no disponible", etc.) o respuesta vacía. También se considera incoherente el fallback del front que no usa datos de evento (no aporta valor al objetivo del usuario).

---

## 6. Referencias

- Pendientes y Slack: `docs/PENDIENTES-Y-SLACK-ESTADO.md`
- Análisis 20 preguntas y ejemplo sin lógica API: `docs/ANALISIS-20-PREGUNTAS-API-IA.md`
- Script 20 preguntas directo api-ia: `scripts/run-20-preguntas-api-ia.mjs`
- Batería vía proxy: `apps/web/scripts/test-copilot-battery.js`
- E2E preguntas: `apps/web/scripts/test-copilot-questions.js`
- Página de test con lista de preguntas: `apps/web/pages/test-preguntas.tsx` (ruta `/test-preguntas`)
