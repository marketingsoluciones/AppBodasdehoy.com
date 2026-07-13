# Prompt público · QA chat-dev · Ronda 4 · 14-jul

## Estado actual confirmado

- URL: `https://chat-dev.bodasdehoy.com`
- `BUILD_ID` esperado confirmado en el HTML inicial: `WoWSpZqL1GmHK-CAsBLQO`
- Footer/runtime observado: `dbg 983a9df | sBiTmcp`

## Qué ya se validó

- `/messages` sin login ya **redirige** correctamente a:
  - `https://chat-dev.bodasdehoy.com/login?redirect=/messages`
- `/memories/invalid-qa-r4` ya muestra gate correcto con botón:
  - `Iniciar Sesión`
- `/labs` y `/pendientes` ya **no** enseñan la pantalla antigua `Bodas de Hoy X de 5`, pero siguen mal:
  - quedan prácticamente en blanco, solo con el footer/debug
- `/notifications`, `/profile` y `/changelog` cargan contenido real

## URLs exactas probadas

```text
https://chat-dev.bodasdehoy.com/login
https://chat-dev.bodasdehoy.com/messages
https://chat-dev.bodasdehoy.com/memories/invalid-qa-r4
https://chat-dev.bodasdehoy.com/labs
https://chat-dev.bodasdehoy.com/pendientes
https://chat-dev.bodasdehoy.com/notifications
https://chat-dev.bodasdehoy.com/profile
https://chat-dev.bodasdehoy.com/changelog
```

## Pendiente inmediato

Toda la parte autenticada sigue pendiente porque la contraseña debe escribirla el humano:

```text
- UserPanel > Avanzado
- billing / wallet / modal recarga
- limpieza de query Stripe
- avatar tras cmd+R
- logout y consola limpia
- cuenta paid vs FREE
- deep links settings?active=llm|billing|common
- frecuencia Firebase 10 min
- race conditions
- accesibilidad
- offline / Slow 3G
- multi-pestaña
```

## Prompt copiable para otro agente

```text
Continúa la QA de chat-dev desde este estado previo, sin repetir trabajo ya hecho.

Contexto confirmado:
- URL: https://chat-dev.bodasdehoy.com
- BUILD_ID esperado confirmado: WoWSpZqL1GmHK-CAsBLQO
- Footer/runtime observado: dbg 983a9df | sBiTmcp

Trabajo ya hecho:
- /messages sin login ya redirige a /login?redirect=/messages
- /memories/invalid-qa-r4 ya muestra gate con “Iniciar Sesión”
- /labs y /pendientes ya no muestran “Bodas de Hoy X de 5”, pero siguen mal: quedan casi vacías
- /notifications, /profile y /changelog sí cargan contenido real

URLs exactas:
- https://chat-dev.bodasdehoy.com/login
- https://chat-dev.bodasdehoy.com/messages
- https://chat-dev.bodasdehoy.com/memories/invalid-qa-r4
- https://chat-dev.bodasdehoy.com/labs
- https://chat-dev.bodasdehoy.com/pendientes
- https://chat-dev.bodasdehoy.com/notifications
- https://chat-dev.bodasdehoy.com/profile
- https://chat-dev.bodasdehoy.com/changelog

Qué debes hacer ahora:
1. Pedir al humano que teclee él mismo la contraseña y validar la parte autenticada.
2. Ejecutar:
   - Avanzado en UserPanel
   - billing / wallet / Stripe query cleanup
   - avatar tras cmd+R
   - logout limpio
   - cuenta paid y FREE
   - settings?active=llm|billing|common
   - Firebase 10 min
   - race conditions
   - a11y
   - offline / slow 3G
   - multi-pestaña
3. Mantener numeración desde #26 y no duplicar hallazgos ya cerrados.
```

## Evidencia visual

La versión pública con capturas embebidas se publica como HTML en la misma rama `tj/*` que este archivo.
