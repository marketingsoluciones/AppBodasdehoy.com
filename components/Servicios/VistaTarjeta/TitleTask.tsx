import { FC } from "react";
import { PermissionWrapper } from './TaskNewComponents';
import { NewSelectIcon } from "../VistaTabla/NewSelectIcon";
import { Field, Form, Formik } from "formik";
import { useTranslation } from "react-i18next";
import { SelectIcon } from "../Utils/SelectIcon";

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
  localTask: any;
}

export const TitleTask: FC<Props> = ({ canEdit, showIconSelector, setShowIconSelector, handleIconChange, ht, setTempValue, handleFieldSave, handleKeyPress, handleFieldClick, editingField, tempValue, tempIcon, localTask }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center space-x-4 flex-1">
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
                          data={localTask}
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
      {editingField === 'descripcion'
        ? <input
          type="text"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={() => handleFieldSave('descripcion')}
          onKeyDown={(e) => handleKeyPress(e, 'descripcion')}
          className="text-2xl font-semibold px-2 py-1 border-b-2 border-primary focus:outline-none flex-1"
          autoFocus
        />
        : <div
          className={`text-xl font-semibold flex-1 ${canEdit ? 'cursor-pointer hover:text-gray-700' : 'cursor-default opacity-80'
            }`}
          onClick={() => canEdit ? handleFieldClick('descripcion', localTask.descripcion) : ht()}
          title={canEdit ? "Haz clic para editar" : "No tienes permisos para editar"}
        >
          {localTask.descripcion || t('Sin título')}
        </div>
      }
    </div>
  )
}