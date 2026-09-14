# Informe de cierre técnico y QA — mensajería DEV

**Fecha:** 2026-09-14  
**Ámbito:** AppEventos, chat, mensajería, notificaciones, tiempo real, persistencia, agentes, API-IA y API-MCP.  
**Entorno autorizado:** DEV.  
**Navegador E2E:** WebKit.

## 1. Veredicto

El circuito principal de chat de Bodas de Hoy queda corregido, compilado, desplegado y probado de extremo a extremo en DEV. La prueba real incluye autenticación, consulta de datos de un evento mediante herramienta de API-IA, respuesta visible, persistencia del mensaje del asistente, recarga del historial y una prueba negativa de acceso cruzado contra API-MCP.

Los bloqueantes de seguridad encontrados en notificaciones, sesiones, mensajes, temas y listado de eventos han sido corregidos. Las capas activas ya toman el actor y el tenant del JWT verificado; los identificadores enviados por el navegador no deciden el alcance de acceso.

La marca Eventos Organizador queda comprobada a nivel de despliegue público, enrutado, login y protección anónima. No se declara una prueba autenticada completa de esa marca porque la cuenta propuesta `jcc@eventosorganizador.com` no existe en su proyecto Firebase independiente. Para cerrar esa cobertura hace falta una cuenta válida de prueba de esa marca.

No se realizó un envío real a un teléfono por WhatsApp ni a terceras personas. El código, las rutas y el aislamiento de mensajería sí fueron auditados, pero la entrega externa requiere un número de pruebas enlazado por QR y un destinatario autorizado.

## 2. Arquitectura comprobada

```text
WebKit / navegador
  ├─ app-dev.<marca>       -> Mac Mini, PM2 app-dev, puerto 3220
  └─ chat-dev.<marca>      -> Mac Mini, PM2 chat-dev, puerto 3210
          ├─ sesión y JWT canónico
          ├─ bandeja, notificaciones y SSE
          ├─ sesiones/temas/mensajes persistidos
          └─ peticiones de agente -> API-IA
                                      ├─ valida JWT, actor, tenant y permisos
                                      ├─ ejecuta herramientas del evento
                                      └─ persiste respuesta rica -> API-MCP GraphQL
                                                                  ├─ ACL de actor/tenant
                                                                  ├─ sesiones y participantes
                                                                  ├─ temas y mensajes
                                                                  └─ eventos propios/compartidos
```

API-IA se ejecuta en `api3-ia:/opt/backend` mediante `backend.service`. API-MCP se ejecuta en `api3-mcp-graphql:/var/www/api-production` mediante PM2 `api-production`.

## 3. Cambios aplicados

### 3.1 Monorepo AppBodasdehoy.com, rama `dev`

- `5327b827` — protege el historial canónico de Copilot y retira el fallback inseguro en memoria.
- `195dee5d` — corrige persistencia y tiempo real del chat.
- `dec97465` — retira el nombre antiguo del producto en la superficie activa.
- `c2cfbd86` — propaga el JWT canónico a las peticiones de IA y evita fragmentos de token en logs.
- `bec09b7e` — restaura metadatos de herramientas y razonamiento al recuperar respuestas.
- `06f9ed5c`, `991f08d3` — endurecen la validación E2E para observar solo el turno nuevo.
- `84d227a7` — elimina cookies de evento y sesiones locales de Copilot al cerrar sesión; la clave local usa UID.
- `16bb9a7c` — reinicia identidad SSO por marca, elimina datos visibles antiguos y admite redirecciones seguras de Eventos Organizador.

### 3.2 API-IA, rama `main`

- `8bdb68b` — JWT verificado, ACL de tenant y aislamiento de tiempo real.
- `f011a59` — alinea autenticación de configuración interna.
- `5089c86` — retira historial legacy activo y exige actor verificado.
- `c5ce4bb` — protege la superficie actual de persistencia.
- `f08cabf` — retira la superficie antigua del producto y restaura notificaciones.
- `cbdcb12` — conserva actor y permisos verificados al ejecutar herramientas.
- `4313942` — normaliza tamaños de grupo de invitados nulos.
- `509accd` — adapta respuestas ricas al contrato GraphQL: contenido y razonamiento permanecen en campos compatibles; herramientas y trazas se guardan en metadata y se reconstruyen al leer.

### 3.3 API-MCP, rama `dev`

- `252f2e0d` — fuerza actor, tenant y acceso a conversación.
- `81ec2d11` — mantiene contratos de respuesta y compatibilidad de bandeja.
- `81167a11` — añade autorización de padre a mensajes y temas; protege lectura, edición, borrado, leído, búsqueda y grupos.
- `7fd4ceab` — vincula `getEventosByUsuario` al actor del JWT e impide que `usuario_id` seleccione datos de otra cuenta.

## 4. Evidencias ejecutadas

### 4.1 Prueba funcional real del agente

- Dominio: `https://chat-dev.bodasdehoy.com`
- Marca: Bodas de Hoy.
- Usuario: `bodasdehoy.com@gmail.com`.
- Evento: `Boda de Isabel & Raúl`.
- Petición: consulta del número exacto de invitados confirmados del evento.
- Actor recibido por backend: rol `creator`.
- Herramienta ejecutada: `get_event_guests`.
- Resultado visible: 40 invitados confirmados.
- Evaluación automática del turno: 100/100, categoría `data_response`.
- Resultado WebKit: 1 prueba aprobada en 29,6 s.

### 4.2 Persistencia real del asistente

Después de la respuesta anterior se consultaron las sesiones y mensajes autenticados:

- HTTP: 200.
- Sesión persistida: `6a99cef805e5e5363793383b`.
- Rol recuperado: `assistant`.
- Contenido recuperado: respuesta con los 40 invitados confirmados.
- Resultado WebKit: 1 prueba aprobada en 8,8 s.

Esto demuestra que el resultado no existe solo en pantalla ni solo en el stream: quedó almacenado y volvió por la API.

### 4.3 Regresión de IDOR de eventos C1

Se autenticó `bodasdehoy.com@gmail.com` y se llamó a `getEventosByUsuario` pasando deliberadamente el UID de otra cuenta:

- Dominio de login: `https://chat-dev.bodasdehoy.com`.
- API: `https://api-mcp.eventosorganizador.com/graphql`.
- Navegador: WebKit.
- Respuesta: HTTP 200.
- Eventos devueltos: 15, correspondientes al alcance del actor autenticado.
- Evento ajeno `QA Jornada 10 Sep`: no devuelto.
- Resultado: 1 prueba aprobada en 8,9 s.

El resolver ignora el selector de usuario del cliente cuando hay JWT y usa el actor verificado. Se conserva el argumento solo para compatibilidad interna autenticada.

### 4.4 Notificaciones, SSE y persistencia de usuario

Comprobaciones realizadas en la ronda:

- `/api/notifications` sin sesión devuelve 401 en ambas marcas.
- Con sesión devuelve 200.
- La cuenta de Bodas de Hoy recuperó 5 notificaciones.
- El stream SSE respondió 200, tipo `text/event-stream`, y entregó trama.
- El mensaje del usuario permaneció después de recargar.
- Las rutas ya no confían en un `userId` libre del navegador.

### 4.5 Builds y pruebas automatizadas

- AppEventos: 6 suites, 69 pruebas, todas aprobadas.
- AppEventos: build de producción completado; 50/50 páginas generadas.
- Chat: build de producción completado; 163/163 páginas generadas.
- API-IA: 25 pruebas relacionadas con persistencia y chat aprobadas en la última ronda; la batería seleccionada acumulada llegó a 80 aprobadas.
- API-MCP: build aprobado.
- API-MCP: 18/18 aserciones de seguridad aprobadas.
- El proceso de las aserciones de API-MCP mantuvo handles de base de datos abiertos después de imprimir 18/18; se terminó el runner. Las aserciones habían finalizado y no hubo fallo funcional.

### 4.6 Despliegue público multimarcas

| URL | Resultado |
|---|---:|
| `https://chat-dev.bodasdehoy.com/login` | 200 |
| `https://chat-dev.eventosorganizador.com/login` | 200 |
| `https://app-dev.bodasdehoy.com` | 200 |
| `https://app-dev.eventosorganizador.com` | 200 |
| `https://chat-dev.bodasdehoy.com/api/notifications` sin sesión | 401 |
| `https://chat-dev.eventosorganizador.com/api/notifications` sin sesión | 401 |

Cobertura autenticada:

| Marca | Cuenta | Cobertura |
|---|---|---|
| Bodas de Hoy | `bodasdehoy.com@gmail.com` | Login, agente, herramienta, respuesta, persistencia, notificaciones, SSE e IDOR negativo |
| Eventos Organizador | `jcc@eventosorganizador.com` | No disponible en Firebase de la marca; solo smoke público y protección anónima |

## 5. Estado de los hallazgos N4–N20 y C1

| Hallazgo | Estado comprobado |
|---|---|
| C1, listado de eventos de otro usuario | Corregido y regresión WebKit aprobada |
| N20/C2/H2, notificaciones suplantables | Corregido; anónimo 401 y actor del JWT |
| N15/N10, identidad cruzada y billing | Causa corregida en JWT, SSO y limpieza de identidad; falta transición autenticada A→logout→B con una segunda cuenta válida |
| N16, agente con evento de otro usuario | Protegido en API-IA y API-MCP por actor, tenant y ACL de evento |
| N17, escritura sin herramienta de lectura | Corregido; `get_event_guests` ejecutado con datos reales |
| N18, respuesta no visible o no persistida | Corregido y probado en UI y almacenamiento |
| N19, agente por defecto sin mensajes | El síntoma no reapareció; el agente global respondió solicitando contexto y el agente de evento respondió correctamente |
| N11, cookies de evento tras logout | Código corregido; falta prueba UI A→logout→B |
| N12, Copilot local entre usuarios | Código corregido; clave por UID y limpieza al logout; falta prueba UI con dos cuentas |
| N13, lecturas 0/4 y 502 intermitente | No reproducido de forma determinista; sigue siendo observación de operación |
| N14, error pegado en `/resumen-evento` | Fuera de esta ronda de mensajería; no se declara corregido |
| N4, respuestas vacías Copilot | El flujo de chat probado ya devuelve contenido; Copilot embebido no recibió batería completa de todos sus dominios |
| N5–N9, presupuesto/pagos/costes | Fuera del cambio de mensajería; deben mantenerse en el backlog de AppEventos |

## 6. WhatsApp, comunicación entre usuarios y enlaces públicos

Se revisaron los puntos de entrada de bandeja, conversaciones, sesiones, participantes, mensajes, notificaciones y tiempo real. Las operaciones de mensaje ahora verifican primero la sesión o conversación padre y su tenant. La búsqueda, actualización, borrado y marcado de leído ya no aceptan actor libre.

Lo que todavía necesita una jornada específica con recursos externos:

1. Enlazar un número WhatsApp de prueba mediante QR.
2. Autorizar un destinatario controlado.
3. Probar envío, recepción, deduplicación, reintento y asociación con conversación.
4. Probar dos usuarios reales del mismo tenant: A comparte o asigna conversación a B, B la recibe, un tercero C no puede leerla.
5. Probar el enlace público desde una sesión nueva sin credenciales y verificar exactamente qué campos quedan expuestos.

Las rutas antiguas propias con el nombre retirado responden 404 y la UI activa usa el nombre nuevo. Persisten referencias técnicas de terceros `@lobechat/*`, documentos históricos, licencia/changelog upstream y aliases GraphQL de migración como `createLobeSession`/`LOBE_CHAT`. Quitarlos exige una migración de contrato y datos con inventario de consumidores; no deben confundirse con una pantalla activa.

## 7. Estado operativo y reinicio en Mac Mini

Artefactos desplegados:

- AppEventos: `.next-app-20260914b`, puerto 3220, PM2 `app-dev`.
- Chat: `.next-chat-20260914e`, puerto 3210, PM2 `chat-dev`.
- Ambos procesos están `online` y la configuración de PM2 quedó guardada.

Reinicio habitual:

```bash
ssh mac-mini
pm2 restart app-dev
pm2 restart chat-dev
pm2 save
pm2 status
```

Recompilación segura: crear un directorio de build nuevo, validarlo en un puerto candidato, cambiar `/Users/juancarlosparra/.pm2-scripts/start-app.sh` o `start-chat.sh`, reiniciar PM2 y verificar las URLs públicas. No hace falta instalar Codex en el Mac Mini para operar el servicio; SSH desde este MacBook Pro es suficiente.

## 8. Riesgos y tareas pendientes

| Prioridad | Tarea | Depende de |
|---|---|---|
| Alta | Crear/verificar una cuenta Firebase de pruebas para Eventos Organizador y repetir la batería autenticada | Administración de identidad de esa marca |
| Alta | E2E de logout A→B para N10/N11/N12/N15 | Segunda cuenta válida en la misma marca |
| Alta | E2E de dos usuarios, transferencia/compartición y aislamiento de tercero | Dos o tres cuentas válidas y definición exacta del flujo UX |
| Alta | Envío/recepción WhatsApp real | Número enlazado por QR y destinatario autorizado |
| Media | E2E de enlace público y minimización de campos | URL pública de prueba y criterio funcional |
| Media | Resolver handles abiertos del runner de API-MCP | Equipo API-MCP |
| Media | Añadir timeout de apagado de WebSockets en API-IA | Equipo API-IA/operación |
| Media | Investigar N13 con correlación de proxy, API y trace ID si reaparece | Observabilidad |
| Separada | N14 y N5–N9 de AppEventos | Equipo de frontend de AppEventos |

## 9. Criterio de cierre

El núcleo de mensajería se considera resuelto cuando se mantiene lo ya aprobado y se completan las pruebas externas pendientes sin regresiones:

- JWT verificado define actor y tenant.
- Usuario A no lee eventos, sesiones, mensajes ni notificaciones de B.
- Respuesta del agente aparece y persiste después de recargar.
- Logout elimina identidad, evento y sesiones locales anteriores.
- Dos usuarios comparten solo la conversación autorizada.
- El enlace público expone únicamente el contrato público.
- WhatsApp envía y recibe con un número de pruebas, sin duplicados y con trazabilidad.
- La batería se repite en Bodas de Hoy y Eventos Organizador.
