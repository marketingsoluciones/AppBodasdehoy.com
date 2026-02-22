# Slack – Canales configurados y qué funciona

**Última verificación:** ejecutando `slack-read.sh 3` y `slack-send.sh "Test..."` desde el repo.

---

## Resumen (sin liarse)

- **Solo hay un canal** con el que nos comunicamos: **#copilot-api-ia**.
- **Un token de bot** en `.env` → para **leer** y **enviar** mensajes (`SLACK_BOT_TOKEN`). Los scripts usan la API `chat.postMessage` (igual que el otro equipo). Opcional: webhook como respaldo si no hay token.
- No hay “varios canales” ni “varios webhooks” nuestros: todo es **un solo canal** (#copilot-api-ia). Si en el workspace existen otros canales (p. ej. #api-ia-api2-sync), **nosotros no los usamos** desde este repo.

---

## .env para enviar y recibir en #copilot-api-ia

Estas son las variables que **sí funcionan** para enviar y recibir en el canal **#copilot-api-ia**. Ponlas en tu `.env` en la raíz del proyecto (copia desde `cp .env.example .env` y rellena):

```env
# Slack – canal #copilot-api-ia (enviar + recibir)
SLACK_BOT_TOKEN=xoxb-tu-token-aqui
SLACK_WEBHOOK_FRONTEND=https://hooks.slack.com/services/T0AETLQLBMX/XXXXX/YYYYY
SLACK_CHANNEL_FRONTEND=C0AEV0GCLM7
```

| Variable | Para qué | Nota |
|----------|----------|------|
| **SLACK_BOT_TOKEN** | **Recibir** (leer con `slack-read.sh`) | Bot Token (xoxb-…). Scope `channels:history`, bot en #copilot-api-ia. |
| **SLACK_WEBHOOK_FRONTEND** o **SLACK_WEBHOOK_LOBECHAT** | **Enviar** (slack-send.sh, slack-notify.sh) | URL del webhook del canal #copilot-api-ia. Los scripts aceptan cualquiera de las dos variables. |
| **SLACK_CHANNEL_FRONTEND** | Opcional (por defecto `C0AEV0GCLM7`) | ID del canal para leer. |

- Si **no** pones `SLACK_WEBHOOK_FRONTEND`, los scripts de envío usan un valor por defecto (puede funcionar en tu workspace; mejor definir el tuyo).
- Si **no** pones `SLACK_BOT_TOKEN`, **slack-read.sh** no funcionará (error al leer).

---

## 1. Canal que usamos nosotros

Solo hay **un canal** configurado para este repo:

| Canal | ID | Uso |
|-------|-----|-----|
| **#copilot-api-ia** | `C0AEV0GCLM7` | Coordinación Frontend (Bodasdehoy) ↔ api-ia. Lectura y envío desde los scripts. |

No tenemos configurado ni usamos otros canales (p. ej. #api-ia-api2-sync es de otros equipos).

---

## 2. Variables en `.env` (por función)

| Función | Variable | Requerido | Descripción |
|---------|----------|-----------|-------------|
| **Leer** mensajes | `SLACK_BOT_TOKEN` | Sí (para leer) | Bot Token (xoxb-…) con scope `channels:history`. Alternativa antigua: `SLACK_BOT_OAUTH_TOKEN`. |
| **Leer** mensajes | `SLACK_CHANNEL_FRONTEND` | No | ID del canal. Por defecto: `C0AEV0GCLM7` (#copilot-api-ia). |
| **Enviar** mensajes | `SLACK_WEBHOOK_FRONTEND` o `SLACK_WEBHOOK` | Sí (para enviar) | URL del Incoming Webhook del canal #copilot-api-ia. Los scripts tienen un fallback por defecto si no está en .env. |

Ver `.env.example` en la raíz del proyecto.

---

## 3. Estado de cada función (verificación reciente)

| Función | Script | Estado | Notas |
|---------|--------|--------|--------|
| **Leer** últimos N mensajes | `./scripts/slack-read.sh [N]` | ✅ **Funciona** | Usa `SLACK_BOT_TOKEN` o `SLACK_OAUTH_TOKEN` (conversations.history). |
| **Enviar** mensaje | `./scripts/slack-send.sh "texto"` | ✅ **Funciona** | Usa `SLACK_BOT_TOKEN` + `chat.postMessage` (igual que el otro equipo). Si no hay token, usa webhook. |
| **Notificar** (tipo + mensaje) | `./scripts/slack-notify.sh` | ✅ **Funciona** | Mismo método: bot token (chat.postMessage) o webhook de respaldo. |
| **Pruebas api-ia + enviar resumen** | `./scripts/test-api-ia-y-enviar-slack.sh` | ✅ **Funciona** | Ejecuta pruebas y envía resumen con slack-send.sh (bot token). |

**Método de envío:** Los scripts usan **chat.postMessage** con `SLACK_BOT_TOKEN` (como el otro equipo), no el Incoming Webhook. Así se puede enviar y leer solo con el bot token. El webhook solo se usa si no hay token.

### Si la URL del webhook es “correcta” pero Slack devuelve 404 `no_service`

Slack responde **404** y cuerpo **`no_service`** cuando el Incoming Webhook **no es válido para ellos**. La URL puede estar bien formada (`https://hooks.slack.com/services/T.../B.../token`) y aun así fallar. Causas habituales:

| Causa | Qué hacer |
|--------|-----------|
| **Webhook revocado** | Slack revoca URLs si detectan el secret en repos públicos o filtraciones. La URL antigua **no vuelve a funcionar**. En [api.slack.com/apps](https://api.slack.com/apps) → tu app → Incoming Webhooks → **añadir un webhook nuevo** para #copilot-api-ia y usar la **nueva** URL en `.env`. |
| **App desinstalada del workspace** | Reinstalar la app en el workspace donde está #copilot-api-ia; luego crear de nuevo el webhook para ese canal. |
| **Webhook de otro workspace** | La URL es de un workspace distinto al que tiene el canal. Crear el webhook desde la app instalada en el **mismo** workspace que #copilot-api-ia. |
| **Copia incompleta o errónea** | Comprobar que la URL en `.env` está completa (sin espacios, sin saltos de línea) y coincide con la que muestra Slack al crear el webhook. |

En las respuestas, Slack suele enviar el header `x-slack-shared-secret-outcome: no-match`, que indica que no reconocen el secret de la URL. No hay forma de “reactivar” esa URL; hay que **generar una nueva** en la misma app y canal.

Si **no** tienes `.env` con las variables:
- **slack-read.sh** falla si no hay `SLACK_BOT_TOKEN` ni `SLACK_OAUTH_TOKEN`.
- **slack-send.sh** falla si no hay ninguna de: `SLACK_WEBHOOK_FRONTEND`, `SLACK_WEBHOOK_LOBECHAT`, `SLACK_WEBHOOK_URL`.

---

## 4. Cómo comprobar tú mismo

```bash
# Leer últimos 5 mensajes (requiere SLACK_BOT_TOKEN)
./scripts/slack-read.sh 5

# Enviar un mensaje de prueba (requiere webhook en .env o usa default del script)
./scripts/slack-send.sh "Test – puedo borrar"
```

Si algo falla: ver **COMO-SOLUCIONAR-LECTURA-SLACK.md** (p. ej. `missing_scope` → añadir `channels:history` al bot y reinstalar la app).
