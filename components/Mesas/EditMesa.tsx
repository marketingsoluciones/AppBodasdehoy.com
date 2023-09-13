import { FC } from "react"
import { EventContextProvider } from "../../context"
import { fetchApiEventos, queries } from "../../utils/Fetching"
import { table, tableOld } from "../../utils/Interfaces"
import { BorrarIcon, EditarIcon, Lock } from "../icons"
import { useToast } from '../../hooks/useToast';


interface propsEditMesa {
  table: table,
  setShowFormEditar: any
  disableDrag: any
}

export const EditMesa: FC<propsEditMesa> = ({ table, setShowFormEditar, disableDrag }) => {
  const toast = useToast()
  const { event, setEvent, planSpaceActive, setPlanSpaceActive } = EventContextProvider()

  const handleDeleteMesa = async () => {
    try {
      const resp: any = await fetchApiEventos({
        query: queries.deleteTable,
        variables: {
          eventID: event._id,
          planSpaceID: planSpaceActive._id,
          tableID: table._id
        }
      })
      const f1 = planSpaceActive.tables.findIndex(elem => elem._id === table._id)
      planSpaceActive.tables.splice(f1, 1)
      setPlanSpaceActive({ ...planSpaceActive })
      setEvent((old) => {
        const f1 = old.planSpace.findIndex(elem => elem._id === old.planSpaceSelect)
        old.planSpace[f1] = planSpaceActive
        return { ...old }
      })
    } catch (error) {
      console.log(error)
    }
  }
  return (
    <div className="w-[20px] absolute transform -translate-x-[30px] -translate-y-[15px] block">
      <button onClick={() => { handleDeleteMesa() }}>
        <BorrarIcon className="text-gray-600 w-4 h-4" />
      </button>
      <button onClick={() => { setShowFormEditar({ table, visible: true }) }}>
        <EditarIcon className="text-gray-600 w-4 h-4" />
      </button>
      <button className={`${disableDrag ? "block" : "hidden"}   `} onClick={() => { toast("error", "Desbloquea el plano para poder mover las mesas ") }}>
        <Lock className="hidden* md:block" />
      </button>
    </div >
  )
}