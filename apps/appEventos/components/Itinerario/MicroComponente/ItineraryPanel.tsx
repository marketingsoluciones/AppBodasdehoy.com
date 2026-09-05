import { TaskNew } from "../../Servicios/VistaTarjeta/TaskNew"
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { Dispatch, FC, Fragment, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { AuthContextProvider } from "../../../context/AuthContext";
import { EventContextProvider } from "../../../context/EventContext";
import { Modal } from "../../Utils/Modal";
import { useToast } from "../../../hooks/useToast";
import { useAllowed, } from "../../../hooks/useAllowed";
import { useServicePermissions } from "../../../hooks/useServicePermissions";
import { WarningMessage } from "./WarningMessage";
import { useTranslation } from 'react-i18next';
import { ItineraryColumns } from "./ItineraryColumns";
import ModalLeft from "../../Utils/ModalLeft";
import { GoEye, GoEyeClosed, GoGitBranch } from "react-icons/go";
import { LiaLinkSolid } from "react-icons/lia";
import { MdOutlineDeleteOutline } from "react-icons/md";
import { OptionsSelect, Task, Itinerary, Info, ModalInterface, SelectModeSortType } from "../../../utils/Interfaces"
import { SubHeader } from "../../Servicios/Utils/SubHeader";
import { ViewItinerary } from "../../../pages/invitados";
import FormTask from "../../Forms/FormTask";
import { getStorage } from "firebase/storage";
import { useRouter, useSearchParams } from "next/navigation";
import { VscFiles } from "react-icons/vsc";
import { TbLock } from "react-icons/tb";
import { TbLockOpen } from "react-icons/tb";
import { useNotification } from "../../../hooks/useNotification";
import { PastedAndDropFile } from "../../Servicios/Utils/InputComments";
import { deleteAllFiles, deleteRecursive } from "../../Utils/storages";
import { InfoLateral } from "./InfoLateral";
import { CgInfo } from "react-icons/cg";
import { ItineraryDetails } from "../MicroComponente/ItineraryDetails"
import { SimpleDeleteConfirmation } from "../../Utils/SimpleDeleteConfirmation";
import { ExtraTableView } from "../../Servicios/ExtraTableView";
import { BoardView } from "../../Servicios/VistaKanban/BoardView";
// Importar el tipo Event con un alias para evitar conflictos
import { Event as EventInterface } from '../../../utils/Interfaces';
import { NewTableView } from "../../Servicios/VistaTabla/NewTableView";
import { PermissionTaskWrapper } from "../../Servicios/Utils/PermissionTaskWrapper";
import { PermissionTaskActionWrapper } from "../../Servicios/Utils/PermissionTaskActionWrapper";
import useSWR from 'swr';
import { handleCopyLink, cleanResponsables } from "../../Servicios/VistaTarjeta/TaskNewUtils";
import { IconArray } from "../../Servicios/VistaTabla/NewSelectIcon";
import { isStudioPathname } from "../../../utils/studioPaths";
import TareasStudioMovil from "../../Servicios/VistaTarjeta/TareasStudioMovil";

interface props {
  itinerario: Itinerary
  editTitle: boolean
  setEditTitle: any
  view: ViewItinerary
  handleDeleteItinerario: any
  handleUpdateTitle: any
  title: string
  setTitle: any
  selectTask: string
  setSelectTask: Dispatch<SetStateAction<string>>
  orderAndDirection: SelectModeSortType  // Agregar esta línea
  expandedTasks?: Set<string>
  toggleTaskExpand?: (id: string) => void
  setOrderAndDirection?: Dispatch<SetStateAction<SelectModeSortType>>
  allExpanded?: boolean
  onToggleExpandAll?: () => void
  itineraries?: Itinerary[]
  setItinerario?: (it: Itinerary) => void
  onCreateItinerario?: () => void
}

export interface EditTastk {
  values?: Task
  state: boolean | string
}

interface TaskReduce {
  fecha: number
  tasks?: Task[]
}

interface ModalItinerario extends ModalInterface {
  itinerario?: Itinerary
}

export type TempPastedAndDropFile = {
  taskID: string,
  commentID: string,
  files: PastedAndDropFile[],
  uploaded: boolean
}

export const Details = undefined

export const ItineraryPanel: FC<props> = ({ itinerario, editTitle, setEditTitle, view, handleDeleteItinerario, handleUpdateTitle, title, setTitle, selectTask, setSelectTask, orderAndDirection, expandedTasks, toggleTaskExpand, setOrderAndDirection, allExpanded, onToggleExpandAll, itineraries, setItinerario, onCreateItinerario }) => {
  const { t } = useTranslation();
  const { config, user } = AuthContextProvider()
  const { event, setEvent } = EventContextProvider()
  const [isAllowed, ht] = useAllowed()
  const { canViewTask, canEditTask } = useServicePermissions(itinerario?.viewers)
  const toast = useToast()
  const [tasks, setTasks] = useState<Task[]>()
  const [tasksReduce, setTasksReduce] = useState<TaskReduce[]>()
  const [modalStatus, setModalStatus] = useState(false)
  const [modalWorkFlow, setModalWorkFlow] = useState(false)
  const [modalCompartirTask, setModalCompartirTask] = useState(false)
  const [modalPlantilla, setModalPlantilla] = useState(false)
  const [showEditTask, setShowEditTask] = useState<EditTastk>({ state: false })
  const storage = getStorage();
  const [modal, setModal] = useState<ModalItinerario>({ state: false, title: null, values: null, itinerario: null })
  const [showModalCompartir, setShowModalCompartir] = useState({ state: false, id: null });
  const router = useRouter()
  const searchParams = useSearchParams()
  const notification = useNotification()

  // Query params usando useSearchParams (Next.js 15)
  const queryTask = searchParams.get("task")

  // Rediseño studio (gate ?studio, default ON): solo /itinerario. Añade los
  // huecos temporales entre tareas (fiel a itinerariovistatarjeta.html .gap).
  // Servicios (BoddyIter compartido) queda excluido por el path. Mismo backend.
  // Fila de buscador + acciones: solo en Tareas (fiel a tareasvistatarjeta.html).
  // Itinerario tiene su propia cabecera (SubHeader) y no lleva esta fila.
  const isTareas = typeof window !== "undefined" && window.location.pathname === "/servicios"
  const [q, setQ] = useState<string>("")
  // "Expandir tabla": el ensanchado va en la TARJETA (rectángulo 3), no en la tabla.
  // Aplicarlo dentro no servía: el padre seguía estrecho y la tabla se salía y se cortaba.
  // Mismo patrón que "Expandir" de PresupuestoDetalladoStudio (94vw centrado).
  const [tablaExpandida, setTablaExpandida] = useState(false)
  // Detalle de una fila de la TABLA: al pulsarla se abre su tarjeta con un banner
  // "Volver a la vista Tabla", en vez de editar en la celda (fiel a tareasvistatabla).
  const [tablaDetalle, setTablaDetalle] = useState<string | null>(null)
  // "Expandir" del tablero: como en la Tabla, el ensanchado va en la TARJETA (ItineraryPanel),
  // no dentro de BoardView, cuyo padre está limitado y cortaba la 4ª columna.
  const [tableroExpandido, setTableroExpandido] = useState(false)

  const isStudioIti = searchParams.get("studio") !== "legacy"
    && (typeof window !== "undefined" && isStudioPathname(window.location.pathname))

  // Hueco temporal entre dos tareas consecutivas (mismo día): "+X libres" o,
  // si se solapan, aviso ámbar. Null cuando no aplica (sin hora activa / 0 min).
  const renderStudioGap = (prev: Task, next: Task) => {
    try {
      if (!prev?.horaActiva || !next?.horaActiva) return null
      const startPrev = prev?.fecha ? new Date(prev.fecha).getTime() : NaN
      const startNext = next?.fecha ? new Date(next.fecha).getTime() : NaN
      if (isNaN(startPrev) || isNaN(startNext)) return null
      const endPrev = startPrev + (Number(prev?.duracion) || 0) * 60000
      const diffMin = Math.round((startNext - endPrev) / 60000)
      if (diffMin === 0) return null
      const overlap = diffMin < 0
      const abs = Math.abs(diffMin)
      const h = Math.floor(abs / 60)
      const m = abs % 60
      const dur = [h ? `${h} h` : "", m ? `${m} min` : ""].filter(Boolean).join(" ")
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 10px" }}>
          <div style={{ flex: 1, height: 1, background: "#ececef" }} />
          <span style={{ font: "500 11px Poppins", color: overlap ? "#E0A32B" : "#a0a0a8", whiteSpace: "nowrap" }}>
            {overlap ? `⚠ ${t("Se solapa con la tarea anterior")}` : `+${dur} ${t("libres")}`}
          </span>
          <div style={{ flex: 1, height: 1, background: "#ececef" }} />
        </div>
      )
    } catch { return null }
  }

  // Reordenar tareas (arrastre del asa ⋮⋮): mueve draggedId antes de targetId,
  // persiste con updateTasksOrder y desactiva el orden por fecha para que se vea.
  const handleReorderTasks = (draggedId: string, targetId: string) => {
    if (!draggedId || draggedId === targetId) return
    if (!Array.isArray(event?.itinerarios_array) || !itinerario?._id) return
    const f1 = event.itinerarios_array.findIndex((it: any) => it?._id === itinerario._id)
    if (f1 < 0) return
    const arr = Array.isArray(event.itinerarios_array[f1]?.tasks) ? [...event.itinerarios_array[f1].tasks] : []
    const from = arr.findIndex((t: any) => t?._id === draggedId)
    const to = arr.findIndex((t: any) => t?._id === targetId)
    if (from < 0 || to < 0 || from === to) return
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
    const newIds = arr.map((t: any) => t._id)
    setOrderAndDirection?.({ order: "ninguna", direction: "asc" })
    setEvent((prev: any) => ({
      ...prev,
      itinerarios_array: prev.itinerarios_array.map((it: any, i: number) => i === f1 ? { ...it, tasks: arr } : it),
    }))
    fetchApiEventos({
      query: queries.updateTasksOrder,
      variables: { evento_id: event._id, itinerario_id: itinerario._id, taskIds: newIds },
      domain: config.domain,
    }).catch((e: any) => {
      console.warn('[ItineraryPanel] updateTasksOrder falló:', e?.message ?? e)
      toast("error", t("Error al reordenar"))
    })
  }

  // ── Vista Esquema studio: timeline vertical de solo lectura (fiel al HTML) ──
  const fmtHoraEsq = (f: any) => { const d = new Date(f); if (isNaN(d.getTime())) return ""; let h = d.getUTCHours(); const m = d.getUTCMinutes(); const ap = h < 12 ? "a. m." : "p. m."; h = h % 12; if (h === 0) h = 12; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ap}` }
  const fmtDurEsq = (min: any) => { const v = Number(min) || 0; if (!v) return ""; const h = Math.floor(v / 60); const m = v % 60; return [h ? `${h} h` : "", m ? `${m} m` : ""].filter(Boolean).join(" ") }
  const renderStudioSchema = () => {
    const list: any[] = Array.isArray(tasks) ? tasks : []
    return (
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "12px 40px 40px" }}>
        <div style={{ textAlign: "center", font: "400 12px Poppins", color: "#a0a0a8", marginBottom: 22 }}>{t("schemaHint", { defaultValue: "Vista resumida del itinerario · ideal para compartir o descargar en PDF" })}</div>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {list.map((task, idx) => {
            const first = idx === 0
            const last = idx === list.length - 1
            const responsables = cleanResponsables(task?.responsable)
            const icon = IconArray.find(el => el?.title === task?.icon)?.icon
            const hora = task?.horaActiva !== false ? fmtHoraEsq(task?.fecha) : ""
            const dur = fmtDurEsq(task?.duracion)
            return (
              <div key={task?._id || idx} style={{ display: "grid", gridTemplateColumns: "44px 26px 1fr", gap: "0 16px" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f7f7f9", border: "1px solid #E7E7EA", display: "flex", alignItems: "center", justifyContent: "center", color: "#4a4a52", flex: "none", marginTop: 4 }}>
                  <span style={{ width: 17, height: 17, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon || <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M6.3 17.7l2.8-2.8M14.9 9.1l2.8-2.8" /></svg>}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 1.5, height: 14, background: first ? "transparent" : "#F3B6CE" }} />
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff", border: "3px solid #EF5B94", flex: "none" }} />
                  <div style={{ width: 1.5, flex: 1, background: last ? "transparent" : "#F3B6CE" }} />
                </div>
                <div style={{ paddingBottom: 22 }}>
                  <div style={{ font: "700 15px Poppins", color: "#3A3A42" }}>{hora}{dur && <span style={{ font: "500 11.5px Poppins", color: "#a0a0a8", marginLeft: 6 }}>{t("duracion")} {dur}</span>}</div>
                  <div style={{ font: "600 13.5px Poppins", color: "#EF5B94", marginTop: 3 }}>{task?.descripcion || t("Sin título")}</div>
                  <div style={{ font: "400 12px Poppins", color: "#8a8a90", marginTop: 2 }}>{t("responsible")}: {responsables.length ? <b style={{ color: "#6b6b72", fontWeight: 500 }}>{responsables.join(", ")}</b> : <span style={{ color: "#c4c4cc" }}>{t("Sin asignar", { defaultValue: "sin asignar" })}</span>}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  const [tempPastedAndDropFiles, setTempPastedAndDropFiles] = useState<TempPastedAndDropFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false)
  const [currentItinerario, setCurrentItinerario] = useState<Itinerary | undefined>(itinerario);
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Per-field API debounce: key = `${taskId}:${fieldName}` → pending timer
  const apiTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Función para manejar actualización de campos
  const handleUpdate = async (fieldName: string, value: any): Promise<void> => {
    const task = tasks?.find(task => task._id === selectTask);
    const canEdit = !user?.uid ? false : canEditTask()
    if (!canEdit) {
      ht();
      return;
    }

    // Guard: si event.itinerarios_array o itinerario no están, salir sin tocar nada.
    if (!Array.isArray(event?.itinerarios_array) || !itinerario?._id) return;
    const f1 = event.itinerarios_array.findIndex(elem => elem?._id === itinerario._id);
    if (f1 < 0) return; // itinerario no encontrado
    const tasksArr = event.itinerarios_array[f1]?.tasks;
    if (!Array.isArray(tasksArr) || !task?._id) return;
    const f2 = tasksArr.findIndex(elem => elem?._id === task._id);
    if (f2 < 0) return;
    const previousValue = tasksArr[f2]?.[fieldName];

    // Optimistic local update inmutable — rollback si API falla.
    // Refactor: antes mutaba event.itinerarios_array[f1].tasks[f2][fieldName]
    // directamente (mismo array ref antes/después → React puede no detectar
    // el cambio en hijos memoizados).
    setEvent((prev) => ({
      ...prev,
      itinerarios_array: prev.itinerarios_array.map((it, i) =>
        i !== f1 ? it : {
          ...it,
          tasks: it.tasks.map((tk, j) => j !== f2 ? tk : { ...tk, [fieldName]: value }),
        }
      ),
    }));

    let apiValue: string;
    if (fieldName === 'horaActiva') {
      apiValue = value ? "true" : "false";
    } else if (['responsable', 'tags', 'attachments'].includes(fieldName)) {
      apiValue = JSON.stringify(value || []);
    } else if (fieldName === 'duracion') {
      apiValue = String(value || "0");
    } else if (fieldName === 'fecha') {
      apiValue = value?.includes?.('T') ? value : String(value || "");
    } else if (fieldName === 'spectatorView') {
      apiValue = `${value}`;
    } else {
      apiValue = String(value || "");
    }

    // Debounce API call per task+field — only the last value in a burst is sent
    const debounceKey = `${task._id}:${fieldName}`;
    const pending = apiTimersRef.current.get(debounceKey);
    if (pending) clearTimeout(pending);

    const timer = setTimeout(async () => {
      apiTimersRef.current.delete(debounceKey);
      setLoading(true);
      try {
        await fetchApiEventos({
          query: queries.editTask,
          variables: {
            evento_id: event._id,
            itinerario_id: itinerario._id,
            task_id: task._id,
            development: config.development || "bodasdehoy",
            updates: { [fieldName]: apiValue },
          },
          domain: config.domain,
        });

        // Debounced side-effects: notifications + postMessage
        const notifiableFields = ['descripcion', 'fecha', 'prioridad', 'estatus', 'responsable'];
        if (notifiableFields.includes(fieldName)) {
          if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
          updateTimerRef.current = setTimeout(() => {
            const assignees = (task.responsable ?? []).filter((uid: string) => uid !== user?.uid);
            if (assignees.length > 0) {
              const focused = `/itinerario?event=${event._id}&itinerary=${itinerario._id}&task=${task._id}`;
              notification({
                type: 'user',
                message: ` ha actualizado la tarea: <strong>${task.descripcion}</strong> | Evento ${event?.tipo}: <strong>${event?.nombre?.toUpperCase()}</strong>`,
                uids: assignees,
                focused,
              });
            }
            window.parent?.postMessage({ type: 'REFRESH_EVENTS', source: 'appEventos' }, '*');
          }, 400);
        }

        !['horaActiva'].includes(fieldName) && (fieldName === 'duracion' ? value !== 0 : true) && toast("success", t("Campo actualizado"));
      } catch (error) {
        console.error('Error al actualizar:', error);
        // Rollback optimistic state change (inmutable)
        if (f1 >= 0 && f2 >= 0) {
          setEvent((prev) => ({
            ...prev,
            itinerarios_array: prev.itinerarios_array.map((it, i) =>
              i !== f1 ? it : {
                ...it,
                tasks: it.tasks.map((tk, j) => j !== f2 ? tk : { ...tk, [fieldName]: previousValue }),
              }
            ),
          }));
        }
        toast("error", t("Error al actualizar"));
      } finally {
        setLoading(false);
      }
    }, 400);

    apiTimersRef.current.set(debounceKey, timer);
  };

  const optionsItineraryButtonBox: OptionsSelect[] = [
    // {
    //   value: "edit",
    //   icon: <PencilEdit className="w-5 h-5" />,
    //   title: "editar",
    //   onClick: (values: Task) => !isAllowed() ? ht() : user.uid === event.usuario_id ? setShowEditTask({ values, state: !showEditTask.state }) : setShowEditTask({ values, state: ["/itinerario"].includes(window?.location?.pathname) ? values?.estatus === false || values?.estatus === null || values?.estatus === undefined ? !showEditTask.state : null : !showEditTask.state }),
    //   vew: "all"
    // },
    {
      value: "status",
      icon: <GoEyeClosed className="w-4 h-4" />,
      getIcon: (value: boolean) => {
        if (["/itinerario"].includes(window?.location?.pathname)) {
          if (value !== true) {
            return <GoEyeClosed className="w-4 h-4" />
          } else {
            return <GoEye className="w-4 h-4 text-primary" />
          }
        } else {
          if (value) {
            return <GoEyeClosed className="w-4 h-4" />
          }
          return <GoEye className="w-4 h-4 text-primary" />
        }
      },
      title: "Visibilidad",
      onClick: (values: Task) => {
        !isAllowed()
          ? ht()
          : handleAddSpectatorView(values)
      },
      vew: "all"
    },
    {
      value: "flujo",
      icon: <GoGitBranch className="w-4 h-4" />,
      title: "flow",
      onClick: () => !isAllowed() ? ht() : setModalWorkFlow(!modalWorkFlow),
      vew: "tasks"
    },
    {
      value: "share",
      icon: <LiaLinkSolid className="w-4 h-4" />,
      title: "Link calendario1",
      onClick: (values: Task, itinerario: Itinerary) => !isAllowed() ? ht() : handleCopyLink({
        task: values, type: "calendar", event, navigator, toast, t, document, itinerario
      }),
      vew: "tasks"
    },
    {
      value: "delete",
      icon: <MdOutlineDeleteOutline className="w-4 h-4" />,
      title: "borrar",
      onClick: (values: Task) => !isAllowed()
        ? ht()
        : user.uid === event.usuario_id
          ? setModal({ values: values, itinerario: itinerario, state: true, title: values.descripcion })
          : ["/itinerario"].includes(window?.location?.pathname)
            ? (values?.estatus === true || values?.estatus === null)
              ? setModal({ values: values, itinerario: itinerario, state: true, title: values.descripcion })
              : null
            : setModal({ values: values, itinerario: itinerario, state: true, title: values.descripcion }),
      vew: "all"
    },
    {
      value: "estatus",
      icon: <TbLock className="w-4 h-4" />,
      getIcon: (values: boolean) => {
        if (values === false) {
          return <TbLock className="w-4 h-4" />
        } else {
          return <TbLockOpen className="w-4 h-4 text-primary" />
        }
      },
      title: "estatus",
      onClick: (values: Task) => !isAllowed() ? ht() : user.uid === event.usuario_id ? handleChangeStatus(values) : null,
      vew: "all"
    },

  ]

  // Cleanup pending API debounce timers on unmount to prevent state updates on unmounted component
  useEffect(() => {
    return () => {
      apiTimersRef.current.forEach(clearTimeout);
      if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    };
  }, []);

  useEffect(() => {
    // BUG-CW-02 (informe QA 22-jun noche): si event.itinerarios_array contiene
    // elementos null/undefined, it._id === ... crashea. Guard Array + filter null.
    if (
      event &&
      Array.isArray(event.itinerarios_array) &&
      itinerario &&
      typeof itinerario._id !== "undefined"
    ) {
      const found = event.itinerarios_array.find(
        (it: Itinerary) => it && it._id === itinerario._id
      );
      if (found) {
        setCurrentItinerario({ ...found });
      } else {
        // Itinerario eliminado del evento: no dejar tareas stale en pantalla.
        setCurrentItinerario(undefined);
        setTasks([]);
        setTasksReduce([]);
      }
    }
  }, [event, itinerario?._id, orderAndDirection]);

  useEffect(() => {
    if (currentItinerario?.tasks?.length > 0) {
      const array = view === "kanban" ? currentItinerario : itinerario
      const term = q.trim().toLowerCase();
      const filteredTasks = array?.tasks?.filter(elem =>
        elem && (
          view === "schema"
          || ["/itinerario"].includes(window?.location?.pathname)
          || canViewTask(elem)
        )
        // Buscador de Tareas: filtra por título y descripción. Sin término no filtra nada,
        // así que el resto de vistas y de rutas se comportan exactamente igual que antes.
        && (!term
          || String(elem?.descripcion ?? "").toLowerCase().includes(term)
          || String(elem?.tips ?? "").toLowerCase().includes(term))
      );
      if (view === "schema") {
        filteredTasks.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      }
      setTasks(filteredTasks);
      // O(n) con Map keyed por el DÍA EN EL HUSO DEL EVENTO.
      // Antes la clave salía de componentes UTC (getUTCFullYear/Month/Date) mientras que
      // la hora de cada tarjeta se pinta con timeFormated(task.fecha, event.timeZone) y el
      // chip se pintaba en hora local del navegador: tres husos distintos. Con eso, un mismo
      // día del evento podía repartirse en DOS grupos y la fecha aparecía repetida
      // (p.ej. una tarea a las 00:00 en Madrid cae en el día UTC anterior).
      // La clave se guarda como Date.UTC(...) y el chip se pinta con timeZone:"UTC",
      // así el ida y vuelta es exacto y la etiqueta no vuelve a desplazarse.
      const eventTz = event?.timeZone && typeof event.timeZone === 'string' ? event.timeZone : 'UTC';
      const dayKeyInEventTz = (value: string | number | Date): number | null => {
        const d = new Date(value);
        if (isNaN(d.getTime())) return null;
        try {
          const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: eventTz, year: 'numeric', month: '2-digit', day: '2-digit',
          }).formatToParts(d).reduce<Record<string, string>>((acc, x) => { acc[x.type] = x.value; return acc; }, {});
          return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
        } catch {
          // Huso inválido guardado en el evento: no romper la vista, caer a UTC.
          return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
        }
      };
      const dateMap = new Map<number | null, Task[]>();
      for (const item of filteredTasks) {
        const date: number | null = item.fecha ? dayKeyInEventTz(item.fecha) : null;
        const bucket = dateMap.get(date);
        if (bucket) bucket.push(item);
        else dateMap.set(date, [item]);
      }
      const taskReduce: TaskReduce[] = Array.from(dateMap.entries()).map(([date, tasks]) => ({
        fecha: date,
        tasks,
      }));
      setTasksReduce(taskReduce);
    } else {
      setTasks(prev => (prev && prev.length === 0 ? prev : []));
      setTasksReduce(prev => (prev && prev.length === 0 ? prev : []));
    }
    // canViewTask NO va en deps: se recrea cada render (useAllowed / viewers ?? [])
    // y provoca Maximum update depth. view sí, para refiltrar al cambiar esquema/cards.
    // event?.timeZone SÍ va en deps: el selector de huso lo cambia en caliente y los
    // grupos por día deben recalcularse, o quedarían partidos según el huso anterior.
  }, [currentItinerario, itinerario, view, event?.timeZone, q]);

  const handleAddSpectatorView = async (values: Task) => {
    try {

      const newSpectatorViewValue = values?.spectatorView === null ? true : !values?.spectatorView

      fetchApiEventos({
        query: queries.editTask,
        variables: {
          evento_id: event._id,
          itinerario_id: itinerario._id,
          task_id: values._id,
          development: config.development || "bodasdehoy",
          updates: { spectatorView: newSpectatorViewValue }
        },
        domain: config.domain
      })
        .then(() => {
          const f1 = event.itinerarios_array.findIndex(elem => elem._id === itinerario._id)
          setEvent((prev) => ({
            ...prev,
            itinerarios_array: prev.itinerarios_array.map((it, i) =>
              i !== f1 ? it : {
                ...it,
                tasks: it.tasks.map(tk => tk._id !== values._id ? tk : { ...tk, spectatorView: newSpectatorViewValue }),
              }
            ),
          }))
          toast("success", t("Item guardado con exito"))
          setShowEditTask({ state: false })
        })
    } catch (error) {
      console.error('[ItineraryPanel] handleSpectatorView error:', error)
    }
  }
  const handleChangeStatus = async (values: Task) => {
    try {
      fetchApiEventos({
        query: queries.editTask,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          taskID: values._id,
          variable: "estatus",
          valor: JSON.stringify(!values?.estatus)
        },
        domain: config.domain
      })
        .then(() => {
          const f1 = event.itinerarios_array.findIndex(elem => elem._id === itinerario._id)
          const newEstatus = !values?.estatus
          setEvent((prev) => ({
            ...prev,
            itinerarios_array: prev.itinerarios_array.map((it, i) =>
              i !== f1 ? it : {
                ...it,
                tasks: it.tasks.map(tk => tk._id !== values._id ? tk : { ...tk, estatus: newEstatus }),
              }
            ),
          }))
          toast("success", t("Item guardado con exito"))
          setShowEditTask({ state: false })
          const asd = event?.detalles_compartidos_array?.filter(elem => ["edit", "view"]?.includes(elem?.permissions?.find(el => el.title === "itinerari")?.value))?.map(elem => elem.uid)
          let qwe = [...asd, event.usuario_id]
          const af1 = qwe.findIndex(elem => elem === user?.uid)
          if (af1 > -1) {
            qwe.splice(af1, 1)
          }
          const focused = `${window.location.pathname}?event=${event._id}&itinerary=${itinerario._id}&task=${values._id}`
          notification({
            type: "user",
            message: ` ha cambiado el estatus de la actividad a: ${values.estatus === false ? "Desbloqueado" : "Bloqueado"} | Evento ${event?.tipo}: <strong>${event?.nombre.toUpperCase()}</strong>`,
            uids: qwe,
            focused
          })
        })
    } catch (error) {
    }
  }
  const deleteTask = (values: Task, itinerario: Itinerary) => {
    try {
      setLoading(true)
      deleteAllFiles(storage, `${values?._id}`)
        .then(() => deleteRecursive(storage, `event-${event?._id}//itinerary-${itinerario?._id}//task-${values._id}`)
          .then(() => {
            fetchApiEventos({
              query: queries.deleteTask,
              variables: {
                task_id: values._id,
                development: config.development || "bodasdehoy",
              },
              domain: config.domain
            }).then(() => {
              const f1 = event.itinerarios_array.findIndex(elem => elem._id === itinerario._id);
              setEvent((prev) => ({
                ...prev,
                itinerarios_array: prev.itinerarios_array.map((it, i) =>
                  i !== f1 ? it : {
                    ...it,
                    tasks: it.tasks.filter(tk => tk._id !== values._id),
                  }
                ),
              }));
              setTimeout(() => {
                setModal({ state: false, title: null, values: null, itinerario: null });
                setLoading(false);
              }, 500);
              toast("success", t(itinerario.tipo === "itinerario" ? "activitydeleted" : "servicedeleted"));
            })
          })
        )

    } catch (error) {
    }
  }

  useEffect(() => {
    if (queryTask) {
      setSelectTask(queryTask)
    }
  }, [queryTask])

  const infoLeftOptions: Info[] = [
    {
      title: "primero",
      icon: <CgInfo className="w-5 h-5" />,
      info: <ItineraryDetails itinerario={itinerario} selectTask={selectTask} view={view} />
    },
  ]
  const handleTaskUpdate = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      // Encontrar la tarea que se va a actualizar
      const taskIndex = tasks?.findIndex(task => task._id === taskId);
      if (taskIndex === -1 || taskIndex === undefined) {
        console.error('Tarea no encontrada:', taskId);
        return;
      }
      // Actualizar el estado global del evento inmediatamente (inmutable + guards).
      setEvent((oldEvent) => {
        if (!Array.isArray(oldEvent?.itinerarios_array)) return oldEvent;
        const f1 = oldEvent.itinerarios_array.findIndex(elem => elem?._id === itinerario._id);
        if (f1 < 0) return oldEvent;
        return {
          ...oldEvent,
          itinerarios_array: oldEvent.itinerarios_array.map((it, i) =>
            i !== f1 ? it : {
              ...it,
              tasks: Array.isArray(it.tasks)
                ? it.tasks.map(tk => tk?._id === taskId ? { ...tk, ...updates } : tk)
                : it.tasks,
            }
          ),
        };
      });
      // Actualizar el estado local de las tareas
      setTasks(prevTasks => {
        if (!prevTasks) return prevTasks;
        return prevTasks.map(task =>
          task._id === taskId ? { ...task, ...updates } : task
        );
      });
      // Actualizar tasksReduce también
      setTasksReduce(prevTasksReduce => {
        if (!prevTasksReduce) return prevTasksReduce;
        return prevTasksReduce.map(group => ({
          ...group,
          tasks: group.tasks?.map(task =>
            task._id === taskId ? { ...task, ...updates } : task
          )
        }));
      });
    } catch (error) {
      console.error('Error al actualizar la tarea:', error);
      toast("error", t("Error al actualizar la tarea"));
    }
  }, [tasks, itinerario?._id, event?._id, t]);

  const handleTaskCreate = useCallback(async (taskData: Partial<Task>) => {
    try {
      // Si la tarea tiene un _id, significa que ya fue creada (viene de BoardView)
      if (taskData._id) {
        return;
      }
      // Calcular fecha por defecto
      const f = new Date(parseInt(event.fecha));
      const fy = f.getUTCFullYear();
      const fm = f.getUTCMonth();
      const fd = f.getUTCDate();
      let newEpoch = new Date(fy, fm + 1, fd).getTime() + 7 * 60 * 60 * 1000;
      if (tasks?.length) {
        const item = tasks[tasks.length - 1];
        const epoch = new Date(item.fecha).getTime();
        newEpoch = epoch + (item.duracion || 30) * 60 * 1000;
      }
      const defaultDate = taskData.fecha ? new Date(taskData.fecha) : new Date(newEpoch);
      // Formatear fecha correctamente
      const year = defaultDate.getFullYear();
      const month = defaultDate.getMonth() + 1;
      const day = defaultDate.getDate();
      const fechaString = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
      const horaString = `${defaultDate.getHours().toString().padStart(2, '0')}:${defaultDate.getMinutes().toString().padStart(2, '0')}`;
      const response = await fetchApiEventos({
        query: queries.createTask,
        variables: {
          evento_id: event._id,
          development: config.development || "bodasdehoy",
          task: {
            itinerario_id: itinerario._id,
            descripcion: taskData.descripcion || "Nueva tarea",
            fecha: fechaString,
            hora: horaString,
            duracion: taskData.duracion || 30
          }
        },
        domain: config.domain
      });
      // Validar respuesta de forma segura
      if (!response) {
        throw new Error('No se recibió respuesta del servidor');
      }
      // Extraer task de EventoResponse wrapper
      const responseObj = (response as any)?.task || response;
      // Verificar que la respuesta sea un objeto válido con _id
      if (typeof responseObj !== 'object' || !responseObj._id || typeof responseObj._id !== 'string') {
        console.error('Respuesta inválida del servidor:', response);
        throw new Error('La respuesta del servidor no contiene un ID válido');
      }
      // Ahora podemos usar la respuesta como Task de forma segura
      const newTask = responseObj as Task;
      // Asignar estado localmente para el manejo en el cliente
      newTask.estado = taskData.estado || 'pending';
      // Si la tarea debe estar completada, actualizar su estatus
      if (taskData.estado === 'completed' && newTask._id) {
        try {
          await fetchApiEventos({
            query: queries.editTask,
            variables: {
              eventID: event._id,
              itinerarioID: itinerario._id,
              taskID: newTask._id,
              variable: "estatus",
              valor: "true"
            },
            domain: config.domain
          });
          newTask.estatus = true;
        } catch (error) {
          console.error('Error al actualizar estatus:', error);
        }
      }
      // Actualizar el estado global (event)
      setEvent((oldEvent) => {
        const newEvent = { ...oldEvent };
        const f1 = newEvent.itinerarios_array.findIndex(elem => elem._id === itinerario._id);
        if (f1 !== -1) {
          if (!newEvent.itinerarios_array[f1].tasks) {
            newEvent.itinerarios_array[f1].tasks = [];
          }
          // Verificar que la tarea no exista ya
          const taskExists = newEvent.itinerarios_array[f1].tasks.some(
            t => t._id === newTask._id
          );
          if (!taskExists) {
            newEvent.itinerarios_array[f1].tasks.push(newTask);
          }
        }
        return newEvent;
      }); // ✅ Agregar llave de cierre faltante
      // Actualizar el estado local (tasks) - verificar que no exista
      setTasks(prev => {
        if (!prev) return [newTask];
        const taskExists = prev.some(t => t._id === newTask._id);
        if (taskExists) return prev;
        return [...prev, newTask];
      });

      // Seleccionar la nueva tarea
      setSelectTask(newTask._id);
      // Notificar éxito
      toast("success", t("Tarea creada con éxito"));
    } catch (error) {
      console.error('Error al crear la tarea:', error);
      toast("error", t("Error al crear la tarea"));
    }
  }, [event?._id, itinerario?._id, tasks, config?.domain, t]);

  const fetcher = useCallback(async () => {
    const data = await fetchApiEventos({
      query: queries.getEventsByID,
      variables: { variable: "_id", valor: event._id, development: config?.development || "" }
    });
    if (Array.isArray(data) && data.length === 0) return null;
    if (data && typeof data === "object" && "queryenEvento" in data) {
      const evento = Array.isArray((data as any).queryenEvento)
        ? (data as any).queryenEvento[0]
        : (data as any).queryenEvento;
      return evento;
    }
    if (data && typeof data === "object" && (data as any)._id) {
      return data;
    }
    return null;
  }, [event?._id, config?.development]);

  const { data: swrEvent } = useSWR(
    event?._id ? ["event", event._id] : null,
    fetcher,
    {
      revalidateOnFocus: false,    // Deshabilitar fetch en focus
      revalidateOnReconnect: true, // Solo en reconexión
      refreshInterval: 0,
      dedupingInterval: 5000,      // Evitar fetches duplicados por 5 segundos
    }
  );

  useEffect(() => {
    if (swrEvent && swrEvent._id && swrEvent._id !== event?._id) {
      setEvent(swrEvent as EventInterface);
    }
  }, [swrEvent, event?._id]);

  useEffect(() => {
    if (selectTask) {
      // Esperar un poco para que el DOM se actualice
      setTimeout(() => {
        const element = document.getElementById(selectTask);
        if (element) {
          const elementRect = element.getBoundingClientRect();
          const container = element.closest('.overflow-auto') as HTMLElement | null;
          const previousScrollTop = ["/itinerario"].includes(window?.location?.pathname) ? 48 : 24;
          if (container) {
            // Si hay un contenedor con overflow-auto, usar scrollTo en ese contenedor
            const containerRect = container.getBoundingClientRect();
            const targetScrollTop = container.scrollTop + elementRect.top - containerRect.top - previousScrollTop;
            container.scrollTo({
              top: targetScrollTop,
              behavior: 'smooth'
            });
          } else {
            // Si no hay contenedor, usar scrollTo en window
            const targetScrollTop = window.pageYOffset + elementRect.top - previousScrollTop;
            window.scrollTo({
              top: targetScrollTop,
              behavior: 'smooth',
            });
          }
        }
      }, 100);
    }
  }, [selectTask, currentItinerario])

  return (
    <>
    {/* MÓVIL de Tareas (solo tarjetas), fiel a tareasmovil.html. Escritorio: hidden md:flex. */}
    {isStudioIti && isTareas && (
      <TareasStudioMovil
        itinerario={itinerario}
        tasks={tasks || []}
        expandedTasks={expandedTasks}
        toggleTaskExpand={toggleTaskExpand}
        handleUpdate={handleUpdate}
        handleTaskUpdate={handleTaskUpdate}
        handleTaskCreate={handleTaskCreate}
        deleteTask={deleteTask}
        title={title}
        event={event}
        itineraries={itineraries}
        onSelectItinerario={setItinerario}
        onCreateItinerario={onCreateItinerario}
      />
    )}
    <div
      style={isStudioIti && isTareas ? {
        background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16,
        padding: "14px 18px 18px", gap: 10,
        transition: "margin .3s ease, width .3s ease",
        // El contenedor de BoddyIter es flex con items-center, así que YA centra al hijo:
        // el marginLeft negativo de Presupuesto —pensado para un contenedor de bloque—
        // lo desplazaba a la izquierda. Basta con el ancho.
        ...((tablaExpandida || tableroExpandido) ? { width: "94vw", maxWidth: "94vw" } : {}),
      } : undefined}
      className={`w-full flex-1 flex flex-col ${isStudioIti && isTareas ? "hidden md:flex" : ""} ${isStudioIti && view === "table" ? "overflow-visible" : `overflow-auto ${isStudioIti ? "iti-hidescroll" : ""}`}`}>
      {isStudioIti && <style dangerouslySetInnerHTML={{ __html: ".iti-hidescroll{scrollbar-width:none;-ms-overflow-style:none;}.iti-hidescroll::-webkit-scrollbar{display:none;width:0;height:0;}" }} />}
      <InfoLateral ubication="left" infoOptions={infoLeftOptions} />
      <InfoLateral ubication="right" infoOptions={[]} />
      {showEditTask?.state && (
        <ModalLeft state={showEditTask} set={setShowEditTask} clickAwayListened={false}>
          <div className="w-full flex flex-col items-start justify-start" >
            <FormTask showEditTask={showEditTask} setShowEditTask={setShowEditTask} itinerarioID={itinerario._id} />
          </div>
        </ModalLeft>
      )}
      {modal.state && <SimpleDeleteConfirmation
        loading={loading}
        setModal={setModal}
        title={modal.title}
        handleDelete={() => deleteTask(modal.values, modal.itinerario)}
        message={t('warningdeletetask', 'Si borras esta tarea no la podrás recuperar.')}
      />}
      <div
        {...(view === "schema" ? { "data-pdf-root": "itinerario-schema" } : {})}
        className="w-full flex-1 flex flex-col"
      >
      {/* Solo en vista Tarjeta: la tabla y el tablero traen su propia barra (TableHeader /
          BoardHeader), y montar ésta encima duplicaba buscador y "Añadir tarea". */}
      {isStudioIti && isTareas && view === "cards" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", padding: "4px 2px" }}>
          {/* Ancho del HTML (min-width 200, sin crecer) y MISMA ALTURA que "Añadir tarea":
              36px medidos en el HTML de referencia. Fijar el ancho a 136 recortaba el texto. */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #E7E7EA", borderRadius: 10, padding: "0 14px", height: 36, minWidth: 200, background: "#fff" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a8a90" strokeWidth={2} strokeLinecap="round" style={{ flex: "none" }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("Buscar tareas…", { defaultValue: "Buscar tareas…" })}
              style={{ border: "none", outline: "none", font: "400 12.5px Poppins", color: "#3A3A42", width: "100%", background: "transparent" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => !isAllowed() ? ht() : handleTaskCreate({})}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 12, background: "#EF5B94", color: "#fff", font: "600 12.5px Poppins", border: "none", cursor: "pointer", boxShadow: "0 5px 14px rgba(239,91,148,.28)", whiteSpace: "nowrap" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              {t("Añadir tarea", { defaultValue: "Añadir tarea" })}
            </button>
            {onToggleExpandAll && (
              <div
                onClick={() => onToggleExpandAll()}
                title={allExpanded ? t("collapseAll", { defaultValue: "Contraer todo" }) : t("expandAll", { defaultValue: "Expandir todo" })}
                style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #E7E7EA", display: "flex", alignItems: "center", justifyContent: "center", color: "#8a8a90", cursor: "pointer", background: "#fff", flex: "none" }}
              >
                {allExpanded
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M7 4l5 5 5-5" /><path d="M7 20l5-5 5 5" /></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M7 9l5-5 5 5" /><path d="M7 15l5 5 5-5" /></svg>}
              </div>
            )}
          </div>
        </div>
      )}

      {["/itinerario"].includes(window?.location?.pathname) &&
        <SubHeader
          view={view}
          itinerario={itinerario}
          editTitle={editTitle}
          setEditTitle={setEditTitle}
          handleDeleteItinerario={handleDeleteItinerario}
          handleUpdateTitle={handleUpdateTitle}
          title={title}
          setTitle={setTitle}
          allExpanded={allExpanded}
          onToggleExpandAll={onToggleExpandAll}
        />
      }
      <div className="w-full flex-1 flex flex-col pt-2 px-4 md:px-2 lg:px-6 z-0">
        {
          tasksReduce?.length > 0
            ? (isStudioIti && view === "schema")
              ? renderStudioSchema()
              : view === "boardView"
              ? (<div className="w-full flex-1">
                <PermissionTaskWrapper isTaskVisible={true}>
                  <BoardView
                    expandida={tableroExpandido}
                    onToggleExpandida={() => setTableroExpandido((v) => !v)}
                    data={tasks}
                    event={event as EventInterface}
                    setEvent={setEvent}
                    itinerario={itinerario}
                    selectTask={selectTask}
                    setSelectTask={setSelectTask}
                    onTaskUpdate={handleTaskUpdate}
                    deleteTask={deleteTask}
                    onTaskDelete={(taskId) => {
                      const task = tasks.find(t => t._id === taskId);
                      if (task) {
                        deleteTask(task, itinerario);
                      }
                    }}
                    onTaskCreate={handleTaskCreate}
                    tempPastedAndDropFiles={tempPastedAndDropFiles}
                    setTempPastedAndDropFiles={setTempPastedAndDropFiles}
                    optionsItineraryButtonBox={optionsItineraryButtonBox}
                  />
                </PermissionTaskWrapper>
              </div>)
              : view === "newTable"
                ? (() => {
                  const tareaDetalle = tablaDetalle ? tasks?.find((t: any) => t._id === tablaDetalle) : null;
                  if (tareaDetalle) {
                    // Detalle de la fila: banner de volver + la MISMA tarjeta de la vista Tarjeta.
                    return (
                      <div className="w-full flex-1 flex flex-col gap-3">
                        <div
                          onClick={() => setTablaDetalle(null)}
                          style={{ display: "inline-flex", alignItems: "center", gap: 7, font: "600 13px Poppins", color: "#EF5B94", cursor: "pointer", padding: "2px 2px 0", alignSelf: "flex-start" }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                          {t("Volver a la vista Tabla", { defaultValue: "Volver a la vista Tabla" })}
                        </div>
                        <PermissionTaskActionWrapper task={tareaDetalle} isTaskVisible={tareaDetalle.spectatorView} optionsItineraryButtonBox={optionsItineraryButtonBox}>
                          <TaskNew
                            id={tareaDetalle._id}
                            task={tareaDetalle}
                            itinerario={itinerario}
                            view={"cards"}
                            optionsItineraryButtonBox={optionsItineraryButtonBox}
                            showModalCompartir={showModalCompartir}
                            setShowModalCompartir={setShowModalCompartir}
                            onClick={() => { }}
                            tempPastedAndDropFiles={tempPastedAndDropFiles}
                            setTempPastedAndDropFiles={setTempPastedAndDropFiles}
                            minimalView={false}
                            setSelectTask={setSelectTask}
                            selectTask={selectTask}
                            handleUpdate={handleUpdate}
                            isExpanded={true}
                            onToggleExpand={() => { }}
                          />
                        </PermissionTaskActionWrapper>
                      </div>
                    );
                  }
                  return (<div className="w-full flex-1">
                  <PermissionTaskWrapper isTaskVisible={true}>
                    <NewTableView
                      expandida={tablaExpandida}
                      onToggleExpandida={() => setTablaExpandida((v) => !v)}
                      data={tasks}
                      itinerario={itinerario}
                      selectTask={selectTask}
                      setSelectTask={setSelectTask}
                      onRowOpen={(taskId: string) => { setSelectTask(taskId); setTablaDetalle(taskId); }}
                      onTaskUpdate={handleTaskUpdate}
                      onTaskDelete={(taskId) => {
                        const task = tasks.find(t => t._id === taskId);
                        if (task) {
                          deleteTask(task, itinerario);
                        }
                      }}
                      onTaskCreate={handleTaskCreate}
                    />
                  </PermissionTaskWrapper>
                </div>);
                })()
                : view === "extraTable"
                  ? (<div className="w-full flex-1">
                    <PermissionTaskWrapper isTaskVisible={true}>
                      <ExtraTableView
                        data={tasks}
                        setModalStatus={setModalStatus}
                        event={event as EventInterface}
                        modalStatus={modalStatus}
                        setModalWorkFlow={setModalWorkFlow}
                        modalWorkFlow={modalWorkFlow}
                        setModalCompartirTask={setModalCompartirTask}
                        modalCompartirTask={modalCompartirTask}
                        deleteTask={deleteTask}
                        showEditTask={showEditTask}
                        setShowEditTask={setShowEditTask}
                        optionsItineraryButtonBox={optionsItineraryButtonBox}
                        selectTask={selectTask}
                        setSelectTask={setSelectTask}
                        itinerario={itinerario}
                      />
                    </PermissionTaskWrapper>
                  </div>)
                  : view !== "table"
                    ? tasksReduce?.map((el, i) => {
                      return (
                        <div key={i} className="w-full mt-2 flex flex-col gap-4">
                          {["/itinerario"].includes(window?.location?.pathname) && <div className={`w-full flex ${view === "schema" ? "justify-start" : "justify-center"}`}>
                            {isStudioIti && view !== "schema"
                              ? <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid #E7E7EA", borderRadius: 20, padding: "6px 16px", font: "600 12.5px Poppins", color: "#3A3A42" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={1.8} strokeLinecap="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>
                                {new Date(el?.fecha).toLocaleString(navigator.language, { year: "numeric", month: "long", day: "2-digit", timeZone: "UTC" })}
                              </span>
                              : <span className={`${view === "schema" ? "border-primary border-dotted mb-1" : "border-gray-300"} border-[1px] px-5 py-[1px] rounded-full text-[12px] font-semibold`}>
                                {new Date(el?.fecha).toLocaleString(navigator.language, { year: "numeric", month: "long", day: "2-digit", timeZone: "UTC" })}
                              </span>}
                          </div>}
                          {el?.tasks?.map((elem, idx) => {
                            const prevTask = idx > 0 ? el.tasks[idx - 1] : null
                            return (
                              <Fragment key={idx}>
                                {isStudioIti && prevTask && renderStudioGap(prevTask, elem)}
                                <div
                                  onDragOver={isStudioIti ? (e) => e.preventDefault() : undefined}
                                  onDrop={isStudioIti ? (e) => { e.preventDefault(); handleReorderTasks(e.dataTransfer.getData('text/plain'), elem._id) } : undefined}
                                >
                                <PermissionTaskActionWrapper
                                  task={elem}
                                  isTaskVisible={elem.spectatorView}
                                  optionsItineraryButtonBox={optionsItineraryButtonBox}
                                >
                                <TaskNew
                                  id={elem._id}
                                  key={idx}
                                  task={elem}
                                  itinerario={itinerario}
                                  view={view}
                                  optionsItineraryButtonBox={optionsItineraryButtonBox}
                                  showModalCompartir={showModalCompartir}
                                  setShowModalCompartir={setShowModalCompartir}
                                  onClick={() => { setSelectTask(elem._id) }}
                                  tempPastedAndDropFiles={tempPastedAndDropFiles}
                                  setTempPastedAndDropFiles={setTempPastedAndDropFiles}
                                  minimalView={window?.location?.pathname === "/itinerario"}
                                  setSelectTask={setSelectTask}
                                  selectTask={selectTask}
                                  handleUpdate={handleUpdate}
                                  isExpanded={expandedTasks ? expandedTasks.has(elem._id) : true}
                                  onToggleExpand={() => toggleTaskExpand?.(elem._id)}
                                  gripDraggable={isStudioIti}
                                  onGripDragStart={(e) => { e.dataTransfer.setData('text/plain', elem._id); e.dataTransfer.effectAllowed = 'move' }}
                                />
                                </PermissionTaskActionWrapper>
                                </div>
                              </Fragment>
                            )
                          })}
                        </div>
                      )
                    })
                    : <div className={isStudioIti ? "w-full" : "relative overflow-x-auto md:overflow-x-visible h-full"}>
                      <div className={isStudioIti ? "w-full" : "w-[250%] md:w-[100%]"}>
                        <div className="w-full">
                          <PermissionTaskWrapper isTaskVisible={true}>
                            <ItineraryColumns
                              data={tasks}
                              setModalStatus={setModalStatus}
                              modalStatus={modalStatus}
                              setModalWorkFlow={setModalWorkFlow}
                              modalWorkFlow={modalWorkFlow}
                              setModalCompartirTask={setModalCompartirTask}
                              modalCompartirTask={modalCompartirTask}
                              deleteTask={deleteTask}
                              showEditTask={showEditTask}
                              setShowEditTask={setShowEditTask}
                              optionsItineraryButtonBox={optionsItineraryButtonBox}
                              selectTask={selectTask}
                              setSelectTask={setSelectTask}
                              itinerario={itinerario}
                            />
                          </PermissionTaskWrapper>
                        </div>
                      </div>
                    </div>
            : isAllowed()
              ?
              <div className="capitalize w-full h-full flex flex-col justify-center items-center bg-white rounded-lg mt-3 text-gray-500 space-y-2">
                <div>
                  {t("noEvents")}
                </div>
                <div>
                  <VscFiles className="h-12 w-auto" />
                </div>
              </div>
              : <div className="capitalize w-full h-full flex flex-col justify-center items-center bg-white rounded-lg mt-3 text-gray-500 space-y-2">
                <div>
                  {t("noData")}
                </div>
                <div>
                  {t("waitOwner")}
                </div>
                <div>
                  <VscFiles className="h-12 w-auto" />
                </div>
              </div>
        }
      </div>
      </div>
      {modalStatus && <Modal set={setModalStatus} state={modalStatus} classe={"w-[95%] md:w-[450px] h-[370px]"}>
        <WarningMessage setModal={setModalStatus} modal={modalStatus} title={t("visibility")} />
      </Modal>
      }
      {modalWorkFlow && <Modal set={setModalWorkFlow} state={modalWorkFlow} classe={"w-[95%] md:w-[450px] h-[370px]"}>
        <WarningMessage setModal={setModalWorkFlow} modal={modalWorkFlow} title={t("workflow")} />
      </Modal>
      }
      {modalCompartirTask && <Modal set={setModalCompartirTask} state={modalCompartirTask} classe={"w-[95%] md:w-[450px] h-[370px]"}>
        <WarningMessage setModal={setModalCompartirTask} modal={modalCompartirTask} title={t("share")} />
      </Modal>
      }
      {modalPlantilla && <Modal set={setModalPlantilla} state={modalPlantilla} classe={"w-[95%] md:w-[450px] h-[370px]"}>
        <WarningMessage setModal={setModalPlantilla} modal={modalPlantilla} title={t("template")} />
      </Modal>
      }
    </div>
    </>
  )
}

