import { fetchApiEventos, queries } from "./Fetching";
import { eventDateAtHourZ } from "./FormatTime";
import { Itinerary, Task, Event } from "./Interfaces";

/**
 * createItinerarioList — crea una lista (itinerario/servicio) del tipo de la ruta actual.
 *
 * Es la MISMA lógica que usaba ItineraryTabs.handleCreateItinerario (el flujo de
 * escritorio, probado): crea el itinerario, encadena next_id/listIdentifiers, añade una
 * tarea inicial y actualiza estado + localStorage. Se extrajo aquí para que el selector
 * MÓVIL de Tareas (TareasStudioMovil, vía BoddyIter) cree listas EXACTAMENTE igual que el
 * escritorio, sin duplicar el cuerpo ni arriesgar que ambos se desincronicen.
 *
 * Mantiene las MISMAS formas de mutación que el escritorio (updatedListIdentifiers usa
 * variable/value, no input) a propósito: es el comportamiento probado; NO se "corrige"
 * aquí porque cambiaría negocio fuera de alcance.
 */
export interface CreateItinerarioDeps {
  event: any;
  setEvent: (updater: any) => void;
  setItinerario: (it: Itinerary) => void;
  setSelectTask: (id: string | undefined) => void;
  config: any;
  t: (k: string) => string;
  toast: (type: string, msg: string) => void;
}

async function updatedNextId(itinerary: Itinerary, eventoId: string, config: any) {
  return await fetchApiEventos({
    query: queries.editItinerario,
    variables: {
      evento_id: eventoId,
      itinerario_id: itinerary._id,
      datos: { next_id: itinerary.next_id },
    },
    domain: config.domain,
  });
}

async function updatedListIdentifiers(event: Event) {
  return await fetchApiEventos({
    query: queries.eventUpdate,
    variables: {
      idEvento: event._id,
      variable: "listIdentifiers",
      value: JSON.stringify((event as any).listIdentifiers),
    },
  });
}

export async function createItinerarioList({ event, setEvent, setItinerario, setSelectTask, config, t, toast }: CreateItinerarioDeps): Promise<void> {
  const safeItins = Array.isArray(event?.itinerarios_array) ? event.itinerarios_array : [];
  const pathSlice = typeof window !== "undefined" ? window.location.pathname.slice(1) : "servicios";
  if (safeItins.filter((elem: any) => elem?.tipo === pathSlice).length > 15) {
    toast("warning", t("maxLimitedItineraries"));
    return;
  }
  const fechaParsed = event?.fecha ? parseInt(String(event.fecha)) : NaN;
  const f = !isNaN(fechaParsed) && fechaParsed > 0 ? new Date(fechaParsed) : new Date();
  const baseDate = isNaN(f.getTime()) ? new Date() : f;
  const y = baseDate.getUTCFullYear();
  const m = baseDate.getUTCMonth();
  const d = baseDate.getUTCDate();
  try {
    const r: any = await fetchApiEventos({
      query: queries.createItinerario,
      variables: {
        evento_id: event._id,
        itinerario: {
          title: t("unnamed"),
          dateTime: new Date(y, m, d, 8, 0),
          tipo: pathSlice,
        },
      },
      domain: config.domain,
    });
    const result: Itinerary = r?.itinerario || r;
    if (!result || !result._id) {
      toast("error", t("Error al crear itinerario"));
      console.warn("[createItinerarioList] createItinerario devolvió result null/sin _id", r);
      return;
    }
    const safeList = Array.isArray(event?.listIdentifiers) ? [...event.listIdentifiers] : [];
    const fListIdentifiers = safeList.findIndex((elem: any) => elem?.table === pathSlice);
    const sameTipo = Array.isArray(event?.itinerarios_array)
      ? event.itinerarios_array.filter((elem: any) => elem?.tipo === pathSlice)
      : [];

    let nextList = safeList;
    let nextItinerarios = Array.isArray(event?.itinerarios_array) ? [...event.itinerarios_array] : [];

    if (sameTipo.length) {
      const lastListIdentifiers = fListIdentifiers >= 0 ? { ...safeList[fListIdentifiers] } : null;
      const f1 = lastListIdentifiers?.end_Id
        ? nextItinerarios.findIndex((elem: any) => elem._id === lastListIdentifiers.end_Id)
        : -1;
      if (f1 > -1 && lastListIdentifiers) {
        nextItinerarios[f1] = { ...nextItinerarios[f1], next_id: result._id };
        updatedNextId(nextItinerarios[f1], event._id, config);
        nextList = safeList.map((li: any, i: number) => (i === fListIdentifiers ? { ...li, end_Id: result._id } : li));
        updatedListIdentifiers({ ...event, listIdentifiers: nextList } as Event);
      } else {
        nextList = [...safeList, { end_Id: result._id, start_Id: result._id, table: pathSlice }];
      }
    } else if (fListIdentifiers < 0) {
      nextList = [...safeList, { start_Id: result._id, end_Id: result._id, table: pathSlice }];
    } else {
      nextList = safeList.map((li: any, i: number) => (i === fListIdentifiers ? { ...li, start_Id: result._id, end_Id: result._id } : li));
    }

    let initialTasks: Task[] = Array.isArray(result.tasks) ? [...result.tasks] : [];
    try {
      const isItinerario = pathSlice === "itinerario";
      const fecha6 = eventDateAtHourZ(event?.fecha, 6, 0);
      const createResult: any = await fetchApiEventos({
        query: queries.createTask,
        variables: {
          evento_id: event._id,
          development: config.development || "bodasdehoy",
          task: {
            itinerario_id: result._id,
            descripcion: isItinerario ? "Tarea nueva" : "Servicio nuevo",
            ...(isItinerario && {
              fecha: fecha6.toISOString(),
              hora: "06:00",
              horaActiva: true,
              duracion: 30,
              spectatorView: true,
            }),
          },
        },
        domain: config.domain,
      });
      const createdTask = (createResult?.task || createResult) as Task;
      if (createdTask?._id) {
        const taskFecha = createdTask.fecha ? new Date(createdTask.fecha as string | Date) : fecha6;
        const task: Task = {
          ...createdTask,
          fecha: taskFecha,
          ...(isItinerario ? { horaActiva: true, spectatorView: true, duracion: createdTask.duracion ?? 30 } : {}),
          estatus: true,
        };
        initialTasks = [...initialTasks, task];
        setSelectTask(task._id);
        fetchApiEventos({
          query: queries.editTask,
          variables: {
            evento_id: event._id,
            itinerario_id: result._id,
            task_id: task._id,
            development: config.development || "bodasdehoy",
            updates: { estatus: true },
          },
        }).catch((e: any) => console.warn("[createItinerarioList] editTask estatus falló:", e?.message ?? e));
      }
    } catch (taskErr: any) {
      console.warn("[createItinerarioList] createTask inicial falló:", taskErr?.message ?? taskErr);
    }

    const newItinerario = { ...result, tasks: initialTasks, viewers: (result as any).viewers ?? [] };
    nextItinerarios = [...nextItinerarios, newItinerario];
    setEvent((prev: any) => ({ ...prev, listIdentifiers: nextList, itinerarios_array: nextItinerarios }));
    setItinerario({ ...newItinerario });
    localStorage.setItem(`E_${event._id}_${pathSlice}`, result._id);
  } catch (error: any) {
    console.warn("[createItinerarioList] error:", error?.message ?? error);
    toast("error", t("Error al crear itinerario"));
  }
}
