import React, { FC } from 'react';
import { Task } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';
import { Interweave } from "interweave";
import { HashtagMatcher, UrlMatcher } from "interweave-autolink";
import { useDateTime } from '../../../hooks/useDateTime';
import { EventContextProvider } from '../../../context';
import { SelectIconNew } from '../Utils/SelectIconNew';

interface TaskSchemaViewProps {
  task: Task;
  canEdit: boolean;
  ht: () => void;
  handleUpdate: (field: string, value: any) => Promise<void>;
}

export const TaskSchemaView: FC<TaskSchemaViewProps> = ({ task, canEdit, ht, handleUpdate, ...props }) => {
  const { t } = useTranslation();
  const { timeFormated } = useDateTime()
  const { event } = EventContextProvider()

  const handleIconChange = (newIcon: string) => {
    if (!canEdit) {
      ht();
      return;
    }
    handleUpdate('icon', newIcon);
  };

  return (
    task.spectatorView && (
      <div {...props} className="w-full flex">
        <div className="flex w-[55%] md:w-[45%] lg:w-[40%] p-2 items-start justify-start border-t-[1px] border-r-[1px] border-primary border-dotted relative">
          <div className="w-12 h-12 md:w-16 md:h-16 md:min-w-16 flex items-center justify-center">
            <SelectIconNew
              owner={canEdit}
              handleChange={(value) => {
                handleIconChange(value);
              }}
              task={task}
            />
          </div>
          <div className="flex-1">
            <div className="inline-flex flex-col justify-start items-start">
              <span className="text-xl md:text-2xl text-gray-900">
                {task.fecha
                  ? timeFormated(task.fecha, event?.timeZone)
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
    )
  );
};

