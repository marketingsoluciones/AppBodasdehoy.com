# SPRINT 1 P0 — Mapping exacto cliente → api-mcp

> **Fecha**: 2026-05-16 · **Autor**: COORD-AppEventos · **Fuente**: SSH api-mcp `/var/www/api-production/src/graphql/typeDefs/evento.ts` + tests in-vivo PROD

## Resumen ejecutivo

10 ops P0 validadas in-vivo contra api-mcp PROD con idToken Firebase real (bodasdehoy.com@gmail.com):

| # | Op | Status | Acción cliente |
|---|---|---|---|
| P0-1 | `queryenEvento` | ⚠️ mismatch tipos | Cambiar `String` → `String!` en `development` |
| P0-2 | `queryenEvento_id` | ⚠️ mismatch tipos | `_id:String` → `_id:ID!`, `development:String` → `String!` |
| P0-3 | `getEventosByUsuario` | ✅ IDÉNTICO | Sin cambios |
| P0-4 | `getEventoById` | ✅ IDÉNTICO | Sin cambios |
| P0-5 | `crearEvento` | 🚨 reescribir | `args:inputEvento` → `input: EventoInput!` |
| P0-6 | `editEvento` | 🚨 reescribir | `args:inputEditEvento` → `id: ID!, input: EventoUpdateInput!` |
| P0-7 | `borrarEvento` | 🚨 reescribir | `_id, development` → `id: ID, evento_id: ID` |
| P0-8 | `creaInvitado` | 🚨 reescribir | `args` → `evento_id: ID!, invitado: JSON!` |
| P0-9 | `editInvitado` | 🚨 reescribir | `args` → `evento_id: ID!, invitado_id: String!, datos: JSON, variable_reemplazar: JSON` |
| P0-10 | `borraInvitado` | 🚨 reescribir | `args` → `evento_id: ID!, invitado_id: String!` |

**Nota crítica**: TODOS los `@deprecated` en api-mcp redirigen a ops canónicas nuevas (`createEvento`, `updateEvento`, `deleteEvento`, `agregarInvitado`, `actualizarInvitado`, `removerInvitado`). Cliente puede:
- **Opción A**: usar deprecated apiapp-compat (firmas en esta tabla)
- **Opción B**: migrar a canónico nuevo (mejor a largo plazo, evita warnings)

Mi recomendación: **Opción B** porque las firmas deprecated también van a desaparecer.

---

## Mapping exacto · 1 sección por op

### P0-1 · queryenEvento

**Cliente actual** (`apps/appEventos/utils/Fetching.ts`):
```graphql
query ($variable: String, $valor: String, $development: String) {
  queryenEvento(variable: $variable, valor: $valor, development: $development) {
    _id
    nombre
    # ...
  }
}
```

**api-mcp PROD**:
```graphql
queryenEvento(variable: String, valor: String, development: String!): [Evento!]!
```

**Diff**: `development` ahora es `String!` (required).

**Fix Fetching.ts**:
```graphql
query ($variable: String, $valor: String, $development: String!) {  # ← !
  queryenEvento(variable: $variable, valor: $valor, development: $development) { ... }
}
```

---

### P0-2 · queryenEvento_id

**api-mcp**: `queryenEvento_id(_id: ID!, development: String!): Evento`

**Fix Fetching.ts**:
```graphql
query ($_id: ID!, $development: String!) {  # ← cambios de tipo
  queryenEvento_id(_id: $_id, development: $development) { ... }
}
```

---

### P0-3 · getEventosByUsuario ✅

**Sin cambios**. Validado con datos reales:
```json
{ "data": { "getEventosByUsuario": { "eventos": [{"_id":"...","nombre":"Confirmar florista"}] } } }
```

---

### P0-4 · getEventoById ✅

**Sin cambios**. Validado con datos reales:
```json
{ "data": { "getEventoById": {"_id":"69fbfc67387842179a486b10","nombre":"Confirmar florista"} } }
```

---

### P0-5 · crearEvento

**api-mcp** (apiapp-compat deprecated):
```graphql
crearEvento(input: EventoInput!): EventoResponse! @deprecated(reason: "Usar createEvento")
```

**api-mcp canónico** (recomendado):
```graphql
createEvento(input: EventoInput!): EventoResponse!
```

**Diff vs cliente**: el cliente pasa `args: inputEvento` (un objeto con todo). api-mcp espera `input: EventoInput!` (otro tipo).

**Fix Fetching.ts** (opción canónica):
```graphql
mutation ($input: EventoInput!) {
  createEvento(input: $input) {
    success
    message
    evento { _id nombre }
  }
}
```

**TODO frontend**: ajustar el constructor del payload `args → input` (mapping de campos a verificar).

---

### P0-6 · editEvento

**api-mcp** (apiapp-compat deprecated):
```graphql
editEvento(id: ID!, input: EventoUpdateInput!): EventoResponse!
```

**api-mcp canónico**:
```graphql
updateEvento(id: ID!, input: EventoUpdateInput!): EventoResponse!
```

**Fix Fetching.ts**:
```graphql
mutation ($id: ID!, $input: EventoUpdateInput!) {
  updateEvento(id: $id, input: $input) { success message evento { _id nombre } }
}
```

---

### P0-7 · borrarEvento

**api-mcp** (apiapp-compat):
```graphql
borrarEvento(id: ID, evento_id: ID): EventoResponse!
```

**api-mcp canónico**:
```graphql
deleteEvento(id: ID!): EventoResponse!
```

**Fix Fetching.ts** (canónico):
```graphql
mutation ($id: ID!) {
  deleteEvento(id: $id) { success message }
}
```

---

### P0-8 · creaInvitado

**api-mcp** (apiapp-compat):
```graphql
creaInvitado(evento_id: ID!, invitado: JSON!): EventoResponse!
  @deprecated(reason: "Usar agregarInvitado")
```

**api-mcp canónico**:
```graphql
agregarInvitado(evento_id: ID!, invitado: JSON!): EventoResponse!
```

**Diff vs cliente**: pasa `args` objeto, ahora son args separados `evento_id` + `invitado`.

**Fix Fetching.ts** (canónico):
```graphql
mutation ($evento_id: ID!, $invitado: JSON!) {
  agregarInvitado(evento_id: $evento_id, invitado: $invitado) {
    success message
  }
}
```

---

### P0-9 · editInvitado

**api-mcp** (apiapp-compat):
```graphql
editInvitado(
  evento_id: ID!,
  invitado_id: String!,
  datos: JSON,
  variable_reemplazar: JSON
): EventoResponse!
```

**api-mcp canónico**:
```graphql
actualizarInvitado(evento_id: ID!, invitado_id: String!, datos: JSON): EventoResponse!
```

**Fix Fetching.ts**:
```graphql
mutation ($evento_id: ID!, $invitado_id: String!, $datos: JSON) {
  actualizarInvitado(evento_id: $evento_id, invitado_id: $invitado_id, datos: $datos) {
    success message
  }
}
```

---

### P0-10 · borraInvitado

**api-mcp** (apiapp-compat):
```graphql
borraInvitado(evento_id: ID!, invitado_id: String!): EventoResponse!
```

**api-mcp canónico**:
```graphql
removerInvitado(evento_id: ID!, invitado_id: String!): EventoResponse!
```

**Fix Fetching.ts**:
```graphql
mutation ($evento_id: ID!, $invitado_id: String!) {
  removerInvitado(evento_id: $evento_id, invitado_id: $invitado_id) {
    success message
  }
}
```

---

## Plan de aplicación Sprint 1

1. **Modo prudente**: arrancar con P0-1/P0-2 (cambio trivial: tipos) sobre branch separado
2. **Smoke test** cada cambio contra api-mcp PROD con idToken Firebase real
3. **P0-3/P0-4** sin cambios — solo añadir test E2E que confirme idéntico
4. **P0-5 a P0-10** mutations: cada una en commit separado + test E2E
5. **Feature flag** opcional: env var `USE_API_MCP_FOR_EVENTOS=true` (default false)

## Dependencias pendientes de backend

- Confirmar `EventoInput` / `EventoUpdateInput` shape exacto (campos requeridos)
- Confirmar return shape de `EventoResponse` (campos disponibles: `success`, `message`, `evento`, `errors`?)
- ¿Hay tipos JSON estrictos para `invitado` o se acepta cualquier shape?

Esos detalles los puedo extraer también via SSH leyendo typeDefs si backend prefiere autonomía.
