# Informe técnico de fallos QA — 2026-07-12

## Alcance

Este informe resume los fallos observados durante el QA visual exhaustivo en:

- `https://app-dev.bodasdehoy.com`
- `https://chat-dev.bodasdehoy.com`

Builds validados durante la sesión:

- `app-dev`: `jjySJBwY-LZP2KqdwzLRE`
- `chat-dev`: `ymb6Cv86sotXnoagGhaL8`

## Resumen ejecutivo

El run quedó limitado por tres problemas estructurales:

1. El flujo de autenticación en `app-dev` no permite una prueba limpia en frío porque la ruta `/login` rebota automáticamente a home/dashboard por sesión persistente o estado de auth residual.
2. `app-dev` no ofrecía un evento navegable para continuar las baterías internas y, además, el formulario para crear el evento de prueba quedó bloqueado en la validación del campo fecha.
3. `chat-dev` presenta degradación de sesión/JWT: permite llegar a `/chat`, pero al ir a `/messages` aparecen síntomas de sesión parcial, expiración de token y fallo de SSO/renovación.

## Fallos y causa probable

### 1. `APP/login` no permite login frío ni negativo

**Síntoma observado**

- Al abrir `APP/login`, la UI mostraba momentáneamente el login y acto seguido redirigía a `/`.
- Esto bloqueó:
  - `TA.1` login password DUEÑO
  - `TA.2` login inválido
  - `TA.3` login Google

**Impacto**

- Impide validar el flujo más básico de autenticación.
- Impide comprobar mensajes de error reales de credenciales inválidas.
- Contamina cualquier QA posterior porque no hay garantía del estado de sesión inicial.

**Causa probable**

- Persistencia de sesión previa no limpiada correctamente al entrar en `/login`.
- Guard/redirect de autenticación demasiado agresivo en cliente o middleware.
- Posible condición de carrera entre:
  - restauración de sesión;
  - validación de auth;
  - render del login;
  - redirección automática.

**Evidencia**

- Rebote automático repetible desde `/login` sin interacción completa del usuario.
- En runs previos ya había patrón similar de sesión persistente.

### 2. Magic-link inválido no muestra error legible

**Síntoma observado**

- La ruta `APP/auth/magic/dummy-token-inexistente-9999` no mostró un mensaje claro tipo "enlace inválido" o "expirado".
- Se observó `Comprobando sesión y conexión…` y después redirección a `/`.

**Impacto**

- Mala UX.
- El usuario no entiende si el enlace caducó, fue usado, es inválido o hubo error interno.
- Rompe el criterio funcional esperado del flujo de recuperación/acceso por enlace.

**Causa probable**

- El handler del magic-link está pasando por el mismo guard global de sesión que el login normal.
- El error de token inválido no se renderiza en una pantalla dedicada y queda absorbido por una redirección genérica.
- Falta separar claramente:
  - estado `loading`;
  - estado `invalid token`;
  - estado `expired token`;
  - estado `success`.

### 3. SSO APP → CHAT no estable

**Síntoma observado**

- Con sesión activa en `APP`, al abrir `CHAT` no se reconoció la sesión compartida como esperaba el guion.
- En consola apareció:
  - `[sso-auto] sessionBodas vacío — SSO chat→app no disponible esta sesión`

**Impacto**

- Rompe la experiencia multiapp del producto.
- Obliga a relogin o deja al usuario en estado ambiguo.
- Afecta navegación cruzada entre organizador y chat.

**Causa probable**

- Cookie o estado puente de SSO no está presente, no se está escribiendo, o no es visible en el dominio esperado.
- El endpoint `/api/auth/sso-auto` no está resolviendo el contexto de sesión correctamente.
- Puede existir desalineación entre:
  - cookie compartida;
  - sesión Firebase;
  - JWT interno de `chat-dev`;
  - lectura del tenant/desarrollo `bodasdehoy`.

### 4. Navbar marketing sigue apuntando a `app-dev`

**Síntoma observado**

- Los enlaces de header:
  - `NOVIA`
  - `PROVEEDORES`
  - `NOVIO`
  - `LUGARES PARA BODAS`
- seguían resolviendo a rutas `https://app-dev.bodasdehoy.com/categoria/...`
  en lugar de llevar a la web pública de marketing.

**Impacto**

- Error visible de navegación.
- Riesgo de 404 funcional o de llevar al usuario a una app privada en vez de a contenido público.
- Regresión directa de usabilidad del header.

**Causa probable**

- Configuración incorrecta de URLs absolutas de marketing.
- Uso de rutas relativas o base URL de app en componentes del menú.
- Fix no desplegado correctamente o pisado por otra rama/merge.

### 5. No había evento navegable y la creación del evento de prueba falló por fecha

**Síntoma observado**

- El dashboard no ofrecía un evento utilizable para continuar las baterías internas.
- Al intentar crear `Boda Test QA 12jul`, el formulario quedaba rechazando la fecha con mensaje equivalente a fecha inválida.
- El input se mostraba como fecha nativa con placeholder `mm/dd/yyyy`.

**Impacto**

- Bloquea por completo:
  - Presupuesto
  - Invitados
  - Mesas
  - Lista de regalos
  - Resumen
  - Itinerario
  - Invitaciones
  - Tareas
  - Momentos

**Causa probable**

- Mismatch entre formato visual esperado y valor interno del `input[type="date"]`.
- Posible problema de locale:
  - interfaz sugiriendo `mm/dd/yyyy`;
  - validación esperando otro formato o un objeto fecha normalizado.
- Validación cliente y serialización backend no alineadas.
- También es posible que falte un valor relacionado obligatorio:
  - timezone;
  - país;
  - tipo;
  pero el síntoma principal quedó concentrado en fecha.

### 6. `CHAT/messages` cae a contexto visitante o parcial

**Síntoma observado**

- El login en `CHAT/login` sí llegó a `/chat`.
- Pero al navegar a `/messages`, la experiencia no quedó autenticada de forma estable.
- La página mostró estado inconsistente y señales de sesión degradada.

**Impacto**

- Rompe el módulo de mensajería, que era una batería principal.
- Impide validar estructura de conversación, sidebar, notas, niveles IA y acciones relacionadas.

**Causa probable**

- Inconsistencia entre el estado auth de la app shell de chat y el estado auth exigido por `/messages`.
- `JWT` interno ausente, expirado o no renovado aunque el usuario esté identificado por Firebase.
- La página `/messages` parece depender de un token adicional que no siempre existe o no se renueva a tiempo.

### 7. Fallo de renovación JWT / securetoken en `chat-dev`

**Síntoma observado**

- En consola aparecieron mensajes nuevos no allowlist:
  - `JWT token expirado`
  - `Usuario identificado pero sin JWT válido - necesita re-login`
  - `No se pudo obtener Firebase token para renovar`
  - `Timeout de seguridad alcanzado (15s), continuando con datos parciales`
  - `ERR_TOO_MANY_REDIRECTS https://chat-dev.bodasdehoy.com/api/auth/sso-auto`
  - `Error obteniendo token después de auth state change: FirebaseError ... securetoken ... are-blocked`
  - `ERR_ABORTED https://chat-dev.bodasdehoy.com/api/messages/stream?development=bodasdehoy`

**Impacto**

- Explica técnicamente por qué `/messages` no quedó funcional.
- Deja la app en estado parcialmente autenticado.
- Puede afectar chat, bandeja, streaming y cualquier feature dependiente del token backend.

**Causa probable**

- Cadena de autenticación fragmentada:
  - Firebase auth identifica al usuario;
  - pero el JWT de backend para `chat-dev` no se emite o no se renueva.
- El endpoint `sso-auto` entra en bucle o reintentos incorrectos.
- El mecanismo de refresh tiene timeout y luego la UI sigue con datos parciales.
- También puede haber bloqueo externo o de política sobre la llamada a `securetoken`, pero funcionalmente el bug de producto es que la app no degrada bien ni recupera el estado.

### 8. `ERR_BLOCKED_BY_ORB` en `restcountries.eu/data/esp.svg`

**Síntoma observado**

- Error de carga:
  - `net::ERR_BLOCKED_BY_ORB https://restcountries.eu/data/esp.svg`

**Impacto**

- No parece bloquear todo el producto, pero sí indica dependencia rota/obsoleta.
- Puede afectar iconografía o render puntual de país/bandera en formularios.

**Causa probable**

- Recurso externo obsoleto o servido con cabeceras incompatibles.
- Dominio antiguo `restcountries.eu` ya no es una base confiable para assets actuales.

## Clasificación por prioridad

### P0 / muy alta

- Rebote automático de `APP/login`
- Fallo de sesión/JWT en `CHAT/messages`
- `ERR_TOO_MANY_REDIRECTS` en `chat-dev/api/auth/sso-auto`

### P1 / alta

- Magic-link inválido sin mensaje legible
- Creación de evento bloqueada por validación de fecha
- SSO APP → CHAT no funcional
- Navbar marketing apuntando a `app-dev`

### P2 / media

- `ERR_BLOCKED_BY_ORB` de `restcountries.eu/data/esp.svg`
- Abortos de telemetría/analytics, si no afectan funcionalidad directa

## Qué explican los bloqueos del QA

Las baterías `C` a `J` y `N` no quedaron sin ejecutar por falta de tiempo, sino por dependencia técnica real:

1. No había login frío fiable en `APP`.
2. No había evento navegable disponible.
3. No se pudo crear el evento de prueba por el bug de fecha.
4. `CHAT/messages` quedó degradado por problemas de token/SSO.

Por tanto, el run sirve para detectar regresiones de plataforma y autenticación, pero no para cerrar con confianza los módulos internos hasta que esos bloqueos se corrijan.

## Hipótesis técnica consolidada

La mayoría de fallos apuntan a un mismo núcleo:

- capa de autenticación y sesión inestable;
- mala coordinación entre Firebase, JWT interno, SSO y guards de routing;
- y una regresión adicional de validación de formularios en creación de evento.

En otras palabras:

- `APP` falla en el control de entrada al login y en la creación mínima de contexto de trabajo;
- `CHAT` falla en mantener la sesión backend aunque el usuario parezca identificado;
- el resto de módulos queda bloqueado como consecuencia, no necesariamente por fallo propio de cada módulo.

## Recomendación técnica para el equipo

Orden sugerido de diagnóstico:

1. Revisar guardas/redirecciones de `/login` en `app-dev`.
2. Revisar flujo de magic-link para que renderice error explícito y no redirija genéricamente.
3. Revisar emisión, persistencia y refresh del JWT interno en `chat-dev`.
4. Auditar `api/auth/sso-auto` por bucles, timeout y dependencia de `sessionBodas`.
5. Corregir el formulario de creación de evento, empezando por normalización del campo fecha.
6. Corregir las URLs absolutas del navbar marketing.
7. Sustituir dependencia externa de `restcountries.eu`.

## Conclusión

No parece un problema aislado de un solo módulo visual. El patrón dominante es de sesión/autenticación inconsistente entre apps y de bootstrap insuficiente del contexto mínimo de trabajo. Mientras eso no quede estable, cualquier QA funcional profundo sobre módulos internos seguirá dando falsos bloqueos o resultados incompletos.
