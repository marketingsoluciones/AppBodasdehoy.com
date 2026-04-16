# Editor Web

Web independiente solo del **Creador de webs** (bodas y eventos). Por ahora redirige al editor completo en chat-ia.

## Uso

- **Desarrollo:** `pnpm dev` (puerto 3081).
- **Producción:** `pnpm build && pnpm start`.

## Configuración

- `NEXT_PUBLIC_CHAT`: URL base de chat-ia (por defecto `https://chat.bodasdehoy.com`). Se usa para el enlace al wedding-creator.

## Rutas

- **/** — Landing con enlace a chat-ia y enlace a vista previa de ejemplo.
- **/preview** — Vista previa de una web de boda con datos mock (usa `WeddingSiteRenderer` del paquete, sin backend).

## Próximo paso

Para edición completa se usa chat-ia. Opcionalmente se puede añadir un editor propio que use `useWeddingWeb` del paquete y tu API.

## Nota técnica

El build usa `typescript.ignoreBuildErrors: true` en `next.config.js` porque el paquete `@bodasdehoy/wedding-creator` se type-checka en el contexto de chat-ia (React/antd). El código se compila correctamente; para validación de tipos completa del paquete, ejecutar `pnpm --filter @bodasdehoy/chat-ia build` desde la raíz.

## Deploy

Despliega en Vercel; dominio ejemplo: `creador.bodasdehoy.com`.
