import { Itinerary, Task } from '../../../utils/Interfaces';
import { useToast } from "../../../hooks/useToast";
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Copy, Link } from 'lucide-react';
import { FC } from 'react';
import { handleCopyLink } from './TaskNewUtils';
import { EventContextProvider } from '../../../context';
import { isStudioPathname } from '../../../utils/studioPaths';

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

  const isStudio = typeof window !== "undefined"
    && isStudioPathname(window.location.pathname)
    && new URLSearchParams(window.location.search).get("studio") !== "legacy";

  // Botonera studio: los tres primeros botones del grupo unido de
  // tareastarjetacerradaabierta.html — 34x32, separados por 1px #f0f0f2, ojo en #EF5B94
  // y el resto en #8a8a90. Mismos manejadores que la versión anterior.
  if (isStudio) {
    const btn: React.CSSProperties = {
      width: 34, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", border: "none", background: "none", borderRight: "1px solid #f0f0f2",
      padding: 0,
    };
    return (
      <>
        <button
          onClick={() => {
            const newValue = !task.spectatorView;
            handleUpdate('spectatorView', newValue);
            toast('success', t(newValue ? 'Tarea visible' : 'Tarea oculta'));
          }}
          title={t(task.spectatorView ? 'Tarea visible' : 'Tarea oculta')}
          style={{ ...btn, color: task.spectatorView ? "#EF5B94" : "#8a8a90" }}
        >
          {task.spectatorView
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7c2 0 3.7.7 5.1 1.6M22 12s-3.5 7-10 7c-2 0-3.7-.7-5.1-1.6" /><path d="M3 3l18 18" /></svg>}
        </button>
        <button onClick={() => handleDuplicate()} title={t('Duplicar tarea')} style={{ ...btn, color: "#8a8a90" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
        </button>
        <button
          onClick={() => handleCopyLink({ task, type: "task", event, navigator, toast, t, document, itinerario })}
          title={t('Copiar enlace')}
          style={{ ...btn, color: "#8a8a90" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></svg>
        </button>
      </>
    );
  }

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
            <Eye className="md:w-4 w-3 md:h-4 h-3 transition-transform duration-200" />
          ) : (
            <EyeOff className="md:w-4 w-3 md:h-4 h-3 transition-transform duration-200" />
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
          <Copy className=" md:w-4 w-3 md:h-4 h-3" />
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
          <Link className="md:w-4 w-3 md:h-4 h-3" />
        </button>
        {/* Tooltip informativo */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
          {t('Compartir')}
        </div>
      </div>
    </div>
  );
};