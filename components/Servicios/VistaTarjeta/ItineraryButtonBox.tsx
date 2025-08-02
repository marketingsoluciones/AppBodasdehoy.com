import { FC } from "react";
import { Itinerary, OptionsSelect, Task } from "../../../utils/Interfaces";
import { useTranslation } from "react-i18next";

interface Props {
  optionsItineraryButtonBox: OptionsSelect[];
  task: Task;
  itinerario: Itinerary;
}

export const ItineraryButtonBox: FC<Props> = ({ optionsItineraryButtonBox, task, itinerario }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center bg-gray-50 rounded-lg p-0.5 mr-2">
      {optionsItineraryButtonBox
        .filter(option => option.value !== 'estatus' && option.value !== 'status')
        .map((option, idx) => {
          // Obtener el icono correcto basado en el estado
          let icon = option.icon;
          if (option.getIcon && typeof option.getIcon === 'function') {
            // Para opciones con getIcon dinámico
            if (option.value === 'status') {
              icon = option.getIcon(task.spectatorView);
            }
          }
          // Determinar estado activo y colores según el tipo de acción
          let isActive = false;
          let activeColorClass = '';
          let hoverColorClass = '';
          switch (option.value) {
            case 'status':
              isActive = task.spectatorView;
              activeColorClass = 'text-primary bg-primary/10';
              break;
            case 'flujo':
              // Lógica personalizada para flujo de trabajo
              isActive = false;
              activeColorClass = 'text-purple-500 bg-purple-500/10';
              hoverColorClass = 'hover:text-purple-600 hover:bg-purple-100';
              break;
            case 'share':
              // Estado para compartir
              isActive = false;
              activeColorClass = 'text-blue-500 bg-blue-500/10';
              hoverColorClass = 'hover:text-blue-600 hover:bg-blue-100';
              break;
            case 'delete':
              // Delete con hover rojo destructivo
              isActive = false;
              activeColorClass = '';
              hoverColorClass = 'hover:text-[#ef4444] hover:bg-[#ef4444]/10';
              break;
            default:
              hoverColorClass = 'hover:text-gray-600 hover:bg-gray-100';
          }
          return (
            <div key={idx} className="relative group">
              <button
                onClick={() => {
                  if (typeof option.onClick === 'function') {
                    option.onClick(task, itinerario);
                  }
                }}
                className={`relative p-1.5 rounded-md transition-all duration-200 ${isActive
                  ? `${activeColorClass} shadow-sm`
                  : `text-gray-400 ${hoverColorClass}`
                  }`}
                title={t(option.title || option.value || '')}
                disabled={option.idDisabled}
              >
                <span className="w-4 h-4 flex items-center justify-center"
                  style={{ transform: 'scale(0.8)' }}>
                  {icon}
                </span>
                {/* Indicador de estado con colores específicos por tipo */}
                {isActive &&
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${option.value === 'status' ? 'bg-primary' :
                      option.value === 'flujo' ? 'bg-purple-500' :
                        'bg-blue-500'
                      } opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${option.value === 'status' ? 'bg-primary' :
                      option.value === 'flujo' ? 'bg-purple-500' :
                        'bg-blue-500'
                      }`}></span>
                  </span>
                }
              </button>
              {/* Tooltip informativo dinámico */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                {t(option.title || option.value || '')}
              </div>
            </div>
          );
        })}
    </div>
  );
};