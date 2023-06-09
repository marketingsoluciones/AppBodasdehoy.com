import { FC } from "react"
import { EventContextProvider } from "../../context"
import { fetchApiEventos, queries } from "../../utils/Fetching"
import { table } from "../../utils/Interfaces"
import { BorrarIcon, EditarIcon } from "../icons"
import { useToast } from '../../hooks/useToast';


interface propsEditMesa {
  mesa: table,
  setShowFormEditar: any
  disableDrag: any
}

export const EditMesa: FC<propsEditMesa> = ({ mesa, setShowFormEditar ,disableDrag }) => {
  const toast = useToast()
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
    <div className="w-[20px] absolute transform -translate-x-[30px] -translate-y-[15px] block">
      <button onClick={() => { handleDeleteMesa() }}>
        <BorrarIcon className="text-gray-600 w-4 h-4" />
      </button>
      <button onClick={() => { setShowFormEditar({ mesa: mesa, visible: true }) }}>
        <EditarIcon className="text-gray-600 w-4 h-4" />
      </button>
      <button className={`${disableDrag?"block":"hidden"}  `} onClick={()=>{toast("error","Desbloquea las mesas para poder reubicarlas ")}}>
      {/* <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-sky-400 opacity-75"></span>
      <span className="absolute inline-flex rounded-full h-1.5 w-1.5 bg-sky-500"></span> */}
        <img src="advertencia.png" alt="alert"  className="text-gray-600 w-4 h-4 "/>
      </button>
    </div >
  )
}