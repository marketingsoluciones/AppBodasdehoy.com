# 🤖 Instrucciones de Conexión Slack para Equipo api-ia

**Para**: Equipo api-ia Backend
**De**: Equipo Copilot LobeChat
**Fecha**: 2026-02-11
**Prioridad**: Para comunicación en tiempo real

---

## 🎯 Objetivo

Configurar comunicación bidireccional entre nuestros agentes Claude Code vía Slack:
- **Claude Code (Copilot LobeChat)** ← Nosotros
- **Claude Code (api-ia Backend)** ← Ustedes

---

## 📋 Paso 1: Unirse al Workspace de Slack

**Link de invitación**:
```
https://join.slack.com/t/eventosorganizador/shared_invite/zt-3poaxs2nb-Jfwmw5eT5x6P_Gk7Yf4z8w
```

1. Hacer clic en el link
2. Crear cuenta o iniciar sesión
3. Aceptar la invitación al workspace **eventosorganizador**

---

## 📺 Paso 2: Ubicar el Canal Compartido

Buscar el canal: **#copilot-api-ia**

Este es el canal exclusivo para comunicación entre:
- Copilot LobeChat (nosotros)
- api-ia Backend (ustedes)

---

## 🔧 Paso 3: Configurar Scripts en su Repositorio

### Opción A: Crear scripts similares a los nuestros

Nosotros creamos dos scripts bash que pueden replicar:

#### 1. Script simple de envío (`slack-send.sh`):

```bash
#!/bin/bash

WEBHOOK_URL="https://hooks.slack.com/services/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"
PREFIX="[api-ia Backend]"

if [ -z "$1" ]; then
  echo "Error: Debes proporcionar un mensaje"
  echo "Uso: $0 \"Tu mensaje aquí\""
  exit 1
fi

MESSAGE="$PREFIX $1"

curl -X POST "$WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d "{\"text\": \"$MESSAGE\"}"

echo ""
echo "✅ Mensaje enviado a #copilot-api-ia"
```

**Uso**:
```bash
chmod +x slack-send.sh
./slack-send.sh "Hola Copilot, revisamos el trace ID 935aaaf0"
```

---

#### 2. Script de notificaciones estructuradas (`slack-notify.sh`):

```bash
#!/bin/bash

WEBHOOK_URL="https://hooks.slack.com/services/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"
PREFIX="[api-ia Backend]"

show_help() {
  cat << EOF
Uso: $0 <tipo> <mensaje> [detalles]

Tipos: error, help, success, info, warning, question

Ejemplos:
  $0 error "Error en base de datos" "Trace ID: abc123"
  $0 success "Credenciales corregidas para bodasdehoy"
  $0 info "Desplegamos nueva versión de api-ia"
EOF
  exit 0
}

if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
  show_help
fi

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "❌ Error: Debes proporcionar tipo y mensaje"
  exit 1
fi

TYPE="$1"
MESSAGE="$2"
DETAILS="${3:-}"

case "$TYPE" in
  error) EMOJI="❌"; TITLE="ERROR" ;;
  help) EMOJI="🆘"; TITLE="SOLICITUD DE AYUDA" ;;
  success) EMOJI="✅"; TITLE="ÉXITO" ;;
  info) EMOJI="💬"; TITLE="INFORMACIÓN" ;;
  warning) EMOJI="⚠️"; TITLE="ADVERTENCIA" ;;
  question) EMOJI="❓"; TITLE="PREGUNTA" ;;
  *)
    echo "❌ Tipo no válido: $TYPE"
    exit 1
    ;;
esac

FULL_MESSAGE="$PREFIX $EMOJI *$TITLE*\n\n$MESSAGE"

if [ -n "$DETAILS" ]; then
  FULL_MESSAGE="$FULL_MESSAGE\n\n_Detalles:_ $DETAILS"
fi

curl -X POST "$WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d "{\"text\": \"$FULL_MESSAGE\", \"mrkdwn\": true}" \
  -s -o /dev/null

echo "✅ Mensaje enviado a #copilot-api-ia"
```

**Uso**:
```bash
chmod +x slack-notify.sh
./slack-notify.sh success "Credenciales actualizadas" "Developer: bodasdehoy, Provider: Anthropic"
```

---

### Opción B: Usar Python (si su backend es Python)

```python
#!/usr/bin/env python3
import sys
import httpx

WEBHOOK_URL = "https://hooks.slack.com/services/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"
PREFIX = "[api-ia Backend]"

def send_message(message: str) -> bool:
    """Enviar mensaje simple a Slack"""
    payload = {"text": f"{PREFIX} {message}"}

    try:
        response = httpx.post(WEBHOOK_URL, json=payload)
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def send_notification(type: str, message: str, details: str = None) -> bool:
    """Enviar notificación estructurada"""
    emojis = {
        "error": "❌",
        "success": "✅",
        "info": "💬",
        "warning": "⚠️",
        "question": "❓"
    }

    emoji = emojis.get(type, "💬")
    title = type.upper()

    full_message = f"{PREFIX} {emoji} *{title}*\n\n{message}"
    if details:
        full_message += f"\n\n_Detalles:_ {details}"

    payload = {"text": full_message, "mrkdwn": True}

    try:
        response = httpx.post(WEBHOOK_URL, json=payload)
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python slack-notify.py <mensaje>")
        print("     python slack-notify.py <tipo> <mensaje> [detalles]")
        sys.exit(1)

    if len(sys.argv) == 2:
        # Mensaje simple
        success = send_message(sys.argv[1])
    else:
        # Notificación estructurada
        tipo = sys.argv[1]
        mensaje = sys.argv[2]
        detalles = sys.argv[3] if len(sys.argv) > 3 else None
        success = send_notification(tipo, mensaje, detalles)

    if success:
        print("✅ Mensaje enviado a #copilot-api-ia")
    else:
        print("❌ Error al enviar mensaje")
        sys.exit(1)
```

**Uso**:
```bash
chmod +x slack-notify.py
python slack-notify.py "Hola Copilot"
python slack-notify.py success "Credenciales actualizadas" "Developer: bodasdehoy"
```

---

## 🤖 Integración con Claude Code

### Ejemplo 1: Responder a una Consulta del Copilot

**Copilot nos pregunta** (vía Slack):
```
[Copilot LobeChat] ❓ PREGUNTA

¿El endpoint /api/developers/bodasdehoy/ai-credentials es correcto?
```

**Ustedes responden** (con Claude Code):
```bash
./slack-notify.sh success "Sí, ese endpoint es correcto" "No ha cambiado en las últimas 2 semanas"
```

---

### Ejemplo 2: Notificar Corrección de Credenciales

**Copilot reportó** (vía Slack):
```
[Copilot LobeChat] ❌ ERROR

Error 401 al autenticar con Anthropic

Detalles: Trace ID: 935aaaf0, Developer: bodasdehoy
```

**Ustedes revisan y responden**:
```bash
# 1. Confirmar que revisaron
./slack-notify.sh info "Revisamos el Trace ID 935aaaf0" "La API key tiene formato incorrecto (OpenAI en lugar de Anthropic)"

# 2. Corregir en su sistema
# ... (código para corregir credenciales)

# 3. Notificar éxito
./slack-notify.sh success "Credenciales corregidas para bodasdehoy" "Provider: Anthropic, Nueva key configurada correctamente"
```

---

### Ejemplo 3: Informar Cambios en la API

**Ustedes actualizan algo**:
```bash
./slack-notify.sh warning "Modelo de Groq actualizado" "Cambiamos de llama-3.1-70b-versatile a llama-3.3-70b-versatile"
```

---

## 📋 Casos de Uso Comunes

| Situación | Comando |
|-----------|---------|
| Confirmar recepción | `./slack-notify.sh info "Recibimos su consulta" "Lo revisamos ahora"` |
| Reportar corrección | `./slack-notify.sh success "Problema resuelto" "Detalles..."` |
| Pedir información | `./slack-notify.sh question "¿Pueden verificar...?"` |
| Advertir sobre cambio | `./slack-notify.sh warning "Cambio en endpoint" "..."` |
| Reportar error | `./slack-notify.sh error "Error detectado" "..."` |

---

## 🔄 Flujo de Comunicación Completo

### Escenario: Error reportado por Copilot

1. **Copilot detecta error** → Envía a Slack
2. **Ustedes ven notificación** → Revisan logs con trace ID
3. **Ustedes confirman** → `./slack-notify.sh info "Revisando trace ID..."`
4. **Ustedes corrigen** → Actualizan credenciales/config
5. **Ustedes notifican** → `./slack-notify.sh success "Corregido"`
6. **Copilot prueba** → Verifica que funcione
7. **Copilot confirma** → `./slack-notify.sh success "Funcionando"`

---

## ⚙️ Configuración Técnica

### Webhook URL (copiar exactamente)
```
https://hooks.slack.com/services/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
```

### Canal
```
#copilot-api-ia
```

### Prefijo de sus Mensajes
```
[api-ia Backend]
```

### Nuestro Prefijo
```
[Copilot LobeChat]
```

---

## ✅ Test Rápido

Para verificar que funciona:

### Con bash:
```bash
curl -X POST https://hooks.slack.com/services/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 \
  -H 'Content-Type: application/json' \
  -d '{"text": "[api-ia Backend] 🧪 Test de conexión con Copilot LobeChat"}'
```

### Con script:
```bash
./slack-send.sh "🧪 Test de conexión"
```

Deberían ver el mensaje aparecer en **#copilot-api-ia**.

---

## 📞 Ya Configurado de Nuestro Lado

Nosotros (Copilot LobeChat) ya tenemos:
- ✅ Scripts funcionando: `slack-send.sh`, `slack-notify.sh`
- ✅ Acceso al canal **#copilot-api-ia**
- ✅ Claude Code configurado para usar los scripts
- ✅ Test exitoso enviado

**Esperamos**:
- ⏳ Que ustedes se unan al workspace
- ⏳ Que configuren sus scripts
- ⏳ Que nos envíen un test de conexión

---

## 💡 Mejores Prácticas

1. **Usar el prefijo correcto**: `[api-ia Backend]`
2. **Incluir trace IDs** cuando respondan a errores
3. **Confirmar siempre** cuando corrijan algo
4. **Ser específicos** en los detalles
5. **Notificar cambios** que afecten al Copilot

---

## 📊 Referencia para el Informe que les Enviamos

Este sistema de comunicación ayudará a resolver rápidamente problemas como los reportados en:
- `INFORME-INVESTIGACION-PARA-EQUIPOS-API-IA-Y-API2.md`

Ahora podrán:
- ✅ Responder a nuestras consultas en tiempo real
- ✅ Confirmar si las credenciales son correctas
- ✅ Notificarnos de cambios inmediatamente
- ✅ Colaborar en debugging en tiempo real

---

## 🚀 Próximos Pasos

1. ✅ Unirse al workspace Slack
2. ✅ Crear scripts en su repositorio
3. ✅ Enviar test de conexión
4. ✅ Responder a nuestras consultas del informe
5. ✅ Comenzar comunicación en tiempo real

---

## 📋 Resumen Ejecutivo

- **Qué es**: Comunicación Claude Code ↔ Claude Code vía Slack
- **Canal**: #copilot-api-ia en workspace eventosorganizador
- **Cómo**: Scripts bash/Python que envían mensajes al webhook
- **Beneficio**: Comunicación en tiempo real sin esperar emails/reuniones
- **Configuración**: ~5 minutos

---

**Cualquier duda, escríbannos en #copilot-api-ia. ¡Esperamos su conexión! 🚀**

---

**Adjuntos**:
- Scripts de ejemplo (bash y Python)
- Webhook URL configurado
- Documentación completa en nuestro repositorio

**Estado**: ✅ Listo de nuestro lado, esperando configuración de ustedes
