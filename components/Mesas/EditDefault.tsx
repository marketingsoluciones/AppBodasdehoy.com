import { FC } from "react"
import { EventContextProvider } from "../../context"
import { fetchApiEventos, queries } from "../../utils/Fetching"
import { table, tableOld } from "../../utils/Interfaces"
import { BorrarIcon, EditarIcon, Lock } from "../icons"
import { useToast } from '../../hooks/useToast';
import { MdRotateRight } from 'react-icons/md'
import { PiArrowsHorizontalDuotone } from 'react-icons/pi'
import { MdSettings } from 'react-icons/md'

interface propsEditDefault {
  item: table
  itemTipo: string
  setShowFormEditar: any
  disableDrag: any
  setDisableClickAwayListener: any
}

export const EditDefaul: FC<propsEditDefault> = ({ item, setShowFormEditar, disableDrag, setDisableClickAwayListener, itemTipo }) => {
  const toast = useToast()
  const { event, setEvent, planSpaceActive, setPlanSpaceActive } = EventContextProvider()

  const handleDeleteItem = async () => {
    console.log("aqui", itemTipo)
    try {
      if (itemTipo == "table") {
        const resp: any = await fetchApiEventos({
          query: queries.deleteTable,
          variables: {
            eventID: event._id,
            planSpaceID: planSpaceActive._id,
            tableID: item._id
          }
        })
        const f1 = planSpaceActive.tables.findIndex(elem => elem._id === item._id)
        planSpaceActive.tables.splice(f1, 1)
        setPlanSpaceActive({ ...planSpaceActive })
        setEvent((old) => {
          const f1 = old.planSpace.findIndex(elem => elem._id === old.planSpaceSelect)
          old.planSpace[f1] = planSpaceActive
          return { ...old }
        })
      }
    } catch (error) {
      console.log(error)
    }
  }
  return (
    <div className="">
      <div className="block w-[20px] absolute transform -translate-x-[36px] -translate-y-[15px]">
        <button onClick={handleDeleteItem}>
          <BorrarIcon className="text-gray-600 w-4 h-4" />
        </button>
        <button onClick={() => {
          setDisableClickAwayListener(true)
          setShowFormEditar({ table: item, visible: true })
        }}>
          <EditarIcon className="text-gray-600 w-4 h-4" />
        </button>
        <button className={``} onClick={() => { }}>
          <MdSettings className="text-gray-600 w-4 h-4" />
        </button>
      </div >
      <div className="hidden md:block absolute transform -translate-x-1/2 -translate-y-[30px]  left-[50%]">
        <button onClick={handleDeleteItem} className="bg-white border rounded-full">
          <MdRotateRight className="text-gray-600 w-4 h-4" />
        </button>
      </div >
      <div className="hidden md:block absolute transform -translate-y-1/2 right-0 translate-x-[30px]  top-[50%]">
        <button onClick={handleDeleteItem} className="bg-white border rounded-full">
          <PiArrowsHorizontalDuotone className="text-gray-600 w-4 h-4" />
        </button>
      </div >
    </div>
  )
}