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
    } catch (error) {
      console.log(error)
    }
  }
  return (
    <BlockDefault listaLength={event?.planSpace?.length}>
      {event?.planSpace?.map((item, idx) => {
        return (
          <div onClick={() => handleClick(item)} key={idx} className="w-20 h-20 p-2 flex-col justify-center items-center cursor-pointer">
            <div key={idx} className={`${planSpaceSelect === item?._id ? "bg-gray-200" : "bg-none"} rounded-lg flex flex-col w-full h-full transform hover:scale-105 transition justify-center items-center`}>
              <VscLayoutMenubar className={`text-primary w-8 h-8 2xl:w-12 2xl:h-12 `} />
              <span className='text-gray-700 capitalize text-[10px]'> {t(item?.title)}</span>
            </div>
          </div>)
      })
      }
    </BlockDefault>
  )
}
