import { FC } from "react";
import { PermissionWrapper } from './TaskNewComponents';
import { NewSelectIcon } from "../VistaTabla/NewSelectIcon";
import { Field, Form, Formik } from "formik";
import { useTranslation } from "react-i18next";
import { SelectIcon } from "../Utils/SelectIcon";
import { Task } from "../../../utils/Interfaces";

interface Props {
  canEdit: boolean;
  showIconSelector: boolean;
  setShowIconSelector: (show: boolean) => void;
  handleIconChange: (icon: string) => void;
  ht: () => void;
  setTempValue: (value: string) => void;
  handleFieldSave: (field: string) => void;
  handleKeyPress: (e: React.KeyboardEvent, field: string) => void;
  handleFieldClick: (field: string, value: any) => void;
  editingField: string | null;
  tempValue: string;
  tempIcon: string;
  task: Task;
}

export const TitleTask: FC<Props> = ({ canEdit, showIconSelector, setShowIconSelector, handleIconChange, ht, setTempValue, handleFieldSave, handleKeyPress, handleFieldClick, editingField, tempValue, tempIcon, task }) => {
  const { t } = useTranslation();
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
        {editingField === 'descripcion'
          ? <textarea
            id="descripcion"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={() => handleFieldSave('descripcion')}
            onKeyDown={(e) => handleKeyPress(e, 'descripcion')}
            onPaste={(e) => {
              e.preventDefault();
              const pastedText = e.clipboardData.getData('text/plain');
              const cleanText = pastedText.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
              setTempValue(cleanText);
            }}
            className="absolute z-10 w-full h-24 text-[17px] font-semibold font-display text-gray-500 border-[1px] border-primary focus:border-gray-400 py-1 px-2 rounded-xl focus:ring-0 focus:outline-none transition"
            autoFocus
          />
          : <div
            className={`text-[17px] font-semibold flex-1 leading-[1.1] line-clamp-2 text-gray-700 ${canEdit ? 'cursor-pointer hover:text-gray-900' : 'cursor-default opacity-80'
              }`}
            onClick={() => canEdit ? handleFieldClick('descripcion', task.descripcion) : ht()}
            title={canEdit ? "Haz clic para editar" : "No tienes permisos para editar"}
          >
            {task.descripcion || t('Sin título')}
          </div>
        }
      </div>
    </div>
  )
}