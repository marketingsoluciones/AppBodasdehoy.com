# E2E Testing — Arquitectura, Filosofía y Guía para Nuevos Tests

> **Para qué sirve este doc:** Entender cómo funciona nuestro modelo de tests E2E,
> cómo crear nuevos tests siguiendo el patrón establecido, y cómo replicar este
> sistema en otros proyectos con IA conversacional.

---

## 1. Filosofía: qué estamos testeando realmente

No testeamos la UI (clics, formularios, CSS). Testeamos **el contrato entre el usuario y la IA**:

> *"Si el usuario (con este rol) hace esta pregunta, la IA debe responder esto."*

La IA es el sistema bajo prueba. El chat es la interfaz. La BD es el estado.

**Tres invariantes que cada test verifica:**
1. **Corrección** — la IA devuelve el dato real de BD (no inventa).
2. **Autorización** — la IA solo devuelve lo que el rol del usuario puede ver.
3. **Persistencia** — cuando la IA muta datos, la BD lo refleja (re-consulta confirma).

---

## 2. Estructura de archivos

```
e2e-app/
├── fixtures.ts                    # URLs por entorno, helper de credenciales
├── fixtures/
│   └── isabel-raul-event.ts       # Fixture determinístico: evento de test + usuarios
│
├── crud-permission.spec.ts        # Batería original CRUD (operaciones básicas)
├── permisos-modulos.spec.ts       # Matriz permisos × módulo × rol (archivo principal)
│
└── resultados-batch-YYYY-MM-DD.tsv  # Resultados guardados de cada ejecución
```

### Archivo de fixture (`fixtures/isabel-raul-event.ts`)

Contiene los datos **verificados en BD** que los tests usan como expected values.

```typescript
export const ISABEL_RAUL_EVENT = {
  id: '66a9042dec5c58aa734bca44',
  nombre: 'Boda Isabel & Raúl',
  fecha: '2025-12-30',
  invitados: { total: 44, confirmados: 39, ... },
  presupuesto: { partida1: 'Catering' },
  itinerario: { total: 5 },
} as const;

export const TEST_USERS = {
  organizador:           { email, password, role: 'creator' },
  carlosCarrilloInvitado:{ email, password, role: 'invited_guest' },
  jccColaborador:        { email, password, role: 'collaborator' },
  // ...
} as const;
```

**Regla crítica:** los valores del fixture deben verificarse contra la BD real antes
de escribir el test. Si el valor cambia en BD, actualizar el fixture.

---

## 3. El helper `ask()` — núcleo del sistema

```typescript
async function ask(
  page: Page,
  message: string,
  afterCount: number,        // nº de mensajes ANTES de enviar (para detectar la respuesta nueva)
  opts: {
    waitMs?: number;         // timeout máximo (default 90s × MULT). Playwright timeout = 240s.
    requirePattern?: RegExp; // la respuesta DEBE hacer match
    failPattern?: RegExp;    // si hace match → se envía un nudge automático
    noEventHint?: boolean;   // omitir EVENT_FILTER_SUFFIX (usar en tests COLLAB con evento distinto)
  }
): Promise<{ response: string; newCount: number }>
```

**`EVENT_FILTER_SUFFIX` está horneado en `ask()` por defecto.**
Cada mensaje enviado incluye automáticamente ` Usa filter_by_name="Boda Isabel & Raúl".`
para que la IA seleccione el evento correcto. Solo se omite cuando `noEventHint: true`.

**Qué hace internamente:**
1. Construye `fullMessage = message + EVENT_FILTER_SUFFIX` (a menos que `noEventHint`).
2. Escribe el mensaje en el editor del chat y pulsa Enter.
3. Espera a que aparezca un nuevo `[data-index]` (indicador de mensaje nuevo).
4. Filtra boilerplate ("Analizando...", "Procesando...", timestamps) y chips de modelo.
5. Detecta cuando el texto **se estabiliza** (mismo texto 2 iteraciones seguidas).
6. Si la respuesta estable no cumple `requirePattern` o cumple `failPattern`, envía
   un **nudge automático** con contexto explícito del evento.
7. Máximo 2 nudges. Después devuelve lo que haya.

**`userPrefix`** — los primeros 12 caracteres del mensaje (lowercase) se usan para
filtrar el bubble del propio usuario de los resultados de la IA.

**Por qué funciona el nudge:** la IA a veces no asocia la pregunta al evento correcto
sin contexto explícito. El nudge fuerza el contexto. Se usa con moderación.

---

## 4. Patrón estándar de un test

### Test de lectura (solo verifica datos)

```typescript
test('BATCH-01 [owner] describe qué valida', async ({ page }) => {
  // 1. Login
  const ok = await loginChat(page, TEST_USERS.organizador.email, TEST_USERS.organizador.password);
  expect(ok, 'login fallido').toBe(true);
  const count = await page.locator('[data-index]').count();

  // 2. Preguntar
  const { response } = await ask(
    page,
    `¿Cuántos invitados hay en la ${ISABEL_RAUL_EVENT.nombre}?`,
    count,
    {
      requirePattern: new RegExp(`${ISABEL_RAUL_EVENT.invitados.total}`),
      failPattern: /no\s*(encontr|tengo|tienes)/i,
    },
  );

  // 3. Verificar
  console.log('[BATCH-01] respuesta:', response.slice(0, 200));
  expect(response).toMatch(new RegExp(`${ISABEL_RAUL_EVENT.invitados.total}`));
});
```

### Test de mutación (crea/modifica y verifica en BD)

```typescript
test('BATCH-02 [owner] crea algo → BD lo refleja', async ({ page }) => {
  const ok = await loginChat(page, ...);
  let count = await page.locator('[data-index]').count();

  // Paso 1: mutar
  const { response: mutResp, newCount: c1 } = await ask(
    page,
    `Añade un invitado llamado "Test-Auto" a la ${ISABEL_RAUL_EVENT.nombre}`,
    count,
    { requirePattern: /añad|creado|agregado/i },
  );
  expect(mutResp).toMatch(/añad|creado|agregado/i);

  // Paso 2: re-consultar para verificar persistencia en BD
  const { response: verify } = await ask(
    page,
    `¿Cuántos invitados hay ahora en la ${ISABEL_RAUL_EVENT.nombre}?`,
    c1,
    { requirePattern: new RegExp(`${ISABEL_RAUL_EVENT.invitados.total + 1}`) },
  );
  expect(verify).toMatch(new RegExp(`${ISABEL_RAUL_EVENT.invitados.total + 1}`));
});
```

### Test de denegación (verifica que el rol NO puede hacer algo)

```typescript
test('BATCH-03 [invited_guest] NO puede hacer X', async ({ page }) => {
  const ok = await loginChat(page, TEST_USERS.carlosCarrilloInvitado.email, ...);
  const count = await page.locator('[data-index]').count();

  const { response } = await ask(
    page,
    `Añade un invitado a la ${ISABEL_RAUL_EVENT.nombre}`,
    count,
    // Sin requirePattern — cualquier respuesta estable sirve
  );

  // La IA debe denegar, NO ejecutar
  expect(response).toMatch(/no\s*(tienes?|tengo|pued|permiso)|denegado|acceso/i);
  expect(response).not.toMatch(/añad|creado|agregado/i);
});
```

### Test con dos usuarios en el mismo test (spectatorView)

Usar `{ browser }` en lugar de `{ page }` para crear dos contextos independientes:

```typescript
test('BATCH-06 [owner→guest] item público es visible para invitado', async ({ browser }) => {
  // Contexto 1: owner crea el dato
  const ownerCtx = await browser.newContext();
  const ownerPage = await ownerCtx.newPage();
  await loginChat(ownerPage, TEST_USERS.organizador.email, ...);
  // ... crear item público ...
  await ownerCtx.close();

  // Contexto 2: invitado verifica visibilidad
  const guestCtx = await browser.newContext();
  const guestPage = await guestCtx.newPage();
  await loginChat(guestPage, TEST_USERS.carlosCarrilloInvitado.email, ...);
  // ... verificar que lo ve ...
  await guestCtx.close();

  // Cleanup: owner elimina el dato de test
  const cleanCtx = await browser.newContext();
  // ...
});
```

---

## 5. Estructura de batches

Cada `test.describe` es un **batch** con naming estándar:

```
BATCH {MÓDULO} — {descripción} × Roles
```

**Módulos actuales:**
| Batch | Módulo | Tests | Qué cubre |
|---|---|---|---|
| BATCH INV | Invitados | 9 | CRUD + roles |
| BATCH PRE | Presupuesto básico | 4 | Ver + añadir partida |
| BATCH PRE-PAGOS | Pagos | 7 | Registrar/eliminar/futuro/roles |
| BATCH PRE-ITEMS | Partidas | 4 | qty×price + cascada |
| BATCH PRE-DASH | Dashboard financiero | 4 | Resumen solo owner |
| BATCH MES | Mesas | 7 | Ver plano + asignar + mover + roles |
| BATCH TAR | Tareas | 3 | Crear + completar |
| BATCH EVT | Evento | 4 | Resumen + renombrar + restaurar |
| BATCH INV-EMAIL | Invitaciones | 6 | Reenviar email/WA + bulk |
| BATCH SRV | Servicios/Kanban | 9 | CRUD + spectatorView + roles |
| BATCH ITR | Itinerario | 10 | CRUD + spectatorView + roles |
| BATCH COLLAB | Colaborador | 8 | view/edit/none por módulo |
| BATCH CROSS | Aislamiento cross-rol | 9 | Misma pregunta × 3 roles |

**Naming de test IDs:**
```
{BATCH}-{NN} [{rol}] {qué hace} → {resultado esperado}

Ejemplo: PRE-PAGOS-01 [owner] registrar pago → total pagado sube
```

---

## 6. Roles testeados

| Rol | Usuario de test | Qué puede |
|---|---|---|
| `owner` | `bodasdehoy.com@gmail.com` | Todo |
| `invited_guest` | `carlos.carrillo@marketingsoluciones.com` | Solo sus datos + items públicos |
| `visitor` | sin login (botón "Continuar como visitante") | Nada privado |
| `collaborator` | `jcc@marketingsoluciones.com` | Según permisos configurados por módulo |

**Cómo funciona el sistema de permisos (appEventos `useAllowed.tsx`):**
```typescript
// permission.value:
"edit"  → puede entrar al módulo Y mutar datos
"view"  → puede entrar al módulo, NO puede mutar  (cualquier valor ≠ none ≠ edit)
"none"  → bloqueado en el router, no puede entrar al módulo
```

Módulos con permiso configurable: `resumen`, `invitados`, `mesas`, `presupuesto`,
`invitaciones`, `itinerario`, `servicios`, `memories`

---

## 7. Convenciones de cleanup de datos

| Tipo | Estrategia |
|---|---|
| Invitados de test | Nombre `"PM-Test-Auto"` — se elimina en el mismo batch |
| Partidas de test | Nombre `"PRE-Items-Test"` — PRE-ITEMS-03 la elimina |
| Servicios de test | Nombre `"SRV-Test-Auto"` — SRV-05 lo elimina |
| Items itinerario de test | Nombre `"ITR-Test-Auto"` — ITR-05 lo elimina |
| Items spectatorView | Nombres `"*-Test-Public-E2E"` / `"*-Test-Private-E2E"` — cleanup al final del mismo test con `browser.newContext()` |

**Regla:** si un test crea datos de test, hay un test posterior en el mismo batch
que los elimina. Los tests DEBEN ejecutarse en orden dentro del batch.

---

## 8. Cómo añadir un nuevo módulo completo

Pasos para añadir un nuevo módulo (ej: "Regalos"):

### Paso 1 — Añadir constantes de test al spec
```typescript
const TEST_REGALO_NAME = 'REGALO-Test-Auto';
```

### Paso 2 — Verificar valores reales en BD
Preguntar como owner al chat: `"¿Cuántos regalos tiene la Boda Isabel & Raúl?"`.
Anotar el número y añadirlo al fixture:
```typescript
// en isabel-raul-event.ts
regalos: {
  total: 12,  // verificado 2026-XX-XX
},
```

### Paso 3 — Escribir el batch siguiendo la plantilla

Siempre llamar `smokeGate()` como primera línea del describe.
NO usar `smokeOk` global — cada describe tiene su propio ping independiente.

```typescript
test.describe('BATCH REG — Regalos × Roles', () => {
  smokeGate(); // ← SIEMPRE primera línea. Hace beforeAll ping + beforeEach skip.

  // Owner: leer
  test('REG-01 [owner] lista de regalos devuelve total real', async ({ page }) => { ... });
  // Owner: añadir
  test('REG-02 [owner] añadir regalo → total sube → verificar en BD', async ({ page }) => { ... });
  // Owner: editar
  test('REG-03 [owner] editar regalo → cambio persistido', async ({ page }) => { ... });
  // Owner: eliminar (cleanup)
  test('REG-04 [owner] eliminar regalo de test', async ({ page }) => { ... });
  // Rol denegado
  test('REG-05 [invited_guest] NO puede ver lista de regalos', async ({ page }) => { ... });
  test('REG-06 [visitor] NO puede ver regalos', async ({ page }) => { ... });
});
```

**Tests para evento distinto al fixture principal** (ej. COLLAB usa `eventoCompartido`):
```typescript
const { response } = await ask(page, '¿Qué servicios hay?', count, {
  noEventHint: true,  // ← omite EVENT_FILTER_SUFFIX
});
```

### Paso 4 — Ejecutar y ajustar patterns
```bash
E2E_ENV=dev npx playwright test e2e-app/permisos-modulos.spec.ts --project=webkit --grep "REG"
```
Si falla: leer el `console.log` del test, ajustar `requirePattern` / `failPattern`.

---

## 9. Ejecutar los tests

```bash
# Entorno de pruebas (chat-test.bodasdehoy.com):
E2E_ENV=dev npx playwright test e2e-app/permisos-modulos.spec.ts --project=webkit

# Solo un batch:
E2E_ENV=dev npx playwright test e2e-app/permisos-modulos.spec.ts --project=webkit --grep "PRE-DASH"

# Solo tests de lectura (no mutan datos — seguros para ejecutar siempre):
E2E_ENV=dev npx playwright test e2e-app/permisos-modulos.spec.ts --project=webkit --grep "PRE-DASH|CROSS|INV-01|INV-07"

# Con colaborador (requiere invitación aceptada + permisos configurados):
COLLAB_ACCEPTED=true E2E_ENV=dev npx playwright test e2e-app/permisos-modulos.spec.ts --project=webkit --grep "COLLAB"

# Guardar resultados:
E2E_ENV=dev npx playwright test ... --reporter=list 2>&1 | tee e2e-app/resultados-batch-$(date +%Y-%m-%d).tsv
```

**Siempre usar `--project=webkit`** (configurado en el proyecto, nunca Chromium).

---

## 10. Cómo replicar este modelo en otro proyecto

Este sistema es aplicable a cualquier producto con **IA conversacional + BD real**.

### Requisitos mínimos
1. **Chat con input de texto** — cualquier interfaz donde el usuario escribe al modelo.
2. **Selector estable de mensajes** — en nuestro caso `[data-index]`. En otro proyecto
   puede ser `.message`, `.chat-bubble`, etc. Adaptar el helper `ask()`.
3. **Datos determinísticos en BD** — un evento/entidad de test con valores conocidos.
4. **Múltiples roles de usuario** — credenciales de test para cada rol.

### Adaptar el helper `ask()` a otro proyecto
```typescript
// Cambiar solo estas dos líneas según el selector del proyecto:
const editor = page.locator('div[contenteditable="true"]').last(); // → selector del input
const articles = await page.locator('[data-index]').allTextContents(); // → selector de mensajes
```

### Estructura de fixture recomendada
```typescript
export const TEST_ENTITY = {
  id: '...',          // ID real en BD
  nombre: '...',      // nombre del evento/entidad de test
  campo1: valor1,     // valores verificados en BD — no inventar
  campo2: valor2,
} as const;

export const TEST_USERS = {
  admin:    { email, password },
  viewer:   { email, password },
  readonly: { email, password },
} as const;
```

### Principios que hacen robusto el sistema
- **Nudge automático:** si la IA no responde como esperado, reenviar con contexto explícito.
- **Patrones flexibles (regex) en lugar de strings exactos:** la IA puede responder
  de muchas formas válidas (`"44 invitados"`, `"hay 44"`, `"un total de 44"`).
- **Verificación de persistencia:** nunca confiar solo en "la IA dijo que lo hizo" —
  siempre re-preguntar para confirmar que BD cambió.
- **Baseline dinámico para tests financieros:** preguntar el valor actual antes de
  mutar, y verificar que cambió en la dirección correcta. No hardcodear importes.
- **Aislamiento de contexto** con `browser.newContext()` para tests que necesitan
  dos sesiones simultáneas (spectatorView, cross-rol).
- **Gate con `smokeGate()`:** si el servidor no responde, todos los tests del describe
  se saltan automáticamente. Cada describe tiene su propio ping (no un flag global),
  así se puede ejecutar cualquier batch con `--grep` sin depender del smoke test principal.

---

## 11. Estado actual (2026-04-10)

| Archivo | Tests | Estado |
|---|---|---|
| `crud-permission.spec.ts` | ~20 | ✅ Estables |
| `permisos-modulos.spec.ts` | 85 | ✅ Escritos, pendiente ejecutar batches nuevos |

**Infraestructura del spec:**
- `smokeGate()` — self-contained por describe, compatible con `--grep` parcial ✅
- `ask()` — `EVENT_FILTER_SUFFIX` horneado, `userPrefix` = 12 chars, `noEventHint` para COLLAB ✅
- `playwright.config.ts` — timeout global `240_000` ms ✅

**Batches pendientes de verificación en entorno dev:**
- PRE-PAGOS, PRE-ITEMS, PRE-DASH, SRV, ITR, CROSS → `E2E_ENV=dev ... --grep "PRE-DASH"`
- COLLAB → requiere: (1) aceptar invitación `jcc@marketingsoluciones.com` en appEventos,
  (2) configurar permisos por módulo, (3) `COLLAB_ACCEPTED=true`

**Fixture que necesita verificación manual:**
- `ISABEL_RAUL_EVENT.itinerario.total` = 5 (⚠️ confirmar como owner en el chat)
- `ISABEL_RAUL_EVENT.presupuesto.partida1` = 'Catering' (⚠️ confirmar que existe en BD)
