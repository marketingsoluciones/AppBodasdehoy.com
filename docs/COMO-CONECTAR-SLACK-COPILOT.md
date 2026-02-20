# Cómo conectarte a Slack para hablar con el equipo (Copilot / api-ia)

En este proyecto la **coordinación con api-ia y el Copilot** se hace por **Slack**, no por Google Chat. Aquí se explica cómo conectarte y qué canales hay.

---

## 1. Slack vs Google Chat

| | Slack | Google Chat |
|---|--------|-------------|
| **Uso en este proyecto** | Sí – canal #copilot-api-ia | No está integrado |
| **Quién habla** | Frontend (nosotros) y equipo api-ia | — |

Si quieres “hablar en el Copilot distinto vía chat”, aquí ese chat es **Slack** (el canal #copilot-api-ia). No hay integración con Google Chat en el repo.

---

## 2. Qué canal hay

Solo usamos **un canal** para Copilot y api-ia:

| Canal | Uso |
|-------|-----|
| **#copilot-api-ia** | Coordinación Frontend ↔ api-ia: plan de testing, 402/503, paneles pendientes, pruebas, avisos. |

ID del canal: `C0AEV0GCLM7` (por si hace falta en APIs o scripts).

---

## 3. Cómo conectarte

### Opción A – Entrar al canal en la app de Slack (recomendado para “hablar” tú)

1. Entra al **workspace de Slack** donde está el canal #copilot-api-ia (te lo tiene que dar quien administre el workspace de bodasdehoy / Copilot).
2. Busca el canal **#copilot-api-ia** y únete (o pide que te añadan).
3. Ahí puedes escribir y leer como en cualquier chat. Los mensajes del Frontend (scripts) también llegan ahí.

No necesitas nada del repo para esto; solo la app de Slack (web o móvil) y acceso al workspace.

### Opción B – Enviar y leer mensajes desde el repo (scripts)

Para que **los scripts** envíen mensajes al canal (o para leer los últimos mensajes desde la terminal):

1. **Variables en `.env`** (en la raíz del proyecto):
   - **Para enviar:** `SLACK_WEBHOOK_FRONTEND` o `SLACK_WEBHOOK` (webhook de entrada del canal #copilot-api-ia).
   - **Para leer:** `SLACK_BOT_TOKEN` (token del bot con permiso `channels:history` en ese canal).

2. **Comandos:**
   - **Enviar mensaje:**  
     `./scripts/slack-send.sh "Tu mensaje"`  
     o con identidad:  
     `./scripts/slack-send.sh --copilot "Mensaje desde Copilot"`
   - **Leer últimos N mensajes:**  
     `./scripts/slack-read.sh 10`

Quien configuró el webhook y el bot ya tiene “conexión” desde el repo hacia ese canal. Si tú no tienes `.env` con esas variables, no podrás usar los scripts, pero sí puedes usar la **Opción A** (app de Slack).

---

## 4. Resumen rápido

| Pregunta | Respuesta |
|----------|-----------|
| ¿Hay “chat de Google” para el Copilot? | No; aquí el chat de coordinación es **Slack**. |
| ¿Qué canal uso? | **#copilot-api-ia**. |
| ¿Cómo hablo yo en ese chat? | Entrando al canal en la app de Slack (Opción A). |
| ¿Cómo envía/lee el repo? | Con `.env` (webhook + bot token) y `slack-send.sh` / `slack-read.sh` (Opción B). |

Si tu empresa usa **Google Chat** para otras cosas, eso es independiente; para **Copilot y api-ia** en este proyecto se usa solo **Slack** y el canal **#copilot-api-ia**.

---

## 5. Si quieres hablar con otros equipos por Google Chat (estilo copilot-api-ia)

Si **otros equipos** usan **Google Chat** y quieres tener un “copilot-api-ia” ahí (mismo tipo de coordinación pero en Google Chat), se puede hacer en paralelo a Slack.

### Cómo sería

| Opción | Qué es | Quién lo hace |
|--------|--------|----------------|
| **A. Espacio en Google Chat** | Crear un espacio en Google Chat (ej. “Copilot api-ia” o “Frontend – api-ia”) donde estén los mismos equipos (o los que usen Google Chat). | Admin de Google Workspace o quien cree espacios. |
| **B. Enviar también a Google Chat desde el repo** | Los mismos avisos que mandamos a Slack (pruebas, 402, paneles, etc.) se envían **también** a un webhook de Google Chat. Así el “resumen copilot-api-ia” llega a ambos sitios. | Nosotros: añadir en los scripts una llamada al webhook de Google Chat. |
| **C. Reenvío manual** | Alguien copia mensajes importantes de #copilot-api-ia (Slack) al espacio de Google Chat (o al revés) cuando haga falta. | Cualquier persona con acceso a ambos. |

### Qué haría falta para la opción B (automatizar como con Slack)

1. **Webhook de Google Chat**  
   En el espacio de Google Chat que quieras usar:
   - Añadir un **webhook de entrada** (Incoming Webhook) al espacio.
   - Guardar la URL del webhook (ej. en `.env` como `GOOGLE_CHAT_WEBHOOK_COPILOT_API_IA`).

2. **Script que envíe a los dos**  
   - Opción simple: un script `scripts/google-chat-send.sh` que envíe un mensaje solo a Google Chat (igual que `slack-send.sh` pero a la URL de Google Chat).
   - Opción doble: que `slack-send.sh` (o un wrapper) envíe **a Slack y a Google Chat** cuando exista `GOOGLE_CHAT_WEBHOOK_COPILOT_API_IA`.

3. **Formato**  
   Google Chat acepta JSON (texto o cards). Se puede mandar el mismo texto que a Slack; si más adelante quieres cards, se ajusta el payload.

### Resumen

- **Hoy:** copilot-api-ia = solo **Slack** (#copilot-api-ia).
- **Si quieres que otros equipos hablen por Google Chat:** crear un **espacio en Google Chat** (opción A) y, si quieres que los avisos del repo lleguen también ahí, añadir **webhook + script** (opción B). Así tendrías “lo mismo que copilot-api-ia” pero en Google Chat (o en ambos: Slack y Google Chat).

---

## 6. Solo Google Chat (sin Slack): un canal para este proyecto y coordinar con el otro

Si **no quieres usar Slack** y solo quieres **un canal de Google Chat** para este proyecto y para coordinar con otro proyecto (api-ia, API2, etc.), se hace así.

### Idea

- Dejas de usar el canal de Slack (#copilot-api-ia).
- Creas **un espacio en Google Chat** que sea el canal de este proyecto (ej. "Copilot / api-ia" o "App Bodas – coordinación").
- Ahí hablan las personas de este proyecto y del otro. Los scripts del repo envían los avisos a ese espacio (pruebas, 402, paneles, etc.) mediante un webhook.

### Pasos

| Paso | Qué hacer |
|------|-----------|
| 1 | Crear un **espacio en Google Chat** (nombre claro: ej. "Copilot Bodas – api-ia" o "App Bodasdehoy – coordinación"). Añadir a las personas de este proyecto y del otro. |
| 2 | En ese espacio, configurar un **webhook de entrada** (Incoming Webhook) para que aplicaciones puedan enviar mensajes. La URL del webhook se guarda en `.env` (ej. `GOOGLE_CHAT_WEBHOOK_URL`). |
| 3 | En el repo: usar **solo** ese webhook para enviar. Por ejemplo: un script `google-chat-send.sh` que envíe a esa URL, y que los scripts que hoy usan `slack-send.sh` (test-api-ia, avisos, etc.) pasen a usar `google-chat-send.sh`. Si eliges "solo Google Chat", se deja de llamar a Slack. |
| 4 | **Leer** mensajes desde el repo (como hace `slack-read.sh` en Slack) en Google Chat requiere la **API de Google Chat** (no basta el webhook; el webhook solo envía). Si necesitas leer desde scripts, hay que configurar un bot/app en Google Cloud. Si solo necesitas que la gente hable en el espacio y que el repo envíe avisos, basta el webhook. |

### Resumen

| | Solo Slack (hoy) | Solo Google Chat (lo que pides) |
|---|------------------|----------------------------------|
| Canal | #copilot-api-ia | Un espacio en Google Chat |
| Enviar desde el repo | `slack-send.sh` + webhook Slack | `google-chat-send.sh` + webhook Google Chat |
| Leer desde el repo | `slack-read.sh` + token Slack | API de Google Chat (app/bot) si lo necesitas |
| Hablar personas | Entrar al canal en Slack | Entrar al espacio en Google Chat |

Para **solo tener ese canal de Google Chat** para este proyecto y coordinar con el otro: crear el espacio, poner el webhook en `.env`, y usar el script que ya está en el repo.

### Script ya implementado

- **`scripts/google-chat-send.sh`** – Envía un mensaje al espacio de Google Chat usando la URL del webhook.
  - Requiere en `.env`: **`GOOGLE_CHAT_WEBHOOK_URL`** (URL del webhook de entrada del espacio).
  - Uso: `./scripts/google-chat-send.sh "Texto"` o `./scripts/google-chat-send.sh --copilot "Texto"`.
- **`scripts/test-api-ia-y-enviar-slack.sh`** – Si `GOOGLE_CHAT_WEBHOOK_URL` está definido, envía el resumen **solo a Google Chat**. Si no, envía a Slack como antes.
- En **`.env.example`** está documentada la variable `GOOGLE_CHAT_WEBHOOK_URL`.

Para usar **solo Google Chat**: crea el espacio en Google Chat, configura el webhook de entrada, copia la URL a `.env` como `GOOGLE_CHAT_WEBHOOK_URL`, y ya no hace falta Slack para los avisos de este repo.
