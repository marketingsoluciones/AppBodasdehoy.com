# 💬 Comunicación entre Claude Code (Copilot) ↔ Claude Code (api-ia) vía Slack

**Fecha**: 2026-02-11
**Para**: Equipos usando Claude Code
**Canal**: #copilot-api-ia en workspace **eventosorganizador**

---

## 🎯 ¿Qué es esto?

Este documento explica cómo dos agentes de Claude Code (uno en el equipo de Copilot LobeChat y otro en el equipo de api-ia) pueden comunicarse entre sí vía Slack en tiempo real.

**No requiere código TypeScript/JavaScript**. Solo scripts bash que Claude Code puede ejecutar.

---

## 📋 Requisitos Previos

### 1. Unirse al Workspace de Slack

**Link de invitación**:
```
https://join.slack.com/t/eventosorganizador/shared_invite/zt-3poaxs2nb-Jfwmw5eT5x6P_Gk7Yf4z8w
```

1. Clic en el link
2. Crear cuenta o iniciar sesión
3. Aceptar la invitación

### 2. Canal de Comunicación

Buscar el canal: **#copilot-api-ia**

Este es el canal exclusivo para comunicación entre:
- **Claude Code (Copilot LobeChat)** ← Tú estás aquí
- **Claude Code (api-ia)** ← Equipo backend

---

## 🚀 Uso con Claude Code

### Método 1: Script Simple

Para enviar un mensaje rápido:

```bash
./scripts/slack-send.sh "Hola equipo api-ia, necesitamos verificar credenciales"
```

**Resultado en Slack**:
```
[Copilot LobeChat] Hola equipo api-ia, necesitamos verificar credenciales
```

---

### Método 2: Script con Tipos de Mensaje

Para enviar notificaciones estructuradas:

```bash
./scripts/slack-notify.sh <tipo> <mensaje> [detalles]
```

**Tipos disponibles**:
- `error` - ❌ Reportar un error
- `help` - 🆘 Solicitar ayuda
- `success` - ✅ Notificar éxito
- `info` - 💬 Información general
- `warning` - ⚠️ Advertencia
- `question` - ❓ Hacer una pregunta

---

### 📝 Ejemplos de Uso con Claude Code

#### Ejemplo 1: Reportar Error

**Solicitud al Claude Code**:
```
Claude, ejecuta el siguiente comando:
./scripts/slack-notify.sh error "Error al autenticar con api-ia" "Trace ID: 935aaaf0, Endpoint: /webapi/chat/anthropic"
```

**Mensaje en Slack**:
```
[Copilot LobeChat] ❌ ERROR

Error al autenticar con api-ia

Detalles: Trace ID: 935aaaf0, Endpoint: /webapi/chat/anthropic
```

---

#### Ejemplo 2: Solicitar Ayuda

**Solicitud al Claude Code**:
```
Claude, comunícate con el equipo de api-ia para pedir ayuda con las credenciales de Anthropic:
./scripts/slack-notify.sh help "Necesitamos verificar credenciales de Anthropic para bodasdehoy" "La API key parece tener formato de OpenAI en lugar de Anthropic"
```

**Mensaje en Slack**:
```
[Copilot LobeChat] 🆘 SOLICITUD DE AYUDA

Necesitamos verificar credenciales de Anthropic para bodasdehoy

Detalles: La API key parece tener formato de OpenAI en lugar de Anthropic
```

---

#### Ejemplo 3: Hacer Pregunta

**Solicitud al Claude Code**:
```
Claude, pregunta al equipo de api-ia:
./scripts/slack-notify.sh question "¿El endpoint /api/developers/bodasdehoy/ai-credentials es correcto o cambió recientemente?"
```

**Mensaje en Slack**:
```
[Copilot LobeChat] ❓ PREGUNTA

¿El endpoint /api/developers/bodasdehoy/ai-credentials es correcto o cambió recientemente?
```

---

#### Ejemplo 4: Notificar Éxito

**Solicitud al Claude Code**:
```
Claude, notifica al equipo de api-ia:
./scripts/slack-notify.sh success "Actualizamos las credenciales en nuestro sistema" "Developer: bodasdehoy, Provider: Anthropic"
```

**Mensaje en Slack**:
```
[Copilot LobeChat] ✅ ÉXITO

Actualizamos las credenciales en nuestro sistema

Detalles: Developer: bodasdehoy, Provider: Anthropic
```

---

#### Ejemplo 5: Compartir Información

**Solicitud al Claude Code**:
```
Claude, informa al equipo:
./scripts/slack-notify.sh info "Desplegamos nueva versión del Copilot con fix de autenticación" "Versión: 1.0.2, Branch: feature/auth-fix"
```

**Mensaje en Slack**:
```
[Copilot LobeChat] 💬 INFORMACIÓN

Desplegamos nueva versión del Copilot con fix de autenticación

Detalles: Versión: 1.0.2, Branch: feature/auth-fix
```

---

## 🤖 Cómo el Equipo api-ia te Responderá

El equipo de api-ia también tiene Claude Code configurado con scripts similares.

**Ellos te pueden enviar**:
- Respuestas a tus preguntas
- Confirmaciones de cambios
- Notificaciones de problemas detectados
- Actualizaciones de configuración

**Sus mensajes aparecerán como**:
```
[api-ia Backend] <emoji> <mensaje>
```

---

## 📞 Flujo de Comunicación

### Escenario 1: Detectaste un Error

1. **Tú (Copilot)**:
   ```bash
   ./scripts/slack-notify.sh error "Error 401 al llamar /webapi/chat/anthropic" "Trace ID: 935aaaf0"
   ```

2. **api-ia responde** (en Slack):
   ```
   [api-ia Backend] Revisamos el trace ID 935aaaf0. La API key tiene formato incorrecto.
   Vamos a corregirlo ahora.
   ```

3. **api-ia confirma** (en Slack):
   ```
   [api-ia Backend] ✅ Credenciales corregidas. Por favor prueben de nuevo.
   ```

4. **Tú confirmas**:
   ```bash
   ./scripts/slack-notify.sh success "Autenticación funcionando correctamente"
   ```

---

### Escenario 2: Necesitas Información

1. **Tú preguntas**:
   ```bash
   ./scripts/slack-notify.sh question "¿Cambió el endpoint de ai-credentials en las últimas 48 horas?"
   ```

2. **api-ia responde** (en Slack):
   ```
   [api-ia Backend] No, el endpoint sigue siendo /api/developers/{developer}/ai-credentials
   No hubo cambios en las últimas 2 semanas.
   ```

---

## 🛠️ Integración Directa con Claude Code

Puedes pedirle a Claude Code que ejecute estos comandos directamente:

### Opción 1: Comando Directo

```
Claude, envía este mensaje al equipo de api-ia vía Slack:
"Necesitamos ayuda con credenciales de Anthropic para bodasdehoy"
```

Claude ejecutará:
```bash
./scripts/slack-send.sh "Necesitamos ayuda con credenciales de Anthropic para bodasdehoy"
```

---

### Opción 2: Comando Estructurado

```
Claude, reporta este error al equipo de api-ia:
Error: 401 Unauthorized al llamar /webapi/chat/anthropic
Trace ID: 935aaaf0
Developer: bodasdehoy
```

Claude ejecutará:
```bash
./scripts/slack-notify.sh error "Error 401 al llamar /webapi/chat/anthropic" "Trace ID: 935aaaf0, Developer: bodasdehoy"
```

---

## 📋 Ubicación de Scripts

Los scripts están en:

```
/Users/juancarlosparra/Projects/AppBodasdehoy.com/scripts/
├── slack-send.sh       # Envío simple de mensajes
└── slack-notify.sh     # Envío de mensajes estructurados
```

---

## ⚙️ Configuración Técnica (Referencia)

### Webhook URL
```
https://hooks.slack.com/services/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
```

### Canal
```
#copilot-api-ia
```

### Workspace
```
eventosorganizador
```

### Prefijo de Mensajes
```
[Copilot LobeChat]
```

---

## ✅ Verificación Rápida

Para verificar que todo funciona:

```bash
./scripts/slack-send.sh "🧪 Test de conexión"
```

Deberías ver el mensaje aparecer en el canal **#copilot-api-ia** de Slack.

---

## 🔄 Para el Equipo api-ia

**Instrucciones similares deben ser configuradas en su lado**:

1. Crear scripts similares en su repositorio
2. Usar el mismo webhook URL (o crear uno diferente si prefieren)
3. Usar el prefijo `[api-ia Backend]` para identificar sus mensajes
4. Monitorizar el canal **#copilot-api-ia**

---

## 💡 Mejores Prácticas

1. **Usar el tipo correcto de mensaje**:
   - `error` para errores reales
   - `help` cuando necesites asistencia
   - `question` para preguntas
   - `info` para actualizaciones

2. **Incluir detalles relevantes**:
   - Trace IDs
   - Endpoints afectados
   - Developer names
   - Error codes

3. **Ser específico**:
   - ❌ "Algo no funciona"
   - ✅ "Error 401 en /webapi/chat/anthropic para developer bodasdehoy, Trace ID: 935aaaf0"

4. **Confirmar resoluciones**:
   - Siempre enviar un mensaje de `success` cuando algo se resuelva

---

## 🚨 Casos de Uso Importantes

### Basado en tu Investigación del 2026-02-11

Podrías haber usado esto para comunicarte con api-ia:

```bash
# Reportar problema con credenciales
./scripts/slack-notify.sh error "Credenciales de Anthropic tienen formato incorrecto" "API key empieza con sk-proj- (OpenAI) en lugar de sk-ant- (Anthropic). Developer: bodasdehoy"

# Solicitar verificación
./scripts/slack-notify.sh help "Necesitamos que verifiquen credenciales en su base de datos" "Por favor revisen estos Trace IDs: 935aaaf0, fb7f5647, 1bab9c32"

# Preguntar sobre endpoints
./scripts/slack-notify.sh question "¿Los endpoints /api/developers/{developer}/ai-credentials y /webapi/chat/{provider} son correctos?"

# Compartir hallazgos
./scripts/slack-notify.sh warning "El modelo llama-3.1-70b-versatile fue descomisionado por Groq" "Modelo actual debería ser llama-3.3-70b-versatile"
```

---

## 📊 Resumen

| Acción | Comando |
|--------|---------|
| Enviar mensaje simple | `./scripts/slack-send.sh "mensaje"` |
| Reportar error | `./scripts/slack-notify.sh error "mensaje" "detalles"` |
| Pedir ayuda | `./scripts/slack-notify.sh help "mensaje"` |
| Hacer pregunta | `./scripts/slack-notify.sh question "mensaje"` |
| Notificar éxito | `./scripts/slack-notify.sh success "mensaje"` |
| Compartir info | `./scripts/slack-notify.sh info "mensaje"` |
| Advertencia | `./scripts/slack-notify.sh warning "mensaje"` |

---

**¡Listo para comunicarte con api-ia en tiempo real! 🚀**
