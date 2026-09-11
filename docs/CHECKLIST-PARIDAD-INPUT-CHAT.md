# Checklist CRÍTICO de paridad — input del chat (NO perder funcionalidad)

> ⚠️ Alerta del usuario (2026-06-03): al desacoplar/reestructurar chat-ia, NO PERDER NADA del
> campo de input del chat: escribir, arrastrar documentos, multiselector de agentes, etc.
> TODO esto es CRÍTICO. Este doc es el checklist de verificación obligatoria tras cada cambio
> que toque services (message/session/file) o el ChatInput.

## Capacidades del input (src/features/ChatInput/ActionBar/) — TODAS deben seguir funcionando

| Capacidad | Carpeta | Depende de | Riesgo en desacople |
|---|---|---|---|
| **Subir/arrastrar documentos** | `Upload/` (ClientMode+ServerMode) | `uploadService` (@/services/upload), `@bodasdehoy/shared/upload` (validate/compress/heic) | 🔴 ALTO — toca file service (de los 126 acoplados) |
| **Drag & drop área** | `Desktop/FilePreview/`, `FileList`, `Mobile/FilePreview` | file store, uploadService | 🔴 ALTO |
| **Multiselector de agentes (@mention)** | `Mention/` | `useMentionStore` + `useSessionStore` (sessions) | 🔴 ALTO — toca sessionService |
| Escribir texto / editor | `InputEditor` (en copilot-shared) | copilot-shared (ya modular) | 🟢 bajo (ya independiente) |
| Selector de modelo | `Model/` | agentStore | 🟡 |
| Parámetros | `Params/` | agentStore | 🟡 |
| Herramientas (builtin tools) | `Tools/` | flag `plugins` + builtinTool store | 🔴 NO tocar flag plugins (gatea tools propias) |
| Búsqueda web | `Search/` | tool store | 🟡 |
| Voz a texto (STT) | `STT/` | api-ia | 🟢 |
| Historial / SaveTopic / Clear | `History/ SaveTopic/ Clear/` | message+topic service | 🔴 ALTO — topic/message service |
| Token counter / Typo | `Token/ Typo/` | local | 🟢 |

## Verificación OBLIGATORIA tras CUALQUIER cambio en services o ChatInput

Antes de dar por bueno un desacople (message/session/file/topic → api-mcp), confirmar EN VIVO:

1. [ ] **Escribir un mensaje** y enviarlo → aparece y persiste.
2. [ ] **Arrastrar un documento** al input → se sube, se previsualiza (FilePreview), se adjunta.
3. [ ] **Subir archivo con el botón Upload** → mismo resultado.
4. [ ] **@mención de agente** (multiselector) → lista agentes, se selecciona, funciona en grupo.
5. [ ] **Adjuntar imagen** → preview + envío.
6. [ ] **Botón de Tools** (builtin: filter-app-view, venue-visualizer) → abre y ejecuta.
7. [ ] **Historial de conversaciones** → carga las anteriores (getMessages/getSessions).
8. [ ] **Guardar topic / limpiar** → funciona.
9. [ ] **Cambiar modelo/params** → se aplica.

→ Si CUALQUIERA falla tras un desacople, REVERTIR y arreglar antes de seguir. Cero pérdida.

## Dependencias que el desacople DEBE preservar (mapa)

- `uploadService` (@/services/upload) → al migrar file service a api-mcp, mantener validate/
  compress/heic de @bodasdehoy/shared/upload y el drag&drop.
- `sessionService` → al migrar, Mention (agentes) y currentSession deben seguir resolviendo.
- `messageService`/`topicService` → al migrar, History y persistencia de conversaciones intactas.
- Flag `plugins` → NUNCA desactivar (gatea el botón Tools = builtin tools propias).
- `copilot-shared` (InputEditor) → ya modular, es la base; NO romper su contrato.

## Nota para el recableo (apiServer.ts)
El esqueleto message/apiServer.ts (y los futuros session/topic/file apiServer) DEBEN cubrir
todos los métodos que estas capacidades usan. Si un método queda como 🔴 BACKEND-PENDIENTE,
NO activar ese service (rompería la capacidad). El switch a apiServer solo cuando paridad 100%.
