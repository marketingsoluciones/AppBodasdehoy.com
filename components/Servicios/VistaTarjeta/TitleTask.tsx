import { FC, useState } from "react";
import { PermissionWrapper } from './TaskNewComponents';
import { NewSelectIcon } from "../VistaTabla/NewSelectIcon";
import { Field, Form, Formik } from "formik";
import { useTranslation } from "react-i18next";
import { SelectIcon } from "../Utils/SelectIcon";
import { Task } from "../../../utils/Interfaces";

interface Props {
  canEdit: boolean;
  ht: () => void;
  handleUpdate: (field: string, value: any) => Promise<void>;
  task: Task;
}

export const TitleTask: FC<Props> = ({ canEdit, ht, handleUpdate, task }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState<string>(task.descripcion);
  const [editing, setEditing] = useState<boolean>(false);
  const [showIconSelector, setShowIconSelector] = useState<boolean>(false);
  const [tempIcon, setTempIcon] = useState<string>(task.icon);

  const handleIconChange = (newIcon: string) => {
    if (!canEdit) {
      ht();
      return;
    }
    setTempIcon(newIcon);
    handleUpdate('icon', newIcon);
    setShowIconSelector(false);
  };

  return (
    <div className="flex items-center space-x-2 flex-1">
      <PermissionWrapper hasPermission={canEdit}>
        <div className="flex items-center justify-center">
          {showIconSelector
            ? <NewSelectIcon
              value={tempIcon}
              onChange={handleIconChange}
              onClose={() => setShowIconSelector(false)}
            />
            : <button
              onClick={() => canEdit ? setShowIconSelector(true) : ht()}
              className={`w-12 h-11 flex items-center justify-center rounded-full transition-colors ${canEdit ? 'hover:bg-gray-100 cursor-pointer' : 'opacity-60 cursor-not-allowed'
                }`}
              title={canEdit ? "Cambiar ícono" : "No tienes permisos para editar"}
            >
              <Formik
                initialValues={{ icon: tempIcon }}
                onSubmit={(values) => {
                  handleIconChange(values.icon);
                }}
              >
                {({ setFieldValue }) => (
                  <Form>
                    <Field name="icon">
                      {({ field }) => (
                        <SelectIcon
                          {...field}
                          name="icon"
                          value={field.value || tempIcon}
                          className="w-8 h-8"
                          handleChange={(value) => {
                            setFieldValue('icon', value);
                            handleIconChange(value);
                          }}
                          data={task}
                        />
                      )}
                    </Field>
                  </Form>
                )}
              </Formik>
            </button>
          }
        </div>
      </PermissionWrapper>
      <div className="flex-1 h-10 relative flex items-center">
        {editing
          ? <textarea
            id="descripcion"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={(e) => {
              handleUpdate('descripcion', e.currentTarget.value);
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
            className="absolute z-10 w-full h-24 text-[17px] font-semibold font-display text-gray-500 border-[1px] border-primary focus:border-gray-400 py-1 px-2 rounded-xl focus:ring-0 focus:outline-none transition"
            autoFocus
          />
          : <div
            className={`text-[17px] font-semibold flex-1 leading-[1.1] line-clamp-2 text-gray-700 ${canEdit ? 'cursor-pointer hover:text-gray-900' : 'cursor-default opacity-80'
              }`}
            onClick={() => canEdit ? setEditing(true) : ht()}
            title={canEdit ? "Haz clic para editar" : "No tienes permisos para editar"}
          >
            {task.descripcion || t('Sin título')}
          </div>
        }
      </div>
    </div>
  )
}