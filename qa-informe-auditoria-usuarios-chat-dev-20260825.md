# Auditoria real de usuarios en chat-dev

## Cabecera

- Fecha: 2026-08-25
- Entorno: `https://chat-dev.bodasdehoy.com`
- Usuarios objetivo:
  - `bodasdehoy.com@gmail.com`
  - `jcc@bodasdehoy.com`
  - `jcc@marketingsoluciones.com`
- Metodo: navegador real + comprobaciones de red con `curl`
- Estado de la ejecucion: bloqueada por inestabilidad de entorno/sesion

## Resumen ejecutivo

- La auditoria profunda comparativa no pudo completarse porque `chat-dev` presento respuestas inconsistentes entre `200`, `502`, `530` y error Cloudflare `1033`.
- En navegador, una sesion que llego a `/asistente` termino en `Application error: a client-side exception has occurred while loading chat-dev.bodasdehoy.com`.
- Se observaron errores de consola compatibles con ruptura de sesion/carga parcial:
  - `API2 error response: 502`
  - `Error guardando configuración en API: 530`
  - `ChunkLoadError: Loading chunk 46814 failed`
  - `Error: Connection closed`
- Mientras el entorno este asi, no es fiable sacar conclusiones sobre permisos o diferencias funcionales entre los tres usuarios.

## Evidencia recopilada

- `curl -I https://chat-dev.bodasdehoy.com/` -> `HTTP/2 200`
- `curl -I https://chat-dev.bodasdehoy.com/login` -> `HTTP/2 200`
- `curl -I https://chat-dev.bodasdehoy.com/asistente` -> `HTTP/2 200`
- `curl -I https://chat-dev.bodasdehoy.com/agentes` -> `HTTP/2 200`
- En pruebas anteriores inmediatas del mismo entorno se obtuvieron:
  - `HTTP/2 530`
  - `Cloudflare Tunnel error 1033`
  - `Bad gateway 502`

## Hallazgos tecnicos

| ID | Hallazgo | Severidad | Origen probable | Impacto |
|---|---|---|---|---|
| A1 | El entorno responde de forma no determinista con `200/502/530/1033` en minutos consecutivos. | P0 | Infraestructura / edge / tunnel | Bloquea auditoria fiable y rompe navegacion real. |
| A2 | La sesion del navegador cae en error cliente al cargar `/asistente`. | P0 | Front + dependencias de carga + entorno inestable | Impide validar rail, bandeja, agentes y permisos por usuario. |
| A3 | Se produce `ChunkLoadError` y fallo de sincronizacion de identidad. | Mayor | Front / despliegue de assets / cache / edge | Riesgo de sesiones corruptas y resultados falsos en QA. |
| A4 | Aparecen `API2 error response: 502` y `Error guardando configuración en API: 530`. | Mayor | Backend/edge | Rompe persistencia y sesion durante la auditoria. |
| A5 | El navegador registra `Error: Connection closed` mientras aun hay assets descargando. | Mayor | Conectividad app / SSE / edge / backend | La app queda inutilizable aunque la ruta base devuelva `200`. |

## Alcance realmente ejecutado

- Se validaron cabeceras HTTP en `login`, `asistente` y `agentes`.
- Se abrio navegacion real en el navegador integrado.
- Se aislo una sesion nueva para evitar contaminacion de la anterior.
- Se recogieron trazas de red y consola.
- Se intento continuar con la auditoria del owner antes de comparar usuarios, pero el entorno no quedo estable.

## No concluyente por bloqueo

- Comparativa real entre:
  - `bodasdehoy.com@gmail.com`
  - `jcc@bodasdehoy.com`
  - `jcc@marketingsoluciones.com`
- Diferencias de permisos, eventos visibles, rail, bandeja, agentes, archivos y knowledge por usuario.
- Validacion robusta de login, persistencia de sesion y datos visibles por rol.

## Recomendacion

- Repetir la auditoria solo cuando `chat-dev` mantenga estabilidad sostenida en navegador real durante una sesion completa.
- Como criterio minimo previo:
  - `login` sin `502/530`
  - sin `1033`
  - sin `ChunkLoadError`
  - sin `Application error` en `/asistente`
  - sin `Connection closed` en consola al entrar
