# Verificación: comunicación con Slack (leer y escribir)

**Última verificación**: 2026-02-12  
**Canal**: #copilot-api-ia (ID: C0AEV0GCLM7)  
**Bot User OAuth Token**: guardado en `.env` como `SLACK_BOT_OAUTH_TOKEN` (xoxb-...)

---

## Resumen – Estado actual (verificado)

| Capacidad | Estado | Cómo |
|-----------|--------|------|
| **Escribir** | ✅ OK | `./scripts/slack-send.sh "mensaje"` o `slack-notify.sh` (usa SLACK_WEBHOOK_FRONTEND) |
| **Leer** / **Historial** | ✅ OK | `./scripts/slack-read.sh [N]` (usa SLACK_BOT_TOKEN + SLACK_CHANNEL_FRONTEND) |

**Configuración actual:** Bot Token compartido (`SLACK_BOT_TOKEN`), webhook Frontend (`SLACK_WEBHOOK_FRONTEND`), canal `SLACK_CHANNEL_FRONTEND` = C0AEV0GCLM7 (#copilot-api-ia). Comunicación consulta de historial, leer y escribir operativa.

---

## 1. Leer historial y leer mensajes

- **Script**: `./scripts/slack-read.sh`
- **Token**: `SLACK_BOT_OAUTH_TOKEN` en `.env` (Bot User OAuth Token del canal).
- **Scopes usados**: `channels:history`, `channels:read` (ya configurados en la app).

**Uso**:
```bash
./scripts/slack-read.sh      # últimos 10 mensajes
./scripts/slack-read.sh 15   # últimos 15 mensajes
./scripts/slack-read.sh 25   # últimos 25 mensajes
```

**Salida**: Lista de mensajes con timestamp, autor (user/bot) y texto. Incluye mensajes de api-ia, API2 y Copilot.

---

## 2. Escribir

- **Webhook** (recomendado): `scripts/slack-send.sh` y `scripts/slack-notify.sh`.
- **Canal**: #copilot-api-ia.

**Uso**:
```bash
./scripts/slack-send.sh "Tu mensaje"
./scripts/slack-notify.sh info "Título" "Detalles"
./scripts/slack-notify.sh error "Error" "Trace ID: xxx"
```

**Nota**: Escribir con la API (`chat.postMessage`) usando el mismo Bot Token requeriría el scope `chat:write`. No es necesario mientras usemos el webhook para enviar mensajes.

---

## 3. Token y canal

- **Bot User OAuth Token**: en `.env` → `SLACK_BOT_OAUTH_TOKEN` (xoxb-...)
- **Canal de comunicación**: #copilot-api-ia (ID: `C0AEV0GCLM7`)
- **Variables en `.env`**:
  - `SLACK_BOT_OAUTH_TOKEN` = Bot Token (para leer)
  - `SLACK_CHANNEL_COPILOT_API_IA=C0AEV0GCLM7` (opcional; el script usa este ID por defecto)

No subas `.env` a git (está en `.gitignore`).

---

## 4. Comunicación con api-ia

- **Canal compartido**: #copilot-api-ia.
- **Nosotros**: Escribimos con webhook; leemos con `slack-read.sh` (Bot Token).
- **api-ia**: Escribe en el mismo canal; nosotros vemos sus mensajes al ejecutar `slack-read.sh` o en la app de Slack.

Documentos de referencia: **SLACK-TOKENS-SINCRONIZACION-EQUIPOS.md**, **COMO-SOLUCIONAR-LECTURA-SLACK.md**.
