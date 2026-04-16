# Comportamiento esperado del Copilot

Resumen de cómo debería comportarse el Copilot desde el punto de vista del usuario y del E2E.

---

## Ver los avances (despliegue)

Los cambios de este repo (banner "Continuar / Nueva conversación", envío de historial en el embed, E2E con textarea, etc.) **solo se ven en app-test si la app está recompilada y desplegada**. Si no ves avances: compilar y desplegar **app-eventos** en el entorno de app-test (y, si usas iframe, **chat-ia** en chat-test). Los E2E y la doc no requieren despliegue; la app sí.

---

## Un evento vs varios eventos: cuándo filtrar en app y cuándo responder en el chat

- **Un solo evento (o contexto claro de un evento):** la app puede filtrar y **mostrar en el panel derecho** (invitados, mesas, tareas/servicios, etc.). Ejemplos: “invitados que no han confirmado” (del evento actual), “en qué mesa está Pablo”, “dame la tarea pendiente de montaje”, “muéstrame la mesa 1”.
- **Varios eventos o cuando la app no puede mostrarlo:** el sistema **no está preparado** para mostrar en una sola pantalla invitados/tareas/mesas de varios eventos a la vez. En ese caso el Copilot **debe responder en el chat**: listado en texto, enlaces a cada evento (p. ej. [Ver invitados de Boda Isabel](/invitados?event=…)), o resumen por evento. Lo mismo aplica a tareas/servicios de varios eventos: la info o los enlaces van en el chat.
- **Regla:** si se puede filtrar y mostrar en la pantalla de la app (un evento) → navegar y aplicar filtro. Si son varios eventos o la vista no existe → **pasar la información o los enlaces por el chat**.

Los **filtros** deben tener **lógica y mostrar algo útil**; si lo que pide el usuario se resuelve mejor listando en el chat (varios eventos, resumen global), hacer eso en lugar de un filtro vacío.

---

## Pantalla por defecto

- **Por defecto debe mostrarse siempre la pantalla de eventos** (home / lista de bodas del usuario).
- No abrir automáticamente invitados, mesas ni itinerario hasta que el usuario hable con el Copilot y pida algo concreto.

---

## Qué debe hacer el Copilot

1. **Entender** lo que pide el usuario (invitados, una mesa, itinerario, tareas/servicios, resumen, etc.).
2. **Decidir** si es de un evento (→ filtrar y mostrar en app) o de varios / no mostrable (→ responder en el chat con listado o enlaces).
3. **Un evento:** posicionarse en la pantalla correcta (invitados, mesas, itinerario/servicios) y **ejecutar el filtro**; el resultado se ve en el panel derecho (ej.: invitados no confirmados, mesa de Pablo, tarea pendiente de montaje).
4. **Varios eventos o vista no disponible:** dar la información o los enlaces en el **chat** (lista de invitados por evento, enlaces [Ver invitados de …], tareas por evento, etc.).

El objetivo es **probar toda la funcionalidad**: tanto “filtrar y mostrar en app” como “responder en el chat cuando la app no puede mostrarlo”.

---

## Conversación

- El Copilot **debe tener forma de recuperar conversaciones anteriores**. Al abrir el panel no debe mostrarse solo la pantalla de bienvenida con el input vacío si ya existía una conversación; debe **cargar el historial** (por sessionId/cookie) y permitir seguir desde la última.
- Debe **recordar el contexto** en la misma sesión (conversaciones anteriores) para no perder el hilo.
- El usuario debe **ver qué se está escribiendo** en el Copilot (tecleo visible o mensaje claro antes de enviar).

**Pendiente (producto / chat-ia):** En el iframe LobeChat, al abrir el panel hay que cargar la última conversación en lugar de "Bienvenido a Bodas de Hoy" con input vacío. Sin esto, el usuario no ve avances en recuperar conversación.

---

## E2E

El test de flujo Copilot:

- Hace login y **se queda en la pantalla de eventos** (home).
- Abre el Copilot y escribe la pregunta **sin navegar antes** a invitados/mesas/etc.
- Espera a que el Copilot (y la app) naveguen y muestren el resultado o el filtro.

Así se valida que el Copilot entiende y ejecuta la acción (navegar + filtrar), no que el test lleve ya al usuario a una pantalla.
