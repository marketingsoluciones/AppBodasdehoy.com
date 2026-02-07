import React, { useState } from 'react';
import { X, Paperclip } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NewAttachmentsEditor } from '../VistaTabla/NewAttachmentsEditor';

interface AttachmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  itinerarioId: string;
  canEdit: boolean;
  owner: boolean;
}

export const AttachmentsModal: React.FC<AttachmentsModalProps> = ({
  isOpen,
  onClose,
  task,
  itinerarioId,
  canEdit,
  owner
}) => {
  const { t } = useTranslation();
  const [showAttachments, setShowAttachments] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Paperclip className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              {t('Archivos adjuntos')}
            </h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {task.attachments?.length || 0}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <NewAttachmentsEditor
            handleUpdate={async (file) => {
              // La actualización se maneja internamente en el componente
              console.log('File updated:', file);
            }}
            task={task}
            itinerarioId={itinerarioId}
            canEdit={canEdit}
            owner={owner}
            showAttachments={showAttachments}
            setShowAttachments={setShowAttachments}
          />
        </div>
      </div>
    </div>
  );
};