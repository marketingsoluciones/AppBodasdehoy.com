import { Itinerary, Task } from '../../../utils/Interfaces';
import { useToast } from "../../../hooks/useToast";
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Copy, Link } from 'lucide-react';
import { FC } from 'react';
import { handleCopyLink } from './TaskNewUtils';
import { EventContextProvider } from '../../../context';

interface Props {
  task: Task;
  handleUpdate: (field: string, value: any) => Promise<void>;
  handleDuplicate: () => Promise<void>;
  itinerario: Itinerary
}

export const IntegrateButtonsBox: FC<Props> = ({ task, handleUpdate, handleDuplicate, itinerario }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const { event } = EventContextProvider()

  return (
    <div className="flex items-center bg-gray-50 rounded-lg p-0.5 mr-2">
      <div className="relative group">
        <button
          onClick={() => {
            const newValue = !task.spectatorView;
            handleUpdate('spectatorView', newValue);
            toast('success', t(newValue ? 'Tarea visible' : 'Tarea oculta'));
          }}
          className={`relative p-1.5 rounded-md transition-all duration-200 ${task.spectatorView
            ? 'text-primary bg-primary/10 shadow-sm'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          title={t(task.spectatorView ? 'Tarea visible' : 'Tarea oculta')}
        >
          {task.spectatorView === true ? (
            <Eye className="w-4 h-4 transition-transform duration-200" />
          ) : (
            <EyeOff className="w-4 h-4 transition-transform duration-200" />
          )}
          {task.spectatorView &&
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          }
        </button>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
          {t(task.spectatorView ? 'Visible' : 'Oculta')}
        </div>
      </div>
      {/* Separador visual sutil */}
      <div className="w-px h-4 bg-gray-300 mx-1 opacity-50"></div>
      {/* Duplicar - Acción rápida con hover primary */}
      <div className="relative group">
        <button
          onClick={handleDuplicate}
          className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-md transition-all duration-200"
          title={t('Duplicar tarea')}
        >
          <Copy className="w-4 h-4" />
        </button>
        {/* Tooltip informativo */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
          {t('Duplicar')}
        </div>
      </div>
      {/* Compartir enlace - Con feedback visual al copiar */}
      <div className="relative group">
        <button
          onClick={() => handleCopyLink({ task, type: "task", event, navigator, toast, t, document, itinerario })}
          className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-md transition-all duration-200"
          title={t('Copiar enlace')}
        >
          <Link className="w-4 h-4" />
        </button>
        {/* Tooltip informativo */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
          {t('Compartir')}
        </div>
      </div>
    </div>
  );
};