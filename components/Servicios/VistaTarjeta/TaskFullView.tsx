import React, { FC, useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Task, Itinerary, OptionsSelect, Comment } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';
import { EventContextProvider } from "../../../context/EventContext";
import { InputComments } from "../Utils/InputComments"
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

interface TaskFullViewProps {
  task: Task;
  itinerario: Itinerary;
  canEdit: boolean;
  handleUpdate: (field: string, value: any) => Promise<void>;
  handleDuplicate: () => Promise<void>;
  handleDeleteComment: (commentId: string) => Promise<void>;
  handleCommentAdded: (comment: Comment) => void;
  ht: () => void;
  comments: Comment[];
  setComments: (comments: Comment[]) => void;
  optionsItineraryButtonBox?: OptionsSelect[];
  tempPastedAndDropFiles?: TempPastedAndDropFile[];
  setTempPastedAndDropFiles?: any;
  isSelect: boolean;
}

export const TaskFullView: FC<TaskFullViewProps> = ({
  task,
  itinerario,
  canEdit,
  handleUpdate,
  handleDuplicate,
  handleDeleteComment,
  handleCommentAdded,
  ht,
  comments,
  setComments,
  optionsItineraryButtonBox,
  tempPastedAndDropFiles,
  setTempPastedAndDropFiles,
  ...props
}) => {
  const { t } = useTranslation();
  const { event } = EventContextProvider();
  const [previousCountComments, setPreviousCountComments] = useState(0);
  const { user } = AuthContextProvider();
  const owner = user?.uid === event?.usuario_id;

  // Auto-scroll al agregar nuevos comentarios
  useEffect(() => {
    if (comments.length > previousCountComments) {
      setTimeout(() => {
        const commentsContainer = document.getElementById('comments-container');
        if (commentsContainer) {
          commentsContainer.scrollTo({
            top: commentsContainer.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
    setPreviousCountComments(comments.length);
  }, [comments, previousCountComments]);

  return (
    <div {...props} className="w-full bg-white rounded-lg shadow-lg cursor-default">
      <div id="task-container" className={`flex h-[553px] rounded-xl outline ${props?.isSelect ? "outline-2 outline-primary" : "outline-[1px] outline-gray-200"}`}>
        {/* Panel principal */}
        <div id='container-left' className="flex-1 flex flex-col h-full">
          {/* Header */}
          <div className="w-full flex items-center justify-between py-0.5 border-b border-gray-200">
            <TitleTask
              canEdit={canEdit}
              handleUpdate={handleUpdate}
              task={task}
              owner={owner}
            />
            {canEdit &&
              <div className="flex items-center">
                {/* Botones de acción integrados - OCULTOS sin permisos */}
                <IntegrateButtonsBox
                  task={task}
                  handleUpdate={handleUpdate}
                  handleDuplicate={handleDuplicate}
                  itinerario={itinerario}
                />
                {/* Botones de ItineraryButtonBox - OCULTOS sin permisos */}
                {(optionsItineraryButtonBox && optionsItineraryButtonBox.length > 0) &&
                  <ItineraryButtonBox
                    optionsItineraryButtonBox={optionsItineraryButtonBox}
                    task={task}
                    itinerario={itinerario}
                  />
                }
              </div>}
          </div>
          {/* Contenido principal */}
          <div className="flex-1 px-6 py-2 space-y-2">
            {/* Fila de Estado y Prioridad */}
            <StatusPriorityTask
              task={task}
              canEdit={canEdit}
              handleUpdate={handleUpdate}
              ht={ht}
            />
            {/* Asignados con NewResponsableSelector */}
            <AssignedTask
              canEdit={canEdit}
              task={task}
              handleUpdate={handleUpdate}
              owner={owner}
            />
            {/* Fechas con duración y hora */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                {/* <span className="text-xs text-gray-600">{t('Fecha y hora')}</span> */}
              </div>
              <div className="h-5 flex items-center space-x-4">
                <DateTask
                  handleUpdate={handleUpdate}
                  canEdit={canEdit}
                  task={task}
                />
                <TimeTask
                  handleUpdate={handleUpdate}
                  canEdit={canEdit}
                  task={task}
                />
                {/* Duración mejorada con conversor */}
                <DurationTask
                  handleUpdate={handleUpdate}
                  canEdit={canEdit}
                  task={task}
                />
              </div>
            </div>
            <TagsTask
              canEdit={canEdit}
              task={task}
              handleUpdate={handleUpdate}
              owner={owner}
            />
            {/* Sección de Detalles */}
            {/* Descripción larga con Editor */}
            <DescriptionTask
              canEdit={canEdit}
              task={task}
              handleUpdate={handleUpdate}
              owner={owner}
            />
            {/* Adjuntos mejorados */}
            <NewAttachmentsEditor
              attachments={task?.attachments || []}
              onUpdate={(files) => handleUpdate('attachments', files)}
              taskId={task?._id}
              eventId={event?._id}
              itinerarioId={itinerario?._id}
              readOnly={!canEdit}
              owner={owner}
              cardBlock={task.estatus}
            />
          </div>
        </div>
        {/* Panel lateral - Chat/Comentarios */}
        <div id="container-right" className="w-[350px] flex flex-col bg-gray-50 h-full max-h-[554px] border-l-[1px] border-gray-200 pb-2">
          <div className="h-[49px] px-2 border-b border-gray-200 bg-white flex items-center">
            <div className="w-full flex items-center justify-between">
              <div className="text-xl font-semibold">{t('Actividad')}</div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{comments.length} {t('comentarios')}</span>
                <Bell className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
              </div>
            </div>
          </div>
          <div id="comments-container" className="flex-1 overflow-y-auto min-h-0">
            {comments.length === 0
              ? <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{t('No hay comentarios')}</p>
                  {/* <p className="text-xs text-gray-400 mt-1">{t('Sé el primero en comentar')}</p> */}
                </div>
              </div>
              : <div className="flex flex-col h-full">
                {/* Lista de comentarios */}
                <div className="space-y-2 *p-4 flex-shrink-0">
                  {comments.map((comment) => (
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
            {/* <InputComments
              itinerario={itinerario}
              task={task}
              tempPastedAndDropFiles={tempPastedAndDropFiles || []}
              setTempPastedAndDropFiles={setTempPastedAndDropFiles}
              disabled={false}
              onCommentAdded={handleCommentAdded}
            /> */}
            <InputCommentsOld
              itinerario={itinerario}
              task={task}
              tempPastedAndDropFiles={tempPastedAndDropFiles || []}
              setTempPastedAndDropFiles={setTempPastedAndDropFiles}
              disabled={false}
              onCommentAdded={handleCommentAdded}
            />
          </div>
        </div>
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