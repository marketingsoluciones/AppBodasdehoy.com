import React, { FC, useState, useEffect, useMemo } from 'react';
import { Task, Itinerary, OptionsSelect, Comment } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';
import { EventContextProvider } from "../../../context/EventContext";
import { ListComments } from "../Utils/ListComments"
import { NewAttachmentsEditor } from "../VistaTabla/NewAttachmentsEditor";
import { TempPastedAndDropFile } from "../../Itinerario/MicroComponente/ItineraryPanel";
import { MessageSquare, Calendar, Trash2, Bell, } from 'lucide-react';
import { TitleTask } from './TitleTask';
import { AssignedTask } from './AssignedTask';
import { TagsTask } from './TagsTask';
import { DescriptionTask } from './DescriptionTask';
import { DateTask } from './DateTask';
import { TimeTask } from './TimeTask';
import { DurationTask } from './DurationTask';
import { IntegrateButtonsBox } from './IntegrateButtonsBox';
import { ItineraryButtonBox } from './ItineraryButtonBox';
import { StatusPriorityTask } from './StatusPriorityTask';
import { AuthContextProvider } from '../../../context';
import { InputCommentsOld } from '../Utils/InputCommentsOld';
import { useDateTime } from '../../../hooks/useDateTime';
import { IoIosArrowRoundBack } from "react-icons/io";

interface TaskFullViewProps {
  task: Task;
  itinerario: Itinerary;
  canEdit: boolean;
  handleUpdate: (field: string, value: any) => Promise<void>;
  handleDuplicate: () => Promise<void>;
  handleDeleteComment: (commentId: string) => Promise<void>;
  ht: () => void;
  optionsItineraryButtonBox?: OptionsSelect[];
  tempPastedAndDropFiles?: TempPastedAndDropFile[];
  setTempPastedAndDropFiles?: any;
  selectTask: string;
}

export const TaskFullView: FC<TaskFullViewProps> = ({
  task,
  itinerario,
  canEdit,
  handleUpdate,
  handleDuplicate,
  handleDeleteComment,
  ht,
  optionsItineraryButtonBox,
  tempPastedAndDropFiles,
  setTempPastedAndDropFiles,
  selectTask,
  ...props
}) => {
  const { t } = useTranslation();
  const { event } = EventContextProvider();
  const [previousCountComments, setPreviousCountComments] = useState(0);
  const { user } = AuthContextProvider();
  const owner = user?.uid === event?.usuario_id;
  const [showAttachments, setShowAttachments] = useState(false);
  const { dateTimeFormated } = useDateTime();
  const [editingDate, setEditingDate] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showChat, setShowChat] = useState(false);
  const ruta = window.location.pathname;

  const ValidationEdit = useMemo(() => {
    if (["/itinerario"].includes(ruta)) {
      if (owner) {
        return true;
      } else {
        if (task.estatus || task.estatus === null) {
          if (canEdit) {
            return true;
          } else {
            return false;
          }
        }
        return false;
      }
    } else {
      return true;
    }
  }, [ruta, owner, task.estatus, canEdit]);


  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)

    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Auto-scroll al agregar nuevos comentarios
  useEffect(() => {
    if (task.comments.length > previousCountComments) {
      setTimeout(() => {
        const commentsContainer = document.getElementById(`comments-container-${task._id}`);
        if (commentsContainer) {
          commentsContainer.scrollTo({
            top: commentsContainer.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
    setPreviousCountComments(task.comments.length);
  }, [task.comments.length, previousCountComments, task._id]);

  return (
    <div {...props} className={`w-full bg-white rounded-lg shadow-lg cursor-default  ${isMobile ? "scale-90" : ""}`}>
      <div id="task-container" className={`flex h-[553px] rounded-xl outline ${selectTask === task._id ? "outline-2 outline-primary" : "outline-[1px] outline-gray-200"}`}>
        {/* Panel principal */}
        {(!isMobile || !showChat) &&
          <div id='container-left' className="flex-1 flex flex-col h-full relative">
            <div className="w-full flex items-center justify-between py-0.5 border-b border-gray-200">
              <TitleTask
                canEdit={canEdit}
                handleUpdate={handleUpdate}
                task={task}
                owner={owner}
              />
              <div className="flex items-center space-x-2 mr-2 md:mr-0">
                {isMobile && (
                  <button
                    onClick={() => setShowChat(!showChat)}
                    className={`absolute -bottom-4 -right-1 p-2 rounded-full transition-all duration-200 ${showChat
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    title={showChat ? t('Ocultar comentarios') : t('Ver comentarios')}
                  >
                    <MessageSquare className="w-4 h-4" />
                    {task.comments.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {task.comments.length}
                      </span>
                    )}
                  </button>
                )}
                {canEdit &&
                  <div className="flex items-center">
                    <IntegrateButtonsBox
                      task={task}
                      handleUpdate={handleUpdate}
                      handleDuplicate={handleDuplicate}
                      itinerario={itinerario}
                    />
                    {(optionsItineraryButtonBox && optionsItineraryButtonBox.length > 0) &&
                      <ItineraryButtonBox
                        optionsItineraryButtonBox={optionsItineraryButtonBox}
                        task={task}
                        itinerario={itinerario}
                      />
                    }
                  </div>}
              </div>
            </div>
            <div className="flex flex-col flex-1 px-6 py-2 space-y-2  ">
              <StatusPriorityTask
                isMobile={isMobile}
                task={task}
                canEdit={canEdit}
                handleUpdate={handleUpdate}
                ht={ht}
              />
              <AssignedTask
                canEdit={canEdit}
                task={task}
                handleUpdate={handleUpdate}
                owner={owner}
              />
              <div className="flex items-center space-x-4 group relative">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                </div>
                <div className="h-5 flex items-center space-x-4">
                  <DateTask
                    handleUpdate={handleUpdate}
                    canEdit={canEdit}
                    task={task}
                    setEditing={setEditingDate}
                    editing={editingDate}
                    ValidationEdit={ValidationEdit}
                  />
                  <TimeTask
                    handleUpdate={handleUpdate}
                    canEdit={canEdit}
                    task={task}
                    setEditing={setEditingTime}
                    editing={editingTime}
                    ValidationEdit={ValidationEdit}
                  />
                  <DurationTask
                    handleUpdate={handleUpdate}
                    canEdit={canEdit}
                    task={task}
                    ValidationEdit={ValidationEdit}
                  />
                </div>
                {task.fecha && <div className={`hidden absolute bottom-full left-6 transform -translate-y-1/4 mb-2 px-2 py-1 bg-gray-900 text-white text-[11px] rounded opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:delay-300 whitespace-nowrap z-10 md:flex flex-col ${editingDate || editingTime ? "hidden" : ""}`}>
                  <span className='font-bold text-yellow-500'>{dateTimeFormated(task.fecha, event?.timeZone)}</span>
                  <span className='text-gray-100'>{dateTimeFormated(task.fecha, "UTC")}</span>
                  <span className='text-gray-100'>{dateTimeFormated(task.fecha, Intl.DateTimeFormat().resolvedOptions().timeZone)} {`(${t("hora local")})`}</span>
                </div>}
              </div>
              <TagsTask
                canEdit={canEdit}
                task={task}
                handleUpdate={handleUpdate}
                owner={owner}
              />
              <DescriptionTask
                canEdit={canEdit}
                task={task}
                handleUpdate={handleUpdate}
                owner={owner}
                showAttachments={showAttachments}
              />
              <NewAttachmentsEditor
                handleUpdate={(files) => handleUpdate('attachments', files)}
                task={task}
                itinerarioId={itinerario?._id}
                canEdit={canEdit}
                owner={owner}
                showAttachments={showAttachments}
                setShowAttachments={setShowAttachments}
              />
            </div>
          </div>
        }
        {/* Panel lateral - Chat/Comentarios */}
        {(!isMobile || showChat) && (
          <div id="container-right" className={`${isMobile && showChat ? "w-full" : "w-[350px]"} flex flex-col bg-gray-50 h-full max-h-[554px] border-l-[1px] border-gray-200 pb-2`}>
            <div className="h-[49px] px-2 border-b border-gray-200 bg-white flex items-center">
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {isMobile && <button
                    onClick={() => setShowChat(!showChat)}
                  >
                    <IoIosArrowRoundBack className="w-9 h-9 " />
                  </button>}
                  <div className="text-xl font-semibold">{t('Actividad')}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{task.comments.length} {t('comentarios')}</span>
                  <Bell className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
                </div>
              </div>
            </div>
            <div id={`comments-container-${task._id}`} className="flex-1 overflow-y-auto min-h-0">
              {task.comments.length === 0
                ? <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">{t('No hay comentarios')}</p>
                  </div>
                </div>
                : <div className="flex flex-col h-full">
                  <div className="space-y-2 *p-4 flex-shrink-0">
                    {task.comments.map((comment) => (
                      <div key={comment._id} className="relative group">
                        <ListComments
                          id={comment._id}
                          itinerario={itinerario}
                          task={task}
                          item={comment}
                          tempPastedAndDropFiles={tempPastedAndDropFiles}
                        />
                        {comment.uid === user?.uid &&
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded shadow-sm hover:bg-gray-100"
                            title={t('Eliminar comentario')}
                          >
                            <Trash2 className="w-4 h-4 text-gray-500 hover:text-[#ef4444]" />
                          </button>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              }
            </div>
            <div className="border-t border-gray-200 bg-white flex-shrink-0">
              <InputCommentsOld
                itinerario={itinerario}
                task={task}
                tempPastedAndDropFiles={tempPastedAndDropFiles || []}
                setTempPastedAndDropFiles={setTempPastedAndDropFiles}
                disabled={false}
              />
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
          @keyframes ping {
            75%, 100% {
              transform: scale(2);
              opacity: 0;
            }
          }
          .animate-ping {
            animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
        `}
      </style>
    </div>
  );
};