import { TaskNew } from "../../Servicios/VistaTarjeta/TaskNew"
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from "react";
import { AuthContextProvider } from "../../../context/AuthContext";
import { EventContextProvider } from "../../../context/EventContext";
import { Modal } from "../../Utils/Modal";
import { useToast } from "../../../hooks/useToast";
import { useAllowed, } from "../../../hooks/useAllowed";
import { WarningMessage } from "./WarningMessage";
import { useTranslation } from 'react-i18next';
import { ItineraryColumns } from "./ItineraryColumns";
import ModalLeft from "../../Utils/ModalLeft";
import { PencilEdit } from "../../icons";
import { GoEye, GoEyeClosed, GoGitBranch } from "react-icons/go";
import { LiaLinkSolid } from "react-icons/lia";
import { MdOutlineDeleteOutline } from "react-icons/md";
import { OptionsSelect, Task, Itinerary, Info, ModalInterface, SelectModeSortType } from "../../../utils/Interfaces"
import { SubHeader } from "../../Servicios/Utils/SubHeader";
import { ViewItinerary } from "../../../pages/invitados";
import FormTask from "../../Forms/FormTask";
import { getStorage } from "firebase/storage";
import { useRouter } from "next/router";
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
import { TableView } from "../../Servicios/VistaTabla/NewTableView";
import { PermissionTaskWrapper } from "../../Servicios/Utils/PermissionTaskWrapper";
import { PermissionTaskActionWrapper } from "../../Servicios/Utils/PermissionTaskActionWrapper";
import useSWR from 'swr';
import { handleCopyLink } from "../../Servicios/VistaTarjeta/TaskNewUtils";
import { el } from "date-fns/locale";


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
  setSelectTask: any
  orderAndDirection?: SelectModeSortType  // Agregar esta línea
  setOrderAndDirection?: Dispatch<SetStateAction<SelectModeSortType>>  // Agregar esta línea
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

export const ItineraryPanel: FC<props> = ({ itinerario, editTitle, setEditTitle, view, handleDeleteItinerario, handleUpdateTitle, title, setTitle, selectTask, setSelectTask, orderAndDirection, setOrderAndDirection }) => {
  const { t } = useTranslation();
  const { config, geoInfo, user } = AuthContextProvider()
  const { event, setEvent } = EventContextProvider()
  const [isAllowed, ht] = useAllowed()
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
  const notification = useNotification()
  const [tempPastedAndDropFiles, setTempPastedAndDropFiles] = useState<TempPastedAndDropFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false)
  const [task, setTask] = useState<Task>()

  const optionsItineraryButtonBox: OptionsSelect[] = [
    {
      value: "edit",
      icon: <PencilEdit className="w-5 h-5" />,
      title: "editar",
      onClick: (values: Task) => !isAllowed() ? ht() : user.uid === event.usuario_id ? setShowEditTask({ values, state: !showEditTask.state }) : setShowEditTask({ values, state: ["/itinerario"].includes(window?.location?.pathname) ? values?.estatus === false || values?.estatus === null || values?.estatus === undefined ? !showEditTask.state : null : !showEditTask.state }),
      vew: "all"
    },
    {
      value: "status",
      icon: <GoEyeClosed className="w-5 h-5" />,
      getIcon: (value: boolean) => {
        if (["/itinerario"].includes(window?.location?.pathname)) {
          if (value !== true) {
            return <GoEyeClosed className="w-5 h-5" />
          } else {
            return <GoEye className="w-5 h-5" />
          }
        } else {
          if (value) {
            return <GoEyeClosed className="w-5 h-5" />
          }
          return <GoEye className="w-5 h-5" />
        }
      },
      title: "estado",
      onClick: (values: Task) => {
        !isAllowed()
          ? ht()
          : handleAddSpectatorView(values)
      },
      vew: "all"
    },
    {
      value: "flujo",
      icon: <GoGitBranch className="w-5 h-5" />,
      title: "flow",
      onClick: () => !isAllowed() ? ht() : setModalWorkFlow(!modalWorkFlow),
      vew: "tasks"
    },
    {
      value: "share",
      icon: <LiaLinkSolid className="w-5 h-5" />,
      title: "Link calendario1",
      onClick: (values: Task, itinerario: Itinerary) => !isAllowed() ? ht() : handleCopyLink({
        task: values, type: "calendar", event, navigator, toast, t, document, itinerario
      }),
      vew: "tasks"
    },
    {
      value: "delete",
      icon: <MdOutlineDeleteOutline className="w-5 h-5" />,
      title: "borrar",
      onClick: (values: Task) => !isAllowed() ? ht() : user.uid === event.usuario_id ? setModal({ values: values, itinerario: itinerario, state: true, title: values.descripcion }) : ["/itinerario"].includes(window?.location?.pathname) ? values?.estatus === false || values?.estatus === null || values?.estatus === undefined ? setModal({ values: values, itinerario: itinerario, state: true, title: values.descripcion }) : null : setModal({ values: values, itinerario: itinerario, state: true, title: values.descripcion }),
      vew: "all"
    },
    {
      value: "estatus",
      icon: <TbLock className="w-5 h-5" />,
      getIcon: (valor: boolean) => {
        if (valor) {
          return <TbLock className="w-5 h-5" />
        }
        return <TbLockOpen className="w-5 h-5" />
      },
      title: "estatus",
      onClick: (values: Task) => !isAllowed() ? ht() : user.uid === event.usuario_id ? handleChangeStatus(values) : null,
      vew: "all"
    },

  ]

  const [currentItinerario, setCurrentItinerario] = useState<Itinerary>(itinerario);

  useEffect(() => {
    if (
      event &&
      event.itinerarios_array &&
      itinerario &&
      typeof itinerario._id !== "undefined"
    ) {
      const found = event.itinerarios_array.find(
        (it: Itinerary) => it._id === itinerario._id
      );
      if (found) setCurrentItinerario(found);
    }
  }, [event, itinerario?._id]);

  useEffect(() => {
    if (currentItinerario?.tasks?.length > 0) {
      // Primero aplicar el ordenamiento
      let sortedTasks = [...currentItinerario.tasks];

      // Aplicar ordenamiento según orderAndDirection
      if (orderAndDirection) {
        sortedTasks.sort((a, b) => {
          let comparison = 0;

          if (orderAndDirection.order === 'fecha') {
            comparison = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
          } else if (orderAndDirection.order === 'nombre') {
            comparison = (a.descripcion || '').localeCompare(b.descripcion || '', 'es');
          }

          return orderAndDirection.direction === 'desc' ? -comparison : comparison;
        });
      }

      // Luego filtrar
      const filteredTasks = sortedTasks.filter(elem =>
        elem && (
          view === "schema"
          || ["/itinerario"].includes(window?.location?.pathname)
          || elem.spectatorView
          || event.usuario_id === user.uid
          || isAllowed()
        )
      );

      /* setTasks(prev => {
        if (JSON.stringify(prev) === JSON.stringify(filteredTasks)) return prev;
        return filteredTasks;
      }); */
      setTasks(filteredTasks);

      // Para la vista de cards, agrupar por fecha pero mantener el orden interno
      if (view === "cards") {
        const taskReduce: TaskReduce[] = filteredTasks.reduce((acc: TaskReduce[], item: Task) => {
          const f = new Date(item.fecha);
          const y = f.getUTCFullYear();
          const m = f.getUTCMonth();
          const d = f.getUTCDate();
          const date = new Date(y, m, d).getTime();
          const f1 = acc.findIndex(elem => elem.fecha === date);
          if (f1 < 0) {
            acc.push({ fecha: item.fecha ? date : null, tasks: [item] });
          } else {
            acc[f1].tasks.push(item);
          }
          return acc;
        }, []);

        // Si se ordena por fecha, ordenar también los grupos
        if (orderAndDirection?.order === 'fecha') {
          taskReduce.sort((a, b) => {
            const comparison = a.fecha - b.fecha;
            return orderAndDirection.direction === 'desc' ? -comparison : comparison;
          });
        }
        setTasks(prev => {
          // Forzar actualización solo si hay cambios reales
          const newTasksStr = JSON.stringify(filteredTasks);
          const prevTasksStr = JSON.stringify(prev);

          if (newTasksStr !== prevTasksStr) {
            return filteredTasks;
          }
          return prev;
        });

        setTasksReduce(prev => {
          if (JSON.stringify(prev) === JSON.stringify(taskReduce)) return prev;
          return taskReduce;
        });
      }
    } else {
      setTasks(prev => (prev && prev.length === 0 ? prev : []));
      setTasksReduce(prev => (prev && prev.length === 0 ? prev : []));
    }
  }, [currentItinerario, event, view,]);

  const handleAddSpectatorView = async (values: Task) => {
    try {

      const newSpectatorViewValue = values?.spectatorView === null ? true : !values?.spectatorView

      fetchApiEventos({
        query: queries.editTask,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          taskID: values._id,
          variable: "spectatorView",
          valor: JSON.stringify(newSpectatorViewValue)
        },
        domain: config.domain
      })
        .then(() => {
          const f1 = event.itinerarios_array.findIndex(elem => elem._id === itinerario._id)
          const f2 = event.itinerarios_array[f1].tasks.findIndex(elem => elem._id === values._id)
          event.itinerarios_array[f1].tasks[f2].spectatorView = newSpectatorViewValue
          setEvent({ ...event })
          toast("success", t("Item guardado con exito"))
          setShowEditTask({ state: false })
        })
    } catch (error) {
      console.log(error)
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
          const f2 = event.itinerarios_array[f1].tasks.findIndex(elem => elem._id === values._id)
          event.itinerarios_array[f1].tasks[f2].estatus = !values?.estatus
          setEvent({ ...event })
          toast("success", t("Item guardado con exito"))
          setShowEditTask({ state: false })
          const asd = event.detalles_compartidos_array.filter(elem => ["edit", "view"].includes(elem.permissions.find(el => el.title === "itinerari").value)).map(elem => elem.uid)
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
      console.log(error)
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
                eventID: event._id,
                itinerarioID: itinerario._id,
                taskID: values._id,
              },
              domain: config.domain
            }).then(() => {
              const f1 = event.itinerarios_array.findIndex(elem => elem._id === itinerario._id);
              if (f1 !== -1 && event.itinerarios_array[f1]?.tasks) {
                const f2 = event.itinerarios_array[f1].tasks.findIndex(elem => elem && elem._id === values._id);
                if (f2 !== -1) {
                  event.itinerarios_array[f1].tasks.splice(f2, 1);
                  setEvent({ ...event });
                }
              }
              setTimeout(() => {
                setModal({ state: false, title: null, values: null, itinerario: null });
                setLoading(false);
              }, 500);
              toast("success", t(itinerario.tipo === "itinerario" ? "activitydeleted" : "servicedeleted"));
            })
          })
        )

    } catch (error) {
      console.log(1000501, error)
    }
  }

  useEffect(() => {
    if (router?.query?.task) {
      setSelectTask(`${router.query.task}`)
    }
  }, [router])

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
      // Actualizar el estado global del evento inmediatamente
      setEvent((oldEvent) => {
        const newEvent = { ...oldEvent };
        const f1 = newEvent.itinerarios_array.findIndex(elem => elem._id === itinerario._id);
        if (f1 > -1) {
          const f2 = newEvent.itinerarios_array[f1].tasks.findIndex(elem => elem._id === taskId);
          if (f2 > -1) {
            // Actualizar la tarea con los nuevos valores
            newEvent.itinerarios_array[f1].tasks[f2] = {
              ...newEvent.itinerarios_array[f1].tasks[f2],
              ...updates
            };
          }
        }
        return newEvent;
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
          eventID: event._id,
          itinerarioID: itinerario._id,
          descripcion: taskData.descripcion || "Nueva tarea",
          fecha: fechaString,
          hora: horaString,
          duracion: taskData.duracion || 30
        },
        domain: config.domain
      });
      // Validar respuesta de forma segura
      if (!response) {
        throw new Error('No se recibió respuesta del servidor');
      }
      // ✅ Agregar esta línea que faltaba
      const responseObj = response as any;
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
    if (swrEvent && swrEvent._id && swrEvent._id !== event._id) {
      setEvent(swrEvent as EventInterface);
    }
  }, [swrEvent, event._id]);

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
              behavior: 'smooth'
            });
          }
        }
      }, 100);
    }
  }, [selectTask])

  return (
    <div className="w-full flex-1 flex flex-col overflow-auto">
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
        handleDelete={() => deleteTask(modal.values, modal.itinerario)}
        message={<p className="text-azulCorporativo mx-8 text-center capitalize" > Estas seguro de borrar <span className='font-semibold'>{modal.title}</span></p>}
      />}
      {["/itinerario"].includes(window?.location?.pathname) && <SubHeader view={view} itinerario={itinerario} editTitle={editTitle} setEditTitle={setEditTitle} handleDeleteItinerario={handleDeleteItinerario} handleUpdateTitle={handleUpdateTitle} title={title} setTitle={setTitle} />}
      <div className="w-full flex-1 flex flex-col pt-2 md:px-2 lg:px-6 z-0">
        {
          tasksReduce?.length > 0 ?
            view === "boardView" ? (
              <div className="w-full flex-1">
                <PermissionTaskWrapper task={task} isTaskVisible={true}>
                  <BoardView
                    data={tasks}
                    event={event as EventInterface}
                    setEvent={setEvent}
                    itinerario={itinerario}
                    selectTask={selectTask}
                    setSelectTask={setSelectTask}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskDelete={(taskId) => {
                      const task = tasks.find(t => t._id === taskId);
                      if (task) {
                        deleteTask(task, itinerario);
                      }
                    }}
                    onTaskCreate={handleTaskCreate}
                    tempPastedAndDropFiles={tempPastedAndDropFiles}
                    setTempPastedAndDropFiles={setTempPastedAndDropFiles}
                  />
                </PermissionTaskWrapper>
              </div>
            ) : view === "newTable" ? (
              <div className="w-full flex-1">
                <PermissionTaskWrapper task={task} isTaskVisible={true}>
                  <TableView
                    data={tasks}
                    itinerario={itinerario}
                    selectTask={selectTask}
                    setSelectTask={setSelectTask}
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
              </div>
            ) : view === "extraTable" ? (
              <div className="w-full flex-1">
                <PermissionTaskWrapper task={task} isTaskVisible={true}>
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
              </div>
            ) : view !== "table"
              ? tasksReduce?.map((el, i) => {
                return (
                  <div key={i} className="w-full mt-4 flex flex-col gap-4">
                    {["/itinerario"].includes(window?.location?.pathname) && <div className={`w-full flex ${view === "schema" ? "justify-start" : "justify-center"}`}>
                      <span className={`${view === "schema" ? "border-primary border-dotted mb-1" : "border-gray-300 mb-1"} border-[1px] px-5 py-[1px] rounded-full text-[12px] font-semibold`}>
                        {new Date(el?.fecha).toLocaleString(geoInfo?.acceptLanguage?.split(",")[0], { year: "numeric", month: "long", day: "2-digit" })}
                      </span>
                    </div>}
                    {el?.tasks?.map((elem, idx) => {
                      return (
                        <PermissionTaskActionWrapper
                          key={idx}
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
                            isSelect={selectTask === elem._id}
                            showModalCompartir={showModalCompartir}
                            setShowModalCompartir={setShowModalCompartir}
                            onClick={() => { setSelectTask(elem._id) }}
                            tempPastedAndDropFiles={tempPastedAndDropFiles}
                            setTempPastedAndDropFiles={setTempPastedAndDropFiles}
                            minimalView={window?.location?.pathname === "/itinerario"}
                          />
                        </PermissionTaskActionWrapper>
                      )
                    })}
                  </div>
                )
              })
              : <div className="relative overflow-x-auto md:overflow-x-visible h-full">
                <div className="w-[250%] md:w-[100%]">
                  <div className="w-full">
                    <PermissionTaskWrapper task={task} isTaskVisible={true}>
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
            : isAllowed() ?
              <div className="capitalize w-full h-full flex flex-col justify-center items-center bg-white rounded-lg mt-3 text-gray-500 space-y-2">
                <div>
                  {t("noEvents")}
                </div>
                <div>
                  <VscFiles className="h-12 w-auto" />
                </div>
              </div> : <div className="capitalize w-full h-full flex flex-col justify-center items-center bg-white rounded-lg mt-3 text-gray-500 space-y-2">
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
  )
}

