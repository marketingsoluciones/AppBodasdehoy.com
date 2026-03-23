# api-ia: modelo más razonador

**Objetivo:** La api-ia que enruta las peticiones del Copilot debe tener o escoger un **modelo lo más razonador posible**, para que las respuestas (filtros, interpretación de preguntas, herramientas) sean más inteligentes y no dependan solo de reglas fijas.

## Contrato

- El proxy de la app (App Bodas) envía a api-ia:
  - **Header** `X-Prefer-Reasoning-Model: true`
  - **Body** `prefer_reasoning_model: true` en el JSON del chat
  (por defecto activos; se desactivan con `COPILOT_PREFER_REASONING_MODEL=false`).
- **api-ia** debe:
  - Si recibe el header o el campo en body, al enrutar (provider `auto` o elección de modelo) **priorizar o escoger un modelo con buen razonamiento** (p. ej. Claude 3.5 Sonnet, GPT-4o, o el mejor disponible en OpenRouter para reasoning).
  - Si no recibe ninguno de los dos, usar la lógica actual de auto-routing sin esta preferencia.

## Dónde se envía

- **apps/appEventos/pages/api/copilot/chat.ts**: en `proxyToPythonBackend` se añade el header `X-Prefer-Reasoning-Model: true` y el campo `prefer_reasoning_model: true` en el payload cuando `PREFER_REASONING_MODEL` es true (variable `COPILOT_PREFER_REASONING_MODEL`).

## Próximos pasos (backend api-ia)

1. En el handler de `POST /webapi/chat/{provider}` (o equivalente), leer `X-Prefer-Reasoning-Model === 'true'` o `body.prefer_reasoning_model === true`.
2. Cuando sea true y `provider === 'auto'` (o no se especifique modelo), elegir en la lógica de enrutado un modelo con buen razonamiento (p. ej. en OpenRouter un modelo tipo Claude 3.5 Sonnet, GPT-4o, o el que tengan configurado como "reasoning").
3. Opcional: exponer en respuesta o logs el modelo usado para facilitar debugging.

## Referencias

- Headers que llegan a api-ia: **docs/SISTEMAS-HEADERS-APP-BODAS-Y-COPILOT.md**
- Backend api-ia: auto-routing y elección de modelo (implementación en el repo del backend Python).
