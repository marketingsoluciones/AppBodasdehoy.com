import { FC } from "react";
import { useTranslation } from 'react-i18next';
import { useAllowed } from "../../../hooks/useAllowed";
import { HiPlus } from "react-icons/hi2";

interface AddTaskButtonProps {
    onAddTask: () => void;
    tipo?: string;
}

export const AddTaskButton: FC<AddTaskButtonProps> = ({ onAddTask, tipo = "itinerario" }) => {
    const { t } = useTranslation();
    const [isAllowed, ht] = useAllowed();

    const handleClick = () => {
        if (!isAllowed()) {
            ht();
        } else {
            onAddTask();
        }
    };

    return (
        <div className="relative group">
            <button
                onClick={handleClick}
                className={`
                    relative flex items-center justify-center
                    h-6 px-2 gap-2
                    bg-white
                    border border-primary
                    text-primary text-sm font-medium
                    rounded-md
                    transition-all duration-200 ease-out
                    hover:bg-primary hover:text-white
                    active:scale-95
                    ${!isAllowed() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    group
                `}
            >
                {/* Icono con animación sutil */}
                <HiPlus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
                
                {/* Texto */}
{/*                 <span className="relative">
                    {tipo === "itinerario" ? t("addactivity") : t("addservice")}
                </span> */}
            </button>

            {/* Tooltip minimalista */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 pointer-events-none z-10">
                <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-md whitespace-nowrap relative">
                    {isAllowed() 
                        ? tipo === "itinerario" 
                            ? t("Añadir nueva actividad") 
                            : t("Añadir nuevo servicio")
                        : t("No tienes permisos")
                    }
                    {/* Flecha del tooltip */}
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                </div>
            </div>

        </div>
    );
};