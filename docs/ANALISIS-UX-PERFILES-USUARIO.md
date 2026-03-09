# Análisis UX Completo — Perfiles de Usuario en Bodas de Hoy

**Fecha:** Marzo 2026
**Entorno probado:** app-test.bodasdehoy.com + chat-test.bodasdehoy.com
**Metodología:** Testing manual con MCP Browser (WebKit) + inspección de código

---

## Resumen ejecutivo

| Perfil | Acceso | Conversión | Problemas críticos |
|---|---|---|---|
| Visitante (guest) | Parcial — solo home + crear evento + invitados | Muy baja — sin CTA de registro | 4 bugs + 0 upsell visible |
| Registrado FREE | Completo en funcionalidades base | Media | Sin diferenciación vs guest en UI |
| Registrado PAGADO | Completo + IA + features premium | Alta | Copilot iframe 404 en dev |

---

## PERFIL 1 — VISITANTE (No registrado / Guest)

### Mapa completo de rutas

| Ruta | Comportamiento real | Esperado | Estado |
|---|---|---|---|
| `/` (home) | Accesible, lista de eventos vacía, hero visible | Accesible | OK |
| Botón "Crear un evento" | Abre formulario sin pedir login | Debería pedir registro | UX Gap |
| Guardar evento (formulario) | El evento SE CREA en BD | Debería pedir registro | Bug/UX |
| `/resumen-evento` | Accesible completamente con evento activo | Solo con login | UX Gap |
| `/invitados` | Accesible — ve todos los grupos vacíos | Solo con login | UX Gap |
| `/presupuesto` (via URL) | Redirige a `/invitados` si hay evento activo | Redirige a `/` | Comportamiento raro |
| `/presupuesto` (via navbar sin evento) | Toast "No tienes eventos creados" | Toast o login modal | Funciona (msg confuso) |
| `/servicios` (via URL o navbar) | Redirige a `/` | Redirige a `/` | OK pero sin explicación |
| `/itinerario` (via URL) | Redirige a `/` | Redirige a `/` | OK pero sin explicación |
| `/mesas` (via URL) | Redirige a `/` | Redirige a `/` | OK pero sin explicación |
| `/login` | Redirige automáticamente a `chat-test.bodasdehoy.com/login` | Login form | OK (SSO) |
| Copilot sidebar (icono "Copilot") | Abre panel con "Estás como invitado. Inicia sesión para chatear" + iframe 404 | Chat funcional | Bug (404 iframe) |
| Copilot "Ver completo" | Abre nueva pestaña `chat-test.../bodasdehoy/chat?sessionId=guest_XXX` → 404 | Chat funcional | Bug (404) |

### Flujo real del visitante (lo que experimenta)

```
1. Llega a home → Ve hero "Organiza tus eventos" + demo visual (OK)
2. Hace click en "Crear un evento" → Formulario abre SIN pedir login
3. Rellena: nombre, tipo (Boda auto-imagen), fecha, zona horaria
4. Click "Guardar" → Evento se crea en BD, aparece card en home
5. Click en card evento → Entra a /resumen-evento (todo visible)
6. Click "Añadir Invitados" → Entra a /invitados (completamente funcional)
7. Recarga de página → El evento DESAPARECE (error 500 al hacer fetch)
8. Intenta ir a Presupuesto → Toast "No tienes eventos creados"
9. Intenta ir a Servicios/Itinerario → Silenciosamente redirige a home sin explicación
10. Abre Copilot → Ve mensaje de login + iframe 404 (experiencia rota)
```

### Bugs detectados

1. **FECHA EPOCH 0 en evento creado** — Al usar el datepicker y guardar, la fecha se guarda como Unix epoch 0 → muestra "1 de enero de 1970" en la tarjeta del evento. Prioridad: Alta.

2. **Evento se pierde tras reload** — El evento se crea para el guest UID, pero tras un full page reload el fetch de eventos devuelve 500. El evento queda "huérfano" en BD. Prioridad: Alta.

3. **Copilot iframe 404** — El iframe dentro del panel Copilot intenta cargar `/bodasdehoy/chat` y obtiene 404. El usuario ve un panel de soporte vacío con mensaje de error de Next.js. Prioridad: Alta.

4. **"Ver completo" copilot → 404** — La URL `chat-test.bodasdehoy.com/bodasdehoy/chat?sessionId=guest_XXX` devuelve 404 en nueva pestaña. Prioridad: Alta.

### Oportunidades de conversión PERDIDAS

1. **ZERO CTAs de registro en el flujo de creación** — El usuario crea un evento, entra al interior, añade invitados... nunca se le pide que se registre para guardar su trabajo. El momento de mayor intención (acaban de crear su evento) se desperdicia.

2. **Toast confuso al navegar a secciones bloqueadas** — "No tienes eventos creados" aparece cuando SÍ tienen el evento creado (pero no se encuentra porque hay un 500). El mensaje correcto sería "Inicia sesión para acceder a esta sección".

3. **Redirección silenciosa en servicios/itinerario/mesas** — Al navegar a estas rutas el usuario es enviado a home sin ninguna explicación. No sabe por qué no puede acceder. No hay ningún mensaje tipo "Esta función requiere registrarse".

4. **Copilot bloqueado sin alternativa** — El panel del copilot solo muestra "Estás como invitado" con un link de login. No hay preview de qué puede hacer el copilot, no hay propuesta de valor, no hay incentivo para registrarse.

5. **El "inicio de sesión" redirige a chat-test en lugar de mostrar modal** — Cuando el guest hace click en "Inicia sesión" en cualquier punto de la app, es redirigido a chat-test.bodasdehoy.com (dominio externo), lo que puede ser confuso y genera pérdida del contexto.

---

## PERFIL 2 — REGISTRADO FREE (Sin plan de pago)

> Estado: Análisis basado en código + estructura de la app (no se testó sesión real en esta sesión)

### Diferencias respecto al visitante

| Feature | Visitante | Registrado FREE |
|---|---|---|
| Crear evento | OK (pero se pierde) | OK + persiste en BD |
| Ver mis eventos | Solo temporal | Lista completa persistente |
| Resumen evento | Accesible | Accesible |
| Invitados | Accesible | Accesible + acciones guardadas |
| Presupuesto | Bloqueado (redirige) | Accesible |
| Servicios | Bloqueado (redirige) | Accesible |
| Itinerario | Bloqueado (redirige) | Accesible |
| Mesas | Bloqueado (redirige) | Accesible |
| Copilot IA | Bloqueado (solo mensaje login) | 50.000 tokens/mes gratis |
| Compartir evento | Botón visible pero sin funcionar correctamente | Funcional |

### Flujo esperado del usuario FREE

```
1. Se registra (via chat-test.bodasdehoy.com/login → SSO → app-test)
2. Crea evento → persiste
3. Gestiona invitados → tabla funcional
4. Intenta acceder a Presupuesto → accesible (plan FREE lo incluye)
5. Intenta usar Copilot → 50K tokens disponibles, pero UI puede no indicarlo
6. Llega al límite de tokens → Modal InsufficientBalance aparece → upsell a plan BASIC
```

### Problemas probables (sin haber testeado sesión FREE)

- Sin plan activo no hay ningún indicador visual de créditos disponibles
- El copilot no muestra cuántos tokens le quedan antes de empezar
- No está claro en qué punto del onboarding el usuario entiende que tiene un plan FREE con límites

---

## PERFIL 3 — REGISTRADO PAGADO (BASIC / PRO / MAX)

> Estado: Análisis basado en código + documentación

### Features desbloqueadas por plan

| Plan | Precio | Tokens IA | Imágenes | Almacenamiento | WhatsApp |
|---|---|---|---|---|---|
| FREE | 0€ | 50K/mes | — | 1GB | — |
| BASIC | 9,99€/mes | 500K/mes | 50/mes | 5GB | — |
| PRO | 29,99€/mes | 2M/mes | 200/mes | 20GB | 1.000/mes |
| MAX | 79,99€/mes | 10M/mes | 1.000/mes | 100GB | Ilimitado |

### Flujo esperado del usuario PAGADO

```
1. Login → app-test (SSO funciona)
2. Todos los módulos accesibles: invitados, presupuesto, servicios, itinerario, mesas
3. Copilot funcional en sidebar → chat IA con contexto del evento
4. Copilot puede filtrar vistas (filter-app-view tool)
5. Copilot puede crear/editar datos (add_guest, create_budget_item, etc.)
6. "Ver completo" → chat-test.bodasdehoy.com/bodasdehoy/chat (sesión SSO)
7. Venue Visualizer disponible (subida de fotos, generación IA)
8. Modal de balance insuficiente aparece al agotar tokens
```

---

## CHECKLIST COMPLETO — Estado actual por caso de uso

### Autenticación y sesión

- [x] Login via chat-test → SSO → app-test (cookie `idTokenV0.1.0`) — FUNCIONA
- [x] Login redirect: `/login` en app-test → redirect a chat-test automático — FUNCIONA
- [ ] Registro nuevo usuario → onboarding → primer evento — SIN TESTEAR
- [ ] Recuperar contraseña — SIN TESTEAR
- [ ] Logout — SIN TESTEAR
- [ ] Sesión expirada → mensaje `session_expired=1` en URL → aviso en login — IMPLEMENTADO, SIN TESTEAR E2E
- [x] Guest UID persiste en localStorage entre navegaciones — FUNCIONA
- [ ] Cross-domain auth (memories.bodasdehoy.com) — SIN TESTEAR

### Gestión de eventos

- [ ] Crear evento como registrado (fecha correcta) — SIN TESTEAR
- [x] Crear evento como guest — FUNCIONA pero con bugs (fecha 1970, se pierde tras reload)
- [ ] Editar evento — SIN TESTEAR
- [ ] Archivar / Completar evento — SIN TESTEAR
- [ ] Eliminar evento — SIN TESTEAR
- [ ] Compartir evento con otro usuario — SIN TESTEAR
- [ ] Evento con múltiples colaboradores — SIN TESTEAR

### Invitados

- [x] Ver lista de invitados (vacía) como guest — FUNCIONA
- [ ] Añadir invitado individual — SIN TESTEAR
- [ ] Importar invitados (CSV) — SIN TESTEAR
- [ ] Gestión de grupos — SIN TESTEAR
- [ ] Confirmar/cancelar asistencia — SIN TESTEAR
- [ ] Asignar mesa a invitado — SIN TESTEAR
- [ ] Enviar invitación digital — SIN TESTEAR

### Presupuesto

- [x] Navbar icon sin evento activo → toast "No tienes eventos creados" — FUNCIONA
- [x] URL directa sin auth → redirige a home — FUNCIONA
- [ ] Ver presupuesto con sesión — SIN TESTEAR
- [ ] Añadir gasto — SIN TESTEAR
- [ ] Categorías de gasto — SIN TESTEAR
- [ ] Exportar presupuesto — SIN TESTEAR

### Mesas / Plano

- [x] URL directa sin auth → redirige a home — FUNCIONA
- [ ] Crear mesa — SIN TESTEAR
- [ ] Asignar invitados a mesas — SIN TESTEAR
- [ ] Vista plano interactivo — SIN TESTEAR

### Servicios

- [x] URL directa sin auth → redirige a home — FUNCIONA
- [ ] Buscar proveedores — SIN TESTEAR
- [ ] Añadir proveedor a mi evento — SIN TESTEAR
- [ ] Contactar proveedor — SIN TESTEAR

### Itinerario

- [x] URL directa sin auth → redirige a home — FUNCIONA
- [ ] Crear momento del itinerario — SIN TESTEAR
- [ ] Ordenar momentos — SIN TESTEAR
- [ ] Compartir itinerario con equipo — SIN TESTEAR

### Copilot IA

- [x] Panel sidebar se abre correctamente — FUNCIONA
- [x] Mensaje "Estás como invitado" visible — FUNCIONA
- [ ] Iframe chat-ia como guest — BUG: 404
- [ ] "Ver completo" como guest — BUG: 404
- [ ] Chat IA con contexto de evento (usuario autenticado) — SIN TESTEAR
- [ ] filter-app-view (resaltar entidades en app) — SIN TESTEAR
- [ ] Crear/editar datos via IA (add_guest, create_budget_item) — SIN TESTEAR
- [ ] Modal de balance insuficiente — IMPLEMENTADO, SIN TESTEAR E2E
- [ ] Venue Visualizer — SIN TESTEAR

### Billing

- [ ] Ver plan actual — SIN TESTEAR
- [ ] Ver historial de transacciones — SIN TESTEAR
- [ ] Configurar auto-recarga — SIN TESTEAR
- [ ] Upgrade de plan — SIN TESTEAR

---

## Problemas de UX priorizados — Recomendaciones de acción

### P0 — Críticos (rompen experiencia)

1. **Copilot 404** — La primera cosa que ve un usuario cuando abre el copilot es un error 404 dentro del iframe. La sección más valiosa y diferenciadora de la app está rota visualmente. Fix: Investigar por qué `/bodasdehoy/chat` da 404 en chat-ia dev.

2. **Evento guest se pierde tras reload** — El usuario crea su evento con ilusión, explora la app, recarga la página y el evento desaparece con un error 500. Experiencia devastadora. Fix: Arreglar el 500 en fetch de eventos para guests UID, o mostrar mensaje claro.

3. **Fecha 1 enero 1970** — El campo de fecha del formulario de creación de evento no parsea correctamente la fecha → muestra epoch 0. Fix: revisar el campo date en el formulario de evento.

### P1 — Altos (bloquean conversión)

4. **Cero CTAs de registro en el flujo estrella** — El usuario vive el flujo completo de creación de evento + exploración sin que se le proponga registrarse. Propuesta: Añadir modal/sheet "Guarda tu boda registrándote" justo después de que el guest crea el primer evento.

5. **Redirección silenciosa a secciones bloqueadas** — Servicios, itinerario, mesas redirigen a home sin explicar por qué. Un usuario que llega del navbar a estas páginas no sabe que tiene que registrarse. Propuesta: Banner/modal explicativo antes de redirigir.

6. **"No tienes eventos creados" mensaje incorrecto** — Aparece aunque el usuario SÍ tiene un evento (pero el sistema no lo reconoce). Genera confusión. Fix: Mejorar el mensaje o resolver el problema de reconocimiento de eventos.

### P2 — Medios (mejoran conversión)

7. **Copilot sin preview ni propuesta de valor para guest** — El panel del copilot solo dice "Inicia sesión". No hay descripción de qué puede hacer el copilot, no hay ejemplo. Propuesta: Panel de bienvenida con 3 ejemplos de prompts + CTA de registro.

8. **El botón "Ver completo" del copilot abre nueva pestaña** — Esto saca al usuario de la app. Mejor mantenerlo en modo iframe o en la misma pestaña.

9. **Indicador visual de plan / créditos inexistente** — Un usuario registrado FREE no sabe cuántos tokens le quedan antes de usar el copilot. Propuesta: Pequeño indicador de créditos en el header del copilot.

### P3 — Bajos (deuda técnica)

10. **AxiosError 500 visible en Next.js Dev Overlay** — El overlay de errores de Next.js aparece en la interfaz en producción. Esto no debería verse. Fix: Asegurar que `NODE_ENV=production` o similar supprime el dev overlay.

11. **Guest UID inconsistente** — Si el usuario borra localStorage o usa incógnito, su UID guest cambia y pierde todo. Es inherente a la arquitectura guest, pero debería documentarse el comportamiento esperado.

---

## Comparativa visual de experiencias

### Visitante — Journey emocional

```
Llega → Entusiasmo (hero bonito)
Crea evento → Sorpresa positiva (no pidió login!)
Explora resumen → Enganchado (ve toda la funcionalidad)
Recarga → Frustración (evento desaparece, error 500)
Intenta copilot → Decepción (404, mensaje plano)
Intenta presupuesto → Confusión (mensaje raro)
Intenta servicios → Abandono silencioso (redirige sin explicar)
```

### Registrado FREE — Journey esperado

```
Registro → Alivio (SSO funciona, no hay fricción)
Primer evento → Satisfacción (persiste, carga rápido)
Invitados → Productividad (tabla completa)
Copilot → Curiosidad → Uso → Límite de tokens → CTA upgrade
Presupuesto/Servicios → Funcional → Satisfacción
```

### Registrado PAGADO — Journey esperado

```
Login → Todo disponible inmediatamente
Copilot → Feature estrella, contexto completo del evento
IA hace acciones → Wow moment (añade invitados via chat)
Venue Visualizer → Wow moment adicional
Facturación clara → Confianza → Retención
```

---

## Próximos pasos sugeridos

### Sprint inmediato (bugs P0)

1. Fix copilot iframe 404 — investigar ruta `/bodasdehoy/chat` en middleware de chat-ia
2. Fix fecha 1970 en formulario de evento — revisar parser del campo date
3. Fix 500 en fetch de eventos de guests — revisar autenticación de guest en API
4. Fix "Ver completo" del copilot — la URL con `?sessionId=guest_XXX` da 404

### Sprint conversión (P1)

5. Modal post-creación de evento para guest: "¡Tu evento está listo! Regístrate para guardarlo"
6. Reemplazar redirección silenciosa por mensaje explicativo en rutas protegidas
7. Mejorar panel copilot para guests: preview de capacidades + CTA registrarse

### Análisis pendiente

- [ ] Testear flujo completo de usuario registrado (login → todos los módulos)
- [ ] Testear flujo de upgrade de plan (FREE → BASIC)
- [ ] Testear comportamiento del copilot con sesión activa
- [ ] Testear portal del invitado `/e/[eventId]`
- [ ] Testear desde móvil (responsive)
