# Análisis 20 preguntas api-ia – Para verificación equipo api-ia

**Fecha:** 12 feb 2025

**Objetivo:** (1) Resumir todo lo pendiente con api-ia, (2) listar 20 preguntas de prueba, (3) analizar en cuántas se respondió coherentemente, (4) dar ejemplo de respuesta sin lógica API para que api-ia verifique por qué fallaron y dieron respuestas incoherentes.

---

## 1. Todo lo pendiente con api-ia

| # | Pendiente | Responsable |
|---|-----------|-------------|
| 1 | 503 en POST /webapi/chat/auto (API key no válida) | api-ia |
| 2 | Respuesta al informe Sistema de Keys | Frontend |
| 3 | Balance de keys en UI | Frontend |
| 4 | Notificaciones keys deshabilitadas | Frontend |
| 5 | Cloudflare app-test/chat-test | Frontend (nosotros) – tenemos acceso |
| 6 | Credenciales whitelabel bodasdehoy (API2) | API2 / api-ia |

Ref: `docs/PENDIENTES-Y-SLACK-ESTADO.md`, `docs/INFORME-CONVERSACIONES-Y-API-IA-FEB2025.md`

---

## 2. Las 20 preguntas utilizadas

**Estado:** Aceptadas como batería de prueba oficial.

Enviadas a `POST https://api-ia.bodasdehoy.com/webapi/chat/auto` con `X-Development: bodasdehoy`.

1. Hola
2. ¿Cuántos invitados tengo?
3. ¿Cuánto llevo pagado del presupuesto?
4. Quiero ver mis invitados
5. Llévame al presupuesto
6. ¿Cómo se llama mi evento?
7. ¿Cuántas mesas tengo?
8. Dime 3 consejos para organizar una boda
9. Dame un resumen completo de mi evento
10. Agrega a Jose Garcia y Jose Morales como invitados
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

**Reproducir:** `node scripts/run-20-preguntas-api-ia.mjs --json --output docs/resultados-20-preguntas-api-ia.json`

---

## 3. Criterio coherente vs incoherente

- **Coherente:** HTTP 200 y cuerpo con texto útil del asistente (no error).
- **Incoherente:** HTTP 503 u otro error, o HTTP 200 con mensaje de error del backend (ej. "API key no válida") o vacío. También respuestas de fallback del front sin datos de evento.

---

## 4. Resultado actual

**Última ejecución (14 feb 2026):**
- Sin JWT: Coherentes 2/20 (#4, #15).
- Con JWT (usuario bodasdehoy.com@gmail.com): Coherentes **1/20** (#15), Incoherentes **19/20** (503/502). El fallo sigue en backend api-ia, no en la identificación del usuario.

Para repetir con usuario: `TEST_USER_EMAIL=... TEST_USER_PASSWORD=... node scripts/get-firebase-token-and-run-20.mjs`. Detalle en `docs/resultados-20-preguntas-api-ia.json`.

---

## 5. Ejemplo respuesta SIN lógica API (para que api-ia verifique)

**Request:** `POST https://api-ia.bodasdehoy.com/webapi/chat/auto`, body: `messages` con "¿Cuántos invitados tengo?"

**Response real (503):** HTTP 503, body `error`: IA_BACKEND_ERROR, `message`: "Error de autenticación con el proveedor de IA. La API key configurada no es válida."

**Qué verificar en api-ia:** logs al recibir este POST; qué proveedor/modelo y qué API key se usan para bodasdehoy; por qué el proveedor devuelve invalid API key.

**Fallback en front:** Si el front usa OpenAI directo sin herramientas, el usuario puede ver texto genérico ("No tengo acceso a la información de tus invitados..."). Incoherente porque debería usar herramienta/API. Causa raíz: api-ia devolvió 503.

---

## 6. Qué necesitamos que api-ia verifique

1. Por qué POST /webapi/chat/auto devuelve 503: API key, env, logs.
2. Con el ejemplo anterior, confirmar en logs proveedor/key y causa de fallo.
3. Tras corregir 503, re-ejecutar script y comprobar cuántas de 20 son coherentes.

---

## 7. Referencias

- Script: `scripts/run-20-preguntas-api-ia.mjs`
- Pendientes: `docs/PENDIENTES-Y-SLACK-ESTADO.md`
- Informe 503: `docs/INFORME-CONVERSACIONES-Y-API-IA-FEB2025.md`
- Fallback: `apps/web/SISTEMA-FALLBACK-COPILOT.md`
- Batería vía proxy (simular usuario): `apps/web/scripts/test-copilot-battery.js` con BASE=http://localhost:8080

---

## 8. Batería simulando usuario (front → api-ia → respuestas con lógica)

Para probar que **las peticiones llegan a api-ia** y que **el proveedor responde con lógica** (sin errores, aportando valor al usuario), y que **nuestro código del front está correcto**:

### Opción A: Directo api-ia (valida backend + proveedor)

```bash
node scripts/run-20-preguntas-api-ia.mjs
```

Envía las 20 preguntas a `POST api-ia/webapi/chat/auto`. No pasa por el proxy del front.

### Opción B: Vía proxy del front (valida front + api-ia)

Con la app web en marcha (ej. `pnpm dev` en apps/web, puerto 8080):

```bash
cd apps/web && BASE=http://localhost:8080 node scripts/test-copilot-battery.js
```

Envía preguntas a `POST BASE/api/copilot/chat` con metadata de evento; el proxy reenvía a api-ia. La batería tiene expectativas por prueba (ej. "25 invitados", "Paco", "/invitados"). Cuando api-ia responda 200, validamos que el front y las respuestas cumplan el objetivo del usuario.

### Opción C: E2E con Playwright (usuario real en navegador)

```bash
cd apps/web && node scripts/test-copilot-questions.js
```

Abre navegador, login, Copilot en iframe, escribe y envía preguntas. Requiere Playwright y app corriendo.

**Resumen pendientes:** ver `docs/PENDIENTES-Y-SLACK-ESTADO.md`.

## 8. Batería simulando usuario (front a api-ia)

- Directo api-ia: node scripts/run-20-preguntas-api-ia.mjs
- Via proxy front: cd apps/web && BASE=http://localhost:8080 node scripts/test-copilot-battery.js
- E2E Playwright: cd apps/web && node scripts/test-copilot-questions.js
Pendientes: docs/PENDIENTES-Y-SLACK-ESTADO.md

