# QA exhaustivo chat-dev - build cjyKA-V2Ezfm7I6o3aCLj

## 1. Cabecera

- Fecha: 2026-08-20
- URL base: https://chat-dev.bodasdehoy.com
- BUILD_ID confirmado: `cjyKA-V2Ezfm7I6o3aCLj`
- Navegador: MCP `integrated_browser` sobre sesion Chromium integrada
- Evidencias: `./qa-evidencias/`
- Consola: `./qa-evidencias/console.log`

### Paso 0 - Guardarrail de build

```text
/asistente BUILD_ID:1 Visitante:0
/agentes BUILD_ID:1 Visitante:0
/bandeja BUILD_ID:1 Visitante:0
/knowledge BUILD_ID:1 Visitante:0
/files BUILD_ID:1 Visitante:0
```

## 2. Resumen

- Severidad: `P0=0`, `mayor=7`, `menor=3`
- Origen: `FRONT=6`, `BACKEND=4`
- Criterio minimo de aprobacion:
  - Paso 0: `OK`
  - B6 round-trip agentes <-> asistente: `OK`
  - B15 regresion P0: `OK en lo observado`
  - B4 sin `Hoy: N msgs`: `OK en bandeja autenticada`
- Veredicto global: `NO APROBADO`

## 3. Tabla por bloque

| Caso | Resultado | Evidencia | Origen | Severidad | Notas |
|---|---|---|---|---|---|
| B0 Build guardrail | ✅ | `qa-evidencias/build-guardrail.txt` | - | - | Las 5 rutas responden con `BUILD_ID:1` y `Visitante:0`. |
| B1 Rail logueado | ✅ | `qa-evidencias/B1-rail-asistente.png` | - | - | Rail visible con `Asistente`, `Bandeja`, `Agentes`, `Biblioteca`, `Momentos`, `Web de boda`; no aparece `Pendientes` ni `Estudio`. |
| B2 Asistente/chat | ⚠️ Parcial | `qa-evidencias/B1-rail-asistente.png`, `qa-evidencias/console.log` | BACKEND | mayor | La carga base funciona y el primer `Hola` llego a responder en streaming en la pasada previa; persiste riesgo en mensajes siguientes y en `¿a qué hora es mi evento?`, alineado con fallo conocido `E/A/F` de backend. |
| B3 Agentes | ❌ | `qa-evidencias/B3-agentes-main.png` | FRONT | mayor | La lista sigue mostrando multiples agentes sin titulo como `Nueva conversacion`, incumpliendo identidad distinguible. `Abrir chat` y round-trip principal si funcionan. |
| B4 Bandeja unificada | ✅ | `qa-evidencias/B4-bandeja-main.png` | - | - | En la bandeja autenticada observada no aparece `Hoy: N msgs`, no se vio chrome duplicado y el chip es `Borradores IA`. |
| B5 Newsletters / ISSUE-002 | ❌ | `qa-evidencias/B5-newsletter-detail.png` | FRONT | mayor | Los informativos aparecen visibles por defecto; al abrir uno se confirma el estado correcto `Canal informativo... solo nota interna` y `Responder` deshabilitado. |
| B6 Round-trip agentes | ✅ | `qa-evidencias/B6-agente-chat-roundtrip.png` | - | - | `Abrir chat` lleva a `/asistente` y `Gestionar agente` devuelve a `/agentes`; `/agentes?agent=<id_inexistente>` cae al primero sin romper. |
| B7 Esperan categorizada | ❌ | `qa-evidencias/B7-esperan.png` | FRONT | mayor | La vista `?view=esperan` no renderiza el agrupado completo esperado; en la observacion quedo esencialmente `Mensajeria`. |
| B8 Fase 4 Copilot | ⚠️ Parcial | `qa-evidencias/B8-sugerir-respuesta-draft.png` | FRONT | menor | En una conversacion real con composer habilitado, `Sugerir respuesta` genera borrador con `Usar` y `Descartar`, y `Resumir conversacion` abre panel/cierre sin inyectar texto en el composer. La validacion exacta no fue sobre un hilo WA normal. |
| B9 Responsable manual | ✅ | `qa-evidencias/B9-responsable-chip.png` | - | - | `POST /api/messages/conversations/{convId}/assign?development=bodasdehoy` devuelve `200`; renderiza badge `Agente QA`, chip `Responsable: Agente QA` y el filtro `?agent=` muestra solo esas conversaciones. Limpieza final ejecutada con `agentId:null`. |
| B10 Biblioteca / files | ⚠️ Parcial | `qa-evidencias/B10-files.png` | BACKEND | mayor | Renderizan las pestanas `📄 Archivos` y `📚 Conocimiento`, pero no se pudo validar subida real a R2 por bloqueo de entorno: `Saldo insuficiente para subir archivos`. No se dejo dato de prueba. |
| B11 Knowledge / ISSUE-005 | ✅ | `qa-evidencias/B11-knowledge.png` | - | - | La ruta logueada carga contenido util (`Base de conocimientos`, filtros, CTA de creacion) y no cae en shell vacio ni spinner infinito. |
| B12 Notificaciones | ❌ | `qa-evidencias/B12-notificaciones-rebote.png`, `qa-evidencias/console.log` | FRONT | mayor | Se renderiza historial y el contador baja de `19` a `18` al abrir una notificacion, pero el click rebota a la bandeja vacia en vez de llevar al detalle asociado. No quedaron visibles `Actual/Pendientes/Historial` como estados claros de navegacion. |
| B13 Footer debug | ✅ | `qa-evidencias/B13-debug-on.png`, `qa-evidencias/B13-debug-off.png` | - | - | `?debug=1` muestra footer; `?debug=0` lo oculta. |
| B14 Guards/auth/SSO | ⚠️ Parcial | `qa-evidencias/B14-invitado-agentes.png`, `qa-evidencias/B14-invitado-files.png`, `qa-evidencias/B14-invitado-knowledge.png` | FRONT | menor | En sesion limpia se observan muros coherentes de invitado con CTA de login en `agentes`, `files` y `knowledge`. No se completo en esta pasada la matriz exhaustiva email/Google/SSO. |
| B15 Regresion P0 | ✅ | `qa-evidencias/build-guardrail.txt`, `qa-evidencias/B1-rail-asistente.png` | - | P0=0 | Recorriendo `/asistente`, `/agentes`, `/bandeja`, `/knowledge` y `/files` autenticado, con navegacion directa y recarga dura verificada al menos en `asistente` y `agentes`, no aparecieron `Visitante`, `Iniciar sesion` ni error boundary. |
| B16 Consola | ❌ | `qa-evidencias/console.log` | BACKEND | mayor | Persisten `JWT token expirado` y `[WA] Error fetching status: Error: HTTP 502`; `cdn-cgi/rum` abortado se considera inocuo. El warning de token en esta sesion integrada sigue siendo relevante para estabilidad. |
| B17 A11y / UX | ❌ | `qa-evidencias/B4-bandeja-main.png` | FRONT | menor | No hay scroll horizontal del body y no se detectaron iconos visibles sin `aria-label`, pero varios objetivos tactiles visibles quedan por debajo de `44px` de alto (`tabs`/chips de 30-38px). |

## 4. Veredicto global

`NO APROBADO` para release en esta pasada QA.

### Bloqueadores priorizados

1. `FRONT` - B3: los agentes sin titulo siguen colapsando en `Nueva conversacion`, rompiendo trazabilidad operativa.
2. `FRONT` - B5: newsletters/estados visibles por defecto, incumpliendo el comportamiento esperado de ocultacion inicial.
3. `FRONT` - B7: la vista `esperan` no categoriza completo por `Mensajeria / Asistente / Servicios / Itinerario / Otras`.
4. `FRONT` - B12: las notificaciones bajan contador pero no llevan al detalle correcto; rebotan a la bandeja.
5. `BACKEND` - B2/B16: inestabilidad conocida de asistente y errores `JWT expirado` / `WA status 502`.
6. `BACKEND` - B10: el entorno no permite validar subida de archivos por `saldo insuficiente`, dejando el flujo R2 sin certificar.

## 5. Criterio de aprobacion solicitado

- `0 P0 en B15`: cumplido en lo observado
- `Paso 0 correcto`: cumplido
- `B4 sin "Hoy: N msgs"`: cumplido en la bandeja autenticada observada
- `B6 round-trip OK`: cumplido

### Conclusión

Aunque el criterio minimo tecnico pedido no reprodujo un P0 visible en esta sesion, el sistema queda `no aprobado` por la cantidad de fallos mayores funcionales en `Agentes`, `Newsletters`, `Esperan`, `Notificaciones` y por la inestabilidad backend aun visible en consola y flujos de mensajeria.
