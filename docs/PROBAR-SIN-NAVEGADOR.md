# Probar el Copilot sin usar el navegador

Mientras no se pueda probar en el navegador (api-ia no disponible, entorno sin UI, etc.), se puede validar el código así.

---

## 1. Tests automatizados (principal)

Los tests **no usan navegador** ni llaman a api-ia real: usan mocks y fixtures.

### Requisitos

- En la raíz del monorepo: `pnpm install` (si el lockfile pide actualizarse: `pnpm install --no-frozen-lockfile`).

### Comando

```bash
pnpm test:web
```

### Qué cubren

- **GET /api/copilot/chat-history**: sin `sessionId` → 400; con API2 mock → 200 y `messages`; con errores/red → 200 y `messages: []`; con `API_IA_CHAT_HISTORY_URL` definida → llama a api-ia (GET) y devuelve messages.
- **POST** a chat-history → 405.
- **Servicio copilotChat**: parseo SSE, fallback de historial (chat-history → /api/chat/messages), contrato de mensajes.
- **Handler /api/copilot/chat**: contrato request/response (method, body, status).
- **Utils copilotMetrics**: `reportCopilotMessageSent`, `setCopilotMetricsReporter`.

Si todos pasan, la lógica de APIs, historial y fallbacks está cubierta **sin necesidad de navegador ni backend real**.

---

## 2. Verificación con script (opcional)

```bash
./scripts/verificar-copilot-embed.sh
```

Ejecuta los tests y muestra comandos de ejemplo (curl) para cuando tengas el servidor levantado. No abre navegador.

---

## 3. Cuando tengas servidor local (sin abrir navegador)

Con `pnpm dev:web:local` en marcha (ej. en otro terminal), puedes comprobar las rutas con **curl**:

### Historial (requiere sessionId y auth)

```bash
# Sin API_IA_CHAT_HISTORY_URL → llama a API2 (getChatMessages)
curl -s "http://127.0.0.1:8080/api/copilot/chat-history?sessionId=test_123" \
  -H "Authorization: Bearer TU_JWT" \
  -H "X-Development: bodasdehoy"
```

### Chat (streaming; respuesta larga)

```bash
curl -s -X POST "http://127.0.0.1:8080/api/copilot/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_JWT" \
  -H "X-Development: bodasdehoy" \
  -d '{"messages":[{"role":"user","content":"Hola"}],"sessionId":"test_123"}' \
  --no-buffer
```

Si api-ia no está disponible, verás error tipo "Servicio IA no disponible" o 503. Eso confirma que el proxy y el fallback se comportan como se espera.

---

## 4. Resumen

| Qué quieres validar        | Cómo (sin navegador)                |
|---------------------------|--------------------------------------|
| Lógica de APIs y historial | `pnpm install` + `pnpm test:web`     |
| Contrato chat/historial    | Los mismos tests (Jest + mocks)      |
| Que el servidor responde   | `pnpm dev:web:local` + curl (opcional) |

**Mientras no podáis probar en el navegador**, el punto de referencia es que **`pnpm test:web` pase** tras instalar dependencias.
