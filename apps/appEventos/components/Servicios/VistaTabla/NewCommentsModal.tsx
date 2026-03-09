import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Bell, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuthContextProvider } from '../../../context';
import { fetchApiEventos, queries } from '../../../utils/Fetching';
import { ListComments } from '../Utils/ListComments';
import { InputCommentsOld } from '../Utils/InputCommentsOld';
import { Comment } from '../../../utils/Interfaces';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  itinerario: any;
  onUpdateComments: (taskId: string, comments: any[]) => void;
}

export const NewCommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
  task,
  itinerario,
  onUpdateComments
}) => {
  const { t } = useTranslation();
  const { user, config } = AuthContextProvider();
  const [comments, setComments] = useState(task.comments || []);
  const [previousCountComments, setPreviousCountComments] = useState(0);

  useEffect(() => {
    setComments(task.comments || []);
  }, [task.comments]);

  // Auto-scroll al agregar nuevos comentarios
  useEffect(() => {
    if (comments.length > previousCountComments) {
      setTimeout(() => {
        const commentsContainer = document.getElementById('modal-comments-container');
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

  const handleDeleteComment = async (commentId: string) => {
    try {
      await fetchApiEventos({
        query: queries.deleteComment,
        variables: {
          eventID: itinerario.evento_id,
          itinerarioID: itinerario._id,
          taskID: task._id,
          commentID: commentId
        },
        domain: config.domain
      });

      const updatedComments = comments.filter((c: any) => c._id !== commentId);
      setComments(updatedComments);
      onUpdateComments(task._id, updatedComments);
    } catch (error) {
      console.error('Error al eliminar comentario:', error);
    }
  };

  const handleCommentAdded = (comment: Comment) => {
    const updatedComments = [...comments, comment];
    setComments(updatedComments);
    onUpdateComments(task._id, updatedComments);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 h-[600px] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">{t('Actividad')}</h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {comments.length} {t('comentarios')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Comments container */}
        <div id="modal-comments-container" className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {comments.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{t('No hay comentarios')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('Sé el primero en comentar')}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment: any) => (
                <div key={comment._id} className="relative group">
                  <div className="bg-white rounded-lg shadow-sm p-3">
                    <ListComments
                      id={comment._id}
                      itinerario={itinerario}
                      task={task}
                      item={comment}
                      tempPastedAndDropFiles={[]}
                    />
                  </div>
                  {comment.uid === user?.uid && (
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded shadow-sm hover:bg-gray-100"
                      title={t('Eliminar comentario')}
                    >
                      <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input section */}
        <div className="border-t border-gray-200 bg-white p-4 flex-shrink-0">
          <InputCommentsOld
            itinerario={itinerario}
            task={task}
            tempPastedAndDropFiles={[]}
            setTempPastedAndDropFiles={() => { }}
            disabled={false}
          />
        </div>
      </div>
    </div>
  );
};