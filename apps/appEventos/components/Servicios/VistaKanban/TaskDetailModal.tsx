import React, { useState, useEffect, useCallback, useRef, SetStateAction, Dispatch } from 'react';
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
import { EntityNotesSection } from "../../Notes/EntityNotesSection";
import StudioNotesSection from "../../Presupuesto/StudioNotesSection";
import { isStudioPathname } from '../../../utils/studioPaths';
import { createPortal } from 'react-dom';

interface TaskDetailModalProps {
  task: Task;
  itinerario: Itinerary;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onTaskCreate: (task: Partial<Task>) => void;
  tempPastedAndDropFiles?: any[];
  setTempPastedAndDropFiles?: any;
  deleteTask: (task: Task, itinerario: Itinerary) => void;
  optionsItineraryButtonBox: OptionsSelect[] | undefined;
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
  setTempPastedAndDropFiles,
  deleteTask,
  optionsItineraryButtonBox,
}) => {
  const { t } = useTranslation();
  const { config, user } = AuthContextProvider();
  const { event, setEvent } = EventContextProvider();
  const toast = useToast();
  const notification = useNotification();
  const storage = getStorage();
  const [isAllowed, ht] = useAllowed();

  const [showModalCompartir, setShowModalCompartir] = useState({ state: false, id: null });
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



  // Función para eliminar tarea
  /* const deleteTask = (values: Task, itinerario: Itinerary) => {
    try {
      setLoading(true);
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
    }
  }; */

  // Opciones del menú
  /* const optionsItineraryButtonBox: OptionsSelect[] = [
    {
      value: "delete",
      icon: <Trash2 className="w-5 h-5" />,
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
    }
  ]; */

  const handleUpdate = async (fieldName: string, value: any) => {
    const task = localTask;
    const canEdit = !user?.uid ? false : isAllowed() || task.responsable?.includes(user?.uid);
    if (!canEdit) {
      ht();
      return;
    }

    try {
      let apiValue: string;
      if (fieldName === 'horaActiva') {
        apiValue = value ? "true" : "false";
      } else if (['responsable', 'tags', 'attachments'].includes(fieldName)) {
        apiValue = JSON.stringify(value || []);
      } else if (fieldName === 'duracion') {
        apiValue = String(value || "0");
      } else if (fieldName === 'fecha' && value) {
        // Manejar fecha para evitar problemas de zona horaria
        if (value?.includes('T')) {
          apiValue = value;
        }
      } else if (fieldName === 'spectatorView') {
        apiValue = `${value}`;
      } else {
        apiValue = String(value || "");
      }
      await fetchApiEventos({
        query: queries.editTask,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          taskID: task._id,
          variable: fieldName,
          valor: apiValue,
        },
        domain: config.domain,
      }).then((result) => {
        const f1 = event.itinerarios_array.findIndex(elem => elem._id === itinerario?._id);
        // Update inmutable: actualiza el field en el task identificado por _id.
        setEvent((prev) => ({
          ...prev,
          itinerarios_array: prev.itinerarios_array.map((it, i) =>
            i !== f1 ? it : {
              ...it,
              tasks: it.tasks.map(tk =>
                tk._id !== task?._id ? tk : { ...tk, [fieldName]: value }
              ),
            }
          ),
        }));
      });
      !['horaActiva'].includes(fieldName) && (fieldName === 'duracion' ? value !== 0 : true) && toast("success", t("Campo actualizado"));
    } catch (error) {
      console.error('Error al actualizar:', error);
      toast("error", t("Error al actualizar"));
    }
  };

  const isStudio = typeof window !== "undefined"
    && isStudioPathname(window.location.pathname)
    && new URLSearchParams(window.location.search).get("studio") !== "legacy";

  const modalInner = (
    <>
      <ClickAwayListener onClickAway={onClose}>
        <div
          style={isStudio ? { background: "rgba(40,40,46,.45)" } : undefined}
          className={isStudio ? "fixed inset-0 flex items-center justify-center z-[200] p-4" : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10"}
          onClick={onClose}
        >
          <div
            style={isStudio ? { borderRadius: 18, boxShadow: "0 30px 80px rgba(0,0,0,.3)", maxHeight: "90vh", fontFamily: "'Poppins',sans-serif" } : undefined}
            className={isStudio ? "bg-white w-full max-w-5xl flex flex-col overflow-hidden" : "bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-screen h-auto md:mx-4 flex flex-col sm:max-h-[90vh]"}
            onClick={handleContentClick}
          >
            {/* Header del modal — oculto en studio: TaskFullView ya trae el título editable */}
            <div className={isStudio ? "hidden" : "flex items-center justify-between px-6 py-4 border-b border-gray-200"}>
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
            <div className="flex-1 overflow-y-auto md:py-6 md:px-6">
              <TaskNew
                id={localTask._id}
                task={localTask}
                itinerario={itinerario}
                optionsItineraryButtonBox={optionsItineraryButtonBox}
                showModalCompartir={showModalCompartir}
                setShowModalCompartir={setShowModalCompartir}
                onClick={() => { }}
                tempPastedAndDropFiles={tempPastedAndDropFiles}
                setTempPastedAndDropFiles={setTempPastedAndDropFiles}
                onUpdateComments={handleUpdateComments}
                onDeleteComment={handleDeleteComment}
                view="kanban"
                handleUpdate={handleUpdate}
              />
              {/* Notas internas con el MISMO aspecto que en Resumen (StudioNotesSection).
                  Antes usaba EntityNotesSection, sin el diseño studio. Mismo backend
                  (useCRMNotes, entityType TASK). Fuera de studio, la versión anterior. */}
              {isStudio
                ? <StudioNotesSection entityType="TASK" entityId={localTask._id} entityName={localTask.descripcion || 'Tarea'} />
                : <EntityNotesSection entityType="TASK" entityId={localTask._id} entityName={localTask.descripcion || 'Tarea'} />}
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
          title={modal.title}
          handleDelete={() => deleteTask(modal.values, modal.itinerario)}
          message={t('warningdeletetask', 'Si borras esta tarea no la podrás recuperar.')}
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

  // En studio, portal a body: centra el modal respecto al viewport aunque el tablero
  // esté expandido (width/transform en un ancestro rompería position:fixed).
  if (isStudio && typeof document !== "undefined") return createPortal(modalInner, document.body);
  return modalInner;
};

export default TaskDetailModal;