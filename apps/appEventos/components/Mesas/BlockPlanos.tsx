import { FC } from 'react';
import BlockDefault from './BlockDefault';
import { AuthContextProvider, EventContextProvider } from '../../context';
import { VscLayoutMenubar } from 'react-icons/vsc';
import { planSpace } from '../../utils/Interfaces';
import { fetchApiEventos, queries } from '../../utils/Fetching';
import { useTranslation } from 'react-i18next';

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
    <BlockDefault listaLength={event?.planSpace?.length}>
      {event?.planSpace?.map((item, idx) => {
        const active = planSpaceSelect === item?._id
        return (
          <div onClick={() => handleClick(item)} key={idx} className="w-20 h-20 p-1 cursor-pointer">
            <div key={idx} className={`rounded-xl border flex flex-col gap-1 w-full h-full transform hover:scale-105 transition justify-center items-center ${active ? "border-primary bg-primary/5 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"}`}>
              <VscLayoutMenubar className={`w-7 h-7 2xl:w-9 2xl:h-9 ${active ? "text-primary" : "text-gray-400"}`} />
              <span className={`capitalize text-[10px] leading-none truncate max-w-full px-1 ${active ? "text-primary font-medium" : "text-gray-500"}`}>{t(item?.title)}</span>
            </div>
          </div>)
      })
      }
    </BlockDefault>
  )
}
