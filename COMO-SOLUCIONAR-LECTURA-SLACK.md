# Cómo solucionar la lectura de Slack (#copilot-api-ia)

**Problema:** No podemos leer mensajes del canal #copilot-api-ia (error `missing_scope`).  
**Causa:** El Bot de Copilot no tiene el permiso `channels:history`.  
**Solución:** Añadir el scope en la app de Slack y reinstalar.

---

## Pasos (quien tenga acceso a la app de Slack)

### 1. Entrar en la configuración de la app

1. Abre **https://api.slack.com/apps** e inicia sesión.
2. Busca y haz clic en la app **Copilot LobeChat** (o la que usa el bot **copilotlobechat_y_api**).

### 2. Añadir los scopes al Bot Token

1. En el menú izquierdo, entra en **OAuth & Permissions**.
2. Baja hasta **Scopes** → **Bot Token Scopes**.
3. Haz clic en **Add an OAuth Scope**.
4. Añade estos dos (si no están ya):
   - **`channels:history`** – Ver mensajes en canales públicos.
   - **`channels:read`** – Ver información básica de canales públicos.

### 3. Reinstalar la app en el workspace

1. En la misma página **OAuth & Permissions**, arriba verás un aviso de que hay que reinstalar.
2. Haz clic en **Reinstall to Workspace** (o **Install to Workspace** si no estaba instalada).
3. Revisa los permisos y acepta.
4. Slack te llevará de vuelta a **OAuth & Permissions**.

### 4. Copiar el nuevo Bot User OAuth Token

1. En **OAuth Tokens for Your Workspace** verás **Bot User OAuth Token** (empieza por `xoxb-`).
2. Haz clic en **Copy**.
3. Si el token ha cambiado (a veces Slack lo renueva al reinstalar), tendrás que actualizar el `.env` local.

### 5. Actualizar el token en tu máquina (solo si cambió)

1. Abre el archivo **`.env`** en la raíz del proyecto (no lo subas a git).
2. Busca la línea `SLACK_BOT_OAUTH_TOKEN=...`.
3. Sustituye el valor por el nuevo token que copiaste.
4. Guarda el archivo.

### 6. Asegurarte de que el bot está en el canal

1. En Slack, abre el canal **#copilot-api-ia**.
2. Haz clic en el nombre del canal arriba → **Integraciones** / **Apps** (o **Add apps**).
3. Si el bot **copilotlobechat_y_api** (o el nombre de vuestra app) no está, añádelo con **Add apps to this channel**.

### 7. Probar la lectura

En la raíz del proyecto:

```bash
./scripts/slack-read.sh 10
```

Si todo está bien, verás la lista de los últimos 10 mensajes del canal (incluidos los de api-ia). Si sigue saliendo `missing_scope`, revisa que guardaste el token correcto en `.env` y que añadiste **Bot Token Scopes** (no User Token Scopes).

---

## Resumen rápido

| Paso | Acción |
|------|--------|
| 1 | api.slack.com/apps → tu app Copilot |
| 2 | OAuth & Permissions → Bot Token Scopes → Add `channels:history` y `channels:read` |
| 3 | Reinstall to Workspace |
| 4 | Copiar el Bot User OAuth Token (xoxb-...) |
| 5 | Pegar en `.env` en `SLACK_BOT_OAUTH_TOKEN` (si cambió) |
| 6 | Comprobar que el bot está en #copilot-api-ia |
| 7 | Ejecutar `./scripts/slack-read.sh 10` |

---

## Si no tienes acceso a la app de Slack

- Quien creó la app o es admin del workspace (EventosOrganizador) debe hacer los pasos anteriores.
- Podéis pedir al equipo **api-ia** que lo haga si ellos tienen la app: en el doc **SLACK-TOKENS-SINCRONIZACION-EQUIPOS.md** ya se indica que el Bot de Copilot necesita `channels:history` y `channels:read`.

---

## Enlaces útiles

- **Tus apps:** https://api.slack.com/apps  
- **Scopes de Slack:** https://api.slack.com/scopes  
- **conversations.history:** https://api.slack.com/methods/conversations.history  
