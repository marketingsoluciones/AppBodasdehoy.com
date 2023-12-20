import { FC } from 'react';
import BlockDefault from './BlockDefault';
import { EventContextProvider } from '../../context';
import { VscLayoutMenubar } from 'react-icons/vsc';
import { planSpace } from '../../utils/Interfaces';
import { fetchApiEventos, queries } from '../../utils/Fetching';

interface propsBlockPlanos {

}

const BlockPlanos: FC<propsBlockPlanos> = () => {
  const { event, setEvent } = EventContextProvider()
  const handleClick = (item: planSpace) => {
    try {
      fetchApiEventos({
        query: queries.eventUpdate,
        variables: { idEvento: event?._id, variable: "planSpaceSelect", value: item?._id }, token: null
      })
      setEvent({ ...event, planSpaceSelect: item._id })
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <BlockDefault> 
      {event?.planSpace?.map((item, idx) => {
        return (
          <div onClick={() => handleClick(item)} key={idx} className="w-full h-full p-2 flex-col justify-center items-center cursor-pointer">
            <div key={idx} className={`${event?.planSpaceSelect === item?._id ? "bg-gray-200" : "bg-none"} rounded-lg flex flex-col w-full h-full transform hover:scale-105 transition justify-center items-center`}>

              <VscLayoutMenubar className={`text-primary w-8 h-8 2xl:w-12 2xl:h-12 `} />
              <span className='text-gray-700'> {item?.title}</span>

            </div>
          </div>)
      })
      }
    </BlockDefault>
  )
}

export default BlockPlanos