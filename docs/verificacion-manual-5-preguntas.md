# Verificación Manual — 5 Preguntas de Humo

> Documento para verificar que el sistema funciona correctamente en cualquier entorno.
> Ejecutar en orden. Duración estimada: ~10 min.

---

## Acceso al sistema (rutas locales y remotas)

| Entorno | App organizador | Chat IA | Memories |
|---------|----------------|---------|----------|
| **Local dev** | `http://localhost:3220` | `http://localhost:3210` | `http://localhost:3240` |
| **Dev (CF tunnel)** | `https://app-dev.bodasdehoy.com` | `https://chat-dev.bodasdehoy.com` | — |
| **Test (Vercel)** | `https://app-test.bodasdehoy.com` | `https://chat-test.bodasdehoy.com` | — |
| **Producción** | `https://organizador.bodasdehoy.com` | `https://chat.bodasdehoy.com` | — |

**Usuario de prueba:** `bodasdehoy.com@gmail.com`
**Evento de prueba:** Raul y Ana (o cualquier evento activo)

---

## Preguntas de verificación

---

### P1 — Datos en tiempo real (tool: `get_event_guests`)

**Dónde:** Chat IA → con sesión iniciada y evento seleccionado
**Pregunta:**
> ¿Cuántos invitados tengo confirmados en mi boda?

**Respuesta esperada:**
- La IA ejecuta una herramienta (aparece "Analizando tu solicitud..." o similar)
- Responde con un **número concreto**, por ejemplo: *"Tienes 47 invitados confirmados de un total de 120"*
- NO debe responder con: *"No puedo acceder a esa información"* ni con un saludo genérico

**✅ PASS si:** Da un número real de tu evento
**❌ FAIL si:** Dice que no puede acceder, da error, o responde en inglés

---

### P2 — Cambio de contexto en el front (tool: `lobe-filter-app-view`)

**Dónde:** Chat IA + appEventos abiertos en paralelo (la ventana del organizador debe ser visible)
**Pregunta:**
> Muéstrame la sección de invitados

**Respuesta esperada:**
- La IA responde confirmando que va a mostrar los invitados
- La app **appEventos cambia automáticamente** a la vista de Invitados (la ventana de la app se actualiza sola, sin que el usuario haga clic)
- El chat muestra una respuesta como: *"Aquí tienes la sección de invitados de tu evento"*

**✅ PASS si:** appEventos navega a invitados solo, en sincronía con el chat
**❌ FAIL si:** La app no cambia de sección, o el chat dice que no puede navegar

---

### P3 — CRUD: añadir dato (tool: `add_guest`)

**Dónde:** Chat IA → con sesión iniciada y evento seleccionado
**Pregunta:**
> Añade un invitado llamado María García Test, email: mariagarcia.test@gmail.com

**Respuesta esperada:**
- La IA confirma que ha añadido el invitado
- Menciona el **nombre exacto** "María García Test" en su respuesta
- Si tienes appEventos abierto en invitados, la lista se refresca y aparece María García Test

**✅ PASS si:** La IA confirma el nombre exacto + el invitado aparece en la lista
**❌ FAIL si:** La IA da un error genérico, no menciona el nombre, o no aparece en la lista

---

### P4 — Widget visitante (sin login)

**Dónde:** Abrir en una ventana de incógnito (sin sesión): `https://chat-dev.bodasdehoy.com/widget-demo` o embeber el widget en cualquier página
**Pregunta:**
> ¿Cuánto cuesta la app y qué planes tiene?

**Respuesta esperada:**
- El widget responde con información **comercial y de ventas**: planes, precios aproximados, o redirige a hablar con un asesor
- NO debe intentar acceder a datos de ningún evento
- NO debe mostrar un error de autenticación
- Puede ser algo como: *"Tenemos planes desde 0€ con funciones esenciales hasta planes Pro con gestión completa..."*

**✅ PASS si:** Respuesta comercial coherente, sin errors de auth
**❌ FAIL si:** Error 401/403, pantalla en blanco, o responde como si tuviera acceso a datos privados

---

### P5 — Bandeja de mensajes SSE (tiempo real)

**Dónde:** Chat IA → sección `/messages` (panel izquierdo "Mensajes")
**Pregunta a verificar (no al chat, sino observación visual):**
> Enviar un WhatsApp al número de la cuenta de prueba desde un teléfono real. En los siguientes 30 segundos, ¿aparece el mensaje nuevo en la bandeja sin recargar la página?

**Respuesta esperada:**
- Sin recargar la página, en ≤30 segundos aparece el nuevo mensaje de WhatsApp en la lista de conversaciones
- El badge de mensajes no leídos aumenta en 1
- NO es necesario hacer F5

**✅ PASS si:** El mensaje aparece solo (SSE funcionando)
**❌ FAIL si:** Hay que recargar para ver el mensaje nuevo, o no aparece

---

## Resumen de resultados

| # | Prueba | Resultado | Comentario |
|---|--------|-----------|------------|
| P1 | Datos en tiempo real | ⬜ | |
| P2 | Cambio de contexto en front | ⬜ | |
| P3 | CRUD añadir invitado | ⬜ | |
| P4 | Widget visitante | ⬜ | |
| P5 | Bandeja SSE tiempo real | ⬜ | |

Fecha: ___________
Entorno: ___________
Ejecutado por: ___________

---

## Diagnóstico rápido si algo falla

| Síntoma | Causa probable | Solución |
|---------|---------------|----------|
| Chat responde en inglés con saludo genérico | El chat capturó el mensaje de bienvenida, no tu pregunta | Esperar 3s tras abrir el chat antes de escribir |
| "No puedo acceder a esa información" | JWT caducado o sesión expirada | Cerrar sesión y volver a entrar |
| La app organizador no cambia de sección (P2) | PostMessage bridge caído | Recargar ambas pestañas y repetir |
| Error 402 o "saldo insuficiente" | Saldo del copilot agotado | Recargar saldo en `/settings/billing` |
| Widget sin respuesta | Turbopack muerto en local | `pnpm dev:copilot` y reiniciar |
