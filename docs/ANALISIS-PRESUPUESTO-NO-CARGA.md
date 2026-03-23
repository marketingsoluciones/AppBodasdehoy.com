# Análisis: Presupuesto no carga datos al arrancar

## Resumen del problema

En la página **Presupuesto** (`/presupuesto`), al iniciar o al entrar por primera vez, no se muestran categorías ni partidas: la lista "Nueva Categoria" aparece vacía, los totales en 0,00 y el gráfico sin datos. Históricamente el sistema permitía o montaba una especie de **presupuesto por defecto** (partidas/categorías de guía).

---

## 1. Flujo actual de datos

### 1.1 Origen del evento

- **EventContext** ([context/EventContext.tsx](apps/appEventos/context/EventContext.tsx)): mantiene el evento activo `event`.
- `event` se rellena desde **eventsGroup** (evento seleccionado de la lista del usuario).
- **eventsGroup** se carga en **EventsGroupContext** con la query `queries.getEventsByID` (por `usuario_id`).

### 1.2 Dónde se usa el presupuesto

- **Página** [pages/presupuesto.js](apps/appEventos/pages/presupuesto.js):
  - Estado local: `const [categorias, setCategorias] = useState([])`.
  - Efecto: `useEffect(() => { setCategorias(event?.presupuesto_objeto?.categorias_array) }, [event])`.
  - Si `event.presupuesto_objeto` es `null`/`undefined`, o `categorias_array` no existe, `categorias` queda `undefined` (o vacío). No hay fallback a plantilla ni inicialización.

- **Componentes** que dependen de presupuesto:
  - [BlockListaCategorias](apps/appEventos/components/Presupuesto/BlockListaCategorias.tsx): usa `event?.presupuesto_objeto?.categorias_array` o prop `categorias_array`; si ambos faltan, usa `[]` (lista vacía).
  - `ExcelView`, `MontoPresupuesto`, `WeddingFinanceManager`, etc.: leen `event?.presupuesto_objeto` (totales, moneda, categorías, gastos, partidas).

### 1.3 Qué pide la API

- [Fetching.ts](apps/appEventos/utils/Fetching.ts):
  - **getEventsByID** (líneas ~1876–2212): la query que carga la lista de eventos **sí incluye** `presupuesto_objeto` completo (`presupuesto_total`, `coste_final`, `pagado`, `currency`, `categorias_array` con `gastos_array` e `items_array`).
  - **crearEvento**: la mutación que crea un evento también devuelve `presupuesto_objeto` en la respuesta (líneas ~1157–1222).

Conclusión: el frontend **sí pide** `presupuesto_objeto`. Si no hay datos, la causa más probable es que el **backend no inicializa** `presupuesto_objeto` (o lo devuelve `null`) para eventos nuevos o en ciertos casos.

---

## 2. Por qué “no carga” al arrancar

Posibles causas (a comprobar en backend y en uso real):

1. **Backend no crea `presupuesto_objeto` al crear evento**  
   Si `crearEvento` no inicializa un objeto de presupuesto (por ejemplo con `categorias_array: []`), la API puede devolver `presupuesto_objeto: null`. El frontend entonces muestra todo vacío.

2. **Evento recién seleccionado sin refetch**  
   Si en algún flujo el `event` se toma de una caché o de una query “ligera” que no incluye `presupuesto_objeto`, el presupuesto no aparecería hasta un refetch completo.

3. **Sin plantilla por defecto en frontend**  
   Aunque el backend devolviera `presupuesto_objeto: { categorias_array: [] }`, la UI seguiría vacía. No hay lógica actual que, al detectar presupuesto vacío o inexistente, muestre una **plantilla de partidas/categorías por defecto** (solo guía visual o datos de ejemplo).

---

## 3. Dónde estaba / podría estar la “plantilla” o partidas por defecto

- En el código actual **no** aparece una plantilla de categorías/partidas por defecto ni un “presupuesto inicial” que se monte al arrancar.
- En [Facturacion/Productos.tsx](apps/appEventos/components/Facturacion/Productos.tsx) se menciona textualmente: *"Podras cargar plantillas de presupuesto previamente definida de guia para tus eventos"*, lo que sugiere que la idea de “plantilla de presupuesto” existía o estaba prevista, pero no está implementada en la página de Presupuesto.
- **Lugares lógicos para introducir una plantilla o valor por defecto**:
  1. **Página Presupuesto** ([pages/presupuesto.js](apps/appEventos/pages/presupuesto.js)): al montar, si `event?.presupuesto_objeto` es `null`/`undefined`, podrían aplicarse categorías/partidas de una plantilla (solo en memoria para mostrar, o llamando a una mutación “inicializar presupuesto” si el backend la tiene).
  2. **EventContext / EventsGroupContext**: no tocar el evento global sin refetch; mejor que la “inicialización” o plantilla se limite a la página de Presupuesto o a un hook específico.
  3. **Backend**: al crear evento, inicializar siempre `presupuesto_objeto` (por ejemplo con `categorias_array: []` y totales a 0), o con categorías/partidas de plantilla si se desea guía por defecto.

---

## 4. Recomendaciones para mejorar la experiencia

### 4.1 Frontend (appEventos)

1. **Normalizar estado inicial en Presupuesto**  
   Asegurar que `categorias` sea siempre un array (p. ej. `setCategorias(event?.presupuesto_objeto?.categorias_array ?? [])`) para evitar errores cuando `categorias_array` es `undefined`.

2. **Plantilla de categorías/partidas por defecto (solo UI o también persistida)**  
   - Opción A – Solo visual: si `presupuesto_objeto` es null o `categorias_array` está vacío, mostrar una lista de ejemplo (ej. “Ceremonia”, “Banquete”, “Fotografía”, “Música”) como **plantilla de guía** no guardada, con un CTA “Usar esta plantilla” que llame a una mutación para crear el presupuesto con esas categorías.  
   - Opción B – Inicialización en backend: que `crearEvento` (o una mutación “inicializarPresupuesto”) cree siempre un `presupuesto_objeto` con categorías/partidas por defecto; el frontend solo mostraría lo que ya viene en `event`.

3. **Refetch del evento al entrar en Presupuesto (opcional)**  
   Si en algún flujo el `event` puede venir sin `presupuesto_objeto`, al montar la página Presupuesto se podría hacer un refetch del evento completo (por `event._id`) con una query que incluya `presupuesto_objeto`, y actualizar el contexto para que el resto de la app vea los datos correctos.

### 4.2 Backend (API eventos)

1. **Garantizar `presupuesto_objeto` en eventos nuevos**  
   En la mutación que crea el evento, inicializar siempre un objeto de presupuesto, por ejemplo:
   - `presupuesto_total: 0`, `coste_final: 0`, `pagado: 0`, `currency: 'EUR'` (o la que corresponda),
   - `categorias_array: []`  
   O, si se quiere guía por defecto, rellenar `categorias_array` con una plantilla predefinida (partidas típicas de boda/evento).

2. **Comprobar respuestas de `queryenEvento` / getEventsByID**  
   Verificar que, para eventos existentes, la query que usa el frontend (`getEventsByID`) devuelve siempre `presupuesto_objeto` (aunque sea vacío) y no `null` salvo que el modelo de datos lo justifique.

---

## 5. Archivos clave para seguir investigando

| Archivo | Qué revisar |
|--------|-------------------------------|
| [presupuesto.js](apps/appEventos/pages/presupuesto.js) | Efecto que hace `setCategorias(event?.presupuesto_objeto?.categorias_array)`; sitio para plantilla o inicialización cuando no hay datos. |
| [EventContext.tsx](apps/appEventos/context/EventContext.tsx) | De dónde sale `event` (eventsGroup) y si en algún flujo podría no traer `presupuesto_objeto`. |
| [EventsGroupContext.tsx](apps/appEventos/context/EventsGroupContext.tsx) | Uso de `queries.getEventsByID` y manejo de la respuesta. |
| [Fetching.ts](apps/appEventos/utils/Fetching.ts) | Definición de `getEventsByID` y `crearEvento`; confirmar que siempre se pide y se devuelve `presupuesto_objeto`. |
| [BlockListaCategorias.tsx](apps/appEventos/components/Presupuesto/BlockListaCategorias.tsx) | Uso de `event?.presupuesto_objeto?.categorias_array` y fallback a `[]`. |
| Backend (API eventos) | Mutación de creación de evento y query por usuario/evento: si inicializan o devuelven `presupuesto_objeto`. |

---

## 6. Siguientes pasos sugeridos (para Claude Code / equipo)

1. **Reproducir**: Crear un evento nuevo, ir a Presupuesto y comprobar si `event.presupuesto_objeto` llega como `null` o con `categorias_array` vacío (logs en `presupuesto.js` o React DevTools).
2. **Backend**: Revisar si al crear evento se inicializa `presupuesto_objeto`; si no, añadir esa inicialización (vacía o con plantilla).
3. **Frontend**: Añadir normalización `categorias_array ?? []` y, si se desea, una plantilla de categorías/partidas por defecto (solo visual o vía mutación de “inicializar presupuesto”) cuando no haya datos al arrancar.

Con esto se evita que la página quede vacía al iniciar y se recupera la idea de “partidas/presupuesto por defecto” o plantilla de guía que el sistema tenía o se esperaba.
