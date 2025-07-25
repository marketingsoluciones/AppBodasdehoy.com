import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  GitBranch,
  Link as LinkIcon,
  Lock,
  Unlock
} from 'lucide-react';
import { Task, Comment, Itinerary, OptionsSelect } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';
import { AuthContextProvider, EventContextProvider } from '../../../context';
import { fetchApiEventos, queries } from '../../../utils/Fetching';
import { useToast } from '../../../hooks/useToast';
import { TaskNew } from '../VistaTarjeta/TaskNew';
import ClickAwayListener from 'react-click-away-listener';
import { useAllowed } from '../../../hooks/useAllowed';
import { useNotification } from '../../../hooks/useNotification';
import { GoEye, GoEyeClosed, GoGitBranch } from "react-icons/go";
import { LiaLinkSolid } from "react-icons/lia";
import { Modal } from '../../Utils/Modal';
import { WarningMessage } from '../../Itinerario/MicroComponente/WarningMessage';
import ModalLeft from '../../Utils/ModalLeft';
import FormTask from '../../Forms/FormTask';
import { getStorage, ref, listAll, deleteObject } from "firebase/storage";
import { deleteAllFiles, deleteRecursive } from "../../Utils/storages";
import { SimpleDeleteConfirmation } from "../../Utils/SimpleDeleteConfirmation";

interface TaskDetailModalProps {
  task: Task;
  itinerario: Itinerary;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onTaskCreate: (task: Partial<Task>) => void;
  tempPastedAndDropFiles?: any[];
  setTempPastedAndDropFiles?: any;
}

interface EditTask {
  values?: Task
  state: boolean | string
}

interface ModalState {
  state: boolean
  title?: string
  values?: any
  itinerario?: Itinerary
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  itinerario,
  onClose,
  onUpdate,
  onDelete,
  onTaskCreate,
  tempPastedAndDropFiles,
  setTempPastedAndDropFiles
}) => {
  const { t } = useTranslation();
  const { config, user, geoInfo } = AuthContextProvider();
  const { event, setEvent } = EventContextProvider();
  const toast = useToast();
  const notification = useNotification();
  const storage = getStorage();
  const [isAllowed, ht] = useAllowed();

  const [showModalCompartir, setShowModalCompartir] = useState({ state: false, id: null });
  const [nicknameUnregistered, setNicknameUnregistered] = useState('');
  const [showEditTask, setShowEditTask] = useState<EditTask>({ state: false });
  const [modalWorkFlow, setModalWorkFlow] = useState(false);
  const [modalCompartirTask, setModalCompartirTask] = useState(false);
  const [modal, setModal] = useState<ModalState>({ state: false, title: null, values: null, itinerario: null });
  const [loading, setLoading] = useState<boolean>(false);

  // Estados para manejar comentarios en tiempo real
  const [localComments, setLocalComments] = useState<Comment[]>(task.comments || []);
  const [localTask, setLocalTask] = useState<Task>(task);

  // Efecto para sincronizar la tarea cuando cambie
  useEffect(() => {
    setLocalTask(task);
    setLocalComments(task.comments || []);
  }, [task]);

  // Efecto para escuchar cambios en el evento global y actualizar comentarios
  useEffect(() => {
    if (event?.itinerarios_array) {
      const currentItinerary = event.itinerarios_array.find(it => it._id === itinerario._id);
      if (currentItinerary) {
        const currentTask = currentItinerary.tasks.find(t => t._id === task._id);
        if (currentTask) {
          setLocalTask(currentTask);
          setLocalComments(currentTask.comments || []);
        }
      }
    }
  }, [event, itinerario._id, task._id]);

  // Función para manejar actualizaciones de la tarea en tiempo real
  const handleTaskUpdate = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      // Actualizar primero en la API
      const updatePromises = Object.entries(updates).map(([key, value]) => {
        return fetchApiEventos({
          query: queries.editTask,
          variables: {
            eventID: event._id,
            itinerarioID: itinerario._id,
            taskID: taskId,
            variable: key,
            valor: typeof value === 'boolean' ? value.toString() :
              typeof value === 'object' ? JSON.stringify(value) :
                String(value)
          },
          domain: config.domain
        });
      });

      await Promise.all(updatePromises);

      // Actualizar el estado global del evento de forma inmersiva
      setEvent((prevEvent) => {
        const newEvent = { ...prevEvent };
        const itineraryIndex = newEvent.itinerarios_array.findIndex(it => it._id === itinerario._id);

        if (itineraryIndex !== -1) {
          const taskIndex = newEvent.itinerarios_array[itineraryIndex].tasks.findIndex(t => t._id === taskId);

          if (taskIndex !== -1) {
            // Crear nueva referencia de la tarea para forzar re-render
            newEvent.itinerarios_array[itineraryIndex].tasks[taskIndex] = {
              ...newEvent.itinerarios_array[itineraryIndex].tasks[taskIndex],
              ...updates,
            };

            // Crear nueva referencia del array de tareas
            newEvent.itinerarios_array[itineraryIndex].tasks = [...newEvent.itinerarios_array[itineraryIndex].tasks];
          }
        }

        // Crear nueva referencia del array de itinerarios
        newEvent.itinerarios_array = [...newEvent.itinerarios_array];

        return newEvent;
      });

      // Actualizar el estado local
      setLocalTask(prev => ({ ...prev, ...updates }));

      // Llamar al callback padre
      onUpdate(taskId, updates);

      toast('success', t('Tarea actualizada correctamente'));
    } catch (error) {
      console.error('Error al actualizar la tarea:', error);
      toast('error', t('Error al actualizar la tarea'));
    }
  }, [event._id, itinerario._id, onUpdate, t, config.domain, setEvent]);

  // Función para manejar eliminación de comentarios en tiempo real
  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!isAllowed()) {
      ht();
      return;
    }

    try {
      // Eliminar archivos del storage
      const storageRef = ref(storage, `event-${event?._id}//itinerary-${itinerario?._id}//task-${task._id}//comment-${commentId}`);
      try {
        const res = await listAll(storageRef);
        await Promise.all(res.items.map(itemRef => deleteObject(itemRef)));
      } catch (storageError) {
        console.error('Error al eliminar archivos del storage:', storageError);
      }

      // Eliminar comentario de la API
      await fetchApiEventos({
        query: queries.deleteComment,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          taskID: task._id,
          commentID: commentId
        },
        domain: config.domain
      });

      // Actualizar estado global
      setEvent((prevEvent) => {
        const newEvent = { ...prevEvent };
        const itineraryIndex = newEvent.itinerarios_array.findIndex(it => it._id === itinerario._id);

        if (itineraryIndex !== -1) {
          const taskIndex = newEvent.itinerarios_array[itineraryIndex].tasks.findIndex(t => t._id === task._id);

          if (taskIndex !== -1) {
            const commentIndex = newEvent.itinerarios_array[itineraryIndex].tasks[taskIndex].comments.findIndex(c => c._id === commentId);

            if (commentIndex !== -1) {
              newEvent.itinerarios_array[itineraryIndex].tasks[taskIndex].comments.splice(commentIndex, 1);
            }
          }
        }

        return newEvent;
      });

      // Actualizar estado local
      const updatedComments = localComments.filter(comment => comment._id !== commentId);
      setLocalComments(updatedComments);
      setLocalTask(prev => ({ ...prev, comments: updatedComments }));

      toast('success', t('Comentario eliminado'));
    } catch (error) {
      console.error('Error al eliminar comentario:', error);
      toast('error', t('Error al eliminar comentario'));
    }
  }, [isAllowed, ht, storage, event, itinerario, task._id, config.domain, setEvent, localComments, t, toast]);

  // Función para manejar la actualización de comentarios cuando se agregan nuevos
  const handleUpdateComments = useCallback((taskId: string, newComments: Comment[]) => {
    setEvent((prevEvent) => {
      const newEvent = { ...prevEvent };
      const itineraryIndex = newEvent.itinerarios_array.findIndex(it => it._id === itinerario._id);

      if (itineraryIndex !== -1) {
        const taskIndex = newEvent.itinerarios_array[itineraryIndex].tasks.findIndex(t => t._id === taskId);

        if (taskIndex !== -1) {
          newEvent.itinerarios_array[itineraryIndex].tasks[taskIndex].comments = newComments;
        }
      }

      return newEvent;
    });

    // Actualizar estado local también
    setLocalComments(newComments);
    setLocalTask(prev => ({ ...prev, comments: newComments }));
  }, [itinerario._id, setEvent]);

  // Prevenir el cierre del modal cuando se hace clic en el contenido
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Función para alternar visibilidad spectatorView
  const handleAddSpectatorView = async (values: Task) => {
    try {
      await fetchApiEventos({
        query: queries.editTask,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          taskID: values._id,
          variable: "spectatorView",
          valor: JSON.stringify(!values?.spectatorView)
        },
        domain: config.domain
      });

      const f1 = event.itinerarios_array.findIndex(elem => elem._id === itinerario._id);
      const f2 = event.itinerarios_array[f1].tasks.findIndex(elem => elem._id === values._id);
      event.itinerarios_array[f1].tasks[f2].spectatorView = !values?.spectatorView;
      setEvent({ ...event });
      onUpdate(values._id, { spectatorView: !values?.spectatorView });
      toast("success", t("Item guardado con exito"));
    } catch (error) {
      console.log(error);
    }
  };

  // Función para eliminar tarea
  const deleteTask = (values: Task, itinerario: Itinerary) => {
    try {
      setLoading(true);
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
                onDelete(values._id);
                onClose();
              }, 500);
              toast("success", t(itinerario.tipo === "itinerario" ? "activitydeleted" : "servicedeleted"));
            });
          })
        );
    } catch (error) {
      console.log(error);
    }
  };

  // Opciones del menú
  const optionsItineraryButtonBox: OptionsSelect[] = [
    {
      value: "delete",
      icon: <Trash2 className="w-5 h-5" />,
      title: "borrar",
      onClick: (values: Task, itinerario: Itinerary) => !isAllowed() ? ht() : user.uid === event.usuario_id ? setModal({ values: values, itinerario: itinerario, state: true, title: values.descripcion }) : ["/itinerario"].includes(window?.location?.pathname) ? values?.estatus === false || values?.estatus === null || values?.estatus === undefined ? setModal({ values: values, itinerario: itinerario, state: true, title: values.descripcion }) : null : setModal({ values: values, itinerario: itinerario, state: true, title: values.descripcion }),
      vew: "all"
    }
  ];

  return (
    <>
      <ClickAwayListener onClickAway={onClose}>
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10"
          onClick={onClose}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-screen h-auto mx-4 flex flex-col sm:max-h-[90vh]"
            onClick={handleContentClick}
          >
            {/* Header del modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {t('Detalle de Tarea')}
                </h2>
              </div>

              <div className="flex items-center space-x-2">
                {/* Botón cerrar */}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido principal usando TaskNew con la tarea local actualizada */}
            <div className="flex-1 overflow-y-auto py-6 px-6">
              <TaskNew
                id={localTask._id}
                task={localTask}
                itinerario={itinerario}
                optionsItineraryButtonBox={optionsItineraryButtonBox}
                isSelect={false}
                showModalCompartir={showModalCompartir}
                setShowModalCompartir={setShowModalCompartir}
                onClick={() => { }}
                tempPastedAndDropFiles={tempPastedAndDropFiles}
                setTempPastedAndDropFiles={setTempPastedAndDropFiles}
                onUpdate={handleTaskUpdate}
                onUpdateComments={handleUpdateComments}
                onDeleteComment={handleDeleteComment}
                view="kanban"
              />
            </div>
          </div>
        </div>
      </ClickAwayListener>

      {/* Modal de edición */}
      {showEditTask?.state && (
        <ModalLeft state={showEditTask} set={setShowEditTask} clickAwayListened={false}>
          <div className="w-full flex flex-col items-start justify-start">
            <FormTask
              showEditTask={showEditTask}
              setShowEditTask={setShowEditTask}
              itinerarioID={itinerario._id}
            />
          </div>
        </ModalLeft>
      )}

      {/* Modal de confirmación de eliminación */}
      {modal.state && (
        <SimpleDeleteConfirmation
          loading={loading}
          setModal={setModal}
          handleDelete={() => deleteTask(modal.values, modal.itinerario)}
          message={<p className="text-azulCorporativo mx-8 text-center capitalize">Estas seguro de borrar <span className='font-semibold'>{modal.title}</span></p>}
        />
      )}

      {/* Modal de flujo de trabajo */}
      {modalWorkFlow && (
        <Modal set={setModalWorkFlow} state={modalWorkFlow} classe={"w-[95%] md:w-[450px] h-[370px]"}>
          <WarningMessage setModal={setModalWorkFlow} modal={modalWorkFlow} title={t("workflow")} />
        </Modal>
      )}

      {/* Modal de compartir */}
      {modalCompartirTask && (
        <Modal set={setModalCompartirTask} state={modalCompartirTask} classe={"w-[95%] md:w-[450px] h-[370px]"}>
          <WarningMessage setModal={setModalCompartirTask} modal={modalCompartirTask} title={t("share")} />
        </Modal>
      )}
    </>
  );
};

export default TaskDetailModal;