# Inventario migración cliente AppEventos → api-mcp

> **Generado**: 2026-05-16  ·  **Fuente**: docs/INFORME-MIGRACION-API-MCP.md (106 ops cliente) + SSH api-mcp src/graphql/typeDefs/ (909 ops)
> **Reglas aplicadas**:
> - Solo dominio Eventos in-scope (Auth/Stripe/Directorio out-of-scope · informe aparte)
> - `updateActivity` → target oficial `updateActivityV2(args)` (firma apiapp-compat)
> - 6 endpoints cerrados HOY (whatsapp templates + facebook media + deleteGalerySvg) marcados `exact`

## Resumen

- Total ops cliente: **100**
- In-scope (Eventos/Invitados/Mesas/Presupuesto/etc): **87**
- Out-of-scope (Auth/Stripe/Directorio): **13** (informe aparte)

### Estados in-scope:
- `alias`: 2
- `exact`: 7
- `exact-pending-validation`: 74
- `missing`: 4
- `out-of-scope`: 13

## Tabla in-scope (dominio Eventos)

| opName | kind | domain | target | apiMcpName | status | mismatchReason | proposedFix |
|---|---|---|---|---|---|---|---|
| `updateActivity` | mutation | Actividades | api-mcp | `updateActivityV2` | alias | Schema apiapp(args:inputActivity!) === api-mcp updateActivityV2(args:inputActivity!) — wrapper compat | Cliente: renombrar `updateActivity` → `updateActivityV2` en Fetching.ts (misma estructura args) |
| `createWhatsappTemplate` | mutation | WhatsApp | api-mcp | `createWhatsappInvitationTemplate` | alias | Alias trivial cliente → api-mcp | Cliente: renombrar `createWhatsappTemplate` → `createWhatsappInvitationTemplate` en Fetching.ts |
| `updateActivityLink` | mutation | Actividades | api-mcp | `updateActivityLink` | exact |  | Sin cambio (api-mcp tiene la firma idéntica via apiapp compat) |
| `deleteGalerySvg` | mutation | Mesas / Decoración | api-mcp | `deleteGalerySvg` | exact | Deployed 2026-05-16 en api-mcp PROD (verificado smoke test con idToken real) | Sin cambio cliente — endpoint deployed con args idénticos |
| `uploadBase64MediaToFacebook` | mutation | Uploads / Media | api-mcp | `uploadBase64MediaToFacebook` | exact | Deployed 2026-05-16 en api-mcp PROD (verificado smoke test con idToken real) | Sin cambio cliente — endpoint deployed con args idénticos |
| `uploadMediaToFacebook` | mutation | Uploads / Media | api-mcp | `uploadMediaToFacebook` | exact | Deployed 2026-05-16 en api-mcp PROD (verificado smoke test con idToken real) | Sin cambio cliente — endpoint deployed con args idénticos |
| `createWhatsappInvitationTemplate` | mutation | WhatsApp | api-mcp | `createWhatsappInvitationTemplate` | exact | Deployed 2026-05-16 en api-mcp PROD (verificado smoke test con idToken real) | Sin cambio cliente — endpoint deployed con args idénticos |
| `deleteWhatsappInvitationTemplate` | mutation | WhatsApp | api-mcp | `deleteWhatsappInvitationTemplate` | exact | Deployed 2026-05-16 en api-mcp PROD (verificado smoke test con idToken real) | Sin cambio cliente — endpoint deployed con args idénticos |
| `updateWhatsappInvitationTemplate` | mutation | WhatsApp | api-mcp | `updateWhatsappInvitationTemplate` | exact | Deployed 2026-05-16 en api-mcp PROD (verificado smoke test con idToken real) | Sin cambio cliente — endpoint deployed con args idénticos |
| `addCompartition` | mutation | Compartir evento (permisos) | api-mcp | `addCompartition` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `deleteCompartition` | mutation | Compartir evento (permisos) | api-mcp | `deleteCompartition` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `updateCompartition` | mutation | Compartir evento (permisos) | api-mcp | `updateCompartition` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `createEmailTemplate` | mutation | Email Templates | api-mcp | `createEmailTemplate` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `deleteEmailTemplate` | mutation | Email Templates | api-mcp | `deleteEmailTemplate` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `getEmailTemplate` | query | Email Templates | api-mcp | `getEmailTemplate` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `getPreviewsEmailTemplates` | query | Email Templates | api-mcp | `getPreviewsEmailTemplates` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `updateEmailTemplate` | mutation | Email Templates | api-mcp | `updateEmailTemplate` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `borrarEvento` | mutation | Eventos | api-mcp | `borrarEvento` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `crearEvento` | mutation | Eventos | api-mcp | `crearEvento` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `editEvento` | mutation | Eventos | api-mcp | `editEvento` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `editEvento` | mutation | Eventos | api-mcp | `editEvento` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `queryenEvento` | query | Eventos | api-mcp | `queryenEvento` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `queryenEvento_id` | query | Eventos | api-mcp | `queryenEvento_id` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `getVariablesTemplatesInvitaciones` | query | Invitaciones | api-mcp | `getVariablesTemplatesInvitaciones` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `testInvitacion` | mutation | Invitaciones | api-mcp | `testInvitacion` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `borraInvitados` | mutation | Invitados | api-mcp | `borraInvitados` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `creaInvitado` | mutation | Invitados | api-mcp | `creaInvitado` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `editInvitado` | mutation | Invitados | api-mcp | `editInvitado` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `editTotalStimatedGuests` | mutation | Invitados | api-mcp | `editTotalStimatedGuests` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `borraMenu` | mutation | Mesas / Decoración | api-mcp | `borraMenu` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `borraMesa` | mutation | Mesas / Decoración | api-mcp | `borraMesa` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `creaMenu` | mutation | Mesas / Decoración | api-mcp | `creaMenu` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `createElement` | mutation | Mesas / Decoración | api-mcp | `createElement` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `createGalerySvgs` | mutation | Mesas / Decoración | api-mcp | `createGalerySvgs` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `createTable` | mutation | Mesas / Decoración | api-mcp | `createTable` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `deleteElement` | mutation | Mesas / Decoración | api-mcp | `deleteElement` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `deleteTable` | mutation | Mesas / Decoración | api-mcp | `deleteTable` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `editElement` | mutation | Mesas / Decoración | api-mcp | `editElement` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `editMesa` | mutation | Mesas / Decoración | api-mcp | `editMesa` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `editMesa` | mutation | Mesas / Decoración | api-mcp | `editMesa` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `editTable` | mutation | Mesas / Decoración | api-mcp | `editTable` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `getGalerySvgs` | query | Mesas / Decoración | api-mcp | `getGalerySvgs` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `createNotifications` | mutation | Notificaciones | api-mcp | `createNotifications` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `getNotifications` | query | Notificaciones | api-mcp | `getNotifications` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `updateNotifications` | mutation | Notificaciones | api-mcp | `updateNotifications` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `creaGrupo` | mutation | Otros | api-mcp | `creaGrupo` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `editVisibleColumns` | mutation | Otros | api-mcp | `editVisibleColumns` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `signOut` | mutation | Otros | api-mcp | `signOut` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `status` | mutation | Otros | api-mcp | `status` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `addWeddingPlannerIngreso` | mutation | Presupuesto / Plan Espacios | api-mcp | `addWeddingPlannerIngreso` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `borraCategoria` | mutation | Presupuesto / Plan Espacios | api-mcp | `borraCategoria` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `borraGasto` | mutation | Presupuesto / Plan Espacios | api-mcp | `borraGasto` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `borraItemsGastos` | mutation | Presupuesto / Plan Espacios | api-mcp | `borraItemsGastos` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `borraPago` | mutation | Presupuesto / Plan Espacios | api-mcp | `borraPago` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `createPsTemplate` | mutation | Presupuesto / Plan Espacios | api-mcp | `createPsTemplate` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `deleteWeddingPlannerIngreso` | mutation | Presupuesto / Plan Espacios | api-mcp | `deleteWeddingPlannerIngreso` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `duplicatePresupuesto` | mutation | Presupuesto / Plan Espacios | api-mcp | `duplicatePresupuesto` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `editCategoria` | mutation | Presupuesto / Plan Espacios | api-mcp | `editCategoria` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `editGasto` | mutation | Presupuesto / Plan Espacios | api-mcp | `editGasto` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `editItemGasto` | mutation | Presupuesto / Plan Espacios | api-mcp | `editItemGasto` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `editPago` | mutation | Presupuesto / Plan Espacios | api-mcp | `editPago` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `editPresupuesto` | mutation | Presupuesto / Plan Espacios | api-mcp | `editPresupuesto` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `getPlanSpaceSelect` | query | Presupuesto / Plan Espacios | api-mcp | `getPlanSpaceSelect` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `getPsTemplate` | query | Presupuesto / Plan Espacios | api-mcp | `getPsTemplate` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `nuevoCategoria` | mutation | Presupuesto / Plan Espacios | api-mcp | `nuevoCategoria` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `nuevoGasto` | mutation | Presupuesto / Plan Espacios | api-mcp | `nuevoGasto` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `nuevoItemGasto` | mutation | Presupuesto / Plan Espacios | api-mcp | `nuevoItemGasto` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `nuevoPago` | mutation | Presupuesto / Plan Espacios | api-mcp | `nuevoPago` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `setPlanSpaceSelect` | mutation | Presupuesto / Plan Espacios | api-mcp | `setPlanSpaceSelect` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `addTaskAttachments` | mutation | Tareas / Itinerario | api-mcp | `addTaskAttachments` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `createItinerario` | mutation | Tareas / Itinerario | api-mcp | `createItinerario` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `createTask` | mutation | Tareas / Itinerario | api-mcp | `createTask` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `deleteTaskAttachment` | mutation | Tareas / Itinerario | api-mcp | `deleteTaskAttachment` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `duplicateItinerario` | mutation | Tareas / Itinerario | api-mcp | `duplicateItinerario` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `editItinerario` | mutation | Tareas / Itinerario | api-mcp | `editItinerario` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `editTask` | mutation | Tareas / Itinerario | api-mcp | `editTask` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `singleUpload` | mutation | Uploads / Media | api-mcp | `singleUpload` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `getWhatsappInvitationTemplates` | query | WhatsApp | api-mcp | `getWhatsappInvitationTemplates` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `whatsappCreateSession` | mutation | WhatsApp | api-mcp | `whatsappCreateSession` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `whatsappDisconnectSession` | mutation | WhatsApp | api-mcp | `whatsappDisconnectSession` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `whatsappGetSession` | query | WhatsApp | api-mcp | `whatsappGetSession` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `whatsappRegenerateQR` | mutation | WhatsApp | api-mcp | `whatsappRegenerateQR` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `whatsappSendMessage` | mutation | WhatsApp | api-mcp | `whatsappSendMessage` | exact-pending-validation | Nombre coincide. Validar schema args/return 1-1 (queries con args distintos detectados: getPsTemplate, crearEvento, updateActivity) | Probar callsite real con apps/appEventos · adaptar Fetching.ts si surge GRAPHQL_VALIDATION_FAILED |
| `getEmailValid` | query | Email Templates | api-mcp-MISSING | `` | missing | No existe en api-mcp typeDefs (verificado SSH /var/www/api-production/src/graphql/typeDefs/) | Backend debe implementar en api-mcp · o decidir si deprecar callsite cliente |
| `getVariableEmailTemplate` | query | Email Templates | api-mcp-MISSING | `` | missing | No existe en api-mcp typeDefs (verificado SSH /var/www/api-production/src/graphql/typeDefs/) | Backend debe implementar en api-mcp · o decidir si deprecar callsite cliente |
| `getEventTicket` | query | Eventos | api-mcp-MISSING | `` | missing | No existe en api-mcp typeDefs (verificado SSH /var/www/api-production/src/graphql/typeDefs/) | Backend debe implementar en api-mcp · o decidir si deprecar callsite cliente |
| `getPGuestEvent` | query | Invitados | api-mcp-MISSING | `` | missing | No existe en api-mcp typeDefs (verificado SSH /var/www/api-production/src/graphql/typeDefs/) | Backend debe implementar en api-mcp · o decidir si deprecar callsite cliente |

## Out-of-scope (informe aparte — Auth / Stripe / Directorio)

| opName | kind | domain |
|---|---|---|
| `auth` | mutation | Auth / Usuario |
| `createUser` | mutation | Auth / Usuario |
| `createUserWithPassword` | mutation | Auth / Usuario |
| `getPreregister` | query | Auth / Usuario |
| `getUser` | query | Auth / Usuario |
| `getUsers` | query | Auth / Usuario |
| `updateUser` | mutation | Auth / Usuario |
| `getAllBusinesses` | query | Directorio (Business/Products) |
| `getAllProducts` | query | Directorio (Business/Products) |
| `createCheckoutSession` | mutation | Stripe / Billing |
| `getCheckoutItems` | query | Stripe / Billing |
| `setCheckoutItems` | mutation | Stripe / Billing |
| `updateCustomer` | mutation | Stripe / Billing |

## Appendix — clientGraphql exacto (cada op)

### `mutation updateActivity` [Actividades]

```graphql
mutation ($args:inputActivity){ updateActivity(args:$args) 
}
```

### `mutation updateActivityLink` [Actividades]

```graphql
mutation ($args:inputActivityLink){ updateActivityLink(args:$args) 
}
```

### `mutation addCompartition` [Compartir evento (permisos)]

```graphql
mutation($args:inputCompartition){ addCompartition(args:$args){ compartido_array detalles_compartidos_array{ email uid permissions{ title value 
} createdAt updatedAt 
} 
} 
}
```

### `mutation deleteCompartition` [Compartir evento (permisos)]

```graphql
mutation($args:inputCompartition){ deleteCompartition(args:$args) 
}
```

### `mutation updateCompartition` [Compartir evento (permisos)]

```graphql
mutation($args:inputCompartition){ updateCompartition(args:$args) 
}
```

### `mutation createEmailTemplate` [Email Templates]

```graphql
mutation($evento_id:String, $design:JSON, $configTemplate:inputCongigTemplate, $html:String){ createEmailTemplate(evento_id:$evento_id, design:$design, configTemplate:$configTemplate, html:$html){ _id createdAt updatedAt 
} 
}
```

### `mutation deleteEmailTemplate` [Email Templates]

```graphql
mutation($evento_id:String, $template_id:String){ deleteEmailTemplate(evento_id:$evento_id, template_id:$template_id) 
}
```

### `query getEmailTemplate` [Email Templates]

```graphql
query ($template_id:String){ getEmailTemplate(template_id:$template_id){ design 
} 
}
```

### `query getEmailValid` [Email Templates]

```graphql
query ($email :String){ getEmailValid(email:$email){ valid validators{ regex{ valid, reason 
} typo{ valid, reason 
} disposable{ valid, reason 
} mx{ valid, reason 
} smtp{ valid, reason 
} 
} reason 
} 
}
```

### `query getPreviewsEmailTemplates` [Email Templates]

```graphql
query ($evento_id:String){ getPreviewsEmailTemplates(evento_id:$evento_id){ _id configTemplate{ name subject 
} preview createdAt updatedAt 
} 
}
```

### `query getVariableEmailTemplate` [Email Templates]

```graphql
query ($template_id:String, $selectVariable:String){ getVariableEmailTemplate(template_id:$template_id, selectVariable:$selectVariable){ _id configTemplate{ name subject 
} preview html design createdAt updatedAt 
} 
}
```

### `mutation updateEmailTemplate` [Email Templates]

```graphql
mutation($evento_id:String, $template_id:String, $design:JSON, $configTemplate:inputCongigTemplate, $html:String){ updateEmailTemplate(evento_id:$evento_id, template_id:$template_id, design:$design, configTemplate:$configTemplate, html:$html) 
}
```

### `mutation borrarEvento` [Eventos]

```graphql
mutation ($eventoID : String!) { borrarEvento(evento_id:$eventoID){ modificado 
} 
}
```

### `mutation crearEvento` [Eventos]

```graphql
mutation ( $nombre: String, $tipo: String!, $fecha: String, $pais: String, $poblacion: String, $usuario_id: String! $usuario_nombre: String! $timeZone: String, $development: String! ){ crearEvento( nombre: $nombre, tipo: $tipo, fecha: $fecha, pais: $pais, poblacion: $poblacion, usuario_id: $usuario_id, usuario_nombre: $usuario_nombre, timeZone: $timeZone, development: $development ){ _id grupos_array compartido_array detalles_compartidos_array{ email uid
```

### `mutation editEvento` [Eventos]

```graphql
mutation($evento_id: String!, $variable_reemplazar: String, $valor_reemplazar: String){ editEvento( evento_id:$evento_id variable_reemplazar:$variable_reemplazar valor_reemplazar:$valor_reemplazar ){ _id listaRegalos 
} 
}
```

### `mutation editEvento` [Eventos]

```graphql
mutation ($idEvento: String!, $variable:String, $value : String){ editEvento( evento_id: $idEvento, variable_reemplazar: $variable, valor_reemplazar: $value ){ _id 
} 
}
```

### `query getEventTicket` [Eventos]

```graphql
query ( $args:inputEventTicket, $sort:sortCriteriaEventTicket, $skip:Int, $limit:Int ) { getEventTicket(args:$args, sort:$sort, skip:$skip, limit:$limit ){ total results{ _id title createdAt updatedAt 
} 
} 
}
```

### `query queryenEvento` [Eventos]

```graphql
query ($variable: String, $valor: String, $development: String!) { queryenEvento( variable:$variable, valor:$valor, development:$development){ _id development grupos_array compartido_array detalles_compartidos_array{ email uid planSpaceSelect permissions{ title value 
} createdAt updatedAt 
} estatus color temporada estilo tematica tarta nombre fecha_actualizacion fecha_creacion tipo usuario_id usuario_nombre
```

### `query queryenEvento_id` [Eventos]

```graphql
query($_id: String){ queryenEvento_id( var_1:$_id ){ _id nombre listaRegalos 
} 
}
```

### `query getVariablesTemplatesInvitaciones` [Invitaciones]

```graphql
query($evento_id:ID){ getVariablesTemplatesInvitaciones(evento_id:$evento_id) 
}
```

### `mutation testInvitacion` [Invitaciones]

```graphql
mutation ($evento_id: String, $email: String, $phoneNumber: String, $lang: String){ testInvitacion(evento_id:$evento_id, email:$email, phoneNumber:$phoneNumber, lang:$lang) 
}
```

### `mutation borraInvitados` [Invitados]

```graphql
mutation ($eventID:String, $guests: [String]){ borraInvitados(evento_id:$eventID, invitados_ids_array:$guests){ invitados_array{ _id nombre sexo grupo_edad correo telefono nombre_mesa puesto asistencia rol father passesQuantity 
} 
} 
}
```

### `mutation creaInvitado` [Invitados]

```graphql
mutation ($eventID: String, $invitados_array: [invitAinput]) { creaInvitado(evento_id: $eventID, invitados_array: $invitados_array){ invitados_array{ father _id nombre grupo_edad correo telefono father passesQuantity nombre_mesa nombre_menu puesto asistencia rol correo sexo invitacion fecha_invitacion 
} 
} 
}
```

### `mutation editInvitado` [Invitados]

```graphql
mutation ($eventID:String, $guestID:String, $variable: String, $value:String) { editInvitado( evento_id:$eventID, invitado_id:$guestID, variable_reemplazar:$variable, valor_reemplazar:$value){ _id nombre grupo_edad correo telefono nombre_mesa nombre_menu puesto asistencia rol correo sexo invitacion fecha_invitacion movil poblacion pais direccion passesQuantity 
} 
}
```

### `mutation editTotalStimatedGuests` [Invitados]

```graphql
mutation ($evento_id:String, $children:Int, $adults:Int){ editTotalStimatedGuests(evento_id:$evento_id, children:$children, adults:$adults ){ presupuesto_total viewEstimates coste_estimado coste_final pagado currency visibleColumns { accessor show 
} totalStimatedGuests { children adults 
} categorias_array{ _id coste_proporcion coste_estimado coste_final pagado nombre gastos_array{ _id coste_proporcion coste_estimado coste_final pagado
```

### `query getPGuestEvent` [Invitados]

```graphql
query($p:String){ getPGuestEvent(p:$p){ _id invitados_array{ _id sexo nombre estatus correo telefono asistencia alergenos passesQuantity father nombre_menu grupo_edad 
} menus_array{ nombre_menu tipo 
} 
} 
}
```

### `mutation borraMenu` [Mesas / Decoración]

```graphql
mutation ($eventID: String, $name: String) { borraMenu(evento_id:$eventID, nombre_menu: $name){ menus_array{ nombre_menu tipo 
} 
} 
}
```

### `mutation borraMesa` [Mesas / Decoración]

```graphql
mutation ($eventID:String, $tableID: String) { borraMesa(evento_id:$eventID,mesa_id:$tableID) { mesas_array{ _id nombre_mesa tipo cantidad_sillas posicion { x y 
} 
} 
} 
}
```

### `mutation creaMenu` [Mesas / Decoración]

```graphql
mutation ($eventID: String, $name: String) { creaMenu(evento_id:$eventID, nombre_menu: $name){ menus_array{ nombre_menu tipo 
} 
} 
}
```

### `mutation createElement` [Mesas / Decoración]

```graphql
mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $values: String) { createElement(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, values:$values) { _id title rotation position{ x y 
} size{ width height 
} tipo 
} 
}
```

### `mutation createGalerySvgs` [Mesas / Decoración]

```graphql
mutation ($evento_id: ID, $galerySvgs:[inputGalerySvg]) { createGalerySvgs(evento_id: $evento_id, galerySvgs: $galerySvgs) { total results{ _id title icon tipo 
} 
} 
}
```

### `mutation createTable` [Mesas / Decoración]

```graphql
mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $values: String) { createTable(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, values:$values) { _id title rotation position{ x y 
} size{ width height 
} tipo numberChair guests{ _id chair order 
} 
} 
}
```

### `mutation deleteElement` [Mesas / Decoración]

```graphql
mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $elementID: ID) { deleteElement(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, elementID:$elementID) 
}
```

### `mutation deleteGalerySvg` [Mesas / Decoración]

```graphql
mutation ($evento_id: ID, $icon_id: ID) { deleteGalerySvg(evento_id: $evento_id, icon_id: $icon_id) 
}
```

### `mutation deleteTable` [Mesas / Decoración]

```graphql
mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $tableID: ID) { deleteTable(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, tableID:$tableID) 
}
```

### `mutation editElement` [Mesas / Decoración]

```graphql
mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $elementID: ID, $variable: String, $valor: String) { editElement(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, elementID:$elementID, variable:$variable, valor:$valor) { _id title rotation position{ x y 
} size{ width height 
} tipo 
} 
}
```

### `mutation editMesa` [Mesas / Decoración]

```graphql
mutation ($eventID:String, $tableID: String, $variable: String, $coordenadas: [posicionAinput]) { editMesa(evento_id:$eventID,mesa_id:$tableID, variable_reemplazar:$variable, coordenadas:$coordenadas) { _id nombre_mesa posicion { x y 
} cantidad_sillas 
} 
}
```

### `mutation editMesa` [Mesas / Decoración]

```graphql
mutation ($eventID:String, $tableID: String, $variable: String, $valor_reemplazar: String) { editMesa(evento_id:$eventID,mesa_id:$tableID, variable_reemplazar:$variable, valor_reemplazar:$valor_reemplazar) { _id nombre_mesa posicion { x y 
} cantidad_sillas tipo 
} 
}
```

### `mutation editTable` [Mesas / Decoración]

```graphql
mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $tableID: ID, $variable: String, $valor: String) { editTable(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, tableID:$tableID, variable:$variable, valor:$valor) { _id title rotation position{ x y 
} size{ width height 
} tipo numberChair guests{ _id chair order 
} 
} 
}
```

### `query getGalerySvgs` [Mesas / Decoración]

```graphql
query ($evento_id: ID, $tipo: String) { getGalerySvgs(evento_id: $evento_id, tipo: $tipo) { total results{ _id title icon tipo 
} 
} 
}
```

### `mutation createNotifications` [Notificaciones]

```graphql
mutation ($args:inputNotifications){ createNotifications(args:$args){ total results{ _id 
} 
} 
}
```

### `query getNotifications` [Notificaciones]

```graphql
query ($args:inputNotification, $sort:sortCriteriaNotification, $skip:Int, $limit:Int){ getNotifications(args:$args, sort:$sort, skip:$skip, limit:$limit){ total results{ _id uid message state type fromUid focused createdAt updatedAt 
} 
} 
}
```

### `mutation updateNotifications` [Notificaciones]

```graphql
mutation ($args:inputNotification){ updateNotifications(args:$args) 
}
```

### `mutation creaGrupo` [Otros]

```graphql
mutation ($eventID: String, $name: String) { creaGrupo(evento_id:$eventID, nombre_grupo: $name){ grupos_array 
} 
}
```

### `mutation editVisibleColumns` [Otros]

```graphql
mutation ($evento_id:String, $visibleColumns:[inputVisibleColumn]){ editVisibleColumns(evento_id:$evento_id, visibleColumns:$visibleColumns ){ presupuesto_total viewEstimates coste_estimado coste_final pagado currency visibleColumns { accessor show 
} totalStimatedGuests { children adults 
} categorias_array{ _id coste_proporcion coste_estimado coste_final pagado nombre gastos_array{ _id coste_proporcion coste_
```

### `mutation signOut` [Otros]

```graphql
mutation ($sessionCookie :String){ signOut(sessionCookie:$sessionCookie) 
}
```

### `mutation status` [Otros]

```graphql
mutation ($sessionCookie : String){ status(sessionCookie: $sessionCookie){ customToken 
} 
}
```

### `mutation addWeddingPlannerIngreso` [Presupuesto / Plan Espacios]

```graphql
mutation($evento_id:String, $weddingPlannerIngreso:WeddingPlannerIngresoInput ){ addWeddingPlannerIngreso(evento_id:$evento_id, weddingPlannerIngreso:$weddingPlannerIngreso){ _id fecha monto metodo referencia createdAt updatedAt 
} 
}
```

### `mutation borraCategoria` [Presupuesto / Plan Espacios]

```graphql
mutation( $evento_id:String $categoria_id:String){ borraCategoria(evento_id:$evento_id, categoria_id: $categoria_id){ coste_final 
} 
}
```

### `mutation borraGasto` [Presupuesto / Plan Espacios]

```graphql
mutation($evento_id: String, $categoria_id: String, $gasto_id: String){ borraGasto(evento_id:$evento_id, categoria_id:$categoria_id,gasto_id:$gasto_id){ coste_final coste_estimado pagado categorias_array { coste_estimado coste_final pagado 
} 
} 
}
```

### `mutation borraItemsGastos` [Presupuesto / Plan Espacios]

```graphql
mutation($evento_id: ID, $categoria_id: ID, $gasto_id: ID, $itemsGastos_ids: [ID]){ borraItemsGastos(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id, itemsGastos_ids:$itemsGastos_ids){ presupuesto_total viewEstimates coste_estimado coste_final pagado currency visibleColumns { accessor show 
} totalStimatedGuests{ children adults 
} categorias_array{ _id coste_proporcion coste_estimado coste_final pagado nombre gastos_a
```

### `mutation borraPago` [Presupuesto / Plan Espacios]

```graphql
mutation($evento_id:String, $categoria_id:String, $gasto_id:String, $pago_id:String){ borraPago(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id, pago_id:$pago_id){ pagado categorias_array{ pagado gastos_array{ pagado 
} 
} 
} 
}
```

### `mutation createPsTemplate` [Presupuesto / Plan Espacios]

```graphql
mutation ($eventID:ID, $planSpaceID:ID, $title:String, $uid:String ) { createPsTemplate(eventID:$eventID, planSpaceID:$planSpaceID, title:$title, uid:$uid) { _id title 
} 
}
```

### `mutation deleteWeddingPlannerIngreso` [Presupuesto / Plan Espacios]

```graphql
mutation($evento_id:String, $weddingPlannerIngreso_id:ID){ deleteWeddingPlannerIngreso(evento_id:$evento_id, weddingPlannerIngreso_id:$weddingPlannerIngreso_id) 
}
```

### `mutation duplicatePresupuesto` [Presupuesto / Plan Espacios]

```graphql
mutation ($eventID:String, $eventDestinationID:String){ duplicatePresupuesto(eventID:$eventID, eventDestinationID:$eventDestinationID ){ presupuesto_total viewEstimates coste_estimado coste_final pagado currency visibleColumns { accessor show 
} totalStimatedGuests{ children adults 
} categorias_array{ _id coste_proporcion coste_estimado coste_final pagado nombre gastos_array{ _id coste_proporcion coste_estimado coste_final pagado nomb
```

### `mutation editCategoria` [Presupuesto / Plan Espacios]

```graphql
mutation( $evento_id:String $categoria_id:String $nombre:String){ editCategoria(evento_id:$evento_id, categoria_id: $categoria_id, nombre: $nombre){ coste_estimado coste_final pagado currency 
} 
}
```

### `mutation editGasto` [Presupuesto / Plan Espacios]

```graphql
mutation($evento_id: ID, $categoria_id: ID, $gasto_id: ID, $variable_reemplazar: String, $valor_reemplazar: StringIntBool){ editGasto(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id, variable_reemplazar:$variable_reemplazar, valor_reemplazar:$valor_reemplazar){ presupuesto_total viewEstimates coste_estimado coste_final pagado currency visibleColumns { accessor show 
} totalStimated
```

### `mutation editItemGasto` [Presupuesto / Plan Espacios]

```graphql
mutation($evento_id: ID ,$categoria_id: ID, $gasto_id: ID, $itemGasto_id: ID, $variable: String, $valor: StringIntBool){ editItemGasto(evento_id:$evento_id, categoria_id: $categoria_id, gasto_id: $gasto_id, itemGasto_id: $itemGasto_id, variable: $variable, valor: $valor){ presupuesto_total viewEstimates coste_estimado coste_final pagado currency visibleColumns { accessor show 
} totalStimatedGuests{ children adults 
} categorias_array{ _id coste_proporcion coste_estimado
```

### `mutation editPago` [Presupuesto / Plan Espacios]

```graphql
mutation($evento_id:String, $categoria_id:String, $gasto_id: String, $pago_id:String,$pagos_array:pagos_arrayAinput){ editPago(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id,pago_id:$pago_id, pagos_array:$pagos_array){ categorias_array{ pagado gastos_array{ pagado pagos_array{ _id estado fecha_creacion fecha_pago fe
```

### `mutation editPresupuesto` [Presupuesto / Plan Espacios]

```graphql
mutation($evento_id:String, $coste_estimado:Float, $viewEstimates:Boolean, $presupuesto_total:Float ){ editPresupuesto( evento_id:$evento_id, coste_estimado:$coste_estimado, viewEstimates:$viewEstimates, presupuesto_total:$presupuesto_total){ presupuesto_total viewEstimates coste_final coste_estimado pagado currency visibleColumns { accessor show 
} totalStimatedGuests{ children adults 
} categorias_array { _id coste_proporcion coste_estimado coste_final
```

### `query getPlanSpaceSelect` [Presupuesto / Plan Espacios]

```graphql
query ($evento_id: ID, $isOwner: Boolean) { getPlanSpaceSelect(evento_id: $evento_id, isOwner: $isOwner) 
}
```

### `query getPsTemplate` [Presupuesto / Plan Espacios]

```graphql
query ($uid: String, $evento_id: ID!, $development: String!) { getPsTemplate(uid: $uid, evento_id: $evento_id, development: $development) { _id title 
} 
}
```

### `mutation nuevoCategoria` [Presupuesto / Plan Espacios]

```graphql
mutation ($evento_id: String, $nombre: String){ nuevoCategoria(evento_id:$evento_id, nombre:$nombre){ _id coste_proporcion coste_estimado coste_final pagado nombre gastos_array { _id coste_estimado coste_final pagado nombre pagos_array { _id estado fecha_creacion fecha_pago fecha_vencimiento medio_pago importe 
} items_array{ _id next_id unidad cantidad nombre
```

### `mutation nuevoGasto` [Presupuesto / Plan Espacios]

```graphql
mutation($evento_id: String ,$categoria_id: String, $nombre: String){ nuevoGasto(evento_id:$evento_id, categoria_id:$categoria_id,nombre:$nombre){ _id coste_proporcion coste_estimado coste_final pagado nombre linkTask estatus pagos_array{ _id estado fecha_creacion fecha_pago fecha_vencimiento medio_pago importe
```

### `mutation nuevoItemGasto` [Presupuesto / Plan Espacios]

```graphql
mutation($evento_id: ID, $categoria_id: ID, $gasto_id: ID, $itemGasto:itemGastoInput){ nuevoItemGasto(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id, itemGasto:$itemGasto){ _id next_id unidad cantidad nombre valor_unitario total estatus fecha_creacion 
} 
}
```

### `mutation nuevoPago` [Presupuesto / Plan Espacios]

```graphql
mutation($evento_id:String, $categoria_id:String, $gasto_id: String,$pagos_array:[pagos_arrayAinput]){ nuevoPago(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id, pagos_array:$pagos_array){ pagado categorias_array{ pagado gastos_array{ _id coste_proporcion coste_estimado coste_final pagado nombre linkTask
```

### `mutation setPlanSpaceSelect` [Presupuesto / Plan Espacios]

```graphql
mutation ($evento_id: ID, $planSpaceSelect: ID, $isOwner: Boolean) { setPlanSpaceSelect(evento_id: $evento_id, planSpaceSelect: $planSpaceSelect, isOwner: $isOwner) 
}
```

### `mutation addTaskAttachments` [Tareas / Itinerario]

```graphql
mutation ($eventID: String, $itinerarioID: String, $taskID: String, $attachment: inputFileData) { addTaskAttachments(eventID: $eventID, itinerarioID: $itinerarioID, taskID: $taskID, attachment: $attachment) 
}
```

### `mutation createItinerario` [Tareas / Itinerario]

```graphql
mutation ($eventID:String, $title:String, $dateTime:String, $tipo:String, $next_id:ID){ createItinerario(eventID:$eventID, title:$title, dateTime:$dateTime, tipo:$tipo, next_id:$next_id ){ _id next_id title tasks{ _id fecha hora horaActiva icon descripcion responsable duracion tags tips estatus attachments{ _id name url size createdAt updatedAt 
} spectatorView comments{ _id
```

### `mutation createTask` [Tareas / Itinerario]

```graphql
mutation ($eventID:String, $itinerarioID:String, $fecha:String, $descripcion:String, $hora:String, $duracion:Int){ createTask(eventID:$eventID, itinerarioID:$itinerarioID, fecha:$fecha, descripcion:$descripcion, hora:$hora, duracion:$duracion ){ _id fecha hora horaActiva icon descripcion responsable duracion tags tips estatus attachments{ _id name url size createdAt updatedAt 
} spectatorView comments{ _id comment uid creat
```

### `mutation deleteTaskAttachment` [Tareas / Itinerario]

```graphql
mutation ($eventID: String, $itinerarioID: String, $taskID: String, $attachmentID: String) { deleteTaskAttachment(eventID: $eventID, itinerarioID: $itinerarioID, taskID: $taskID, attachmentID: $attachmentID) 
}
```

### `mutation duplicateItinerario` [Tareas / Itinerario]

```graphql
mutation ($eventID:String, $itinerarioID:String, $eventDestinationID:String, $next_id:ID, $storageBucket:String){ duplicateItinerario(eventID:$eventID, itinerarioID:$itinerarioID, eventDestinationID:$eventDestinationID, next_id:$next_id, storageBucket:$storageBucket){ _id next_id title tasks{ _id fecha hora horaActiva icon descripcion responsable duracion tags tips estatus attachments{ _id name url size createdAt
```

### `mutation editItinerario` [Tareas / Itinerario]

```graphql
mutation ($eventID:String, $itinerarioID:String, $variable:String, $valor:String, $next_id:ID){ editItinerario(eventID:$eventID itinerarioID:$itinerarioID, variable:$variable, valor:$valor, next_id:$next_id ) 
}
```

### `mutation editTask` [Tareas / Itinerario]

```graphql
mutation ($eventID:String, $itinerarioID:String, $taskID:String, $variable:String, $valor:String){ editTask(eventID:$eventID itinerarioID:$itinerarioID taskID:$taskID variable:$variable valor:$valor ) 
}
```

### `mutation singleUpload` [Uploads / Media]

```graphql
mutation($file:Upload!,$use:String) { singleUpload(file:$file,use:$use){ _id i640 
} 
}
```

### `mutation uploadBase64MediaToFacebook` [Uploads / Media]

```graphql
mutation($base64Image: String!, $fileName: String!, $development: String){ uploadBase64MediaToFacebook(base64Image: $base64Image, fileName: $fileName, development: $development){ success handle message error 
} 
}
```

### `mutation uploadMediaToFacebook` [Uploads / Media]

```graphql
mutation($fileName: String!, $fileBuffer: String!, $fileType: String!, $development: String){ uploadMediaToFacebook(fileName: $fileName, fileBuffer: $fileBuffer, fileType: $fileType, development: $development){ success handle message error 
} 
}
```

### `mutation createWhatsappInvitationTemplate` [WhatsApp]

```graphql
mutation($evento_id:ID, $data: JSON){ createWhatsappInvitationTemplate(evento_id:$evento_id, data:$data) 
}
```

### `mutation createWhatsappTemplate` [WhatsApp]

```graphql
mutation( $data:JSON, $development:String!){ createWhatsappTemplate(data:$data, development:$development){ _id title content createdAt 
} 
}
```

### `mutation deleteWhatsappInvitationTemplate` [WhatsApp]

```graphql
mutation($evento_id:ID, $template_id: ID){ deleteWhatsappInvitationTemplate(evento_id:$evento_id, template_id:$template_id) 
}
```

### `query getWhatsappInvitationTemplates` [WhatsApp]

```graphql
query($evento_id:ID){ getWhatsappInvitationTemplates(evento_id:$evento_id) 
}
```

### `mutation updateWhatsappInvitationTemplate` [WhatsApp]

```graphql
mutation($evento_id:ID, $template_id: ID, $data: JSON){ updateWhatsappInvitationTemplate(evento_id:$evento_id, template_id:$template_id, data:$data){ _id 
} 
}
```

### `mutation whatsappCreateSession` [WhatsApp]

```graphql
mutation ($args: CreateWhatsAppSessionArgs!) { whatsappCreateSession(args: $args) { success session { id development userId isConnected qrCode phoneNumber connectionTime lastActivity 
} qrCode error 
} 
}
```

### `mutation whatsappDisconnectSession` [WhatsApp]

```graphql
mutation ($args: DisconnectWhatsAppSessionArgs!) { whatsappDisconnectSession(args: $args) { success error 
} 
}
```

### `query whatsappGetSession` [WhatsApp]

```graphql
query ($args: GetWhatsAppSessionArgs!) { whatsappGetSession(args: $args) { id development userId isConnected qrCode phoneNumber connectionTime lastActivity 
} 
}
```

### `mutation whatsappRegenerateQR` [WhatsApp]

```graphql
mutation ($sessionId: String!) { whatsappRegenerateQR(sessionId: $sessionId) { success session { id development userId isConnected qrCode phoneNumber connectionTime lastActivity 
} qrCode error 
} 
}
```

### `mutation whatsappSendMessage` [WhatsApp]

```graphql
mutation ($args: SendWhatsAppMessageArgs!) { whatsappSendMessage(args: $args) { success messageId error 
} 
}
```
