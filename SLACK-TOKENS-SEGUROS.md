# Cómo guardar los tokens de Slack de forma segura

## Importante: seguridad

**Los tokens que pegaste en el chat ya están expuestos.** Cualquiera que los vea puede usarlos para acceder a tu workspace de Slack.

**Debes hacer esto ahora:**

1. **Revocar esos tokens** en Slack:
   - Entra en https://api.slack.com/apps
   - Elige tu app → **OAuth & Permissions**
   - En "OAuth Tokens for Your Workspace" y "Bot User OAuth Token", haz clic en **Revoke** (revocar) para los tokens que compartiste.

2. **Generar nuevos tokens** en la misma página (Install to Workspace / Reinstall) y **no volver a pegarlos en chat ni en código**. Solo guardarlos en tu máquina como se indica abajo.

---

## Dónde guardar los tokens (solo en tu máquina)

Nunca guardes tokens en el repositorio (ni en código ni en archivos que se suban a git). Usa un archivo **`.env`** en la raíz del proyecto; ese archivo ya está en `.gitignore` y no se sube.

### Paso 1: Crear o editar `.env` en la raíz

En la raíz del repo (`/Users/juancarlosparra/Projects/AppBodasdehoy.com/`), crea o edita el archivo **`.env`** (si no existe):

```bash
# Desde la raíz del proyecto
touch .env
# Luego ábrelo con tu editor y añade las líneas de abajo
```

### Paso 2: Añadir las variables (con tus tokens nuevos, no los viejos)

Abre `.env` y añade **solo en tu máquina** (no subas este archivo):

```env
# Slack API - solo para scripts que lean del canal (opcional)
# Obtener en: https://api.slack.com/apps → tu app → OAuth & Permissions

# Token de usuario (xoxp-...) - permisos del usuario que instaló la app
SLACK_USER_OAUTH_TOKEN=xoxp-tu-token-aqui-nuevo

# Token del bot (xoxb-...) - para leer/escribir como bot (recomendado para lectura)
SLACK_BOT_OAUTH_TOKEN=xoxb-tu-token-aqui-nuevo
```

- **User OAuth Token** suele empezar por `xoxp-`.
- **Bot User OAuth Token** suele empezar por `xoxb-`.

Pega los **tokens nuevos** (después de revocar los viejos) en el lugar de `xoxp-tu-token-aqui-nuevo` y `xoxb-tu-token-aqui-nuevo`. Guarda el archivo.

### Paso 3: Comprobar que .env no se sube a git

```bash
git status
```

No debe aparecer `.env` en "Changes to be committed". Si aparece, no hagas `git add .env` (así no se suben los tokens).

---

## Cómo los usan los scripts

Los scripts que necesiten **leer** de Slack (cuando los tengamos) cargarán el token desde el entorno, por ejemplo:

```bash
# En un script
source .env 2>/dev/null || true
# o export SLACK_BOT_OAUTH_TOKEN=... antes de ejecutar
curl -H "Authorization: Bearer $SLACK_BOT_OAUTH_TOKEN" "https://slack.com/api/conversations.history?channel=..."
```

Nunca pongas el token directamente en el script; siempre usa `$SLACK_BOT_OAUTH_TOKEN` o `$SLACK_USER_OAUTH_TOKEN` desde el entorno.

---

## Resumen

| Qué | Dónde | Sube a git |
|-----|--------|------------|
| Tokens reales | Solo en `.env` en tu máquina | No (.env está en .gitignore) |
| Nombres de variables (ej. SLACK_BOT_OAUTH_TOKEN) | En este .md y en scripts como nombre de variable | Sí (sin problema) |
| Valores de tokens | Nunca en código ni en documentación | No |

**Recuerda:** revoca los tokens que pegaste en el chat y usa solo tokens nuevos guardados en `.env`.
