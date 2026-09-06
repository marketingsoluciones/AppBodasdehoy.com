# 🐛 BUG REPORT — Notas internas: `CRM_NotesResponse.notes` non-nullable devuelve null

- **Fecha:** 2026-07-07
- **Severidad:** 🔴 Alta (funcionalidad rota)
- **Entorno:** dev (`https://app-dev.bodasdehoy.com`)
- **Componente:** BACKEND api-mcp — resolver `getCRMNotesByMultipleEntities`
- **Reportado por:** COORD-AppEventos (QA)
- **DRI:** api_mcp_oncall
- **Estado:** escalado a #coordinacion (hilo `1778170638.897419`)

---

## 1. Ubicación
`https://app-dev.bodasdehoy.com/resumen-evento` → sección **"Notas internas"**.
(También afecta a cualquier módulo que use `<NotesPanel>` / `<EntityNotesSection>`: tareas, gastos, invitados…)

## 2. Síntoma
La sección muestra el formulario (textarea, tags, checkbox privada) pero:
- Aparece el error: **`Error: [crm-ui] GraphQL: Cannot return null for non-nullable field CRM_NotesResponse.notes.`**
- La lista de notas no carga; la sección parece rota.
- El botón "Añadir nota" existe pero queda atenuado hasta escribir contenido.

## 3. Causa raíz (BACKEND)
El resolver **`getCRMNotesByMultipleEntities`** (api-mcp) devuelve **`notes: null`** cuando la
entidad **no tiene notas**. Pero el schema declara el campo como **NON-nullable**:

```graphql
type CRM_NotesResponse {
  success: Boolean!
  errors: [ErrorType!]
  total: Int
  notes: [CRM_Note!]!   # ← non-nullable; el resolver devuelve null → viola el contrato
}
```

Al devolver `null` en un campo `!`, GraphQL aborta la respuesta con
`Cannot return null for non-nullable field CRM_NotesResponse.notes` → la query completa falla.

## 4. El FRONT es correcto (no se toca)
- La query selecciona `notes { ... }` correctamente
  (`packages/shared/src/crm-ui/graphql.ts` → `GQL_GET_CRM_NOTES_BY_MULTIPLE_ENTITIES`).
- `NotesPanel` + `useCRMNotes` (`packages/shared/src/crm-ui/`) renderizan bien; el composer y el
  botón "Añadir nota" son independientes de la query de lista.
- **No se aplica workaround en front** (regla del proyecto: no rodear bugs de API con fallbacks).

## 5. Fix (BACKEND, api-mcp) — elegir UNA
- **(A) Recomendado:** el resolver devuelve `notes: []` (array vacío) cuando no hay notas.
- **(B) Alternativa:** hacer el campo nullable en el schema → `notes: [CRM_Note!]` (quitar el `!` final).

> (A) es preferible: mantiene el contrato "siempre lista" y evita null-checks en todos los consumers.

## 6. Reproducción
1. Abrir un evento **sin notas** en `/resumen-evento`.
2. Desplegar "Notas internas".
3. Se dispara la query `getCRMNotesByMultipleEntities` → responde con el error non-nullable.

## 7. Validación esperada (tras el fix backend)
- Un evento sin notas muestra "Aún no hay notas" (no un error).
- La lista carga y el composer funciona (escribir + tags + guardar) sin refrescar.
- No aparece el error `Cannot return null...`.

## 8. Contexto
Relacionado con el promote de `CRM_Note` a `dev` (7-jul): el shape de `CRM_NotesResponse` se dio
por ratificado, pero `dev` sigue devolviendo `null` en el caso vacío. Ver
`feedback_verificar_shape_graphql_antes_cherrypick` + `project_crm_note_shape_07jul`.
