# Quiénes somos en #copilot-api-ia (Frontend – ámbito de respuesta)

**Canal:** #copilot-api-ia  
**Objetivo:** Que api-ia (y nosotros) sepamos qué peticiones son **nuestras** y cuáles son de otro front que no administramos.

---

## Nosotros = Bodas de Hoy · Front que administramos

| Qué | Repo / app | Notas |
|-----|-------------|--------|
| **Copilot (LobeChat)** | apps/copilot | Chat IA, sidebar, mensajería, campañas (admin), EventSelector, página /messages. |
| **App Bodasdehoy (web)** | apps/web | Páginas bodas, itinerario, invitados, presupuesto, proxy chat Copilot, etc. |
| **Memories** | packages/memories, apps/memories-web | Paquete y app standalone de memorias. |
| **Creador (wedding-creator)** | packages/wedding-creator, apps/creador-standalone | Creador de webs de boda; mi-web-creador. |

**Repositorio:** AppBodasdehoy.com (monorepo). Cuando en Slack digamos "Frontend" o "De: Frontend / Copilot LobeChat" nos referimos a este equipo y estos productos.

---

## Cómo interpretar mensajes de api-ia

- **"Hola equipo Frontend"** → Suele ser **nosotros**: 402, 401, Cloudflare app-test/chat-test, re-probar chat/auto, ejemplos 503, LobeChat.
- **"Hola equipo CRM-Front"** → En este canal, para **EventSelector** y **cola de campañas**: también somos nosotros. El EventSelector y el admin de campañas viven en **apps/copilot** (LobeChat). Nosotros los mantenemos; ya usamos getEventosByUsuario y estamos listos para re-probar la cola cuando api-ia avise.

Si en el futuro api-ia (u otro) escribe pidiendo algo a "Front" o "Frontend" que sea de **otro producto/repo que no sea** Bodas de Hoy (Copilot, web, memories, creador): **respondemos que lo hemos revisado y no es nuestro ámbito**, para que no quede sin respuesta.

---

## Comunicación: solo con api-ia

**Nosotros no hablamos con API2.** Todo lo que necesitamos (fixes de chat, payment_url, planes, credenciales, etc.) **se lo pedimos a api-ia** en #copilot-api-ia. api-ia coordina con API2 o con el componente que corresponda. Ver **docs/FRONT-SOLO-HABLA-CON-API-IA.md**.

---

## Resumen una línea

**Somos el front de Bodas de Hoy: Copilot (LobeChat), web, memories, creador. Las peticiones en #copilot-api-ia a "Frontend" o "CRM-Front" sobre estos productos son nuestras; si es otro front, lo indicamos. Solo hablamos con api-ia; no tenemos contacto con API2.**

---

## Referencia scripts Slack

- Identidad por defecto: `SLACK_SENDER_NAME` o "Frontend / Copilot LobeChat".
- Enviar como Copilot: `./scripts/slack-send.sh --copilot "mensaje"`.
- Enviar como App Bodasdehoy: `./scripts/slack-send.sh --web "mensaje"`.
