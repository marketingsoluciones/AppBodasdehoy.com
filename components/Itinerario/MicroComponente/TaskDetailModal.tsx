import React, { useState, useEffect } from 'react';
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
import { TaskNew } from './TaskNew';
import ClickAwayListener from 'react-click-away-listener';
import { useAllowed } from '../../../hooks/useAllowed';
import { useNotification } from '../../../hooks/useNotification';
import { GoEye, GoEyeClosed, GoGitBranch } from "react-icons/go";
import { LiaLinkSolid } from "react-icons/lia";
import { Modal } from '../../Utils/Modal';
import { WarningMessage } from './WarningMessage';
import ModalLeft from '../../Utils/ModalLeft';
import FormTask from '../../Forms/FormTask';
import { getStorage } from "firebase/storage";
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

interface EditTastk {
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
  const [showEditTask, setShowEditTask] = useState<EditTastk>({ state: false });
  const [modalWorkFlow, setModalWorkFlow] = useState(false);
  const [modalCompartirTask, setModalCompartirTask] = useState(false);
  const [modal, setModal] = useState<ModalState>({ state: false, title: null, values: null, itinerario: null });
  const [loading, setLoading] = useState<boolean>(false);

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
      value: "edit",
      icon: <Pencil className="w-5 h-5" />,
      title: "editar",
      onClick: (values: Task) => !isAllowed() ? ht() : user.uid === event.usuario_id ? setShowEditTask({ values, state: !showEditTask.state }) : setShowEditTask({ values, state: ["/itinerario"].includes(window?.location?.pathname) ? values?.estatus === false || values?.estatus === null || values?.estatus === undefined ? !showEditTask.state : null : !showEditTask.state }),
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
      title: "Link calendario",
      onClick: () => !isAllowed() ? ht() : setModalCompartirTask(!modalCompartirTask),
      vew: "tasks"
    },
  ];

  return (
    <>
      <ClickAwayListener onClickAway={onClose}>
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] mx-4 flex flex-col"
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
                {/* Botones de acciones de optionsItineraryButtonBox */}
{/*                 {optionsItineraryButtonBox.map((option) => (
                  option.value !== 'status' && option.value !== 'estatus' && option.value !== 'delete' && (
                    <button
                      key={option.value}
                      onClick={() => option.onClick(task, itinerario)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title={t(option.title)}
                    >
                      {typeof option.getIcon === 'function' ? option.getIcon(task[option.value]) : option.icon}
                    </button>
                  )
                ))} */}

                {/* Botón de eliminar */}
                <button
                  onClick={() => setModal({ values: task, itinerario: itinerario, state: true, title: task.descripcion })}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-[#ff2525]"
                  title={t('Eliminar')}
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                {/* Botón cerrar */}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido principal usando TaskNew */}
            <div className="flex-1 overflow-y-auto py-1">
              <TaskNew
                id={task._id}
                task={task}
                itinerario={itinerario}
                view="schema"
                optionsItineraryButtonBox={optionsItineraryButtonBox}
                isSelect={true}
                showModalCompartir={showModalCompartir}
                setShowModalCompartir={setShowModalCompartir}
                onClick={() => {}}
                tempPastedAndDropFiles={tempPastedAndDropFiles}
                setTempPastedAndDropFiles={setTempPastedAndDropFiles}
              />
            </div>
          </div>
        </div>
      </ClickAwayListener>

      {/* Modal de edición */}
      {showEditTask?.state && (
        <ModalLeft state={showEditTask} set={setShowEditTask} clickAwayListened={false}>
          <div className="w-full flex flex-col items-start justify-start">
            <FormTask showEditTask={showEditTask} setShowEditTask={setShowEditTask} itinerarioID={itinerario._id} />
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