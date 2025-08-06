import { FC } from 'react';
import BlockDefault from './BlockDefault';
import { AuthContextProvider, EventContextProvider } from '../../context';
import { VscLayoutMenubar } from 'react-icons/vsc';
import { planSpace } from '../../utils/Interfaces';
import { fetchApiBodas, queries } from '../../utils/Fetching';
import { useTranslation } from 'react-i18next';

export const BlockPlanos: FC = () => {
  const { t } = useTranslation();
  const { event } = EventContextProvider()
  const { user, setUser, config } = AuthContextProvider()
  const handleClick = (item: planSpace) => {
    try {
      fetchApiBodas({
        query: queries.updateUser,
        variables: {
          uid: user?.uid,
          variable: "planSpaceSelect",
          valor: item?._id
        },
        development: config?.development
      })
      user.planSpaceSelect = item?._id
      setUser({ ...user })
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <BlockDefault listaLength={event?.planSpace?.length}>
      {event?.planSpace?.map((item, idx) => {
        return (
          <div onClick={() => handleClick(item)} key={idx} className="w-20 h-20 p-2 flex-col justify-center items-center cursor-pointer">
            <div key={idx} className={`${user?.planSpaceSelect === item?._id ? "bg-gray-200" : "bg-none"} rounded-lg flex flex-col w-full h-full transform hover:scale-105 transition justify-center items-center`}>
              <VscLayoutMenubar className={`text-primary w-8 h-8 2xl:w-12 2xl:h-12 `} />
              <span className='text-gray-700 capitalize text-[10px]'> {t(item?.title)}</span>
            </div>
          </div>)
      })
      }
    </BlockDefault>
  )
}
