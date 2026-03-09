# X-Development vs X-Support-Key: por qué y cuándo usar cada uno

## Resumen

- **X-Development**: identifica *qué* tenant/whitelabel (ej. `bodasdehoy`). Dice "soy el desarrollo bodasdehoy".
- **X-Support-Key** (o `SupportKey`): credencial para autenticarse con **API2** y obtener la config de ese whitelabel (getWhiteLabelConfig, etc.). Sin una support key válida, API2 responde "Usuario no autenticado o supportKey inválido".

Son cosas distintas: uno es el *nombre* del desarrollo, el otro es la *clave* para que API2 (o quien consulte API2) pueda obtener la configuración de ese desarrollo.

## Dónde se usa cada uno

| Sistema | X-Development | X-Support-Key / supportKey |
|--------|----------------|----------------------------|
| **API2 GraphQL** | Identifica tenant en algunas queries. | **Requerido** para getWhiteLabelConfig(development, supportKey). Sin supportKey válido → error. |
| **api-ia (chat)** | Nos pidieron explícitamente "X-Development: bodasdehoy" para resolver credenciales. | No nos dijeron que enviemos X-Support-Key al chat; si api-ia llama a API2 por su cuenta, ellos tendrían que tener la support key en su lado. |
| **api-ia (costStatsConsolidated)** | Lo mencionan. | Lo mencionan: "que la query costStatsConsolidated acepte nuestros headers (**X-Support-Key** + X-Development)". |

## ¿Por qué no nos sirve solo X-Support-Key para el chat?

Para **chat** no sustituye a X-Development: api-ia tiene que saber *qué* desarrollo (bodasdehoy, eventosorganizador, etc.) para elegir la API key correcta. La support key es el secreto para pedir esa config a API2; el nombre del desarrollo es el selector.

## Hipótesis: ¿deberíamos enviar también X-Support-Key a api-ia para chat?

Si api-ia, al recibir una petición de chat, llama a API2 (getWhiteLabelConfig) para obtener la API key del proveedor y **no** tiene guardada la support key de bodasdehoy, no podría obtener la config → 503 "API key no válida". En ese caso, si nosotros enviáramos **X-Support-Key** en la petición a api-ia, ellos podrían reenviarla a API2 y sí obtener la key.

**Acción:** Probar enviar a api-ia en POST /webapi/chat/auto los dos headers:
- `X-Development: bodasdehoy`
- `X-Support-Key: SK-bodasdehoy-a71f5b3c` (el valor está en `apps/copilot/src/const/supportKeys.ts` y en `apps/web/pages/api/copilot/chat.ts`)

Si con ambos deja de dar 503, entonces api-ia esperaba la support key y no la tenía en backend. Si sigue 503, el fallo está en las credenciales whitelabel en API2 (key de Anthropic/OpenAI mal configurada), no en los headers.

## Dónde está la support key de bodasdehoy en el repo

- Copilot: `apps/copilot/src/const/supportKeys.ts` → `SUPPORT_KEYS['bodasdehoy']` = `'SK-bodasdehoy-a71f5b3c'`
- Web (fallback getWhiteLabelConfig): `apps/web/pages/api/copilot/chat.ts` → mismo objeto `SUPPORT_KEYS`

Para scripts: usar variable de entorno `SUPPORT_KEY` o leer del mismo valor (no hardcodear en docs públicos por seguridad; en código sí está).
