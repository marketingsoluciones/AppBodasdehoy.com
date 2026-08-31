# QA exhaustivo chat-dev - build jIsPcFdK9ZDwKI4Z09fWI

## 1. Cabecera

- Fecha: 2026-08-21
- URL base: https://chat-dev.bodasdehoy.com
- BUILD_ID confirmado: `jIsPcFdK9ZDwKI4Z09fWI`
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

- Severidad: `P0=0`, `mayor=3`, `menor=1`
- Origen: `FRONT=1`, `BACKEND=3`
- Cobertura parcial sin bug confirmado: `B10`, `B14`
- Criterio minimo de aprobacion:
  - Paso 0: `OK`
  - B4 sin `Hoy: N msgs`: `OK`
  - B6 round-trip agentes <-> asistente: `OK`
  - B15 regresion P0: `OK en lo observado`
  - B3 nombres distinguibles: `FAIL`
- Veredicto global: `NO APROBADO`

## 3. Tabla por bloque

| Caso | Resultado | Evidencia | Origen | Severidad | Notas |
|---|---|---|---|---|---|
| B0 Build guardrail | ✅ | `qa-evidencias/build-guardrail-jIsPcFdK.txt` | - | - | Las 5 rutas devuelven `BUILD_ID:1` y `Visitante:0`. |
| B1 Rail logueado | ✅ | `qa-evidencias/B4-bandeja-jIsPcFdK.png` | - | - | Rail visible con `Asistente`, `Bandeja`, `Agentes`, `Biblioteca`, `Momentos`, `Web de boda`; no se observo `Pendientes` ni `Estudio`. El badge de no leidos se vio en `Bandeja`. |
| B2 Asistente/chat | ❌ | `qa-evidencias/B2-asistente-422-jIsPcFdK.png`, `qa-evidencias/console.log` | BACKEND api-ia | mayor | El mensaje entra al DOM como `Enviado`, pero no aparece respuesta en el segundo intento controlado. Consola: `[persistencia] ... POST /chat/messages -> HTTP 422` y `PATCH /chat/messages/tmp_* -> Error actualizando mensaje`. Se clasifica como fallo backend conocido `A/F`. |
| B3 Agentes identidad | ❌ | `qa-evidencias/B3-agentes-identidad-jIsPcFdK.png` | FRONT chat-ia | mayor | Ya no colapsan todos en `Nueva conversacion`, pero siguen existiendo colisiones entre agentes sin titulo, por ejemplo nombres repetidos tipo `Agente 6a7416`. Esto incumple el criterio de nombres distinguibles. El agente con nombre real observado conserva su identidad y el avatar coincide. |
| B4 Bandeja unificada | ✅ | `qa-evidencias/B4-bandeja-jIsPcFdK.png` | - | - | En la bandeja observada no aparece `Hoy: N msgs`, no se vio chrome duplicado y el chip visible es `Borradores IA`. El detalle abre con composer y la ruta funciona en movil/ancho observado durante la pasada. |
| B5 Newsletters | ✅ | `qa-evidencias/B5-newsletters-off-jIsPcFdK.png`, `qa-evidencias/B5-newsletters-on-jIsPcFdK.png`, `qa-evidencias/B5-informativo-detail-jIsPcFdK.png` | - | - | Con el toggle OFF no se ven informativos. Al activarlo aparecen y el detalle muestra `no admite respuesta · solo nota interna` con respuesta deshabilitada. No se reporta falso positivo por persistencia de `inbox_show_spam`. |
| B6 Round-trip agentes | ✅ | `qa-evidencias/B6-roundtrip-jIsPcFdK.png` | - | - | `Abrir chat` lleva a `/asistente` con el agente correcto y `Gestionar agente` devuelve a `/agentes` con el mismo agente preseleccionado. `/agentes?agent=<id_inexistente>` cae al primero sin romper. |
| B7 Esperan | ✅ | `qa-evidencias/B7-esperan-jIsPcFdK.png` | - | - | La vista `?view=esperan` carga y agrupa correctamente lo disponible. En el dataset observado solo aparecio `MENSAJERIA`; no se marca bug porque la spec aclara que las demas secciones solo deben existir si tienen items. No se pudo certificar el caso con datos ricos de `Servicios` o `Itinerario`. |
| B8 Fase 4 Copilot | ✅ | `qa-evidencias/B8-draft-jIsPcFdK.png`, `qa-evidencias/B8-resumen-jIsPcFdK.png` | - | - | `Sugerir respuesta` genero borrador con acciones visibles y `Resumir` abrio panel de solo lectura. El composer no quedo contaminado por el resumen. |
| B9 Responsable manual | ✅ | `qa-evidencias/B9-assign-filter-jIsPcFdK.png`, `qa-evidencias/B9-chip-jIsPcFdK.png` | - | - | `POST /api/messages/conversations/{convId}/assign` devolvio `200`; la lista mostro badge `Agente QA`, el detalle renderizo el chip `Responsable` y el filtro `?agent=` dejo visibles solo esas conversaciones. La limpieza final con `agentId:null` tambien devolvio `200`. |
| B10 Biblioteca / files | ⚠️ Parcial | `qa-evidencias/B10-files-jIsPcFdK.png` | - | - | Se validaron las pestanas `Archivos` y `Conocimiento` y su alternancia sin recarga. No se certifico subida real a R2 porque la cuenta usada no cumplia la precondicion de saldo; `Saldo insuficiente para subir` se considera esperado y no bug. |
| B11 Knowledge | ✅ | `qa-evidencias/B11-knowledge-jIsPcFdK.png` | - | - | `/knowledge` carga contenido real de base de conocimientos y no cae en shell vacio ni spinner infinito. La ruta sigue estable tras recarga dentro de la pagina observada. |
| B12 Notificaciones | ❌ | `qa-evidencias/B12-notif-gap-jIsPcFdK.png` | BACKEND api-ia/api-mcp | mayor | La campana renderiza historial y el contador baja al leer, pero al clicar una notificacion la navegacion aterriza en `/bandeja` general en lugar del detalle enfocado. Se clasifica como gap backend ya conocido por deep-link `focused` ausente. |
| B13 Footer debug | ✅ | `qa-evidencias/B13-debug-on-jIsPcFdK.png`, `qa-evidencias/B13-debug-off-jIsPcFdK.png` | - | - | `?debug=1` muestra el footer y `?debug=0` lo oculta. |
| B14 Guards/auth/SSO | ⚠️ Parcial | `qa-evidencias/B14-invitado-agentes.png`, `qa-evidencias/B14-invitado-files.png`, `qa-evidencias/B14-invitado-knowledge.png` | - | - | En esta build quedo revalidado el lado logueado por `B15`. La matriz completa en sesion limpia para invitado/email/Google/SSO no se reejecuto de forma aislada durante esta pasada; las capturas de invitado existentes son solo referencia previa y no se usan como bug nuevo. |
| B15 Regresion P0 | ✅ | `qa-evidencias/build-guardrail-jIsPcFdK.txt`, `qa-evidencias/B4-bandeja-jIsPcFdK.png`, `qa-evidencias/B11-knowledge-jIsPcFdK.png` | - | P0=0 | Recorriendo `/asistente`, `/agentes`, `/bandeja`, `/knowledge` y `/files` autenticado, con navegacion directa y recargas observadas, no aparecieron `Visitante`, `Iniciar sesion` ni error boundary. |
| B16 Consola | ❌ | `qa-evidencias/console.log` | BACKEND | menor | Persisten `JWT token expirado`, `POST /chat/messages -> HTTP 422`, `PATCH /chat/messages/tmp_* -> Error actualizando mensaje` y `[WA] ... HTTP 502`. `cdn-cgi/rum` y GTM abortados se consideran inocuos. No se observo `React #418` en la pasada cerrada. |

## 4. Veredicto global

`NO APROBADO` para release de este build.

### Bloqueadores priorizados

1. `FRONT` - B3: los agentes sin titulo siguen compartiendo nombres por defecto y rompen la trazabilidad operativa.
2. `BACKEND` - B2: el asistente acepta el envio pero no consolida respuesta fiable en el intento de seguimiento; la consola devuelve `HTTP 422` y errores de `PATCH`.
3. `BACKEND` - B12: las notificaciones reducen el contador pero no abren el detalle correcto.
4. `BACKEND` - B16: la sesion sigue mostrando ruido relevante de estabilidad (`JWT expirado`, `422`, `WA 502`), aunque sin producir un P0 visible en las rutas protegidas.

## 5. Criterio de aprobacion solicitado

- `0 P0 en B15`: cumplido
- `Paso 0 correcto`: cumplido
- `B4 sin "Hoy: N msgs"`: cumplido
- `B6 round-trip OK`: cumplido
- `B3 nombres distinguibles`: no cumplido

### Conclusion

El build `jIsPcFdK9ZDwKI4Z09fWI` mejora frente a la pasada anterior en `Newsletters`, `Esperan` y el round-trip `Agentes <-> Asistente`, pero sigue `NO APROBADO` porque el criterio critico de identidad distinguible en agentes no se cumple y persisten fallos backend visibles en mensajeria y notificaciones.
