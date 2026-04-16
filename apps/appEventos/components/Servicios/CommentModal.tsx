import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Task, Comment, Itinerary } from '../../utils/Interfaces';
import { ListComments } from './Utils/ListComments';
import { InputComments } from './Utils/InputComments';


interface CommentModalProps {
  task: Task;
  itinerario: Itinerary;
  onClose: () => void;
  onUpdateComments: (taskId: string, comments: Comment[]) => void;
}

export const CommentModal: React.FC<CommentModalProps> = ({
  task,
  itinerario,
  onClose,
  onUpdateComments
}) => {
  const { t } = useTranslation();
  const [comments, setComments] = useState<Comment[]>(task.comments || []);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ordenar comentarios por fecha
    const sortedComments = [...(task.comments || [])].sort((a, b) => {
      const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    setComments(sortedComments);
  }, [task.comments]);

  useEffect(() => {
    // Scroll al final cuando se agregan nuevos comentarios
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments.length]);

  const handleCommentsUpdate = () => {
    // Actualizar los comentarios en el componente padre
    onUpdateComments(task._id, comments);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[80vh] mx-4 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t('Comentarios')}
              </h3>
              <p className="text-sm text-gray-500">
                {task.descripcion || t('Sin título')}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Lista de comentarios */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageSquare className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium">{t('No hay comentarios aún')}</p>
              <p className="text-sm mt-2">{t('Sé el primero en comentar')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div 
                  key={comment._id} 
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <ListComments
                    id={comment._id}
                    itinerario={itinerario}
                    task={task}
                    item={comment}
                  />
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>
          )}
        </div>

        {/* Input de comentarios */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <InputComments
                itinerario={itinerario}
                task={task}
                tempPastedAndDropFiles={[]}
                setTempPastedAndDropFiles={() => {}}
                /* onCommentAdded={handleCommentsUpdate} */
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};