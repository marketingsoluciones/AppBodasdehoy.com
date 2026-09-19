# `@bodasdehoy/copilot-shared` — Guía para agentes IA

Componentes de chat reutilizables (sin store específico). Consumido por `appEventos` (CopilotEmbed nativo) y potencialmente otras apps que necesiten un chat IA embebido.

## Qué exporta

- `ChatItem` — mensaje individual (avatar + content + acciones). Soporta markdown, code blocks, attachments.
- `InputEditor` + `Placeholder` — editor de input con slash commands, @mentions.
- `MessageList` — lista virtualizada de mensajes (auto-scroll, lazy load).
- `copilotTheme`, `brandColors` — theme tokens compartidos.

## Estructura

- `src/ChatItem/` — `ChatItem.tsx`, `type.ts`, `style.ts`
- `src/InputEditor/` — `InputEditor.tsx`, `Placeholder.tsx`
- `src/MessageList/` — `MessageList.tsx`, `types.ts`
- `src/ChatInput/` — `CopilotChatInput.tsx`, `ChatInputProvider.tsx`, `CopilotInputContext.tsx`
- `src/theme/` — tokens
- `src/i18n/` — strings i18n

## Cómo añadir un componente

1. Crear carpeta `src/<NuevoComponente>/` con `index.ts` que re-exporta lo público.
2. Componente prop-based (NO depende de zustand del consumer — recibe data via props).
3. Re-exportar en `src/index.ts`.
4. Build: `pnpm --filter @bodasdehoy/copilot-shared build`.

## Reglas

- **Prop-based (controlled)** — NO store interno propio. El consumer (chat-ia / appEventos) provee data y handlers.
- **Peer deps obligados**: antd, @lobehub/ui, @lobehub/editor, antd-style, react-i18next, react-layout-kit, zustand, dayjs.
- **NO importar `@bodasdehoy/shared`** — copilot-shared es UI puro, sin lógica cross-app.
- **Hay 2 errores TS pre-existentes** en `src/ChatInput/InputEditor/index.tsx` (ISlashMenuOption.label, ISlashOption.icon). tsc emite igual. NO bloquean dist build pero conviene resolverlos cuando se actualice `@lobehub/editor`.

## Verificación

```bash
pnpm --filter @bodasdehoy/copilot-shared build    # dist/{ChatItem,InputEditor,MessageList,theme,i18n,...}/
# Consumer:
curl -I http://localhost:3220/momentos             # appEventos con CopilotEmbed
```
