# Entrega pública QA — app-dev — 2026-07-06

## Resumen ejecutivo

Se reejecutaron las pruebas principales de login, home, `Momentos`, cuenta secundaria y login inválido sobre `app-dev.bodasdehoy.com`.

## Estado actual

- `bodasdehoy.com@gmail.com`:
  - login correcto
  - en la reronda más reciente vuelve a cargar eventos en home
  - siguen apareciendo errores `502` en `api/proxy-bodas/graphql` y `api/notifications`
  - conclusión: el owner mejora visualmente, pero la sesión sigue inestable o degradada

- Botón `Continuar con Google`:
  - abre correctamente el flujo hacia Google Accounts
  - no parece ser el origen principal del problema

- `Momentos`:
  - sigue fallando
  - la vista autenticada publica una URL de portal
  - al abrir `Ver portal`, la página pública responde:
    - `No se pudo cargar el evento`
    - `Comprueba el enlace o pide el correcto a los organizadores.`

- `jcc@bodasdehoy.com`:
  - login correcto
  - home correcta
  - persiste un problema de permisos/contexto
  - al abrir el evento compartido `Boda de Isabel & Raúl`, la app aterriza en `/servicios` con affordances de edición visibles como `Duplicar`, `borrar`, `Editar` y `Agregar archivo`

- `jcc@marketingsoluciones.com`:
  - el login inválido sigue rechazándose correctamente
  - comportamiento esperado

## Lectura técnica consolidada

Los problemas más sólidos que siguen activos tras la reejecución son:

1. `Momentos` publica o abre un portal público roto
2. el evento compartido del secundario expone contexto de edición impropio
3. la cuenta owner sigue mostrando señales de degradación backend aunque la home ya vuelva a cargar eventos

## Prioridad de revisión

1. revisar el handoff post-auth entre Firebase y sesión app
2. revisar `api/proxy-bodas/graphql` por los `502`
3. revisar `api/notifications` por los `502`
4. revisar el binding del evento activo en `Momentos`
5. revisar el aislamiento de permisos/contexto en eventos compartidos

## Nota

Este documento está preparado para compartirse como referencia pública simple. Las evidencias detalladas, capturas y JSON de soporte permanecen en la entrega interna de QA.
