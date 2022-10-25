import { FC } from "react"
import { EventContextProvider } from "../../context"
import { fetchApiEventos, queries } from "../../utils/Fetching"
import { table } from "../../utils/Interfaces"
import { BorrarIcon, EditarIcon } from "../icons"


interface propsEditMesa {
  mesa: table,
  setShowFormEditar: any
}

export const EditMesa: FC<propsEditMesa> = ({ mesa, setShowFormEditar }) => {
  const { event, setEvent } = EventContextProvider()
  const handleDeleteMesa = async () => {
    const { mesas_array }: any = await fetchApiEventos({
      query: queries.deleteTable,
      variables: {
        eventID: event._id,
        tableID: mesa._id,
      }
    })
    setEvent((old) => ({ ...old, mesas_array }))
  }
  return (
    <div className="w-[20px] absolute transform -translate-x-[25px] -translate-y-[15px] block">
      <button onClick={() => { handleDeleteMesa() }}>
        <BorrarIcon className="text-gray-600 w-4 h-4" />
      </button>
      <button onClick={() => { setShowFormEditar({ mesa: mesa, visible: true }) }}>
        <EditarIcon className="text-gray-600 w-4 h-4" />
      </button>
    </div >
  )
}