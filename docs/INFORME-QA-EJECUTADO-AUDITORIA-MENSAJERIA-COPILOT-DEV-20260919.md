# Informe QA ejecutado y auditoría — mensajería, WhatsApp y Copilot DEV

**Fecha de ejecución:** 19-09-2026  
**Entorno:** DEV  
**Navegador:** WebKit, Playwright 1.57.0, ejecución desde MacBook Pro  
**Servidor de despliegue:** Mac mini  
**Resultado global:** **NO APTO** para dar por cerrados permisos y estanqueidad. El rediseño visual principal funciona, pero existe una fuga cross-tenant reproducida y el aislamiento del WhatsApp QR personal no está implementado como frontera de backend.

## 1. Baseline auditado

| Componente | Baseline observado | Estado |
|---|---|---|
| AppBodasdehoy | base `07431269`, rama `dev` | 21 ficheros modificados (633+/307-) y varios fuentes nuevos sin commit |
| Chat DEV | `.next-chat-20260919b`, `BUILD_ID=Tbm_o9Sf8p6iE5ULC3PUO` | online; el build contiene cambios no versionados |
| API-IA | `1da10dd`, rama `main` | limpio |
| API-MCP | `f43908a6`, rama `dev` | limpio; compilado 19-09 16:54 UTC; salud OK |

El build de Chat DEV no es reproducible desde el commit registrado: su comportamiento depende del árbol sin commit del Mac mini. Esto no causó la fuga principal, pero impide reconstruir con certeza la versión auditada.

## 2. Identidades, marcas y URLs usadas

| Alias | Usuario real usado | URL |
|---|---|---|
| BDH-A | `bodasdehoy.com@gmail.com` | `https://chat-dev.bodasdehoy.com` |
| BDH-B | `jcc@bodasdehoy.com` | `https://chat-dev.bodasdehoy.com` |
| BDH-A contra Eventos | `bodasdehoy.com@gmail.com` | recursos `eventosorganizador` y `https://chat-dev.eventosorganizador.com` |
| Visitante BDH | sin sesión | `/asistente` |
| Visitante Eventos | sin sesión | `https://chat-dev.eventosorganizador.com/asistente` |

Fuente local de credenciales: `.env.e2e.dev` en la raíz del monorepo. Se encontraron las cuentas BDH-A, BDH-B y `jcc@marketingsoluciones.com`. No se encontró una credencial válida `@eventosorganizador.com`; por eso el recorrido autenticado completo de esa segunda marca queda **bloqueado**, no aprobado. No se imprimieron contraseñas, JWT ni secretos.

## 3. Resumen ejecutivo de hallazgos

### P0 — fuga entre marcas en rutas REST de WhatsApp

Con JWT Firebase real de **Bodas de Hoy**:

- `GET /api/messages/whatsapp/session/eventosorganizador` devuelve **200** y revela que existe la sesión, su estado y que tiene número de teléfono;
- `GET /api/messages/whatsapp/conversations/eventosorganizador` devuelve **200**, **5 conversaciones** y campos personales;
- las cinco lecturas de mensajes ensayadas devolvieron `200` aunque estaban vacías; tampoco aplicaron la política `403`;
- las mismas rutas sin token, pasando por el frontend, devuelven `401`.

Esto demuestra que autenticación y autorización están confundidas: el usuario debe estar autenticado, pero API-MCP no compara el `sessionKey` solicitado con la marca derivada de su JWT.

La causa está en `/var/www/api-production/src/routes/api.ts:2722-2895`: sesión, inicio, desconexión, pairing, SSE, conversaciones y mensajes usan directamente `req.params.sessionKey`. El router general se monta sin el gate de identidad aplicado a los routers MCP. El reverse proxy público rechaza peticiones anónimas directas, pero un JWT válido de otra marca llega y obtiene datos.

### P1 — el WhatsApp QR personal no está aislado

El frontend tiene un mapa provisional de propietario por correo en `apps/chat-ia/.../bandeja/utils/qrOwner.ts:27-30`. El propio fichero reconoce que es un candado visual.

Resultado real con BDH-B (`jcc@bodasdehoy.com`):

- la lista mostró **8 candados QR**;
- al abrir una fila con candado, la cabecera mostró **Compartir**, con dos controles accesibles y sin estado `disabled`;
- la captura confirma que la conversación y sus mensajes son legibles.

Causa del desacuerdo lista/cabecera:

- la cabecera decide con `conversation.channelType` en `ConversationHeader.tsx:165-168`;
- el normalizador solo lee `channelType/channel_type` en `data/conversations.ts:101-103`;
- el REST de API-MCP devuelve documentos con `channelId`, pero no `channelType` ni `channelInfo`;
- `comparticionBloqueada(null)` devuelve `false` en `qrOwner.ts:67-72`, por lo que un dato ausente abre la compartición.

Además, `shareConversation` en API-MCP (`src/graphql/resolvers/whatsapp.ts:1451-1475`) exige acceso de respuesta, pero no que el actor sea dueño o administrador del canal QR. No se ejecutó una mutación contra datos reales porque cambiaría permisos ajenos; la ausencia del control está confirmada por código.

### P1 — error GraphQL por estado `ARCHIVED`

Las dos cuentas registraron en consola:

`Enum "WhatsAppChannelStatus" cannot represent value: "ARCHIVED"`.

`formatChannel` convierte cualquier valor de Mongo a mayúsculas (`resolvers/whatsapp.ts:52-58`), mientras el enum solo permite `ACTIVE`, `CONNECTING`, `DISCONNECTED` y `ERROR` (`typeDefs/whatsapp.ts:548-553`). El modelo también define esos cuatro estados, así que `ARCHIVED` es un dato legacy o escrito fuera de validación. La corrección adecuada es sanear/mapear el valor al leer y limpiar el dato, no ampliar el dominio sin una decisión funcional.

### P1 — compartir por enlace público una conversación WhatsApp no está implementado

API-MCP tiene enlaces públicos para el recurso `CHAT`, pero opera sobre el modelo `Chat`, no sobre `WhatsAppConversation`, y su proyección pública de CHAT devuelve metadatos básicos, no mensajes. No se encontró integración de `generatePublicLink` en la bandeja.

Por tanto existen dos capacidades distintas:

1. compartir una conversación WhatsApp con usuario/equipo mediante `shared_with`;
2. crear un enlace público genérico para un `Chat`.

No existe hoy un flujo auditado que genere una URL pública para una conversación WhatsApp o un mensaje concreto. Si esa es la función esperada por producto, es un gap real y debe tener contrato, permisos, caducidad, revocación y proyección propios.

### P1 — build Chat DEV no reproducible

El build vivo incorpora cambios fuente no versionados. Un fallo corregido en el directorio de trabajo puede desaparecer en el siguiente despliegue o no llegar a otro equipo. Antes de revalidar debe existir un commit acotado y un `BUILD_ID` derivado de él.

## 4. Matriz de pruebas ejecutadas

### Autenticación y tenant

| ID | Prueba | Usuario | Resultado real | Veredicto |
|---|---|---|---|---|
| AUTH-01 | JWT con firma inventada, BDH | sintético | `401` | PASA |
| AUTH-02 | sin token, BDH/Eventos | anónimo | `401` | PASA |
| AUTH-03 | JWT caducado | sintético | `401` | PASA |
| AUTH-04 | JWT inventado directo a API-IA | sintético | `401` | PASA |
| TEN-01 | query `development=eventosorganizador` | BDH-A y BDH-B | `403` | PASA |
| TEN-02 | `X-Development: eventosorganizador` | BDH-A y BDH-B | `403` | PASA |
| TEN-03 | `X-Development: champagne-events` | BDH-A y BDH-B | `403` | PASA |
| TEN-04 | host Eventos con JWT BDH | BDH-A y BDH-B | `403` | PASA |
| TEN-05 | sesión WhatsApp Eventos | BDH-A | `200`, estado y presencia de teléfono | **FALLA P0** |
| TEN-06 | conversaciones WhatsApp Eventos | BDH-A | `200`, 5 filas con campos personales | **FALLA P0** |
| TEN-07 | mensajes de 5 conversaciones Eventos | BDH-A | cinco `200`, cero mensajes | FALLA política; sin contenido filtrado en esta muestra |
| TEN-08 | SSE Eventos | BDH-A | prueba dinámica agotó timeout; código sin control tenant | NO CONCLUYENTE en runtime / FALLA auditoría |
| TEN-09 | start/pairing/delete ajenos | no ejecutado | requieren sesión desechable | BLOQUEADO POR FIXTURE |

La sospecha original de que un JWT fabricado podía atravesar todo el sistema queda descartada: API-IA verifica firma Firebase. El problema crítico está después, en las rutas REST de API-MCP que aceptan cualquier tenant solicitado por un usuario ya autenticado.

### Misma marca, QR y compartición

| ID | Prueba | Resultado | Veredicto |
|---|---|---|---|
| OWN-01 | lista agregada BDH-A vs BDH-B | 20/20 hashes iguales; intersección 20 | confirma bandeja común actual |
| OWN-02 | candado visual para BDH-B | 8 filas con `🔒` | PASA en lista |
| OWN-03 | abrir una fila QR bloqueada | conversación legible y botón Compartir visible | **FALLA P1** |
| OWN-04 | dueño BDH-A | cero candados en la vista inicial | consistente con mapa provisional |
| OWN-05 | `shareConversation` exige owner QR | no existe comprobación en resolver | **FALLA P1 por código** |
| OWN-06 | tests unitarios del candado | 14/14 | pasan, pero solo cubren el helper cliente |

La igualdad de bandejas puede ser correcta para WABA de empresa. No es aceptable para `QR_USER` personal hasta que el backend persista owner y filtre lectura, respuesta y compartición.

### Copilot, tema y navegación

| ID | Prueba | Resultado | Veredicto |
|---|---|---|---|
| UI-01 | login BDH-A y BDH-B | correcto | PASA |
| UI-02 | carril con 5 destinos | presentes | PASA |
| UI-03 | Chat: Copilot, Mis asistentes, crear/nueva/buscar/saldo | presentes | PASA visual |
| UI-04 | búsqueda por `QA-verif-437942` | encuentra objetivo y oculta no coincidentes | PASA |
| UI-05 | Resumen | muestra “Resumen del día”, oculta nueva/búsqueda, conserva Copilot/saldo | PASA |
| UI-06 | color antiguo `rgb(124,58,237)` | 0 elementos | PASA |
| UI-07 | automático con sistema oscuro | `data-b-theme=dark`, fondo negro, 0/9 paneles blancos | PASA |
| UI-08 | claro forzado con sistema oscuro | `data-b-theme=light`, fondo claro | PASA |
| UI-09 | visitante | muestra usuario no registrado; clic abre diálogo de login con password | PASA |
| UI-10 | volver al organizador | `https://app-dev.bodasdehoy.com` | PASA |
| UI-11 | `/wedding-creator` | `200` | PASA |
| UI-12 | `/admin` | `200`, redirige a `/settings/billing` | PASA |
| UI-13 | Eventos visitante | muestra “Eventos Organizador”, pero `<title>` sigue diciendo Bodas de Hoy | **FALLA P2 marca** |
| UI-14 | Eventos autenticado | falta EVT-A real | BLOQUEADO |
| UI-15 | crear asistente/nueva conversación con limpieza | no hay fixture/cleanup determinista | PENDIENTE |
| UI-16 | destello de tema forzado | no medido cuadro a cuadro | PENDIENTE |

### Regresión y pruebas técnicas

- `route.test.ts`, `qrOwner.test.ts`, `brandTheme.test.ts`: **26/26 tests pasan**.
- Esos tests no cubren autorización REST de API-MCP, persistencia del owner ni el contrato completo lista/cabecera.
- El `tsc --noEmit` de API-MCP no pudo ejecutarse porque el checkout desplegado no contiene `node_modules/.bin/tsc`. La API compilada está online y su `/health` responde OK.
- La UI generó un `400` por el enum `ARCHIVED`, warnings de iframe Firebase y agotamiento de contextos WebGL. El enum es el error funcional relevante.

## 5. Auditoría de arquitectura

### Lo que sí protege correctamente

- El proxy Next rechaza ausencia de token, formato inválido y caducidad antes de reenviar.
- API-IA valida criptográficamente Firebase y contrasta el development pedido; las manipulaciones por query, cabecera y host dieron `403`.
- GraphQL de API-MCP usa `resolveDualAuth` y varios resolvers llaman `requireWhatsAppDevelopment`/`requireConversationAccess`.
- Los enlaces públicos genéricos generan tokens criptográficos, comprueban expiración/límite y proyectan un conjunto reducido de campos.

### Lo que rompe el modelo

1. Las rutas REST `/api/whatsapp/*` no comparten el gate de GraphQL/MCP.
2. El frontend reenvía `X-Development` del cliente y un JWT real, pero no puede ser la frontera de seguridad.
3. La propiedad QR está hardcodeada por email y no vive en `WhatsAppChannel.owner.userId` para la sesión real.
4. La lista y la cabecera no consumen el mismo objeto enriquecido; el dato ausente se interpreta como compartible.
5. Se devuelven documentos Mongo de conversaciones casi completos desde REST, ampliando el impacto de cualquier error de scoping.
6. No hay pruebas automáticas de tenant para las rutas REST WhatsApp.
7. El canal legacy `ARCHIVED` puede tumbar una query GraphQL completa.
8. “Compartir con usuario/equipo” y “enlace público” no tienen un contrato de producto unificado para WhatsApp.

## 6. Cambios exigidos al equipo

### API-MCP — prioridad inmediata

1. Crear una única guarda REST para WhatsApp que:
   - verifique JWT o secreto interno;
   - derive development y UID de la identidad validada;
   - compare el tenant derivado con `sessionKey`;
   - para `*_user_*`, valide owner o membership y el permiso requerido;
   - ignore identidad/rol enviados por el cliente.
2. Aplicarla a `session GET/start/DELETE/pairing-code`, `events`, `conversations`, `messages` y cualquier reply/send no exclusivamente interno.
3. Responder `403` antes de consultar estado, Mongo o abrir el stream.
4. Devolver DTOs/proyecciones, no documentos Mongo completos.
5. Al crear/vincular QR, crear/actualizar `WhatsAppChannel` con `type=qr_user`, `owner.type=user`, `owner.userId=<uid>` y `qr.sessionKey` canónico.
6. En `shareConversation`, cargar el canal y exigir owner/admin; validar también el principal destino y su marca.
7. Sanear `WhatsAppChannel.status`: mapear valores legacy desconocidos a `DISCONNECTED` o corregir la migración; limpiar `ARCHIVED` de la colección.
8. Añadir tests de integración para la matriz TEN y OWN antes de desplegar.

### Frontend Chat DEV

1. Eliminar `DUENOS_QR` y consumir owner/capacidades del backend.
2. Hacer que lista y cabecera usen el mismo objeto o store; no refetch sin `channelType`.
3. Tratar canal WhatsApp de tipo desconocido como no compartible hasta resolverlo.
4. Ocultar lectura/respuesta además del botón de compartir cuando el backend niegue acceso.
5. Corregir metadatos/título de Eventos Organizador.
6. Versionar los cambios actuales y reconstruir Chat DEV desde commit limpio.

### API-IA

No se observó el bypass de firma/tenant planteado por el plan original. Debe conservar sus validaciones actuales. La consolidación futura de las rutas WhatsApp en API-IA solo se acepta si mantiene la guarda central y no vuelve a confiar en query/cabeceras del cliente.

## 7. Pruebas de aceptación después de corregir

La corrección no se da por terminada hasta obtener:

- `403` en TEN-05, TEN-06, TEN-07 y TEN-08 con JWT BDH contra Eventos;
- `403` en start/pairing/delete cross-tenant sin cambiar la sesión;
- BDH-B no recibe filas ni mensajes de QR_USER de BDH-A antes de compartir;
- `view` permite leer pero no responder/re-compartir; `reply` permite responder;
- `shareConversation` del no dueño falla aunque se llame directamente;
- SSE entrega solo eventos de canales autorizados y no duplica tras reconexión;
- `getWhatsAppChannels` no devuelve error por `ARCHIVED`;
- recorrido WebKit autenticado en Bodas de Hoy y Eventos Organizador;
- build DEV identificable por commit, árbol limpio y pruebas automatizadas verdes.

## 8. Evidencia local generada

Directorio: `/tmp/qa-mensajeria-20260919/`

- `security-focused.json`: respuestas saneadas de sesión/conversaciones cross-tenant;
- `lock-detail.json`: fila QR bloqueada y controles de la cabecera;
- `auth-ui.json`, `ui-focused.json`: tema, búsqueda, rutas y multimarca;
- `BDH-B-private-open.png`: reproducción visual del acceso a una conversación marcada como privada;
- traces, vídeos y capturas WebKit de ambas cuentas.

Las capturas contienen datos DEV visibles y se mantienen fuera de Git. Los JSON saneados no contienen JWT ni contraseñas.
