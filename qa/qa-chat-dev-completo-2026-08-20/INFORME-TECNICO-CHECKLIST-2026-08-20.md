# Informe Tecnico QA Fuerte

| Campo | Valor |
|-------|-------|
| Fecha | 2026-08-20 |
| Entorno | `chat-dev.bodasdehoy.com` |
| Objetivo | Validar el checklist funcional del usuario sobre `Asistente`, `Agentes`, `Bandeja`, `Biblioteca` y estados de acceso |
| Metodo | Navegacion real en navegador, comparando sesion limpia y sesion autenticada ya persistida |
| Evidencias | `qa/qa-chat-dev-completo-2026-08-20/screenshots/`, `console-auth.log`, `report.md` |

## Resumen Ejecutivo

- La entrega anterior era insuficiente para tu checklist; esta version reorganiza los resultados por bloques `0-9`.
- El sistema muestra dos comportamientos distintos segun el contexto:
  - sesion limpia: varias rutas profundas renderizan shell de login sobre la misma URL de producto
  - sesion autenticada: se puede entrar en `Agentes`, `Bandeja` y `Biblioteca`, pero aparecen inconsistencias operativas claras
- Los tres frentes prioritarios para desarrollo son:
  - guard/redirect de acceso y experiencia de sesion
  - operativa real de `Bandeja`, sobre todo conversaciones `WA` no respondibles
  - identidad/operatividad de `Agentes`

## Estado Por Bloques

| Bloque | Objetivo | Estado | Evidencia | Nota tecnica |
|-------|----------|--------|-----------|--------------|
| 0 | Deploy + `BUILD_ID` + `Visitante:0` en `/asistente /agentes /bandeja` | Inconcluso / Riesgo | `asistente-debug.png`, `initial-asistente.png`, `agentes-clean.png`, `bandeja-clean.png` | No pude validar el `BUILD_ID: Nq0FiDc1u67eNxj1LXGU4`. En `?debug=1` aparece `dbg 8a2e882 | sB iT mcp`, que parece identificador debug, no el build solicitado. No vi el literal `Visitante`, pero en sesion limpia si aparece shell no autenticado sobre rutas de producto. |
| 1 | Rail limpio: `Asistente·Bandeja·Agentes·Biblioteca·Momentos·Web` sin `Pendientes` ni `Estudio` | Pass | `qa-agentes-auth.png`, `qa-files-auth.png` | En sesion autenticada el rail visible coincide con ese set. No aparecieron `Pendientes` ni `Estudio` como entradas de rail. |
| 2 | Bandeja unificada: movil=desktop, sin duplicidades, chip `Borradores IA`, usable sin seleccionar evento | Parcial | `qa-bandeja-wa-no-reply.png`, snapshot `bandeja?view=esperan`, `bandeja-clean.png` | Vi `Borradores IA`, filtros por canal y navegacion movil inferior. No validado parity visual total movil/desktop. Si es usable sin evento, pero la experiencia varia mucho entre sesion limpia y autenticada. |
| 3 | `Pendientes` categorizados en `?view=esperan` con `Mensajeria/Servicios/Itinerario/...` | Fail parcial | snapshot `bandeja?view=esperan` | Se vio `Mensajeria 27`, pero no pude confirmar `Servicios`, `Itinerario` ni otras secciones. Con la evidencia actual no se puede dar por cumplido el bloque. |
| 4 | `Sugerir respuesta` + `Resumir` en panel read-only | Fail / Inconcluso | `qa-bandeja-wa-no-reply.png` | Se vio `Resumir conversacion`, pero no aparecio `Sugerir respuesta` en el flujo probado. El detalle abierto estaba bloqueado como canal informativo y no permitia respuesta. |
| 5 | Assign -> badge lista + chip detalle + filtro `?agent=` | Inconcluso | `qa-agentes-auth.png`, `report.md` | No pude verificar asignacion real por falta de shape visible y porque la UI de agentes ya declara dependencias pendientes de backend. |
| 6 | `Agentes`: carga, tabs `Resumen/Config`, `Abrir chat` | Pass con reservas | `qa-agentes-auth.png` | Carga OK, tabs visibles, `Abrir chat` navega a una conversacion real en `Asistente`. Reserva: el listado es muy ambiguo por nombres repetidos. |
| 7 | `Biblioteca (/files)`: `Archivos` + `Conocimiento` | Fail parcial | `qa-files-auth.png`, `qa-knowledge-blank.png` | `Files` muestra `Archivos` y el enlace a `Conocimiento`, pero `/knowledge` queda en shell practicamente vacio y no entrega una experiencia funcional. |
| 8 | Footer debug oculto, solo opt-in `?debug=1` | Pass | `asistente-debug.png` | El footer debug no aparecia en rutas normales; con `?debug=1` si aparece `dbg 8a2e882 | sB iT mcp`. |
| 9 | P0: nunca `Visitante` | Riesgo | `initial-asistente.png`, `agentes-clean.png`, `bandeja-clean.png` | No vi el literal `Visitante`, pero si vi estado de usuario no autenticado y shell de acceso sobre rutas profundas. Si el criterio es "nunca aparentar modo visitante en producto", el riesgo sigue vivo. |

## Hallazgos Prioritarios

### 1. Guard de acceso ambiguo en deep links

- Rutas afectadas: `/agentes`, `/bandeja`, `/files`
- En sesion limpia, no hay redireccion clara a login ni explicacion contextual
- El usuario queda en una URL de producto con shell reducido y CTA de login
- Impacto:
  - confusion operativa
  - falsos positivos de QA
  - sensacion de producto roto o semiautenticado

### 2. `WA` en lista no significa "respondible" en detalle

- Flujo real probado:
  - `Bandeja` -> item `Canal W`
  - detalle -> `Canal informativo (status/newsletter): no admite respuesta externa`
  - `Responder` deshabilitado
- Impacto:
  - rompe el caso de uso central de bandeja
  - el operador no sabe si esta en WhatsApp real, status, newsletter o un pseudo-canal no editable
  - genera exactamente la confusion funcional que has descrito

### 3. `Agentes` no sirve bien como vista operativa porque no identifica

- Se listan `14 agentes`
- Muchos aparecen como `Nueva conversación`
- `Abrir chat` si funciona y abre historial real
- Pero el listado no permite saber:
  - quien es quien
  - cual ha trabajado sobre cada conversacion
  - cual tiene configuracion distinta
  - cual tiene actividad o tareas relevantes

### 4. `Agentes` expone dependencia backend no cerrada

- Texto visible en UI:
  - instrucciones guardadas en nube
  - rendimiento / asignacion de canales / feed en tiempo real pendientes de confirmacion backend
- Impacto:
  - la pantalla parece mas madura de lo que realmente esta
  - dificulta QA y dificulta a negocio diferenciar "feature rota" de "feature aun no soportada"

### 5. `Knowledge` no materializa la promesa de Biblioteca

- `Files` si renderiza una experiencia funcional minima
- `Knowledge` directo queda en shell casi vacio
- Impacto:
  - el usuario entiende que `Biblioteca` tiene dos subdominios funcionales
  - en la practica uno de ellos no entrega experiencia verificable

### 6. Inestabilidad de token/render

- En consola:
  - `JWT token expirado`
  - `NO SE ENCONTRÓ NINGÚN TOKEN`
  - `Minified React error #418`
  - `ERR_ABORTED` a `cdn-cgi/rum`
- Impacto:
  - refuerza la sospecha de estados de sesion inconsistentes
  - contamina pruebas de `Bandeja` y `Agentes`

## Observaciones Utiles Para Desarrollo

### Asistente

- `?debug=1` muestra footer debug y no aparece en modo normal
- `Abrir chat` desde `Agentes` abre una conversacion real con historial
- En la sesion abierta se ve una conversacion vinculada a `bodasdehoy.com@gmail.com`

### Agentes

- Carga sin error boundary visible
- Tabs `Resumen` / `Configuración` visibles
- `Abrir chat` navega correctamente
- El principal fallo no es de apertura, sino de semantica operativa

### Bandeja

- `?view=esperan` si cambia el modo de bandeja
- La categoria visible confirmada fue `Mensajeria`
- El detalle probado de `WA` no era respondible

### Biblioteca

- `Files` muestra:
  - `Archivos`
  - `Conocimiento`
  - bloqueo por saldo insuficiente al subir
  - mensaje de sesion renovada automaticamente
- `Knowledge` no termina de renderizar una experiencia util

## Recomendaciones De Priorizacion

### P1 inmediato

- Corregir semantica de canales en `Bandeja`
- Diferenciar visualmente `WhatsApp respondible` vs `status/newsletter`
- Evitar que un item entre como `W/WA` y abra un detalle solo de nota interna sin contexto previo

### P1 inmediato

- Revisar guard de autenticacion en deep links
- Si el usuario no tiene sesion, redirigir claramente o mostrar una pantalla de acceso contextual de producto
- No dejar shell ambiguo sobre la misma ruta funcional

### P1 inmediato

- Dar identidad operativa a `Agentes`
- Nombre unico
- alias editable
- metadatos visibles de ultima accion / canal / owner / estado

### P2

- Cerrar backend real de canales asignados, rendimiento y feed en `Agentes`
- O esconder/etiquetar claramente como beta/incompleto mientras no este soportado

### P2

- Resolver `Knowledge`
- Si no esta listo, devolver empty state explicito
- Si esta listo, renderizar su contenido y no solo shell

### P2

- Limpiar warnings de token/render que contaminan la navegacion

## Entregables

- Informe base: [report.md](file:///Volumes/HD%20MAC%20BASE/Projects/AppBodasdehoy.com/qa/qa-chat-dev-completo-2026-08-20/report.md)
- Informe checklist fuerte: [INFORME-TECNICO-CHECKLIST-2026-08-20.md](file:///Volumes/HD%20MAC%20BASE/Projects/AppBodasdehoy.com/qa/qa-chat-dev-completo-2026-08-20/INFORME-TECNICO-CHECKLIST-2026-08-20.md)
- Capturas: [screenshots](file:///Volumes/HD%20MAC%20BASE/Projects/AppBodasdehoy.com/qa/qa-chat-dev-completo-2026-08-20/screenshots)
- Consola: [console-auth.log](file:///Volumes/HD%20MAC%20BASE/Projects/AppBodasdehoy.com/qa/qa-chat-dev-completo-2026-08-20/console-auth.log)
