# Cierre técnico lobechat-kb — lo que pide api-ia

**De:** api-ia → Front Copilot / chat-ia (`#copilot-api-ia`)

## Pendiente abierto

| Caso | Endpoints |
|------|-----------|
| `lobechat-kb` (RAG) | `POST /api/lobechat-kb/search` · `POST /api/lobechat-kb/embed` |

## Por qué sigue abierto

No hay **evidencia final de re-test** tras el ajuste en api-ia (respuesta estructurada con `trace_id`). Sin eso no marcan cierre técnico.

## Qué ya hicieron en api-ia

- Triage y ajuste para **error estructurado + `trace_id`** en este flujo.
- Pidieron **re-prueba** en hilo.

## Qué tenéis que enviar (un bloque por endpoint está bien)

1. **Request real:** método, URL/path, headers, body  
2. **Response real:** status + body completo  
3. **`trace_id`** de esa respuesta  
4. **Hora UTC** aproximada  

## Criterio de cierre

- Correcto → ellos responden **CERRADO**  
- Fallo → **EN CORRECCIÓN** con acción y ETA  

---

## Cómo generar la evidencia desde este repo

```bash
cd /ruta/al/monorepo
export API_IA_BASE="https://api-ia.bodasdehoy.com"
export KB_USER_ID="vuestro@email.com"

# Opcional si hace falta:
# export KB_EXTRA_HEADER='Authorization: Bearer ...'

./scripts/evidencias-api-ia-lobechat-kb.sh
```

El script imprime **dos bloques** (search y embed) ya numerados como pide api-ia.

**Alternativa:** DevTools → Network → request/response crudo + `trace_id` + UTC.

---

## Encabezado opcional para Slack

```text
[Chat-IA] Re-test lobechat-kb tras ajuste trace_id — evidencias search + embed debajo.
```

Ver también: `RESPUESTA-API-IA-CHECKLIST-PENDIENTES.md`

## Comando monorepo

```bash
pnpm evidencias:api-ia:lobechat-kb
```

(Definir antes `API_IA_BASE` y `KB_USER_ID` en el entorno si no usáis los por defecto del script.)

## Nota sobre respuestas de error

Si el **status es 5xx** y el body **no trae `trace_id`**, la evidencia **sigue siendo válida** para el hilo: adjuntad el bloque tal cual y pedid a api-ia que confirmen si el `trace_id` en errores ya está desplegado en ese endpoint. Ejemplo de respuesta real (marzo 2026): `500` con `detail` sobre embeddings/Ollama.

### Cabeceras completas (debug)



```bash

SAVE_HEADERS=1 pnpm evidencias:api-ia:lobechat-kb

```



Útil si api-ia envía el trace en una cabecera con otro nombre.

### Correlación con api-ia

Cada request lleva **`X-Request-ID`** único (generado en el script). En el mensaje a Slack indicad que pueden buscar ese id en sus logs si el body aún no incluye `trace_id`.

### Guardar informe en archivo

```bash
OUTPUT_FILE=./evidencia-lobechat-kb.txt pnpm evidencias:api-ia:lobechat-kb
```

### Servidor chat-ia → api-ia

Las llamadas desde Next (`lobechatKBMiddlewareService`) envían **`X-Request-ID`** en search/embed/batch-embed y formatean errores con **`trace_id`** si viene en `detail` objeto.
