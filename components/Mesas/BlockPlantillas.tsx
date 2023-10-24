import { FC } from 'react';
import BlockDefault from './BlockDefault';
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from '../../context';
import { VscLayoutMenubar } from 'react-icons/vsc';
import { planSpace } from '../../utils/Interfaces';
import { fetchApiEventos, queries } from '../../utils/Fetching';
import { ImInsertTemplate } from 'react-icons/im';


interface propsBlockPlatillas {

}

const BlockPlantillas: FC<propsBlockPlatillas> = () => {
  const { user } = AuthContextProvider()
  const { event, setEvent } = EventContextProvider()
  const { psTemplates } = EventsGroupContextProvider()
  console.log(psTemplates)
  const handleClick = (item: planSpace) => {
    try {
      fetchApiEventos({
        query: queries.getPsTemplate,
        variables: { uid: user.uid }
      })
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <BlockDefault>
      {psTemplates?.map((item, idx) => {
        return (
          <div onClick={() => handleClick(item)} key={idx} className="w-full h-full p-2 flex-col justify-center items-center cursor-pointer">
            <div key={idx} className={`rounded-lg flex w-full h-full transform hover:scale-105 transition justify-start gap-2`}>
              <ImInsertTemplate className={`text-primary w-5 h-5 2xl:w-12 2xl:h-12 `} />
              <span className='w-[calc(100%-44px)] truncate'> {item?.title}</span>
            </div>
          </div>)
      })
      }
    </BlockDefault>
  )
}

export default BlockPlantillas