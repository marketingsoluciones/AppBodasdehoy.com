import { FC, useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { SelectIconNew } from "../Utils/SelectIconNew";
import { Task } from "../../../utils/Interfaces";
import { isStudioPathname } from "../../../utils/studioPaths";

interface TitleTaskProps {
  canEdit: boolean;
  handleUpdate: (field: string, value: any) => Promise<void>;
  task: Task;
  owner: boolean;
  subtitle?: React.ReactNode;
}

export const TitleTask: FC<TitleTaskProps> = ({ canEdit, handleUpdate, task, owner, subtitle }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState<string>();
  const [editing, setEditing] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ruta = usePathname();
  // Rediseño studio (gate ?studio, default ON): solo /itinerario. Fiel a
  // tarjetatareaitinerario.html (.t-ico círculo punteado rosa). Rollback ?studio=legacy.
  const isStudio = typeof window !== "undefined"
    && isStudioPathname(window.location.pathname)
    && new URLSearchParams(window.location.search).get("studio") !== "legacy";

  useEffect(() => {
    setValue(null);
  }, [task, task?.icon])

  const handleIconChange = (newIcon: string) => {
    if (!canEdit) {
      null;
      return;
    }
    handleUpdate('icon', newIcon);
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (editing) {
      adjustTextareaHeight();
    }
  }, [editing, value]);

  return (
    <div className={`flex items-center flex-1 min-w-0 ${isStudio ? "gap-3" : "h-[44px] space-x-2"}`}>
      <div className="flex items-center justify-center">
        <div className={`flex items-center justify-center rounded-full transition-colors ${isStudio ? "w-10 h-10 bg-[#f7f7f9] border-[1px] border-solid border-[#E7E7EA] text-[#4a4a52] hover:bg-[#ececef]" : "w-11 h-11"}`}
          title={canEdit && "Cambiar ícono"} >
          <SelectIconNew
            handleChange={handleIconChange}
            task={task}
            owner={owner}
          />
        </div>
      </div>
      <div className={isStudio ? "flex-1 min-w-0 flex flex-col justify-center relative" : "flex-1 h-10 relative flex items-center"}>
        {editing
          ? <textarea
            ref={textareaRef}
            rows={1}
            id="descripcion"
            value={value ? value : task?.descripcion || ''}
            onChange={(e) => {
              setValue(e.target.value);
              adjustTextareaHeight();
            }}
            onBlur={(e) => {
              handleUpdate('descripcion', e.currentTarget.value.trim());
              setValue(e.currentTarget.value.trim());
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleUpdate('descripcion', e.currentTarget.value);
                setEditing(false);
              } else if (e.key === 'Escape') {
                setEditing(false);
              }
            }}
            onPaste={(e) => {
              e.preventDefault();
              const pastedText = e.clipboardData.getData('text/plain');
              const cleanText = pastedText.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
              setValue(cleanText);
            }}
            className="absolute z-10 w-[calc(100%+16px)] max-h-24 text-[17px] font-semibold font-display text-gray-500 border-[1px] border-primary focus:border-gray-400 py-1 px-2 rounded-xl focus:ring-0 focus:outline-none transition resize-none overflow-hidden"
            autoFocus
          />
          : <div
            className={`font-semibold flex-1 leading-[1.1] line-clamp-2 break-all ${isStudio ? "text-[16.5px] text-[#3A3A42]" : "text-[17px] text-gray-700"} ${owner ? 'cursor-pointer hover:text-gray-900' : task.estatus ? 'cursor-pointer hover:text-gray-900' : ''}`}
            onClick={() => {
              if (["/itinerario"].includes(ruta)) {
                owner
                  ? canEdit
                    ? setEditing(true)
                    : null
                  : (task.estatus || task.estatus === null)
                    ? setEditing(true)
                    : null
              } else {
                canEdit
                  ? setEditing(true)
                  : null
              }
            }}
            title={canEdit ? "Haz clic para editar" : "No tienes permisos para editar"}
          >
            {task?.descripcion || t('Sin título')}
          </div>
        }
        {isStudio && subtitle && <div className="truncate" style={{ font: "400 12px Poppins", color: "#8a8a90", marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
  )
}