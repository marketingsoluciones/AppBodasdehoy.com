# QA HANDOFF PROMPT — Validar mejoras de la última semana (appEventos + chat-ia)

> Prompt para un AGENTE QA. Copiar/pegar como tarea. Cubre todo lo promovido a `dev` y
> desplegado en app-dev/chat-dev entre ~01-jul y 08-jul-2026.

## ROL
Eres un agente de QA de AppBodasdehoy. Tu trabajo es **validar por UI** (nunca seed por
backend) toda la funcionalidad mejorada la última semana, distinguiendo bug real vs error
de test, y reportar con evidencia. Rol = AUDITOR: reportas, no expandes scope.

## ENTORNO
- **appEventos:** https://app-dev.bodasdehoy.com · **chat-ia:** https://chat-dev.bodasdehoy.com
- Build desplegado: `BUILD_ID tFeavJjMr2isKZS57CB5r` (dev @ commit `05da414f`). Verifica el debug footer.
- **E2E:** `E2E_ENV=dev PLAYWRIGHT_BROWSER=webkit npx playwright test e2e-app/<spec>` — **NUNCA chromium**.
- Credenciales en `.env.e2e.dev` (3 users). **NUNCA modificar "Boda Isabel & Raúl" (`66a9042dec5c58aa734bca44`)**. Crear datos propios + cleanup.
- Baterías 1-3 specs + health-check previo. Validar 1 antes de masivo. **2-strikes → STOP + root cause**. `assertNoRuntimeError` en cada test.

## QUÉ VALIDAR (por área y prioridad)

### A · appEventos — Resumen del evento (/resumen-evento)
1. **Botón "Ver mis Itinerarios"**: texto **gris** (no blanco), tamaño homologado a "Añadir Invitados". Fondo amarillo.
2. **"Sobre mi evento" → Color**: al pulsar **NO crashea** (antes `null.includes`); abre el selector de colores.
3. **Temporada / Estilo / Temática**: al cambiar, el valor se ve **al instante**, **sin toast de error falso**, **sin recargar**.
4. **Tooltip email del responsable**: al hover el avatar circular, el correo se ve **COMPLETO** (no recortado por el header/tarjeta).
5. **Buscador "Lugar del evento"**: muestra estados claros (**cargando / resultados / sin resultados / error**), deja **seleccionar** un lugar, y **persiste tras recargar**. ⚠️ Si sale "error al cargar", es el servicio `getAllBusinesses` (backend) — reportar aparte.

### B · appEventos — Mis eventos (/)
6. 🔴 **Lista de eventos tras refresh**: recargar la página **varias veces** — los eventos deben **verse SIEMPRE** (antes a veces salía vacío por token caducado). **No debe hacer falta logout/login** para recuperarlos.
7. **Grid del tablero + Copilot**: en desktop, abrir el sidebar Copilot — las cards de evento **NO deben solaparse**.

### C · appEventos — Invitados (/invitados)
8. 🔴 **Crear invitado**: aparece en la lista **al instante**; el toast "creado con éxito" solo si de verdad se guardó (probar y refrescar para confirmar persistencia; probar duplicados).
9. **Editar invitado**: el cambio **persiste tras recargar**; si el guardado falla, sale **aviso de error** (no silencio).

### D · appEventos — Mesas (/mesas)
10. **Plano/lienzo**: fondo **blanco con retícula gris clara** (no azul). Mesas, sillas, zoom, drag y selección **intactos**.

### E · appEventos — Copilot (sidebar)
11. **Contexto de evento**: con un evento abierto, el header del Copilot dice **"Contexto: <evento>"** y responde sobre ESE evento. En "Mis eventos" (sin evento) → **"Contexto: todos tus eventos"**. ⚠️ `get_event_guests` en multi-turn depende de 6 items backend api-ia pendientes.

### F · appEventos — Auth / magic-link / Push
12. **magic-link**: abrir un enlace `/auth/magic/[token]` — procesa el token (handler real, ya no stub 501).
13. **Web Push (VAPID)**: suscribirse a notificaciones desde Ajustes; la clave VAPID llega vía `GET /api/push/vapid-public-key`.

### G · chat-ia — Bandeja/Mensajería FASE B v2.0 (/messages) — **BLOQUE GRANDE**
14. **3 tabs**: Conversaciones / Bandeja / Historial.
15. **EventSidebar**: RSVP + asignación de conversación a usuario + datos del evento.
16. **IaLevelPicker**: Manual / Copiloto / Autopiloto en el header.
17. **ScopeSelector + InboxFilters** (RSVP + canal).
18. **Badges** de canal (abajo-izq) + RSVP (abajo-der) en avatars; **burbujas IA** distintas con sello "✦ Enviado por IA".
19. **Móvil**: BottomNavBar + BottomSheet sidebar 75%.
20. **SSE `/api/messages/stream`**: mensajes nuevos llegan en **tiempo real** (2 usuarios).
21. **Historial** → botón "Marcar todas leídas".

### H · chat-ia — Refactor runtime (verificar que NO rompió el chat)
22. Se eliminó `@lobechat/model-runtime` + 66 providers (modelos ahora centralizados en api-ia). **Verificar que el chat sigue funcionando**: enviar mensaje, respuesta con **streaming**, tool calls.

### I · chat-ia — Notas CRM
23. **NotesPanel / @menciones**: menciones en azul, autocomplete de usuarios. 🔴 **KNOWN BUG**: "Notas internas" en app-dev da error GraphQL `CRM_NotesResponse.notes` null → backend api-mcp pendiente. **Verificar si ya se corrigió** (evento sin notas debe mostrar "Aún no hay notas", no error).

### J · chat-ia — Login/OAuth
24. **OAuth Google popup**: no se cuelga (fix timeout 60s).

## ISSUES CONOCIDOS (no reportar como nuevos)
- **E2E login vía `local-login` form falla** (bajo diagnóstico). El login SSO/completo SÍ establece cookies (`idTokenV0.1.0`/`sessionBodas`). → si tus specs logueados fallan por "no logueado", es esto, no el código.
- **Notas internas backend** (`CRM_NotesResponse.notes` non-nullable devuelve null) — api-mcp pendiente.
- **6 items Copilot backend** (activeEventId como default en tools, param `status`, cap reintentos, write-guard, heartbeat SSE) — api-ia pendiente.
- **Botones stub del Dashboard Presupuesto** (Generar reporte, Exportar Excel, Hacer pago WP) — sin implementar, solo verificar que no crashean.

## MÉTODO Y REPORTE
- E2E webkit + validación manual. Distinguir **bug real vs error de test** (mirar captura: ¿vista de visitante = login falló?).
- Reportar por incidencia: **ID · severidad · entorno · rol · pasos · esperado vs observado · RequestId/TraceId · captura**.
- Coordinación: canal `C0AV8EV5495`, hilo `1778170638.897419`, formato DE/PARA/DRI/ASUNTO.
