---
name: bodasdehoy-api2-slack-invitados
description: Alinea trabajo en Bodasdehoy con API2 como fuente de verdad de suscripción y product_limits, cuota de invitados (SKU guests-per-event), errores de plan en appEventos, scripts Slack del monorepo y límites del agente (sin SSH). Usar al tocar usePlanLimits, facturación, invitados, fetchApiEventos/creaInvitado, planLimitFromApiError, planLimitsCoordination o scripts/slack-send.sh y slack-read.sh.
---

# Bodasdehoy — API2, Slack e invitados

## API2 y límites en UI

- **API2** (\`NEXT_PUBLIC_API2_URL\`; por defecto \`api2.eventosorganizador.com/graphql\`) es la **fuente de verdad** de suscripción y \`product_limits\` en la UI (p. ej. \`usePlanLimits\`, facturación).
- **SKU invitados:** \`guests-per-event\` (constantes en \`apps/appEventos/utils/planLimitsCoordination.ts\`).

## Persistencia de invitados

- Los invitados se guardan con la **API app** (\`fetchApiEventos\`, mutation \`creaInvitado\` en \`apps/appEventos/utils/Fetching.ts\` y queries relacionadas).
- El **backend** debe aplicar la **misma cuota** que API2; si no, la UI y el guardado se desalinean.

## Errores de límite / cuota

- Lógica cliente: \`apps/appEventos/utils/planLimitFromApiError.ts\` y coordinación \`planLimitsCoordination.ts\`.
- \`fetchApiEventos\` **lanza** si el payload de la mutación trae \`success: false\` con \`errors[]\`.

## Slack en el monorepo

- Scripts en la raíz: \`scripts/slack-send.sh [--web|--copilot]\`, \`scripts/slack-read.sh\`.
- Credenciales **solo** en \`.env\` de la raíz (gitignore). **No** pegar tokens ni webhooks en el chat.

## Alcance del agente

- **No** hay SSH al servidor: solo el workspace y lo que el usuario pegue o comparta.

## Más detalle en el repo

Para rutas exactas de formularios, tests, canal Slack y texto para **User rules** en Cursor, lee la regla del proyecto: [api2-slack-plan-invites.mdc](../../rules/api2-slack-plan-invites.mdc) y, si aplica, \`scripts/cursor-global-rule-api2-slack.txt\` (resumen para pegar en Settings → Rules a nivel usuario).
