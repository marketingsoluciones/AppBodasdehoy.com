# Handoff público · QA chat-dev · Ronda 3 · 14-jul

## Uso rápido

Este documento está pensado para pegarlo en otro agente o equipo que no tiene acceso a esta sesión. Resume qué se probó, qué se vio y qué URLs exactas hay que reabrir.

## Estado actual

- `BUILD_ID` esperado detectado en el HTML inicial: `-c6N3TaKeVegdtXH9jdrW`
- Runtime/footer observado durante la ejecución: `dbg 35551c7 | sBiTmcp`
- Resultado provisional: hay regresiones reales de auth/sesión y varias rutas directas siguen rotas o incompletas

## URLs exactas probadas

```text
https://chat-dev.bodasdehoy.com/login
https://chat-dev.bodasdehoy.com/chat
https://chat-dev.bodasdehoy.com/profile/stats
https://chat-dev.bodasdehoy.com/messages
https://chat-dev.bodasdehoy.com/memories/invalid-qa-r3
https://chat-dev.bodasdehoy.com/settings/advanced
https://chat-dev.bodasdehoy.com/settings/billing
https://chat-dev.bodasdehoy.com/settings/billing?recharge=success
https://chat-dev.bodasdehoy.com/settings/billing?recharge=cancelled
https://chat-dev.bodasdehoy.com/labs
https://chat-dev.bodasdehoy.com/pendientes
```

## Qué se observó

### 1. Hallazgo crítico en `/messages`

- Sin login, `https://chat-dev.bodasdehoy.com/messages` no mostró el gate esperado.
- La ruta llegó a hidratar la bandeja y exponer contenido real en estado visitante.
- Esto contradice el fix esperado del gate auth para `/messages`.

### 2. Regresión de sesión/autenticación

- Tras entrar en `chat-dev`, la sesión no se mantuvo de forma estable al navegar a rutas protegidas.
- La UI acabó mostrando estado visitante (`Iniciar sesión`, placeholder `BB`) en pantallas que deberían permanecer autenticadas.
- En consola apareció este patrón:

```text
❌ Error obteniendo Firebase token: {"code":"auth/requests-to-this-api-securetoken.googleapis.com-method-google.identity.securetoken.v1.securetoken.granttoken-are-blocked.","customData":{},"name":"FirebaseError"}
⚠️ No se pudo obtener Firebase token para renovar
```

### 3. `/memories/<id>` no hace el gate esperado

- `https://chat-dev.bodasdehoy.com/memories/invalid-qa-r3`
- En vez de gate de login con CTA `Iniciar Sesión`, la vista cayó en `client_error` / `No data`.

### 4. Rutas directas todavía rotas o incompletas

- `https://chat-dev.bodasdehoy.com/labs`
- `https://chat-dev.bodasdehoy.com/pendientes`

En ambos casos la UI quedó en una pantalla mínima tipo `Bodas de Hoy 2 de 5`, sin contenido funcional ni error/gate claro.

### 5. Deep-links de Stripe sin limpieza de query

- `https://chat-dev.bodasdehoy.com/settings/billing?recharge=success`
- `https://chat-dev.bodasdehoy.com/settings/billing?recharge=cancelled`

En la reproducción provisional no se limpió el query param en la URL.

## Regresiones/fixes ya contrastados

```text
1.1 stats fecha (#9): bloqueado por caída a estado visitante
1.2 typo Iniciar Sesión (#16a): no se vio el gate; memories inválido cae en client_error
1.3 Advanced en español (#16b): la ruta cargó como "Configuración Avanzada"
1.4 wallet React (#7): bloqueado por inestabilidad de sesión al entrar en billing
1.6 gate auth /messages (#5): regresión reproducida
1.7 flash avatar (#24): síntoma compatible; aparece placeholder BB en estados protegidos
1.8 sanitización consola (#25): pendiente de validar en logout limpio
```

## Pendiente para la siguiente pasada

```text
- Reintentar la cuenta pagada indicada en el prompt original
- Validar móvil FREE / saldo insuficiente
- Validar modal de recarga con importe inválido
- Logout y sanitización de consola
- Deep links settings?active=llm|billing|common
- Race conditions
- Offline / Slow 3G
- Multi-tab
- Consola pasiva 10 min
```

## Prompt copiable para otro agente

```text
Continúa la QA de chat-dev de Bodas de Hoy desde este estado previo, sin repetir trabajo ya hecho.

Contexto confirmado:
- URL principal: https://chat-dev.bodasdehoy.com
- BUILD_ID esperado en el HTML inicial: -c6N3TaKeVegdtXH9jdrW
- Runtime/footer observado durante la sesión anterior: dbg 35551c7 | sBiTmcp

Trabajo ya realizado:
- Se abrieron y verificaron estas rutas:
  - https://chat-dev.bodasdehoy.com/login
  - https://chat-dev.bodasdehoy.com/chat
  - https://chat-dev.bodasdehoy.com/profile/stats
  - https://chat-dev.bodasdehoy.com/messages
  - https://chat-dev.bodasdehoy.com/memories/invalid-qa-r3
  - https://chat-dev.bodasdehoy.com/settings/advanced
  - https://chat-dev.bodasdehoy.com/settings/billing
  - https://chat-dev.bodasdehoy.com/settings/billing?recharge=success
  - https://chat-dev.bodasdehoy.com/settings/billing?recharge=cancelled
  - https://chat-dev.bodasdehoy.com/labs
  - https://chat-dev.bodasdehoy.com/pendientes

Hallazgos ya reproducidos:
1. /messages carga la bandeja sin login en vez de mostrar el gate esperado.
2. Hay una regresión de sesión/auth: tras entrar en chat-dev, al navegar a rutas protegidas la UI puede caer a estado visitante.
3. En consola apareció este patrón durante la caída de sesión:
   ❌ Error obteniendo Firebase token: {"code":"auth/requests-to-this-api-securetoken.googleapis.com-method-google.identity.securetoken.v1.securetoken.granttoken-are-blocked.","customData":{},"name":"FirebaseError"}
   ⚠️ No se pudo obtener Firebase token para renovar
4. /memories/invalid-qa-r3 no muestra gate de login; cae en client_error / No data.
5. /labs y /pendientes siguen quedando en pantalla mínima e inservible.
6. Los deep links /settings/billing?recharge=success y ?recharge=cancelled no limpiaron el query param en la reproducción previa.

Qué debes hacer ahora:
1. Reintentar la autenticación de la cuenta pagada definida en el prompt interno de esta ronda.
2. Continuar la batería pendiente:
   - FREE móvil / insufficient balance
   - wallet modal con importe inválido
   - logout + sanitización consola
   - settings?active=llm|billing|common
   - race conditions
   - offline / Slow 3G
   - multi-tab
   - consola pasiva 10 min
3. No dupliques los hallazgos ya listados; si siguen ocurriendo, cítalos como continuación o confirmación.
4. Usa URLs exactas, consola literal, network 4xx/5xx si aparece y captura por hallazgo.
```

## Nota de seguridad

Este handoff público está redactado sin publicar credenciales ni copiar contenido sensible completo de mensajes observados durante la prueba.
