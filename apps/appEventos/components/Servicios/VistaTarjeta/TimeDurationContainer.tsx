import React, { FC, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Task } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock } from 'lucide-react';
import { DurationTask } from './DurationTask';
import { TimeIndicators } from './TimeIndicators';
import { TimeTask } from './TimeTask';
import { DateTask } from './DateTask';
import { useDateTime } from '../../../hooks/useDateTime';
import { EventContextProvider } from '../../../context';
import { isStudioPathname } from "../../../utils/studioPaths";

interface TimeDurationContainerProps {
  task: Task;
  canEdit: boolean;
  handleUpdate: (field: string, value: any) => Promise<void>;
  owner?: boolean;
}

export const TimeDurationContainer: FC<TimeDurationContainerProps> = ({ task, canEdit, handleUpdate, owner }) => {
  const { t } = useTranslation();
  const { event } = EventContextProvider();
  const [editingDate, setEditingDate] = useState(false);
  const [editingStartTime, setEditingStartTime] = useState(false);
  const [editingEndTime, setEditingEndTime] = useState(false);
  const { dateTimeFormated } = useDateTime();
  const ruta = usePathname();
  // Rediseño studio (gate ?studio, default ON): solo /itinerario. Fiel a
  // tarjetatareaitinerario.html (.horario: fecha-linea + grilla Inicio/Final/Duración con dots).
  const isStudio = typeof window !== "undefined"
    && isStudioPathname(window.location.pathname)
    && new URLSearchParams(window.location.search).get("studio") !== "legacy";

  const ValidationEdit = useMemo(() => {
    if (["/itinerario"].includes(ruta)) {
      if (owner) {
        return true;
      } else {
        if (task.estatus || task.estatus === null) {
          if (canEdit) {
            return true;
          } else {
            return false;
          }
        }
        return false;
      }
    } else {
      return true;
    }
  }, [ruta, owner, task.estatus, canEdit]);


  if (!task.fecha) {
    return null;
  }

  if (isStudio) {
    const chipStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 7, background: "#fff", border: "1px solid #ececef", borderRadius: 9, padding: "5px 10px" };
    const lblStyle: React.CSSProperties = { font: "500 12px Poppins", color: "#8a8a90", flex: "none" };
    const dotStyle = (bg: string): React.CSSProperties => ({ width: 8, height: 8, borderRadius: "50%", flex: "none", background: bg });
    return (
      <div style={{ background: "#fafafa", borderRadius: 12, padding: "8px 10px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={chipStyle}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8a8a90" strokeWidth={1.8} strokeLinecap="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>
          <span style={lblStyle}>{t('Fecha')}</span>
          <DateTask handleUpdate={handleUpdate} canEdit={canEdit} task={task} setEditing={setEditingDate} editing={editingDate} uso="itinerary" ValidationEdit={ValidationEdit} />
        </div>
        <div style={chipStyle}>
          <span style={dotStyle("#2FB37E")} />
          <span style={lblStyle}>{t('Inicio')}</span>
          <TimeTask handleUpdate={handleUpdate} canEdit={canEdit} task={task} setEditing={setEditingStartTime} editing={editingStartTime} uso="startTime" ValidationEdit={ValidationEdit} />
        </div>
        <div style={chipStyle}>
          <span style={dotStyle("#D83E7C")} />
          <span style={lblStyle}>{t('Final')}</span>
          <TimeTask handleUpdate={() => Promise.resolve()} canEdit={canEdit} task={task} setEditing={setEditingEndTime} editing={editingEndTime} uso="endTime" ValidationEdit={ValidationEdit} />
        </div>
        <div style={chipStyle}>
          <span style={dotStyle("#8a8a90")} />
          <span style={lblStyle}>{t('Duración')}</span>
          <DurationTask handleUpdate={handleUpdate} canEdit={canEdit} task={task} ValidationEdit={ValidationEdit} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 justify-start bg-gray-50 rounded-lg py-2 relative group">
      {/* Indicadores de Hora */}
      <div className="flex flex-col space-x-2  w-[170px] md:w-[34%] ">
        <div className="flex items-center space-x-2 ml-[23px]">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-500">{t('Fecha')}</span>
          <DateTask
            handleUpdate={handleUpdate}
            canEdit={canEdit}
            task={task}
            setEditing={setEditingDate}
            editing={editingDate}
            uso="itinerary"
            ValidationEdit={ValidationEdit}
          />
        </div>
        <TimeIndicators
          task={task}
          canEdit={canEdit}
          handleUpdate={handleUpdate}
          setEditingStartTime={setEditingStartTime}
          editingStartTime={editingStartTime}
          setEditingEndTime={setEditingEndTime}
          editingEndTime={editingEndTime}
          ValidationEdit={ValidationEdit}
        />
      </div>

      {/* Duración */}
      <div className="flex items-center space-x-3 translate-y-2 ">
        <Clock className="w-5 h-5 text-blue-600" />
        <div className="flex flex-col items-center space-x-2">
          <span className="text-xs text-gray-500">{t('Duración')}</span>
          <DurationTask
            handleUpdate={handleUpdate}
            canEdit={canEdit}
            task={task}
            ValidationEdit={ValidationEdit}
          />
        </div>
      </div>
      {task.fecha && <div className={`hidden absolute bottom-full left-6 transform -translate-y-1/4 mb-2 px-2 py-1 bg-gray-900 text-white text-[11px] rounded opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:delay-300 whitespace-nowrap z-10 md:flex flex-col ${editingDate || editingStartTime || editingEndTime ? "hidden" : ""}`}>
        <span className='font-bold text-yellow-500'>{dateTimeFormated(task.fecha, event?.timeZone)}</span>
        <span className='text-gray-100'>{dateTimeFormated(task.fecha, "UTC")}</span>
        <span className='text-gray-100'>{dateTimeFormated(task.fecha, Intl.DateTimeFormat().resolvedOptions().timeZone)} {`(${t("hora local")})`}</span>
      </div>}

    </div>
  );
};
