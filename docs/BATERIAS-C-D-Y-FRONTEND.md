# Baterías C y D – 20 preguntas + pruebas con Frontend levantado

**Última ejecución:** 17 feb 2026

---

## 1. Cuatro baterías de 20 preguntas

| Batería | Script | Descripción |
|---------|--------|-------------|
| A | `node scripts/run-20-preguntas-api-ia.mjs --json` | Hola, invitados, presupuesto, tareas, etc. |
| B | `node scripts/run-20-preguntas-api-ia-bateria-b.mjs --json` | Buenas tardes, menú banquete, flores, mesas, etc. |
| **C** | `node scripts/run-20-preguntas-api-ia-bateria-c.mjs --json` | Buenos días, banquete, decoración, invitados por mesa, etc. |
| **D** | `node scripts/run-20-preguntas-api-ia-bateria-d.mjs --json` | Ayuda boda, total presupuesto, dieta invitados, etc. |

Todas llaman a `https://api-ia.bodasdehoy.com/webapi/chat/auto` con `X-Development: bodasdehoy`.

---

## 2. Levantar app-test y chat-test (Frontend)

Para tener **app-test** (web) y **chat-test** (Copilot) en local:

```bash
# Desde la raíz del repo

# Terminal 1: app-test (Next.js web, puerto 8080)
pnpm --filter @bodasdehoy/web dev
# o: pnpm dev:web

# Terminal 2: chat-test (Copilot, puerto 3210)
pnpm --filter @bodasdehoy/copilot dev
# o: pnpm dev:copilot
```

**Ambos a la vez** (en paralelo):

```bash
pnpm dev
```

- **app-test:** http://127.0.0.1:8080 (o http://localhost:8080)
- **chat-test:** http://127.0.0.1:3210 (o http://localhost:3210)

Cuando ambos estén levantados, puedes ejecutar la **batería D** (u otra) para probar api-ia con el mismo backend mientras el Frontend corre:

```bash
node scripts/run-20-preguntas-api-ia-bateria-d.mjs --json
```

Las baterías llaman directo a api-ia (no pasan por el proxy del Frontend); sirven para contrastar que api-ia responde igual con Frontend levantado o no.

---

## 3. Resultados 17 feb 2026

### Batería C (20 preguntas nuevas)

- **Coherentes:** 18 / 20  
- **Incoherentes:** 2 / 20  
  - #15 «¿Qué facturas tengo pendientes de pago?» → **502** (163 ms)  
  - #17 «Asigna a los García a la mesa principal» → **503** (4353 ms)  

### Batería D (con app-test y chat-test levantados)

- **Coherentes:** 17 / 20  
- **Incoherentes:** 3 / 20  
  - #13 «Dame el nombre del invitado en asiento 12» → **503**  
  - #14 «Opciones de alojamiento para invitados» → **503**  
  - #17 «Renombra la mesa 2 a "Amigos del trabajo"» → **503**  

---

## 4. Ejemplos de respuesta (Batería C)

**Pregunta 1 – Buenos días, ¿qué puedo hacer hoy?**  
HTTP 200, ~3 s. Respuesta (resumida): opciones para revisar eventos, crear evento, verificar invitados, revisar presupuesto.

**Pregunta 2 – ¿Cuánto cuesta el banquete en total?**  
HTTP 200, ~4 s. Respuesta: indica que va a ejecutar `get_user_events()` para obtener datos actualizados del banquete y dar el coste total.

**Pregunta 4 – ¿Qué decoración tengo contratada?**  
HTTP 200, ~4 s. Respuesta: lista eventos con decoración (ej. Floristería, mobiliario, globos, fotomatón) y enlace al panel de eventos.

Los JSON completos se guardan como `resultados-20-preguntas-bateria-c-YYYY-MM-DD.json` y `resultados-20-preguntas-bateria-d-YYYY-MM-DD.json` en la raíz del repo.
