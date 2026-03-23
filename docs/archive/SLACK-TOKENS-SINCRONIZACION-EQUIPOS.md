# 🔐 Tokens de Slack - Sincronización Entre Equipos

**Fecha:** 2026-02-12  
**Para:** API2 y Copilot LobeChat  
**De:** Backend api-ia  
**Workspace:** EventosOrganizador (T0AETLQLBMX)

---

## 📋 Propósito

Este documento describe la configuración de Slack para comunicación bidireccional entre los equipos de **api-ia**, **API2** y **Copilot LobeChat**.

**Objetivo:** Que todos los equipos puedan enviar Y leer mensajes en sus canales respectivos para coordinación automática.

**Los tokens reales no se guardan aquí.** Se usan variables de entorno (`.env`); ver sección Seguridad al final.

---

## 🔑 Tokens Configurados

### 1. Bot Token (xoxb-) - Para api-ia

- **Variable de entorno:** `SLACK_BOT_TOKEN_API_IA` (opcional, para uso de api-ia)
- **Tipo:** Bot User OAuth Token
- **Usuario:** apiia_bot
- **Bot ID:** B0AEF60UUHG

**Scopes actuales:**
- ✅ `incoming-webhook`, `channels:history`, `channels:manage`, `app_mentions:read`, etc.
- ⚠️ Recomendado agregar: `channels:read`

---

### 2. User OAuth Token (xoxp-) - Para api-ia

- **Variable de entorno:** `SLACK_USER_OAUTH_TOKEN`
- **Tipo:** User OAuth Token
- **Usuario:** bodasdehoy.com
- **User ID:** U0AEJBHPT8C

**Scopes recomendados:** `channels:history`, `channels:read` (agregar si falta).

---

### 3. Bot Token Copilot (xoxb-) - Para Copilot LobeChat

- **Variable de entorno:** `SLACK_BOT_OAUTH_TOKEN`
- **Tipo:** Bot User OAuth Token
- **Usuario:** copilotlobechat_y_api
- **Bot ID:** B0AED8ZHJTF

**Scopes recomendados:** `channels:history`, `channels:read` (agregar para leer mensajes).

---

## 📡 Webhooks Configurados

### Webhook 1: Canal #api-ia-api2-sync

```
URL: https://hooks.slack.com/services/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
Canal: #api-ia-api2-sync
Propósito: Comunicación entre api-ia y API2
```

### Webhook 2: Canal #copilot-api-ia

```
URL: https://hooks.slack.com/services/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
Canal: #copilot-api-ia
Propósito: Comunicación entre Copilot LobeChat y api-ia
```

**Uso en este repo:** `./scripts/slack-send.sh "mensaje"` y `./scripts/slack-notify.sh <tipo> "mensaje" "detalles"`

### Webhook 3: Webhook General (legacy)

```
URL: https://hooks.slack.com/services/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
```

---

## 🔧 Scopes Necesarios para Sincronización Completa

### Bot Tokens (xoxb-):
- `incoming-webhook`, `channels:history`, `channels:read`, `app_mentions:read`, `chat:write`

### User Tokens (xoxp-):
- `channels:history`, `channels:read`, `identify`

---

## 🔍 IDs de Canales

```
#api-ia-api2-sync   → C0AENQY63UD
#copilot-api-ia     → C0AEV0GCLM7
```

En este repo el script `slack-read.sh` usa el canal **#copilot-api-ia** (ID `C0AEV0GCLM7`).

**Nota:** Si `slack-read.sh` devuelve `missing_scope`, el Bot Token (Copilot) debe tener el scope `channels:history`. Añadirlo en https://api.slack.com/apps → tu app → OAuth & Permissions → Bot Token Scopes → Add → `channels:history` (y `channels:read`), luego reinstalar la app.

---

## 📚 Uso en Copilot LobeChat (este repo)

### Enviar mensajes (ya configurado)

```bash
./scripts/slack-send.sh "Tu mensaje"
./scripts/slack-notify.sh info "Título" "Detalles"
```

### Leer mensajes (requiere Bot Token con scope channels:history)

```bash
# Cargar .env y leer últimos 10 mensajes de #copilot-api-ia
./scripts/slack-read.sh
# O con límite custom
./scripts/slack-read.sh 20
```

El token se toma de `SLACK_BOT_OAUTH_TOKEN` en `.env`.

---

## ⚙️ Cómo Agregar Scopes Faltantes

1. Ir a https://api.slack.com/apps
2. Seleccionar la app (Copilot / api-ia)
3. **OAuth & Permissions** → **Scopes**
4. En **Bot Token Scopes** agregar: `channels:read`, `channels:history`
5. Reinstalar la app en el workspace y copiar el nuevo token
6. Actualizar `.env` (no commitear)

---

## 🚨 Seguridad

- ✅ Guardar tokens en `.env` (está en `.gitignore`)
- ✅ NO commitear `.env` ni pegar tokens en código
- ✅ Rotar tokens periódicamente
- ❌ NO exponer en logs ni en este documento en el repo

**Variables en .env (ejemplo):**
```bash
SLACK_USER_OAUTH_TOKEN=xoxp-...
SLACK_BOT_OAUTH_TOKEN=xoxb-...
SLACK_WEBHOOK_COPILOT=https://hooks.slack.com/services/T0AETLQLBMX/B0AFB0CTERE/...
# Opcional: canal ID para lectura
SLACK_CHANNEL_COPILOT_API_IA=C0AEV0GCLM7
```

---

## 📎 Enlaces

- [Slack API](https://api.slack.com/docs)
- [Apps](https://api.slack.com/apps)
- [Webhooks](https://api.slack.com/messaging/webhooks)
- [Scopes](https://api.slack.com/scopes)

---

**Documento generado:** 2026-02-12 | **Versión:** 1.0 | **Mantenido por:** Backend api-ia
