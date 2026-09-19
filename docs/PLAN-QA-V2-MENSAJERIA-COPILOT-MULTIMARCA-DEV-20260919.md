# Plan QA v2 — mensajería, WhatsApp, permisos, Copilot y multimarca DEV

**Fecha:** 19-09-2026  
**Ámbito:** `chat-dev.*`, API-IA y API-MCP. Solo DEV.  
**Navegador obligatorio:** WebKit.  
**Propósito:** verificar autenticación, aislamiento entre marcas y usuarios, propiedad de WhatsApp QR, compartición, enlaces públicos, tiempo real y el rediseño del Copilot con pruebas reproducibles.

## 1. Baseline obligatorio

Antes de probar se registra:

- commit de AppBodasdehoy, API-IA y API-MCP;
- `BUILD_ID` servido por `chat-dev` y directorio `.next-*` activo;
- estado `git status --short`; un build creado desde cambios sin commit se marca **no reproducible**;
- estado y reinicios de PM2/systemd, salud de API-IA y API-MCP;
- fecha, hora, máquina ejecutora, WebKit y URL exacta.

No se aprueba una versión si el código fuente que produjo el build no puede reconstruirse desde un commit identificado.

## 2. Cuentas y marcas

Las credenciales se cargan localmente desde `.env.e2e.dev` o `.env.e2e.dev.local`; nunca se copian al informe.

| Alias | Cuenta | Marca | Uso |
|---|---|---|---|
| BDH-A | `bodasdehoy.com@gmail.com` | bodasdehoy | dueño provisional del QR y control positivo |
| BDH-B | `jcc@bodasdehoy.com` | bodasdehoy | segundo usuario de la misma marca |
| MKT-A | `jcc@marketingsoluciones.com` | marketingsoluciones | tercera identidad disponible; no sustituye una cuenta de Eventos Organizador |
| EVT-A | cuenta real `@eventosorganizador.com` | eventosorganizador | obligatoria para las pruebas autenticadas de la segunda marca |

Si EVT-A no existe en el fichero local, las pruebas autenticadas de Eventos se entregan como **BLOQUEADAS**, no como aprobadas. Las pruebas negativas desde una cuenta BDH contra recursos de Eventos sí se ejecutan.

Dominios mínimos:

- `https://chat-dev.bodasdehoy.com`
- `https://app-dev.bodasdehoy.com`
- `https://chat-dev.eventosorganizador.com`
- `https://app-dev.eventosorganizador.com`
- `https://api3-ia.eventosorganizador.com`
- `https://api-mcp.eventosorganizador.com`

## 3. Datos de prueba controlados

Preparar en DEV, con nombres `QA-<fecha>-<id>` y procedimiento de limpieza:

1. un canal WABA de empresa;
2. un canal QR de usuario propiedad de BDH-A;
3. una conversación QR con al menos dos mensajes no sensibles;
4. una conversación WABA con al menos dos mensajes;
5. una conversación compartida de BDH-A a BDH-B con permiso `view`;
6. otra con permiso `reply`;
7. un chat apto para crear, abrir, expirar y revocar un enlace público;
8. equivalentes mínimos para EVT-A.

Las pruebas destructivas de iniciar, desvincular o pedir pairing code solo se ejecutan sobre esa sesión desechable.

## 4. Evidencia y privacidad

Por caso se entrega: ID, usuario, URL, método, estado esperado, estado real, hora, captura/trace o respuesta saneada y conclusión. Se permiten correos de las cuentas QA; se eliminan JWT, contraseñas, secretos internos, números de teléfono, nombres de contactos y contenido de mensajes. Los identificadores se sustituyen por hash SHA-256 corto.

## 5. Casos de prueba

### Gate A — autenticación real

| ID | Acción | Esperado |
|---|---|---|
| AUTH-01 | `GET /api/messages/conversations` sin credenciales | `401` |
| AUTH-02 | JWT de tres segmentos con firma inventada y `exp` futuro | `401` o `403` |
| AUTH-03 | JWT válido pero caducado | `401` |
| AUTH-04 | JWT real de cada cuenta | `200` solo en su marca |
| AUTH-05 | repetir AUTH-01/02 contra API-IA y API-MCP directas | nunca datos; `401/403` |
| AUTH-06 | token en query para EventSource | firma y caducidad verificadas por backend; no basta el gate estructural del proxy |

Un `200` en AUTH-01/02 detiene la batería.

### Gate B — aislamiento entre marcas en todas las rutas WhatsApp REST

Usar JWT real de BDH y solicitar `eventosorganizador` y viceversa.

| ID | Ruta | Esperado |
|---|---|---|
| TEN-01 | `/api/messages/conversations?development=eventosorganizador` | `403` |
| TEN-02 | misma ruta con `X-Development` manipulado | `403` |
| TEN-03 | host `chat-dev.eventosorganizador.com` con JWT BDH | `403` |
| TEN-04 | `GET /whatsapp/session/:sessionKey` | `403` sin cuerpo de sesión |
| TEN-05 | `GET /whatsapp/conversations/:sessionKey` | `403`, cero filas |
| TEN-06 | `GET /whatsapp/conversations/:sessionKey/:id/messages` | `403`, cero mensajes |
| TEN-07 | `GET /whatsapp/events/:sessionKey` | conexión rechazada antes de abrir SSE |
| TEN-08 | `POST .../start` sobre fixture ajena | `403`; no crea QR |
| TEN-09 | `POST .../pairing-code` sobre fixture ajena | `403`; no genera código |
| TEN-10 | `DELETE .../session/:sessionKey` sobre fixture ajena | `403`; no desconecta |

La autorización se valida en API-MCP mediante una función común. No se acepta corregir solo TEN-04/TEN-05.

### Bloque C — usuarios de la misma marca y propiedad del canal

| ID | Acción | Esperado |
|---|---|---|
| OWN-01 | comparar BDH-A y BDH-B en WABA | ambos ven la bandeja de empresa |
| OWN-02 | comparar BDH-A y BDH-B en QR_USER | solo el dueño lo ve hasta compartirlo |
| OWN-03 | BDH-B abre una fila QR ajena | no recibe mensajes ni controles de responder/compartir |
| OWN-04 | BDH-A comparte QR con BDH-B (`view`) | BDH-B puede leer, no responder ni re-compartir |
| OWN-05 | permiso `reply` | BDH-B puede responder; no administrar miembros salvo permiso explícito |
| OWN-06 | usuario no dueño llama `shareConversation` a mano | error de autorización |
| OWN-07 | canal QR sin owner o `channelType` | cerrar por defecto; nunca convertirlo en WABA/compartible |
| OWN-08 | el dueño se deriva de UID persistido al vincular | no hay mapas de correos en frontend |

### Bloque D — compartición y enlace público

| ID | Acción | Esperado |
|---|---|---|
| SHR-01 | compartir y descompartir usuario | cambio visible y persistente tras recarga |
| SHR-02 | compartir con equipo de otra marca | rechazado |
| SHR-03 | principal inexistente | rechazado sin escribir `shared_with` |
| SHR-04 | enlace público CHAT con permiso lectura | abre solo proyección permitida, sin metadatos internos |
| SHR-05 | token inventado, expirado, agotado o revocado | recurso inaccesible |
| SHR-06 | recurso de otra marca con ID manipulado | no se genera enlace |
| SHR-07 | usuario sin permiso `share` | mutación rechazada |
| SHR-08 | contenido esperado del enlace | contrato explícito: metadatos o mensajes; no se aprueba una UI que prometa compartir una conversación si el backend solo devuelve metadatos |

Los enlaces públicos `CHAT` y `WhatsAppConversation` son modelos distintos. El informe debe indicar cuál se ha probado.

### Bloque E — socket, SSE y consistencia

| ID | Acción | Esperado |
|---|---|---|
| RT-01 | mensaje entrante en WABA | aparece una vez, orden correcto y contador actualizado |
| RT-02 | mensaje entrante en QR | mismo resultado, respetando permisos del canal |
| RT-03 | cerrar/reabrir red 10 s | reconexión sin duplicados ni pérdida |
| RT-04 | dos pestañas del mismo usuario | no duplica mensajes ni listeners |
| RT-05 | usuario de otra marca escucha SSE manipulado | `403`; cero eventos |
| RT-06 | dos usuarios de la misma marca | solo reciben eventos de canales autorizados |
| RT-07 | estado enviado/entregado/leído/error | transición monotónica y coherente en API y UI |
| RT-08 | canal archivado/legacy | GraphQL nunca falla por enum no representable |

### Bloque F — Copilot, bandeja y tema

- cinco destinos visibles: Resumen, Chat, Mensajes, Momentos y Archivos;
- volver apunta a `app-dev` de la misma marca;
- sección Chat: Copilot, nueva conversación, buscador funcional, Mis asistentes, Crear asistente y saldo;
- sección Resumen cambia el panel, oculta nueva/búsqueda y conserva cabecera/saldo;
- cero uso de `#7C3AED` en el panel;
- visitante muestra su marca y el control abre login;
- tema automático oscuro y tema claro forzado con sistema oscuro;
- `/wedding-creator` y `/admin` funcionan por URL directa;
- Eventos Organizador usa nombre, título, iconos y color de su marca.

Las acciones que crean asistentes se ejecutan con fixture y limpieza; verificar solo la presencia del botón no las aprueba.

## 6. Auditoría de código obligatoria

Revisar en conjunto:

1. proxy Next `/api/messages/[...path]`;
2. autenticación y resolución de tenant en API-IA;
3. rutas REST `/api/whatsapp/*` y contexto GraphQL en API-MCP;
4. modelo `WhatsAppChannel`, owner y miembros;
5. `shareConversation`, `unshareConversation` y filtros de lectura/respuesta;
6. contrato de `channelType/channelInfo` desde backend hasta la cabecera;
7. SSE/listeners y limpieza al cerrar conexiones;
8. enums GraphQL frente a valores reales de Mongo;
9. enlaces públicos, proyección, expiración, revocación y scoping;
10. commits y cambios sin commit de las últimas 12 horas.

## 7. Criterio de cierre

Se da por resuelto cuando:

- todas las rutas WhatsApp leen identidad y tenant de credenciales verificadas;
- las diez pruebas TEN devuelven el resultado esperado;
- QR_USER persiste owner UID y aplica permisos en backend;
- no existe owner hardcodeado en frontend;
- lista, cabecera, mutaciones y SSE usan el mismo contrato de canal;
- `ARCHIVED` no rompe GraphQL;
- compartir, revocar y enlace público tienen pruebas positivas y negativas;
- WebKit pasa en Bodas de Hoy y Eventos Organizador con cuentas reales;
- build DEV procede de commits identificados y el árbol de despliegue está limpio;
- el informe incluye evidencia saneada y no contiene secretos.
