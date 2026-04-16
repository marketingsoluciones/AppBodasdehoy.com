# Plan Global de Testing — AppBodasdehoy.com

> Última revisión: 2026-04-13
> Estado del suelo: 64 specs, la mayoría dispersos o rotos

---

## 1. Qué queremos verificar (en orden de valor)

### 1.1 Consistencia DB ↔ UI
> "Lo que muestra la pantalla es lo que hay en la base de datos"

Un test de consistencia hace:
1. Consulta directa a la API (GraphQL api2 o api-ia) → obtiene el valor real del campo en DB
2. Navega al módulo en la UI
3. Verifica que el valor mostrado coincide con lo que devolvió la query

**Ejemplo concreto:**
```
DB query: GET_EVENT → invitados_array.length = 43
UI /invitados → header muestra "43 Invitados"
✓ Consistente
```

---

### 1.2 Persistencia de mutaciones (round-trip)
> "Insertar/editar/borrar realmente se graba y se puede recuperar"

Un test de persistencia hace:
1. Ejecuta la mutación desde la UI (crear invitado, editar partida, añadir servicio)
2. **Espera confirmación de la API** (no mock — respuesta real)
3. Re-consulta la API directamente
4. Verifica que el objeto creado/editado existe en la respuesta con los valores correctos

**Ejemplo concreto:**
```
UI: Crear invitado "Test-Round-{ts}", teléfono "+34611{ts}"
API responde: invitados_array incluye el nuevo invitado
Re-query GraphQL: GET_EVENT → invitados_array contiene {nombre: "Test-Round-{ts}"}
UI re-renderiza: fila "Test-Round-{ts}" visible en la tabla
Cleanup: borrar el invitado de test
✓ Persistencia verificada
```

---

### 1.3 Permisos reales (no mocks)
> "Un colaborador sin acceso no puede modificar datos, aunque manipule la UI"

Un test de permisos hace:
1. Login como rol restringido (colaborador, invited_guest, visitante)
2. Intenta la acción (crear, editar, borrar)
3. Verifica que la UI bloquea la acción Y que la API también la rechaza
4. Re-consulta la DB para confirmar que el dato no cambió

---

### 1.4 Flujo de usuario completo
> "Un usuario puede completar una tarea de principio a fin sin romperse nada"

Ejemplo: flujo RSVP
```
1. Invitado recibe link con token
2. Abre /confirmar-asistencia?pGuestEvent={token}
3. Confirma asistencia + elige menú
4. Sistema actualiza asistencia="confirmado" en DB
5. Organizador abre /invitados → ve al invitado como "confirmado"
✓ Flujo completo end-to-end
```

---

## 2. Inventario honesto del estado actual

### Tests que SÍ verifican datos reales (conservar y mantener)

| Spec | Qué verifica | Calidad |
|------|-------------|---------|
| `permisos-modulos.spec.ts` | Insert via IA → re-query → match contra DB. 3 roles × 5 módulos. | ★★★★ — real, pero fragil por parsing regex de IA |
| `crud-permission.spec.ts` | 5 preguntas sobre datos reales del evento (43 invitados, 39 confirmados, fechas exactas). Nudge retry. | ★★★★ — real, determinista |
| `invited-guest-security.spec.ts` | Gaps de seguridad en rol invited_guest. DATA_FILTER self_only. | ★★★ — real pero narrow scope |
| `chat-mensajes-2usuarios.spec.ts` | Mensajes cruzados entre usuarios reales. REFRESH_EVENTS propagation. | ★★★ — real, complejo |
| `acciones-crud.spec.ts` | Mutaciones via IA con verificación parcial en UI | ★★ — UI check pero sin re-query DB |

### Tests que NO verifican datos reales (refactorizar o eliminar)

| Spec | Problema |
|------|---------|
| `ui-invitados.spec.ts` | Mock de `creaInvitado` — nunca llama a DB real |
| `ui-kanban-servicios.spec.ts` | Solo DOM checks — no verifica estado en DB |
| `ui-presupuesto.spec.ts` | Sin validar — probablemente igual |
| `ui-portal-invitado.spec.ts` | Solo verifica "no crash" — no verifica datos públicos vs privados en DB |
| `acciones-crud.spec.ts` (parcial) | Abre panel de edición pero no verifica que el valor cambió en DB |
| `auth.spec.ts`, `auth-flow.spec.ts` | Session storage checks — no verifica auth real en backend |
| `billing.spec.ts`, `billing-saldo.spec.ts` | Mock 402 — no verifica balance real en wallet |
| Otros 50+ specs | Stale, duplicados, o sin mantenimiento |

---

## 3. El plan real: 4 capas de tests

### Capa A — Smoke (¿está encendido?)
**Cuándo falla:** El servidor no responde, hay un crash en cada módulo, la auth está rota.
**Cómo se mide:** HTTP 200 en las rutas principales + no hay `Error Capturado por ErrorBoundary` en ningún módulo.
**Tiempo estimado:** < 2 min
**Archivo:** `smoke.spec.ts` (existe, extender)

```
✓ app-test.bodasdehoy.com → 200
✓ /invitados → carga sin ErrorBoundary
✓ /mesas → carga sin ErrorBoundary
✓ /presupuesto → carga sin ErrorBoundary
✓ /servicios → carga sin ErrorBoundary
✓ /itinerario → carga sin ErrorBoundary
```

---

### Capa B — Consistencia DB ↔ UI (¿la UI muestra los datos reales?)
**Cuándo falla:** Una query GraphQL devuelve datos que la UI no muestra, o la UI muestra datos que no están en DB.
**Cómo se mide:** Query API → extraer valor → navegar a módulo → verificar mismo valor en DOM.
**Datos de referencia:** Evento "Boda Isabel & Raúl" (ID `66a9042dec5c58aa734bca44`)

```
B-01 Invitados: GET_EVENT.invitados_array.length === número en header "X Invitados"
B-02 Confirmados: invitados filtrado asistencia="confirmado" === conteo en BlockCabecera
B-03 Presupuesto: GET_EVENT.presupuesto_array suma === total en FinancialSummary
B-04 Servicios: GET_EVENT.servicios_array.length === número de tarjetas en kanban
B-05 Itinerario: GET_EVENT.itinerarios_array[0].tasks.length === número de items en timeline
B-06 Mesas: GET_EVENT.planSpace[0].tables.length === número de mesas en lienzo
```

**Implementación sugerida:**
```typescript
// Patrón para cada test B-XX
const apiData = await page.evaluate(async (query) => {
  const res = await fetch('/api/proxy/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
    body: JSON.stringify({ query })
  });
  return res.json();
}, GET_EVENT_QUERY);

await page.goto('/invitados');
const uiCount = await page.locator('[data-testid="guest-count"]').textContent();
expect(parseInt(uiCount)).toBe(apiData.data.getEvent.invitados_array.length);
```

---

### Capa C — Persistencia de mutaciones (¿el CRUD realmente se graba?)
**Cuándo falla:** Una inserción/edición/borrado parece funcionar en UI pero no se guarda en DB, o se guarda pero la UI no lo refleja correctamente.
**Cómo se mide:** Acción en UI → respuesta real de API (sin mock) → re-query → verificar campo.

#### C-01 Invitados — crear y recuperar
```
PRECONDICIÓN: Evento "Boda Isabel & Raúl", usuario owner
ACCIÓN: Abrir FormInvitado → rellenar nombre/teléfono/rol → click "Crear invitado"
ESPERAR: Respuesta real de /api/proxy/graphql (no mock) con status 200
RE-QUERY: GET_EVENT.invitados_array → buscar por teléfono único
VERIFICAR:
  - invitados_array contiene el nuevo invitado con nombre correcto
  - UI muestra fila con ese nombre en tabla
  - Contador de invitados subió en 1
CLEANUP: Borrar invitado de test via API
```

#### C-02 Presupuesto — añadir partida y verificar total
```
PRECONDICIÓN: owner
ACCIÓN: Añadir partida "E2E-Partida-{ts}" importe 99.99
ESPERAR: Respuesta real de API
RE-QUERY: GET_EVENT.presupuesto_array → buscar partida por nombre
VERIFICAR:
  - Partida existe en DB con importe 99.99
  - Total en UI aumentó en 99.99
CLEANUP: Borrar partida
```

#### C-03 Servicios — crear servicio y aparece en kanban
```
ACCIÓN: Crear servicio "E2E-Srv-{ts}" en columna Pendiente
RE-QUERY: GET_EVENT.servicios_array
VERIFICAR:
  - Servicio existe en DB con estado "pendiente"
  - Tarjeta visible en columna Pendiente del kanban
CLEANUP: Borrar servicio
```

#### C-04 Itinerario — añadir tarea y verificar en timeline
```
ACCIÓN: Añadir tarea "E2E-Task-{ts}" a las 14:00
RE-QUERY: GET_EVENT.itinerarios_array[0].tasks
VERIFICAR:
  - Tarea en DB con hora 14:00
  - Item visible en timeline de UI
CLEANUP: Borrar tarea
```

#### C-05 Mesas — asignar invitado y verificar
```
ACCIÓN: Asignar invitado existente a Mesa 1, silla 1
RE-QUERY: GET_EVENT.planSpace[0].tables[0].guests
VERIFICAR:
  - Guest asignado aparece en DB en esa silla
  - En /mesas la silla muestra el nombre del invitado
  - En /invitados la columna "Asiento" muestra "Mesa 1"
CLEANUP: Desasignar
```

#### C-06 Confirmación RSVP — flujo completo del invitado
```
PRECONDICIÓN: Token real de un invitado de test en DB
ACCIÓN: Navegar a /confirmar-asistencia?pGuestEvent={token} → confirmar asistencia
RE-QUERY: GET_EVENT.invitados_array → buscar por _id → asistencia
VERIFICAR:
  - asistencia = "confirmado" en DB
  - En /invitados (como owner) el invitado aparece en columna "confirmados"
CLEANUP: Reset asistencia a "pendiente"
```

---

### Capa D — Permisos (¿las restricciones de rol funcionan?)
**Cuándo falla:** Un rol sin permiso puede ejecutar una mutación y el dato cambia en DB.
**Cómo se mide:** Login como rol restringido → intento de acción → verificar que DB NO cambió.

#### D-01 Colaborador sin permiso invitados
```
ROL: jcc@recargaexpress.com (colaborador1 — sin acceso a Boda Isabel & Raúl)
ACCIÓN: Intenta acceder a /invitados del evento de otro owner
VERIFICAR:
  - UI muestra GuestUpsellPage o redirige
  - GET_EVENT desde su sesión devuelve 403 o sin datos del evento ajeno
```

#### D-02 Invited guest — no puede ver lista completa
```
ROL: carlos.carrillo@marketingsoluciones.com (invited_guest)
ACCIÓN: Navega a /invitados
VERIFICAR:
  - UI no muestra lista de todos los invitados (solo sus datos)
  - La API con su JWT no devuelve invitados_array completo
```

#### D-03 Sin sesión — rutas privadas redirigen
```
ROL: sin sesión
ACCIONES: GET /invitados, /mesas, /presupuesto, /servicios
VERIFICAR:
  - Cada ruta → redirige a /login O muestra demo con datos ficticios
  - NINGÚN dato real de ningún evento aparece en DOM
```

#### D-04 Owner — puede hacer todo el CRUD
```
ROL: bodasdehoy.com@gmail.com (owner)
VERIFICAR: Las acciones C-01 a C-05 completan sin errores
```

---

## 4. Lo que hay que hacer con los 64 specs actuales

### Conservar (5 archivos)
```
permisos-modulos.spec.ts     ← real, sofisticado — mantener, refactorizar helpers
crud-permission.spec.ts      ← validación real contra DB — mantener
invited-guest-security.spec.ts ← seguridad real — mantener
chat-mensajes-2usuarios.spec.ts ← flujos reales — mantener con cuidado
comentarios-tareas.spec.ts   ← bueno para CI — mantener
```

### Reescribir (4 archivos)
```
ui-invitados.spec.ts         ← tiene la estructura pero usa mocks → convertir a C-01
ui-kanban-servicios.spec.ts  ← smoke OK, añadir C-03
ui-presupuesto.spec.ts       ← revisar y añadir C-02
ui-portal-invitado.spec.ts   ← smoke OK, añadir C-06
```

### Archivar (55 archivos)
```
Mover a e2e-app/archivo/ todo lo demás.
No eliminar — pueden contener patrones útiles — pero no corren en CI.
```

---

## 5. Infraestructura de tests que falta

### 5.1 Helper de query directa a API
```typescript
// e2e-app/lib/api.ts
export async function queryEvent(page: Page, eventId: string) {
  const jwt = await page.evaluate(() => localStorage.getItem('idTokenV0.1.0'));
  return page.evaluate(async ({ eventId, jwt }) => {
    const res = await fetch('/api/proxy/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
      body: JSON.stringify({ query: GET_EVENT_BY_ID, variables: { eventID: eventId } })
    });
    return res.json();
  }, { eventId, jwt });
}
```

### 5.2 Helper de cleanup de datos de test
```typescript
// e2e-app/lib/cleanup.ts
// Borra invitados/partidas/servicios con nombre que empieza por "E2E-"
// Corre en afterAll de cada spec que crea datos
export async function cleanupTestData(page: Page, eventId: string) { ... }
```

### 5.3 Fixtures compartidos (lo que falta completar)
```
e2e-app/fixtures/
├── isabel-raul-event.ts   ✅ existe
├── test-users.ts          ⬜ mover credenciales hardcodeadas aquí
└── api-queries.ts         ⬜ centralizar las queries GraphQL usadas en tests
```

---

## 6. Criterio de éxito para CI/CD

Un PR solo puede mergearse si pasan:

```
Layer A (Smoke)         → 100% pass  — si falla, el servidor está caído
Layer B (Consistencia)  → 100% pass  — si falla, hay un bug en queries o renderizado
Layer C (Persistencia)  → 80% pass   — si falla C-01 o C-02, PR bloqueado
Layer D (Permisos)      → D-03 100%  — datos privados NUNCA en rutas públicas
```

**Tiempo total estimado en CI:** < 10 min (paralelizable en 4 workers webkit)

---

## 7. Orden de implementación

```
Semana 1: Capa A + Layer B-01 y B-02 (invitados, consistencia básica)
Semana 2: Capa C-01 (crear invitado real, sin mock)
Semana 3: C-02 y C-03 (presupuesto y servicios)
Semana 4: D-01 y D-03 (permisos colaborador y sin sesión)
Continuo:  C-04 a C-06 + D-02 + D-04
```
