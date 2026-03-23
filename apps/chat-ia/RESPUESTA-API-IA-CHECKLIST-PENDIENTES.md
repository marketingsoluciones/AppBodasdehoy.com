# Respuesta a api-ia — Cierre rápido de pendientes (checklist equipos)

**Canal sugerido:** `#copilot-api-ia`  
**De:** AppBodasdehoy / Chat-IA (LobeChat).  
**Contexto:** vuestro checklist “Cierre rápido…” (lobechat-kb, headers usuario, 402/503 + evidencias).

---

## Mensaje listo para pegar (revisad y adjuntad evidencias antes de enviar)

```text
[AppBodasdehoy / Chat-IA → api-ia] Cierre rápido — nuestra parte

Hemos revisado el checklist. Cerramos lo que es responsabilidad front según código y dejamos debajo las evidencias que pedís (request/response/trace_id/UTC) en hilos separados o adjuntas.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1) FRONT chat-ia — POST /api/lobechat-kb/search y /embed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Estado implementación:
- El servidor Chat-IA (Next) llama a estos paths contra el backend configurado en `EVENTOS_API_CONFIG.BACKEND_URL` (SSR: típicamente `NEXT_PUBLIC_BACKEND_URL` → api-ia). Ver `src/server/services/lobechatKBMiddlewareService.ts`.

Acción nuestra:
- Re-test manual o script en el entorno acordado (test/prod) con usuario real.
- Por cada caso OK o KO adjuntamos en UN mensaje:
  • Request: método + URL completa + headers + body
  • Response: status + body
  • trace_id (del body o cabeceras, según devolváis)
  • Hora UTC

(Pendiente de pegar aquí las 2 evidencias cuando las tengamos — ver plantilla curl al final de este doc en el repo.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2) AppBodas / integración chat — X-User-ID, X-User-Role, 402/503 UI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Confirmación técnica (código):

• Chat auto (fetchSSE → `/webapi/chat/...`):
  - `X-User-ID`: se envía si hay usuario válido (email, teléfono, UUID Firebase, etc.; excl. visitante guest). `src/services/chat/index.ts`
  - `X-User-Role`: se envía si el rol está en el store (`userRole`), rellenado tras flujo de identificación (p. ej. `EventosAutoAuth` / identify). Si api-ia necesitáis el header SIEMPRE, confirmad contrato: ¿rol por defecto cuando aún no ha terminado identify?

• 402 / 503 en proxy `webapi/chat/[provider]/route.ts`:
  - Se parsea `detail` y `screen_type` del JSON del backend cuando viene en la respuesta de error.
  - Se devuelve a LobeChat como `errorType` + `body: { message, screen_type, type }`.

• UI (`generateAIChat.ts` → `onErrorHandle`):
  - 402 (`insufficient_balance`): `apiErrorDetail` ← mensaje; `apiErrorScreenType` ← `screen_type` (modal saldo).
  - 503 (`ServiceUnavailable` / `service_unavailable`): mismo uso de `message` y `screen_type` en estado para UI.

Evidencia que enviaremos:
- 1 flujo chat con usuario identificado: captura request real con `X-User-ID` y `X-User-Role` visibles (Network).
- 1 flujo 402 y 1 flujo 503 (o test controlado): request + response + trace_id + UTC, mostrando que la UI consume el mensaje/`screen_type` cuando lo enviáis.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dudas / coordinación
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Si algo del contrato no cuadra (p. ej. obligatoriedad de `X-User-Role` antes de identify, formato exacto de `detail`), escribidnos en hilo y lo ajustamos en la misma iteración.

— Chat-IA / AppBodasdehoy
```

---

## Plantillas para generar evidencias (equipo interno)

**Sustituir:** `BASE` (URL api-ia), `USER_ID`, cuerpos de ejemplo, y copiar `trace_id` y hora UTC de la respuesta real.

### Search

```bash
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "UTC: $TS"
curl -sS -D - -X POST "$BASE/api/lobechat-kb/search" \
  -H "Content-Type: application/json" \
  -d '{"query":"prueba kb","user_id":"USER_ID","limit":3,"min_score":0.3}'
```

### Embed

```bash
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "UTC: $TS"
curl -sS -D - -X POST "$BASE/api/lobechat-kb/embed" \
  -H "Content-Type: application/json" \
  -d '{"text":"texto de prueba embed","user_id":"USER_ID","file_id":"test-file-1","metadata":{}}'
```

### Chat (headers usuario) — inspección navegador

En DevTools → Network → petición `POST` a `/webapi/chat/openai` (u otro provider), copiar:
- Request headers: `X-User-ID`, `X-User-Role`, `X-Development`, `Authorization` si aplica.
- Response + `trace_id` del cuerpo o cabecera que uséis.

---

## Estado interno (para no mentir en el canal)

| Ítem | Código | Evidencia pegada en Slack |
|------|--------|---------------------------|
| lobechat-kb search | OK en repo | ☐ pendiente adjuntar |
| lobechat-kb embed | OK en repo | ☐ pendiente adjuntar |
| X-User-ID en chat | OK | ☐ captura Network |
| X-User-Role en chat | OK si `userRole` en store | ☐ confirmar con identify completo |
| 402 UI detail/screen_type | OK | ☐ prueba real o staging |
| 503 UI detail/screen_type | OK | ☐ prueba real o staging |

Cuando marquéis las casillas, podéis cambiar en el mensaje de arriba “Pendiente de pegar…” por “Evidencias: ver mensaje(s) siguiente(s)”.

---

*Archivos relacionados:* `NUESTRA-RESPUESTA-UNIFICADA-API2-API-IA.md`, `REFERENCIA-CHECKLIST-API2-Y-NUESTRA-RESPUESTA.md`.


---

## Avance automático (repo) — 2026-03

| Cambio | Motivo |
|--------|--------|
| `AuthConfigPayload.userRole` + envío desde `CopilotIframe` | api-ia pide `X-User-Role` con usuario identificado; el iframe antes no pasaba rol al store. |
| `EventosAutoAuth` guarda `userRole` al recibir `AUTH_CONFIG` | El chat envía `X-User-Role` en `services/chat/index.ts` cuando el store tiene rol. |
| `scripts/evidencias-api-ia-lobechat-kb.sh` | Salida rápida para adjuntar evidencias search/embed (rellenar `API_IA_BASE` y `KB_USER_ID`). |

**Pendiente manual:** ejecutar el script (o curl) en el entorno real y pegar en Slack status + body + trace_id.

