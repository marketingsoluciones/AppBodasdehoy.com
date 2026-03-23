# E2E Copilot — verificar preguntas (app-test)

**Entorno:** app-test / chat-test (subdominios). Login, túneles y BPM se dan por hechos.

## Misión

**Todo lo necesario para arrancar es cosa del agente. Un solo navegador (prohibido abrir varios).** Desde la página de inicio de la app de bodasdehoy o desde el Copilot ahí, se lanza la pregunta y el sitio debe mostrar el resultado al lado derecho; el usuario ve y confirma si es correcto. Tras cada prueba, el agente pregunta en Cursor si se realizó y qué falló para continuar.

- **Del agente:** levantar servicios, comprobarlos, **un solo navegador**, login en app-test (nunca abrir Copilot como invitado), desde la **página principal** de la app (con evento si hay) lanzar la pregunta en el Copilot y el sitio muestra el resultado a la derecha. Después de cada pregunta (o de la prueba), preguntar en Cursor: "¿Confirmas si está todo ok, qué ha fallado o qué mejorar?" No dejar de preguntar.
- **Del usuario:** confirmar solo cuando ya se ha hecho la pregunta a Copilot, ya se ha mostrado el resultado y la pantalla ha cambiado a la que muestra el filtro (panel derecho); entonces confirmar si es correcto (y Resume). Responder en Cursor si está ok, qué falló o qué mejorar.

**Flujo técnico:** Login → evento → por cada pregunta: Copilot responde → panel derecho muestra la info → **pause** → el usuario certifica si está bien → **Resume** → siguiente pregunta.

El agente lanza:
```bash
pnpm test:e2e:app:visual
```
(y se encarga de que el entorno esté listo antes).

- **Credenciales:** las toma de `e2e-app/fixtures.ts` (o `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`). La cuenta debe tener al menos un evento.
- **Evento por defecto:** el spec intenta seleccionar el evento cuyo nombre contenga "Raúl Isabel"; si no existe, usa el primero disponible. Override: `TEST_EVENT_NAME=Otro Evento`.
- **Sin pausas (solo assertions):** `E2E_WAIT_FOR_VISUAL_CONFIRMATION=0 pnpm test:e2e:app:visual`.

Preguntas incluidas: lista invitados, mesa 1, invitados confirmados, tareas itinerario, resumen mesas/invitados/presupuesto.
