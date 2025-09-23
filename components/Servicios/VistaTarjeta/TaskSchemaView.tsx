import React, { FC, useEffect, useState } from 'react';
import { Formik, Form, Field } from 'formik';

import { Task, Itinerary } from '../../../utils/Interfaces';
import { formatTime } from './TaskNewUtils';
import { useTranslation } from 'react-i18next';
import { Interweave } from "interweave";
import { HashtagMatcher, UrlMatcher } from "interweave-autolink";
import { useDateTime } from '../../../hooks/useDateTime';
import { EventContextProvider } from '../../../context';

interface TaskSchemaViewProps {
  task: Task;
  canEdit: boolean;
  ht: () => void;
  handleUpdate: (field: string, value: any) => Promise<void>;
}

export const TaskSchemaView: FC<TaskSchemaViewProps> = ({ task, canEdit, ht, handleUpdate, ...props }) => {
  const { t } = useTranslation();
  const [showIconSelector, setShowIconSelector] = useState<boolean>(false);
  const [tempIcon, setTempIcon] = useState<string>(task.icon);
  const { is12HourFormat, dateTimeFormated } = useDateTime()
  const { event } = EventContextProvider()

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
    <>
      {task.spectatorView && (
        <div {...props} className="w-full flex">
          <div className="flex w-[55%] md:w-[45%] lg:w-[40%] p-2 items-start justify-start border-t-[1px] border-r-[1px] border-primary border-dotted relative">
            <div className="w-12 h-12 md:w-16 md:h-16 md:min-w-16 flex items-center justify-center">
              {showIconSelector ? (
                <NewSelectIcon
                  value={tempIcon}
                  onChange={handleIconChange}
                  onClose={() => setShowIconSelector(false)}
                />
              ) : (
                <button
                  onClick={() => canEdit ? setShowIconSelector(true) : ht()}
                  className={`w-full h-full flex items-center justify-center rounded-full transition-colors ${canEdit ? 'hover:bg-gray-100 cursor-pointer' : 'opacity-60 cursor-not-allowed'
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
              )}
            </div>
            <div className="flex-1">
              <div className="inline-flex flex-col justify-start items-start">
                <span className="text-xl md:text-2xl text-gray-900">
                  {task.fecha
                    ? is12HourFormat()
                      ? dateTimeFormated(task.fecha, event?.timeZone).slice(11, 24)
                      : dateTimeFormated(task.fecha, event?.timeZone).slice(11, 17)
                    : '00:00'
                  }
                </span>
                <div className="w-full flex justify-end items-end text-xs -mt-1">
                  <span>{t("duration")}</span>
                  <span className="text-[12px] md:text-[14px] lg:text-[16px] text-center bg-transparent px-1">
                    {task.duracion}
                  </span>
                  <span>min</span>
                </div>
              </div>
              <div className="flex items-start space-x-2 font-title text-primary text-2xl">
                <div className="min-w-2 h-2 bg-primary rounded-full translate-y-2.5" />
                <strong className="leading-[1] mt-1">{task.descripcion}</strong>
              </div>
              <div className="grid grid-flow-dense w-full space-x-2 text-[12px] mt-2">
                <p>
                  {t("responsible")}: {task.responsable.join(", ")}
                </p>
              </div>
            </div>
            <div className="bg-white w-3 h-3 rounded-full border-[1px] border-primary border-dotted absolute right-0 top-0 translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="flex-1 flex flex-col px-4 md:px-0 border-primary border-dotted w-[10%] md:w-[50%] border-t-[1px]">
            {!!task.tips && (
              <Interweave
                className="md:text-xs text-sm text-justify transition-all m-1 p-1 break-words"
                content={task.tips}
                matchers={[new UrlMatcher('url'), new HashtagMatcher('hashtag')]}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

// Importar NewSelectIcon del archivo original
import { NewSelectIcon } from '../VistaTabla/NewSelectIcon';
import { SelectIcon } from '../Utils/SelectIcon';
