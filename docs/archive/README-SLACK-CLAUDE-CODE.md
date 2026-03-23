# 🤖 Sistema de Comunicación Claude Code vía Slack

**Estado**: ✅ **OPERATIVO**
**Fecha**: 2026-02-11
**Canal**: #copilot-api-ia

---

## 📊 Resumen Ejecutivo

Este repositorio tiene configurado un sistema de comunicación en tiempo real vía Slack que permite a Claude Code (nuestro agente) comunicarse con el equipo de api-ia (su agente Claude Code) directamente.

**Canales de Comunicación**:
- **#copilot-api-ia** → Copilot LobeChat ↔ api-ia Backend
- **#api-ia-api2-sync** → api-ia ↔ api2 (canal diferente, no lo usamos)

---

## ✅ ¿Qué se Configuró?

### 1. Scripts de Comunicación

Ubicación: [`scripts/`](./scripts/)

| Script | Propósito | Uso |
|--------|-----------|-----|
| [`slack-send.sh`](./scripts/slack-send.sh) | Envío simple de mensajes | `./scripts/slack-send.sh "mensaje"` |
| [`slack-notify.sh`](./scripts/slack-notify.sh) | Notificaciones estructuradas | `./scripts/slack-notify.sh <tipo> "mensaje" "detalles"` |

### 2. Documentación

| Archivo | Descripción |
|---------|-------------|
| [`COMUNICACION-SLACK-CLAUDE-CODE.md`](./COMUNICACION-SLACK-CLAUDE-CODE.md) | Guía completa de uso con ejemplos |
| [`INSTRUCCIONES-PARA-EQUIPO-API-IA.md`](./INSTRUCCIONES-PARA-EQUIPO-API-IA.md) | Documento para compartir con el equipo de api-ia |
| Este archivo | Resumen ejecutivo |

---

## 🚀 Cómo Usar

### Opción 1: Pedir a Claude Code que envíe mensajes

```
Claude, comunícate con el equipo de api-ia vía Slack:
"Necesitamos ayuda con las credenciales de Anthropic para bodasdehoy"
```

Claude ejecutará automáticamente:
```bash
./scripts/slack-send.sh "Necesitamos ayuda con las credenciales de Anthropic para bodasdehoy"
```

---

### Opción 2: Ejecutar scripts manualmente

**Mensaje simple**:
```bash
./scripts/slack-send.sh "Tu mensaje aquí"
```

**Mensaje con tipo**:
```bash
./scripts/slack-notify.sh error "Error al autenticar" "Trace ID: 935aaaf0"
./scripts/slack-notify.sh help "Necesitamos verificar credenciales"
./scripts/slack-notify.sh question "¿El endpoint cambió?"
./scripts/slack-notify.sh success "Problema resuelto"
./scripts/slack-notify.sh info "Desplegamos nueva versión"
./scripts/slack-notify.sh warning "Modelo de Groq desactualizado"
```

---

## 📋 Tipos de Mensaje Disponibles

| Tipo | Emoji | Cuándo Usar |
|------|-------|-------------|
| `error` | ❌ | Reportar errores |
| `help` | 🆘 | Solicitar ayuda |
| `success` | ✅ | Confirmar éxito |
| `info` | 💬 | Compartir información |
| `warning` | ⚠️ | Advertencias |
| `question` | ❓ | Hacer preguntas |

---

## 🔧 Configuración Técnica

### Webhook URL
```
https://hooks.slack.com/services/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
```

### Canal Slack
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

## 📝 Ejemplos Reales

### Basado en tu investigación del 2026-02-11

Ahora puedes comunicarte directamente con api-ia sobre los problemas que encontraste:

```bash
# Reportar problema de credenciales
./scripts/slack-notify.sh error "Credenciales de Anthropic tienen formato incorrecto" "Developer: bodasdehoy, La API key empieza con sk-proj- (OpenAI) en lugar de sk-ant- (Anthropic)"

# Pedir verificación de trace IDs
./scripts/slack-notify.sh help "Por favor revisen estos trace IDs en sus logs" "935aaaf0, fb7f5647, 1bab9c32"

# Preguntar sobre endpoints
./scripts/slack-notify.sh question "¿El endpoint /api/developers/bodasdehoy/ai-credentials es correcto o cambió recientemente?"

# Reportar modelo descomisionado
./scripts/slack-notify.sh warning "Groq descomisionó el modelo llama-3.1-70b-versatile" "El modelo actual debería ser llama-3.3-70b-versatile"
```

---

## 🔄 Flujo de Comunicación

1. **Tú detectas problema** → Envías mensaje vía script
2. **api-ia recibe notificación** en Slack (#copilot-api-ia)
3. **api-ia investiga** y responde en el mismo canal
4. **Tú ves respuesta** en Slack
5. **Continúan comunicación** hasta resolver

---

## ✅ Tests Realizados

| Test | Estado | Fecha |
|------|--------|-------|
| Envío simple | ✅ | 2026-02-11 |
| Notificación estructurada | ✅ | 2026-02-11 |
| Mensaje con detalles | ✅ | 2026-02-11 |

---

## 📚 Documentación Completa

Para información detallada, ver:
- [COMUNICACION-SLACK-CLAUDE-CODE.md](./COMUNICACION-SLACK-CLAUDE-CODE.md)
- [INSTRUCCIONES-PARA-EQUIPO-API-IA.md](./INSTRUCCIONES-PARA-EQUIPO-API-IA.md)

---

## 🎯 Próximos Pasos

1. ✅ Scripts configurados y funcionando
2. ⏳ Compartir [INSTRUCCIONES-PARA-EQUIPO-API-IA.md](./INSTRUCCIONES-PARA-EQUIPO-API-IA.md) con el equipo de api-ia
3. ⏳ Esperar que api-ia configure sus scripts
4. ⏳ Enviar el [INFORME-INVESTIGACION-PARA-EQUIPOS-API-IA-Y-API2.md](./INFORME-INVESTIGACION-PARA-EQUIPOS-API-IA-Y-API2.md) vía Slack
5. ⏳ Comenzar comunicación en tiempo real

---

## 💡 Beneficios

✅ **Comunicación en tiempo real** (vs emails que tardan horas/días)
✅ **Trazabilidad** (todo queda registrado en Slack)
✅ **Notificaciones automáticas** (el equipo ve los mensajes inmediatamente)
✅ **Sin configuración compleja** (solo scripts bash)
✅ **Integrado con Claude Code** (puedes pedir a Claude que envíe mensajes)

---

**¡Sistema operativo y listo para usar! 🚀**
