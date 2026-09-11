# PLAN FASEADO — Rediseño «Mesas y asientos» (appEventos)

> Plan realista para el agente codificador. **Verificado contra el código real** (16-jul).
> Rama: `dev` · App: `apps/appEventos/` · Objetivo: **reusar los componentes de hoy** y
> mejorar **visual + UX**, SIN tocar el motor de arrastre ni el modelo de datos.
>
> ⚠️ Este plan **corrige errores del handoff original**. Léelo antes de codificar.

---

## 0. Correcciones al handoff (verificado en código)
| Handoff decía | Realidad (verificado 16-jul) | Impacto |
|---|---|---|
| "apóyate en `TableConfiguratorFloating` ya existente" | 🔴 **NO EXISTE** ese componente | El panel de diseño se crea **desde cero** |
| Botón "Añadir plano" (crear `planSpace`) | 🔴 **`createPlanSpace` NO existe** en `utils/Fetching.ts` | **BLOQUEADO por backend** — fuera del alcance inicial |
| Formas del prototipo (Oval/Rectangular/Novios) | Backend solo tiene `redonda,cuadrada,podio,imperial,militar,bancos,banco` | Mapeo con pérdida; formas nuevas = **fase 2** |
| Crear mesa | ✅ `queries.createTable` EXISTE (`Fetching.ts:1458`), `FormCrearMesa` la usa | Reusar tal cual |

---

## 1. Alcance
### DENTRO (lote seguro — esto es lo aprobado ahora)
Reestilizado + mejora UX **reusando componentes y estado existentes**. Sin cambiar
`interact.js`, ni el modelo de datos, ni las mutaciones.

### FUERA / BLOQUEADO (no empezar sin backend)
- **"Añadir plano"** → requiere `createPlanSpace` (no existe). Confirmar con backend primero.
- **Formas nuevas reales** (oval/rectangular/novios) → enum + componente + `MesaComponent.schemaGeneral` + fallback. Fase 2.

---

## 2. ⛔ CHECKLIST "NO ROMPER" (leer antes de cada commit)
El módulo Mesas (~33 componentes, motor de arrastre `LienzoDragable` 479 + `FuntionsDragable`
460 líneas) es el más frágil de la app. **Prohibido**:
1. Cambiar **clases/ids** que usa `interact.js`: `.js-drag`, `.js-dragElement`, `.js-dragDefault`,
   `.js-dragInvitadoN`, `.js-dragInvitadoS`, `.js-dropTables`, `.js-dropGuests`, ids `table_<id>`,
   `element_<id>`, `dragN<id>`/`dragS<id>`/`dragM<id>`, y el id de silla-destino
   **`` `${tableID}-@-${chair}` ``** (lo parsea `setupDropzone` en `FuntionsDragable.tsx`).
2. Cambiar la forma de `table.guests` (`{_id, chair, order}`) ni pasar `chair` a 1-based
   (la etiqueta visible «A{n}» = `chair+1`, pero el dato es 0-based).
3. Tocar la persistencia (`ActualizarPosicion`/`ActualizarSize`/`moveGuest` en
   `FuntionsDragable.tsx`) ni el patrón inmutable `setPlanSpaceActive` + `setEvent(planSpace.map(por _id))`.
4. Reintroducir bugs resueltos: **BUG-M-01** (fallback `tipo` desconocido→`'redonda'` en
   `MesaComponent`), **BUG-M-02** (estado de drag por `WeakMap` por target, acepta coord 0).
5. Reemplazar el motor `interact.js` por drag manual/onMouseDown (el del prototipo se descarta).

> Regla: si un cambio toca `LienzoDragable`, `FuntionsDragable`, `Chair` o `MesaComponent`,
> **para y justifícalo** — probablemente hay otra forma (envolver, no modificar).

---

## 3. Plan por fases (commits pequeños, 1 fase ≠ 1 commit gigante)

### FASE A — Barra lateral (SOLO UI, riesgo bajo)
Estado global disponible (`pages/mesas.tsx:66`): `event, setEvent, planSpaceActive,
setPlanSpaceActive, filterGuests, allFilterGuests, planSpaceSelect, setEditDefault`.
Tabs actuales (`itemSelect`, default `"mesas"`): `invitados|mesas|mobiliario|zonas|planos|plantillas|resumen`.

- **A1.** `components/Utils/SubMenu.tsx`: reestilizar a **4 tabs de texto**: Planos · Mesas ·
  Mobiliario · Resumen. **Ocultar** de la barra `zonas`/`plantillas`/`invitados` (no borrar
  los componentes ni los `itemSelect==` en `mesas.tsx`; solo quitarlos de la barra visible).
- **A2.** `BlockPlanos`: tarjetas de espacio + selección (`setPlanSpaceSelect` ya existe).
  **NO** poner "Añadir plano" todavía (bloqueado, ver §5).
- **A3.** `BlockPanelElements`: reestilizar el grid; **conservar el modal SVG real**
  (`createGalerySvgs`). El botón "Añadir SVG" debe abrir ESE modal, no un placeholder.
- **A4.** `BlockResumen`: tarjetas + barras de progreso por `planSpace` (recibe
  `InvitadoSentados={filterGuests?.sentados}`).
- **A5.** `BlockInvitados`/`ListInvitados`/`DragInvitado`: reestilizar, colapsable, filtros
  (Todos/Por sentar/Sentados). Fuente: `filterGuests.noSentados` (`ListInvitados.tsx:17`).
  Etiqueta en sentados: `Mesa · A{chair+1}`.
  **Verificar** que `filterGuests`/`allFilterGuests` **excluye cancelados** (`estatus`/`asistencia`);
  si no, filtrar por `estatus` en la derivación (no en el render). *(Regla de proyecto: cancelados ocultos.)*

### FASE B — Creación unificada de mesa (riesgo medio)
- **B1.** Sustituir `BlockPanelMesas` (grid de tipos arrastrables) por: **lista de mesas creadas**
  del `planSpaceActive.tables` + botón **«Añadir mesa»**.
- **B2.** Crear el **panel de diseño** (desde cero — `TableConfiguratorFloating` NO existe):
  campos **nombre + forma + nº de sillas + preview**.
- **B3.** Al confirmar, llamar a **`queries.createTable`** (la misma que `FormCrearMesa`).
  Variables (ver `Forms/FormCrearMesa.tsx`): `eventID, planSpaceID, sectionID, values` donde
  `values` = JSON con `{nombre_mesa, cantidad_sillas, tipo, position, size...}`. Validaciones que
  ya hace FormCrearMesa: **nombre único** (no repetir en `event.mesas_array`), `cantidad_sillas`
  requerido, y **normalizar `tipo` a lowercase** (guard BUG-M-01). Reusar/extraer esa lógica,
  no reinventarla.
- **B4. Mapeo de formas (fase 1, sin tocar backend):** `Redonda→redonda, Cuadrada→cuadrada,
  Rectangular→cuadrada, Oval→redonda, Novios→podio, Banco→bancos`.
- **B5.** Mantener el flujo antiguo (drag-para-crear) **detrás de una bandera** hasta validar el nuevo.

### FASE C — Lienzo: UX y feedback (SIN tocar interact.js)
- **C1.** Reestilizar controles (zoom/lock/fit/PDF), **estado vacío** con CTA «Crea tu primera mesa».
- **C2.** Toast con **deshacer** tras crear/borrar (usar `useToast` existente).
- **C3.** **Resaltar sillas libres** al arrastrar invitado: añadir una **clase CSS** sobre las
  sillas dropzone durante el evento `dropactivate` de interact (solo CSS/clase, no cambiar ids).
- **C4.** **Zoom vs bloqueo**: con el plano bloqueado, mover/redimensionar mesas se bloquea
  pero **zoom/pan sigue funcionando**. Revisar `ComponenteTransformWrapper` para separar ambos
  estados (probablemente ya son independientes; confirmar).

### FASE D — Exportar PDF (riesgo medio, datos reales)
- **D1.** Croquis SVG del plano + lista de invitados por mesa, usando **datos reales**:
  `planSpaceActive.tables`, `table.guests`, `event.invitados_array`. El `_buildPDF` del
  prototipo es **referencia de layout**, no código a copiar.

### FASE E — QA de regresión (obligatoria tras cada fase)
- Arrastrar mesa → **se mueve y PERSISTE** tras recargar (BUG-M-02).
- Sentar invitado en silla → aparece con nº; **devolverlo** fuera → vuelve a la lista.
- Crear/editar/borrar mesa; cambiar de plano; **tipo desconocido no crashea** (BUG-M-01).
- **Cancelados ocultos** en la lista de invitados.
- Zoom funciona con el plano bloqueado.

---

## 4. Sistema visual (Guía UI del proyecto)
Poppins · marca rosa `#EF5B94` (hover `#D83E7C`) · «propietario» dorado `#FBF3E4`/`#9A7B45` ·
**resto en grises** (no marrón) · texto principal `#3A3A42`, secundario `#6b6b72`, terciario
`#a0a0a8` · botones/inputs radio ~10px · **mensajes de estado SIEMPRE en pastilla ovalada**
`border-radius:999px; padding:10px 18px` · sillas = círculos grises; sentado = relleno rosa
con número blanco. Medidas/colores exactos: `MESAS.dc.html` (prototipo).

---

## 5. BLOQUEADORES — coordinar con backend ANTES
1. **`createPlanSpace`**: no existe en `utils/Fetching.ts`. Sin ella, **NO** exponer «Añadir
   plano». Preguntar a backend: ¿cómo se crean los `planSpace` hoy? (¿solo al crear evento?
   ¿vía plantilla?). Hasta tener respuesta, la tab Planos **solo lista/selecciona**.
2. **Formas nuevas** (oval/rectangular/novios reales): requieren enum backend + componente en
   `components/Mesas/` + entrada en `MesaComponent.schemaGeneral` + fallback. **Fase 2.**

---

## 6. Orden recomendado (entregar en este orden, verificando)
`A1 → A5 (barra) → C1/C2 (lienzo UI) → B1/B2/B3/B4 (creación unificada) → C3/C4 (feedback+zoom)
→ D1 (PDF) → E (QA)`. Las fases A y C1/C2 son **puro reestilizado de bajo riesgo** (empezar por
ahí da valor rápido sin tocar lógica). B toca el flujo de creación (medio). D es aislado.

**Nunca** mezclar reestilizado visual y cambio de lógica en el mismo commit.
