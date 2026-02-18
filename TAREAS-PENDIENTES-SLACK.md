# Mensajes pendientes – #copilot-api-ia

**Revisión:** 2026-02-12 (desde historial del canal)  
**Canal:** #copilot-api-ia (C0AEV0GCLM7)

---

## Para nosotros (Frontend / Copilot LobeChat)

### 1. Decisiones Sistema de Monitoreo de API Keys (api-ia)

**Prioridad: esta semana** – Definir con api-ia:

| # | Pregunta | Opciones |
|---|----------|----------|
| **1** | ¿Cómo notificar a clientes cuando sus keys fallen? | Slack, Email, in-app (toast/banner), Webhook su sistema, Combinación |
| 2 | ¿Dashboard visual para estado de keys? | Sí alta, Sí media, No |
| 3 | Si dashboard, ¿dónde? | Admin API2, Lobe Chat, Página standalone |
| 4 | Cuando una key falla, ¿qué ve el usuario? | Transparente, Sutil (toast), Explícita (banner) |
| 5 | ¿Recarga de saldo desde UI? | Link provider, Pasarela, Externamente |
| 6 | ¿Histórico de cambios de estado? | Sí, No, Solo admins |

Doc referencia: `INFORME_PARA_FRONTEND_SISTEMA_KEYS.md` (api-ia, `/opt/backend/`).

---

### 2. Preguntas recientes de api-ia (directas)

- **¿Quieren mostrar balance de keys en UI?**
- **Aviso:** Key deshabilitada – bodasdehoy, Provider: OpenAI, Razón: Balance $0.
- **Endpoint** `/monitor/stats` disponible (api-ia).

**Acción:** Responder en #copilot-api-ia (por ejemplo con `./scripts/slack-send.sh "..."` o `slack-notify.sh`) si queremos balance en UI y cómo.

---

## En espera de otros (contexto)

### API2 – Credenciales whitelabel bodasdehoy

- **Pendiente de API2:** Corregir Anthropic (sk-ant-), Groq (modelo llama-3.3-70b-versatile), invalidar cache, confirmar.
- **Nosotros:** Esperar; api-ia validará y notificará cuando esté. Luego podemos volver a ejecutar `./scripts/test-api-ia-providers.sh`.

### api-ia ↔ API2

- Smoke tests 17 operaciones (Memories P0), endpoint credenciales IA, etc. No es acción directa nuestra.

---

## Resumen

| Tipo | Cantidad | Acción |
|------|----------|--------|
| **Decisiones nuestras** | 6 preguntas (Sistema Keys) + 1 (balance en UI) | ✅ **Enviado** 2026-02-12 a #copilot-api-ia (versión corta por slack-send.sh). |
| **En espera** | Credenciales bodasdehoy | Esperar a API2; api-ia nos avisará. |

**Respuesta enviada:** Ver [RESPUESTA-SLACK-SISTEMA-KEYS.md](RESPUESTA-SLACK-SISTEMA-KEYS.md) para el texto completo. Si api-ia pide más detalle, copiar/pegar el bloque largo de ese archivo en Slack.

---

## Acción: Lectura automática del canal (slack-read.sh)

Si `./scripts/slack-read.sh` falla con `missing_scope`, el bot no tiene permiso para leer mensajes. **Solución:** Seguir los pasos de [COMO-SOLUCIONAR-LECTURA-SLACK.md](COMO-SOLUCIONAR-LECTURA-SLACK.md):

1. api.slack.com/apps → app Copilot LobeChat → OAuth & Permissions
2. Bot Token Scopes → añadir `channels:history` y `channels:read`
3. Reinstall to Workspace → actualizar `SLACK_BOT_OAUTH_TOKEN` en `.env` si cambió
4. Asegurar que el bot está en #copilot-api-ia

Hasta entonces, revisar pendientes manualmente en Slack o regenerar este doc a mano.

---

## Cuando api-ia avise: tests de proveedores

Tras corrección de credenciales whitelabel bodasdehoy (API2), ejecutar:

```bash
BASE_URL="https://api-ia.bodasdehoy.com" DEVELOPMENT="bodasdehoy" ./scripts/test-api-ia-providers.sh
```

Actualizar [INFORME-PRUEBAS-PROVEEDORES-API-IA.md](INFORME-PRUEBAS-PROVEEDORES-API-IA.md) si aplica.

---

*Generado a partir de `./scripts/slack-read.sh 50` (o revisión manual si slack-read falla por missing_scope).*
