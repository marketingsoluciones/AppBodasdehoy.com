# Informe de pruebas reales – Proveedores de IA (api-ia)

**Para**: Equipo api-ia  
**De**: Frontend / Copilot LobeChat  
**Fecha de las pruebas**: 2026-02-12  
**Base URL**: https://api-ia.bodasdehoy.com  
**Developer**: bodasdehoy  

---

## 1. Resumen ejecutivo

Se ejecutaron **pruebas reales** contra api-ia.bodasdehoy.com para comprobar el estado de todos los proveedores de IA. Resultado: **los 4 flujos probados fallan** (anthropic, groq, openai, auto). El servicio está operativo (`/health` OK) pero ninguna llamada de chat devuelve respuesta válida.

| Proveedor  | Estado | Error / detalle | Trace ID  |
|------------|--------|-----------------|------------|
| anthropic  | FAIL   | AUTH_ERROR (API key no válida) | ced6cd9c, b95b2a61 |
| groq        | FAIL   | EMPTY_RESPONSE (modelo descomisionado) | c91908a2, 00c74df1 |
| openai      | FAIL   | EMPTY_RESPONSE | 7eae2b9f |
| auto        | FAIL   | EMPTY_RESPONSE | 1b2ac9d0 |

**Acción solicitada**: Revisar credenciales y configuración para bodasdehoy; corregir Anthropic (key válida), Groq (modelo actualizado) y, si aplica, OpenAI (saldo/cuota).

---

## 2. Cómo se ejecutaron las pruebas

- **Script**: `./scripts/test-api-ia-providers.sh`
- **Comando**:  
  `BASE_URL="https://api-ia.bodasdehoy.com" DEVELOPMENT="bodasdehoy" ./scripts/test-api-ia-providers.sh`
- **Pasos del script**:
  1. GET `/health` → servicio operativo.
  2. GET `/api/providers/bodasdehoy` → lista de proveedores y modelos.
  3. POST `/webapi/chat/{provider}` para anthropic, groq, openai y auto (mensaje de prueba, `stream: false`).

Pueden reproducir el mismo test en su entorno ejecutando el script anterior desde la raíz del repo.

---

## 3. Configuración actual observada (2026-02-12)

**GET** `https://api-ia.bodasdehoy.com/api/providers/bodasdehoy`:

```json
{
  "success": true,
  "development": "bodasdehoy",
  "providers": [
    {
      "provider": "groq",
      "enabled": true,
      "has_key": true,
      "model": "llama-3.1-70b-versatile",
      "base_url": "https://api.groq.com/openai/v1"
    },
    {
      "provider": "anthropic",
      "enabled": true,
      "has_key": true,
      "model": "claude-3-5-sonnet-20241022",
      "base_url": null
    }
  ],
  "active_count": 2,
  "fallback_order": ["groq", "anthropic"]
}
```

Observación: **OpenAI no aparece** en la lista de providers; aun así se probó el endpoint `/webapi/chat/openai` y también falla (EMPTY_RESPONSE).

---

## 4. Proveedores que fallan – Detalle

### 4.1 Anthropic – AUTH_ERROR

- **Endpoint**: `POST /webapi/chat/anthropic`
- **Headers**: `Content-Type: application/json`, `X-Development: bodasdehoy`
- **Body**: `{"messages":[{"role":"user","content":"test"}],"model":"claude-3-5-sonnet-20241022","stream":false}`

**Respuesta real (503)**:

```json
{
  "success": false,
  "error": "Error de autenticación con el proveedor de IA. La API key configurada no es válida.",
  "error_code": "AUTH_ERROR",
  "trace_id": "b95b2a61",
  "provider": "anthropic",
  "model": "claude-3-opus-20240229",
  "upstream_status": 401,
  "timestamp": "2026-02-12T08:35:17.190323",
  "suggestion": "Por favor, intenta de nuevo o verifica la configuración de providers.",
  "metadata": {}
}
```

**Conclusión**: La API key de Anthropic para `bodasdehoy` no es válida (upstream 401). En investigaciones anteriores se detectó que la key almacenada tenía formato de OpenAI (`sk-proj-...`) en lugar de Anthropic (`sk-ant-...`).

**Acción solicitada**: Comprobar en su base de datos/whitelabel la API key de Anthropic para el developer `bodasdehoy` y sustituirla por una key válida de Anthropic (formato `sk-ant-...`).

---

### 4.2 Groq – EMPTY_RESPONSE

- **Endpoint**: `POST /webapi/chat/groq`
- **Headers**: `Content-Type: application/json`, `X-Development: bodasdehoy`
- **Body**: `{"messages":[{"role":"user","content":"test"}],"model":"llama-3.1-70b-versatile","stream":false}`

**Respuesta real (503)**:

```json
{
  "success": false,
  "error": "No se pudo generar una respuesta. El orchestrator devolvió una respuesta vacía o genérica.",
  "error_code": "EMPTY_RESPONSE",
  "trace_id": "00c74df1",
  "provider": "groq",
  "model": "llama-3.1-70b-versatile",
  "upstream_status": null,
  "timestamp": "2026-02-12T08:35:18.029302",
  "suggestion": "Por favor, intenta de nuevo o verifica la configuración de providers.",
  "metadata": {}
}
```

**Conclusión**: El modelo configurado `llama-3.1-70b-versatile` está **descomisionado** por Groq. Las llamadas a Groq con ese modelo no devuelven respuesta útil, por eso api-ia devuelve EMPTY_RESPONSE.

**Acción solicitada**: Actualizar el modelo de Groq para `bodasdehoy` a uno activo, por ejemplo **`llama-3.3-70b-versatile`**, en la configuración de whitelabel/providers. Referencia: https://console.groq.com/docs/models

---

### 4.3 OpenAI – EMPTY_RESPONSE

- **Endpoint**: `POST /webapi/chat/openai`
- **Body de prueba**: `{"messages":[{"role":"user","content":"test"}],"model":"gpt-4o-mini","stream":false}`

**Resultado**: HTTP 503, `error_code`: **EMPTY_RESPONSE**, `trace_id`: **7eae2b9f**.

OpenAI no está listado en `/api/providers/bodasdehoy`; aun así el endpoint responde con 503 y EMPTY_RESPONSE (posible falta de configuración o de saldo en la key de OpenAI para este developer).

**Acción solicitada**: Si OpenAI debe estar disponible para `bodasdehoy`: configurar provider y credenciales; si la key existe, comprobar saldo/cuota en https://platform.openai.com/account/billing (errores 429 insufficient_quota se han visto en el pasado).

---

### 4.4 Auto (routing) – EMPTY_RESPONSE

- **Endpoint**: `POST /webapi/chat/auto`
- **Body**: `{"messages":[{"role":"user","content":"test"}],"stream":false}`

**Resultado**: HTTP 503, `error_code`: **EMPTY_RESPONSE**, `trace_id`: **1b2ac9d0**.

El auto-routing depende de los proveedores configurados (groq, anthropic). Al fallar ambos, el orchestrator no puede devolver una respuesta válida.

**Acción solicitada**: Corregir anthropic y groq como se indica arriba; con al menos un provider funcionando, `/webapi/chat/auto` debería empezar a responder correctamente.

---

## 5. Trace IDs para sus logs

Pueden buscar en sus logs por estos trace_id para asociar con las peticiones de las pruebas:

| Trace ID  | Provider  | Fecha (UTC) aprox. |
|-----------|-----------|----------------------|
| ced6cd9c  | anthropic | 2026-02-12 08:30   |
| b95b2a61  | anthropic | 2026-02-12 08:35   |
| c91908a2  | groq      | 2026-02-12 08:30   |
| 00c74df1  | groq      | 2026-02-12 08:35   |
| 7eae2b9f  | openai    | 2026-02-12 08:30   |
| 1b2ac9d0  | auto      | 2026-02-12 08:30   |

---

## 6. Resumen de acciones solicitadas a api-ia

1. **Anthropic (bodasdehoy)**  
   - Verificar y corregir la API key de Anthropic (que sea válida y formato `sk-ant-...`).  
   - Trace IDs de referencia: `ced6cd9c`, `b95b2a61`.

2. **Groq (bodasdehoy)**  
   - Cambiar el modelo de `llama-3.1-70b-versatile` a **`llama-3.3-70b-versatile`** (o otro modelo activo en Groq).  
   - Trace IDs de referencia: `c91908a2`, `00c74df1`.

3. **OpenAI (bodasdehoy)**  
   - Si debe estar disponible: asegurar configuración del provider y credenciales, y revisar saldo/cuota.  
   - Trace ID de referencia: `7eae2b9f`.

4. **Auto**  
   - No requiere cambio específico; debería funcionar cuando al menos un provider (p. ej. anthropic o groq) esté operativo.

---

## 7. Cómo volver a comprobar después de los cambios

Desde el repo del frontend/Copilot:

```bash
./scripts/test-api-ia-providers.sh
```

O explícitamente:

```bash
BASE_URL="https://api-ia.bodasdehoy.com" DEVELOPMENT="bodasdehoy" ./scripts/test-api-ia-providers.sh
```

Cuando los cambios estén aplicados, deberían verse **OK** en la tabla para los proveedores corregidos. Cualquier duda o resultado distinto, pueden responder en **#copilot-api-ia** (Slack).

---

**Fin del informe.**
