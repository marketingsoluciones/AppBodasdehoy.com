# Pendientes y estado de Slack con api-ia (17 feb 2026)

**Canal:** #copilot-api-ia (ID: C0AEV0GCLM7)  
**Última verificación Slack:** 18 feb 2026 (slack-read.sh 10). **Última verificación pruebas:** test básico 200/200/200. **Coordinación plan:** Ver **docs/PLAN-TESTING-COORDINACION-SLACK.md**.

**Mensaje nuevo api-ia (17 feb):** *Plan de testing coordinado – revisión y completado por Frontend.* Piden: (1) Revisar contrato de respuestas (200, 402, 503, 429, 401) y batería/triaje; (2) Completar qué pruebas ejecutamos (scripts, orden, formato de reporte); (3) Confirmar "OK" o "Cambios: [lista]". Documento suyo: PLAN_TESTING_COORDINADO_API2_MIDDLEWARE_FRONTEND.md (en su repo).  
**Nuestra respuesta:** Ver **docs/PLAN-TESTING-COORDINADO-FRONTEND-RESPUESTA.md**. Confirmación enviada: Cambios [1. Implementar 402; 2. Adoptar formato de reporte que indiquéis].  
**Mensaje nuevo api-ia (plan medio cerrado):** Piden "Falta implementar: [lista]" y "Sugerencias: [lista]". Respuesta enviada 18 feb: Falta implementar = (1) 402 en proxy, (2) UI saldo agotado/upgrade, (3) propagación 401 opcional; ya tenemos X-Development y reporte con request+response+trace_id. Sugerencias = ninguna; pedimos RESUMEN_PLAN o JSON 402 para cerrar. Seguimiento enviado: mejoras al plan (esquema 402, formato reporte, E2E usuario real, enlace 402→Facturación, balance keys cuando exista). Ver docs/LO-QUE-FALTA-Y-MEJORAS-AL-PLAN.md. **api-ia respondió:** "Respuesta plan medio cerrado – recibida e incorporada"; cuando API2 exponga payment_url/upgrade_url en 402 nos avisan. **Frontend comunicó en Slack:** 402 ya implementado en proxy y cliente (SALDO_AGOTADO, mensaje en UI); pendiente botón Recargar cuando existan payment_url/upgrade_url.

**Subdominios Cloudflare (app-test, chat-test):** quien tiene capacidad de acceso somos nosotros (Frontend). Cuando credenciales whitelabel estén corregidas nos avisan para re-ejecutar test-api-ia-providers.sh.

**Paneles pendientes (Facturación / Copilot):** Placeholders implementados (planes, cambiar plan, dar crédito admin, uso keys IA). Peticiones a API2 y api-ia documentadas en **docs/PANELES-PENDIENTES-PETICIONES-API2-API-IA.md**. Mensaje listo para Slack en **docs/SLACK-MENSAJE-PANELES-PENDIENTES.md** (copiar/pegar en #copilot-api-ia cuando se quiera pedir ayuda).

---

## 0. Estado de las pruebas – qué tiene éxito y qué bloquea

| Área | Qué tiene éxito | Qué bloquea |
|------|-----------------|-------------|
| **api-ia (salud/config)** | GET /health → 200. GET /api/config/bodasdehoy → 200. | Nada; estos endpoints van bien. |
| **api-ia (chat)** | test-api-ia-y-enviar-slack.sh → 200. Batería B hoy: **19/20** (1× 503 en #10 «flores centro de mesa»). | Ocasional 503 en algunas preguntas (lado api-ia/rate limit). |
| **Cloudflare subdominios** | Túnel lobe-chat-harbor corre; ingress configurado (app-test→8080, chat-test→3210). chat-test.eventosorganizador.com → 200. | **app-test.bodasdehoy.com** y **chat-test.bodasdehoy.com** → ERR si en Cloudflare no están los Public Hostnames / CNAME para bodasdehoy. **Quien puede configurarlo: Frontend (nosotros).** |
| **Slack** | Lectura y escritura en #copilot-api-ia OK. | Nada. |

**Resumen bloqueos:** (1) 503 chat → lo resuelve API2/api-ia (credenciales). (2) app-test/chat-test.bodasdehoy.com → lo resolvemos nosotros en Cloudflare (DNS + Public Hostnames al túnel).

**¿Qué es el 503 y qué pasa?** El 503 en POST /webapi/chat/auto significa que api-ia no pudo devolver una respuesta válida. Suele venir de: **(A) AUTH_ERROR** – la API key del proveedor de IA (OpenAI, Groq, etc.) que usa api-ia para el whitelabel “bodasdehoy” no es válida o no tiene saldo; esa key la proporciona API2, no nosotros. **(B) EMPTY_RESPONSE** – el orquestador eligió un provider/modelo pero la respuesta llegó vacía o genérica. api-ia ya corrigió el tema “provider+modelo incoherente” (usan modelo por defecto); lo que sigue fallando en la mayoría de peticiones es la **autenticación con el proveedor** (credenciales whitelabel bodasdehoy en API2). Nosotros enviamos X-Development: bodasdehoy y opcionalmente Authorization; el fallo está en el lado de api-ia/API2 (key inválida o mal configurada).

**Pruebas con usuario real:** Si el front facilita email y contraseña de un usuario de prueba (Firebase bodasdehoy), podemos ejecutar las pruebas con **Authorization: Bearer &lt;JWT&gt;** y comprobar si el 503 se debe a no enviar usuario o a credenciales whitelabel. Ver **docs/PRUEBAS-COMO-USUARIO-REAL.md**.

**Última comprobación (Slack + pruebas):** **17 feb 2026:** test básico 200/200/200. **Batería B:** 19/20 coherentes; fallo #10 «Sugiere flores de temporada para el centro de mesa» → 503 (4132ms). Resumen enviado a #copilot-api-ia. Ver *¿Qué es el 503?* más abajo.

---

## 1. Comunicación vía Slack con api-ia

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| **Canal compartido** | ✅ | #copilot-api-ia – nosotros (Frontend/Copilot) y api-ia escribimos en el mismo canal. |
| **Lectura** | ✅ OK | `./scripts/slack-read.sh [N]` – usa SLACK_BOT_TOKEN, devuelve últimos N mensajes. Verificado con 5 mensajes. |
| **Escritura** | ✅ OK | `./scripts/slack-send.sh "mensaje"` y `slack-notify.sh` – usan SLACK_WEBHOOK_FRONTEND. Verificado envío correcto. |
| **Quién envía / a quién va** | ✅ | Los mensajes incluyen "De: Frontend / Copilot LobeChat" y "Para: Equipo api-ia (#copilot-api-ia)" (slack-send.sh / slack-notify.sh). |

**Conclusión:** Tenemos capacidad de **lectura y escritura** en nuestro canal con api-ia. La comunicación vía Slack está operativa.

---

## 1.1 Modo autónomo (qué hacer sin pedir permiso)

**Regla:** Para los tests que pida api-ia, opero de forma **autónoma** (ejecutar pruebas, enviar a Slack, preparar docs). **No realizo cambios en el código sin tu aviso ni autorización.**

| Acción | ¿Necesita tu autorización? |
|--------|----------------------------|
| **Cambios en código o lógica del proyecto** | ✅ **Sí** – solo avanzo si me lo autorizas. |
| Testear (scripts, curl, run-20-preguntas, test-api-ia-y-enviar-slack) | ❌ No – lo ejecuto cuando toque. |
| Preparar pruebas, verificaciones, documentos | ❌ No – lo hago autónomamente. |
| Leer Slack (`slack-read.sh`), enviar a Slack (`slack-send.sh`) | ❌ No – me comunico con api-ia sin pedir permiso. |
| Enviar a api-ia pruebas reales (request/response, curl, trace_id) | ❌ No – siempre que notifique un fallo incluyo las pruebas reales. |

**Leer Slack cada X minutos:** No puedo ejecutar tareas en segundo plano; cuando me pidas "revisa Slack" lo haré. Para automatizar en tu máquina: cron cada 15 min `*/15 * * * * cd /ruta/al/repo && ./scripts/slack-read.sh 5 >> /tmp/slack-read.log`. **Para este caso (api-ia resolviendo 503):** si api-ia necesita respuestas muy rápidas, revisar Slack cada 1 min: `* * * * * cd /ruta/al/repo && ./scripts/slack-read.sh 5 >> /tmp/slack.log` (mismo canal #copilot-api-ia).

### Protocolo autónomo con api-ia (qué hago cada vez)

Cuando digas **"avanza"** o **"revisa api-ia"** (o pidas tests para api-ia), ejecuto **sin pedir permiso**:

1. **Leer Slack** – `./scripts/slack-read.sh 6` en #copilot-api-ia (ver si api-ia ha pedido algo o contestado).
2. **Pruebas básicas** – `./scripts/test-api-ia-y-enviar-slack.sh` (health, chat/auto, config) y **envío del resumen a Slack**.
3. **20 preguntas** – `node scripts/run-20-preguntas-api-ia.mjs` y/o `node scripts/run-20-preguntas-api-ia-bateria-b.mjs` cuando convenga (p. ej. si hay dudas de estabilidad o api-ia pide batería).
4. **Reportar** – resumir aquí resultado (OK/fallos) y, si hay fallos, enviar a Slack resumen con números (p. ej. 17/20, trace_id si aplica).
5. **Actualizar docs** – fecha de última verificación en este archivo.

**No hago** cambios en código sin tu autorización. Si api-ia pide una serie de tests concreta, la ejecuto y envío resultados a Slack.

---

## 2. Pendientes (resumen)

### 2.1 Para nosotros (Frontend)

| # | Pendiente | Acción |
|---|-----------|--------|
| 1 | **Sistema de monitoreo de API Keys** | Ya enviamos respuesta corta a #copilot-api-ia (RESPUESTA-SLACK-SISTEMA-KEYS.md). Si api-ia pide más detalle, enviar bloque largo de ese archivo. |
| 2 | **Balance de keys en UI** | api-ia preguntó si queremos mostrar balance en UI. Responder en #copilot-api-ia (sí/no y cómo) cuando se decida. |
| 3 | **Notificaciones keys deshabilitadas** | api-ia ofreció: Slack, Dashboard, Email. Decidir y responder (a, b, c o d). |
| 4 | **Pruebas como usuario real (credenciales)** | El front puede facilitar **TEST_USER_EMAIL** y **TEST_USER_PASSWORD** (usuario Firebase bodasdehoy) para ejecutar las pruebas con Authorization: Bearer &lt;JWT&gt; y comprobar si así se resuelve el 503. Ver **docs/PRUEBAS-COMO-USUARIO-REAL.md**. Comando: `TEST_USER_EMAIL=... TEST_USER_PASSWORD=... bash scripts/test-api-ia-y-enviar-slack.sh` o `node scripts/get-firebase-token-and-run-20.mjs --json --output docs/resultados-20-preguntas-api-ia.json`. |

### 2.2 En espera de otros (nos bloquean)

| # | Pendiente | Quién | Qué notificar a api-ia (siempre con pruebas reales) |
|---|-----------|--------|-----------------------------------------------------|
| 1 | **503 POST /webapi/chat/auto** | api-ia | Cada vez: request real (URL, headers, body), response real (status, body, trace_id), curl exacto. Ver docs/PRUEBAS-REALES-PARA-API-IA-FEB2025.md. |
| 2 | **Cloudflare app-test/chat-test** | **Frontend (nosotros)** – nosotros tenemos capacidad de acceso a subdominios Cloudflare | Configurar en Cloudflare: Public Hostnames (o CNAME) para app-test.bodasdehoy.com y chat-test.bodasdehoy.com apuntando al túnel (lobe-chat-harbor). Ver docs/ESTADO-TUNELES-ESTE-EQUIPO.md y docs/QUE-FALTA-VPN-Y-SUBDOMINIOS.md. |
| 3 | **Credenciales whitelabel bodasdehoy** | API2 / api-ia | Cuando esté: ejecutar test-api-ia-providers.sh y run-20-preguntas-api-ia.mjs. |

**Regla:** Al notificar a api-ia un fallo, siempre enviar la consulta real + request/response de la prueba que falló (no solo "falla 503").

### 2.3 Hecho / Referencia

- Respuesta Sistema Keys enviada (slack-send).
- Informe conversaciones + api-ia enviado (INFORME-CONVERSACIONES-Y-API-IA-FEB2025.md).
- Respuestas de Slack recuperadas y guardadas (RESPUESTAS-SLACK-COPILOT-API-IA-2025-02-13.md).
- Pruebas reales enviadas a Slack (15 feb): doc PRUEBAS-REALES-PARA-API-IA-FEB2025.md con request/response y forma de reproducir.
- Notificación con pendientes + pruebas reales (16 feb): request real, response real (trace_id dfa850d8), curl exacto, 20 preguntas. Template: `scripts/slack-mensaje-pendientes-con-pruebas.txt` — para reenviar: `./scripts/slack-send.sh "$(cat scripts/slack-mensaje-pendientes-con-pruebas.txt)"`.
- **Sesión pruebas 16 feb (insistir):** test-api-ia-y-enviar-slack.sh (health 200, chat 503, config 200); run-20-preguntas → 1/20 coherentes (solo pregunta 15 "Dame ideas para el menú" → 200), 19/20 → 503; test-api-ia-providers.sh → anthropic mensaje vacío, groq EMPTY_RESPONSE, openai/auto AUTH_ERROR. Enviado a Slack con trace_id 859ba36e y resumen 20 preguntas.
- **Query real completa + pregunta a api-ia (16 feb):** Enviado mensaje con request exacto (headers que SÍ y que NO enviamos), body JSON, response completo (trace_id f7cf3354), curl exacto y pregunta directa: "¿Nos falta algún parámetro u header obligatorio (Authorization, X-Support-Key, etc.)? ¿De dónde recuperarlo?" Template: `scripts/slack-mensaje-pruebas-reales-query-completo.txt`. Reenviar: `./scripts/slack-send.sh "$(cat scripts/slack-mensaje-pruebas-reales-query-completo.txt)"`.
- **Batería para api-ia (ejecutar internamente):** Doc completo `docs/BATERIA-PRUEBAS-PARA-API-IA-EJECUTAR-INTERNAMENTE.md` con las 20 queries, lógica coherente/incoherente, parámetros (BASE_URL, X-Development, token usuario), cómo obtener token (Firebase REST), test de proveedores y opciones para token (email/password o token temporal). Enviado a #copilot-api-ia en dos mensajes (aviso + contenido esencial). Para comunicación directa / respuestas rápidas: canal #copilot-api-ia; revisar Slack cada 1 min (cron) si hace falta mientras api-ia resuelve el caso.

---

## 3. Siguiente paso cuando api-ia avise (credenciales corregidas)

Ejecutar en este orden:

```bash
bash scripts/test-api-ia-y-enviar-slack.sh
node scripts/run-20-preguntas-api-ia.mjs --json --output docs/resultados-20-preguntas-api-ia.json
```

Si todo 200 y respuestas coherentes → cerrar tema 503. Si sigue fallando → devolver a api-ia con el JSON o trace_id.

---

## 4. Scripts útiles

```bash
# Leer últimos mensajes
./scripts/slack-read.sh      # 10
./scripts/slack-read.sh 25    # 25

# Enviar mensaje
./scripts/slack-send.sh "Texto del mensaje"

# Probar api-ia y enviar resumen a Slack
./scripts/test-api-ia-y-enviar-slack.sh
```

---

## 5. Referencias

- **Nuestra parte (pendiente / implementado / faltante / mejoras a pedir):** **docs/NUESTRA-PARTE-PENDIENTE-E-IMPLEMENTADO.md**
- Coordinación plan testing: **docs/PLAN-TESTING-COORDINACION-SLACK.md**
- Pendientes detallados: **TAREAS-PENDIENTES-SLACK.md**
- Verificación leer/escribir: **VERIFICACION-SLACK-LEER-ESCRIBIR.md**
- Quién envía / destinatario: **docs/SLACK-ANALISIS-QUIEN-ENVIA-Y-DESTINATARIO.md**
- Si falla lectura (missing_scope): **COMO-SOLUCIONAR-LECTURA-SLACK.md**
