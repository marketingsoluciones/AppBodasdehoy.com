# QA VISUAL COMPLETO — 2026-07-12

Builds probados:
  app-dev  = jjySJBwY-LZP2KqdwzLRE
  chat-dev = ymb6Cv86sotXnoagGhaL8

BATERÍA A · Autenticación
  TA.1 login password DUEÑO       [BLOQUEADO]
  TA.2 login inválido rechazado   [BLOQUEADO]
  TA.3 login Google               [BLOQUEADO]
  TA.4 magic-link error legible   [FALLA]
  TA.5 SSO cross-app              [FALLA]

BATERÍA B · Header + Navegación
  TB.1 Novia marketing             [FALLA]
  TB.2 Proveedores marketing       [FALLA]
  TB.3 Novio marketing             [FALLA]
  TB.4 Lugares marketing           [FALLA]
  TB.5 Campana visible             [PASA]
  TB.6 Campana 3 tabs              [PASA]
  TB.7 Polling 60s                 [PASA]
  TB.8-TB.15 Menú evento (8 tests) [BLOQUEADO]
  TB.16 Menú móvil                 [BLOQUEADO]

BATERÍA C · Presupuesto
  TC.1 Carga sin crash             [BLOQUEADO]
  TC.2 Tabs internos               [BLOQUEADO]
  TC.3 Card pago huérfano          [BLOQUEADO]
  TC.4 Navegación mixta            [BLOQUEADO]
  TC.5 Moneda EUR                  [BLOQUEADO]

BATERÍA D · Invitados
  TD.1 Crear Grupo                 [BLOQUEADO]
  TD.2 Crear Menú                  [BLOQUEADO]
  TD.3 Crear invitado              [BLOQUEADO]
  TD.4 Editar invitado persiste    [BLOQUEADO]
  TD.5 Descargar plantilla xlsx    [BLOQUEADO]
  TD.6 Importar Excel parser       [BLOQUEADO]
  TD.7 Rol dueño no bloqueado      [BLOQUEADO]

BATERÍA E · Mesas
  TE.1 Plano blanco                [BLOQUEADO]
  TE.2 Añadir mesa                 [BLOQUEADO]
  TE.3 Sentar invitado             [BLOQUEADO]
  TE.4 Zoom/pan                    [BLOQUEADO]

BATERÍA F · Lista de regalos + Copilot
  TF.1 Carga lista                 [BLOQUEADO]
  TF.2 Copilot pregunta+respuesta  [BLOQUEADO]
  TF.3 Popconfirm cierra OK        [BLOQUEADO]
  TF.4 Popconfirm cierra Cancel    [BLOQUEADO]
  TF.5 Popconfirm cierra Esc/click [BLOQUEADO]
  TF.6 trace_id en error           [BLOQUEADO]
  TF.7 Saldo fantasma NO reaparece [BLOQUEADO]
  TF.8 WhatsApp wa.me/             [BLOQUEADO]

BATERÍA G · Resumen
  TG.1 Carga                       [BLOQUEADO]
  TG.2 Sobre mi evento sin crash   [BLOQUEADO]
  TG.3 Buscador Lugar              [BLOQUEADO]
  TG.4 Botón Itinerarios color     [BLOQUEADO]
  TG.5 Notas del evento            [BLOQUEADO]

BATERÍA H · Itinerario
  TH.1 Carga                       [BLOQUEADO]
  TH.2 Añadir bloque               [BLOQUEADO]

BATERÍA I · Invitaciones
  TI.1 Carga                       [BLOQUEADO]
  TI.2 Preview template            [BLOQUEADO]

BATERÍA J · Tareas
  TJ.1 Kanban carga                [BLOQUEADO]
  TJ.2 Editar tarea persiste       [BLOQUEADO]
  TJ.3 Notas en tarea              [BLOQUEADO]

BATERÍA K · Chat-IA /messages
  TK.1 SSO chat                    [PASA]
  TK.2 3 tabs                      [FALLA]
  TK.3 Conversación estructura     [BLOQUEADO]
  TK.4 IaLevelPicker               [BLOQUEADO]
  TK.5 Notas sidebar               [BLOQUEADO]
  TK.6 Pinned styles               [BLOQUEADO]

BATERÍA L · Notificaciones + Push + Memoria
  TL.1 Config Avanzada 4 cards     [BLOQUEADO]
  TL.2 Web Push subscribe          [BLOQUEADO]
  TL.3 Web Push unsubscribe        [BLOQUEADO]
  TL.4 Memoria card                [BLOQUEADO]
  TL.5 Cross-app notif             [BLOQUEADO]

BATERÍA M · Portal público
  TM.1 Portal Isabel               [PASA]
  TM.2 Portal ID inválido          [PASA]
  TM.3 RSVP                        [BLOQUEADO]

BATERÍA N · Momentos
  TN.1 /momentos carga             [BLOQUEADO]
  TN.2 Portal público momentos     [BLOQUEADO]

BATERÍA O · Errores consola
  Errores conocidos (contar): React #418 = 1; getThemeColors/exportedColors = 2; CRM_NotesResponse.notes = 0; abortos de analítica/telemetría = 41
  Errores NUEVOS (listar): [sso-auto] sessionBodas vacío; JWT token expirado; usuario identificado sin JWT válido; no se pudo obtener Firebase token para renovar; timeout de seguridad 15s; ERR_TOO_MANY_REDIRECTS en /api/auth/sso-auto; auth/requests-to-this-api-securetoken...are-blocked; ERR_ABORTED en /api/messages/stream; ERR_BLOCKED_BY_ORB en restcountries.eu/data/esp.svg
  Pantalla roja ErrorBoundary: [NO]

BUGS NUEVOS DETECTADOS (no reportados antes):
  · Posible regresión: creación de evento de prueba bloqueada por validación del campo fecha nativo; no permitió crear "Boda Test QA 12jul"
  · Posible regresión: tras login correcto en chat-dev, `/messages` cae a estado visitante o contexto parcial
  · Posible regresión: renovación JWT / securetoken bloqueada en chat-dev, degradando SSO y `/messages`

Cleanup:
  ✅ 0 eventos test borrados (no llegó a crearse ninguno)
  ✅ 0 invitados/notas/tareas test borrados (no se llegó a crear ninguno)
  ✅ Web Push desactivado (no llegó a activarse)
  ✅ Isabel & Raúl verificada intacta

Screenshots: capturadas durante el run por batería; la evidencia clave incluye login, magic-link, campana, messages visitante y portal público del fixture.

## Notas de interpretación

- Este run quedó limitado por dos bloqueos estructurales:
  - `APP/login` rebotó automáticamente por sesión persistente, impidiendo un cold login limpio y el negativo con usuario inválido.
  - No había evento navegable disponible para DUEÑO y la creación del evento de prueba falló en el input de fecha, por lo que C-J y N no pudieron ejecutarse de forma legítima como usuario final.
- En `chat-dev`, el acceso por password llegó a `/chat`, pero `/messages` degradó a estado visitante/parcial y mostró errores de renovación de token y SSO.
