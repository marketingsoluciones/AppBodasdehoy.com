# Pruebas reales para que api-ia evalúe (feb 2025)

**Objetivo:** Request/response reales y curl exactos para reproducir los fallos en POST /webapi/chat/auto.

---

## 1. Request real (siempre igual)

- **URL:** `POST https://api-ia.bodasdehoy.com/webapi/chat/auto`
- **Headers:**
  - `Content-Type: application/json`
  - `X-Development: bodasdehoy`
  - `X-Request-Id: real_<timestamp>` (opcional, para traza)
- **Body:**
```json
{"messages":[{"role":"user","content":"¿Cuántos invitados tengo?"}],"stream":false}
```

**Curl exacto para reproducir:**
```bash
curl -sS -w "\nHTTP_CODE:%{http_code}\n" --max-time 25 \
  -X POST "https://api-ia.bodasdehoy.com/webapi/chat/auto" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: real_$(date +%s)" \
  -d '{"messages":[{"role":"user","content":"¿Cuántos invitados tengo?"}],"stream":false}'
```

---

## 2. Respuestas reales que estamos recibiendo

### 2.1 Tipo A – Error de autenticación (API key no válida)

- **HTTP:** 503
- **Body ejemplo:**
```json
{
  "success": false,
  "error": "Error de autenticación con el proveedor de IA. La API key configurada no es válida.",
  "error_code": "...",
  "trace_id": "...",
  ...
}
```
- **Cuándo:** En muchas ejecuciones del script `test-api-ia-y-enviar-slack.sh` (mensaje "Di hola en una palabra").

### 2.2 Tipo B – EMPTY_RESPONSE (orchestrator vacío)

- **HTTP:** 503
- **Body real capturado (2026-02-15):**
```json
{
  "success": false,
  "error": "No se pudo generar una respuesta. El orchestrator devolvió una respuesta vacía o genérica.",
  "error_code": "EMPTY_RESPONSE",
  "trace_id": "cb2f06ea",
  "provider": "openai",
  "model": "deepseek-chat",
  "upstream_status": null,
  "timestamp": "2026-02-15T23:42:14.833886",
  "suggestion": "Por favor, intenta de nuevo o verifica la configuración de providers.",
  "metadata": {}
}
```
- **Cuándo:** Misma request (X-Development: bodasdehoy, body con "¿Cuántos invitados tengo?"). En este caso el backend respondió con provider openai y model deepseek-chat pero respuesta vacía/genérica.

---

## 3. Batería de 20 preguntas (query reales)

Para que puedan evaluar con las mismas frases que usamos:

1. Hola  
2. ¿Cuántos invitados tengo?  
3. ¿Cuánto llevo pagado del presupuesto?  
4. Quiero ver mis invitados  
5. Llévame al presupuesto  
6. ¿Cómo se llama mi evento?  
7. ¿Cuántas mesas tengo?  
8. Dime 3 consejos para organizar una boda  
9. Dame un resumen completo de mi evento  
10. Agrega a Jose Garcia y Jose Morales como invitados  
11. ¿Cuántos días faltan para mi boda?  
12. ¿Cuál es la boda de Raul?  
13. Muéstrame la lista de todas las bodas  
14. ¿Qué tareas tengo pendientes para mi boda?  
15. Dame ideas para el menú del banquete  
16. ¿Cuánto llevo gastado en el presupuesto?  
17. ¿Qué eventos tengo para el próximo año?  
18. ¿Quién es mi proveedor de flores?  
19. Resume los invitados confirmados  
20. ¿En qué fecha es la boda de María?  

**Script que las ejecuta todas:**  
`node scripts/run-20-preguntas-api-ia.mjs --json --output docs/resultados-20-preguntas-api-ia.json`

---

## 4. Regla al notificar a api-ia

**Siempre enviar:** problema + consulta real + request (URL, headers, body) + response (status, body, trace_id) + curl exacto. No enviar solo "falla 503". Template de mensaje: `scripts/slack-mensaje-pendientes-con-pruebas.txt`.

## 5. Resumen para Slack

- Sigue fallando POST /webapi/chat/auto (503).
- Dos tipos de error vistos: (A) "API key configurada no es válida" y (B) EMPTY_RESPONSE (provider openai, model deepseek-chat).
- Request: solo enviamos X-Development: bodasdehoy (sin JWT en estas pruebas).
- Doc completo en repo: `docs/PRUEBAS-REALES-PARA-API-IA-FEB2025.md` y `docs/ANALISIS-20-PREGUNTAS-API-IA.md`.
