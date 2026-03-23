# Comunicación con api-ia vía Slack – Copy-paste

**Tiempo:** ~2 minutos.

---

## 1. Copiar el token a tu `.env`

En la raíz del proyecto, en el archivo **`.env`** (crear si no existe), añade:

```env
# Slack - canal Frontend / Copilot ↔ api-ia
SLACK_BOT_OAUTH_TOKEN=xoxb-10503704691745-10486340430387-yPAG9HxrKTWyOg2tJmCATwZH
SLACK_CHANNEL_COPILOT_API_IA=C0AEV0GCLM7
```

- **Canal:** `C0AEV0GCLM7` = **#copilot-api-ia** (Frontend)

---

## 2. Código listo para copiar y pegar

### JavaScript (Node o navegador con fetch)

```javascript
// Leer últimos mensajes del canal
async function leerMensajesSlack(limit = 10) {
  const token = process.env.SLACK_BOT_OAUTH_TOKEN; // o tu variable de entorno
  const channel = process.env.SLACK_CHANNEL_COPILOT_API_IA || 'C0AEV0GCLM7';
  const res = await fetch(
    `https://slack.com/api/conversations.history?channel=${channel}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.messages;
}

// Enviar mensaje al canal
async function enviarMensajeSlack(texto) {
  const token = process.env.SLACK_BOT_OAUTH_TOKEN;
  const channel = process.env.SLACK_CHANNEL_COPILOT_API_IA || 'C0AEV0GCLM7';
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ channel, text: texto })
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data;
}

// Uso:
// const mensajes = await leerMensajesSlack(20);
// await enviarMensajeSlack('[Copilot] Hola api-ia');
```

---

### Python

```python
import os
import requests

SLACK_TOKEN = os.getenv("SLACK_BOT_OAUTH_TOKEN", "xoxb-10503704691745-10486340430387-yPAG9HxrKTWyOg2tJmCATwZH")
CHANNEL = os.getenv("SLACK_CHANNEL_COPILOT_API_IA", "C0AEV0GCLM7")
BASE = "https://slack.com/api"

def leer_mensajes(limit=10):
    r = requests.get(
        f"{BASE}/conversations.history",
        params={"channel": CHANNEL, "limit": limit},
        headers={"Authorization": f"Bearer {SLACK_TOKEN}"}
    )
    data = r.json()
    if not data.get("ok"):
        raise Exception(data.get("error", "unknown"))
    return data.get("messages", [])

def enviar_mensaje(texto):
    r = requests.post(
        f"{BASE}/chat.postMessage",
        headers={"Authorization": f"Bearer {SLACK_TOKEN}", "Content-Type": "application/json"},
        json={"channel": CHANNEL, "text": texto}
    )
    data = r.json()
    if not data.get("ok"):
        raise Exception(data.get("error", "unknown"))
    return data

# Uso:
# mensajes = leer_mensajes(20)
# enviar_mensaje("[Copilot] Hola api-ia")
```

---

## 3. Scripts en este repo (sin escribir código)

Si solo quieres leer o enviar desde terminal:

```bash
# Leer últimos mensajes del canal
./scripts/slack-read.sh 20

# Enviar mensaje (usa webhook; no necesita Bot Token)
./scripts/slack-send.sh "Tu mensaje aquí"
./scripts/slack-notify.sh info "Título" "Detalles"
```

El token en `.env` ya está configurado para `slack-read.sh`. Si el Bot está instalado en el workspace y en el canal, leer funcionará.

---

## Resumen

| Paso | Acción |
|------|--------|
| 1 | Añadir `SLACK_BOT_OAUTH_TOKEN` y `SLACK_CHANNEL_COPILOT_API_IA` al `.env` |
| 2 | Copiar el código (JavaScript o Python) a tu proyecto |
| 3 | Listo: leer con `conversations.history`, escribir con `chat.postMessage` (o webhook) |

**Canal Frontend:** `C0AEV0GCLM7` (#copilot-api-ia).
