import { FC } from 'react';
import { AuthContextProvider, EventContextProvider } from '../../context';
import { HiTemplate } from 'react-icons/hi';
import { planSpace } from '../../utils/Interfaces';
import { fetchApiEventos, queries } from '../../utils/Fetching';
import { useTranslation } from 'react-i18next';

// Rediseño fiel al prototipo (MESAS.dc.html): lista vertical "Espacios del evento".
// Fila = icono en cuadrado + nombre + nº de mesas + check del espacio activo.
// NO cambia la lógica de selección (setPlanSpaceSelect + fetchApiEventos).
export const BlockPlanos: FC = () => {
  const { t } = useTranslation();
  const { event, planSpaceSelect, setPlanSpaceSelect } = EventContextProvider()
  const { user } = AuthContextProvider()
  const handleClick = (item: planSpace) => {
    try {
      setPlanSpaceSelect(item?._id)
      fetchApiEventos({
        query: queries.setPlanSpaceSelect,
        variables: {
          evento_id: event?._id,
          planSpaceSelect: item?._id,
          isOwner: user?.uid === event?.usuario_id,
        },
      })
    } catch {
    }
  }
  return (
    <div className="w-full h-full overflow-auto flex flex-col gap-2.5 p-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider uppercase text-[#b3b3ba]">{t("eventspaces") || "Espacios del evento"}</span>
        <span className="text-[11px] font-semibold text-[#EF5B94]">{event?.planSpace?.length}</span>
      </div>
      <div className="flex flex-col gap-[7px]">
        {event?.planSpace?.map((item, idx) => {
          const active = planSpaceSelect === item?._id
          return (
            <div
              key={idx}
              onClick={() => handleClick(item)}
              className={`flex items-center gap-[11px] px-3 py-2.5 rounded-[11px] cursor-pointer border transition ${active ? "bg-[#FCF2F6] border-[#f7c2da]" : "bg-white border-[#f0f0f2] hover:border-[#e2e2e6]"}`}
            >
              <div className={`w-[30px] h-[30px] rounded-[9px] flex-none flex items-center justify-center ${active ? "bg-[#EF5B94] text-white" : "bg-[#f0f0f2] text-[#a0a0a8]"}`}>
                <HiTemplate className="w-[17px] h-[17px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold text-[#3A3A42] truncate capitalize">{t(item?.title)}</div>
                <div className="text-[10.5px] font-medium text-[#a0a0a8]">{item?.tables?.length || 0} {(t("table") || "mesas").toLowerCase()}</div>
              </div>
              {active &&
                <div className="w-[18px] h-[18px] rounded-full flex-none bg-[#EF5B94] text-white flex items-center justify-center text-[11px] font-bold">✓</div>
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}
