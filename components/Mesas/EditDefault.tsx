import { FC } from "react"
import { EventContextProvider } from "../../context"
import { fetchApiEventos, queries } from "../../utils/Fetching"
import { EditDefaultState } from "../../utils/Interfaces"
import { BorrarIcon, EditarIcon } from "../icons"

import { MdRotateRight, MdRotateLeft } from 'react-icons/md'
import { useAllowed } from "../../hooks/useAllowed"


export const EditDefault: FC<EditDefaultState> = ({ item, setShowFormEditar, itemTipo }) => {
  const { event, setEvent, planSpaceActive, setPlanSpaceActive, editDefault, setEditDefault } = EventContextProvider()
  const [isAllowed, ht] = useAllowed()

  const handleDeleteItem = async () => {
    try {
      setEditDefault({})
      const f1 = planSpaceActive[`${itemTipo}s`].findIndex(elem => elem._id === item._id)
      planSpaceActive[`${itemTipo}s`].splice(f1, 1)
      setPlanSpaceActive({ ...planSpaceActive })
      setEvent((old) => {
        const f1 = old.planSpace.findIndex(elem => elem._id === old.planSpaceSelect)
        old.planSpace[f1] = planSpaceActive
        return { ...old }
      })
      if (itemTipo == "table") {
        await fetchApiEventos({
          query: queries.deleteTable,
          variables: {
            eventID: event._id,
            planSpaceID: planSpaceActive._id,
            tableID: item._id
          }
        })
      }
      if (itemTipo == "element") {
        await fetchApiEventos({
          query: queries.deleteElement,
          variables: {
            eventID: event._id,
            planSpaceID: planSpaceActive._id,
            elementID: item._id
          }
        })
      }
    } catch (error) {
      console.log(error)
    }
  }
  const handleRotate = async (direcction) => {
    if (item?.rotation == 0 && direcction === "left") {
      item.rotation = 360 - 15
    } else {
      item.rotation = item.rotation + (direcction === "left" ? -15 : 15)
      if (item?.rotation === 360) {
        item.rotation = 0
      }
    }
    const f1 = planSpaceActive[`${itemTipo}s`].findIndex(elem => elem._id === item._id)
    planSpaceActive[`${itemTipo}s`][f1].rotation = item?.rotation
    setPlanSpaceActive({ ...planSpaceActive })
    setEvent((old) => {
      const f1 = old.planSpace.findIndex(elem => elem._id === old.planSpaceSelect)
      old.planSpace[f1] = planSpaceActive
      return { ...old }
    })
    if (itemTipo === "table") {
      await fetchApiEventos({
        query: queries.editTable,
        variables: {
          eventID: event._id,
          planSpaceID: planSpaceActive?._id,
          tableID: item._id,
          variable: "rotation",
          valor: JSON.stringify(item?.rotation)
        }
      })
    }
    if (itemTipo === "element") {
      await fetchApiEventos({
        query: queries.editElement,
        variables: {
          eventID: event._id,
          planSpaceID: planSpaceActive?._id,
          elementID: item._id,
          variable: "rotation",
          valor: JSON.stringify(item?.rotation)
        }
      })
    }
  }

  return (
    <div className="bg-transparent absolute w-full h-full flex flex-col items-center justify-between py-3" >
      <button disabled={!isAllowed()} onClick={handleDeleteItem} className="bg-white border border-primary rounded-md w-7 h-7 flex items-center justify-center">
        <BorrarIcon className="text-gray-600 w-4 h-4" />
      </button>
      <button onClick={() => {
        setEditDefault({ ...editDefault, activeButtons: false })
        setShowFormEditar({ table: item, visible: true })
      }}
        className={`bg-white border border-primary rounded-md w-7 h-7 flex items-center justify-center`}
        disabled={!isAllowed() || itemTipo === "element"}>
        <EditarIcon className={`${itemTipo === "table" ? "text-gray-600" : "text-gray-300"} w-5 h-5`} />
      </button>
      <button disabled={!isAllowed()} onClick={() => { handleRotate("right") }} className="bg-white border border-primary rounded-md w-7 h-7 flex items-center justify-center">
        <MdRotateRight className="text-gray-600 w-5 h-5" />
      </button>
      <button disabled={!isAllowed()} onClick={() => { handleRotate("left") }} className="bg-white border border-primary rounded-md w-7 h-7 flex items-center justify-center">
        <MdRotateLeft className="text-gray-600 w-5 h-5" />
      </button>
    </div>
  )
}

