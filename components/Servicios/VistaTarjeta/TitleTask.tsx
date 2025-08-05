import { FC, useState, useRef, useEffect } from "react";
import { PermissionWrapper } from './TaskNewComponents';
import { NewSelectIcon } from "../VistaTabla/NewSelectIcon";
import { Field, Form, Formik } from "formik";
import { useTranslation } from "react-i18next";
import { SelectIconNew } from "../Utils/SelectIconNew";
import { Task } from "../../../utils/Interfaces";
import { init } from "react-facebook-pixel";

interface TitleTaskProps {
  canEdit: boolean;
  handleUpdate: (field: string, value: any) => Promise<void>;
  task: Task;
}

export const TitleTask: FC<TitleTaskProps> = ({ canEdit, handleUpdate, task }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState<string>();
  const [editing, setEditing] = useState<boolean>(false);
  const [tempIcon, setTempIcon] = useState<string>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setValue(null);
    setTempIcon(null);
  }, [task, task?.icon])

  const handleIconChange = (newIcon: string) => {
    if (!canEdit) {
      null;
      return;
    }
    setTempIcon(newIcon);
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
    <div className="flex h-[44px] items-center space-x-2 flex-1">
      <div className="flex items-center justify-center">
        <div className={`w-11 h-11 flex items-center justify-center rounded-full transition-colors`}
          title={canEdit && "Cambiar ícono"} >
          <SelectIconNew
            task={task}
            value={tempIcon ? tempIcon : task?.icon}
            className="w-8 h-8"
            handleChange={(value) => {
              handleIconChange(value);
            }}
            data={task}
          />
        </div>
      </div>
      <div className="flex-1 h-10 relative flex items-center">
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
            className={`text-[17px] font-semibold flex-1 leading-[1.1] line-clamp-2 break-all text-gray-700 ${task.estatus ? 'cursor-pointer hover:text-gray-900' : ''
              }`}
            onClick={() => {
              task.estatus ?
                canEdit
                  ? setEditing(true)
                  : null
                : null
            }}
            title={canEdit ? "Haz clic para editar" : "No tienes permisos para editar"}
          >
            {task?.descripcion || t('Sin título')}
          </div>
        }
      </div>
    </div>
  )
}