# Plan avanzado de QA independiente — mensajería, multusuario y multimarcas DEV

Fecha de preparación: 2026-09-14
Destinatario: equipo independiente de QA
Entorno autorizado: DEV
Navegador obligatorio: WebKit
Ámbito: AppEventos, Chat, bandeja, mensajes internos, WhatsApp, notificaciones, SSE, Socket.IO, persistencia, asignación/compartición, enlaces públicos, API-IA y API-MCP.

## 1. Mandato

Ejecutar una validación funcional, de seguridad y de resiliencia con usuarios reales de prueba y dos sesiones simultáneas. El resultado debe demostrar qué usuario actuó, desde qué URL, en qué marca, sobre qué conversación o evento, qué recibió el otro usuario, qué quedó persistido y qué acceso fue denegado a un tercero.

Un HTTP 200, una pantalla que carga, texto genérico, una prueba omitida o una captura aislada no prueban el flujo. Cada caso obligatorio debe correlacionar:

1. acción visible en UI;
2. petición y respuesta de red;
3. evento SSE, Socket.IO o GraphQL WebSocket cuando aplique;
4. lectura posterior desde otra sesión;
5. persistencia después de recargar o abrir un navegador nuevo;
6. denegación equivalente con un usuario sin permiso.

QA no modificará código de producto ni decidirá cambios funcionales. Documentará los defectos con evidencia reproducible y los devolverá a los equipos responsables.

## 2. Línea base que debe quedar escrita al iniciar

No hacer pull, reset, merge, build ni reinicio antes de capturar la línea base.

### Monorepo y frontend

- Equipo: Mac Mini, acceso por ssh mac-mini.
- Repositorio canónico: /Users/juancarlosparra/Projects/AppBodasdehoy.com
- Rama: dev.
- HEAD observado al preparar este plan: 04d481db.
- Procesos esperados en PM2: app-dev, chat-dev, web-dev y cloudflared.
- AppEventos: puerto 3220.
- Chat: puerto 3210.
- Web público: puerto 4000.

### API-IA

- Equipo: acceso por ssh api3-ia.
- Repositorio: /opt/backend
- Rama: main.
- HEAD observado: 509accd.
- Servicio: backend.service.
- Host público real comprobado:
  - https://api-ia.bodasdehoy.com
  - https://api-ia.eventosorganizador.com
- La referencia antigua https://api3-ia.eventosorganizador.com no resolvía DNS al preparar el plan. No usarla como endpoint de prueba.

### API-MCP

- Equipo: acceso por ssh api3-mcp-graphql.
- Repositorio: /var/www/api-production
- Rama: dev.
- HEAD observado: 7fd4ceab.
- Proceso PM2: api-production.
- GraphQL compartido: https://api-mcp.eventosorganizador.com/graphql
- Health: https://api-mcp.eventosorganizador.com/health

### URLs públicas obligatorias

| Marca | Aplicación | Chat/bandeja | Web público |
|---|---|---|---|
| Bodas de Hoy | https://app-dev.bodasdehoy.com | https://chat-dev.bodasdehoy.com | https://web-dev.bodasdehoy.com |
| Eventos Organizador | https://app-dev.eventosorganizador.com | https://chat-dev.eventosorganizador.com | https://web-dev.eventosorganizador.com |

Al inicio del informe, QA debe adjuntar fecha/hora, commit, build ID visible, estado de servicios, DNS resuelto e HTTP de estas URLs.

## 3. Usuarios y contraseñas: ubicación real y reglas de uso

### Archivo local válido para DEV

Las credenciales actuales están en el Mac Mini, dentro de la raíz canónica:

/Users/juancarlosparra/Projects/AppBodasdehoy.com/.env.e2e.dev

El archivo no está versionado y contiene estos pares:

- TEST_USER_EMAIL / TEST_USER_PASSWORD
- TEST_USER2_EMAIL / TEST_USER2_PASSWORD
- TEST_USER3_EMAIL / TEST_USER3_PASSWORD
- aliases TEST_USER_EMAIL_2 / TEST_USER_PASSWORD_2
- aliases TEST_USER_EMAIL_3 / TEST_USER_PASSWORD_3
- TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD

Cuentas identificadas en ese archivo, sin reproducir contraseñas:

| Alias propuesto | Variable | Cuenta actual | Uso inicial |
|---|---|---|---|
| BDH-A | TEST_USER_EMAIL | bodasdehoy.com@gmail.com | owner/organizador; confirmar rol real |
| MIX-B | TEST_USER2_EMAIL | jcc@marketingsoluciones.com | segunda identidad; confirmar tenant y permisos |
| BDH-C | TEST_USER3_EMAIL | jcc@bodasdehoy.com | tercera identidad; confirmar rol real |

No hay actualmente una credencial válida de jcc@eventosorganizador.com en el archivo y la prueba anterior indicó que esa cuenta no existe en el Firebase independiente de Eventos Organizador.

### Matriz mínima que debe provisionarse

Antes de ejecutar los casos multusuario se necesitan tres identidades por marca:

| Marca | Usuario A | Usuario B | Usuario C |
|---|---|---|---|
| Bodas de Hoy | owner/supervisor | colaborador del mismo tenant | usuario sin acceso a la conversación |
| Eventos Organizador | owner/supervisor | colaborador del mismo tenant | usuario sin acceso a la conversación |

No se puede usar una identidad de Marketing Soluciones para fingir que es colaborador de Bodas o Eventos. Primero se verifican el UID, development/tenant, roles, membresías de canal y evento accesible. Si faltan cuentas, el caso queda BLOCKED_ACCOUNT; nunca PASS ni SKIPPED.

Las nuevas claves deben guardarse únicamente en:

/Users/juancarlosparra/Projects/AppBodasdehoy.com/.env.e2e.dev.local

con permisos 600. No deben aparecer en comandos, package.json, código, comentarios, capturas, traces publicadas ni informe.

El cargador correcto es:

    bash scripts/with-root-e2e-env.sh dev <comando>

El wrapper carga .env.e2e.dev y después .env.e2e.dev.local. No ejecutar Playwright directamente: playwright.config.ts no carga por sí solo .env.e2e.dev.local en todos los casos.

### Hallazgo de seguridad previo sobre secretos

La revisión detectó credenciales o fallbacks sensibles escritos en ficheros versionados, al menos en package.json, e2e-app/fixtures.ts y comentarios de pruebas. También existe apps/appEventos/utils/credentials.json versionado con un client_secret OAuth. La búsqueda heurística marcó más ubicaciones que necesitan triaje.

QA no copiará esos valores. Debe abrir un defecto de seguridad independiente con:

- lista de archivo y línea, sin incluir el secreto;
- confirmación de si el valor sigue activo;
- alcance de uso;
- necesidad de rotación;
- eliminación del repositorio y del historial cuando corresponda.

El archivo .env.e2e.dev tenía modo 644 al preparar este plan. Debe quedar en 600 antes de iniciar la ejecución.

## 4. Evaluación de las pruebas existentes

Los siguientes E2E son referencias útiles, pero no sirven por sí solos como cierre:

- e2e-app/chat-mensajes-2usuarios.spec.ts: 45 puntos que pueden omitir pruebas.
- e2e-app/bandeja-mensajes.spec.ts: 17 puntos de omisión.
- e2e-app/messages-inbox-track-a.spec.ts: 21 puntos de omisión.
- e2e-app/messages-inbox-track-b-schema.spec.ts: 11 puntos de omisión.
- e2e-app/whatsapp-invitaciones.spec.ts: 14 puntos de omisión.
- e2e-app/invitado-y-link.spec.ts: 5 puntos de omisión.
- e2e-app/share-event-permissions.spec.ts: 8 puntos de omisión.

Varios casos se omiten si falla el login, no aparece una conversación o falta un dato. Otros validan expresiones de texto demasiado amplias. El informe nuevo debe mostrar cero skip en los casos obligatorios. Un rerun que pasa después de fallar se registra como FLAKY, no como PASS limpio.

QA puede crear una especificación estricta en su rama de pruebas, por ejemplo e2e-app/qa-mensajeria-multimarca-strict.spec.ts. No debe añadir mocks de red ni sustituir las APIs reales de DEV.

## 5. Preparación de datos

Crear un identificador único:

QA-YYYYMMDD-HHMM-<marca>-<caso>

Usarlo en el asunto, cuerpo de mensaje, conversación, tarea o comentario. Ejemplo conceptual: QA-20260914-1430-BDH-SHARE03. No reutilizar mensajes de rondas anteriores.

Para cada marca registrar antes de probar:

- email y alias A/B/C;
- UID parcialmente enmascarado;
- tenant/development efectivo;
- rol;
- canal WhatsApp y su owner.type;
- membresía activa del canal;
- eventId de prueba;
- conversationId nuevo o controlado;
- sessionId/topicId cuando aplique.

Crear datos mínimos y limpiarlos al final. No borrar conversaciones históricas ni reutilizarlas como única evidencia.

## 6. Modelo funcional que QA debe distinguir

En el backend actual existen conceptos distintos:

- assignConversationToUser: asigna el responsable humano y escribe assignedTo.
- assignConversationToTeam: asigna el responsable a un equipo.
- shareConversation: concede a una persona o equipo permiso view o reply.
- unshareConversation: revoca el grant.
- setConversationAgent: asigna el agente de IA de bandeja; no es el responsable humano.
- linkConversationToEvent: vincula la conversación con un evento.
- replyToConversation: responde por el canal/línea asociado a la conversación.
- sendWhatsAppMessage: envío directo a un número dentro del development autenticado.

QA debe comprobar la semántica visible y de permisos de cada operación. No aceptar que asignar y compartir sean tratados como sinónimos.

Hipótesis que requieren prueba expresa:

1. Una asignación puede cambiar el responsable sin conceder acceso si el usuario no pertenece al canal o no tiene un grant.
2. Un grant view debe permitir lectura y bloquear respuesta, edición, archivo, reenvío y nueva compartición.
3. Un grant reply puede permitir responder; se debe confirmar si también puede compartir o reasignar. Si puede escalar permisos sin ser supervisor, abrir defecto.
4. Un grant a team debe ser efectivo para miembros activos del equipo y no para no miembros.
5. setConversationAgent nunca debe cambiar assignedTo ni permitir acceso a un usuario humano.

## 7. Ejecución obligatoria

### Fase 0 — Salud y trazabilidad

F0-01. Capturar git HEAD y estado de trabajo de los tres repositorios.
F0-02. Capturar PM2/systemd y reinicios acumulados.
F0-03. Resolver DNS y comprobar health por marca.
F0-04. Abrir las seis URLs públicas con WebKit.
F0-05. Registrar errores de consola, peticiones 4xx/5xx y endpoints realmente usados.
F0-06. Confirmar que AppEventos y Chat usan API-IA en api-ia.<marca> y API-MCP en el endpoint compartido.

Aceptación: ningún servicio caído, ninguna URL 502, ninguna referencia activa a api3-ia público y línea base completa.

### Fase 1 — Identidad y separación por marca

Repetir todos los casos en Bodas de Hoy y Eventos Organizador.

ID-01. Login A desde app-dev y salto SSO a chat-dev.
ID-02. Login B en un BrowserContext independiente.
ID-03. Login C en un tercer BrowserContext independiente.
ID-04. Comprobar email visible, UID, tenant, rol y marca.
ID-05. Abrir simultáneamente A y B; ninguna cookie ni storageState compartidos.
ID-06. Intentar usar token de Bodas contra una petición de Eventos y a la inversa.
ID-07. Alterar developerId/usuario_id en la petición y confirmar que el JWT mantiene el alcance real.
ID-08. Entrar por un dominio de una marca con sesión previa de la otra y comprobar que no aparecen usuario, evento, chats, saldo ni historial anteriores.

Aceptación: el dominio no decide por sí solo el tenant; lo decide la identidad verificada. Los intentos cruzados devuelven 401/403 o respuesta vacía segura.

### Fase 2 — Logout y estanqueidad A a B

LOG-01. A selecciona evento, abre Copilot, crea mensaje y deja conversación activa.
LOG-02. A cierra sesión desde UI.
LOG-03. Comprobar eliminación de cookies de sesión/evento y claves locales del usuario A.
LOG-04. Sin cerrar el BrowserContext, B inicia sesión.
LOG-05. B no ve nombre, evento, chats, mensajes, notificaciones, saldo ni prompts de A.
LOG-06. Atrás/adelante y restauración de pestaña no recuperan contenido sensible.
LOG-07. Peticiones tardías de A después del logout quedan rechazadas.
LOG-08. Repetir transición entre marcas.

Aceptación: cero fuga visual, de red o almacenamiento. Esperar al menos 90 segundos en la lista de eventos para cubrir regresiones periódicas.

### Fase 3 — Chat, sesiones, temas y persistencia

CHAT-01. A crea sesión y envía mensaje marcador.
CHAT-02. Verificar que el mensaje de usuario obtiene ID definitivo; no queda solo temp_*.
CHAT-03. Verificar respuesta del asistente completa y, si usa herramienta, tool call y resultado.
CHAT-04. Recargar y comprobar mismo sessionId, messageId, orden, autor, timestamp, contenido y metadata.
CHAT-05. Cerrar WebKit y abrir un contexto nuevo de A; comprobar persistencia.
CHAT-06. Crear topic, enviar varios mensajes, editar, marcar leído y borrar según permisos.
CHAT-07. Ejecutar dos envíos simultáneos y comprobar orden estable, una sola copia y ausencia de pérdidas.
CHAT-08. Provocar cancelación o fallo de red durante el stream y comprobar estado recuperable.
CHAT-09. C intenta consultar sessionId, topicId y messageId conocidos de A por GraphQL/REST.
CHAT-10. B solo ve la sesión si es participante o tiene grant válido.

Aceptación: UI y API coinciden; ningún mensaje aparece duplicado o desaparece tras recarga; C queda denegado.

### Fase 4 — Paso de conversación entre usuarios

Esta fase responde al caso principal: un usuario entrega, comparte o asigna a otro una conversación/mensaje de un tercero.

SHARE-01. A abre una conversación real y registra conversationId.
SHARE-02. Antes de compartir, B y C intentan listar y leer esa conversación: ambos deben quedar fuera.
SHARE-03. A comparte con B usando permission=view.
SHARE-04. B ve la conversación y los mensajes permitidos desde su propia sesión.
SHARE-05. B intenta responder, editar, archivar, marcar leído, asignar y volver a compartir. Las acciones fuera de view deben fallar.
SHARE-06. A cambia el grant de B a reply.
SHARE-07. B responde con marcador único. A debe verlo sin recargar y después de recargar.
SHARE-08. C intenta lectura y respuesta usando los IDs capturados: debe fallar.
SHARE-09. A ejecuta unshareConversation. B pierde acceso en UI y API; una pestaña que ya estaba abierta no puede seguir enviando.
SHARE-10. A asigna la conversación a B. Verificar assignedTo, filtros de “asignado a mí”, notificación y diferencia respecto al permiso de acceso.
SHARE-11. Reasignar a otro usuario y luego desasignar; confirmar consistencia.
SHARE-12. Compartir con un equipo. Miembro activo accede; usuario no miembro no accede.
SHARE-13. Retirar al miembro del equipo y comprobar revocación.
SHARE-14. Cambiar el agente IA con setConversationAgent y confirmar que responsable humano y grants no cambian.
SHARE-15. B con reply intenta compartir con C o reasignar. El resultado debe coincidir con la política escrita; si no existe política o permite escalada, abrir defecto de autorización.

Aceptación: A controla el alcance; B recibe solo lo concedido; C nunca accede; revocación efectiva; asignación, compartición y agente IA permanecen separados.

### Fase 5 — Tiempo real

#### SSE de bandeja y notificaciones

RT-SSE-01. Abrir A/B/C y registrar una sola conexión SSE autenticada por dispositivo.
RT-SSE-02. A realiza acción destinada a B.
RT-SSE-03. B recibe exactamente un evento y actualiza badge/lista sin recargar.
RT-SSE-04. A y C no reciben contenido destinado a B.
RT-SSE-05. Cortar red 10 segundos y restaurar; comprobar reconexión y ausencia de duplicados.
RT-SSE-06. Cerrar sesión y verificar cierre del stream y rechazo del token anterior.
RT-SSE-07. Mantener 30 minutos y registrar reconexiones, crecimiento de memoria y eventos repetidos.

#### Socket.IO de AppEventos

RT-SOCK-01. Verificar handshake real contra API-IA/rewrite de la marca.
RT-SOCK-02. Confirmar autenticación y tenant del socket.
RT-SOCK-03. A modifica tarea/comentario/evento compartido y B lo ve sin recargar.
RT-SOCK-04. C no recibe el payload.
RT-SOCK-05. Forzar polling, upgrade a websocket y reconexión.
RT-SOCK-06. Ningún bucle infinito, 404 /socket.io, ChunkLoadError o reconexión contra API-MCP.

#### GraphQL WebSocket

RT-GQL-01. Realizar handshake con protocolo graphql-transport-ws.
RT-GQL-02. Suscribirse con JWT válido.
RT-GQL-03. Confirmar evento de una mutación.
RT-GQL-04. JWT ausente, expirado o de otra marca queda rechazado.
RT-GQL-05. No aceptar como evidencia una petición HTTP a /graphql que solo comprueba el schema.

### Fase 6 — WhatsApp real

Esta fase solo se cierra con un número de prueba enlazado por QR/WAB y un destinatario controlado y autorizado.

WA-01. Consultar getWhatsAppChannels y estado de sesión sin exponer tokens.
WA-02. Enlazar o validar la línea de prueba; registrar channelId y sessionKey enmascarados.
WA-03. Enviar texto único desde A al destinatario.
WA-04. Registrar provider message ID, conversación, canal, estado sent/delivered/read y persistencia.
WA-05. Responder desde el teléfono con otro marcador único.
WA-06. La entrada aparece una sola vez en la conversación y llega a B por tiempo real según permisos.
WA-07. Repetir el mismo webhook/provider ID y confirmar deduplicación.
WA-08. Cortar el transporte y comprobar reintento controlado, sin doble mensaje ni doble contabilización.
WA-09. Con varias líneas, replyToConversation debe usar el channelId/sessionKey de la conversación original.
WA-10. Compartir la conversación WA con B en view y reply; repetir SHARE-03 a SHARE-09.
WA-11. Vincular conversación con evento y comprobar linked_event_id.
WA-12. Probar updateGuestRsvpByConversation con invitado controlado.
WA-13. Usuario de baja autorización intenta sendWhatsAppMessage directo a un número arbitrario. Debe ajustarse a la política; si basta pertenecer al tenant, documentar posible exceso de privilegio.
WA-14. Usuario de otra marca altera developerId o reutiliza conversationId; debe quedar denegado.
WA-15. Archivar, bloquear, marcar leído y restaurar estados sin perder historial.

Si faltan número o destinatario, el estado es BLOCKED_EXTERNAL y todo WhatsApp queda fuera del cierre global.

### Fase 7 — Enlaces públicos y privacidad

Hay dos superficies distintas y ambas deben probarse.

#### Links públicos de API-MCP

PUB-01. A genera generatePublicLink para CHAT y EVENT.
PUB-02. Abrir /public/<token> en un contexto WebKit nuevo sin cookies.
PUB-03. CHAT solo puede exponer id, name, type, createdAt, updatedAt, channel y status.
PUB-04. EVENT solo puede añadir date y location.
PUB-05. Nunca exponer owner, participants, shared_with, mensajes, metadata interna, claves, email, teléfono o JWT.
PUB-06. Comprobar expiresAt, maxAccesses y revokePublicLink.
PUB-07. Token inválido, revocado o agotado devuelve error seguro.
PUB-08. B/C no pueden listar links del recurso ni revocar el link de A.

#### Portal público de AppEventos

Probar, según el recurso creado:

- /e/<eventId>
- /public-card/<slug válido>
- /public-itinerary/<slug válido>
- /buscador-mesa/<eventId>
- /api/public/event/<eventId>
- /api/public/seating/<eventId>
- /api/public/validate-guest?g=<token>

PUB-09. Solo tareas con spectatorView=true aparecen.
PUB-10. Evento inexistente devuelve 404 o pantalla segura, sin ErrorBoundary.
PUB-11. Token de invitado inválido devuelve valid=false sin revelar si existe una persona.
PUB-12. Link abierto sin cookies no obtiene endpoints privados.

Hallazgo previo a validar: /api/public/seating/<eventId> no exige token, busca entre tenants y actualmente proyecta nombre completo, mesa y puesto de invitados confirmados. El comentario del código habla de iniciales, pero la implementación devuelve g.nombre. QA debe:

- confirmar el comportamiento con un evento de prueba;
- no copiar nombres reales al informe;
- valorar enumerabilidad del eventId;
- verificar caché pública;
- abrir defecto de privacidad si se exponen nombres completos o eventos no publicados;
- proponer como criterio token público revocable o minimización efectiva de nombre.

### Fase 8 — Seguridad negativa e IDOR

SEC-01. Cada query/mutation de sesión, tema, mensaje, notificación y conversación sin JWT.
SEC-02. JWT válido con userId/usuario_id/developerId falsificado.
SEC-03. JWT de A con IDs de C.
SEC-04. JWT de otra marca con IDs válidos de la marca origen.
SEC-05. Grant view intentando reply, update, delete, archive, assign y share.
SEC-06. Usuario reply intentando elevarse a owner o conceder acceso a C.
SEC-07. Token expirado durante SSE/socket.
SEC-08. Borrado o revocación mientras otra pestaña mantiene el recurso abierto.
SEC-09. Buscar mensajes por texto no debe saltarse ACL.
SEC-10. getWhatsAppMessageById no devuelve mensajes de conversaciones inaccesibles.
SEC-11. getEventosByUsuario ignora el UID ajeno y usa actor verificado.
SEC-12. Logs, HAR, traces y errores no contienen JWT, cookies, password, client_secret ni cuerpo sensible innecesario.

Aceptación: denegación efectiva en backend. Ocultar botones en UI no es suficiente.

### Fase 9 — Resiliencia, concurrencia y rendimiento

RES-01. Dos usuarios envían al mismo tiempo.
RES-02. Dos pestañas del mismo usuario actualizan leído/estado.
RES-03. Reintento tras timeout no duplica mensaje.
RES-04. Orden por timestamp estable ante mensajes con pocos milisegundos de diferencia.
RES-05. Recargar durante stream conserva estado coherente.
RES-06. 30 minutos con lista de eventos, chat y bandeja abiertas.
RES-07. Cero error periódico cada 1/2/4/8 segundos.
RES-08. Cero crecimiento continuo de conexiones SSE/socket.
RES-09. Medir p50/p95 de envío, aparición remota y recarga.
RES-10. Reinicio controlado de API-IA/API-MCP solo si Infra lo autoriza dentro de la ventana; verificar reconexión sin pérdida.

Objetivos iniciales de QA, sujetos a SLA de producto:

- mensaje visible local: menos de 1 segundo;
- aparición en B por realtime: p95 menor de 3 segundos;
- historial tras recarga: p95 menor de 5 segundos;
- cero mensajes perdidos;
- cero duplicados;
- cero fugas entre usuarios o marcas.

### Fase 10 — Regresión y limpieza

REG-01. Repetir los casos ya aprobados de agente, herramienta y persistencia.
REG-02. Repetir notificaciones autenticadas y anónimas.
REG-03. Repetir regresión getEventosByUsuario con UID ajeno.
REG-04. Repetir listado de eventos durante 90 segundos.
REG-05. Dos ejecuciones consecutivas completas sin flaky ni skip.
REG-06. Eliminar únicamente datos QA creados por runId.
REG-07. Confirmar que ninguna conversación histórica fue modificada.
REG-08. Guardar inventario de datos que no pudieron limpiarse.

## 8. Comando de ejecución

Desde el Mac Mini:

    ssh mac-mini
    cd /Users/juancarlosparra/Projects/AppBodasdehoy.com
    chmod 600 .env.e2e.dev .env.e2e.dev.local 2>/dev/null || true
    bash scripts/with-root-e2e-env.sh dev       E2E_HEADLESS=1       PLAYWRIGHT_BROWSER=webkit       pnpm exec playwright test       --config=playwright.config.ts       e2e-app/qa-mensajeria-multimarca-strict.spec.ts       --reporter=line,json

No usar los scripts package.json que fijan dominios *-test o credenciales en línea. No usar Chromium. No ejecutar contra TEST o producción.

## 9. Evidencia obligatoria por caso

Cada fila debe contener:

| Campo | Obligatorio |
|---|---|
| ID de caso | Sí |
| PASS/FAIL/BLOCKED/FLAKY | Sí |
| Fecha/hora y zona | Sí |
| Marca | Sí |
| URL exacta | Sí |
| Alias y email del actor | Sí |
| UID enmascarado y tenant | Sí |
| Rol/membresía | Sí |
| runId y texto marcador | Sí |
| eventId/sessionId/topicId/conversationId/messageId enmascarados | Cuando aplique |
| Acción exacta | Sí |
| Resultado esperado | Sí |
| Resultado observado | Sí |
| HTTP/GraphQL y operación | Sí |
| Evento SSE/socket y latencia | Cuando aplique |
| Persistencia tras recarga | Cuando aplique |
| Resultado del usuario C | En seguridad/compartición |
| Captura antes/después | Sí |
| trace/video/HAR sanitizado | Sí |
| log backend correlacionado | En fallos |
| defecto asociado | En FAIL/FLAKY |

Los HAR y traces completos contienen cookies o tokens. Guardarlos en ubicación privada y adjuntar al informe solo una copia sanitizada.

## 10. Formato del informe que QA debe devolver

### Portada

- runId global;
- inicio/fin;
- personas ejecutoras;
- commits y builds;
- URLs;
- navegador WebKit y versión;
- cuentas A/B/C por marca, sin claves;
- servicios y reinicios.

### Resumen ejecutivo

- total obligatorio;
- PASS;
- FAIL;
- BLOCKED_ACCOUNT;
- BLOCKED_EXTERNAL;
- FLAKY;
- SKIP, que debe ser cero;
- veredicto por marca;
- veredicto separado para WhatsApp y enlaces públicos.

### Matriz de resultados

Una fila por cada ID de este plan. No agrupar varios casos como “bandeja OK”.

### Defectos

Por defecto incluir:

- severidad P0/P1/P2/P3;
- título;
- marca y URL;
- usuario/rol;
- precondiciones;
- pasos exactos;
- esperado;
- observado;
- frecuencia de reproducción;
- request/response sanitizados;
- IDs de correlación;
- captura/trace/log;
- impacto;
- equipo probable: frontend, API-IA, API-MCP, identidad o infraestructura.

### Apéndices

- inventario de cuentas y permisos;
- operaciones GraphQL observadas;
- eventos realtime;
- métricas;
- datos creados y eliminados;
- lista de secretos encontrados por archivo/línea sin valores.

## 11. Severidades

- P0: fuga entre tenants, acceso a mensajes/PII sin permiso, credencial activa expuesta, corrupción o envío a destinatario no autorizado.
- P1: pérdida/duplicación de mensajes, revocación inefectiva, asignación/compartición rota, WhatsApp enviado por línea incorrecta, logout conserva datos.
- P2: realtime no actualiza y exige recarga, estados/badges incoherentes, errores periódicos, rendimiento fuera del objetivo.
- P3: texto, estilo o problema menor sin pérdida de función.

## 12. Dependencias y responsables

| Dependencia | Responsable | Efecto si falta |
|---|---|---|
| Tres cuentas reales por marca | Administración de identidad | Bloquea identidad, A/B/C y aislamiento |
| Roles, tenant y membresías conocidos | Producto/identidad | Bloquea interpretación de permisos |
| Número WhatsApp de prueba | Operaciones/WhatsApp | Bloquea WA real |
| Destinatario controlado autorizado | Responsable de QA | Bloquea envío/recepción |
| Acceso SSH de solo lectura a logs | Infraestructura | Limita correlación de fallos |
| Política escrita de view/reply/assign/share | Producto | Resultado funcional ambiguo; abrir decisión |
| Evento y conversación QA | QA/Producto | Bloquea links y mensajería real |

QA debe avanzar con todo lo independiente. Una dependencia bloqueada no paraliza otras fases.

## 13. Estimación

- Preparación de cuentas, roles y datos: 2 a 4 horas si identidad responde.
- Bodas de Hoy, fases 0 a 5 y 8 a 10: 5 a 7 horas.
- Eventos Organizador, repetición completa: 4 a 6 horas.
- WhatsApp real: 2 a 3 horas desde que número y destinatario están disponibles.
- Enlaces públicos y privacidad: 2 a 3 horas.
- Consolidación y revisión del informe: 2 horas.

Estimación total efectiva: 15 a 21 horas de QA. Puede ejecutarse en dos jornadas. La falta de cuentas Eventos o del número WhatsApp aumenta calendario, no esfuerzo.

## 14. Criterio de cierre

El sistema solo se declara cerrado cuando:

1. todas las fases obligatorias pasan en ambas marcas;
2. hay tres identidades válidas por marca y cero skip;
3. dos ejecuciones consecutivas pasan;
4. A comparte/asigna, B recibe y responde según permiso, C queda fuera;
5. revocar elimina acceso;
6. logout elimina estado anterior;
7. mensajes persisten y no se duplican;
8. SSE, Socket.IO y GraphQL WebSocket están autenticados y aislados;
9. WhatsApp real se envía y recibe con trazabilidad, o queda explícitamente fuera del cierre;
10. los enlaces públicos exponen solo el contrato permitido;
11. no quedan P0 ni P1 abiertos;
12. no hay secretos en el informe ni en artefactos compartidos.

Si falta una cuenta, un teléfono o una decisión de permisos, el informe debe decir exactamente qué casos quedan bloqueados, quién debe resolverlo y qué evidencia falta. No se permite sustituir una prueba bloqueada por una conclusión positiva.

