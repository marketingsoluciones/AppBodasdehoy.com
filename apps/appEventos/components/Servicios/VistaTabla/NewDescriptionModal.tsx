import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuthContextProvider, EventContextProvider } from '../../../context';
import { DescriptionTask } from '../VistaTarjeta/DescriptionTask';

interface DescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  itinerarioId: string;
  onUpdate: (field: string, value: any) => Promise<void>;
}

export const DescriptionModal: React.FC<DescriptionModalProps> = ({
  isOpen,
  onClose,
  task,
  itinerarioId,
  onUpdate
}) => {
  const { t } = useTranslation();
  const { user } = AuthContextProvider();
  const { event } = EventContextProvider();
  const owner = user?.uid === event?.usuario_id;
  const [showAttachments, setShowAttachments] = useState(false);

  if (!isOpen) return null;

  // Cierre solo si se hace click en el fondo
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              {t('Descripción detallada')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - DescriptionTask Component */}
        <div className="flex-1 p-6 overflow-y-auto z-50">
          <DescriptionTask
            canEdit={true}
            task={task}
            handleUpdate={onUpdate}
            owner={owner}
            showAttachments={showAttachments}
          />
        </div>
      </div>
    </div>
  );
};