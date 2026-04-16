# Análisis: por qué en nuestros mensajes de Slack no queda claro quién envía y hacia quién va

**Fecha:** 2026-02-12

---

## Problema

En el canal **#copilot-api-ia** los mensajes que enviamos con `slack-send.sh` y `slack-notify.sh` no dejan claro de forma explícita:

1. **Quién envía** el mensaje (remitente).
2. **Hacia quién va** (destinatario).

---

## Causa

### 1. Quién envía

- Los scripts usan **Incoming Webhooks** de Slack. El webhook permite fijar un **`username`** (nombre que aparece junto al mensaje).
- Hoy usamos: `SLACK_SENDER_NAME` o por defecto **"Frontend Bodasdehoy · Copilot LobeChat"**.
- **Limitaciones:**
  - Ese nombre solo aparece como “autor” del mensaje en la UI; si alguien no mira la cabecera del mensaje, no lo ve.
  - Si en el canal escriben varias fuentes (Frontend, api-ia, API2), el nombre del webhook puede no ser suficiente para distinguir “este mensaje es del Frontend”.
  - No hay ninguna línea **dentro del texto** del mensaje que diga explícitamente “De: Frontend” o “Remitente: …”.

### 2. Hacia quién va

- El **destino** es el canal **#copilot-api-ia**; el webhook está asociado a ese canal, así que técnicamente “va al canal”.
- **Limitación:** En el **cuerpo del mensaje** no hay ninguna frase tipo “Para: equipo api-ia” o “Para: #copilot-api-ia”. Quien lee puede no tener claro que el mensaje va dirigido al equipo api-ia (o a quien corresponda).

---

## Solución aplicada

Se ha ajustado **slack-send.sh** y **slack-notify.sh** para que:

1. **En el texto del mensaje** se añada siempre una línea inicial con:
   - **De:** remitente (por defecto: "Frontend / Copilot LobeChat").
   - **Para:** destinatario (por defecto: "Equipo api-ia (#copilot-api-ia)").

2. El **username** del webhook se mantiene (`SLACK_SENDER_NAME`) para que en la lista de mensajes también se vea quién envía.

Así, tanto en la cabecera del mensaje (nombre del webhook) como en la primera línea del cuerpo queda claro **quién envía** y **hacia quién va**.

### Identificar equipo y repositorio (dos equipos)

Somos **dos equipos/repos** que escribimos en el mismo canal:

| Equipo | Repo | Uso en scripts |
|--------|------|-----------------|
| **Front Copilot LobeChat** | apps/copilot | `./scripts/slack-send.sh --copilot "mensaje"` o `./scripts/slack-notify.sh --copilot info "mensaje"` |
| **Front App Bodasdehoy** | apps/web | `./scripts/slack-send.sh --web "mensaje"` o `./scripts/slack-notify.sh --web info "mensaje"` |

En Slack se verá el **username** (ej. "Front Copilot LobeChat" o "Front App Bodasdehoy") y en el cuerpo del mensaje: **De:**, **Para:** y **Repo: apps/copilot** o **Repo: apps/web**.

Si no usas `--copilot` ni `--web`, se usa `SLACK_REPO` o `SLACK_SENDER_NAME` de `.env`.

### Personalizar De/Para desde .env

En `.env` puedes definir:

- `SLACK_MSG_DE` – texto de la línea "De:" (ej. `De: Frontend Bodasdehoy`).
- `SLACK_MSG_PARA` – texto de la línea "Para:" (ej. `Para: Equipo api-ia`).
- `SLACK_REPO=copilot` o `SLACK_REPO=web` – para que por defecto todos los mensajes salgan como Copilot o como App Bodasdehoy sin poner el flag.

Si no se definen, se usan los valores por defecto anteriores.
