# Slack – Canales configurados y qué funciona

**Última verificación:** ejecutando `slack-read.sh 3` y `slack-send.sh "Test..."` desde el repo.

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
| **Leer** últimos N mensajes | `./scripts/slack-read.sh [N]` | ✅ **Funciona** | Requiere `SLACK_BOT_TOKEN` en .env. Devuelve los últimos mensajes de #copilot-api-ia. |
| **Enviar** mensaje | `./scripts/slack-send.sh "texto"` | ✅ **Funciona** | Usa `SLACK_WEBHOOK_FRONTEND` o `SLACK_WEBHOOK` (o el valor por defecto del script). El mensaje aparece en #copilot-api-ia. |
| **Notificar** (tipo + mensaje) | `./scripts/slack-notify.sh [--copilot\|--web] <tipo> "mensaje"` | ✅ **Funciona** | Misma URL de webhook que slack-send.sh. Tipos: error, help, success, info, warning, question. |
| **Pruebas api-ia + enviar resumen** | `./scripts/test-api-ia-y-enviar-slack.sh` | ✅ **Funciona** | Ejecuta pruebas contra api-ia y envía el resumen a #copilot-api-ia (o a Google Chat si está `GOOGLE_CHAT_WEBHOOK_URL`). |

Si **no** tienes `.env` con las variables:
- **slack-read.sh** falla con: `Error: SLACK_BOT_TOKEN o SLACK_BOT_OAUTH_TOKEN no está definido.`
- **slack-send.sh** puede seguir funcionando si usa el webhook por defecto hardcodeado en el script (no recomendable en producción; mejor definir `SLACK_WEBHOOK_FRONTEND` en .env).

---

## 4. Cómo comprobar tú mismo

```bash
# Leer últimos 5 mensajes (requiere SLACK_BOT_TOKEN)
./scripts/slack-read.sh 5

# Enviar un mensaje de prueba (requiere webhook en .env o usa default del script)
./scripts/slack-send.sh "Test – puedo borrar"
```

Si algo falla: ver **COMO-SOLUCIONAR-LECTURA-SLACK.md** (p. ej. `missing_scope` → añadir `channels:history` al bot y reinstalar la app).
