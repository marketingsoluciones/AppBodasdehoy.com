# Plan: sistema de filtros desde Copilot (Resumen, Invitados, Presupuesto, Itinerario, Servicios)

## Objetivo

Que sea fácil filtrar cuando el usuario pide desde el Copilot cosas como "quiero ver la mesa X" o "la tarea Y", que ese filtro se mantenga aplicado al navegar, y que en el **panel visual derecho** (contenido principal) se muestre siempre el filtro activo con una **X** para quitarlo.

---

## Estado actual (ya implementado)

- **Contexto**: `EventsGroupContext` tiene `copilotFilter` (`entity`, `ids?`, `query?`), `setCopilotFilter` y `clearCopilotFilter`.
- **Comunicación**: El Copilot (iframe) envía por `postMessage`:
  - `FILTER_VIEW` con `payload: { entity, ids, query }` → se aplica el filtro.
  - `CLEAR_FILTER` → se limpia el filtro.
- **Barra de filtro**: El componente `CopilotFilterBar` muestra el filtro activo y un botón **✕** para quitarlo. Recibe `entity` (o lista de entidades) para decidir en qué páginas mostrarse.
- **Páginas que ya usan la barra** (y aplican el filtro a sus datos):
  - **Inicio** (`index`): eventos.
  - **Invitados** (`GrupoTablas`): invitados.
  - **Presupuesto** (`presupuesto.js`): partidas.
  - **Itinerario** (`itinerario.js`): momentos.
  - **Servicios** (`servicios.tsx`): tareas/servicios.
  - **Mesas** (`mesas.tsx`): mesas e invitados.

---

## Cambios realizados

1. **Barra global en el panel derecho**  
   En `Container.tsx` (layout) se muestra una **barra de filtro global** arriba del contenido (columna derecha), que aparece cuando hay un filtro activo de Copilot (eventos, invitados, mesas, servicios, momentos, partidas). Así el usuario ve siempre "Filtro: … · N elemento(s)" y la **X** para quitar, en cualquier página.

2. **Resumen con barra de filtro**  
   En la página **Resumen** (`resumen-evento.tsx`) se añadió `CopilotFilterBar` con todas las entidades, para que si el usuario llega a Resumen con un filtro aplicado (p. ej. "mesa 3"), vea la barra y pueda quitarla. Los bloques de Resumen (Invitados, Presupuesto, Itinerario, Mesas, etc.) pueden en el futuro leer `copilotFilter` y filtrar su contenido cuando corresponda por `entity`.

---

## Copilot (chat-ia): ya conectado

- La herramienta **`filter_view`** (builtin `lobe-filter-app-view`) envía `FILTER_VIEW` al parent con `entity`, `ids` y `query`.
- El backend (api-ia) puede devolver tool_call `filter_view`; el chat-ia lo ejecuta y el parent recibe el filtro.
- Se mejoró el **systemRole** del manifest para que la IA use `filter_view` cuando el usuario pida "quiero ver la mesa X", "muéstrame la tarea Y", etc., y para que en la respuesta sugiera ir a la sección correspondiente (Invitados, Mesas, etc.). El panel derecho muestra el filtro y la X para quitarlo.

3. **Navegación automática (implementado)**  
   Al recibir `FILTER_VIEW`, el parent navega a la sección correspondiente si no está ya ahí: `tables` → `/mesas`, `guests` → `/invitados`, `budget_items` → `/presupuesto`, `moments` → `/itinerario`, `services` → `/servicios` (en `CopilotIframe.tsx`).

4. **Resumen: filtrar bloques por filtro (implementado)**  
   - **BlockInvitados**: si `copilotFilter.entity === 'guests'` y hay `ids`, se muestran solo los invitados con `_id` en `ids`.
   - **BlockMesas**: si `copilotFilter.entity === 'tables'` y hay `ids`, se muestran solo los espacios/planSpace que contienen mesas con `_id` en `ids`.
   - BlockPresupuesto y BlockItinerario en Resumen muestran agregados o un CTA, no listas por ID.
- **Páginas completas con filtro aplicado:**
   - **Presupuesto** (`presupuesto.js`): si `copilotFilter.entity === 'budget_items'` y hay `ids`, se muestran solo las categorías con `_id` en `ids` (lista, gráfico y total).
   - **Itinerario** (`BoddyIter.tsx`): si `copilotFilter.entity === 'moments'` y hay `ids`, se filtran los itinerarios a aquellos con `_id` en `ids` antes de filtrar por tipo de vista.

5. **Persistencia al navegar**  
   El filtro ya persiste porque está en el contexto global (`EventsGroupProvider`). Al navegar con el Copilot a otra ruta, el filtro se mantiene y la barra global lo sigue mostrando.

---

## Resumen

- **Panel derecho**: barra de filtro global en el layout (visible con filtro activo + X para quitar).
- **Resumen**: barra de filtro añadida; opcional filtrar el contenido de cada bloque según `copilotFilter`.
- **Copilot**: enviar `FILTER_VIEW` (y si aplica `COPILOT_NAVIGATE`) cuando el usuario pida "ver la mesa X" o "la tarea Y".
